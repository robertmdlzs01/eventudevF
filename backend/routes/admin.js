const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Pool } = require('pg')
// const { auditCRUD } = require('../middleware/auditMiddleware')
const AuditService = require('../services/auditService')
require('dotenv').config()

// Database connection
const db = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Eventu321@localhost:5432/eventu_db",
})

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow images, videos, audio, and documents
    const allowedTypes = /jpeg|jpg|png|gif|svg|webp|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg|aac|flac|pdf|doc|docx|xls|xlsx|ppt|pptx|txt/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Tipo de archivo no permitido'))
    }
  }
})

const { auth, requireRole } = require('../middleware/auth')

// Middleware para verificar que el usuario es admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: 'No autorizado' })
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Acceso denegado. Se requieren permisos de administrador.' })
  }
  
  next()
}

// Dashboard stats - Usando estado compartido
router.get('/dashboard/stats', auth, requireAdmin, async (req, res) => {
  try {
    const adminSharedState = require('../services/adminSharedState')
    const dashboardData = await adminSharedState.getDashboardStats()
    
    res.json({
      success: true,
      data: dashboardData
    })

  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Forzar actualización del dashboard y notificar a todos los admins
router.post('/dashboard/refresh', auth, requireAdmin, async (req, res) => {
  try {
    const adminSharedState = require('../services/adminSharedState')
    const wsServer = global.wsServer
    
    // Invalidar cache y obtener datos frescos
    const freshData = await adminSharedState.invalidateCache()
    
    // Notificar a todos los administradores conectados
    if (wsServer) {
      await wsServer.notifyAdminsOfChange('dashboard_refresh', {
        refreshedBy: req.user.email,
        refreshedAt: new Date().toISOString()
      })
    }
    
    res.json({
      success: true,
      message: 'Dashboard actualizado y notificado a todos los administradores',
      data: freshData
    })

  } catch (error) {
    console.error('Error refreshing dashboard:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Obtener administradores conectados
router.get('/connected-admins', auth, requireAdmin, async (req, res) => {
  try {
    const adminSharedState = require('../services/adminSharedState')
    const connectedAdmins = adminSharedState.getConnectedAdmins()
    
    res.json({
      success: true,
      data: connectedAdmins
    })

  } catch (error) {
    console.error('Error getting connected admins:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Get all users (with auth for production, without auth for development)
router.get('/users', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    // Apply auth middleware for production
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetUsers(req, res))
    })
  }
  
  // For development, skip auth
  return handleGetUsers(req, res)
})

async function handleGetUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (role) {
      whereClause += ` AND role = $${params.length + 1}`
      params.push(role)
    }

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`
      params.push(status)
    }

    const usersQuery = `
      SELECT id, first_name, last_name, email, role, status, created_at, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `

    const [usersResult, countResult] = await Promise.all([
      db.query(usersQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    res.json({
      success: true,
      data: {
        users: usersResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting users:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Create new user
router.post('/users', auth, requireAdmin, async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phone, status = 'active' } = req.body

    // Validar campos requeridos
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Todos los campos son requeridos'
      })
    }

    // Validar email único
    const existingUser = await db.query('SELECT id FROM users WHERE email = $1', [email])
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'El email ya está registrado'
      })
    }

    // Validar rol válido
    const validRoles = ['admin', 'organizer', 'user']
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Rol inválido'
      })
    }

    // Hash de la contraseña
    const bcrypt = require('bcrypt')
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Crear usuario
    const createUserQuery = `
      INSERT INTO users (first_name, last_name, email, password, role, phone, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id, first_name, last_name, email, role, status, created_at
    `

    const result = await db.query(createUserQuery, [
      firstName,
      lastName,
      email,
      hashedPassword,
      role,
      phone || null,
      status
    ])

    const newUser = result.rows[0]

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        user: {
          id: newUser.id,
          first_name: newUser.first_name,
          last_name: newUser.last_name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
          created_at: newUser.created_at
        }
      }
    })

  } catch (error) {
    console.error('Error creating user:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Update user
router.put('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, password, role, phone, status } = req.body

    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    // Validar email único (excluyendo el usuario actual)
    if (email) {
      const emailCheck = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id])
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'El email ya está registrado por otro usuario'
        })
      }
    }

    // Validar rol válido
    if (role) {
      const validRoles = ['admin', 'organizer', 'user']
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Rol inválido'
        })
      }
    }

    // Construir query de actualización
    let updateFields = []
    let params = []
    let paramIndex = 1

    if (firstName) {
      updateFields.push(`first_name = $${paramIndex}`)
      params.push(firstName)
      paramIndex++
    }

    if (lastName) {
      updateFields.push(`last_name = $${paramIndex}`)
      params.push(lastName)
      paramIndex++
    }

    if (email) {
      updateFields.push(`email = $${paramIndex}`)
      params.push(email)
      paramIndex++
    }

    if (password) {
      const bcrypt = require('bcrypt')
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(password, saltRounds)
      updateFields.push(`password = $${paramIndex}`)
      params.push(hashedPassword)
      paramIndex++
    }

    if (role) {
      updateFields.push(`role = $${paramIndex}`)
      params.push(role)
      paramIndex++
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex}`)
      params.push(phone)
      paramIndex++
    }

    if (status) {
      updateFields.push(`status = $${paramIndex}`)
      params.push(status)
      paramIndex++
    }

    // Agregar updated_at
    updateFields.push(`updated_at = NOW()`)

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No se proporcionaron campos para actualizar'
      })
    }

    // Ejecutar actualización
    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, first_name, last_name, email, role, status, phone, updated_at
    `
    params.push(id)

    const result = await db.query(updateQuery, params)
    const updatedUser = result.rows[0]

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente',
      data: {
        user: updatedUser
      }
    })

  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Delete user
router.delete('/users/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id, role FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    // Prevenir eliminación de usuarios admin (opcional)
    const user = existingUser.rows[0]
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'No se puede eliminar un usuario administrador'
      })
    }

    // Eliminar usuario
    await db.query('DELETE FROM users WHERE id = $1', [id])

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Reset user password
router.post('/users/:id/reset-password', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { newPassword } = req.body

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Nueva contraseña es requerida'
      })
    }

    // Verificar que el usuario existe
    const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id])
    if (existingUser.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    // Hash de la nueva contraseña
    const bcrypt = require('bcrypt')
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Actualizar contraseña
    await db.query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    )

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    console.error('Error resetting password:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Get activity data for charts
router.get('/activity-data', auth, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query
    const daysInt = parseInt(days)

    // Obtener datos de ventas por día
    const salesQuery = `
      SELECT 
        DATE(s.transaction_date) as date,
        COUNT(*) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(DISTINCT s.buyer_id) as unique_buyers
      FROM sales s
      WHERE s.transaction_date >= NOW() - INTERVAL '${daysInt} days'
        AND s.status = 'completed'
      GROUP BY DATE(s.transaction_date)
      ORDER BY date
    `

    // Obtener datos de eventos por día
    const eventsQuery = `
      SELECT 
        DATE(e.created_at) as date,
        COUNT(*) as events_count,
        COUNT(CASE WHEN e.status = 'published' THEN 1 END) as published_events
      FROM events e
      WHERE e.created_at >= NOW() - INTERVAL '${daysInt} days'
      GROUP BY DATE(e.created_at)
      ORDER BY date
    `

    // Obtener datos de usuarios por día
    const usersQuery = `
      SELECT 
        DATE(u.created_at) as date,
        COUNT(*) as new_users
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '${daysInt} days'
      GROUP BY DATE(u.created_at)
      ORDER BY date
    `

    // Obtener estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(DISTINCT buyer_id) as total_buyers,
        COUNT(DISTINCT event_id) as total_events
      FROM sales 
      WHERE transaction_date >= NOW() - INTERVAL '${daysInt} days'
        AND status = 'completed'
    `

    const [salesResult, eventsResult, usersResult, statsResult] = await Promise.all([
      db.query(salesQuery),
      db.query(eventsQuery),
      db.query(usersQuery),
      db.query(statsQuery)
    ])

    // Combinar datos por fecha
    const dateMap = new Map()
    
    // Inicializar todas las fechas del rango
    for (let i = 0; i < daysInt; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      dateMap.set(dateStr, {
        date: dateStr,
        sales: 0,
        events: 0,
        users: 0,
        revenue: 0,
        published_events: 0
      })
    }

    // Agregar datos de ventas
    salesResult.rows.forEach(row => {
      if (dateMap.has(row.date)) {
        const existing = dateMap.get(row.date)
        existing.sales = parseInt(row.sales_count)
        existing.revenue = parseFloat(row.revenue)
        existing.users = parseInt(row.unique_buyers)
      }
    })

    // Agregar datos de eventos
    eventsResult.rows.forEach(row => {
      if (dateMap.has(row.date)) {
        const existing = dateMap.get(row.date)
        existing.events = parseInt(row.events_count)
        existing.published_events = parseInt(row.published_events)
      }
    })

    // Agregar datos de usuarios
    usersResult.rows.forEach(row => {
      if (dateMap.has(row.date)) {
        const existing = dateMap.get(row.date)
        existing.users = parseInt(row.new_users)
      }
    })

    // Convertir a array y ordenar por fecha
    const activityData = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    const stats = statsResult.rows[0]

    res.json({
      success: true,
      data: {
        activityData,
        summary: {
          totalSales: parseInt(stats.total_sales) || 0,
          totalRevenue: parseFloat(stats.total_revenue) || 0,
          totalBuyers: parseInt(stats.total_buyers) || 0,
          totalEvents: parseInt(stats.total_events) || 0,
          averageSalesPerDay: Math.round((parseInt(stats.total_sales) || 0) / daysInt),
          averageRevenuePerDay: Math.round((parseFloat(stats.total_revenue) || 0) / daysInt)
        }
      }
    })

  } catch (error) {
    console.error('Error getting activity data:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Get transaction distribution data
router.get('/transaction-distribution', auth, requireAdmin, async (req, res) => {
  try {
    // Obtener distribución de transacciones por estado
    const distributionQuery = `
      SELECT 
        status,
        COUNT(*) as count,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sales), 2) as percentage
      FROM sales
      GROUP BY status
      ORDER BY count DESC
    `

    // Obtener estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(*) as total_transactions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_transactions,
        COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_transactions,
        ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END) * 100.0 / COUNT(*), 2) as conversion_rate,
        ROUND(COUNT(CASE WHEN status = 'abandoned' THEN 1 END) * 100.0 / COUNT(*), 2) as abandonment_rate
      FROM sales
    `

    const [distributionResult, statsResult] = await Promise.all([
      db.query(distributionQuery),
      db.query(statsQuery)
    ])

    // Mapear datos para el gráfico
    const colorMap = {
      'completed': '#10b981',
      'pending': '#f59e0b', 
      'failed': '#ef4444',
      'abandoned': '#6b7280',
      'cancelled': '#8b5cf6'
    }

    const nameMap = {
      'completed': 'Ventas Completadas',
      'pending': 'Intentos de Pago',
      'failed': 'Pagos Fallidos', 
      'abandoned': 'Carritos Abandonados',
      'cancelled': 'Transacciones Canceladas'
    }

    const distributionData = distributionResult.rows.map(row => ({
      name: nameMap[row.status] || row.status,
      value: parseInt(row.count),
      percentage: parseFloat(row.percentage),
      color: colorMap[row.status] || '#6b7280'
    }))

    const stats = statsResult.rows[0]

    res.json({
      success: true,
      data: {
        distribution: distributionData,
        summary: {
          totalTransactions: parseInt(stats.total_transactions) || 0,
          completedTransactions: parseInt(stats.completed_transactions) || 0,
          pendingTransactions: parseInt(stats.pending_transactions) || 0,
          failedTransactions: parseInt(stats.failed_transactions) || 0,
          abandonedTransactions: parseInt(stats.abandoned_transactions) || 0,
          conversionRate: parseFloat(stats.conversion_rate) || 0,
          abandonmentRate: parseFloat(stats.abandonment_rate) || 0
        }
      }
    })

  } catch (error) {
    console.error('Error getting transaction distribution:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Get hourly activity data
router.get('/hourly-activity', auth, requireAdmin, async (req, res) => {
  try {
    // Obtener datos de ventas por hora
    const salesQuery = `
      SELECT 
        EXTRACT(HOUR FROM s.transaction_date) as hour,
        COUNT(*) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(DISTINCT s.buyer_id) as unique_buyers
      FROM sales s
      WHERE s.status = 'completed'
        AND s.transaction_date >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM s.transaction_date)
      ORDER BY hour
    `

    // Obtener datos de eventos por hora
    const eventsQuery = `
      SELECT 
        EXTRACT(HOUR FROM e.created_at) as hour,
        COUNT(*) as events_count,
        COUNT(CASE WHEN e.status = 'published' THEN 1 END) as published_events
      FROM events e
      WHERE e.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM e.created_at)
      ORDER BY hour
    `

    // Obtener datos de usuarios por hora
    const usersQuery = `
      SELECT 
        EXTRACT(HOUR FROM u.created_at) as hour,
        COUNT(*) as new_users
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '30 days'
      GROUP BY EXTRACT(HOUR FROM u.created_at)
      ORDER BY hour
    `

    const [salesResult, eventsResult, usersResult] = await Promise.all([
      db.query(salesQuery),
      db.query(eventsQuery),
      db.query(usersQuery)
    ])

    // Crear mapa de datos por hora (0-23)
    const hourlyData = []
    for (let hour = 0; hour < 24; hour++) {
      const salesData = salesResult.rows.find(row => parseInt(row.hour) === hour)
      const eventsData = eventsResult.rows.find(row => parseInt(row.hour) === hour)
      const usersData = usersResult.rows.find(row => parseInt(row.hour) === hour)

      hourlyData.push({
        hour: hour.toString().padStart(2, '0') + ':00',
        sales: salesData ? parseInt(salesData.sales_count) : 0,
        events: eventsData ? parseInt(eventsData.events_count) : 0,
        users: usersData ? parseInt(usersData.new_users) : 0,
        revenue: salesData ? parseFloat(salesData.revenue) : 0,
        published_events: eventsData ? parseInt(eventsData.published_events) : 0,
        unique_buyers: salesData ? parseInt(salesData.unique_buyers) : 0
      })
    }

    // Calcular estadísticas
    const totalSales = hourlyData.reduce((sum, item) => sum + item.sales, 0)
    const totalRevenue = hourlyData.reduce((sum, item) => sum + item.revenue, 0)
    const totalEvents = hourlyData.reduce((sum, item) => sum + item.events, 0)

    // Encontrar hora pico y hora baja
    const peakHour = hourlyData.reduce((max, item) => item.sales > max.sales ? item : max)
    const lowHour = hourlyData.reduce((min, item) => item.sales < min.sales ? item : min)

    // Calcular promedios
    const avgSalesPerHour = Math.round(totalSales / 24)
    const avgRevenuePerHour = Math.round(totalRevenue / 24)
    const avgEventsPerHour = Math.round(totalEvents / 24)

    res.json({
      success: true,
      data: {
        hourlyData,
        summary: {
          totalSales,
          totalRevenue,
          totalEvents,
          peakHour: {
            hour: peakHour.hour,
            sales: peakHour.sales,
            revenue: peakHour.revenue
          },
          lowHour: {
            hour: lowHour.hour,
            sales: lowHour.sales,
            revenue: lowHour.revenue
          },
          averages: {
            salesPerHour: avgSalesPerHour,
            revenuePerHour: avgRevenuePerHour,
            eventsPerHour: avgEventsPerHour
          }
        }
      }
    })

  } catch (error) {
    console.error('Error getting hourly activity:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Get all events
router.get('/events', auth, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', category = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (title ILIKE $1 OR description ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (status) {
      whereClause += ` AND status = $${params.length + 1}`
      params.push(status)
    }

    if (category) {
      whereClause += ` AND category_id = $${params.length + 1}`
      params.push(category)
    }

    const eventsQuery = `
      SELECT e.id, e.title, e.description, e.date, e.time, e.venue, e.status, e.created_at,
             c.name as category, u.first_name, u.last_name
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      ${whereClause}
      ORDER BY e.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      ${whereClause}
    `

    const [eventsResult, countResult] = await Promise.all([
      db.query(eventsQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    res.json({
      success: true,
      data: {
        events: eventsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting events:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Get single event
router.get('/events/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    const eventQuery = `
      SELECT 
        e.*,
        c.name as category_name,
        u.first_name,
        u.last_name,
        u.email as organizer_email,
        COALESCE(e.venue, e.location) as locationDisplay,
        COALESCE(e.total_capacity, 0) as capacity,
        COALESCE(e.price, 0) as price,
        0 as ticketsSold,
        0 as revenue,
        0 as views,
        0 as attendees
      FROM events e
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN users u ON e.organizer_id = u.id
      WHERE e.id = $1
    `

    const eventResult = await db.query(eventQuery, [id])

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' })
    }

    const event = eventResult.rows[0]
    
    // Formatear los datos para el frontend
    const formattedEvent = {
      id: event.id.toString(),
      title: event.title,
      slug: event.slug,
      description: event.description || '',
      date: event.date,
      time: event.time,
      venue: event.venue || '',
      location: event.location || '',
      locationDisplay: event.locationDisplay || 'Ubicación no especificada',
      category: event.category_name || 'Sin categoría',
      categoryDisplay: event.category_name || 'Sin categoría',
      organizer: event.organizer_email ? `${event.first_name} ${event.last_name}` : 'Sin organizador',
      price: parseFloat(event.price) || 0,
      capacity: parseInt(event.capacity) || 0,
      ticketsSold: parseInt(event.ticketsSold) || 0,
      revenue: parseFloat(event.revenue) || 0,
      views: parseInt(event.views) || 0,
      attendees: parseInt(event.attendees) || 0,
      status: event.status || 'draft',
      salesStartDate: event.sales_start_date || event.date,
      createdAt: event.created_at,
      additionalData: []
    }

    res.json({
      success: true,
      data: formattedEvent
    })

  } catch (error) {
    console.error('Error getting event:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Update event status
router.put('/events/:id/status', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    // Validar estado
    const validStatuses = ['draft', 'published', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Estado no válido' })
    }

    const updateQuery = `
      UPDATE events 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, title, status
    `

    const result = await db.query(updateQuery, [status, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Evento ${result.rows[0].title} actualizado a estado: ${status}`
    })

  } catch (error) {
    console.error('Error updating event status:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Update event
router.put('/events/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { title, description, date, time, venue, category_id, organizer_id, status } = req.body

    const updateQuery = `
      UPDATE events 
      SET title = $1, description = $2, date = $3, time = $4, venue = $5, 
          category_id = $6, organizer_id = $7, status = $8, updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING id, title, status
    `

    const result = await db.query(updateQuery, [
      title, description, date, time, venue, category_id, organizer_id, status, id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Evento ${result.rows[0].title} actualizado exitosamente`
    })

  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Delete event
router.delete('/events/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Verificar si el evento tiene ventas asociadas
    const salesCheck = await db.query(`
      SELECT COUNT(*) as sales_count FROM sales WHERE event_id = $1
    `, [id])

    if (parseInt(salesCheck.rows[0].sales_count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar un evento que tiene ventas asociadas' 
      })
    }

    const deleteQuery = `
      DELETE FROM events 
      WHERE id = $1
      RETURNING id, title
    `

    const result = await db.query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Evento no encontrado' })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Evento ${result.rows[0].title} eliminado exitosamente`
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Get all payments/sales
router.get('/payments', auth, requireAdmin, async (req, res) => {
  try {
    // Por ahora retornamos datos simulados
    const payments = [
      {
        id: 1,
        ticket_number: "TKT-001",
        event_name: "Concierto de Rock",
        customer_name: "Juan Pérez",
        customer_email: "juan@email.com",
        ticket_type: "General",
        quantity: 2,
        unit_price: 75000,
        total_amount: 150000,
        payment_method: "Tarjeta",
        status: "completed",
        purchase_date: "2024-01-15T10:30:00Z",
        event_date: "2024-02-15T20:00:00Z"
      },
      {
        id: 2,
        ticket_number: "TKT-002",
        event_name: "Conferencia Tech",
        customer_name: "María García",
        customer_email: "maria@email.com",
        ticket_type: "VIP",
        quantity: 1,
        unit_price: 89000,
        total_amount: 89000,
        payment_method: "Transferencia",
        status: "completed",
        purchase_date: "2024-01-14T15:45:00Z",
        event_date: "2024-02-20T09:00:00Z"
      }
    ]

    res.json({
      success: true,
      data: {
        payments: payments,
        pagination: {
          total: payments.length,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      }
    })

  } catch (error) {
    console.error('Error getting payments:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Get all ticket types
router.get('/ticket-types', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    // Apply auth middleware for production
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetTicketTypes(req, res))
    })
  }
  
  // For development, skip auth
  return handleGetTicketTypes(req, res)
})

async function handleGetTicketTypes(req, res) {
  try {
    const { page = 1, limit = 10, search = '', event_id = '', status = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (tt.name ILIKE $1 OR tt.description ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (event_id) {
      whereClause += ` AND tt.event_id = $${params.length + 1}`
      params.push(event_id)
    }

    if (status) {
      whereClause += ` AND tt.status = $${params.length + 1}`
      params.push(status)
    }

    const ticketTypesQuery = `
      SELECT tt.id, tt.name, tt.description, tt.price, tt.quantity, tt.status, tt.created_at,
             e.title as event_name, e.id as event_id,
             COALESCE(COUNT(s.id), 0) as sold
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      LEFT JOIN sales s ON tt.id = s.ticket_type_id
      ${whereClause}
      GROUP BY tt.id, tt.name, tt.description, tt.price, tt.quantity, tt.status, tt.created_at, e.title, e.id
      ORDER BY tt.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM ticket_types tt
      LEFT JOIN events e ON tt.event_id = e.id
      ${whereClause}
    `

    const [ticketTypesResult, countResult] = await Promise.all([
      db.query(ticketTypesQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    const ticketTypes = ticketTypesResult.rows.map(row => ({
      ...row,
      remaining: row.quantity - row.sold
    }))

    res.json({
      success: true,
      data: {
        ticketTypes: ticketTypes,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting ticket types:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get ticket types for a specific event
router.get('/events/:eventId/ticket-types', auth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params

    const ticketTypesQuery = `
      SELECT 
        tt.id,
        tt.name,
        tt.description,
        tt.price,
        tt.quantity,
        tt.sold,
        tt.status,
        tt.is_default,
        tt.created_at
      FROM ticket_types tt
      WHERE tt.event_id = $1
      ORDER BY tt.created_at DESC
    `

    const result = await db.query(ticketTypesQuery, [eventId])

    const ticketTypes = result.rows.map(row => ({
      id: row.id.toString(),
      name: row.name,
      description: row.description || '',
      price: parseFloat(row.price) || 0,
      quantity: parseInt(row.quantity) || 0,
      sold: parseInt(row.sold) || 0,
      status: row.status || 'active',
      isDefault: row.is_default || false,
      createdAt: row.created_at
    }))

    res.json({
      success: true,
      data: ticketTypes
    })

  } catch (error) {
    console.error('Error getting ticket types:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Create ticket type
router.post('/events/:eventId/ticket-types', auth, requireAdmin, async (req, res) => {
  try {
    const { eventId } = req.params
    const { name, description, price, quantity, status, isDefault } = req.body

    // Validate required fields
    if (!name || !price || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre, precio y cantidad son requeridos' 
      })
    }

    // Check if event exists
    const eventResult = await db.query('SELECT id FROM events WHERE id = $1', [eventId])
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Evento no encontrado' 
      })
    }

    // If this is the first ticket type, make it default
    const existingTicketTypes = await db.query(
      'SELECT COUNT(*) as count FROM ticket_types WHERE event_id = $1',
      [eventId]
    )
    
    const isFirstTicketType = parseInt(existingTicketTypes.rows[0].count) === 0
    const finalIsDefault = isDefault || isFirstTicketType

    const insertQuery = `
      INSERT INTO ticket_types (event_id, name, description, price, quantity, status, is_default, sold)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
      RETURNING id, name, description, price, quantity, status, is_default, sold, created_at
    `

    const result = await db.query(insertQuery, [
      eventId, name, description || '', price, quantity, status || 'active', finalIsDefault
    ])

    const newTicketType = {
      id: result.rows[0].id.toString(),
      name: result.rows[0].name,
      description: result.rows[0].description,
      price: parseFloat(result.rows[0].price),
      quantity: parseInt(result.rows[0].quantity),
      sold: parseInt(result.rows[0].sold),
      status: result.rows[0].status,
      isDefault: result.rows[0].is_default,
      createdAt: result.rows[0].created_at
    }

    res.json({
      success: true,
      data: newTicketType,
      message: 'Tipo de boleto creado exitosamente'
    })

  } catch (error) {
    console.error('Error creating ticket type:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Update ticket type
router.put('/ticket-types/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const { name, description, price, quantity, status, isDefault } = req.body

    // Validate required fields
    if (!name || !price || !quantity) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre, precio y cantidad son requeridos' 
      })
    }

    const updateQuery = `
      UPDATE ticket_types 
      SET name = $1, description = $2, price = $3, quantity = $4, status = $5, is_default = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING id, name, description, price, quantity, status, is_default, sold, created_at
    `

    const result = await db.query(updateQuery, [
      name, description || '', price, quantity, status || 'active', isDefault || false, id
    ])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tipo de boleto no encontrado' 
      })
    }

    const updatedTicketType = {
      id: result.rows[0].id.toString(),
      name: result.rows[0].name,
      description: result.rows[0].description,
      price: parseFloat(result.rows[0].price),
      quantity: parseInt(result.rows[0].quantity),
      sold: parseInt(result.rows[0].sold),
      status: result.rows[0].status,
      isDefault: result.rows[0].is_default,
      createdAt: result.rows[0].created_at
    }

    res.json({
      success: true,
      data: updatedTicketType,
      message: 'Tipo de boleto actualizado exitosamente'
    })

  } catch (error) {
    console.error('Error updating ticket type:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Delete ticket type
router.delete('/ticket-types/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // Check if ticket type has sales
    const salesCheck = await db.query(
      'SELECT COUNT(*) as sales_count FROM sales WHERE ticket_type_id = $1',
      [id]
    )

    if (parseInt(salesCheck.rows[0].sales_count) > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar un tipo de boleto que tiene ventas asociadas' 
      })
    }

    // Check if it's the default ticket type
    const ticketTypeCheck = await db.query(
      'SELECT is_default FROM ticket_types WHERE id = $1',
      [id]
    )

    if (ticketTypeCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tipo de boleto no encontrado' 
      })
    }

    if (ticketTypeCheck.rows[0].is_default) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar el tipo de boleto por defecto' 
      })
    }

    const deleteQuery = `
      DELETE FROM ticket_types 
      WHERE id = $1
      RETURNING id, name
    `

    const result = await db.query(deleteQuery, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tipo de boleto no encontrado' 
      })
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Tipo de boleto "${result.rows[0].name}" eliminado exitosamente`
    })

  } catch (error) {
    console.error('Error deleting ticket type:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
})

// Create virtual ticket
router.post('/tickets/virtual', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleCreateVirtualTicket(req, res))
    })
  }
  
  return handleCreateVirtualTicket(req, res)
})

async function handleCreateVirtualTicket(req, res) {
  try {
    const { event_id, ticket_type_id, quantity, buyer_name, buyer_email, buyer_phone } = req.body

    // Validate required fields
    if (!event_id || !ticket_type_id || !quantity || !buyer_name || !buyer_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Get ticket type info
    const ticketTypeResult = await db.query(
      'SELECT * FROM ticket_types WHERE id = $1',
      [ticket_type_id]
    )

    if (ticketTypeResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Tipo de boleto no encontrado' 
      })
    }

    const ticketType = ticketTypeResult.rows[0]
    const totalAmount = ticketType.price * quantity

    // Create sale record
    const saleResult = await db.query(`
      INSERT INTO sales (event_id, ticket_type_id, quantity, unit_price, total_amount, 
                        buyer_name, buyer_email, buyer_phone, status, payment_method)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [event_id, ticket_type_id, quantity, ticketType.price, totalAmount, 
        buyer_name, buyer_email, buyer_phone || null, 'completed', 'virtual'])

    const saleId = saleResult.rows[0].id

    // Create individual tickets
    const tickets = []
    for (let i = 0; i < quantity; i++) {
      const ticketCode = `VIRT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const qrCode = `https://eventu.co/ticket/${ticketCode}`
      
      const ticketResult = await db.query(`
        INSERT INTO tickets (sale_id, ticket_code, qr_code, status)
        VALUES ($1, $2, $3, $4)
        RETURNING id, ticket_code, qr_code
      `, [saleId, ticketCode, qrCode, 'valid'])

      tickets.push(ticketResult.rows[0])
    }

    // Update sold count in ticket type
    await db.query(
      'UPDATE ticket_types SET sold = sold + $1 WHERE id = $2',
      [quantity, ticket_type_id]
    )

    res.json({
      success: true,
      data: {
        sale_id: saleId,
        tickets: tickets,
        total_amount: totalAmount
      }
    })

  } catch (error) {
    console.error('Error creating virtual ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Export data
router.post('/export', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleExportData(req, res))
    })
  }
  
  return handleExportData(req, res)
})

async function handleExportData(req, res) {
  try {
    const { type, format, filters } = req.body

    let data = []
    let filename = ''

    switch (type) {
      case 'users':
        const usersResult = await db.query(`
          SELECT id, first_name, last_name, email, role, status, created_at
          FROM users
          ORDER BY created_at DESC
        `)
        data = usersResult.rows
        filename = 'usuarios'
        break

      case 'events':
        const eventsResult = await db.query(`
          SELECT e.id, e.title, e.description, e.date, e.time, e.venue, e.status, e.created_at,
                 u.first_name, u.last_name as organizer
          FROM events e
          LEFT JOIN users u ON e.organizer_id = u.id
          ORDER BY e.created_at DESC
        `)
        data = eventsResult.rows
        filename = 'eventos'
        break

      case 'tickets':
        const ticketsResult = await db.query(`
          SELECT t.id, t.ticket_code, t.status, t.created_at,
                 e.title as event_name,
                 tt.name as ticket_type,
                 s.buyer_name, s.buyer_email
          FROM tickets t
          LEFT JOIN sales s ON t.sale_id = s.id
          LEFT JOIN events e ON s.event_id = e.id
          LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
          ORDER BY t.created_at DESC
        `)
        data = ticketsResult.rows
        filename = 'boletas'
        break

      case 'sales':
        const salesResult = await db.query(`
          SELECT s.id, s.quantity, s.unit_price, s.total_amount, s.status, s.created_at,
                 e.title as event_name,
                 tt.name as ticket_type,
                 s.buyer_name, s.buyer_email
          FROM sales s
          LEFT JOIN events e ON s.event_id = e.id
          LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
          ORDER BY s.created_at DESC
        `)
        data = salesResult.rows
        filename = 'ventas'
        break

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Tipo de exportación no válido' 
        })
    }

    // For now, return JSON format
    // In production, you would generate CSV, Excel, or PDF files
    res.json({
      success: true,
      data: {
        type: type,
        format: format,
        filename: `${filename}_${new Date().toISOString().split('T')[0]}.json`,
        data: data,
        total_records: data.length
      }
    })

  } catch (error) {
    console.error('Error exporting data:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get ticket preview
router.get('/tickets/:ticketId/preview', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetTicketPreview(req, res))
    })
  }
  
  return handleGetTicketPreview(req, res)
})

async function handleGetTicketPreview(req, res) {
  try {
    const { ticketId } = req.params

    const ticketResult = await db.query(`
      SELECT t.id, t.ticket_code, t.qr_code, t.status, t.created_at,
             e.title as event_name, e.date, e.time, e.venue,
             tt.name as ticket_type, tt.price,
             s.buyer_name, s.buyer_email, s.buyer_phone
      FROM tickets t
      LEFT JOIN sales s ON t.sale_id = s.id
      LEFT JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE t.id = $1
    `, [ticketId])

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Boleto no encontrado' 
      })
    }

    const ticket = ticketResult.rows[0]

    res.json({
      success: true,
      data: {
        ticket: ticket,
        preview_url: `/admin/tickets/${ticketId}/preview`,
        qr_code_url: ticket.qr_code
      }
    })

  } catch (error) {
    console.error('Error getting ticket preview:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get QR code
router.get('/tickets/:ticketId/qr', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetQRCode(req, res))
    })
  }
  
  return handleGetQRCode(req, res)
})

async function handleGetQRCode(req, res) {
  try {
    const { ticketId } = req.params

    const ticketResult = await db.query(`
      SELECT t.ticket_code, t.qr_code, t.status,
             e.title as event_name, e.date, e.time, e.venue,
             s.buyer_name, s.buyer_email
      FROM tickets t
      LEFT JOIN sales s ON t.sale_id = s.id
      LEFT JOIN events e ON s.event_id = e.id
      WHERE t.id = $1
    `, [ticketId])

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Boleto no encontrado' 
      })
    }

    const ticket = ticketResult.rows[0]

    res.json({
      success: true,
      data: {
        ticket_code: ticket.ticket_code,
        qr_code: ticket.qr_code,
        qr_data: {
          ticket_code: ticket.ticket_code,
          event_name: ticket.event_name,
          event_date: ticket.date,
          event_time: ticket.time,
          venue: ticket.venue,
          buyer_name: ticket.buyer_name,
          buyer_email: ticket.buyer_email
        }
      }
    })

  } catch (error) {
    console.error('Error getting QR code:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get all physical tickets
router.get('/physical-tickets', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetPhysicalTickets(req, res))
    })
  }
  
  return handleGetPhysicalTickets(req, res)
})

async function handleGetPhysicalTickets(req, res) {
  try {
    const { page = 1, limit = 10, search = '', status = '', sales_point = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (pt.batch_number ILIKE $1 OR e.title ILIKE $1 OR pt.sales_point ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (status) {
      whereClause += ` AND pt.status = $${params.length + 1}`
      params.push(status)
    }

    if (sales_point) {
      whereClause += ` AND pt.sales_point = $${params.length + 1}`
      params.push(sales_point)
    }

    const physicalTicketsQuery = `
      SELECT pt.id, pt.batch_number, pt.quantity, pt.printed, pt.sold, pt.price, pt.sales_point, 
             pt.status, pt.created_at, pt.printed_at, pt.distributed_at, pt.notes,
             e.title as event_name, e.id as event_id,
             tt.name as ticket_type, tt.id as ticket_type_id
      FROM physical_tickets pt
      LEFT JOIN events e ON pt.event_id = e.id
      LEFT JOIN ticket_types tt ON pt.ticket_type_id = tt.id
      ${whereClause}
      ORDER BY pt.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM physical_tickets pt
      LEFT JOIN events e ON pt.event_id = e.id
      ${whereClause}
    `

    const [physicalTicketsResult, countResult] = await Promise.all([
      db.query(physicalTicketsQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    const physicalTickets = physicalTicketsResult.rows.map(row => ({
      ...row,
      remaining: row.quantity - row.sold
    }))

    res.json({
      success: true,
      data: {
        physicalTickets: physicalTickets,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting physical tickets:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Create physical ticket batch
router.post('/physical-tickets', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleCreatePhysicalTicketBatch(req, res))
    })
  }
  
  return handleCreatePhysicalTicketBatch(req, res)
})

async function handleCreatePhysicalTicketBatch(req, res) {
  try {
    const { event_id, ticket_type_id, quantity, price, sales_point, notes } = req.body

    // Validate required fields
    if (!event_id || !ticket_type_id || !quantity || !price || !sales_point) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Generate batch number
    const batchNumber = `PT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`

    // Create physical ticket batch
    const result = await db.query(`
      INSERT INTO physical_tickets (batch_number, event_id, ticket_type_id, quantity, price, sales_point, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, batch_number, created_at
    `, [batchNumber, event_id, ticket_type_id, quantity, price, sales_point, notes || null])

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        batch_number: result.rows[0].batch_number,
        created_at: result.rows[0].created_at
      }
    })

  } catch (error) {
    console.error('Error creating physical ticket batch:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get single physical ticket batch
router.get('/physical-tickets/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetPhysicalTicket(req, res))
    })
  }
  
  return handleGetPhysicalTicket(req, res)
})

async function handleGetPhysicalTicket(req, res) {
  try {
    const { id } = req.params

    const query = `
      SELECT pt.id, pt.batch_number, pt.quantity, pt.printed, pt.sold, pt.price, pt.sales_point, 
             pt.status, pt.created_at, pt.printed_at, pt.distributed_at, pt.notes,
             e.title as event_name, e.id as event_id, e.date as event_date, e.venue as event_venue,
             tt.name as ticket_type, tt.id as ticket_type_id
      FROM physical_tickets pt
      LEFT JOIN events e ON pt.event_id = e.id
      LEFT JOIN ticket_types tt ON pt.ticket_type_id = tt.id
      WHERE pt.id = $1
    `

    const result = await db.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lote de boletas físicas no encontrado' 
      })
    }

    const ticket = result.rows[0]
    ticket.remaining = ticket.quantity - ticket.sold

    res.json({
      success: true,
      data: ticket
    })

  } catch (error) {
    console.error('Error getting physical ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Update physical ticket status (print/distribute)
router.put('/physical-tickets/:id/status', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleUpdatePhysicalTicketStatus(req, res))
    })
  }
  
  return handleUpdatePhysicalTicketStatus(req, res)
})

async function handleUpdatePhysicalTicketStatus(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['printed', 'distributed', 'completed'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estado no válido' 
      })
    }

    let updateQuery = 'UPDATE physical_tickets SET status = $1'
    const params = [status, id]

    if (status === 'printed') {
      updateQuery += ', printed = quantity, printed_at = CURRENT_TIMESTAMP'
    } else if (status === 'distributed') {
      updateQuery += ', distributed_at = CURRENT_TIMESTAMP'
    }

    updateQuery += ' WHERE id = $2 RETURNING *'

    const result = await db.query(updateQuery, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lote de boletas no encontrado' 
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating physical ticket status:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Update physical ticket batch
router.put('/physical-tickets/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleUpdatePhysicalTicket(req, res))
    })
  }
  
  return handleUpdatePhysicalTicket(req, res)
})

async function handleUpdatePhysicalTicket(req, res) {
  try {
    const { id } = req.params
    const { quantity, price, sales_point, notes } = req.body

    // Verificar que el lote existe
    const checkQuery = await db.query('SELECT id, sold, status FROM physical_tickets WHERE id = $1', [id])
    
    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lote de boletas no encontrado' 
      })
    }

    const existingTicket = checkQuery.rows[0]

    // Validar que no se pueda reducir la cantidad si ya hay boletos vendidos
    if (quantity && parseInt(quantity) < existingTicket.sold) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede reducir la cantidad. Ya se han vendido ${existingTicket.sold} boletos` 
      })
    }

    // Validar que no se pueda editar si está distribuido o completado
    if (existingTicket.status === 'distributed' || existingTicket.status === 'completed') {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede editar un lote que ya está distribuido o completado' 
      })
    }

    const updateFields = []
    const params = []
    let paramCount = 1

    if (quantity !== undefined) {
      updateFields.push(`quantity = $${paramCount}`)
      params.push(parseInt(quantity))
      paramCount++
    }

    if (price !== undefined) {
      updateFields.push(`price = $${paramCount}`)
      params.push(parseFloat(price))
      paramCount++
    }

    if (sales_point !== undefined) {
      updateFields.push(`sales_point = $${paramCount}`)
      params.push(sales_point)
      paramCount++
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramCount}`)
      params.push(notes)
      paramCount++
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No hay campos para actualizar' 
      })
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`)
    params.push(id)

    const updateQuery = `
      UPDATE physical_tickets 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const result = await db.query(updateQuery, params)

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating physical ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Delete physical ticket batch
router.delete('/physical-tickets/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleDeletePhysicalTicket(req, res))
    })
  }
  
  return handleDeletePhysicalTicket(req, res)
})

async function handleDeletePhysicalTicket(req, res) {
  try {
    const { id } = req.params

    // Verificar que el lote existe y obtener información
    const checkQuery = await db.query(`
      SELECT id, sold, status, distributed_at 
      FROM physical_tickets 
      WHERE id = $1
    `, [id])
    
    if (checkQuery.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Lote de boletas no encontrado' 
      })
    }

    const ticket = checkQuery.rows[0]

    // Validar que no se pueda eliminar si hay boletos vendidos
    if (ticket.sold > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `No se puede eliminar un lote con boletos vendidos (${ticket.sold} vendidos)` 
      })
    }

    // Validar que no se pueda eliminar si está distribuido
    if (ticket.status === 'distributed' || ticket.distributed_at) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se puede eliminar un lote que ya está distribuido' 
      })
    }

    // Eliminar el lote
    const result = await db.query('DELETE FROM physical_tickets WHERE id = $1 RETURNING id', [id])

    res.json({
      success: true,
      message: 'Lote de boletas eliminado exitosamente',
      data: { id: result.rows[0].id }
    })

  } catch (error) {
    console.error('Error deleting physical ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get sales points
router.get('/sales-points', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetSalesPoints(req, res))
    })
  }
  
  return handleGetSalesPoints(req, res)
})

async function handleGetSalesPoints(req, res) {
  try {
    const result = await db.query(`
      SELECT id, name, location, address, contact_person, contact_phone, contact_email, status
      FROM sales_points
      WHERE status = 'active'
      ORDER BY name
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('Error getting sales points:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get all virtual tickets
router.get('/virtual-tickets', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetVirtualTickets(req, res))
    })
  }
  
  return handleGetVirtualTickets(req, res)
})

async function handleGetVirtualTickets(req, res) {
  try {
    const { page = 1, limit = 10, search = '', status = '', event_id = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (vt.ticket_number ILIKE $1 OR vt.customer_name ILIKE $1 OR vt.customer_email ILIKE $1 OR e.title ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (status) {
      whereClause += ` AND vt.status = $${params.length + 1}`
      params.push(status)
    }

    if (event_id) {
      whereClause += ` AND vt.event_id = $${params.length + 1}`
      params.push(event_id)
    }

    const virtualTicketsQuery = `
      SELECT vt.id, vt.ticket_number, vt.customer_name, vt.customer_email, vt.customer_phone,
             vt.price, vt.qr_code, vt.status, vt.purchase_date, vt.event_date, vt.used_at, vt.sent_at, vt.notes,
             e.title as event_name, e.id as event_id,
             tt.name as ticket_type, tt.id as ticket_type_id
      FROM virtual_tickets vt
      LEFT JOIN events e ON vt.event_id = e.id
      LEFT JOIN ticket_types tt ON vt.ticket_type_id = tt.id
      ${whereClause}
      ORDER BY vt.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM virtual_tickets vt
      LEFT JOIN events e ON vt.event_id = e.id
      ${whereClause}
    `

    const [virtualTicketsResult, countResult] = await Promise.all([
      db.query(virtualTicketsQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    res.json({
      success: true,
      data: {
        virtualTickets: virtualTicketsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting virtual tickets:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Create virtual ticket
router.post('/virtual-tickets', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleCreateVirtualTicket(req, res))
    })
  }
  
  return handleCreateVirtualTicket(req, res)
})

async function handleCreateVirtualTicket(req, res) {
  try {
    const { event_id, ticket_type_id, customer_name, customer_email, customer_phone, price, event_date, notes } = req.body

    // Validate required fields
    if (!event_id || !ticket_type_id || !customer_name || !customer_email || !price || !event_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos los campos son requeridos' 
      })
    }

    // Generate ticket number
    const ticketNumber = `VT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
    
    // Generate QR code
    const qrCode = `https://eventu.co/ticket/${ticketNumber}`

    // Create virtual ticket
    const result = await db.query(`
      INSERT INTO virtual_tickets (ticket_number, event_id, ticket_type_id, customer_name, customer_email, customer_phone, price, qr_code, event_date, notes, sent_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      RETURNING id, ticket_number, created_at
    `, [ticketNumber, event_id, ticket_type_id, customer_name, customer_email, customer_phone || null, price, qrCode, event_date, notes || null])

    res.json({
      success: true,
      data: {
        id: result.rows[0].id,
        ticket_number: result.rows[0].ticket_number,
        created_at: result.rows[0].created_at
      }
    })

  } catch (error) {
    console.error('Error creating virtual ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Update virtual ticket status
router.put('/virtual-tickets/:id/status', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleUpdateVirtualTicketStatus(req, res))
    })
  }
  
  return handleUpdateVirtualTicketStatus(req, res)
})

async function handleUpdateVirtualTicketStatus(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['active', 'used', 'cancelled', 'expired'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Estado no válido' 
      })
    }

    let updateQuery = 'UPDATE virtual_tickets SET status = $1'
    const params = [status, id]

    if (status === 'used') {
      updateQuery += ', used_at = CURRENT_TIMESTAMP'
    }

    updateQuery += ' WHERE id = $2 RETURNING *'

    const result = await db.query(updateQuery, params)

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Boleto virtual no encontrado' 
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating virtual ticket status:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Resend virtual ticket
router.post('/virtual-tickets/:id/resend', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleResendVirtualTicket(req, res))
    })
  }
  
  return handleResendVirtualTicket(req, res)
})

async function handleResendVirtualTicket(req, res) {
  try {
    const { id } = req.params

    const result = await db.query(`
      UPDATE virtual_tickets 
      SET sent_at = CURRENT_TIMESTAMP 
      WHERE id = $1 
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Boleto virtual no encontrado' 
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error resending virtual ticket:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Media library endpoints
router.get('/media', auth, requireAdmin, handleGetMedia)

async function handleGetMedia(req, res) {
  try {
    const { page = 1, limit = 20, search = '', type = '', folder_id = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []

    if (search) {
      whereClause += ' AND (mf.name ILIKE $1 OR mf.original_name ILIKE $1 OR mf.description ILIKE $1)'
      params.push(`%${search}%`)
    }

    if (type) {
      whereClause += ` AND mf.type = $${params.length + 1}`
      params.push(type)
    }

    if (folder_id) {
      whereClause += ` AND mf.folder_id = $${params.length + 1}`
      params.push(folder_id)
    }

    const mediaQuery = `
      SELECT mf.id, mf.name, mf.original_name, mf.type, mf.size, mf.url, 
             mf.alt_text, mf.description, mf.tags, mf.folder_id, 
             mf.upload_date, mf.last_used, mf.usage_count,
             mfld.name as folder_name
      FROM media_files mf
      LEFT JOIN media_folders mfld ON mf.folder_id = mfld.id
      ${whereClause}
      ORDER BY mf.upload_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM media_files mf
      ${whereClause}
    `

    const [mediaResult, countResult] = await Promise.all([
      db.query(mediaQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    res.json({
      success: true,
      data: {
        media: mediaResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error('Error getting media:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Upload media files
router.post('/media/upload', auth, requireAdmin, upload.array('files', 10), (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err);
    return res.status(400).json({ 
      success: false, 
      error: 'Error en la subida de archivos: ' + err.message 
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({ 
      success: false, 
      error: 'Error en la subida: ' + err.message 
    });
  }
  next();
}, handleUploadMedia)

async function handleUploadMedia(req, res) {
  try {
    console.log('Upload request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);
    
    // Verificar si la tabla existe
    const tableCheck = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media_files'
      )
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (!tableExists) {
      console.warn('Table media_files does not exist, checking for media table...');
      
      // Verificar si existe la tabla 'media' como alternativa
      const mediaTableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'media'
        )
      `);
      
      if (!mediaTableCheck.rows[0].exists) {
        return res.status(500).json({ 
          success: false, 
          error: 'Las tablas de medios no existen en la base de datos. Por favor, ejecuta las migraciones necesarias.' 
        });
      }
    }
    
    const uploadedFiles = []
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No se recibieron archivos' 
      });
    }
    
    console.log(`Processing ${req.files.length} files`);
    
    // Determinar qué tabla usar
    const useMediaTable = !tableExists;
    const tableName = useMediaTable ? 'media' : 'media_files';
    
    for (const file of req.files) {
      try {
        console.log('Processing file:', file.originalname);
        
        const fileType = getFileType(file.originalname);
        const fileUrl = `/uploads/${file.filename}`;
        
        console.log('File type:', fileType);
        console.log('File URL:', fileUrl);
        
        let result;
        
        if (useMediaTable) {
          // Usar tabla 'media'
          result = await db.query(`
            INSERT INTO media (name, original_name, type, size, url, folder, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING id, name, original_name, type, size, url, folder, created_at
          `, [
            file.filename,
            file.originalname,
            fileType,
            file.size,
            fileUrl,
            req.body.folder || null
          ]);
          
          uploadedFiles.push({
            id: result.rows[0].id,
            name: result.rows[0].name,
            original_name: result.rows[0].original_name,
            type: result.rows[0].type,
            size: result.rows[0].size,
            url: result.rows[0].url,
            upload_date: result.rows[0].created_at
          });
        } else {
          // Usar tabla 'media_files'
          result = await db.query(`
            INSERT INTO media_files (name, original_name, type, size, url, upload_date)
            VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
            RETURNING id, name, original_name, type, size, url, upload_date
          `, [
            file.filename,
            file.originalname,
            fileType,
            file.size,
            fileUrl
          ]);

          uploadedFiles.push({
            id: result.rows[0].id,
            name: result.rows[0].name,
            original_name: result.rows[0].original_name,
            type: result.rows[0].type,
            size: result.rows[0].size,
            url: result.rows[0].url,
            upload_date: result.rows[0].upload_date
          });
        }

        console.log('Database result:', result.rows[0]);
      } catch (fileError) {
        console.error(`Error processing file ${file.originalname}:`, fileError);
        // Continuar con el siguiente archivo
      }
    }

    if (uploadedFiles.length === 0) {
      return res.status(500).json({ 
        success: false, 
        error: 'No se pudo procesar ningún archivo' 
      });
    }

    console.log('Uploaded files:', uploadedFiles);

    res.json({
      success: true,
      data: uploadedFiles
    })

  } catch (error) {
    console.error('Error uploading media:', error)
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor: ' + (error.message || 'Error desconocido') 
    })
  }
}

// Get media folders
router.get('/media/folders', auth, requireAdmin, handleGetMediaFolders)

async function handleGetMediaFolders(req, res) {
  try {
    const result = await db.query(`
      SELECT mf.id, mf.name, mf.parent_id, mf.created_date,
             COUNT(mf2.id) as file_count
      FROM media_folders mf
      LEFT JOIN media_files mf2 ON mf.id = mf2.folder_id
      GROUP BY mf.id, mf.name, mf.parent_id, mf.created_date
      ORDER BY mf.name
    `)

    res.json({
      success: true,
      data: result.rows
    })

  } catch (error) {
    console.error('Error getting media folders:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Create media folder
router.post('/media/folders', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleCreateMediaFolder(req, res))
    })
  }
  
  return handleCreateMediaFolder(req, res)
})

async function handleCreateMediaFolder(req, res) {
  try {
    const { name, parent_id } = req.body

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'El nombre de la carpeta es requerido' 
      })
    }

    const result = await db.query(`
      INSERT INTO media_folders (name, parent_id)
      VALUES ($1, $2)
      RETURNING id, name, parent_id, created_date
    `, [name, parent_id || null])

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error creating media folder:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Delete media folder
router.delete('/media/folders/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleDeleteMediaFolder(req, res))
    })
  }
  
  return handleDeleteMediaFolder(req, res)
})

async function handleDeleteMediaFolder(req, res) {
  try {
    const { id } = req.params

    const result = await db.query(`
      DELETE FROM media_folders 
      WHERE id = $1 
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Carpeta no encontrada' 
      })
    }

    res.json({
      success: true,
      data: { id: result.rows[0].id }
    })

  } catch (error) {
    console.error('Error deleting media folder:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Update media file
router.put('/media/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleUpdateMedia(req, res))
    })
  }
  
  return handleUpdateMedia(req, res)
})

async function handleUpdateMedia(req, res) {
  try {
    const { id } = req.params
    const { name, alt_text, description, tags, folder_id } = req.body

    const result = await db.query(`
      UPDATE media_files 
      SET name = COALESCE($1, name),
          alt_text = COALESCE($2, alt_text),
          description = COALESCE($3, description),
          tags = COALESCE($4, tags),
          folder_id = COALESCE($5, folder_id),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6 
      RETURNING *
    `, [name, alt_text, description, tags, folder_id, id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Archivo no encontrado' 
      })
    }

    res.json({
      success: true,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating media:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Delete media file
router.delete('/media/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleDeleteMedia(req, res))
    })
  }
  
  return handleDeleteMedia(req, res)
})

async function handleDeleteMedia(req, res) {
  try {
    const { id } = req.params

    const result = await db.query(`
      DELETE FROM media_files 
      WHERE id = $1 
      RETURNING id
    `, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Archivo no encontrado' 
      })
    }

    res.json({
      success: true,
      data: { id: result.rows[0].id }
    })

  } catch (error) {
    console.error('Error deleting media:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get audit logs (admin only)
router.get('/audit-logs', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    // Apply auth middleware for production
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetAuditLogs(req, res))
    })
  }
  
  // For development, skip auth
  return handleGetAuditLogs(req, res)
})

async function handleGetAuditLogs(req, res) {
  try {
    const { page = 1, limit = 50, search = '', severity = '', status = '', action = '' } = req.query
    const offset = (page - 1) * limit

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (
        user_name ILIKE $${paramIndex} OR 
        user_email ILIKE $${paramIndex} OR 
        action ILIKE $${paramIndex} OR 
        resource ILIKE $${paramIndex} OR
        ip_address::text ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (severity) {
      whereClause += ` AND severity = $${paramIndex}`
      params.push(severity)
      paramIndex++
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (action) {
      whereClause += ` AND action = $${paramIndex}`
      params.push(action)
      paramIndex++
    }

    const logsQuery = `
      SELECT 
        id,
        user_name,
        user_email,
        action,
        resource,
        severity,
        status,
        ip_address,
        user_agent,
        timestamp as created_at,
        details
      FROM audit_logs
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs
      ${whereClause}
    `

    const [logsResult, countResult] = await Promise.all([
      db.query(logsQuery, [...params, limit, offset]),
      db.query(countQuery, params)
    ])

    res.json({
      success: true,
      data: {
        logs: logsResult.rows,
        pagination: {
          total: parseInt(countResult.rows[0].total),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
        }
      }
    })
  } catch (error) {
    console.error('Get audit logs error:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

// Helper function to determine file type
function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase()
  
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) {
    return 'image'
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) {
    return 'video'
  } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext)) {
    return 'audio'
  } else {
    return 'document'
  }
}

// ============================================
// TICKET TEMPLATES ROUTES
// ============================================

// Get all ticket templates
router.get('/ticket-templates', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetTicketTemplates(req, res))
    })
  }
  
  return handleGetTicketTemplates(req, res)
})

async function handleGetTicketTemplates(req, res) {
  try {
    // Verificar si la tabla existe
    let tableExists = false
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'ticket_templates'
        )
      `)
      tableExists = tableCheck.rows[0]?.exists || false
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla ticket_templates:', tableCheckError)
      tableExists = false
    }

    if (!tableExists) {
      return res.json({
        success: true,
        data: []
      })
    }

    const { clientId, eventId } = req.query

    let query = `
      SELECT * FROM ticket_templates
      WHERE is_active = true
    `
    const params = []
    
    if (clientId) {
      query += ` AND (client_id = $${params.length + 1} OR client_id IS NULL)`
      params.push(clientId)
    }
    
    if (eventId) {
      query += ` AND (event_id = $${params.length + 1} OR event_id IS NULL)`
      params.push(eventId)
    }
    
    query += ` ORDER BY is_default DESC, updated_at DESC`

    const result = await db.query(query, params)

    res.json({
      success: true,
      data: result.rows.map(row => ({
        ...row,
        measurements: typeof row.measurements === 'string' 
          ? JSON.parse(row.measurements) 
          : row.measurements,
        fields: typeof row.fields === 'string' 
          ? JSON.parse(row.fields) 
          : row.fields,
        printConfig: typeof row.print_config === 'string' 
          ? JSON.parse(row.print_config) 
          : row.print_config,
      }))
    })
  } catch (error) {
    console.error('Error getting ticket templates:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Get single ticket template
router.get('/ticket-templates/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleGetTicketTemplate(req, res))
    })
  }
  
  return handleGetTicketTemplate(req, res)
})

async function handleGetTicketTemplate(req, res) {
  try {
    // Verificar si la tabla existe
    let tableExists = false
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'ticket_templates'
        )
      `)
      tableExists = tableCheck.rows[0]?.exists || false
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla ticket_templates:', tableCheckError)
      tableExists = false
    }

    if (!tableExists) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' })
    }

    const { id } = req.params

    const result = await db.query(
      'SELECT * FROM ticket_templates WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' })
    }

    const template = result.rows[0]
    res.json({
      success: true,
      data: {
        ...template,
        measurements: typeof template.measurements === 'string' 
          ? JSON.parse(template.measurements) 
          : template.measurements,
        fields: typeof template.fields === 'string' 
          ? JSON.parse(template.fields) 
          : template.fields,
        printConfig: typeof template.print_config === 'string' 
          ? JSON.parse(template.print_config) 
          : template.print_config,
      }
    })
  } catch (error) {
    console.error('Error getting ticket template:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Create or update ticket template
router.post('/ticket-templates', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleSaveTicketTemplate(req, res))
    })
  }
  
  return handleSaveTicketTemplate(req, res)
})

async function handleSaveTicketTemplate(req, res) {
  try {
    // Verificar si la tabla existe
    let tableExists = false
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'ticket_templates'
        )
      `)
      tableExists = tableCheck.rows[0]?.exists || false
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla ticket_templates:', tableCheckError)
      tableExists = false
    }

    if (!tableExists) {
      return res.status(500).json({ 
        success: false, 
        error: 'La tabla ticket_templates no existe. Por favor, ejecuta la migración correspondiente.' 
      })
    }

    const {
      id,
      name,
      description,
      clientId,
      eventId,
      measurements,
      fields,
      printConfig,
      isDefault,
      isActive
    } = req.body

    // Validate required fields
    if (!name || !measurements || !fields) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nombre, medidas y campos son requeridos' 
      })
    }

    const userId = req.user?.id || 'system'
    const now = new Date().toISOString()

    if (id) {
      // Update existing template
      const result = await db.query(
        `UPDATE ticket_templates 
         SET name = $1, description = $2, client_id = $3, event_id = $4,
             measurements = $5, fields = $6, print_config = $7,
             is_default = $8, is_active = $9, updated_at = $10
         WHERE id = $11
         RETURNING *`,
        [
          name,
          description || null,
          clientId || null,
          eventId || null,
          JSON.stringify(measurements),
          JSON.stringify(fields),
          JSON.stringify(printConfig),
          isDefault || false,
          isActive !== undefined ? isActive : true,
          now,
          id
        ]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Plantilla no encontrada' })
      }

      res.json({
        success: true,
        data: {
          ...result.rows[0],
          measurements: typeof result.rows[0].measurements === 'string' 
            ? JSON.parse(result.rows[0].measurements) 
            : result.rows[0].measurements,
          fields: typeof result.rows[0].fields === 'string' 
            ? JSON.parse(result.rows[0].fields) 
            : result.rows[0].fields,
          printConfig: typeof result.rows[0].print_config === 'string' 
            ? JSON.parse(result.rows[0].print_config) 
            : result.rows[0].print_config,
        }
      })
    } else {
      // Create new template
      const newId = `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const result = await db.query(
        `INSERT INTO ticket_templates 
         (id, name, description, client_id, event_id, measurements, fields, print_config,
          is_default, is_active, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          newId,
          name,
          description || null,
          clientId || null,
          eventId || null,
          JSON.stringify(measurements),
          JSON.stringify(fields),
          JSON.stringify(printConfig),
          isDefault || false,
          isActive !== undefined ? isActive : true,
          userId,
          now,
          now
        ]
      )

      res.status(201).json({
        success: true,
        data: {
          ...result.rows[0],
          measurements: typeof result.rows[0].measurements === 'string' 
            ? JSON.parse(result.rows[0].measurements) 
            : result.rows[0].measurements,
          fields: typeof result.rows[0].fields === 'string' 
            ? JSON.parse(result.rows[0].fields) 
            : result.rows[0].fields,
          printConfig: typeof result.rows[0].print_config === 'string' 
            ? JSON.parse(result.rows[0].print_config) 
            : result.rows[0].print_config,
        }
      })
    }
  } catch (error) {
    console.error('Error saving ticket template:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

// Delete ticket template
router.delete('/ticket-templates/:id', async (req, res) => {
  // Skip auth check for development
  if (process.env.NODE_ENV === 'production') {
    return auth(req, res, () => {
      return requireAdmin(req, res, () => handleDeleteTicketTemplate(req, res))
    })
  }
  
  return handleDeleteTicketTemplate(req, res)
})

async function handleDeleteTicketTemplate(req, res) {
  try {
    // Verificar si la tabla existe
    let tableExists = false
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'ticket_templates'
        )
      `)
      tableExists = tableCheck.rows[0]?.exists || false
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla ticket_templates:', tableCheckError)
      tableExists = false
    }

    if (!tableExists) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' })
    }

    const { id } = req.params

    // Check if template is default
    const checkResult = await db.query(
      'SELECT is_default FROM ticket_templates WHERE id = $1',
      [id]
    )

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Plantilla no encontrada' })
    }

    if (checkResult.rows[0].is_default) {
      return res.status(400).json({
        success: false,
        error: 'No se puede eliminar la plantilla por defecto'
      })
    }

    await db.query('DELETE FROM ticket_templates WHERE id = $1', [id])

    res.json({ success: true, message: 'Plantilla eliminada correctamente' })
  } catch (error) {
    console.error('Error deleting ticket template:', error)
    res.status(500).json({ success: false, error: 'Error interno del servidor' })
  }
}

module.exports = router
