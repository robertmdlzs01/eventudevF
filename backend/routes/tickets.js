const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")
const QRCode = require("qrcode")

const router = express.Router()

// Get user tickets
router.get("/user/:userId", auth, async (req, res) => {
  try {
    // Check authorization
    if (req.user.userId !== Number.parseInt(req.params.userId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    const query = `
      SELECT 
        t.id as ticket_id,
        t.ticket_code,
        t.qr_code,
        t.status as ticket_status,
        t.used_at,
        t.created_at as ticket_created_at,
        s.id as sale_id,
        s.quantity,
        s.total_amount,
        s.status as sale_status,
        s.created_at as purchase_date,
        e.id as event_id,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        e.location as event_location,
        e.image_url as event_image,
        tt.name as ticket_type_name,
        tt.price as ticket_price
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.user_id = $1
      ORDER BY e.date DESC, t.created_at DESC
    `

    const result = await db.query(query, [req.params.userId])

    // Group tickets by sale
    const ticketsBySale = {}
    result.rows.forEach(row => {
      const saleId = row.sale_id
      if (!ticketsBySale[saleId]) {
        ticketsBySale[saleId] = {
          sale_id: saleId,
          event_id: row.event_id,
          event_title: row.event_title,
          event_date: row.event_date,
          event_time: row.event_time,
          event_venue: row.event_venue,
          event_location: row.event_location,
          event_image: row.event_image,
          ticket_type_name: row.ticket_type_name,
          ticket_price: row.ticket_price,
          quantity: row.quantity,
          total_amount: row.total_amount,
          sale_status: row.sale_status,
          purchase_date: row.purchase_date,
          tickets: []
        }
      }
      ticketsBySale[saleId].tickets.push({
        ticket_id: row.ticket_id,
        ticket_code: row.ticket_code,
        qr_code: row.qr_code,
        status: row.ticket_status,
        used_at: row.used_at,
        created_at: row.ticket_created_at
      })
    })

    const tickets = Object.values(ticketsBySale)

    res.json({
      success: true,
      data: tickets,
    })
  } catch (error) {
    console.error("Get user tickets error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Generate QR code for ticket
router.post("/generate-qr/:ticketId", auth, async (req, res) => {
  try {
    const { ticketId } = req.params
    const { forceRegenerate = false } = req.body

    // Get ticket info
    const ticketQuery = `
      SELECT 
        t.id,
        t.ticket_code,
        t.qr_code,
        t.status,
        s.user_id,
        e.date as event_date,
        e.time as event_time
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      WHERE t.id = $1
    `
    const ticketResult = await db.query(ticketQuery, [ticketId])
    
    if (!ticketResult.rows || ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    const ticket = ticketResult.rows[0]

    // Check authorization
    if (req.user.userId !== ticket.user_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    // Check if ticket is valid
    if (ticket.status !== "valid") {
      return res.status(400).json({
        success: false,
        message: "Ticket is not valid",
      })
    }

    const eventDateTime = new Date(`${ticket.event_date}T${ticket.event_time}`)
    const now = new Date()
    const hoursUntilEvent = (eventDateTime - now) / (1000 * 60 * 60)

    // Generate QR code based on time until event
    let qrData
    let qrCode

    if (hoursUntilEvent <= 24 && hoursUntilEvent > 0) {
      // Real QR code for event day (24 hours before)
      qrData = {
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        event_date: ticket.event_date,
        type: "entry",
        timestamp: new Date().toISOString()
      }
    } else {
      // Placeholder QR code for future events or past events
      qrData = {
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code,
        event_date: ticket.event_date,
        type: "placeholder",
        message: hoursUntilEvent > 24 
          ? "QR disponible 24 horas antes del evento"
          : "Evento ya finalizado",
        timestamp: new Date().toISOString()
      }
    }

    // Generate QR code
    try {
      qrCode = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        width: 256
      })
    } catch (qrError) {
      console.error("QR generation error:", qrError)
      return res.status(500).json({
        success: false,
        message: "Error generating QR code",
      })
    }

    // Update ticket with new QR code if needed
    if (!ticket.qr_code || forceRegenerate) {
      const updateQuery = `
        UPDATE tickets 
        SET qr_code = $1, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $2
      `
      await db.query(updateQuery, [qrCode, ticketId])
    }

    res.json({
      success: true,
      data: {
        qr_code: qrCode,
        qr_data: qrData,
        hours_until_event: hoursUntilEvent,
        is_real_qr: hoursUntilEvent <= 24 && hoursUntilEvent > 0
      },
    })
  } catch (error) {
    console.error("Generate QR error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Download ticket as PDF
router.get("/download/:ticketId", auth, async (req, res) => {
  try {
    const { ticketId } = req.params

    // Get ticket info
    const ticketQuery = `
      SELECT 
        t.id,
        t.ticket_code,
        s.user_id,
        s.buyer_name,
        s.buyer_email,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        e.location as event_location,
        tt.name as ticket_type_name,
        tt.price as ticket_price
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE t.id = $1
    `
    const ticketResult = await db.query(ticketQuery, [ticketId])
    
    if (!ticketResult.rows || ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    const ticket = ticketResult.rows[0]

    // Check authorization
    if (req.user.userId !== ticket.user_id && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      })
    }

    // For now, return ticket data as JSON
    // In a real implementation, you would generate a PDF
    res.json({
      success: true,
      data: {
        ticket_code: ticket.ticket_code,
        buyer_name: ticket.buyer_name,
        buyer_email: ticket.buyer_email,
        event_title: ticket.event_title,
        event_date: ticket.event_date,
        event_time: ticket.event_time,
        event_venue: ticket.event_venue,
        event_location: ticket.event_location,
        ticket_type: ticket.ticket_type_name,
        ticket_price: ticket.ticket_price,
        download_url: `/api/tickets/download/${ticketId}/pdf` // Placeholder for PDF download
      },
    })
  } catch (error) {
    console.error("Download ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// ===== ADMIN ROUTES =====

// Get all tickets (admin only)
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.ticket_code as ticket_number,
        t.qr_code,
        t.status,
        t.used_at,
        t.created_at as purchase_date,
        s.buyer_name as customer_name,
        s.buyer_email as customer_email,
        e.title as event_name,
        e.date as event_date,
        tt.name as ticket_type,
        tt.price,
        s.total_amount
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      ORDER BY t.created_at DESC
    `

    const result = await db.query(query)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get all tickets error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single ticket (admin only)
router.get("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.ticket_code as ticket_number,
        t.qr_code,
        t.status,
        t.used_at,
        t.created_at as purchase_date,
        s.buyer_name as customer_name,
        s.buyer_email as customer_email,
        e.title as event_name,
        e.date as event_date,
        tt.name as ticket_type,
        tt.price,
        s.total_amount
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE t.id = $1
    `

    const result = await db.query(query, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Get ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create ticket (admin only)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { sale_id, ticket_code, status = "valid" } = req.body

    if (!sale_id || !ticket_code) {
      return res.status(400).json({
        success: false,
        message: "Sale ID and ticket code are required",
      })
    }

    const query = `
      INSERT INTO tickets (sale_id, ticket_code, status)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await db.query(query, [sale_id, ticket_code, status])

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Create ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update ticket (admin only)
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { status, used_at } = req.body

    const query = `
      UPDATE tickets 
      SET status = COALESCE($1, status),
          used_at = COALESCE($2, used_at),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `

    const result = await db.query(query, [status, used_at, req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    res.json({
      success: true,
      message: "Ticket updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete ticket (admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM tickets WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    res.json({
      success: true,
      message: "Ticket deleted successfully",
    })
  } catch (error) {
    console.error("Delete ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Validate ticket (check-in) (admin only)
router.post("/:id/validate", auth, requireRole("admin"), async (req, res) => {
  try {
    const ticketId = req.params.id

    // Get ticket info
    const ticketQuery = `
      SELECT 
        t.id,
        t.status,
        t.used_at,
        e.date as event_date,
        e.time as event_time
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      WHERE t.id = $1
    `
    const ticketResult = await db.query(ticketQuery, [ticketId])
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    const ticket = ticketResult.rows[0]

    // Check if ticket is already used
    if (ticket.status === "used") {
      return res.status(400).json({
        success: false,
        message: "Ticket already used",
      })
    }

    // Check if ticket is valid
    if (ticket.status !== "valid") {
      return res.status(400).json({
        success: false,
        message: "Ticket is not valid",
      })
    }

    // Update ticket as used
    const updateQuery = `
      UPDATE tickets 
      SET status = 'used', 
          used_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1
      RETURNING *
    `
    await db.query(updateQuery, [ticketId])

    res.json({
      success: true,
      message: "Ticket validated successfully",
      data: {
        ticket_id: ticketId,
        validated_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Validate ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Resend ticket email (admin only)
router.post("/:id/resend", auth, requireRole("admin"), async (req, res) => {
  try {
    const ticketId = req.params.id

    // Get ticket info
    const ticketQuery = `
      SELECT 
        t.id,
        s.buyer_email,
        s.buyer_name,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time
      FROM tickets t
      JOIN sales s ON t.sale_id = s.id
      JOIN events e ON s.event_id = e.id
      WHERE t.id = $1
    `
    const ticketResult = await db.query(ticketQuery, [ticketId])
    
    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      })
    }

    const ticket = ticketResult.rows[0]

    // In a real implementation, you would send an email here
    // For now, we'll just return success
    res.json({
      success: true,
      message: "Ticket email sent successfully",
      data: {
        ticket_id: ticketId,
        email_sent_to: ticket.buyer_email,
        sent_at: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("Resend ticket error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Resend tickets by email
router.post("/resend", auth, async (req, res) => {
  try {
    const { ticketId, saleId } = req.body
    const userId = req.user.userId

    if (!ticketId && !saleId) {
      return res.status(400).json({
        success: false,
        message: "Either ticketId or saleId is required"
      })
    }

    let query, params

    if (saleId) {
      // Resend all tickets for a sale
      query = `
        SELECT 
          t.id as ticket_id,
          t.ticket_code,
          t.qr_code,
          t.status as ticket_status,
          s.buyer_name,
          s.buyer_email,
          s.quantity,
          s.total_amount,
          s.created_at as purchase_date,
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
        WHERE s.id = $1 AND s.user_id = $2
      `
      params = [saleId, userId]
    } else {
      // Resend specific ticket
      query = `
        SELECT 
          t.id as ticket_id,
          t.ticket_code,
          t.qr_code,
          t.status as ticket_status,
          s.buyer_name,
          s.buyer_email,
          s.quantity,
          s.total_amount,
          s.created_at as purchase_date,
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
        WHERE t.id = $1 AND s.user_id = $2
      `
      params = [ticketId, userId]
    }

    const result = await db.query(query, params)

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tickets not found or not authorized"
      })
    }

    const tickets = result.rows

    // In production, you would send actual emails here
    // For now, we'll simulate the email sending
    const emailData = {
      to: tickets[0].buyer_email,
      subject: `Boletos para ${tickets[0].event_name}`,
      tickets: tickets,
      sentAt: new Date().toISOString()
    }

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    res.json({
      success: true,
      message: `Se han reenviado ${tickets.length} boleto(s) a ${tickets[0].buyer_email}`,
      data: {
        emailSent: true,
        recipient: tickets[0].buyer_email,
        ticketsCount: tickets.length,
        eventName: tickets[0].event_name
      }
    })

  } catch (error) {
    console.error("Resend tickets error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

module.exports = router
