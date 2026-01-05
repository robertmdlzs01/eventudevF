const db = require('../config/database-postgres')

class AdminSharedState {
  constructor() {
    this.cache = new Map()
    this.lastUpdate = new Map()
    this.cacheTimeout = 30000 // 30 segundos
    this.subscribers = new Set() // WebSocket connections de admins
  }

  // Agregar suscriptor (WebSocket connection)
  addSubscriber(socket) {
    this.subscribers.add(socket)
    console.log(`Admin ${socket.userId} suscrito al estado compartido`)
  }

  // Remover suscriptor
  removeSubscriber(socket) {
    this.subscribers.delete(socket)
    console.log(`Admin ${socket.userId} desuscrito del estado compartido`)
  }

  // Notificar a todos los administradores conectados
  notifyAdmins(event, data) {
    this.subscribers.forEach(socket => {
      if (socket.userRole === 'admin' && socket.connected) {
        socket.emit(event, data)
      }
    })
  }

  // Obtener estadísticas del dashboard con cache
  async getDashboardStats(forceRefresh = false) {
    const cacheKey = 'dashboard_stats'
    const now = Date.now()
    
    // Verificar cache
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const lastUpdate = this.lastUpdate.get(cacheKey)
      if (now - lastUpdate < this.cacheTimeout) {
        return this.cache.get(cacheKey)
      }
    }

    try {
      // Obtener datos frescos de la base de datos
      const stats = await this.fetchDashboardStatsFromDB()
      
      // Actualizar cache
      this.cache.set(cacheKey, stats)
      this.lastUpdate.set(cacheKey, now)
      
      return stats
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Retornar cache si hay error
      return this.cache.get(cacheKey) || this.getDefaultStats()
    }
  }

  // Obtener métricas en tiempo real
  async getRealtimeMetrics() {
    try {
      // Usuarios activos en los últimos 15 minutos - Datos reales
      const activeUsers = await db.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '15 minutes'
        AND action IN ('LOGIN', 'PURCHASE', 'VIEW_EVENT', 'REGISTER')
      `)

      // Ventas del día actual - Datos reales
      const todaySales = await db.query(`
        SELECT COUNT(*) as count, COALESCE(SUM(total_amount), 0) as revenue
        FROM sales
        WHERE DATE(created_at) = CURRENT_DATE
      `)

      // Eventos activos (publicados y con fecha futura) - Datos reales
      const currentEvents = await db.query(`
        SELECT COUNT(*) as count
        FROM events
        WHERE status = 'published' 
        AND date >= NOW()
      `)

      // Usuarios online (últimos 5 minutos) - Datos reales
      const onlineUsers = await db.query(`
        SELECT COUNT(DISTINCT user_id) as count
        FROM audit_logs
        WHERE timestamp >= NOW() - INTERVAL '5 minutes'
      `)

      // Tasa de conversión - Datos reales
      const conversionData = await db.query(`
        WITH total_visitors AS (
          SELECT COUNT(DISTINCT user_id) as visitors
          FROM audit_logs
          WHERE timestamp >= NOW() - INTERVAL '24 hours'
          AND action = 'VIEW_EVENT'
        ),
        total_purchases AS (
          SELECT COUNT(DISTINCT user_id) as purchasers
          FROM sales
          WHERE created_at >= NOW() - INTERVAL '24 hours'
        )
        SELECT 
          CASE 
            WHEN tv.visitors > 0 THEN (tp.purchasers::float / tv.visitors::float) * 100
            ELSE 0
          END as conversion_rate
        FROM total_visitors tv, total_purchases tp
      `)

      return {
        activeUsers: parseInt(activeUsers.rows[0]?.count || 0),
        todaySales: parseInt(todaySales.rows[0]?.count || 0),
        todayRevenue: parseInt(todaySales.rows[0]?.revenue || 0),
        currentEvents: parseInt(currentEvents.rows[0]?.count || 0),
        onlineUsers: parseInt(onlineUsers.rows[0]?.count || 0),
        conversionRate: parseFloat(conversionData.rows[0]?.conversion_rate || 0)
      }
    } catch (error) {
      console.error('Error getting realtime metrics:', error)
      // Fallback a datos simulados si hay error
      return {
        activeUsers: Math.floor(Math.random() * 50) + 20,
        todaySales: Math.floor(Math.random() * 20) + 5,
        todayRevenue: Math.floor(Math.random() * 5000000) + 1000000,
        currentEvents: 5,
        onlineUsers: Math.floor(Math.random() * 100) + 30,
        conversionRate: Math.random() * 5 + 8
      }
    }
  }

  // Obtener datos para gráficos
  async getChartData() {
    try {
      // Tendencias mensuales (últimos 6 meses) - Datos reales
      const monthlyTrends = await db.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          )::date as month
        )
        SELECT 
          TO_CHAR(m.month, 'Mon') as name,
          COALESCE(u.count, 0) as usuarios,
          COALESCE(e.count, 0) as eventos,
          COALESCE(s.count, 0) as ventas
        FROM months m
        LEFT JOIN (
          SELECT 
            date_trunc('month', created_at)::date as month,
            COUNT(*) as count
          FROM users
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY date_trunc('month', created_at)::date
        ) u ON m.month = u.month
        LEFT JOIN (
          SELECT 
            date_trunc('month', created_at)::date as month,
            COUNT(*) as count
          FROM events
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY date_trunc('month', created_at)::date
        ) e ON m.month = e.month
        LEFT JOIN (
          SELECT 
            date_trunc('month', created_at)::date as month,
            COUNT(*) as count
          FROM sales
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY date_trunc('month', created_at)::date
        ) s ON m.month = s.month
        ORDER BY m.month
      `)

      // Categorías de eventos - Datos reales
      const eventCategories = await db.query(`
        SELECT 
          COALESCE(c.name, 'Sin categoría') as name,
          COUNT(e.id) as value
        FROM events e
        LEFT JOIN categories c ON e.category_id = c.id
        WHERE e.status = 'published'
        GROUP BY c.name
        ORDER BY COUNT(e.id) DESC
        LIMIT 5
      `)

      // Actividad de usuarios por hora (último día) - Datos reales
      const userActivity = await db.query(`
        WITH hours AS (
          SELECT generate_series(0, 23) as hour
        )
        SELECT 
          LPAD(h.hour::text, 2, '0') || ':00' as name,
          COALESCE(a.count, 0) as usuarios
        FROM hours h
        LEFT JOIN (
          SELECT 
            EXTRACT(hour FROM created_at) as hour,
            COUNT(*) as count
          FROM users
          WHERE created_at >= CURRENT_DATE
          GROUP BY EXTRACT(hour FROM created_at)
        ) a ON h.hour = a.hour
        ORDER BY h.hour
      `)

      // Ventas por mes - Datos reales
      const salesByMonth = await db.query(`
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', CURRENT_DATE - INTERVAL '5 months'),
            date_trunc('month', CURRENT_DATE),
            '1 month'::interval
          )::date as month
        )
        SELECT 
          TO_CHAR(m.month, 'Mon') as name,
          COALESCE(s.count, 0) as ventas,
          COALESCE(s.revenue, 0) as ingresos
        FROM months m
        LEFT JOIN (
          SELECT 
            date_trunc('month', created_at)::date as month,
            COUNT(*) as count,
            SUM(total_amount) as revenue
          FROM sales
          WHERE created_at >= CURRENT_DATE - INTERVAL '6 months'
          GROUP BY date_trunc('month', created_at)::date
        ) s ON m.month = s.month
        ORDER BY m.month
      `)

      return {
        monthlyTrends: monthlyTrends.rows,
        eventCategories: eventCategories.rows,
        userActivity: userActivity.rows,
        salesByMonth: salesByMonth.rows
      }
    } catch (error) {
      console.error('Error getting chart data:', error)
      // Fallback a datos simulados si hay error
      console.error('Error obteniendo datos reales, usando datos simulados:', error)
      return {
        monthlyTrends: [
          { name: 'Ene', usuarios: 0, eventos: 0, ventas: 0 },
          { name: 'Feb', usuarios: 0, eventos: 0, ventas: 0 },
          { name: 'Mar', usuarios: 0, eventos: 0, ventas: 0 },
          { name: 'Abr', usuarios: 0, eventos: 0, ventas: 0 },
          { name: 'May', usuarios: 0, eventos: 0, ventas: 0 },
          { name: 'Jun', usuarios: 0, eventos: 0, ventas: 0 }
        ],
        eventCategories: [
          { name: 'Sin datos', value: 100 }
        ],
        userActivity: [
          { name: '00:00', usuarios: 0 },
          { name: '04:00', usuarios: 0 },
          { name: '08:00', usuarios: 0 },
          { name: '12:00', usuarios: 0 },
          { name: '16:00', usuarios: 0 },
          { name: '20:00', usuarios: 0 },
          { name: '24:00', usuarios: 0 }
        ],
        salesByMonth: [
          { name: 'Ene', ventas: 0, ingresos: 0 },
          { name: 'Feb', ventas: 0, ingresos: 0 },
          { name: 'Mar', ventas: 0, ingresos: 0 },
          { name: 'Abr', ventas: 0, ingresos: 0 },
          { name: 'May', ventas: 0, ingresos: 0 },
          { name: 'Jun', ventas: 0, ingresos: 0 }
        ]
      }
    }
  }

  // Obtener datos frescos de la base de datos
  async fetchDashboardStatsFromDB() {
    // Estadísticas de usuarios
    const usersStats = await db.query(`
      SELECT 
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as adminUsers,
        COUNT(CASE WHEN role = 'organizer' THEN 1 END) as organizerUsers,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regularUsers,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as newUsers30Days
      FROM users
    `)

    // Estadísticas de eventos
    const eventsStats = await db.query(`
      SELECT 
        COUNT(*) as totalEvents,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as publishedEvents,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draftEvents,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelledEvents,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as newEvents30Days
      FROM events
    `)

    // Estadísticas de ventas (simuladas por ahora)
    const salesStats = {
      totalSales: 1250,
      totalRevenue: 45000000,
      salesLast30Days: 89,
      revenueLast30Days: 3200000,
      newSales30Days: 12,
      newRevenue30Days: 450000
    }

    // Eventos recientes
    const recentEvents = await db.query(`
      SELECT e.id, e.title, e.status, e.created_at, u.first_name, u.last_name
      FROM events e
      LEFT JOIN users u ON e.organizer_id = u.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `)

    // Usuarios recientes
    const recentUsers = await db.query(`
      SELECT id, first_name, last_name, email, role, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `)

    // Ventas recientes (simuladas)
    const recentSales = [
      {
        id: 1,
        event_title: "Concierto de Rock",
        customer_email: "cliente1@email.com",
        total_amount: 150000,
        status: "completed"
      },
      {
        id: 2,
        event_title: "Conferencia Tech",
        customer_email: "cliente2@email.com",
        total_amount: 89000,
        status: "completed"
      },
      {
        id: 3,
        event_title: "Festival de Música",
        customer_email: "cliente3@email.com",
        total_amount: 250000,
        status: "pending"
      }
    ]

    // Datos para gráficos
    const chartData = await this.getChartData()
    
    // Métricas en tiempo real
    const realtimeMetrics = await this.getRealtimeMetrics()

    return {
      stats: {
        totalUsers: usersStats.rows[0].totalusers,
        adminUsers: usersStats.rows[0].adminusers,
        organizerUsers: usersStats.rows[0].organizerusers,
        regularUsers: usersStats.rows[0].regularusers,
        totalEvents: eventsStats.rows[0].totalevents,
        publishedEvents: eventsStats.rows[0].publishedevents,
        draftEvents: eventsStats.rows[0].draftevents,
        cancelledEvents: eventsStats.rows[0].cancelledevents,
        totalSales: salesStats.totalSales,
        totalRevenue: salesStats.totalRevenue,
        salesLast30Days: salesStats.salesLast30Days,
        revenueLast30Days: salesStats.revenueLast30Days
      },
      growth: {
        newUsers30Days: usersStats.rows[0].newusers30days,
        newEvents30Days: eventsStats.rows[0].newevents30days,
        newSales30Days: salesStats.newSales30Days,
        newRevenue30Days: salesStats.newRevenue30Days
      },
      recentEvents: recentEvents.rows,
      recentSales: recentSales,
      recentUsers: recentUsers.rows,
      chartData: chartData,
      realtimeMetrics: realtimeMetrics,
      lastUpdated: new Date().toISOString()
    }
  }

  // Estadísticas por defecto
  getDefaultStats() {
    return {
      stats: {
        totalUsers: 0,
        adminUsers: 0,
        organizerUsers: 0,
        regularUsers: 0,
        totalEvents: 0,
        publishedEvents: 0,
        draftEvents: 0,
        cancelledEvents: 0,
        totalSales: 0,
        totalRevenue: 0,
        salesLast30Days: 0,
        revenueLast30Days: 0
      },
      growth: {
        newUsers30Days: 0,
        newEvents30Days: 0,
        newSales30Days: 0,
        newRevenue30Days: 0
      },
      recentEvents: [],
      recentSales: [],
      recentUsers: [],
      lastUpdated: new Date().toISOString()
    }
  }

  // Invalidar cache y notificar a todos los admins
  async invalidateCache() {
    console.log('Invalidando cache del estado compartido de administradores')
    this.cache.clear()
    this.lastUpdate.clear()
    
    // Obtener datos frescos
    const freshData = await this.getDashboardStats(true)
    
    // Notificar a todos los administradores conectados
    this.notifyAdmins('dashboard_updated', freshData)
    
    return freshData
  }

  // Obtener lista de administradores conectados
  getConnectedAdmins() {
    return Array.from(this.subscribers)
      .filter(socket => socket.userRole === 'admin' && socket.connected)
      .map(socket => ({
        userId: socket.userId,
        userEmail: socket.userEmail,
        connectedAt: socket.connectedAt || new Date()
      }))
  }

  // Limpiar cache expirado
  cleanupExpiredCache() {
    const now = Date.now()
    for (const [key, lastUpdate] of this.lastUpdate.entries()) {
      if (now - lastUpdate > this.cacheTimeout) {
        this.cache.delete(key)
        this.lastUpdate.delete(key)
      }
    }
  }
}

// Instancia singleton
const adminSharedState = new AdminSharedState()

// Limpiar cache cada 5 minutos
setInterval(() => {
  adminSharedState.cleanupExpiredCache()
}, 5 * 60 * 1000)

module.exports = adminSharedState
