const express = require('express')
const router = express.Router()
const db = require('../config/database-postgres')
const { auth, requireRole } = require('../middleware/auth')

// Get event metrics
router.get('/event/:eventId', auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { eventId } = req.params

    const query = `
      SELECT * FROM event_ticket_metrics
      WHERE event_id = $1
    `

    const result = await db.query(query, [eventId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o sin métricas'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error obteniendo métricas del evento:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Get ticket type metrics
router.get('/ticket-type/:ticketTypeId', auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { ticketTypeId } = req.params

    const query = `
      SELECT * FROM ticket_type_metrics
      WHERE ticket_type_id = $1
    `

    const result = await db.query(query, [ticketTypeId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tipo de boleto no encontrado o sin métricas'
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })
  } catch (error) {
    console.error('Error obteniendo métricas del tipo de boleto:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Get delivery metrics (admin only)
router.get('/delivery', auth, requireRole('admin'), async (req, res) => {
  try {
    const { delivery_type, delivery_status } = req.query

    let query = 'SELECT * FROM delivery_metrics WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (delivery_type) {
      query += ` AND delivery_type = $${paramIndex}`
      params.push(delivery_type)
      paramIndex++
    }

    if (delivery_status) {
      query += ` AND delivery_status = $${paramIndex}`
      params.push(delivery_status)
      paramIndex++
    }

    query += ' ORDER BY delivery_type, delivery_status'

    const result = await db.query(query, params)

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error obteniendo métricas de entregas:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Get all events metrics (admin only)
router.get('/events', auth, requireRole('admin'), async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const query = `
      SELECT * FROM event_ticket_metrics
      ORDER BY event_created_at DESC
      LIMIT $1 OFFSET $2
    `

    const result = await db.query(query, [limit, offset])

    res.json({
      success: true,
      data: result.rows
    })
  } catch (error) {
    console.error('Error obteniendo métricas de eventos:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
