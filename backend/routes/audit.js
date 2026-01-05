const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const AuditService = require('../services/auditService')
const db = require('../config/database-postgres')

// Middleware para verificar que el usuario es administrador
const requireAdmin = requireRole('admin')

/**
 * GET /api/audit/logs
 * Obtiene logs de auditoría con filtros opcionales
 */
router.get('/logs', auth, requireAdmin, async (req, res) => {
  try {
    const {
      userId,
      userEmail,
      action,
      resource,
      severity,
      status,
      startDate,
      endDate,
      limit = 50,
      offset = 0
    } = req.query

    const filters = {
      userId,
      userEmail,
      action,
      resource,
      severity,
      status,
      startDate,
      endDate
    }

    const result = await AuditService.getAuditLogs(filters, parseInt(limit), parseInt(offset))

    res.json({
      success: true,
      data: result
    })
  } catch (error) {
    console.error('Error getting audit logs:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/audit/stats
 * Obtiene estadísticas de auditoría
 */
router.get('/stats', auth, requireAdmin, async (req, res) => {
  try {
    const stats = await AuditService.getAuditStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting audit stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/audit/logs/:id
 * Obtiene un log específico por ID
 */
router.get('/logs/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        id, user_id, user_name, user_email, action, resource, resource_id,
        details, ip_address, user_agent, severity, status, timestamp
      FROM audit_logs
      WHERE id = $1
    `

    const result = await db.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Log no encontrado'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error getting audit log:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/audit/actions
 * Obtiene lista de acciones disponibles
 */
router.get('/actions', auth, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT action
      FROM audit_logs
      ORDER BY action
    `

    const result = await db.query(query)
    const actions = result.rows.map(row => row.action)

    res.json({
      success: true,
      data: actions
    })
  } catch (error) {
    console.error('Error getting actions:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/audit/resources
 * Obtiene lista de recursos disponibles
 */
router.get('/resources', auth, requireAdmin, async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT resource
      FROM audit_logs
      ORDER BY resource
    `

    const result = await db.query(query)
    const resources = result.rows.map(row => row.resource)

    res.json({
      success: true,
      data: resources
    })
  } catch (error) {
    console.error('Error getting resources:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * POST /api/audit/cleanup
 * Limpia logs antiguos (más de 90 días)
 */
router.post('/cleanup', auth, requireAdmin, async (req, res) => {
  try {
    const deletedCount = await AuditService.cleanOldLogs()

    res.json({
      success: true,
      message: `Se eliminaron ${deletedCount} logs antiguos`,
      data: { deletedCount }
    })
  } catch (error) {
    console.error('Error cleaning audit logs:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

/**
 * GET /api/audit/export
 * Exporta logs de auditoría en formato CSV
 */
router.get('/export', auth, requireAdmin, async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      action,
      resource,
      severity,
      status
    } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (startDate) {
      whereClause += ` AND timestamp >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND timestamp <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    if (action) {
      whereClause += ` AND action = $${paramIndex}`
      params.push(action)
      paramIndex++
    }

    if (resource) {
      whereClause += ` AND resource = $${paramIndex}`
      params.push(resource)
      paramIndex++
    }

    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`
      params.push(severity)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    const query = `
      SELECT 
        id, user_id, user_name, user_email, action, resource, resource_id,
        details, ip_address, user_agent, severity, status, timestamp
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT 10000
    `

    const result = await db.query(query, params)

    // Convertir a CSV
    const csvHeader = 'ID,Usuario ID,Nombre,Email,Acción,Recurso,Recurso ID,IP,User Agent,Severidad,Estado,Fecha\n'
    const csvRows = result.rows.map(row => {
      return [
        row.id,
        row.user_id,
        `"${row.user_name}"`,
        row.user_email,
        row.action,
        row.resource,
        row.resource_id || '',
        row.ip_address,
        `"${row.user_agent || ''}"`,
        row.severity,
        row.status,
        row.timestamp
      ].join(',')
    }).join('\n')

    const csv = csvHeader + csvRows

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename=audit_logs.csv')
    res.send(csv)
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
