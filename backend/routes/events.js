const express = require("express")
const Event = require("../models/Event")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Get all events (public)
router.get("/", async (req, res) => {
  try {
    const filters = {
      status: "active",
      ...req.query,
    }

    const events = await Event.findAll(filters)

    res.json({
      success: true,
      data: events.map((event) => event.toJSON()),
    })
  } catch (error) {
    console.error("Get events error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get featured events (public)
router.get("/featured", async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit) || 6
    const events = await Event.getFeatured(limit)

    res.json({
      success: true,
      data: events.map((event) => event.toJSON()),
    })
  } catch (error) {
    console.error("Get featured events error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single event (public)
router.get("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    res.json({
      success: true,
      data: event.toJSON(),
    })
  } catch (error) {
    console.error("Get event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create event (organizers and admins)
router.post("/", auth, requireRole(["organizer", "admin"]), async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      organizer_id: req.user.role === "admin" ? req.body.organizer_id : req.user.userId,
    }

    const event = await Event.create(eventData)

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      data: event.toJSON(),
    })
  } catch (error) {
    console.error("Create event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update event (organizers and admins)
router.put("/:id", auth, requireRole(["organizer", "admin"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user owns the event or is admin
    if (req.user.role !== "admin" && event.organizer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this event",
      })
    }

    const updatedEvent = await event.update(req.body)

    res.json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent.toJSON(),
    })
  } catch (error) {
    console.error("Update event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete event (organizers and admins)
router.delete("/:id", auth, requireRole(["organizer", "admin"]), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Check if user owns the event or is admin
    if (req.user.role !== "admin" && event.organizer_id !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this event",
      })
    }

    await event.delete()

    res.json({
      success: true,
      message: "Event deleted successfully",
    })
  } catch (error) {
    console.error("Delete event error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get events by organizer
router.get("/organizer/:organizerId", auth, async (req, res) => {
  try {
    // Check if user is accessing their own events or is admin
    if (req.user.userId !== Number.parseInt(req.params.organizerId) && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access these events",
      })
    }

    const events = await Event.findAll({
      organizer_id: req.params.organizerId,
    })

    res.json({
      success: true,
      data: events.map((event) => event.toJSON()),
    })
  } catch (error) {
    console.error("Get organizer events error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Asignar evento a organizador (solo admin)
router.post("/:eventId/assign-organizer", auth, requireRole(["admin"]), async (req, res) => {
  try {
    const { eventId } = req.params
    const { organizerId } = req.body

    if (!organizerId) {
      return res.status(400).json({
        success: false,
        message: "organizerId is required",
      })
    }

    const event = await Event.findById(eventId)
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }

    // Verificar que el organizador existe y tiene rol de organizador
    const db = require("../config/database-postgres")
    const userResult = await db.query(
      "SELECT id, role FROM users WHERE id = $1 AND role = 'organizer'",
      [organizerId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Organizer not found or user is not an organizer",
      })
    }

    // Actualizar el evento con el nuevo organizador
    await event.update({ organizer_id: organizerId })

    res.json({
      success: true,
      message: "Event assigned to organizer successfully",
      data: {
        eventId: event.id,
        organizerId: organizerId,
      },
    })
  } catch (error) {
    console.error("Assign event to organizer error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get event seats (public)
router.get("/:id/seats", async (req, res) => {
  try {
    const eventId = req.params.id
    
    // Obtener información del evento
    const eventQuery = `
      SELECT id, title, seat_map_id, total_capacity
      FROM events 
      WHERE id = $1
    `
    const db = require("../config/database-postgres")
    const eventResult = await db.query(eventQuery, [eventId])
    
    if (eventResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      })
    }
    
    const event = eventResult.rows[0]
    
    // Si el evento no tiene mapa de asientos, devolver error
    if (!event.seat_map_id) {
      return res.status(404).json({
        success: false,
        message: "This event does not have a seat map",
      })
    }
    
    // Obtener el mapa de asientos
    const seatMapQuery = `
      SELECT * FROM seat_maps 
      WHERE id = $1
    `
    const seatMapResult = await db.query(seatMapQuery, [event.seat_map_id])
    
    if (seatMapResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seat map not found",
      })
    }
    
    const seatMap = seatMapResult.rows[0]
    
    // Generar asientos basados en el mapa
    const seats = generateSeatsFromMap(seatMap, event)
    
    res.json({
      success: true,
      data: seats,
    })
  } catch (error) {
    console.error("Get event seats error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Función auxiliar para generar asientos desde el mapa
function generateSeatsFromMap(seatMap, event) {
  const seats = []
  
  try {
    const mapData = seatMap.map_data
    
    if (mapData && mapData.sections) {
      mapData.sections.forEach((section, sectionIndex) => {
        const sectionName = section.name || `Section ${sectionIndex + 1}`
        const capacity = section.capacity || 100
        const price = section.price || event.price || 0
        const type = section.type || 'regular'
        const category = section.category || 'economy'
        
        // Calcular filas y asientos por fila basándose en la capacidad
        // Asumimos que queremos aproximadamente 20 asientos por fila
        const seatsPerRow = 20
        const rows = Math.ceil(capacity / seatsPerRow)
        
        for (let row = 1; row <= rows; row++) {
          for (let seatNum = 1; seatNum <= seatsPerRow; seatNum++) {
            // Solo crear asientos hasta alcanzar la capacidad
            if (seats.length >= capacity) break
            
            const seatId = `${sectionName}-${row}-${seatNum}`
            
            seats.push({
              id: seatId,
              row: row.toString(),
              number: seatNum.toString(),
              section: sectionName,
              status: 'available',
              price: price,
              type: type,
              category: category,
              isWheelchairAccessible: section.has_wheelchair_access || false,
              hasExtraLegroom: row === 1 || row === rows,
              isAisleSeat: seatNum === 1 || seatNum === seatsPerRow,
              isWindowSeat: seatNum === 1 || seatNum === seatsPerRow
            })
          }
          if (seats.length >= capacity) break
        }
      })
    }
  } catch (error) {
    console.error("Error generating seats from map:", error)
  }
  
  return seats
}

module.exports = router
