const express = require("express")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Get all categories
router.get("/", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status = 'active'
      GROUP BY c.id
      ORDER BY c.name ASC
    `

    const result = await db.query(query)

    res.json({
      success: true,
      data: result.rows,
    })
  } catch (error) {
    console.error("Get categories error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get single category
router.get("/:id", async (req, res) => {
  try {
    const query = `
      SELECT 
        c.*,
        COUNT(e.id) as event_count
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id AND e.status = 'active'
      WHERE c.id = $1
      GROUP BY c.id
    `

    const result = await db.query(query, [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Get category error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Create category (admin only)
router.post("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, icon, color } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Name is required",
      })
    }

    const query = `
      INSERT INTO categories (name, description, icon, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `

    const result = await db.query(query, [name, description, icon, color])

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Create category error:", error)

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "Category name already exists",
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update category (admin only)
router.put("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, icon, color } = req.body

    const query = `
      UPDATE categories 
      SET name = COALESCE($1, name),
          description = COALESCE($2, description),
          icon = COALESCE($3, icon),
          color = COALESCE($4, color),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `

    const result = await db.query(query, [name, description, icon, color, req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update category error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Delete category (admin only)
router.delete("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    // Check if category has events
    const eventCheck = await db.query("SELECT COUNT(*) FROM events WHERE category_id = $1", [req.params.id])

    if (Number.parseInt(eventCheck.rows[0].count) > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete category with associated events",
      })
    }

    const result = await db.query("DELETE FROM categories WHERE id = $1 RETURNING *", [req.params.id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      })
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    })
  } catch (error) {
    console.error("Delete category error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
