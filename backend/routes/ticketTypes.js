const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Get all ticket types
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        tt.*,
        e.title as event_title
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      ORDER BY tt.name ASC
    `

    const result = await db.query(query)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get ticket types error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get ticket types by event
router.get("/event/:eventId", async (req, res) => {
  try {
    const query = `
      SELECT 
        tt.*,
        e.title as event_title
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      WHERE tt.event_id = $1
      ORDER BY tt.created_at ASC
    `

    const result = await db.query(query, [req.params.eventId])

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get ticket types by event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single ticket type
router.get("/:id", async (req, res) => {
  try {
    const query = `
      SELECT 
        tt.*,
        e.title as event_title
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      WHERE tt.id = $1
    `

    const result = await db.query(query, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket type not found",
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Get ticket type error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create ticket type (admin only)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, is_default } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      })
    }

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query("UPDATE ticket_types SET is_default = false")
    }

    const query = `
      INSERT INTO ticket_types (name, description, is_default)
      VALUES ($1, $2, $3)
      RETURNING *
    `

    const result = await db.query(query, [name, description, is_default || false])

    res.status(201).json({
      success: true,
      message: "Ticket type created successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Create ticket type error:", error)

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Ticket type name already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create ticket type for specific event (admin/organizer only)
router.post("/event/:eventId", auth, requireRole(["admin", "organizer"]), async (req, res) => {
  try {
    const { name, description, price, quantity, max_per_order, sale_start, sale_end, status } = req.body
    const eventId = req.params.eventId

    if (!name || !price || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Name, price, and quantity are required",
      })
    }

    // Verify event exists and user has permission
    const eventCheck = await db.query(`
      SELECT id, organizer_id FROM events WHERE id = $1
    `, [eventId])

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    const event = eventCheck.rows[0]
    
    // Check if user is admin or the event organizer
    if (req.user.role !== "admin" && event.organizer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to create ticket types for this event",
      })
    }

    const query = `
      INSERT INTO ticket_types (
        event_id, name, description, price, quantity, max_per_order, 
        sale_start, sale_end, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `

    const result = await db.query(query, [
      eventId,
      name,
      description || '',
      price,
      quantity,
      max_per_order || null,
      sale_start || null,
      sale_end || null,
      status || 'active'
    ])

    res.status(201).json({
      success: true,
      message: "Ticket type created successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Create ticket type for event error:", error)

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid event ID",
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update ticket type (admin only)
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, is_default } = req.body

    // If this is set as default, unset other defaults
    if (is_default) {
      await db.query("UPDATE ticket_types SET is_default = false WHERE id != $1", [req.params.id])
    }

    const query = `
      UPDATE ticket_types 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          is_default = COALESCE($3, is_default),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `

    const result = await db.query(query, [name, description, is_default, req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket type not found",
      })
    }

    res.json({
      success: true,
      message: "Ticket type updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update ticket type error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update ticket type for specific event (admin/organizer only)
router.put("/event/:id", auth, requireRole(["admin", "organizer"]), async (req, res) => {
  try {
    const { name, description, price, quantity, max_per_order, sale_start, sale_end, status } = req.body
    const ticketTypeId = req.params.id

    // Get ticket type and verify permissions
    const ticketTypeCheck = await db.query(`
      SELECT tt.*, e.organizer_id 
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      WHERE tt.id = $1
    `, [ticketTypeId])

    if (ticketTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket type not found",
      })
    }

    const ticketType = ticketTypeCheck.rows[0]
    
    // Check if user is admin or the event organizer
    if (req.user.role !== "admin" && ticketType.organizer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this ticket type",
      })
    }

    const query = `
      UPDATE ticket_types 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          price = COALESCE($3, price),
          quantity = COALESCE($4, quantity),
          max_per_order = COALESCE($5, max_per_order),
          sale_start = COALESCE($6, sale_start),
          sale_end = COALESCE($7, sale_end),
          status = COALESCE($8, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `

    const result = await db.query(query, [
      name,
      description,
      price,
      quantity,
      max_per_order,
      sale_start,
      sale_end,
      status,
      ticketTypeId
    ])

    res.json({
      success: true,
      message: "Ticket type updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update ticket type for event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete ticket type (admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM ticket_types WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket type not found",
      })
    }

    res.json({
      success: true,
      message: "Ticket type deleted successfully",
    })
  } catch (error) {
    console.error("Delete ticket type error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete ticket type for specific event (admin/organizer only)
router.delete("/event/:id", auth, requireRole(["admin", "organizer"]), async (req, res) => {
  try {
    const ticketTypeId = req.params.id

    // Get ticket type and verify permissions
    const ticketTypeCheck = await db.query(`
      SELECT tt.*, e.organizer_id 
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      WHERE tt.id = $1
    `, [ticketTypeId])

    if (ticketTypeCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ticket type not found",
      })
    }

    const ticketType = ticketTypeCheck.rows[0]
    
    // Check if user is admin or the event organizer
    if (req.user.role !== "admin" && ticketType.organizer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this ticket type",
      })
    }

    const result = await db.query("DELETE FROM ticket_types WHERE id = $1 RETURNING *", [ticketTypeId])

    res.json({
      success: true,
      message: "Ticket type deleted successfully",
    })
  } catch (error) {
    console.error("Delete ticket type for event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
