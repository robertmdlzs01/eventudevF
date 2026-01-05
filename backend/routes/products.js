const express = require("express")
const { auth, requireRole } = require("../middleware/auth")
const db = require("../config/database-postgres")

const router = express.Router()

// GET /api/products
// Obtener todos los productos
router.get("/", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { category, search, in_stock } = req.query
    
    let query = `
      SELECT 
        p.id,
        p.name,
        p.description,
        p.price,
        p.stock,
        p.category,
        p.sku,
        p.is_active,
        p.created_at,
        p.updated_at
      FROM products p
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0
    
    if (category) {
      paramCount++
      query += ` AND p.category = $${paramCount}`
      params.push(category)
    }
    
    if (search) {
      paramCount++
      query += ` AND (p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.sku ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    if (in_stock === 'true') {
      query += ` AND p.stock > 0`
    }
    
    query += ` ORDER BY p.name`
    
    const result = await db.query(query, params)
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        stock: parseInt(row.stock),
        category: row.category,
        sku: row.sku,
        is_active: row.is_active,
        created_at: row.created_at,
        updated_at: row.updated_at
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo productos:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// POST /api/products
// Crear nuevo producto
router.post("/", auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      stock,
      category,
      sku,
      is_active = true
    } = req.body
    
    if (!name || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Nombre, precio y stock son requeridos"
      })
    }
    
    // Generar SKU si no se proporciona
    const productSku = sku || `PRD-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
    
    const insertQuery = `
      INSERT INTO products (
        name, description, price, stock, category, sku, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    
    const result = await db.query(insertQuery, [
      name, description, price, stock, category, productSku, is_active
    ])
    
    res.json({
      success: true,
      message: "Producto creado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error creando producto:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/products/:id
// Actualizar producto
router.put("/:id", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      description,
      price,
      stock,
      category,
      sku,
      is_active
    } = req.body
    
    const updateQuery = `
      UPDATE products 
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        price = COALESCE($3, price),
        stock = COALESCE($4, stock),
        category = COALESCE($5, category),
        sku = COALESCE($6, sku),
        is_active = COALESCE($7, is_active),
        updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `
    
    const result = await db.query(updateQuery, [
      name, description, price, stock, category, sku, is_active, id
    ])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Producto actualizado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error actualizando producto:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// DELETE /api/products/:id
// Eliminar producto
router.delete("/:id", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar si hay ventas asociadas
    const salesCheck = await db.query(
      'SELECT COUNT(*) as count FROM sale_items WHERE product_id = $1',
      [id]
    )
    
    if (parseInt(salesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el producto porque tiene ventas asociadas"
      })
    }
    
    const deleteQuery = "DELETE FROM products WHERE id = $1 RETURNING *"
    const result = await db.query(deleteQuery, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Producto eliminado exitosamente"
    })
    
  } catch (error) {
    console.error("Error eliminando producto:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// GET /api/products/categories
// Obtener categorías de productos
router.get("/categories", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT category, COUNT(*) as count
      FROM products
      WHERE category IS NOT NULL
      GROUP BY category
      ORDER BY category
    `
    
    const result = await db.query(query)
    
    res.json({
      success: true,
      data: result.rows.map(row => ({
        name: row.category,
        count: parseInt(row.count)
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo categorías:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/products/:id/stock
// Actualizar stock de producto
router.put("/:id/stock", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { id } = req.params
    const { stock, operation = 'set' } = req.body // operation: 'set', 'add', 'subtract'
    
    if (stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Stock es requerido"
      })
    }
    
    let updateQuery
    let params
    
    switch (operation) {
      case 'add':
        updateQuery = 'UPDATE products SET stock = stock + $1, updated_at = NOW() WHERE id = $2 RETURNING *'
        params = [stock, id]
        break
      case 'subtract':
        updateQuery = 'UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2 RETURNING *'
        params = [stock, id]
        break
      default: // 'set'
        updateQuery = 'UPDATE products SET stock = $1, updated_at = NOW() WHERE id = $2 RETURNING *'
        params = [stock, id]
    }
    
    const result = await db.query(updateQuery, params)
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Producto no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Stock actualizado exitosamente",
      data: {
        id: result.rows[0].id,
        stock: parseInt(result.rows[0].stock)
      }
    })
    
  } catch (error) {
    console.error("Error actualizando stock:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

module.exports = router


