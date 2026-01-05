const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const db = require('../config/database-postgres')

// Middleware para verificar que el usuario es administrador
const requireAdmin = requireRole('admin')

// ===== MÉTRICAS DE RENDIMIENTO =====

// GET /api/analytics/performance - Métricas de rendimiento
router.get('/performance', auth, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query // días

    // Métricas de conversión
    const conversionMetricsQuery = `
      SELECT 
        COUNT(DISTINCT s.user_id) as unique_buyers,
        COUNT(DISTINCT u.id) as total_visitors,
        ROUND((COUNT(DISTINCT s.user_id)::float / NULLIF(COUNT(DISTINCT u.id), 0) * 100), 2) as conversion_rate,
        COUNT(s.id) as total_transactions,
        ROUND((COUNT(s.id)::float / NULLIF(COUNT(DISTINCT s.user_id), 0)), 2) as avg_transactions_per_user
      FROM users u
      LEFT JOIN sales s ON u.id = s.user_id
      WHERE u.created_at >= NOW() - INTERVAL '${period} days'
    `
    
    const conversionResult = await db.query(conversionMetricsQuery)
    const conversionMetrics = conversionResult.rows[0]

    // Métricas de retención
    const retentionMetricsQuery = `
      SELECT 
        COUNT(DISTINCT CASE WHEN s.created_at >= NOW() - INTERVAL '7 days' THEN s.user_id END) as active_7_days,
        COUNT(DISTINCT CASE WHEN s.created_at >= NOW() - INTERVAL '30 days' THEN s.user_id END) as active_30_days,
        COUNT(DISTINCT CASE WHEN s.created_at >= NOW() - INTERVAL '90 days' THEN s.user_id END) as active_90_days
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '${period} days'
    `
    
    const retentionResult = await db.query(retentionMetricsQuery)
    const retentionMetrics = retentionResult.rows[0]

    // Métricas de eventos
    const eventMetricsQuery = `
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN status = 'published' THEN 1 END) as published_events,
        ROUND(AVG(CASE WHEN total_capacity > 0 THEN (total_capacity - available_seats)::float / total_capacity * 100 END), 2) as avg_occupancy_rate,
        ROUND(AVG(CASE WHEN e.date >= NOW() THEN e.price END), 2) as avg_ticket_price
      FROM events e
      WHERE e.created_at >= NOW() - INTERVAL '${period} days'
    `
    
    const eventResult = await db.query(eventMetricsQuery)
    const eventMetrics = eventResult.rows[0]

    // Métricas financieras
    const financialMetricsQuery = `
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COALESCE(AVG(total_amount), 0) as avg_transaction_value,
        COUNT(*) as total_transactions,
        ROUND((COALESCE(SUM(total_amount), 0) / NULLIF(COUNT(*), 0)), 2) as revenue_per_transaction
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '${period} days'
    `
    
    const financialResult = await db.query(financialMetricsQuery)
    const financialMetrics = financialResult.rows[0]

    res.json({
      success: true,
      data: {
        conversion: {
          uniqueBuyers: parseInt(conversionMetrics.unique_buyers),
          totalVisitors: parseInt(conversionMetrics.total_visitors),
          conversionRate: parseFloat(conversionMetrics.conversion_rate),
          totalTransactions: parseInt(conversionMetrics.total_transactions),
          avgTransactionsPerUser: parseFloat(conversionMetrics.avg_transactions_per_user)
        },
        retention: {
          active7Days: parseInt(retentionMetrics.active_7_days),
          active30Days: parseInt(retentionMetrics.active_30_days),
          active90Days: parseInt(retentionMetrics.active_90_days)
        },
        events: {
          totalEvents: parseInt(eventMetrics.total_events),
          publishedEvents: parseInt(eventMetrics.published_events),
          avgOccupancyRate: parseFloat(eventMetrics.avg_occupancy_rate),
          avgTicketPrice: parseFloat(eventMetrics.avg_ticket_price)
        },
        financial: {
          totalRevenue: parseFloat(financialMetrics.total_revenue),
          avgTransactionValue: parseFloat(financialMetrics.avg_transaction_value),
          totalTransactions: parseInt(financialMetrics.total_transactions),
          revenuePerTransaction: parseFloat(financialMetrics.revenue_per_transaction)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== TENDENCIAS DE MERCADO =====

// GET /api/analytics/trends - Tendencias de mercado
router.get('/trends', auth, requireAdmin, async (req, res) => {
  try {
    const { period = '12' } = req.query // meses

    // Tendencias de ventas por mes
    const salesTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', s.created_at) as month,
        COUNT(*) as sales_count,
        COALESCE(SUM(total_amount), 0) as revenue,
        COUNT(DISTINCT user_id) as unique_customers
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '${period} months'
      GROUP BY DATE_TRUNC('month', s.created_at)
      ORDER BY month DESC
    `
    
    const salesTrendsResult = await db.query(salesTrendsQuery)
    const salesTrends = salesTrendsResult.rows

    // Tendencias de eventos por categoría
    const categoryTrendsQuery = `
      SELECT 
        c.name as category_name,
        COUNT(e.id) as events_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        ROUND(AVG(e.price), 2) as avg_price
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE e.created_at >= NOW() - INTERVAL '${period} months'
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `
    
    const categoryTrendsResult = await db.query(categoryTrendsQuery)
    const categoryTrends = categoryTrendsResult.rows

    // Tendencias de precios
    const priceTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', e.created_at) as month,
        ROUND(AVG(e.price), 2) as avg_price,
        MIN(e.price) as min_price,
        MAX(e.price) as max_price
      FROM events e
      WHERE e.created_at >= NOW() - INTERVAL '${period} months'
      GROUP BY DATE_TRUNC('month', e.created_at)
      ORDER BY month DESC
    `
    
    const priceTrendsResult = await db.query(priceTrendsQuery)
    const priceTrends = priceTrendsResult.rows

    // Tendencias de usuarios
    const userTrendsQuery = `
      SELECT 
        DATE_TRUNC('month', u.created_at) as month,
        COUNT(*) as new_users,
        COUNT(CASE WHEN role = 'organizer' THEN 1 END) as new_organizers
      FROM users u
      WHERE u.created_at >= NOW() - INTERVAL '${period} months'
      GROUP BY DATE_TRUNC('month', u.created_at)
      ORDER BY month DESC
    `
    
    const userTrendsResult = await db.query(userTrendsQuery)
    const userTrends = userTrendsResult.rows

    res.json({
      success: true,
      data: {
        salesTrends,
        categoryTrends,
        priceTrends,
        userTrends
      }
    })
  } catch (error) {
    console.error('Error fetching market trends:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ANÁLISIS DE COMPORTAMIENTO =====

// GET /api/analytics/behavior - Análisis de comportamiento
router.get('/behavior', auth, requireAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query // días

    // Patrones de compra
    const purchasePatternsQuery = `
      SELECT 
        EXTRACT(HOUR FROM s.created_at) as hour,
        COUNT(*) as purchases_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY EXTRACT(HOUR FROM s.created_at)
      ORDER BY hour
    `
    
    const purchasePatternsResult = await db.query(purchasePatternsQuery)
    const purchasePatterns = purchasePatternsResult.rows

    // Patrones por día de la semana
    const dayPatternsQuery = `
      SELECT 
        EXTRACT(DOW FROM s.created_at) as day_of_week,
        COUNT(*) as purchases_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY EXTRACT(DOW FROM s.created_at)
      ORDER BY day_of_week
    `
    
    const dayPatternsResult = await db.query(dayPatternsQuery)
    const dayPatterns = dayPatternsResult.rows

    // Comportamiento de usuarios por rol
    const userBehaviorQuery = `
      SELECT 
        u.role,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(s.id) as total_purchases,
        COALESCE(SUM(s.total_amount), 0) as total_spent,
        ROUND(AVG(s.total_amount), 2) as avg_purchase_value
      FROM users u
      LEFT JOIN sales s ON u.id = s.user_id
      WHERE u.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY u.role
      ORDER BY total_spent DESC
    `
    
    const userBehaviorResult = await db.query(userBehaviorQuery)
    const userBehavior = userBehaviorResult.rows

    // Preferencias de categorías
    const categoryPreferencesQuery = `
      SELECT 
        c.name as category_name,
        COUNT(DISTINCT s.user_id) as unique_buyers,
        COUNT(s.id) as total_purchases,
        COALESCE(SUM(s.total_amount), 0) as total_revenue
      FROM categories c
      LEFT JOIN events e ON c.id = e.category_id
      LEFT JOIN sales s ON e.id = s.event_id
      WHERE s.created_at >= NOW() - INTERVAL '${period} days'
      GROUP BY c.id, c.name
      ORDER BY total_revenue DESC
    `
    
    const categoryPreferencesResult = await db.query(categoryPreferencesQuery)
    const categoryPreferences = categoryPreferencesResult.rows

    res.json({
      success: true,
      data: {
        purchasePatterns,
        dayPatterns,
        userBehavior,
        categoryPreferences
      }
    })
  } catch (error) {
    console.error('Error fetching behavior analysis:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== PREDICCIONES DE VENTAS =====

// GET /api/analytics/predictions - Predicciones de ventas
router.get('/predictions', auth, requireAdmin, async (req, res) => {
  try {
    const { days = '30' } = req.query // días a predecir

    // Datos históricos para predicción
    const historicalDataQuery = `
      SELECT 
        DATE(s.created_at) as date,
        COUNT(*) as sales_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '90 days'
      GROUP BY DATE(s.created_at)
      ORDER BY date DESC
    `
    
    const historicalResult = await db.query(historicalDataQuery)
    const historicalData = historicalResult.rows

    // Calcular tendencias simples
    const calculateTrends = (data) => {
      if (data.length < 2) return { growth: 0, trend: 'stable' }
      
      const recent = data.slice(0, 7) // últimos 7 días
      const previous = data.slice(7, 14) // 7 días anteriores
      
      const recentAvg = recent.reduce((sum, day) => sum + day.revenue, 0) / recent.length
      const previousAvg = previous.reduce((sum, day) => sum + day.revenue, 0) / previous.length
      
      const growth = previousAvg > 0 ? ((recentAvg - previousAvg) / previousAvg) * 100 : 0
      
      return {
        growth: Math.round(growth * 100) / 100,
        trend: growth > 5 ? 'increasing' : growth < -5 ? 'decreasing' : 'stable'
      }
    }

    const trends = calculateTrends(historicalData)

    // Predicciones simples basadas en tendencias
    const lastDayRevenue = historicalData[0]?.revenue || 0
    const predictedRevenue = lastDayRevenue * (1 + (trends.growth / 100))
    
    const predictions = []
    for (let i = 1; i <= parseInt(days); i++) {
      const predictedDate = new Date()
      predictedDate.setDate(predictedDate.getDate() + i)
      
      predictions.push({
        date: predictedDate.toISOString().split('T')[0],
        predictedRevenue: Math.round(predictedRevenue * (1 + (trends.growth / 100) * i)),
        confidence: Math.max(50, 100 - (i * 2)) // Confianza disminuye con el tiempo
      })
    }

    // Análisis de estacionalidad
    const seasonalityQuery = `
      SELECT 
        EXTRACT(MONTH FROM s.created_at) as month,
        COUNT(*) as sales_count,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM sales s
      WHERE s.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM s.created_at)
      ORDER BY month
    `
    
    const seasonalityResult = await db.query(seasonalityQuery)
    const seasonality = seasonalityResult.rows

    res.json({
      success: true,
      data: {
        historicalData: historicalData.slice(0, 30), // últimos 30 días
        trends,
        predictions,
        seasonality,
        summary: {
          currentTrend: trends.trend,
          growthRate: trends.growth,
          nextMonthPrediction: predictions.slice(0, 30).reduce((sum, p) => sum + p.predictedRevenue, 0),
          confidence: 85 // Confianza general del modelo
        }
      }
    })
  } catch (error) {
    console.error('Error fetching sales predictions:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ANÁLISIS INTELIGENTE DE VENTAS =====

// GET /api/analytics/sales-patterns - Análisis de patrones de ventas
router.get('/sales-patterns', auth, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, eventId } = req.query

    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (startDate) {
      whereClause += ` AND s.created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND s.created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    if (eventId) {
      whereClause += ` AND s.event_id = $${paramIndex}`
      params.push(eventId)
      paramIndex++
    }

    // Análisis por hora del día
    const hourlyAnalysisQuery = `
      SELECT 
        EXTRACT(HOUR FROM s.created_at) as hour,
        COUNT(*) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue,
        COUNT(DISTINCT s.user_id) as unique_customers
      FROM sales s
      ${whereClause}
      GROUP BY EXTRACT(HOUR FROM s.created_at)
      ORDER BY hour
    `
    
    const hourlyResult = await db.query(hourlyAnalysisQuery, params)
    const hourlyData = hourlyResult.rows

    // Calcular estadísticas
    const totalSales = hourlyData.reduce((sum, hour) => sum + parseInt(hour.sales_count), 0)
    const totalRevenue = hourlyData.reduce((sum, hour) => sum + parseFloat(hour.revenue), 0)
    const avgSalesPerHour = totalSales / 24
    const avgRevenuePerHour = totalRevenue / 24

    // Encontrar hora pico y hora baja
    let peakHour = { hour: 0, sales: 0, revenue: 0 }
    let lowHour = { hour: 0, sales: 999999, revenue: 0 }

    hourlyData.forEach(hour => {
      const sales = parseInt(hour.sales_count)
      const revenue = parseFloat(hour.revenue)
      
      if (sales > peakHour.sales) {
        peakHour = { hour: hour.hour, sales, revenue }
      }
      
      if (sales < lowHour.sales && sales > 0) {
        lowHour = { hour: hour.hour, sales, revenue }
      }
    })

    // Análisis de tendencias
    const trendAnalysis = analyzeTrends(hourlyData)
    
    // Recomendaciones basadas en IA
    const recommendations = generateRecommendations(hourlyData, peakHour, lowHour, avgSalesPerHour)

    // Análisis por día de la semana
    const dailyAnalysisQuery = `
      SELECT 
        EXTRACT(DOW FROM s.created_at) as day_of_week,
        COUNT(*) as sales_count,
        COALESCE(SUM(s.total_amount), 0) as revenue
      FROM sales s
      ${whereClause}
      GROUP BY EXTRACT(DOW FROM s.created_at)
      ORDER BY day_of_week
    `
    
    const dailyResult = await db.query(dailyAnalysisQuery, params)
    const dailyData = dailyResult.rows

    res.json({
      success: true,
      data: {
        hourlyAnalysis: {
          data: hourlyData,
          peakHour: {
            hour: peakHour.hour,
            sales: peakHour.sales,
            revenue: peakHour.revenue,
            formattedHour: formatHour(peakHour.hour)
          },
          lowHour: {
            hour: lowHour.hour,
            sales: lowHour.sales,
            revenue: lowHour.revenue,
            formattedHour: formatHour(lowHour.hour)
          },
          averages: {
            salesPerHour: Math.round(avgSalesPerHour * 100) / 100,
            revenuePerHour: Math.round(avgRevenuePerHour * 100) / 100
          }
        },
        dailyAnalysis: {
          data: dailyData,
          bestDay: findBestDay(dailyData),
          worstDay: findWorstDay(dailyData)
        },
        trends: trendAnalysis,
        recommendations: recommendations,
        summary: {
          totalSales,
          totalRevenue,
          totalHours: 24,
          dataPoints: hourlyData.length
        }
      }
    })
  } catch (error) {
    console.error('Error fetching sales patterns:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== ANÁLISIS DE TENDENCIAS =====
function analyzeTrends(hourlyData) {
  const trends = {
    morningTrend: 0,
    afternoonTrend: 0,
    eveningTrend: 0,
    nightTrend: 0
  }

  // Analizar tendencias por períodos del día
  const morning = hourlyData.filter(h => h.hour >= 6 && h.hour < 12)
  const afternoon = hourlyData.filter(h => h.hour >= 12 && h.hour < 18)
  const evening = hourlyData.filter(h => h.hour >= 18 && h.hour < 22)
  const night = hourlyData.filter(h => h.hour >= 22 || h.hour < 6)

  trends.morningTrend = calculateTrend(morning)
  trends.afternoonTrend = calculateTrend(afternoon)
  trends.eveningTrend = calculateTrend(evening)
  trends.nightTrend = calculateTrend(night)

  return trends
}

function calculateTrend(periodData) {
  if (periodData.length < 2) return 0
  
  const sales = periodData.map(h => parseInt(h.sales_count))
  const avg = sales.reduce((sum, val) => sum + val, 0) / sales.length
  
  // Calcular tendencia (positiva o negativa)
  let trend = 0
  for (let i = 1; i < sales.length; i++) {
    if (sales[i] > sales[i-1]) trend += 1
    else if (sales[i] < sales[i-1]) trend -= 1
  }
  
  return trend / (sales.length - 1)
}

// ===== GENERACIÓN DE RECOMENDACIONES CON IA =====
function generateRecommendations(hourlyData, peakHour, lowHour, avgSalesPerHour) {
  const recommendations = []

  // Recomendación basada en hora pico
  if (peakHour.sales > avgSalesPerHour * 1.5) {
    recommendations.push({
      type: 'peak_hour',
      title: 'Hora Pico Detectada',
      description: `La hora ${formatHour(peakHour.hour)} es tu hora pico con ${peakHour.sales} ventas`,
      action: 'Considera aumentar el personal de atención en esta hora',
      priority: 'high'
    })
  }

  // Recomendación basada en hora baja
  if (lowHour.sales < avgSalesPerHour * 0.5) {
    recommendations.push({
      type: 'low_hour',
      title: 'Hora Baja Identificada',
      description: `La hora ${formatHour(lowHour.hour)} tiene solo ${lowHour.sales} ventas`,
      action: 'Considera promociones especiales para esta hora',
      priority: 'medium'
    })
  }

  // Análisis de distribución
  const activeHours = hourlyData.filter(h => parseInt(h.sales_count) > 0).length
  if (activeHours < 8) {
    recommendations.push({
      type: 'limited_hours',
      title: 'Horario Limitado',
      description: `Solo ${activeHours} horas del día tienen actividad`,
      action: 'Considera extender el horario de atención o mejorar la visibilidad',
      priority: 'medium'
    })
  }

  // Análisis de eficiencia
  const efficiency = calculateEfficiency(hourlyData)
  if (efficiency < 0.3) {
    recommendations.push({
      type: 'efficiency',
      title: 'Baja Eficiencia Horaria',
      description: `Solo el ${Math.round(efficiency * 100)}% de las horas son productivas`,
      action: 'Optimiza los horarios de atención y marketing',
      priority: 'high'
    })
  }

  return recommendations
}

function calculateEfficiency(hourlyData) {
  const activeHours = hourlyData.filter(h => parseInt(h.sales_count) > 0).length
  return activeHours / 24
}

function findBestDay(dailyData) {
  if (dailyData.length === 0) return null
  
  let bestDay = dailyData[0]
  dailyData.forEach(day => {
    if (parseInt(day.sales_count) > parseInt(bestDay.sales_count)) {
      bestDay = day
    }
  })
  
  return {
    day: bestDay.day_of_week,
    sales: bestDay.sales_count,
    revenue: bestDay.revenue,
    dayName: getDayName(bestDay.day_of_week)
  }
}

function findWorstDay(dailyData) {
  if (dailyData.length === 0) return null
  
  let worstDay = dailyData[0]
  dailyData.forEach(day => {
    if (parseInt(day.sales_count) < parseInt(worstDay.sales_count)) {
      worstDay = day
    }
  })
  
  return {
    day: worstDay.day_of_week,
    sales: worstDay.sales_count,
    revenue: worstDay.revenue,
    dayName: getDayName(worstDay.day_of_week)
  }
}

function formatHour(hour) {
  return `${hour.toString().padStart(2, '0')}:00`
}

function getDayName(dayOfWeek) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
  return days[dayOfWeek]
}

module.exports = router
