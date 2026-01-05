const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Get all seat maps
router.get("/", auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        sm.*,
        COALESCE(e.title, 'Sin evento asignado') as event_title,
        COALESCE(
          (SELECT COUNT(*) FROM seat_sections WHERE seat_map_id = sm.id), 
          0
        ) as total_sections,
        COALESCE(
          (SELECT COUNT(*) FROM seats s 
           JOIN seat_sections ss ON s.section_id = ss.id 
           WHERE ss.seat_map_id = sm.id), 
          0
        ) as total_seats,
        COALESCE(
          (SELECT COUNT(*) FROM seats s 
           JOIN seat_sections ss ON s.section_id = ss.id 
           WHERE ss.seat_map_id = sm.id AND s.status = 'available'), 
          0
        ) as available_seats,
        COALESCE(
          (SELECT COUNT(*) FROM seats s 
           JOIN seat_sections ss ON s.section_id = ss.id 
           WHERE ss.seat_map_id = sm.id AND s.status = 'reserved'), 
          0
        ) as reserved_seats,
        COALESCE(
          (SELECT COUNT(*) FROM seats s 
           JOIN seat_sections ss ON s.section_id = ss.id 
           WHERE ss.seat_map_id = sm.id AND s.status = 'occupied'), 
          0
        ) as occupied_seats
      FROM seat_maps sm
      LEFT JOIN events e ON e.seat_map_id = sm.id
      ORDER BY sm.created_at DESC
    `

    const result = await db.query(query)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get seat maps error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single seat map with sections and seats
router.get("/:id", async (req, res) => {
  try {
    // Get seat map info
    const mapQuery = `
      SELECT 
        sm.*,
        COALESCE(e.title, 'Sin evento asignado') as event_title
      FROM seat_maps sm
      LEFT JOIN events e ON e.seat_map_id = sm.id
      WHERE sm.id = $1
    `

    const mapResult = await db.query(mapQuery, [req.params.id])

    if (mapResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seat map not found",
      })
    }

    // Get sections for this seat map
    const sectionsQuery = `
      SELECT * FROM seat_sections 
      WHERE seat_map_id = $1 
      ORDER BY created_at
    `

    const sectionsResult = await db.query(sectionsQuery, [req.params.id])

    // Get seats for each section
    const seatMap = mapResult.rows[0]
    seatMap.sections = sectionsResult.rows

    // For each section, get its seats
    for (let section of seatMap.sections) {
      const seatsQuery = `
        SELECT * FROM seats 
        WHERE section_id = $1 
        ORDER BY row_number, seat_number
      `
      const seatsResult = await db.query(seatsQuery, [section.id])
      section.seats = seatsResult.rows
    }

    res.json({
      success: true,
      data: seatMap,
    })
  } catch (error) {
    console.error("Get seat map error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create seat map (admin/organizer)
router.post("/", auth, requireRole(["admin", "organizer"]), async (req, res) => {
  try {
    const { event_id, name, layout_data, total_capacity } = req.body

    if (!event_id || !name) {
      return res.status(400).json({
        success: false,
        message: "Event ID and name are required",
      })
    }

    const query = `
      INSERT INTO seat_maps (event_id, name, layout_data, total_capacity)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await db.query(query, [event_id, name, layout_data, total_capacity])

    res.status(201).json({
      success: true,
      message: "Seat map created successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Create seat map error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update seat map (admin/organizer)
router.put("/:id", auth, requireRole(["admin", "organizer"]), async (req, res) => {
  try {
    const { name, layout_data, total_capacity } = req.body

    const query = `
      UPDATE seat_maps 
      SET name = COALESCE($1, name),
          layout_data = COALESCE($2, layout_data),
          total_capacity = COALESCE($3, total_capacity),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `

    const result = await db.query(query, [name, layout_data, total_capacity, req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seat map not found",
      })
    }

    res.json({
      success: true,
      message: "Seat map updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update seat map error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete seat map (admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const result = await db.query("DELETE FROM seat_maps WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Seat map not found",
      })
    }

    res.json({
      success: true,
      message: "Seat map deleted successfully",
    })
  } catch (error) {
    console.error("Delete seat map error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Reserve seats
router.post("/:id/reserve", async (req, res) => {
  try {
    const { seat_ids, user_id } = req.body

    if (!seat_ids || !Array.isArray(seat_ids) || seat_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Seat IDs array is required",
      })
    }

    // Start transaction
    await db.query("BEGIN")

    try {
      // Check if seats are available
      const checkQuery = `
        SELECT id, status FROM seats 
        WHERE id = ANY($1) AND seat_map_id = $2
      `

      const checkResult = await db.query(checkQuery, [seat_ids, req.params.id])

      if (checkResult.rows.length !== seat_ids.length) {
        throw new Error("Some seats not found")
      }

      const unavailableSeats = checkResult.rows.filter((seat) => seat.status !== "available")

      if (unavailableSeats.length > 0) {
        throw new Error("Some seats are not available")
      }

      // Reserve seats
      const reserveQuery = `
        UPDATE seats 
        SET status = 'reserved',
            reserved_by = $1,
            reserved_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2) AND seat_map_id = $3
        RETURNING *
      `

      const reserveResult = await db.query(reserveQuery, [user_id, seat_ids, req.params.id])

      await db.query("COMMIT")

      res.json({
        success: true,
        message: "Seats reserved successfully",
        data: reserveResult.rows,
      })
    } catch (error) {
      await db.query("ROLLBACK")
      throw error
    }
  } catch (error) {
    console.error("Reserve seats error:", error)
    res.status(400).json({
      success: false,
      message: error.message || "Failed to reserve seats",
    })
  }
})

// Get seat map templates
router.get("/templates", async (req, res) => {
  try {
    const templates = [
      {
        id: 1,
        name: "Teatro Pequeño",
        description: "15 filas, 20 asientos por fila",
        capacity: 300,
        layout_data: {
          rows: 15,
          seatsPerRow: 20,
          aisles: [5, 15],
          type: "theater",
        },
      },
      {
        id: 2,
        name: "Teatro Grande",
        description: "25 filas, 30 asientos por fila",
        capacity: 750,
        layout_data: {
          rows: 25,
          seatsPerRow: 30,
          aisles: [10, 20],
          type: "theater",
        },
      },
      {
        id: 3,
        name: "Salón de Eventos",
        description: "Mesas redondas para 8 personas",
        capacity: 200,
        layout_data: {
          tables: 25,
          seatsPerTable: 8,
          type: "banquet",
        },
      },
      {
        id: 4,
        name: "Concierto al Aire Libre",
        description: "Área general con zonas VIP",
        capacity: 5000,
        layout_data: {
          zones: ["General", "VIP", "Palco"],
          type: "concert",
        },
      },
    ]

    res.json({
      success: true,
      data: templates,
    })
  } catch (error) {
    console.error("Get templates error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
