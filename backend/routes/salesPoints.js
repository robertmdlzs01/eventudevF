const express = require("express")
const { auth, requireRole } = require("../middleware/auth")
const db = require("../config/database-postgres")

const router = express.Router()

// GET /api/sales-points/public
// Obtener puntos de venta activos (público, sin autenticación)
router.get("/public", async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        name,
        location,
        contact_person,
        phone,
        email,
        is_active,
        created_at
      FROM sales_points
      WHERE is_active = true
      ORDER BY name ASC
    `
    
    const result = await db.query(query)
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: row.location,
        contact_person: row.contact_person,
        phone: row.phone,
        email: row.email,
        is_active: row.is_active,
        created_at: row.created_at
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo puntos de venta públicos:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// GET /api/sales-points
// Obtener todos los puntos de venta (requiere autenticación)
router.get("/", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { status, search } = req.query
    
    let query = `
      SELECT 
        sp.id,
        sp.name,
        sp.location,
        sp.contact_person,
        sp.phone,
        sp.email,
        sp.is_active,
        sp.created_at,
        sp.updated_at,
        COALESCE(SUM(s.quantity), 0) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        MAX(s.created_at) as last_sale
      FROM sales_points sp
      LEFT JOIN sales s ON sp.id = s.sales_point_id AND s.status = 'completed'
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0
    
    if (status) {
      paramCount++
      query += ` AND sp.is_active = $${paramCount}`
      params.push(status === 'active')
    }
    
    if (search) {
      paramCount++
      query += ` AND (sp.name ILIKE $${paramCount} OR sp.location ILIKE $${paramCount} OR sp.contact_person ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    query += ` GROUP BY sp.id ORDER BY sp.created_at DESC`
    
    const result = await db.query(query, params)
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        location: row.location,
        contact_person: row.contact_person,
        phone: row.phone,
        email: row.email,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at,
        total_sales: parseInt(row.total_sales),
        total_revenue: parseFloat(row.total_revenue),
        last_sale: row.last_sale
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo puntos de venta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// POST /api/sales-points
// Crear nuevo punto de venta
router.post("/", auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      location,
      contact_person,
      phone,
      email,
      is_active = true,
      notes = ''
    } = req.body
    
    if (!name || !location || !contact_person || !phone || !email) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos obligatorios son requeridos"
      })
    }
    
    const insertQuery = `
      INSERT INTO sales_points (
        name, location, contact_person, phone, email, is_active, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const result = await db.query(insertQuery, [
      name, location, contact_person, phone, email, is_active, notes
    ])
    
    res.json({
      success: true,
      message: "Punto de venta creado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error creando punto de venta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/sales-points/:id
// Actualizar punto de venta
router.put("/:id", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      location,
      contact_person,
      phone,
      email,
      is_active,
      notes
    } = req.body
    
    const updateQuery = `
      UPDATE sales_points 
      SET 
        name = COALESCE($1, name),
        location = COALESCE($2, location),
        contact_person = COALESCE($3, contact_person),
        phone = COALESCE($4, phone),
        email = COALESCE($5, email),
        is_active = COALESCE($6, is_active),
        notes = COALESCE($7, notes),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `
    
    const result = await db.query(updateQuery, [
      name, location, contact_person, phone, email, is_active, notes, id
    ])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Punto de venta no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Punto de venta actualizado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error actualizando punto de venta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// DELETE /api/sales-points/:id
// Eliminar punto de venta
router.delete("/:id", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar si hay ventas asociadas
    const salesCheck = await db.query(
      'SELECT COUNT(*) as count FROM sales WHERE sales_point_id = $1',
      [id]
    )
    
    if (parseInt(salesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el punto de venta porque tiene ventas asociadas"
      })
    }
    
    const deleteQuery = "DELETE FROM sales_points WHERE id = $1 RETURNING *"
    const result = await db.query(deleteQuery, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Punto de venta no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Punto de venta eliminado exitosamente"
    })
    
  } catch (error) {
    console.error("Error eliminando punto de venta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// GET /api/sales-points/:id/sales
// Obtener ventas de un punto de venta
router.get("/:id/sales", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { id } = req.params
    const { page = 1, limit = 20 } = req.query
    
    const offset = (page - 1) * limit
    
    const salesQuery = `
      SELECT 
        s.id,
        s.customer_name,
        s.customer_email,
        s.total_amount,
        s.status,
        s.created_at,
        s.payment_method,
        s.notes
      FROM sales s
      WHERE s.sales_point_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `
    
    const countQuery = `
      SELECT COUNT(*) as total FROM sales WHERE sales_point_id = $1
    `
    
    const [salesResult, countResult] = await Promise.all([
      db.query(salesQuery, [id, limit, offset]),
      db.query(countQuery, [id])
    ])
    
    // Obtener items de cada venta
    const salesWithItems = await Promise.all(
      salesResult.rows.map(async (sale) => {
        const itemsQuery = `
          SELECT 
            si.product_name,
            si.quantity,
            si.unit_price,
            si.total_price
          FROM sale_items si
          WHERE si.sale_id = $1
        `
        const itemsResult = await db.query(itemsQuery, [sale.id])
        
        return {
          ...sale,
          items: itemsResult.rows
        }
      })
    )
    
    // Obtener estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as average_sale,
        MAX(created_at) as last_sale
      FROM sales 
      WHERE sales_point_id = $1 AND status = 'completed'
    `
    const statsResult = await db.query(statsQuery, [id])
    
    res.json({
      success: true,
      data: {
        sales: salesWithItems,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        },
        stats: {
          totalSales: parseInt(statsResult.rows[0].total_sales),
          totalRevenue: parseFloat(statsResult.rows[0].total_revenue),
          averageSale: parseFloat(statsResult.rows[0].average_sale),
          lastSale: statsResult.rows[0].last_sale
        }
      }
    })
    
  } catch (error) {
    console.error("Error obteniendo ventas del punto de venta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// POST /api/sales-points/direct-sale
// Crear venta directa
router.post("/direct-sale", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const {
      sales_point_id,
      customer,
      items,
      total_amount,
      payment_method = 'cash',
      status = 'completed',
      notes = ''
    } = req.body
    
    if (!sales_point_id || !customer || !items || !total_amount) {
      return res.status(400).json({
        success: false,
        message: "Datos de venta incompletos"
      })
    }
    
    // Verificar que el punto de venta existe
    const salesPointCheck = await db.query(
      'SELECT id FROM sales_points WHERE id = $1',
      [sales_point_id]
    )
    
    if (salesPointCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Punto de venta no encontrado"
      })
    }
    
    // Crear la venta
    const saleQuery = `
      INSERT INTO sales (
        sales_point_id, customer_name, customer_email, customer_phone,
        total_amount, payment_method, status, notes, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING *
    `
    
    const saleResult = await db.query(saleQuery, [
      sales_point_id,
      customer.name,
      customer.email,
      customer.phone,
      total_amount,
      payment_method,
      status,
      notes
    ])
    
    const saleId = saleResult.rows[0].id
    
    // Crear items de la venta
    const itemsQuery = `
      INSERT INTO sale_items (
        sale_id, product_name, quantity, unit_price, total_price
      ) VALUES ($1, $2, $3, $4, $5)
    `
    
    for (const item of items) {
      await db.query(itemsQuery, [
        saleId,
        item.product_name,
        item.quantity,
        item.unit_price,
        item.total_price
      ])
    }
    
    res.json({
      success: true,
      message: "Venta registrada exitosamente",
      data: {
        sale_id: saleId,
        total_amount,
        status
      }
    })
    
  } catch (error) {
    console.error("Error registrando venta directa:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

module.exports = router


