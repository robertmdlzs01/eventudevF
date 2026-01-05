const winston = require('winston');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
class SecurityMonitoringService {
  constructor() {
    this.alertThresholds = {
      failedLogins: 5,
      rateLimitHits: 10,
      suspiciousActivity: 3,
      malwareDetected: 1,
      unauthorizedAccess: 1
    };

    this.alertCooldowns = {
      failedLogins: 15 * 60 * 1000,
      rateLimitHits: 5 * 60 * 1000,
      suspiciousActivity: 10 * 60 * 1000,
      malwareDetected: 0,
      unauthorizedAccess: 0
    };

    this.lastAlerts = new Map();
    this.alertCounts = new Map();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ 
          filename: path.join(__dirname, '../logs/security.log'),
          maxsize: 10 * 1024 * 1024,
          maxFiles: 5
        }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });

    this.setupEmailTransporter();
    this.setupWebhook();
    this.initializeCounters();
  }
  setupEmailTransporter() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      this.alertEmail = process.env.ALERT_EMAIL || 'security@eventu.com';
      this.logger.info('📧 Transportador de email configurado');
    } catch (error) {
      this.logger.warn('⚠️ No se pudo configurar el transportador de email:', error.message);
    }
  }

  /**
   * Configurar webhook para alertas
   */
  setupWebhook() {
    this.webhookUrl = process.env.ALERT_WEBHOOK;
    if (this.webhookUrl) {
      this.logger.info('🔗 Webhook de alertas configurado');
    }
  }

  /**
   * Inicializar contadores de alertas
   */
  initializeCounters() {
    const alertTypes = Object.keys(this.alertThresholds);
    alertTypes.forEach(type => {
      this.alertCounts.set(type, 0);
    });
  }

  /**
   * Registrar evento de seguridad
   */
  logSecurityEvent(eventType, details) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      details: details,
      ip: details.ip || 'unknown',
      user: details.user || 'anonymous',
      severity: this.getEventSeverity(eventType)
    };

    // Log del evento
    this.logger.warn('🚨 Evento de seguridad detectado', event);

    // Ingresar evento al SIEM
    // siemService.ingestEvent(event); // Servicio eliminado

    // Incrementar contador
    const currentCount = this.alertCounts.get(eventType) || 0;
    this.alertCounts.set(eventType, currentCount + 1);

    // Verificar si debe enviar alerta
    this.checkAndSendAlert(eventType, event);
  }

  /**
   * Obtener severidad del evento
   */
  getEventSeverity(eventType) {
    const severityMap = {
      'failed_login': 'medium',
      'rate_limit_exceeded': 'low',
      'suspicious_activity': 'high',
      'malware_detected': 'critical',
      'unauthorized_access': 'critical',
      'sql_injection_attempt': 'critical',
      'xss_attempt': 'high',
      'csrf_attempt': 'medium',
      'brute_force_attack': 'high',
      'data_breach_attempt': 'critical'
    };

    return severityMap[eventType] || 'low';
  }

  /**
   * Verificar y enviar alerta si es necesario
   */
  async checkAndSendAlert(eventType, event) {
    const threshold = this.alertThresholds[eventType];
    const currentCount = this.alertCounts.get(eventType) || 0;
    const cooldown = this.alertCooldowns[eventType];
    const lastAlert = this.lastAlerts.get(eventType);

    // Verificar si debe enviar alerta
    const shouldAlert = currentCount >= threshold;
    const cooldownExpired = !lastAlert || (Date.now() - lastAlert) > cooldown;

    if (shouldAlert && cooldownExpired) {
      await this.sendAlert(eventType, event, currentCount);
      this.lastAlerts.set(eventType, Date.now());
    }
  }

  /**
   * Enviar alerta de seguridad
   */
  async sendAlert(eventType, event, count) {
    const alert = {
      type: eventType,
      severity: event.severity,
      count: count,
      timestamp: new Date().toISOString(),
      details: event.details,
      message: this.generateAlertMessage(eventType, event, count)
    };

    // Enviar por email
    if (this.emailTransporter && this.alertEmail) {
      await this.sendEmailAlert(alert);
    }

    // Enviar por webhook
    if (this.webhookUrl) {
      await this.sendWebhookAlert(alert);
    }

    // Log de la alerta enviada
    this.logger.error('🚨 ALERTA DE SEGURIDAD ENVIADA', alert);
  }

  /**
   * Generar mensaje de alerta
   */
  generateAlertMessage(eventType, event, count) {
    const messages = {
      'failed_login': `Se detectaron ${count} intentos de login fallidos desde la IP ${event.details.ip}`,
      'rate_limit_exceeded': `Rate limit excedido ${count} veces desde la IP ${event.details.ip}`,
      'suspicious_activity': `Se detectaron ${count} actividades sospechosas desde la IP ${event.details.ip}`,
      'malware_detected': `MALWARE DETECTADO: ${event.details.reason}`,
      'unauthorized_access': `ACCESO NO AUTORIZADO: Intento de acceso a ${event.details.endpoint} desde ${event.details.ip}`,
      'sql_injection_attempt': `INTENTO DE SQL INJECTION detectado desde ${event.details.ip}`,
      'xss_attempt': `INTENTO DE XSS detectado desde ${event.details.ip}`,
      'csrf_attempt': `INTENTO DE CSRF detectado desde ${event.details.ip}`,
      'brute_force_attack': `ATAQUE DE FUERZA BRUTA detectado desde ${event.details.ip}`,
      'data_breach_attempt': `INTENTO DE BREACH DE DATOS detectado desde ${event.details.ip}`
    };

    return messages[eventType] || `Evento de seguridad detectado: ${eventType}`;
  }

  /**
   * Enviar alerta por email
   */
  async sendEmailAlert(alert) {
    try {
      const mailOptions = {
        from: this.alertEmail,
        to: this.alertEmail,
        subject: `🚨 ALERTA DE SEGURIDAD - ${alert.severity.toUpperCase()} - ${alert.type}`,
        html: `
          <h2>🚨 Alerta de Seguridad - Eventu</h2>
          <p><strong>Tipo:</strong> ${alert.type}</p>
          <p><strong>Severidad:</strong> ${alert.severity.toUpperCase()}</p>
          <p><strong>Conteo:</strong> ${alert.count}</p>
          <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
          <p><strong>Mensaje:</strong> ${alert.message}</p>
          <hr>
          <h3>Detalles del Evento:</h3>
          <pre>${JSON.stringify(alert.details, null, 2)}</pre>
          <hr>
          <p><em>Esta es una alerta automática del sistema de monitoreo de seguridad de Eventu.</em></p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      this.logger.info('📧 Alerta enviada por email');
    } catch (error) {
      this.logger.error('Error enviando alerta por email:', error);
    }
  }

  /**
   * Enviar alerta por webhook
   */
  async sendWebhookAlert(alert) {
    try {
      const webhookData = {
        text: `🚨 ALERTA DE SEGURIDAD - Eventu`,
        attachments: [{
          color: this.getSeverityColor(alert.severity),
          fields: [
            { title: 'Tipo', value: alert.type, short: true },
            { title: 'Severidad', value: alert.severity.toUpperCase(), short: true },
            { title: 'Conteo', value: alert.count.toString(), short: true },
            { title: 'Timestamp', value: alert.timestamp, short: true },
            { title: 'Mensaje', value: alert.message, short: false }
          ]
        }]
      };

      await axios.post(this.webhookUrl, webhookData, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.logger.info('🔗 Alerta enviada por webhook');
    } catch (error) {
      this.logger.error('Error enviando alerta por webhook:', error);
    }
  }

  /**
   * Obtener color para severidad
   */
  getSeverityColor(severity) {
    const colors = {
      'low': '#36a64f', // Verde
      'medium': '#ff9500', // Naranja
      'high': '#ff0000', // Rojo
      'critical': '#8b0000' // Rojo oscuro
    };

    return colors[severity] || '#36a64f';
  }

  /**
   * Registrar intento de login fallido
   */
  logFailedLogin(ip, email, reason) {
    this.logSecurityEvent('failed_login', {
      ip: ip,
      email: email,
      reason: reason,
      endpoint: '/api/auth/login'
    });
  }

  /**
   * Registrar rate limit excedido
   */
  logRateLimitExceeded(ip, endpoint, limit) {
    this.logSecurityEvent('rate_limit_exceeded', {
      ip: ip,
      endpoint: endpoint,
      limit: limit
    });
  }

  /**
   * Registrar actividad sospechosa
   */
  logSuspiciousActivity(ip, activity, details) {
    this.logSecurityEvent('suspicious_activity', {
      ip: ip,
      activity: activity,
      details: details
    });
  }

  /**
   * Registrar malware detectado
   */
  logMalwareDetected(filePath, reason, viruses) {
    this.logSecurityEvent('malware_detected', {
      filePath: filePath,
      reason: reason,
      viruses: viruses
    });
  }

  /**
   * Registrar acceso no autorizado
   */
  logUnauthorizedAccess(ip, endpoint, user, reason) {
    this.logSecurityEvent('unauthorized_access', {
      ip: ip,
      endpoint: endpoint,
      user: user,
      reason: reason
    });
  }

  /**
   * Registrar intento de inyección SQL
   */
  logSqlInjectionAttempt(ip, query, endpoint) {
    this.logSecurityEvent('sql_injection_attempt', {
      ip: ip,
      query: query,
      endpoint: endpoint
    });
  }

  /**
   * Registrar intento de XSS
   */
  logXssAttempt(ip, payload, endpoint) {
    this.logSecurityEvent('xss_attempt', {
      ip: ip,
      payload: payload,
      endpoint: endpoint
    });
  }

  /**
   * Registrar intento de CSRF
   */
  logCsrfAttempt(ip, token, endpoint) {
    this.logSecurityEvent('csrf_attempt', {
      ip: ip,
      token: token,
      endpoint: endpoint
    });
  }

  /**
   * Registrar ataque de fuerza bruta
   */
  logBruteForceAttack(ip, target, attempts) {
    this.logSecurityEvent('brute_force_attack', {
      ip: ip,
      target: target,
      attempts: attempts
    });
  }

  /**
   * Obtener estadísticas de seguridad
   */
  getSecurityStats() {
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      eventsBySeverity: {},
      recentEvents: [],
      alertCounts: Object.fromEntries(this.alertCounts),
      lastAlerts: Object.fromEntries(this.lastAlerts)
    };

    // Leer archivo de log de seguridad
    try {
      const logPath = path.join(__dirname, '../logs/security.log');
      if (fs.existsSync(logPath)) {
        const logContent = fs.readFileSync(logPath, 'utf8');
        const lines = logContent.split('\n').filter(line => line.trim());
        
        // Procesar últimas 100 líneas
        const recentLines = lines.slice(-100);
        
        recentLines.forEach(line => {
          try {
            const logEntry = JSON.parse(line);
            stats.totalEvents++;
            
            // Contar por tipo
            stats.eventsByType[logEntry.type] = (stats.eventsByType[logEntry.type] || 0) + 1;
            
            // Contar por severidad
            stats.eventsBySeverity[logEntry.severity] = (stats.eventsBySeverity[logEntry.severity] || 0) + 1;
            
            // Agregar a eventos recientes
            if (stats.recentEvents.length < 10) {
              stats.recentEvents.push({
                type: logEntry.type,
                severity: logEntry.severity,
                timestamp: logEntry.timestamp,
                ip: logEntry.details?.ip || 'unknown'
              });
            }
          } catch (parseError) {
            // Ignorar líneas que no son JSON válido
          }
        });
      }
    } catch (error) {
      this.logger.error('Error leyendo estadísticas de seguridad:', error);
    }

    return stats;
  }

  /**
   * Resetear contadores de alertas
   */
  resetAlertCounters() {
    this.alertCounts.clear();
    this.initializeCounters();
    this.logger.info('🔄 Contadores de alertas reseteados');
  }
}

// Instancia singleton
const securityMonitoringService = new SecurityMonitoringService();

module.exports = {
  SecurityMonitoringService,
  securityMonitoringService
};
