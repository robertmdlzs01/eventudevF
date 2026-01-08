const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Validar ticket por código o QR
router.post("/validate", auth, async (req, res) => {
  try {
    const { ticketCode, ticketId, eventId, gate } = req.body

    if (!ticketCode && !ticketId) {
      return res.status(400).json({
        success: false,
        message: "Código de ticket o ID de ticket es requerido",
      })
    }

    // Obtener información del ticket
    let ticketQuery = `
      SELECT 
        t.id,
        t.ticket_code,
        t.qr_code,
        t.status as ticket_status,
        t.used_at,
        s.id as sale_id,
        s.buyer_name,
        s.buyer_email,
        s.status as sale_status,
        e.id as event_id,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        tt.name as ticket_type_name,
        tt.price as ticket_price
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE `
    
    const params = []
    let paramIndex = 1

    if (ticketId) {
      ticketQuery += `t.id = $${paramIndex}`
      params.push(ticketId)
    } else if (ticketCode) {
      ticketQuery += `(t.ticket_code = $${paramIndex} OR t.qr_code = $${paramIndex})`
      params.push(ticketCode)
    }

    // Si se especifica eventId, validar que el ticket pertenece al evento
    if (eventId) {
      paramIndex++
      ticketQuery += ` AND e.id = $${paramIndex}`
      params.push(eventId)
    }

    const ticketResult = await db.query(ticketQuery, params)

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket no encontrado",
        code: "TICKET_NOT_FOUND"
      })
    }

    const ticket = ticketResult.rows[0]

    // Verificar si el ticket ya fue usado
    if (ticket.ticket_status === "used" || ticket.used_at) {
      // Verificar si ya existe un registro de check-in
      const checkInQuery = `
        SELECT * FROM check_in_records
        WHERE ticket_id = $1
        ORDER BY check_in_time DESC
        LIMIT 1
      `
      const checkInResult = await db.query(checkInQuery, [ticket.id])
      
      return res.status(400).json({
        success: false,
        message: "Ticket ya utilizado",
        code: "TICKET_ALREADY_USED",
        data: {
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            event_name: ticket.event_name,
            customer_name: ticket.buyer_name,
            used_at: ticket.used_at,
            previous_check_in: checkInResult.rows[0] || null
          }
        }
      })
    }

    // Verificar si la venta está completada
    if (ticket.sale_status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Ticket inválido - venta no completada",
        code: "SALE_NOT_COMPLETED"
      })
    }

    // Verificar si el evento ya pasó (opcional - depende de la lógica de negocio)
    const eventDate = new Date(ticket.event_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      return res.status(400).json({
        success: false,
        message: "El evento ya pasó",
        code: "EVENT_EXPIRED"
      })
    }

    // Ticket válido - retornar información
    res.json({
      success: true,
      message: "Ticket válido",
      data: {
        ticket: {
          id: ticket.id,
          ticket_code: ticket.ticket_code,
          event_id: ticket.event_id,
          event_name: ticket.event_name,
          event_date: ticket.event_date,
          event_time: ticket.event_time,
          event_venue: ticket.event_venue,
          customer_name: ticket.buyer_name,
          customer_email: ticket.buyer_email,
          ticket_type: ticket.ticket_type_name,
          price: ticket.ticket_price,
          status: ticket.ticket_status
        }
      }
    })
  } catch (error) {
    console.error("Error validando ticket:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Registrar check-in
router.post("/", auth, async (req, res) => {
  try {
    const { ticketId, ticketCode, eventId, gate, operator_name, operator_id } = req.body

    if (!ticketId && !ticketCode) {
      return res.status(400).json({
        success: false,
        message: "ID o código de ticket es requerido",
      })
    }

    const userId = req.user?.userId || operator_id || null
    const operatorName = operator_name || req.user?.name || "Sistema"

    // Obtener ticket
    let ticketQuery = `
      SELECT 
        t.id,
        t.ticket_code,
        t.status,
        t.used_at,
        s.id as sale_id,
        s.buyer_name,
        e.id as event_id,
        e.title as event_name
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      WHERE `
    
    const params = []
    if (ticketId) {
      ticketQuery += `t.id = $1`
      params.push(ticketId)
    } else {
      ticketQuery += `(t.ticket_code = $1 OR t.qr_code = $1)`
      params.push(ticketCode)
    }

    if (eventId) {
      params.push(eventId)
      ticketQuery += ` AND e.id = $${params.length}`
    }

    const ticketResult = await db.query(ticketQuery, params)

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket no encontrado",
      })
    }

    const ticket = ticketResult.rows[0]

    // Verificar si ya fue usado
    if (ticket.status === "used" || ticket.used_at) {
      // Verificar si ya existe registro de check-in
      const existingCheckIn = await db.query(
        `SELECT * FROM check_in_records WHERE ticket_id = $1 ORDER BY check_in_time DESC LIMIT 1`,
        [ticket.id]
      )

      return res.status(400).json({
        success: false,
        message: "Ticket ya utilizado",
        code: "TICKET_ALREADY_USED",
        data: {
          previous_check_in: existingCheckIn.rows[0] || null
        }
      })
    }

    // Iniciar transacción
    await db.query("BEGIN")

    try {
      // Actualizar ticket como usado
      await db.query(
        `UPDATE tickets 
         SET status = 'used', 
             used_at = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [ticket.id]
      )

      // Crear registro de check-in
      const checkInQuery = `
        INSERT INTO check_in_records (
          ticket_id, sale_id, event_id, gate, 
          operator_id, operator_name, check_in_time
        )
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const checkInResult = await db.query(checkInQuery, [
        ticket.id,
        ticket.sale_id,
        ticket.event_id,
        gate || "Principal",
        userId,
        operatorName
      ])

      await db.query("COMMIT")

      res.json({
        success: true,
        message: "Check-in registrado exitosamente",
        data: {
          check_in: checkInResult.rows[0],
          ticket: {
            id: ticket.id,
            ticket_code: ticket.ticket_code,
            event_name: ticket.event_name,
            customer_name: ticket.buyer_name
          }
        }
      })
    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Error registrando check-in:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Obtener check-ins por evento
router.get("/event/:eventId", auth, async (req, res) => {
  try {
    const { eventId } = req.params
    const { limit = 100, offset = 0, gate, startDate, endDate } = req.query

    let whereClause = "WHERE cir.event_id = $1"
    const params = [eventId]
    let paramIndex = 2

    if (gate && gate !== "all") {
      whereClause += ` AND cir.gate = $${paramIndex}`
      params.push(gate)
      paramIndex++
    }

    if (startDate) {
      whereClause += ` AND cir.check_in_time >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND cir.check_in_time <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    const query = `
      SELECT 
        cir.id,
        cir.ticket_id,
        cir.sale_id,
        cir.event_id,
        cir.gate,
        cir.operator_id,
        cir.operator_name,
        cir.check_in_time,
        t.ticket_code,
        t.status as ticket_status,
        s.buyer_name,
        s.buyer_email,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        tt.name as ticket_type_name
      FROM check_in_records cir
      JOIN tickets t ON cir.ticket_id = t.id
      JOIN sales s ON cir.sale_id = s.id
      JOIN events e ON cir.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      ${whereClause}
      ORDER BY cir.check_in_time DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(parseInt(limit), parseInt(offset))

    const result = await db.query(query, params)

    // Obtener total para paginación
    const countQuery = `
      SELECT COUNT(*) as total
      FROM check_in_records cir
      ${whereClause}
    `
    const countParams = params.slice(0, -2) // Remover limit y offset
    const countResult = await db.query(countQuery, countParams)

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id.toString(),
        ticketNumber: row.ticket_code,
        eventName: row.event_name,
        customerName: row.buyer_name,
        customerEmail: row.buyer_email,
        ticketType: row.ticket_type_name,
        checkInTime: row.check_in_time,
        gate: row.gate,
        status: "checked-in",
        operator: row.operator_name || "Sistema"
      })),
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    })
  } catch (error) {
    console.error("Error obteniendo check-ins:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Obtener estadísticas de check-in por evento
router.get("/event/:eventId/stats", auth, async (req, res) => {
  try {
    const { eventId } = req.params

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_tickets_sold,
        COUNT(DISTINCT cir.id) as total_checked_in,
        COUNT(DISTINCT CASE WHEN t.status = 'used' THEN t.id END) as total_used,
        COUNT(DISTINCT CASE WHEN t.status = 'valid' THEN t.id END) as total_pending
      FROM sales s
      JOIN tickets t ON t.sale_id = s.id
      LEFT JOIN check_in_records cir ON cir.ticket_id = t.id
      WHERE s.event_id = $1 AND s.status = 'completed'
    `

    const statsResult = await db.query(statsQuery, [eventId])

    // Check-ins por puerta
    const gatesQuery = `
      SELECT 
        cir.gate,
        COUNT(*) as count
      FROM check_in_records cir
      WHERE cir.event_id = $1
      GROUP BY cir.gate
      ORDER BY count DESC
    `

    const gatesResult = await db.query(gatesQuery, [eventId])

    // Check-ins por hora
    const hourlyQuery = `
      SELECT 
        DATE_TRUNC('hour', cir.check_in_time) as hour,
        COUNT(*) as count
      FROM check_in_records cir
      WHERE cir.event_id = $1
      GROUP BY DATE_TRUNC('hour', cir.check_in_time)
      ORDER BY hour
    `

    const hourlyResult = await db.query(hourlyQuery, [eventId])

    const stats = statsResult.rows[0]

    res.json({
      success: true,
      data: {
        total_tickets_sold: parseInt(stats.total_tickets_sold) || 0,
        total_checked_in: parseInt(stats.total_checked_in) || 0,
        total_used: parseInt(stats.total_used) || 0,
        total_pending: parseInt(stats.total_pending) || 0,
        check_in_rate: stats.total_tickets_sold > 0 
          ? ((parseInt(stats.total_checked_in) / parseInt(stats.total_tickets_sold)) * 100).toFixed(2)
          : 0,
        by_gate: gatesResult.rows.map(row => ({
          gate: row.gate,
          count: parseInt(row.count)
        })),
        by_hour: hourlyResult.rows.map(row => ({
          hour: row.hour,
          count: parseInt(row.count)
        }))
      }
    })
  } catch (error) {
    console.error("Error obteniendo estadísticas:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

// Check-in masivo (por código de venta o múltiples tickets)
router.post("/bulk", auth, requireRole("admin"), async (req, res) => {
  try {
    const { saleId, ticketIds, eventId, gate, operator_name } = req.body

    if (!saleId && (!ticketIds || ticketIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "ID de venta o lista de tickets es requerido",
      })
    }

    const operatorName = operator_name || req.user?.name || "Sistema"
    const userId = req.user?.userId || null

    let ticketIdsList = []

    if (saleId) {
      // Obtener todos los tickets de la venta
      const ticketsQuery = `
        SELECT t.id 
        FROM tickets t
        JOIN sales s ON t.sale_id = s.id
        WHERE s.id = $1 AND t.status = 'valid'
      `
      const ticketsResult = await db.query(ticketsQuery, [saleId])
      ticketIdsList = ticketsResult.rows.map(row => row.id)
    } else {
      ticketIdsList = ticketIds
    }

    if (ticketIdsList.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No hay tickets válidos para check-in",
      })
    }

    await db.query("BEGIN")

    try {
      const checkIns = []
      const errors = []

      for (const ticketId of ticketIdsList) {
        try {
          // Verificar ticket
          const ticketResult = await db.query(
            `SELECT t.*, s.id as sale_id, s.event_id 
             FROM tickets t
             JOIN sales s ON t.sale_id = s.id
             WHERE t.id = $1`,
            [ticketId]
          )

          if (ticketResult.rows.length === 0) {
            errors.push({ ticketId, error: "Ticket no encontrado" })
            continue
          }

          const ticket = ticketResult.rows[0]

          if (ticket.status === "used") {
            errors.push({ ticketId, error: "Ticket ya usado" })
            continue
          }

          // Actualizar ticket
          await db.query(
            `UPDATE tickets 
             SET status = 'used', used_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
             WHERE id = $1`,
            [ticketId]
          )

          // Crear registro de check-in
          const checkInResult = await db.query(
            `INSERT INTO check_in_records (
               ticket_id, sale_id, event_id, gate, operator_id, operator_name, check_in_time
             )
             VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
             RETURNING *`,
            [
              ticketId,
              ticket.sale_id,
              ticket.event_id || eventId,
              gate || "Principal",
              userId,
              operatorName
            ]
          )

          checkIns.push(checkInResult.rows[0])
        } catch (error) {
          errors.push({ ticketId, error: error.message })
        }
      }

      await db.query("COMMIT")

      res.json({
        success: true,
        message: `Check-in completado: ${checkIns.length} exitosos, ${errors.length} errores`,
        data: {
          successful: checkIns.length,
          failed: errors.length,
          check_ins: checkIns,
          errors: errors
        }
      })
    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Error en check-in masivo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    })
  }
})

module.exports = router
