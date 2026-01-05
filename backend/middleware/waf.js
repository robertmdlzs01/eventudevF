const { securityMonitoringService } = require('../services/securityMonitoringService');
// const { threatIntelligenceService } = require('../services/threatIntelligenceService'); // Servicio eliminado

/**
 * Web Application Firewall (WAF) Middleware
 */
class WAF {
  constructor() {
    this.blockedIPs = new Set();
    this.suspiciousIPs = new Map();
    this.rateLimitStore = new Map();
    
    // Patrones de ataque conocidos
    this.attackPatterns = {
      sqlInjection: [
        /union\s+select/i,
        /drop\s+table/i,
        /delete\s+from/i,
        /insert\s+into/i,
        /update\s+set/i,
        /or\s+1\s*=\s*1/i,
        /';\s*drop/i,
        /--\s*$/i,
        /\/\*.*\*\//i,
        /exec\s*\(/i,
        /sp_executesql/i,
        /xp_cmdshell/i
      ],
      xss: [
        /<script[^>]*>.*?<\/script>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe[^>]*>/i,
        /<object[^>]*>/i,
        /<embed[^>]*>/i,
        /<link[^>]*>/i,
        /<meta[^>]*>/i,
        /<style[^>]*>.*?<\/style>/i,
        /expression\s*\(/i,
        /url\s*\(/i
      ],
      pathTraversal: [
        /\.\.\//g,
        /\.\.\\/g,
        /%2e%2e%2f/i,
        /%2e%2e%5c/i,
        /\.\.%2f/i,
        /\.\.%5c/i
      ],
      commandInjection: [
        /;\s*rm\s+/i,
        /;\s*cat\s+/i,
        /;\s*ls\s+/i,
        /;\s*whoami/i,
        /;\s*id/i,
        /;\s*pwd/i,
        /;\s*ps\s+/i,
        /;\s*kill\s+/i,
        /\|\s*rm\s+/i,
        /\|\s*cat\s+/i,
        /\|\s*ls\s+/i,
        /`.*`/i,
        /\$\(.*\)/i
      ],
      lfi: [
        /\.\.\/etc\/passwd/i,
        /\.\.\/etc\/shadow/i,
        /\.\.\/etc\/hosts/i,
        /\.\.\/proc\/version/i,
        /\.\.\/proc\/self\/environ/i,
        /\.\.\/windows\/system32/i,
        /\.\.\/boot\.ini/i
      ],
      rfi: [
        /http:\/\/.*\.php/i,
        /https:\/\/.*\.php/i,
        /ftp:\/\/.*\.php/i,
        /file:\/\/.*\.php/i
      ]
    };

    // Headers sospechosos
    this.suspiciousHeaders = [
      'x-forwarded-for',
      'x-real-ip',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr',
      'x-client-ip',
      'x-cluster-client-ip',
      'x-forwarded',
      'forwarded-for',
      'forwarded'
    ];

    // User agents sospechosos
    this.suspiciousUserAgents = [
      /sqlmap/i,
      /nikto/i,
      /nmap/i,
      /masscan/i,
      /zap/i,
      /burp/i,
      /w3af/i,
      /havij/i,
      /acunetix/i,
      /nessus/i,
      /openvas/i,
      /metasploit/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /libwww-perl/i,
      /lwp-trivial/i
    ];
  }

  /**
   * Middleware principal del WAF
   */
  middleware() {
    return (req, res, next) => {
      const clientIP = this.getClientIP(req);
      
      // Verificar si la IP está bloqueada
      if (this.blockedIPs.has(clientIP)) {
        return this.blockRequest(req, res, 'IP_BLOCKED', 'IP bloqueada por WAF');
      }

      // Verificar threat intelligence
      // if (threatIntelligenceService.isThreatIP(clientIP)) { // Servicio eliminado
      //   const threatInfo = threatIntelligenceService.getThreatInfo(clientIP);
      //   return this.blockRequest(req, res, 'THREAT_INTEL_BLOCKED', 
      //     `IP bloqueada por threat intelligence: ${threatInfo?.threatType || 'unknown'}`);
      // }

      // Verificar rate limiting por IP
      if (this.isRateLimited(clientIP)) {
        return this.blockRequest(req, res, 'RATE_LIMITED', 'Rate limit excedido');
      }

      // Analizar la petición
      const analysis = this.analyzeRequest(req);
      
      if (analysis.isBlocked) {
        this.handleSuspiciousActivity(clientIP, analysis);
        return this.blockRequest(req, res, analysis.reason, analysis.message);
      }

      // Si la petición es sospechosa pero no bloqueada, incrementar contador
      if (analysis.isSuspicious) {
        this.incrementSuspiciousCounter(clientIP);
      }

      // Actualizar rate limiting
      this.updateRateLimit(clientIP);

      next();
    };
  }

  /**
   * Obtener IP real del cliente
   */
  getClientIP(req) {
    return req.ip || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           req.headers['x-forwarded-for']?.split(',')[0] ||
           '127.0.0.1';
  }

  /**
   * Analizar petición en busca de patrones de ataque
   */
  analyzeRequest(req) {
    const { method, url, headers, body, query } = req;
    const requestString = JSON.stringify({ url, body, query, headers });
    const userAgent = headers['user-agent'] || '';

    const analysis = {
      isBlocked: false,
      isSuspicious: false,
      reason: null,
      message: null,
      detectedPatterns: []
    };

    // Verificar User-Agent sospechoso
    if (this.suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
      analysis.isBlocked = true;
      analysis.reason = 'SUSPICIOUS_USER_AGENT';
      analysis.message = 'User-Agent sospechoso detectado';
      analysis.detectedPatterns.push('suspicious_user_agent');
    }

    // Verificar headers sospechosos
    const suspiciousHeaderCount = this.suspiciousHeaders.filter(header => 
      headers[header] || headers[header.toLowerCase()]
    ).length;

    if (suspiciousHeaderCount > 3) {
      analysis.isSuspicious = true;
      analysis.detectedPatterns.push('suspicious_headers');
    }

    // Verificar patrones de SQL Injection
    if (this.attackPatterns.sqlInjection.some(pattern => pattern.test(requestString))) {
      analysis.isBlocked = true;
      analysis.reason = 'SQL_INJECTION';
      analysis.message = 'Intento de SQL Injection detectado';
      analysis.detectedPatterns.push('sql_injection');
    }

    // Verificar patrones de XSS
    if (this.attackPatterns.xss.some(pattern => pattern.test(requestString))) {
      analysis.isBlocked = true;
      analysis.reason = 'XSS_ATTEMPT';
      analysis.message = 'Intento de XSS detectado';
      analysis.detectedPatterns.push('xss');
    }

    // Verificar Path Traversal
    if (this.attackPatterns.pathTraversal.some(pattern => pattern.test(url))) {
      analysis.isBlocked = true;
      analysis.reason = 'PATH_TRAVERSAL';
      analysis.message = 'Intento de Path Traversal detectado';
      analysis.detectedPatterns.push('path_traversal');
    }

    // Verificar Command Injection
    if (this.attackPatterns.commandInjection.some(pattern => pattern.test(requestString))) {
      analysis.isBlocked = true;
      analysis.reason = 'COMMAND_INJECTION';
      analysis.message = 'Intento de Command Injection detectado';
      analysis.detectedPatterns.push('command_injection');
    }

    // Verificar Local File Inclusion
    if (this.attackPatterns.lfi.some(pattern => pattern.test(requestString))) {
      analysis.isBlocked = true;
      analysis.reason = 'LFI_ATTEMPT';
      analysis.message = 'Intento de Local File Inclusion detectado';
      analysis.detectedPatterns.push('lfi');
    }

    // Verificar Remote File Inclusion
    if (this.attackPatterns.rfi.some(pattern => pattern.test(requestString))) {
      analysis.isBlocked = true;
      analysis.reason = 'RFI_ATTEMPT';
      analysis.message = 'Intento de Remote File Inclusion detectado';
      analysis.detectedPatterns.push('rfi');
    }

    // Verificar tamaño de petición
    if (requestString.length > 10000) {
      analysis.isSuspicious = true;
      analysis.detectedPatterns.push('large_request');
    }

    // Verificar métodos HTTP sospechosos
    const suspiciousMethods = ['TRACE', 'DEBUG', 'OPTIONS'];
    if (suspiciousMethods.includes(method)) {
      analysis.isSuspicious = true;
      analysis.detectedPatterns.push('suspicious_method');
    }

    return analysis;
  }

  /**
   * Verificar si una IP está rate limited
   */
  isRateLimited(ip) {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minuto
    const maxRequests = 100; // 100 requests por minuto

    if (!this.rateLimitStore.has(ip)) {
      this.rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return false;
    }

    const rateLimit = this.rateLimitStore.get(ip);

    if (now > rateLimit.resetTime) {
      rateLimit.count = 1;
      rateLimit.resetTime = now + windowMs;
      return false;
    }

    if (rateLimit.count >= maxRequests) {
      return true;
    }

    rateLimit.count++;
    return false;
  }

  /**
   * Actualizar rate limiting
   */
  updateRateLimit(ip) {
    // Ya se actualiza en isRateLimited
  }

  /**
   * Manejar actividad sospechosa
   */
  handleSuspiciousActivity(ip, analysis) {
    // Incrementar contador de actividad sospechosa
    const currentCount = this.suspiciousIPs.get(ip) || 0;
    this.suspiciousIPs.set(ip, currentCount + 1);

    // Si hay demasiada actividad sospechosa, bloquear IP
    if (currentCount + 1 >= 5) {
      this.blockedIPs.add(ip);
      securityMonitoringService.logSuspiciousActivity(
        ip,
        'ip_blocked_by_waf',
        { reason: analysis.reason, patterns: analysis.detectedPatterns }
      );
    }

    // Log de la actividad sospechosa
    securityMonitoringService.logSuspiciousActivity(
      ip,
      analysis.reason,
      { patterns: analysis.detectedPatterns, message: analysis.message }
    );
  }

  /**
   * Incrementar contador de actividad sospechosa
   */
  incrementSuspiciousCounter(ip) {
    const currentCount = this.suspiciousIPs.get(ip) || 0;
    this.suspiciousIPs.set(ip, currentCount + 1);
  }

  /**
   * Bloquear petición
   */
  blockRequest(req, res, reason, message) {
    const clientIP = this.getClientIP(req);
    
    // Log del bloqueo
    securityMonitoringService.logSuspiciousActivity(
      clientIP,
      'request_blocked_by_waf',
      { reason, message, url: req.url, method: req.method }
    );

    res.status(403).json({
      success: false,
      message: 'Acceso denegado por el firewall de aplicación',
      reason: reason,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Desbloquear IP
   */
  unblockIP(ip) {
    this.blockedIPs.delete(ip);
    this.suspiciousIPs.delete(ip);
    this.rateLimitStore.delete(ip);
  }

  /**
   * Obtener estadísticas del WAF
   */
  getStats() {
    return {
      blockedIPs: Array.from(this.blockedIPs),
      suspiciousIPs: Object.fromEntries(this.suspiciousIPs),
      rateLimitStore: Object.fromEntries(this.rateLimitStore),
      totalBlockedIPs: this.blockedIPs.size,
      totalSuspiciousIPs: this.suspiciousIPs.size
    };
  }

  /**
   * Limpiar datos antiguos
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas

    // Limpiar rate limit store
    for (const [ip, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime + maxAge) {
        this.rateLimitStore.delete(ip);
      }
    }

    // Limpiar IPs sospechosas (mantener por 1 hora)
    const suspiciousMaxAge = 60 * 60 * 1000; // 1 hora
    for (const [ip, count] of this.suspiciousIPs.entries()) {
      // Si no está bloqueada y ha pasado tiempo, limpiar
      if (!this.blockedIPs.has(ip)) {
        this.suspiciousIPs.delete(ip);
      }
    }
  }
}

// Instancia singleton
const waf = new WAF();

// Limpiar datos cada hora
setInterval(() => {
  waf.cleanup();
}, 60 * 60 * 1000);

module.exports = {
  WAF,
  waf
};
