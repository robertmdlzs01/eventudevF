
const express = require('express')
const router = express.Router()
const db = require('../config/database-postgres')
const { auth, requireRole } = require('../middleware/auth')

// Middleware para verificar que el usuario es organizador
const requireOrganizer = requireRole('organizer')

// Middleware para verificar que el usuario puede acceder a los datos del organizador
const canAccessOrganizer = (req, res, next) => {
  const { organizerId } = req.params
  const userId = req.user.userId
  
  // Permitir acceso si el usuario es admin o si está accediendo a sus propios datos
  if (req.user.role === 'admin' || parseInt(organizerId) === userId) {
    return next()
  }
  
  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para acceder a estos datos'
  })
}

// ===== DASHBOARD STATS =====
router.get('/dashboard-stats/:organizerId', auth, requireOrganizer, canAccessOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params

    // Verificar que el organizador existe
    const organizerCheck = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1 AND role = $2',
      [organizerId, 'organizer']
    )

    if (organizerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizador no encontrado'
      })
    }

    // Obtener estadísticas generales
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'published' THEN e.id END) as published_events,
        COUNT(DISTINCT CASE WHEN e.status = 'draft' THEN e.id END) as draft_events,
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.quantity), 0) as total_tickets_sold,
        COUNT(DISTINCT s.buyer_email) as unique_customers,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN COALESCE(SUM(s.total_amount), 0) / COUNT(DISTINCT s.id)
          ELSE 0 
        END as average_order_value
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
    `

    const overviewResult = await db.query(overviewQuery, [organizerId])
    const overview = overviewResult.rows[0]

    // Obtener tendencia mensual
    const monthlyTrendQuery = `
      SELECT 
        TO_CHAR(s.created_at, 'YYYY-MM') as month,
        COUNT(s.id) as sales,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      JOIN events e ON s.event_id = e.id
      WHERE e.organizer_id = $1
        AND s.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(s.created_at, 'YYYY-MM')
      ORDER BY month DESC
      LIMIT 12
    `

    const monthlyTrendResult = await db.query(monthlyTrendQuery, [organizerId])
    const monthlyTrend = monthlyTrendResult.rows

    // Obtener eventos con mejor rendimiento
    const topEventsQuery = `
      SELECT 
        e.id,
        e.title,
        e.date,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        e.total_capacity,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
        AND e.status = 'published'
      GROUP BY e.id, e.title, e.date, e.total_capacity
      ORDER BY revenue DESC
      LIMIT 5
    `

    const topEventsResult = await db.query(topEventsQuery, [organizerId])
    const topEvents = topEventsResult.rows

    // Obtener actividad reciente
    const recentActivityQuery = `
      SELECT 
        'sale' as type,
        s.id,
        'Nueva venta realizada' as description,
        s.total_amount,
        e.title as event_title,
        s.created_at,
        EXTRACT(EPOCH FROM (NOW() - s.created_at)) / 3600 as hours_ago
      FROM sales s
      JOIN events e ON s.event_id = e.id
      WHERE e.organizer_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    const recentActivityResult = await db.query(recentActivityQuery, [organizerId])
    const recentActivity = recentActivityResult.rows.map(activity => ({
      ...activity,
      timeAgo: activity.hours_ago < 1 
        ? 'hace menos de 1 hora' 
        : activity.hours_ago < 24 
          ? `hace ${Math.floor(activity.hours_ago)} horas`
          : `hace ${Math.floor(activity.hours_ago / 24)} días`
    }))

    res.json({
      success: true,
      data: {
        overview: {
          totalEvents: parseInt(overview.total_events) || 0,
          publishedEvents: parseInt(overview.published_events) || 0,
          draftEvents: parseInt(overview.draft_events) || 0,
          totalSales: parseInt(overview.total_sales) || 0,
          totalRevenue: parseInt(overview.total_revenue) || 0,
          totalTicketsSold: parseInt(overview.total_tickets_sold) || 0,
          uniqueCustomers: parseInt(overview.unique_customers) || 0,
          averageOrderValue: parseInt(overview.average_order_value) || 0
        },
        monthlyTrend,
        topEvents: topEvents.map(event => ({
          id: event.id,
          title: event.title,
          date: event.date,
          salesCount: parseInt(event.sales_count) || 0,
          revenue: parseInt(event.revenue) || 0,
          ticketsSold: parseInt(event.tickets_sold) || 0,
          totalCapacity: parseInt(event.total_capacity) || 0,
          occupancyRate: parseFloat(event.occupancy_rate) || 0
        })),
        recentActivity
      }
    })

  } catch (error) {
    console.error('Error getting dashboard stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== DASHBOARD GENERAL =====
router.get('/dashboard', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId

    // Obtener estadísticas generales
    const overviewQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'published' THEN e.id END) as published_events,
        COUNT(DISTINCT CASE WHEN e.status = 'draft' THEN e.id END) as draft_events,
        COALESCE(COUNT(DISTINCT s.id), 0) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.quantity), 0) as total_tickets_sold,
        COALESCE(COUNT(DISTINCT s.buyer_email), 0) as unique_customers,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN COALESCE(SUM(s.total_amount), 0) / COUNT(DISTINCT s.id)
          ELSE 0 
        END as average_order_value
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
    `

    // Obtener ventas de hoy
    const todaySalesQuery = `
      SELECT 
        COALESCE(COUNT(DISTINCT s.id), 0) as sales_today,
        COALESCE(SUM(s.total_amount), 0) as revenue_today
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id 
        AND DATE(s.created_at) = CURRENT_DATE
      WHERE e.organizer_id = $1
    `

    // Obtener total de asistentes
    const attendeesQuery = `
      SELECT 
        COALESCE(SUM(s.quantity), 0) as total_attendees
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
    `

    // Obtener alertas (eventos próximos sin ventas, eventos con baja ocupación, etc.)
    const alertsQuery = `
      SELECT 
        COUNT(CASE 
          WHEN e.date <= NOW() + INTERVAL '7 days' 
          AND e.status = 'published' 
          THEN 1 
        END) as upcoming_events_no_sales,
        COUNT(CASE 
          WHEN e.date <= NOW() + INTERVAL '3 days' 
          AND e.status = 'published' 
          THEN 1 
        END) as events_this_week
      FROM events e
      WHERE e.organizer_id = $1
    `

    const overviewResult = await db.query(overviewQuery, [organizerId])
    const overview = overviewResult.rows[0] || {}

    const todaySalesResult = await db.query(todaySalesQuery, [organizerId])
    const todaySales = todaySalesResult.rows[0] || {}

    const attendeesResult = await db.query(attendeesQuery, [organizerId])
    const attendees = attendeesResult.rows[0] || {}

    const alertsResult = await db.query(alertsQuery, [organizerId])
    const alerts = alertsResult.rows[0] || {}

    const stats = {
      totalEvents: parseInt(overview.total_events) || 0,
      publishedEvents: parseInt(overview.published_events) || 0,
      draftEvents: parseInt(overview.draft_events) || 0,
      totalSales: parseInt(overview.total_sales) || 0,
      totalRevenue: parseInt(overview.total_revenue) || 0,
      totalTicketsSold: parseInt(overview.total_tickets_sold) || 0,
      uniqueCustomers: parseInt(overview.unique_customers) || 0,
      averageOrderValue: parseInt(overview.average_order_value) || 0,
      todaySales: parseInt(todaySales.sales_today) || 0,
      todayRevenue: parseInt(todaySales.revenue_today) || 0,
      totalAttendees: parseInt(attendees.total_attendees) || 0,
      alerts: parseInt(alerts.upcoming_events_no_sales) || 0,
      eventsThisWeek: parseInt(alerts.events_this_week) || 0
    }

    res.json({
      success: true,
      data: {
        stats
      }
    })

  } catch (error) {
    console.error('Error getting dashboard:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== QUICK STATS (Para actualizaciones en tiempo real) =====
router.get('/quick-stats', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId

    // Consulta optimizada solo para estadísticas rápidas
    const quickStatsQuery = `
      SELECT 
        COUNT(CASE WHEN e.status = 'published' THEN 1 END) as active_events,
        COALESCE(SUM(CASE WHEN DATE(s.created_at) = CURRENT_DATE THEN s.total_amount ELSE 0 END), 0) as today_revenue,
        COALESCE(SUM(s.quantity), 0) as total_attendees,
        COUNT(CASE 
          WHEN e.date <= NOW() + INTERVAL '7 days' 
          AND e.status = 'published' 
          AND NOT EXISTS (SELECT 1 FROM sales s2 WHERE s2.event_id = e.id)
          THEN 1 
        END) as alerts
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
    `

    const result = await db.query(quickStatsQuery, [organizerId])
    const stats = result.rows[0] || {}

    res.json({
      success: true,
      data: {
        activeEvents: parseInt(stats.active_events) || 0,
        todayRevenue: parseInt(stats.today_revenue) || 0,
        totalAttendees: parseInt(stats.total_attendees) || 0,
        alerts: parseInt(stats.alerts) || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting quick stats:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== SALES REALTIME =====
router.get('/sales-realtime/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params

    // Obtener datos de ventas en tiempo real
    const realtimeQuery = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.date as event_date,
        e.total_capacity,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        e.total_capacity - COALESCE(SUM(s.quantity), 0) as remaining_capacity,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate,
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        CASE 
          WHEN COUNT(s.id) > 0 
          THEN COALESCE(SUM(s.total_amount), 0) / COUNT(s.id)
          ELSE 0 
        END as average_sale_amount,
        COUNT(CASE WHEN s.created_at >= NOW() - INTERVAL '1 hour' THEN s.id END) as sales_last_hour,
        COUNT(CASE WHEN s.created_at >= DATE_TRUNC('day', NOW()) THEN s.id END) as sales_today,
        COUNT(CASE WHEN s.created_at >= DATE_TRUNC('week', NOW()) THEN s.id END) as sales_this_week,
        MAX(s.created_at) as last_sale_time
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
        AND e.status = 'published'
      GROUP BY e.id, e.title, e.date, e.total_capacity
      ORDER BY e.date ASC
    `

    const realtimeResult = await db.query(realtimeQuery, [organizerId])
    const realtimeData = realtimeResult.rows.map(event => ({
      eventId: event.event_id,
      eventTitle: event.event_title,
      eventDate: event.event_date,
      totalCapacity: parseInt(event.total_capacity) || 0,
      ticketsSold: parseInt(event.tickets_sold) || 0,
      remainingCapacity: parseInt(event.remaining_capacity) || 0,
      occupancyRate: parseFloat(event.occupancy_rate) || 0,
      totalSales: parseInt(event.total_sales) || 0,
      totalRevenue: parseInt(event.total_revenue) || 0,
      averageSaleAmount: parseInt(event.average_sale_amount) || 0,
      salesLastHour: parseInt(event.sales_last_hour) || 0,
      salesToday: parseInt(event.sales_today) || 0,
      salesThisWeek: parseInt(event.sales_this_week) || 0,
      lastSaleTime: event.last_sale_time,
      recentSales: [], // Se puede expandir si es necesario
      hourlySales: [], // Se puede expandir si es necesario
      timestamp: new Date().toISOString()
    }))

    res.json({
      success: true,
      data: realtimeData
    })

  } catch (error) {
    console.error('Error getting realtime sales:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ORGANIZER EVENTS (Sin ID - Usa usuario autenticado) =====
router.get('/events', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { status, category, search, page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.venue,
        e.status,
        e.category_id,
        e.image_url,
        e.total_capacity,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
      GROUP BY e.id, e.title, e.description, e.date, e.time, e.venue, e.status, e.category_id, e.image_url, e.total_capacity
    `

    const params = [organizerId]
    let paramCount = 1

    if (status && status !== 'all') {
      paramCount++
      query += ` AND e.status = $${paramCount}`
      params.push(status)
    }

    if (category && category !== 'all') {
      paramCount++
      query += ` AND e.category_id = $${paramCount}`
      params.push(category)
    }

    if (search) {
      paramCount++
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    // Query para contar total (sin GROUP BY)
    let countQuery = `
      SELECT COUNT(DISTINCT e.id) as total
      FROM events e
      WHERE e.organizer_id = $1
    `
    const countParams = [organizerId]
    let countParamCount = 1

    if (status && status !== 'all') {
      countParamCount++
      countQuery += ` AND e.status = $${countParamCount}`
      countParams.push(status)
    }

    if (category && category !== 'all') {
      countParamCount++
      countQuery += ` AND e.category_id = $${countParamCount}`
      countParams.push(category)
    }

    if (search) {
      countParamCount++
      countQuery += ` AND (e.title ILIKE $${countParamCount} OR e.description ILIKE $${countParamCount})`
      countParams.push(`%${search}%`)
    }

    const countResult = await db.query(countQuery, countParams)
    const total = parseInt(countResult.rows[0].total) || 0

    // Query principal con paginación
    query += `
      ORDER BY e.date DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `
    params.push(limit, offset)

    const result = await db.query(query, params)
    const events = result.rows.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      status: event.status,
      ticketsSold: parseInt(event.tickets_sold) || 0,
      totalCapacity: parseInt(event.total_capacity) || 0,
      revenue: parseInt(event.revenue) || 0,
      category: event.category_id,
      image: event.image_url,
      description: event.description,
      occupancyRate: parseFloat(event.occupancy_rate) || 0
    }))

    res.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error getting organizer events:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ORGANIZER EVENTS (Con ID específico) =====
router.get('/events/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params
    const { status, category, search } = req.query

    let query = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.venue,
        e.status,
        e.category_id,
        e.image_url,
        e.total_capacity,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
    `

    const params = [organizerId]
    let paramCount = 1

    if (status && status !== 'all') {
      paramCount++
      query += ` AND e.status = $${paramCount}`
      params.push(status)
    }

    if (category && category !== 'all') {
      paramCount++
      query += ` AND e.category_id = $${paramCount}`
      params.push(category)
    }

    if (search) {
      paramCount++
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    query += `
      GROUP BY e.id, e.title, e.description, e.date, e.time, e.venue, e.status, e.category_id, e.image_url, e.total_capacity
      ORDER BY e.date DESC
    `

    const result = await db.query(query, params)
    const events = result.rows.map(event => ({
      id: event.id,
      title: event.title,
      date: event.date,
      time: event.time,
      venue: event.venue,
      status: event.status,
      ticketsSold: parseInt(event.tickets_sold) || 0,
      totalCapacity: parseInt(event.total_capacity) || 0,
      revenue: parseInt(event.revenue) || 0,
      category: event.category_id,
      image: event.image_url,
      description: event.description
    }))

    res.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error getting organizer events:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ORGANIZER SALES =====
router.get('/sales/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params
    const { eventId, startDate, endDate, status } = req.query

    let query = `
      SELECT 
        s.id,
        s.quantity,
        s.total_amount,
        s.buyer_name,
        s.buyer_email,
        s.payment_method,
        s.status,
        s.created_at,
        e.title as event_title,
        e.date as event_date,
        tt.name as ticket_type
      FROM sales s
      JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE e.organizer_id = $1
    `

    const params = [organizerId]
    let paramCount = 1

    if (eventId) {
      paramCount++
      query += ` AND e.id = $${paramCount}`
      params.push(eventId)
    }

    if (startDate) {
      paramCount++
      query += ` AND s.created_at >= $${paramCount}`
      params.push(startDate)
    }

    if (endDate) {
      paramCount++
      query += ` AND s.created_at <= $${paramCount}`
      params.push(endDate)
    }

    if (status && status !== 'all') {
      paramCount++
      query += ` AND s.status = $${paramCount}`
      params.push(status)
    }

    query += ` ORDER BY s.created_at DESC`

    const result = await db.query(query, params)
    const sales = result.rows.map(sale => ({
      id: sale.id,
      quantity: parseInt(sale.quantity) || 0,
      amount: parseInt(sale.amount) || 0,
      buyerName: sale.buyer_name,
      buyerEmail: sale.buyer_email,
      paymentMethod: sale.payment_method,
      status: sale.status,
      createdAt: sale.created_at,
      eventTitle: sale.event_title,
      eventDate: sale.event_date,
      ticketType: sale.ticket_type
    }))

    res.json({
      success: true,
      data: sales
    })

  } catch (error) {
    console.error('Error getting organizer sales:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ORGANIZER ATTENDEES =====
router.get('/attendees/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params
    const { eventId, search, status } = req.query

    let query = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.status,
        s.created_at,
        s.checked_in,
        s.check_in_time,
        e.title as event_title,
        e.date as event_date,
        tt.name as ticket_type
      FROM sales s
      JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE e.organizer_id = $1
    `

    const params = [organizerId]
    let paramCount = 1

    if (eventId) {
      paramCount++
      query += ` AND e.id = $${paramCount}`
      params.push(eventId)
    }

    if (search) {
      paramCount++
      query += ` AND (s.buyer_name ILIKE $${paramCount} OR s.buyer_email ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }

    if (status && status !== 'all') {
      paramCount++
      query += ` AND s.status = $${paramCount}`
      params.push(status)
    }

    query += ` ORDER BY s.created_at DESC`

    const result = await db.query(query, params)
    const attendees = result.rows.map(attendee => ({
      id: attendee.id,
      buyerName: attendee.buyer_name,
      buyerEmail: attendee.buyer_email,
      quantity: parseInt(attendee.quantity) || 0,
      amount: parseInt(attendee.amount) || 0,
      status: attendee.status,
      createdAt: attendee.created_at,
      checkedIn: attendee.checked_in || false,
      checkInTime: attendee.check_in_time,
      eventTitle: attendee.event_title,
      eventDate: attendee.event_date,
      ticketType: attendee.ticket_type
    }))

    res.json({
      success: true,
      data: attendees
    })

  } catch (error) {
    console.error('Error getting organizer attendees:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== CHECK-IN =====
router.post('/checkin/:saleId', auth, requireOrganizer, async (req, res) => {
  try {
    const { saleId } = req.params
    const { organizerId } = req.body

    // Verificar que la venta pertenece al organizador
    const saleCheck = await db.query(`
      SELECT s.id, s.checked_in, e.organizer_id
      FROM sales s
      JOIN events e ON s.event_id = e.id
      WHERE s.id = $1 AND e.organizer_id = $2
    `, [saleId, organizerId])

    if (saleCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada o no autorizada'
      })
    }

    const sale = saleCheck.rows[0]

    if (sale.checked_in) {
      return res.status(400).json({
        success: false,
        message: 'El asistente ya fue registrado'
      })
    }

    // Realizar check-in
    await db.query(`
      UPDATE sales 
      SET checked_in = true, check_in_time = NOW()
      WHERE id = $1
    `, [saleId])

    res.json({
      success: true,
      message: 'Check-in realizado exitosamente'
    })

  } catch (error) {
    console.error('Error performing check-in:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ANALYTICS =====
router.get('/analytics/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params
    const { period = '30' } = req.query

    // Estadísticas generales
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT e.id) as total_events,
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COALESCE(SUM(s.quantity), 0) as total_tickets,
        COUNT(DISTINCT s.buyer_email) as unique_customers,
        AVG(s.total_amount) as average_ticket_price
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
        AND s.created_at >= NOW() - INTERVAL '${period} days'
    `

    const statsResult = await db.query(statsQuery, [organizerId])
    const stats = statsResult.rows[0]

    // Ventas por día
    const dailySalesQuery = `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COALESCE(SUM(s.quantity), 0) as tickets_sold
      FROM sales s
      JOIN events e ON s.event_id = e.id
      WHERE e.organizer_id = $1
        AND s.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
    `

    const dailySalesResult = await db.query(dailySalesQuery, [organizerId])
    const dailySales = dailySalesResult.rows

    // Eventos con mejor rendimiento
    const topEventsQuery = `
      SELECT 
        e.title,
        e.date,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        e.total_capacity,
        (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity) as occupancy_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
        AND s.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY e.id, e.title, e.date, e.total_capacity
      ORDER BY revenue DESC
      LIMIT 10
    `

    const topEventsResult = await db.query(topEventsQuery, [organizerId])
    const topEvents = topEventsResult.rows

    res.json({
      success: true,
      data: {
        stats: {
          totalEvents: parseInt(stats.total_events) || 0,
          totalSales: parseInt(stats.total_sales) || 0,
          totalRevenue: parseInt(stats.total_revenue) || 0,
          totalTickets: parseInt(stats.total_tickets) || 0,
          uniqueCustomers: parseInt(stats.unique_customers) || 0,
          averageTicketPrice: parseFloat(stats.average_ticket_price) || 0
        },
        dailySales,
        topEvents
      }
    })

  } catch (error) {
    console.error('Error getting analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== REPORTS =====
router.get('/reports/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params
    const { type, startDate, endDate } = req.query

    let query = ''
    let params = [organizerId]

    switch (type) {
      case 'sales':
        query = `
          SELECT 
            s.id,
            s.quantity,
            s.total_amount,
            s.buyer_name,
            s.buyer_email,
            s.payment_method,
            s.status,
            s.created_at,
            e.title as event_title,
            e.date as event_date
          FROM sales s
          JOIN events e ON s.event_id = e.id
          WHERE e.organizer_id = $1
            AND s.created_at BETWEEN $2 AND $3
          ORDER BY s.created_at DESC
        `
        params.push(startDate, endDate)
        break

      case 'events':
        query = `
          SELECT 
            e.id,
            e.title,
            e.date,
            e.status,
            e.total_capacity,
            COALESCE(SUM(s.quantity), 0) as tickets_sold,
            COALESCE(SUM(s.total_amount), 0) as revenue,
            (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity) as occupancy_rate
          FROM events e
          LEFT JOIN sales s ON e.id = s.event_id
          WHERE e.organizer_id = $1
            AND e.date BETWEEN $2 AND $3
          GROUP BY e.id, e.title, e.date, e.status, e.total_capacity
          ORDER BY e.date DESC
        `
        params.push(startDate, endDate)
        break

      case 'attendees':
        query = `
          SELECT 
            s.buyer_name,
            s.buyer_email,
            s.quantity,
            s.total_amount,
            s.status,
            s.checked_in,
            s.created_at,
            e.title as event_title,
            e.date as event_date
          FROM sales s
          JOIN events e ON s.event_id = e.id
          WHERE e.organizer_id = $1
            AND s.created_at BETWEEN $2 AND $3
          ORDER BY s.created_at DESC
        `
        params.push(startDate, endDate)
        break

      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de reporte no válido'
        })
    }

    const result = await db.query(query, params)
    const reportData = result.rows

    res.json({
      success: true,
      data: reportData
    })

  } catch (error) {
    console.error('Error generating report:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== MÉTRICAS EN TIEMPO REAL POR EVENTO =====
router.get('/event-metrics/:eventId', auth, requireOrganizer, async (req, res) => {
  try {
    const { eventId } = req.params
    const organizerId = req.user.userId

    // Verificar que el evento pertenece al organizador
    const eventCheck = await db.query(
      'SELECT id, title, date, total_capacity, status FROM events WHERE id = $1 AND organizer_id = $2',
      [eventId, organizerId]
    )

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o no tienes permisos para acceder'
      })
    }

    const event = eventCheck.rows[0]

    // Obtener métricas de ventas en tiempo real
    const salesMetricsQuery = `
      SELECT 
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.quantity), 0) as total_tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COUNT(DISTINCT s.buyer_email) as unique_customers,
        CASE 
          WHEN $2 > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / $2)
          ELSE 0 
        END as occupancy_rate,
        CASE 
          WHEN COUNT(s.id) > 0 
          THEN COALESCE(SUM(s.total_amount), 0) / COUNT(s.id)
          ELSE 0 
        END as average_order_value
      FROM sales s
      WHERE s.event_id = $1
    `

    const salesMetricsResult = await db.query(salesMetricsQuery, [eventId, event.total_capacity])
    const salesMetrics = salesMetricsResult.rows[0]

    // Obtener ventas por hora (últimas 24 horas)
    const hourlySalesQuery = `
      SELECT 
        DATE_TRUNC('hour', s.created_at) as hour,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      WHERE s.event_id = $1
        AND s.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY DATE_TRUNC('hour', s.created_at)
      ORDER BY hour DESC
    `

    const hourlySalesResult = await db.query(hourlySalesQuery, [eventId])
    const hourlySales = hourlySalesResult.rows

    // Obtener ventas por tipo de ticket
    const ticketTypeSalesQuery = `
      SELECT 
        tt.name as ticket_type,
        tt.price,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM ticket_types tt
      LEFT JOIN sales s ON tt.id = s.ticket_type_id AND s.event_id = $1
      WHERE tt.event_id = $1
      GROUP BY tt.id, tt.name, tt.price
      ORDER BY revenue DESC
    `

    const ticketTypeSalesResult = await db.query(ticketTypeSalesQuery, [eventId])
    const ticketTypeSales = ticketTypeSalesResult.rows

    // Obtener actividad reciente (últimas 10 ventas)
    const recentSalesQuery = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.payment_method,
        s.status,
        s.created_at,
        tt.name as ticket_type
      FROM sales s
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.event_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    const recentSalesResult = await db.query(recentSalesQuery, [eventId])
    const recentSales = recentSalesResult.rows

    // Calcular tendencias
    const trendsQuery = `
      SELECT 
        DATE_TRUNC('day', s.created_at) as day,
        COUNT(s.id) as daily_sales,
        COALESCE(SUM(s.quantity), 0) as daily_tickets,
        COALESCE(SUM(s.total_amount), 0) as daily_revenue
      FROM sales s
      WHERE s.event_id = $1
        AND s.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE_TRUNC('day', s.created_at)
      ORDER BY day DESC
    `

    const trendsResult = await db.query(trendsQuery, [eventId])
    const trends = trendsResult.rows

    res.json({
      success: true,
      data: {
        event: {
          id: event.id,
          title: event.title,
          date: event.date,
          total_capacity: event.total_capacity,
          status: event.status
        },
        metrics: {
          ...salesMetrics,
          remaining_capacity: event.total_capacity - salesMetrics.total_tickets_sold,
          conversion_rate: event.total_capacity > 0 ? (salesMetrics.total_tickets_sold * 100.0 / event.total_capacity) : 0
        },
        hourly_sales: hourlySales,
        ticket_type_sales: ticketTypeSales,
        recent_sales: recentSales,
        trends: trends,
        last_updated: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Error getting event metrics:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== VERIFICAR SI ORGANIZADOR TIENE EVENTOS =====
router.get('/has-events/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params

    const result = await db.query(
      'SELECT COUNT(*) as event_count FROM events WHERE organizer_id = $1',
      [organizerId]
    )

    const hasEvents = parseInt(result.rows[0].event_count) > 0

    res.json({
      success: true,
      data: {
        hasEvents,
        eventCount: parseInt(result.rows[0].event_count)
      }
    })

  } catch (error) {
    console.error('Error checking organizer events:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== OBTENER EVENTOS DE UN ORGANIZADOR =====
router.get('/events/:organizerId', auth, requireOrganizer, async (req, res) => {
  try {
    const { organizerId } = req.params

    // Verificar que el organizador existe
    const organizerCheck = await db.query(
      'SELECT id, first_name, last_name, email FROM users WHERE id = $1 AND role = $2',
      [organizerId, 'organizer']
    )

    if (organizerCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Organizador no encontrado'
      })
    }

    // Obtener eventos del organizador con métricas básicas
    const eventsQuery = `
      SELECT 
        e.id,
        e.title,
        e.description,
        e.date,
        e.time,
        e.venue,
        e.location,
        e.status,
        e.total_capacity,
        e.price,
        e.created_at,
        e.updated_at,
        COUNT(s.id) as total_sales,
        COALESCE(SUM(s.quantity), 0) as total_tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.organizer_id = $1
      GROUP BY e.id, e.title, e.description, e.date, e.time, e.venue, e.location, e.status, e.total_capacity, e.price, e.created_at, e.updated_at
      ORDER BY e.created_at DESC
    `

    const eventsResult = await db.query(eventsQuery, [organizerId])
    const events = eventsResult.rows.map(event => ({
      ...event,
      metrics: {
        total_sales: parseInt(event.total_sales),
        total_tickets_sold: parseInt(event.total_tickets_sold),
        total_revenue: parseFloat(event.total_revenue),
        occupancy_rate: parseFloat(event.occupancy_rate)
      }
    }))

    res.json({
      success: true,
      data: events
    })

  } catch (error) {
    console.error('Error getting organizer events:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== CRUD COMPLETO DE EVENTOS =====

// POST - Crear nuevo evento
router.post('/events', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { title, description, date, time, venue, totalCapacity, price, category } = req.body

    // Validaciones básicas
    if (!title || !date || !venue) {
      return res.status(400).json({
        success: false,
        message: 'Título, fecha y lugar son obligatorios'
      })
    }

    const result = await db.query(
      `INSERT INTO events (title, description, date, time, venue, total_capacity, price, category, organizer_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', NOW(), NOW())
       RETURNING *`,
      [title, description, date, time, venue, totalCapacity, price, category, organizerId]
    )

    const newEvent = result.rows[0]

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: newEvent
    })

  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT - Actualizar evento
router.put('/events/:eventId', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { eventId } = req.params
    const { title, description, date, time, venue, totalCapacity, price, category, status } = req.body

    // Verificar que el evento pertenece al organizador
    const eventCheck = await db.query(
      'SELECT id FROM events WHERE id = $1 AND organizer_id = $2',
      [eventId, organizerId]
    )

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o no tienes permisos para editarlo'
      })
    }

    const result = await db.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           date = COALESCE($3, date),
           time = COALESCE($4, time),
           venue = COALESCE($5, venue),
           total_capacity = COALESCE($6, total_capacity),
           price = COALESCE($7, price),
           category = COALESCE($8, category),
           status = COALESCE($9, status),
           updated_at = NOW()
       WHERE id = $10 AND organizer_id = $11
       RETURNING *`,
      [title, description, date, time, venue, totalCapacity, price, category, status, eventId, organizerId]
    )

    const updatedEvent = result.rows[0]

    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: updatedEvent
    })

  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// DELETE - Eliminar evento
router.delete('/events/:eventId', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { eventId } = req.params

    // Verificar que el evento pertenece al organizador
    const eventCheck = await db.query(
      'SELECT id, status FROM events WHERE id = $1 AND organizer_id = $2',
      [eventId, organizerId]
    )

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o no tienes permisos para eliminarlo'
      })
    }

    const event = eventCheck.rows[0]

    // Verificar si el evento tiene ventas
    const salesCheck = await db.query(
      'SELECT COUNT(*) as sales_count FROM sales WHERE event_id = $1',
      [eventId]
    )

    if (parseInt(salesCheck.rows[0].sales_count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un evento que tiene ventas asociadas'
      })
    }

    // Eliminar evento
    await db.query(
      'DELETE FROM events WHERE id = $1 AND organizer_id = $2',
      [eventId, organizerId]
    )

    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== MÉTODOS ADICIONALES =====

// PATCH - Cambiar estado del evento
router.patch('/events/:eventId/status', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { eventId } = req.params
    const { status } = req.body

    if (!['draft', 'published', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      })
    }

    const result = await db.query(
      `UPDATE events 
       SET status = $1, updated_at = NOW()
       WHERE id = $2 AND organizer_id = $3
       RETURNING id, title, status`,
      [status, eventId, organizerId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      })
    }

    res.json({
      success: true,
      message: `Evento ${status === 'published' ? 'publicado' : status === 'cancelled' ? 'cancelado' : 'guardado como borrador'}`,
      data: result.rows[0]
    })

  } catch (error) {
    console.error('Error updating event status:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== MÉTRICAS DE EVENTO ESPECÍFICO =====
router.get('/events/:eventId/analytics', auth, requireOrganizer, async (req, res) => {
  try {
    const organizerId = req.user.userId
    const { eventId } = req.params

    // Verificar que el evento pertenece al organizador
    const eventCheckQuery = `
      SELECT id, title, date, total_capacity, status
      FROM events 
      WHERE id = $1 AND organizer_id = $2
    `
    const eventCheckResult = await db.query(eventCheckQuery, [eventId, organizerId])
    
    if (eventCheckResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado o no tienes permisos para verlo'
      })
    }

    const event = eventCheckResult.rows[0]

    // Métricas del evento
    const metricsQuery = `
      SELECT 
        COUNT(DISTINCT s.id) as total_sales,
        COALESCE(SUM(s.quantity), 0) as total_tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as total_revenue,
        COUNT(DISTINCT s.buyer_email) as unique_customers,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as occupancy_rate,
        CASE 
          WHEN COUNT(DISTINCT s.id) > 0 
          THEN COALESCE(SUM(s.total_amount), 0) / COUNT(DISTINCT s.id)
          ELSE 0 
        END as average_order_value,
        e.total_capacity - COALESCE(SUM(s.quantity), 0) as remaining_capacity,
        CASE 
          WHEN e.total_capacity > 0 
          THEN (COALESCE(SUM(s.quantity), 0) * 100.0 / e.total_capacity)
          ELSE 0 
        END as conversion_rate
      FROM events e
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.id = $1 AND e.organizer_id = $2
      GROUP BY e.id, e.title, e.total_capacity
    `

    const metricsResult = await db.query(metricsQuery, [eventId, organizerId])
    const metrics = metricsResult.rows[0] || {
      total_sales: 0,
      total_tickets_sold: 0,
      total_revenue: 0,
      unique_customers: 0,
      occupancy_rate: 0,
      average_order_value: 0,
      remaining_capacity: event.total_capacity,
      conversion_rate: 0
    }

    // Ventas por hora (últimas 24 horas)
    const hourlySalesQuery = `
      SELECT 
        EXTRACT(HOUR FROM s.created_at) as hour,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      WHERE s.event_id = $1 
        AND s.created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY EXTRACT(HOUR FROM s.created_at)
      ORDER BY hour
    `

    const hourlySalesResult = await db.query(hourlySalesQuery, [eventId])
    const hourlySales = hourlySalesResult.rows.map(row => ({
      hour: `${row.hour}:00`,
      sales_count: parseInt(row.sales_count) || 0,
      tickets_sold: parseInt(row.tickets_sold) || 0,
      revenue: parseInt(row.revenue) || 0
    }))

    // Ventas por tipo de ticket
    const ticketTypeSalesQuery = `
      SELECT 
        tt.name as ticket_type,
        tt.price,
        COUNT(s.id) as sales_count,
        COALESCE(SUM(s.quantity), 0) as tickets_sold,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.event_id = $1
      GROUP BY tt.id, tt.name, tt.price
      ORDER BY revenue DESC
    `

    const ticketTypeSalesResult = await db.query(ticketTypeSalesQuery, [eventId])
    const ticketTypeSales = ticketTypeSalesResult.rows.map(row => ({
      ticket_type: row.ticket_type || 'General',
      price: parseInt(row.price) || 0,
      sales_count: parseInt(row.sales_count) || 0,
      tickets_sold: parseInt(row.tickets_sold) || 0,
      revenue: parseInt(row.revenue) || 0
    }))

    // Ventas recientes
    const recentSalesQuery = `
      SELECT 
        s.id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.payment_method,
        s.status,
        s.created_at,
        tt.name as ticket_type
      FROM sales s
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.event_id = $1
      ORDER BY s.created_at DESC
      LIMIT 10
    `

    const recentSalesResult = await db.query(recentSalesQuery, [eventId])
    const recentSales = recentSalesResult.rows.map(row => ({
      id: row.id,
      buyer_name: row.buyer_name,
      buyer_email: row.buyer_email,
      quantity: parseInt(row.quantity) || 0,
      total_amount: parseInt(row.total_amount) || 0,
      payment_method: row.payment_method || 'N/A',
      status: row.status,
      created_at: row.created_at,
      ticket_type: row.ticket_type || 'General'
    }))

    // Tendencias por día (últimos 7 días)
    const trendsQuery = `
      SELECT 
        DATE(s.created_at) as day,
        COUNT(s.id) as daily_sales,
        COALESCE(SUM(s.quantity), 0) as daily_tickets,
        COALESCE(SUM(s.total_amount), 0) as daily_revenue
      FROM sales s
      WHERE s.event_id = $1 
        AND s.created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(s.created_at)
      ORDER BY day DESC
    `

    const trendsResult = await db.query(trendsQuery, [eventId])
    const trends = trendsResult.rows.map(row => ({
      day: row.day,
      daily_sales: parseInt(row.daily_sales) || 0,
      daily_tickets: parseInt(row.daily_tickets) || 0,
      daily_revenue: parseInt(row.daily_revenue) || 0
    }))

    const response = {
      event: {
        id: event.id,
        title: event.title,
        date: event.date,
        total_capacity: event.total_capacity,
        status: event.status
      },
      metrics: {
        total_sales: parseInt(metrics.total_sales) || 0,
        total_tickets_sold: parseInt(metrics.total_tickets_sold) || 0,
        total_revenue: parseInt(metrics.total_revenue) || 0,
        unique_customers: parseInt(metrics.unique_customers) || 0,
        occupancy_rate: parseFloat(metrics.occupancy_rate) || 0,
        average_order_value: parseInt(metrics.average_order_value) || 0,
        remaining_capacity: parseInt(metrics.remaining_capacity) || event.total_capacity,
        conversion_rate: parseFloat(metrics.conversion_rate) || 0
      },
      hourly_sales: hourlySales,
      ticket_type_sales: ticketTypeSales,
      recent_sales: recentSales,
      trends: trends,
      last_updated: new Date().toISOString()
    }

    res.json({
      success: true,
      data: response
    })

  } catch (error) {
    console.error('Error getting event analytics:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

module.exports = router
