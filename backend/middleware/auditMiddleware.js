const AuditService = require('../services/auditService')

/**
 * Middleware de auditoría que registra automáticamente las acciones
 */
const auditMiddleware = (options = {}) => {
  return (req, res, next) => {
    // Interceptar la respuesta para registrar la actividad
    const originalSend = res.send
    const originalJson = res.json
    
    // Función para registrar la actividad
    const logActivity = async (status) => {
      try {
        // Solo registrar ciertas rutas importantes
        const importantRoutes = [
          '/api/auth/login',
          '/api/auth/logout',
          '/api/auth/register',
          '/api/users',
          '/api/events',
          '/api/tickets',
          '/api/payments',
          '/api/admin',
          '/api/organizer',
          '/api/audit',
          '/api/settings',
          '/api/media',
          '/api/reports',
          '/api/sales',
          '/api/promoters',
          '/api/categories',
          '/api/venues'
        ]
        
        const shouldLog = importantRoutes.some(route => req.path.startsWith(route))
        
        if (!shouldLog) return
        
        // Determinar la acción basada en el método HTTP y la ruta
        let action = 'UNKNOWN'
        let resource = 'UNKNOWN'
        let resourceId = null
        let severity = 'low'
        
        // Mapear métodos HTTP a acciones
        switch (req.method) {
          case 'POST':
            if (req.path.includes('/login')) {
              action = 'LOGIN'
              resource = 'AUTH'
              severity = 'medium'
            } else if (req.path.includes('/register')) {
              action = 'REGISTER'
              resource = 'USER'
              severity = 'medium'
            } else if (req.path.includes('/logout')) {
              action = 'LOGOUT'
              resource = 'AUTH'
              severity = 'low'
            } else if (req.path.includes('/events')) {
              action = 'CREATE_EVENT'
              resource = 'EVENT'
              severity = 'medium'
            } else if (req.path.includes('/tickets')) {
              action = 'CREATE_TICKET'
              resource = 'TICKET'
              severity = 'medium'
            } else if (req.path.includes('/payments')) {
              action = 'CREATE_PAYMENT'
              resource = 'PAYMENT'
              severity = 'high'
            } else if (req.path.includes('/users')) {
              action = 'CREATE_USER'
              resource = 'USER'
              severity = 'high'
            } else if (req.path.includes('/settings')) {
              action = 'CREATE_SETTINGS'
              resource = 'SETTINGS'
              severity = 'high'
            } else if (req.path.includes('/media')) {
              action = 'CREATE_MEDIA'
              resource = 'MEDIA'
              severity = 'medium'
            } else if (req.path.includes('/reports')) {
              action = 'CREATE_REPORT'
              resource = 'REPORT'
              severity = 'medium'
            } else if (req.path.includes('/sales')) {
              action = 'CREATE_SALE'
              resource = 'SALE'
              severity = 'high'
            } else if (req.path.includes('/promoters')) {
              action = 'CREATE_PROMOTER'
              resource = 'PROMOTER'
              severity = 'high'
            } else if (req.path.includes('/categories')) {
              action = 'CREATE_CATEGORY'
              resource = 'CATEGORY'
              severity = 'medium'
            } else if (req.path.includes('/venues')) {
              action = 'CREATE_VENUE'
              resource = 'VENUE'
              severity = 'medium'
            } else {
              action = 'CREATE'
              resource = getResourceFromPath(req.path)
              severity = 'medium'
            }
            break
            
          case 'PUT':
          case 'PATCH':
            if (req.path.includes('/events')) {
              action = 'UPDATE_EVENT'
              resource = 'EVENT'
              resourceId = req.params.id || req.body.id
              severity = 'medium'
            } else if (req.path.includes('/users')) {
              action = 'UPDATE_USER'
              resource = 'USER'
              resourceId = req.params.id || req.body.id
              severity = 'high'
            } else if (req.path.includes('/tickets')) {
              action = 'UPDATE_TICKET'
              resource = 'TICKET'
              resourceId = req.params.id || req.body.id
              severity = 'medium'
            } else if (req.path.includes('/admin')) {
              action = 'ADMIN_UPDATE'
              resource = 'ADMIN'
              severity = 'high'
            } else if (req.path.includes('/settings')) {
              action = 'UPDATE_SETTINGS'
              resource = 'SETTINGS'
              severity = 'high'
            } else if (req.path.includes('/media')) {
              action = 'UPLOAD_MEDIA'
              resource = 'MEDIA'
              severity = 'medium'
            } else if (req.path.includes('/reports')) {
              action = 'GENERATE_REPORT'
              resource = 'REPORT'
              severity = 'medium'
            } else if (req.path.includes('/sales')) {
              action = 'UPDATE_SALE'
              resource = 'SALE'
              severity = 'high'
            } else if (req.path.includes('/promoters')) {
              action = 'UPDATE_PROMOTER'
              resource = 'PROMOTER'
              severity = 'high'
            } else if (req.path.includes('/categories')) {
              action = 'UPDATE_CATEGORY'
              resource = 'CATEGORY'
              severity = 'medium'
            } else if (req.path.includes('/venues')) {
              action = 'UPDATE_VENUE'
              resource = 'VENUE'
              severity = 'medium'
            } else {
              action = 'UPDATE'
              resource = getResourceFromPath(req.path)
              resourceId = req.params.id || req.body.id
              severity = 'medium'
            }
            break
            
          case 'DELETE':
            if (req.path.includes('/events')) {
              action = 'DELETE_EVENT'
              resource = 'EVENT'
              resourceId = req.params.id
              severity = 'high'
            } else if (req.path.includes('/users')) {
              action = 'DELETE_USER'
              resource = 'USER'
              resourceId = req.params.id
              severity = 'critical'
            } else if (req.path.includes('/tickets')) {
              action = 'DELETE_TICKET'
              resource = 'TICKET'
              resourceId = req.params.id
              severity = 'high'
            } else if (req.path.includes('/admin')) {
              action = 'ADMIN_DELETE'
              resource = 'ADMIN'
              severity = 'critical'
            } else if (req.path.includes('/settings')) {
              action = 'DELETE_SETTINGS'
              resource = 'SETTINGS'
              severity = 'critical'
            } else if (req.path.includes('/media')) {
              action = 'DELETE_MEDIA'
              resource = 'MEDIA'
              resourceId = req.params.id
              severity = 'medium'
            } else if (req.path.includes('/reports')) {
              action = 'DELETE_REPORT'
              resource = 'REPORT'
              resourceId = req.params.id
              severity = 'high'
            } else if (req.path.includes('/sales')) {
              action = 'DELETE_SALE'
              resource = 'SALE'
              resourceId = req.params.id
              severity = 'critical'
            } else if (req.path.includes('/promoters')) {
              action = 'DELETE_PROMOTER'
              resource = 'PROMOTER'
              resourceId = req.params.id
              severity = 'critical'
            } else if (req.path.includes('/categories')) {
              action = 'DELETE_CATEGORY'
              resource = 'CATEGORY'
              resourceId = req.params.id
              severity = 'high'
            } else if (req.path.includes('/venues')) {
              action = 'DELETE_VENUE'
              resource = 'VENUE'
              resourceId = req.params.id
              severity = 'high'
            } else {
              action = 'DELETE'
              resource = getResourceFromPath(req.path)
              resourceId = req.params.id
              severity = 'high'
            }
            break
            
          case 'GET':
            // Solo registrar GET para acciones importantes
            if (req.path.includes('/admin') && req.user?.role === 'admin') {
              action = 'ADMIN_ACCESS'
              resource = 'ADMIN'
              severity = 'medium'
            } else if (req.path.includes('/organizer') && req.user?.role === 'organizer') {
              action = 'ORGANIZER_ACCESS'
              resource = 'ORGANIZER'
              severity = 'low'
            } else {
              return // No registrar GETs normales
            }
            break
        }
        
        // Determinar el estado basado en el código de respuesta
        let logStatus = 'success'
        if (status >= 400) {
          logStatus = 'failure'
          if (status >= 500) {
            severity = 'high'
          }
        }
        
        // Obtener información del usuario
        let userId = req.user?.userId || req.user?.id || 'anonymous'
        let userName = req.user?.name || req.user?.userName || 'Usuario Anónimo'
        let userEmail = req.user?.email || req.user?.userEmail || 'anonymous@eventu.com'
        
        // Para login, intentar obtener información del body
        if (action === 'LOGIN' && req.body?.email) {
          userEmail = req.body.email
          userName = `Usuario (${req.body.email})`
          userId = 'login_attempt'
        }
        
        // Para register, usar información del body
        if (action === 'REGISTER' && req.body?.email) {
          userEmail = req.body.email
          userName = req.body.name || `Usuario (${req.body.email})`
          userId = 'register_attempt'
        }
        
        // Crear detalles de la actividad
        const details = {
          path: req.path,
          method: req.method,
          query: req.query,
          body: sanitizeBody(req.body),
          duration: Date.now() - req.startTime,
          statusCode: status,
          userAgent: req.get('User-Agent'),
          ip: req.ip || req.connection.remoteAddress
        }
        
        // Registrar la actividad
        await AuditService.logActivity({
          userId,
          userName,
          userEmail,
          action,
          resource,
          resourceId,
          details,
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          severity,
          status: logStatus
        })
        
      } catch (error) {
        console.error('Error in audit middleware:', error)
        // No interrumpir el flujo principal
      }
    }
    
    // Interceptar res.send
    res.send = function(body) {
      logActivity(res.statusCode)
      return originalSend.call(this, body)
    }
    
    // Interceptar res.json
    res.json = function(body) {
      logActivity(res.statusCode)
      return originalJson.call(this, body)
    }
    
    // Marcar el tiempo de inicio
    req.startTime = Date.now()
    
    next()
  }
}

/**
 * Obtiene el tipo de recurso basado en la ruta
 */
function getResourceFromPath(path) {
  if (path.includes('/users')) return 'USER'
  if (path.includes('/events')) return 'EVENT'
  if (path.includes('/tickets')) return 'TICKET'
  if (path.includes('/payments')) return 'PAYMENT'
  if (path.includes('/admin')) return 'ADMIN'
  if (path.includes('/organizer')) return 'ORGANIZER'
  if (path.includes('/auth')) return 'AUTH'
  if (path.includes('/audit')) return 'AUDIT'
  if (path.includes('/settings')) return 'SETTINGS'
  if (path.includes('/media')) return 'MEDIA'
  if (path.includes('/reports')) return 'REPORT'
  if (path.includes('/sales')) return 'SALE'
  if (path.includes('/promoters')) return 'PROMOTER'
  if (path.includes('/categories')) return 'CATEGORY'
  if (path.includes('/venues')) return 'VENUE'
  return 'UNKNOWN'
}

/**
 * Sanitiza el body para remover información sensible
 */
function sanitizeBody(body) {
  if (!body || typeof body !== 'object') return body
  
  const sanitized = { ...body }
  
  // Remover campos sensibles
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'creditCard', 'cvv']
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  
  return sanitized
}

module.exports = auditMiddleware