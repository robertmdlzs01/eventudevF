const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")
const QRCode = require("qrcode")

const router = express.Router()

// Get all sales/transactions (admin only)
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { search = '', status = '', payment_method = '' } = req.query
    
    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (
        s.buyer_name ILIKE $${paramIndex} OR 
        s.buyer_email ILIKE $${paramIndex} OR 
        e.title ILIKE $${paramIndex} OR 
        tt.name ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND s.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (payment_method) {
      whereClause += ` AND s.payment_method = $${paramIndex}`
      params.push(payment_method)
      paramIndex++
    }

    const query = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.status,
        s.payment_method,
        s.payment_reference,
        s.created_at as transaction_date,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        tt.name as ticket_type_name,
        tt.price as ticket_price,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM sales s
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      LEFT JOIN users u ON s.user_id = u.id
      ${whereClause}
      ORDER BY s.created_at DESC
    `

    const result = await db.query(query, params)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get sales error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get sales by user
router.get("/user/:userId", auth, async (req, res) => {
  try {
    const { userId } = req.params

    // Check authorization
    if (req.user.userId !== Number.parseInt(userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const query = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.status,
        s.transaction_type,
        s.payment_method,
        s.failure_reason,
        s.abandoned_at,
        s.created_at as transaction_date,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        tt.name as ticket_type_name,
        tt.price as ticket_price,
        s.session_id,
        s.ip_address
      FROM sales s
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC
    `

    const result = await db.query(query, [userId])

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get user sales error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Record cart abandonment
router.post("/cart-abandonment", auth, async (req, res) => {
  try {
    const { 
      event_id, 
      ticket_type_id, 
      quantity, 
      buyer_name, 
      buyer_email, 
      total_amount,
      session_id,
      ip_address,
      user_agent,
      abandonment_reason
    } = req.body

    if (!event_id || !ticket_type_id || !quantity || !buyer_name || !buyer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    const query = `
      INSERT INTO sales (
        user_id, event_id, ticket_type_id, quantity, 
        buyer_name, buyer_email, total_amount, 
        status, transaction_type, session_id, ip_address, user_agent,
        abandonment_reason, abandoned_at, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'abandoned', 'cart_abandonment', $8, $9, $10, $11, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    const result = await db.query(query, [
      req.user.userId,
      event_id,
      ticket_type_id,
      quantity,
      buyer_name,
      buyer_email,
      total_amount,
      session_id,
      ip_address,
      user_agent,
      abandonment_reason
    ])

    res.json({
      success: true,
      message: "Cart abandonment recorded",
      data: result.rows[0]
    })

  } catch (error) {
    console.error("Record cart abandonment error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Record payment attempt
router.post("/payment-attempt", auth, async (req, res) => {
  try {
    const { 
      event_id, 
      ticket_type_id, 
      quantity, 
      buyer_name, 
      buyer_email, 
      total_amount,
      payment_method,
      session_id,
      ip_address,
      user_agent,
      payment_gateway,
      gateway_transaction_id
    } = req.body

    if (!event_id || !ticket_type_id || !quantity || !buyer_name || !buyer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    const query = `
      INSERT INTO sales (
        user_id, event_id, ticket_type_id, quantity, 
        buyer_name, buyer_email, total_amount, 
        payment_method, status, transaction_type, session_id, ip_address, user_agent,
        payment_gateway, gateway_transaction_id, created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'payment_attempt', $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
      RETURNING *
    `

    const result = await db.query(query, [
      req.user.userId,
      event_id,
      ticket_type_id,
      quantity,
      buyer_name,
      buyer_email,
      total_amount,
      payment_method,
      session_id,
      ip_address,
      user_agent,
      payment_gateway,
      gateway_transaction_id
    ])

    res.json({
      success: true,
      message: "Payment attempt recorded",
      data: result.rows[0]
    })

  } catch (error) {
    console.error("Record payment attempt error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Update payment attempt status
router.put("/payment-attempt/:saleId", auth, async (req, res) => {
  try {
    const { saleId } = req.params
    const { status, failure_reason, gateway_response } = req.body

    const updateQuery = `
      UPDATE sales 
      SET 
        status = $1,
        failure_reason = $2,
        gateway_response = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4 AND transaction_type = 'payment_attempt'
      RETURNING *
    `

    const result = await db.query(updateQuery, [status, failure_reason, gateway_response, saleId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment attempt not found",
      })
    }

    const sale = result.rows[0]

    // If payment was successful, generate tickets
    if (status === 'completed') {
      // Start transaction
      await db.query("BEGIN")

      try {
        // Update ticket type sold count
        await db.query(
          "UPDATE ticket_types SET sold = sold + $1 WHERE id = $2",
          [sale.quantity, sale.ticket_type_id]
        )

        // Generate virtual tickets
        const tickets = []
        for (let i = 0; i < sale.quantity; i++) {
          const ticketCode = `VT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
          
          const ticketQuery = `
            INSERT INTO tickets (
              sale_id, ticket_code, status, created_at
            )
            VALUES ($1, $2, 'valid', CURRENT_TIMESTAMP)
            RETURNING *
          `
          
          const ticketResult = await db.query(ticketQuery, [sale.id, ticketCode])
          const ticket = ticketResult.rows[0]

          // Generate QR code for ticket
          const qrData = {
            ticket_id: ticket.id,
            ticket_code: ticket.ticket_code,
            event_id: sale.event_id,
            type: "virtual",
            timestamp: new Date().toISOString()
          }

          const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
            errorCorrectionLevel: 'M',
            type: 'image/png',
            quality: 0.92,
            margin: 1,
            width: 256
          })

          // Update ticket with QR code
          await db.query(
            "UPDATE tickets SET qr_code = $1 WHERE id = $2",
            [qrCode, ticket.id]
          )

          tickets.push({
            ...ticket,
            qr_code: qrCode
          })
        }

        await db.query("COMMIT")

        res.json({
          success: true,
          message: "Payment completed and tickets generated",
          data: {
            sale: sale,
            tickets: tickets,
            total_tickets: tickets.length
          }
        })

      } catch (error) {
        await db.query("ROLLBACK")
        throw error
      }
    } else {
      res.json({
        success: true,
        message: `Payment ${status}`,
        data: sale
      })
    }

  } catch (error) {
    console.error("Update payment attempt error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Create sale and generate virtual tickets (legacy - for direct sales)
router.post("/", auth, async (req, res) => {
  try {
    const { 
      event_id, 
      ticket_type_id, 
      quantity, 
      buyer_name, 
      buyer_email, 
      total_amount,
      payment_method = "online",
      seat_ids = null,
      session_id,
      ip_address,
      user_agent
    } = req.body

    if (!event_id || !ticket_type_id || !quantity || !buyer_name || !buyer_email || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      })
    }

    // Start transaction
    await db.query("BEGIN")

    try {
      // Check ticket availability
      const availabilityQuery = `
        SELECT 
          tt.quantity as total_quantity,
          tt.sold,
          (tt.quantity - tt.sold) as available
        FROM ticket_types tt
        WHERE tt.id = $1 AND tt.event_id = $2
      `
      const availabilityResult = await db.query(availabilityQuery, [ticket_type_id, event_id])
      
      if (availabilityResult.rows.length === 0) {
        throw new Error("Ticket type not found")
      }

      const ticketType = availabilityResult.rows[0]
      
      if (ticketType.available < quantity) {
        throw new Error(`Only ${ticketType.available} tickets available`)
      }

      // Create sale record
      const saleQuery = `
        INSERT INTO sales (
          user_id, event_id, ticket_type_id, quantity, 
          buyer_name, buyer_email, total_amount, 
          payment_method, status, transaction_type, session_id, ip_address, user_agent, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', 'direct_sale', $9, $10, $11, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const saleResult = await db.query(saleQuery, [
        req.user.userId,
        event_id,
        ticket_type_id,
        quantity,
        buyer_name,
        buyer_email,
        total_amount,
        payment_method,
        session_id,
        ip_address,
        user_agent
      ])

      const sale = saleResult.rows[0]

      // Update ticket type sold count
      await db.query(
        "UPDATE ticket_types SET sold = sold + $1 WHERE id = $2",
        [quantity, ticket_type_id]
      )

      // Generate virtual tickets
      const tickets = []
      for (let i = 0; i < quantity; i++) {
        const ticketCode = `VT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
        
        const ticketQuery = `
          INSERT INTO tickets (
            sale_id, ticket_code, status, created_at
          )
          VALUES ($1, $2, 'valid', CURRENT_TIMESTAMP)
          RETURNING *
        `
        
        const ticketResult = await db.query(ticketQuery, [sale.id, ticketCode])
        const ticket = ticketResult.rows[0]

        // Generate QR code for ticket
        const qrData = {
          ticket_id: ticket.id,
          ticket_code: ticket.ticket_code,
          event_id: event_id,
          type: "virtual",
          timestamp: new Date().toISOString()
        }

        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
          errorCorrectionLevel: 'M',
          type: 'image/png',
          quality: 0.92,
          margin: 1,
          width: 256
        })

        // Update ticket with QR code
        await db.query(
          "UPDATE tickets SET qr_code = $1 WHERE id = $2",
          [qrCode, ticket.id]
        )

        tickets.push({
          ...ticket,
          qr_code: qrCode
        })
      }

      // If seats are involved, mark them as occupied
      if (seat_ids && seat_ids.length > 0) {
        await db.query(
          "UPDATE seats SET status = 'occupied', occupied_by = $1, occupied_at = CURRENT_TIMESTAMP WHERE id = ANY($2)",
          [req.user.userId, seat_ids]
        )
      }

      await db.query("COMMIT")

      res.json({
        success: true,
        message: "Sale completed and virtual tickets generated",
        data: {
          sale: sale,
          tickets: tickets,
          total_tickets: tickets.length
        }
      })

    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }

  } catch (error) {
    console.error("Create sale error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Get sale details with tickets
router.get("/:saleId", auth, async (req, res) => {
  try {
    const { saleId } = req.params

    const query = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.status,
        s.transaction_type,
        s.payment_method,
        s.failure_reason,
        s.abandonment_reason,
        s.gateway_response,
        s.session_id,
        s.ip_address,
        s.user_agent,
        s.created_at as transaction_date,
        s.abandoned_at,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        e.location as event_location,
        tt.name as ticket_type_name,
        tt.price as ticket_price,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM sales s
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `

    const saleResult = await db.query(query, [saleId])
    
    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sale not found",
      })
    }

    const sale = saleResult.rows[0]

    // Get tickets for this sale (only if completed)
    let tickets = []
    if (sale.status === 'completed') {
      const ticketsQuery = `
        SELECT 
          id,
          ticket_code,
          qr_code,
          status,
          used_at,
          created_at
        FROM tickets
        WHERE sale_id = $1
        ORDER BY created_at
      `

      const ticketsResult = await db.query(ticketsQuery, [saleId])
      tickets = ticketsResult.rows
    }

    res.json({
      success: true,
      data: {
        ...sale,
        tickets: tickets
      }
    })

  } catch (error) {
    console.error("Get sale error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Cancel sale and refund tickets
router.put("/:saleId/cancel", auth, async (req, res) => {
  try {
    const { saleId } = req.params
    const { reason } = req.body

    // Start transaction
    await db.query("BEGIN")

    try {
      // Get sale details
      const saleQuery = `
        SELECT 
          s.id,
          s.event_id,
          s.ticket_type_id,
          s.quantity,
          s.status,
          s.user_id
        FROM sales s
        WHERE s.id = $1
      `
      const saleResult = await db.query(saleQuery, [saleId])
      
      if (saleResult.rows.length === 0) {
        throw new Error("Sale not found")
      }

      const sale = saleResult.rows[0]

      // Check authorization
      if (req.user.userId !== sale.user_id && req.user.role !== "admin") {
        throw new Error("Not authorized")
      }

      if (sale.status === 'cancelled') {
        throw new Error("Sale already cancelled")
      }

      // Update sale status
      await db.query(
        "UPDATE sales SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP WHERE id = $1",
        [saleId]
      )

      // Cancel all tickets (only if they exist)
      await db.query(
        "UPDATE tickets SET status = 'cancelled' WHERE sale_id = $1",
        [saleId]
      )

      // Update ticket type sold count (only if it was a completed sale)
      if (sale.status === 'completed') {
        await db.query(
          "UPDATE ticket_types SET sold = sold - $1 WHERE id = $2",
          [sale.quantity, sale.ticket_type_id]
        )
      }

      await db.query("COMMIT")

      res.json({
        success: true,
        message: "Sale cancelled successfully",
        data: {
          sale_id: saleId,
          cancelled_at: new Date()
        }
      })

    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }

  } catch (error) {
    console.error("Cancel sale error:", error)
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    })
  }
})

// Get sales statistics
router.get("/stats/overview", auth, requireRole("admin"), async (req, res) => {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sales,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_sales,
        COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_sales,
        SUM(CASE WHEN status = 'completed' THEN total_amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN status = 'completed' THEN total_amount ELSE NULL END) as average_sale,
        COUNT(DISTINCT user_id) as unique_customers,
        COUNT(DISTINCT event_id) as events_with_sales
      FROM sales
    `

    const statsResult = await db.query(statsQuery)
    const stats = statsResult.rows[0]

    // Get recent transactions
    const recentTransactionsQuery = `
      SELECT 
        s.id,
        s.buyer_name,
        s.total_amount,
        s.status,
        s.payment_method,
        s.created_at,
        e.title as event_name
      FROM sales s
      JOIN events e ON s.event_id = e.id
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    const recentTransactionsResult = await db.query(recentTransactionsQuery)
    const recentTransactions = recentTransactionsResult.rows

    // Get conversion rates
    const conversionQuery = `
      SELECT 
        ROUND(
          (COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as conversion_rate,
        ROUND(
          (COUNT(CASE WHEN status = 'cancelled' THEN 1 END) * 100.0 / COUNT(*)), 2
        ) as cancellation_rate
      FROM sales
    `

    const conversionResult = await db.query(conversionQuery)
    const conversion = conversionResult.rows[0]

    res.json({
      success: true,
      data: {
        stats: stats,
        recent_transactions: recentTransactions,
        conversion: conversion
      }
    })

  } catch (error) {
    console.error("Get sales stats error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get sales invoice/download
router.get("/:id/invoice", auth, async (req, res) => {
  try {
    const { id } = req.params
    const userId = req.user.userId

    // Get sale details
    const saleQuery = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.status,
        s.payment_method,
        s.created_at as purchase_date,
        e.title as event_name,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        tt.name as ticket_type_name,
        tt.price as ticket_price
      FROM sales s
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.id = $1 AND s.user_id = $2
    `

    const result = await db.query(saleQuery, [id, userId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sale not found or not authorized"
      })
    }

    const sale = result.rows[0]

    // Generate invoice data (in production, you would generate a PDF)
    const invoiceData = {
      invoiceNumber: `INV-${sale.id}-${new Date().getFullYear()}`,
      sale: sale,
      company: {
        name: "Eventu - Plataforma de Eventos",
        nit: "900.123.456-7",
        address: "Calle 123 #45-67, Bogotá",
        phone: "+57 (1) 234-5678"
      },
      generatedAt: new Date().toISOString()
    }

    res.json({
      success: true,
      data: invoiceData
    })

  } catch (error) {
    console.error("Get invoice error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

module.exports = router
