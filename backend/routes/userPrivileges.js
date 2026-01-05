const express = require("express")
const { auth, requireRole } = require("../middleware/auth")
const db = require("../config/database-postgres")
const bcrypt = require("bcryptjs")

const router = express.Router()

// GET /api/users/with-privileges
// Obtener usuarios con sus privilegios
router.get("/with-privileges", auth, requireRole(['admin']), async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.status,
        u.created_at,
        spp.id as privilege_id,
        spp.sales_point_id,
        sp.name as sales_point_name,
        spp.can_sell,
        spp.can_view_reports,
        spp.can_manage_inventory,
        spp.can_manage_users,
        spp.created_at as privilege_created_at
      FROM users u
      LEFT JOIN sales_point_privileges spp ON u.id = spp.user_id
      LEFT JOIN sales_points sp ON spp.sales_point_id = sp.id
      WHERE u.role IN ('sales_point_manager', 'sales_point_staff')
      ORDER BY u.last_name, u.first_name
    `
    
    const result = await db.query(query)
    
    // Agrupar usuarios con sus privilegios
    const usersMap = new Map()
    
    result.rows.forEach(row => {
      if (!usersMap.has(row.id)) {
        usersMap.set(row.id, {
          id: row.id,
          first_name: row.first_name,
          last_name: row.last_name,
          email: row.email,
          role: row.role,
          status: row.status,
          created_at: row.created_at,
          sales_point_privileges: []
        })
      }
      
      if (row.privilege_id) {
        usersMap.get(row.id).sales_point_privileges.push({
          id: row.privilege_id,
          sales_point_id: row.sales_point_id,
          sales_point_name: row.sales_point_name,
          can_sell: row.can_sell,
          can_view_reports: row.can_view_reports,
          can_manage_inventory: row.can_manage_inventory,
          can_manage_users: row.can_manage_users,
          created_at: row.privilege_created_at
        })
      }
    })
    
    res.json({
      success: true,
      data: Array.from(usersMap.values())
    })
    
  } catch (error) {
    console.error("Error obteniendo usuarios con privilegios:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// POST /api/users
// Crear nuevo usuario
router.post("/", auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      role = 'sales_point_staff'
    } = req.body
    
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Todos los campos son requeridos"
      })
    }
    
    // Verificar si el email ya existe
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "El email ya está registrado"
      })
    }
    
    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const insertQuery = `
      INSERT INTO users (
        first_name, last_name, email, password_hash, role, status
      ) VALUES ($1, $2, $3, $4, $5, 'active')
      RETURNING id, first_name, last_name, email, role, status, created_at
    `
    
    const result = await db.query(insertQuery, [
      first_name, last_name, email, hashedPassword, role
    ])
    
    res.json({
      success: true,
      message: "Usuario creado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error creando usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/users/:id/privileges
// Actualizar privilegios de usuario
router.put("/:id/privileges", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { sales_point_id, privilege, value } = req.body
    
    if (!sales_point_id || !privilege || value === undefined) {
      return res.status(400).json({
        success: false,
        message: "sales_point_id, privilege y value son requeridos"
      })
    }
    
    const validPrivileges = ['can_sell', 'can_view_reports', 'can_manage_inventory', 'can_manage_users']
    if (!validPrivileges.includes(privilege)) {
      return res.status(400).json({
        success: false,
        message: "Privilegio inválido"
      })
    }
    
    // Verificar si el privilegio ya existe
    const existingPrivilege = await db.query(
      'SELECT id FROM sales_point_privileges WHERE user_id = $1 AND sales_point_id = $2',
      [id, sales_point_id]
    )
    
    if (existingPrivilege.rows.length > 0) {
      // Actualizar privilegio existente
      const updateQuery = `
        UPDATE sales_point_privileges 
        SET ${privilege} = $1, updated_at = NOW()
        WHERE user_id = $2 AND sales_point_id = $3
        RETURNING *
      `
      
      const result = await db.query(updateQuery, [value, id, sales_point_id])
      
      res.json({
        success: true,
        message: "Privilegio actualizado exitosamente",
        data: result.rows[0]
      })
    } else {
      // Crear nuevo privilegio
      const insertQuery = `
        INSERT INTO sales_point_privileges (
          user_id, sales_point_id, ${privilege}
        ) VALUES ($1, $2, $3)
        RETURNING *
      `
      
      const result = await db.query(insertQuery, [id, sales_point_id, value])
      
      res.json({
        success: true,
        message: "Privilegio creado exitosamente",
        data: result.rows[0]
      })
    }
    
  } catch (error) {
    console.error("Error actualizando privilegio:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// DELETE /api/users/:id
// Eliminar usuario
router.delete("/:id", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    // Verificar si el usuario tiene ventas asociadas
    const salesCheck = await db.query(
      'SELECT COUNT(*) as count FROM sales WHERE user_id = $1',
      [id]
    )
    
    if (parseInt(salesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar el usuario porque tiene ventas asociadas"
      })
    }
    
    // Eliminar privilegios primero
    await db.query('DELETE FROM sales_point_privileges WHERE user_id = $1', [id])
    
    // Eliminar usuario
    const deleteQuery = "DELETE FROM users WHERE id = $1 RETURNING *"
    const result = await db.query(deleteQuery, [id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Usuario eliminado exitosamente"
    })
    
  } catch (error) {
    console.error("Error eliminando usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// GET /api/users/:id/privileges
// Obtener privilegios de un usuario específico
router.get("/:id/privileges", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    
    const query = `
      SELECT 
        spp.id,
        spp.sales_point_id,
        sp.name as sales_point_name,
        spp.can_sell,
        spp.can_view_reports,
        spp.can_manage_inventory,
        spp.can_manage_users,
        spp.created_at,
        spp.updated_at
      FROM sales_point_privileges spp
      LEFT JOIN sales_points sp ON spp.sales_point_id = sp.id
      WHERE spp.user_id = $1
      ORDER BY sp.name
    `
    
    const result = await db.query(query, [id])
    
    res.json({
      success: true,
      data: result.rows
    })
    
  } catch (error) {
    console.error("Error obteniendo privilegios del usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/users/:id/status
// Cambiar estado del usuario (activo/inactivo)
router.put("/:id/status", auth, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Estado inválido"
      })
    }
    
    const updateQuery = `
      UPDATE users 
      SET status = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `
    
    const result = await db.query(updateQuery, [status, id])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Usuario no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: `Usuario ${status === 'active' ? 'activado' : 'desactivado'} exitosamente`,
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error cambiando estado del usuario:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

module.exports = router


