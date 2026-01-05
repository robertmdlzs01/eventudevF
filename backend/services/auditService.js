const db = require('../config/database-postgres')

class AuditService {
  /**
   * Registra una actividad en el log de auditoría
   * @param {Object} params - Parámetros de la actividad
   * @param {string|number} params.userId - ID del usuario
   * @param {string} params.userName - Nombre del usuario
   * @param {string} params.userEmail - Email del usuario
   * @param {string} params.action - Acción realizada (LOGIN, LOGOUT, CREATE, UPDATE, DELETE, etc.)
   * @param {string} params.resource - Tipo de recurso (USER, EVENT, TICKET, etc.)
   * @param {string|number} params.resourceId - ID del recurso afectado
   * @param {Object} params.details - Detalles adicionales de la actividad
   * @param {string} params.ipAddress - Dirección IP del usuario
   * @param {string} params.userAgent - User agent del navegador
   * @param {string} params.severity - Nivel de severidad (low, medium, high, critical)
   * @param {string} params.status - Estado de la operación (success, failure, warning)
   */
  static async logActivity({
    userId,
    userName,
    userEmail,
    action,
    resource,
    resourceId = null,
    details = {},
    ipAddress,
    userAgent,
    severity = 'low',
    status = 'success'
  }) {
    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, user_name, user_email, action, resource, resource_id, 
          details, ip_address, user_agent, severity, status, timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
        RETURNING id
      `

      const values = [
        userId?.toString() || 'system',
        userName || 'Sistema',
        userEmail || 'system@eventu.com',
        action,
        resource,
        resourceId?.toString() || null,
        JSON.stringify(details),
        ipAddress || '127.0.0.1',
        userAgent || 'Unknown',
        severity,
        status
      ]

      const result = await db.query(query, values)
      return result.rows[0].id
    } catch (error) {
      console.error('Error logging activity:', error)
      // No lanzar error para evitar interrumpir el flujo principal
      return null
    }
  }

  /**
   * Obtiene logs de auditoría con filtros
   * @param {Object} filters - Filtros de búsqueda
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   */
  static async getAuditLogs(filters = {}, limit = 50, offset = 0) {
    try {
      let whereClause = 'WHERE 1=1'
      const params = []
      let paramIndex = 1

      // Filtros
      if (filters.userId) {
        whereClause += ` AND user_id = $${paramIndex}`
        params.push(filters.userId)
        paramIndex++
      }

      if (filters.userEmail) {
        whereClause += ` AND user_email ILIKE $${paramIndex}`
        params.push(`%${filters.userEmail}%`)
        paramIndex++
      }

      if (filters.action) {
        whereClause += ` AND action = $${paramIndex}`
        params.push(filters.action)
        paramIndex++
      }

      if (filters.resource) {
        whereClause += ` AND resource = $${paramIndex}`
        params.push(filters.resource)
        paramIndex++
      }

      if (filters.severity) {
        whereClause += ` AND severity = $${paramIndex}`
        params.push(filters.severity)
        paramIndex++
      }

      if (filters.status) {
        whereClause += ` AND status = $${paramIndex}`
        params.push(filters.status)
        paramIndex++
      }

      if (filters.startDate) {
        whereClause += ` AND timestamp >= $${paramIndex}`
        params.push(filters.startDate)
        paramIndex++
      }

      if (filters.endDate) {
        whereClause += ` AND timestamp <= $${paramIndex}`
        params.push(filters.endDate)
        paramIndex++
      }

      // Query principal
      const query = `
        SELECT 
          id, user_id, user_name, user_email, action, resource, resource_id,
          details, ip_address, user_agent, severity, status, timestamp
        FROM audit_logs
        ${whereClause}
        ORDER BY timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `

      params.push(limit, offset)

      const result = await db.query(query, params)

      // Query para contar total
      const countQuery = `
        SELECT COUNT(*) as total
        FROM audit_logs
        ${whereClause}
      `

      const countResult = await db.query(countQuery, params.slice(0, -2))
      const total = parseInt(countResult.rows[0].total)

      return {
        logs: result.rows,
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    } catch (error) {
      console.error('Error getting audit logs:', error)
      throw error
    }
  }

  /**
   * Obtiene estadísticas de auditoría
   */
  static async getAuditStats() {
    try {
      const queries = {
        totalLogs: 'SELECT COUNT(*) as count FROM audit_logs',
        logsByAction: `
          SELECT action, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY action 
          ORDER BY count DESC 
          LIMIT 10
        `,
        logsByResource: `
          SELECT resource, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY resource 
          ORDER BY count DESC 
          LIMIT 10
        `,
        logsBySeverity: `
          SELECT severity, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY severity 
          ORDER BY count DESC
        `,
        logsByStatus: `
          SELECT status, COUNT(*) as count 
          FROM audit_logs 
          GROUP BY status 
          ORDER BY count DESC
        `,
        recentActivity: `
          SELECT 
            DATE(timestamp) as date,
            COUNT(*) as count
          FROM audit_logs 
          WHERE timestamp >= NOW() - INTERVAL '30 days'
          GROUP BY DATE(timestamp)
          ORDER BY date DESC
          LIMIT 30
        `
      }

      const results = {}
      for (const [key, query] of Object.entries(queries)) {
        const result = await db.query(query)
        results[key] = result.rows
      }

      return results
    } catch (error) {
      console.error('Error getting audit stats:', error)
      throw error
    }
  }

  /**
   * Limpia logs antiguos (más de 90 días)
   */
  static async cleanOldLogs() {
    try {
      const query = `
        DELETE FROM audit_logs 
        WHERE timestamp < NOW() - INTERVAL '90 days'
      `
      
      const result = await db.query(query)
      return result.rowCount
    } catch (error) {
      console.error('Error cleaning old logs:', error)
      throw error
    }
  }
}

module.exports = AuditService
