const { securityMonitoringService } = require('../services/securityMonitoringService');
const securityMonitoringMiddleware = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  // Interceptar respuestas para monitorear
  res.send = function(data) {
    // Monitorear respuestas de error
    if (res.statusCode >= 400) {
      monitorErrorResponse(req, res, data);
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    // Monitorear respuestas de error
    if (res.statusCode >= 400) {
      monitorErrorResponse(req, res, data);
    }
    return originalJson.call(this, data);
  };

  // Monitorear peticiones sospechosas
  monitorSuspiciousRequest(req);

  if (req.user && req.user.userId) {
    // Análisis de comportamiento desactivado temporalmente
  }

  next();
};

/**
 * Monitorear peticiones sospechosas
 */
function monitorSuspiciousRequest(req) {
  const { ip, method, path, body, query, headers } = req;

  // Detectar intentos de SQL injection
  const sqlPatterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /delete\s+from/i,
    /insert\s+into/i,
    /update\s+set/i,
    /or\s+1\s*=\s*1/i,
    /';\s*drop/i,
    /--\s*$/i,
    /\/\*.*\*\//i
  ];

  const requestString = JSON.stringify({ body, query, path });
  const hasSqlInjection = sqlPatterns.some(pattern => pattern.test(requestString));

  if (hasSqlInjection) {
    securityMonitoringService.logSqlInjectionAttempt(ip, requestString, path);
  }

  // Detectar intentos de XSS
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe[^>]*>/i,
    /<object[^>]*>/i,
    /<embed[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i
  ];

  const hasXss = xssPatterns.some(pattern => pattern.test(requestString));

  if (hasXss) {
    securityMonitoringService.logXssAttempt(ip, requestString, path);
  }

  // Detectar patrones de fuerza bruta
  if (path.includes('/login') && method === 'POST') {
    // Esto se manejará en el middleware de auth
  }

  // Detectar accesos a rutas sensibles
  const sensitivePaths = [
    '/api/admin',
    '/api/backup',
    '/api/users',
    '/api/settings'
  ];

  const isSensitivePath = sensitivePaths.some(sensitivePath => 
    path.startsWith(sensitivePath)
  );

  if (isSensitivePath && !req.user) {
    securityMonitoringService.logUnauthorizedAccess(
      ip, 
      path, 
      'anonymous', 
      'Acceso a ruta sensible sin autenticación'
    );
  }
}

/**
 * Monitorear respuestas de error
 */
function monitorErrorResponse(req, res, data) {
  const { ip, path, method } = req;
  const statusCode = res.statusCode;

  // Monitorear errores de autenticación
  if (statusCode === 401) {
    securityMonitoringService.logUnauthorizedAccess(
      ip,
      path,
      req.user?.userId || 'anonymous',
      'Error de autenticación'
    );
  }

  // Monitorear errores de autorización
  if (statusCode === 403) {
    securityMonitoringService.logUnauthorizedAccess(
      ip,
      path,
      req.user?.userId || 'anonymous',
      'Error de autorización'
    );
  }

  // Monitorear rate limiting
  if (statusCode === 429) {
    securityMonitoringService.logRateLimitExceeded(ip, path, 'unknown');
  }

  // Monitorear errores del servidor
  if (statusCode >= 500) {
    securityMonitoringService.logSuspiciousActivity(
      ip,
      'server_error',
      { statusCode, path, method }
    );
  }
}

module.exports = {
  securityMonitoringMiddleware
};
