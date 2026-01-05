"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Progress } from "../../components/ui/progress"
import { Badge } from "../../components/ui/badge"
import { DollarSign, Calendar, Users, RefreshCw, Ticket, Activity } from "lucide-react"
import { apiClient } from "../../lib/api-client"
import { useToast } from "../../hooks/use-toast"

interface DashboardStats {
  overview: {
    totalEvents: number
    publishedEvents: number
    draftEvents: number
    totalSales: number
    totalRevenue: number
    totalTicketsSold: number
    uniqueCustomers: number
    averageOrderValue: number
  }
  monthlyTrend: Array<{
    month: string
    sales: number
    revenue: number
  }>
  topEvents: Array<{
    id: number
    title: string
    date: string
    salesCount: number
    revenue: number
    ticketsSold: number
    totalCapacity: number
    occupancyRate: number
  }>
  recentActivity: Array<{
    type: string
    id: number
    description: string
    amount: number
    eventTitle: string
    createdAt: string
    timeAgo: string
  }>
  aiInsights: Array<{
    type: 'success' | 'warning' | 'opportunity' | 'risk'
    title: string
    description: string
    impact: 'high' | 'medium' | 'low'
    action: string
    priority: number
  }>
  businessMetrics: {
    growthRate: number
    customerRetention: number
    marketTrend: 'rising' | 'stable' | 'declining'
    seasonality: string
    competitivePosition: 'strong' | 'average' | 'weak'
  }
}

interface RealtimeSalesData {
  eventId: number
  eventTitle: string
  eventDate: string
  totalCapacity: number
  ticketsSold: number
  remainingCapacity: number
  occupancyRate: number
  totalSales: number
  totalRevenue: number
  averageSaleAmount: number
  salesLastHour: number
  salesToday: number
  salesThisWeek: number
  lastSaleTime: string
  recentSales: Array<{
    id: number
    quantity: number
    amount: number
    buyerName: string
    buyerEmail: string
    paymentMethod: string
    ticketType: string
    createdAt: string
    timeAgo: string
  }>
  hourlySales: Array<{
    hour: number
    sales: number
    revenue: number
  }>
  timestamp: string
}

export default function OrganizerDashboardClient() {
  const { toast } = useToast()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null)
  const [realtimeData, setRealtimeData] = useState<RealtimeSalesData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Get organizer ID from current user
  const getCurrentOrganizerId = () => {
    try {
      const currentUser = localStorage.getItem("current_user")
      if (currentUser) {
        const user = JSON.parse(currentUser)
        return user.id
      }
    } catch (error) {
      console.error("Error getting current user:", error)
    }
    return null
  }

  // AI Business Intelligence Functions
  const generateAIInsights = (data: any) => {
    const insights = []
    const { overview, monthlyTrend, topEvents } = data

    // Revenue Growth Analysis
    if (monthlyTrend.length >= 2) {
      const currentMonth = monthlyTrend[monthlyTrend.length - 1]
      const previousMonth = monthlyTrend[monthlyTrend.length - 2]
      const growthRate = ((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100

      if (growthRate > 20) {
        insights.push({
          type: 'success' as const,
          title: 'Crecimiento Excepcional',
          description: `Tus ingresos han crecido ${growthRate.toFixed(1)}% este mes. ¡Excelente trabajo!`,
          impact: 'high' as const,
          action: 'Mantén esta tendencia optimizando tus estrategias de marketing',
          priority: 1
        })
      } else if (growthRate < -10) {
        insights.push({
          type: 'warning' as const,
          title: 'Declive en Ingresos',
          description: `Tus ingresos han disminuido ${Math.abs(growthRate).toFixed(1)}% este mes.`,
          impact: 'high' as const,
          action: 'Revisa tus estrategias de precios y marketing',
          priority: 1
        })
      }
    }

    // Event Performance Analysis
    if (topEvents.length > 0) {
      const bestEvent = topEvents[0]
      const worstEvent = topEvents[topEvents.length - 1]
      
      if (bestEvent.occupancyRate > 80) {
        insights.push({
          type: 'success' as const,
          title: 'Evento de Alto Rendimiento',
          description: `${bestEvent.title} tiene ${bestEvent.occupancyRate.toFixed(1)}% de ocupación`,
          impact: 'medium' as const,
          action: 'Replica las estrategias exitosas en otros eventos',
          priority: 2
        })
      }

      if (worstEvent.occupancyRate < 30) {
        insights.push({
          type: 'opportunity' as const,
          title: 'Oportunidad de Mejora',
          description: `${worstEvent.title} solo tiene ${worstEvent.occupancyRate.toFixed(1)}% de ocupación`,
          impact: 'medium' as const,
          action: 'Implementa estrategias de marketing agresivas para este evento',
          priority: 2
        })
      }
    }

    // Customer Analysis
    if (overview.averageOrderValue > 50000) {
      insights.push({
        type: 'success' as const,
        title: 'Valor Promedio Alto',
        description: `Tu valor promedio por orden es $${overview.averageOrderValue.toLocaleString()}`,
        impact: 'medium' as const,
        action: 'Considera crear paquetes premium para maximizar ingresos',
        priority: 3
      })
    }

    // Seasonal Patterns
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 11 || currentMonth <= 2) {
      insights.push({
        type: 'opportunity' as const,
        title: 'Temporada Alta',
        description: 'Estás en temporada alta. Los eventos festivos suelen tener mayor demanda',
        impact: 'high' as const,
        action: 'Aumenta precios y promociona eventos especiales',
        priority: 1
      })
    }

    // Capacity Utilization
    const avgOccupancy = topEvents.reduce((sum: number, event: any) => sum + event.occupancyRate, 0) / topEvents.length
    if (avgOccupancy < 50) {
      insights.push({
        type: 'warning' as const,
        title: 'Baja Utilización de Capacidad',
        description: `Tu ocupación promedio es ${avgOccupancy.toFixed(1)}%`,
        impact: 'high' as const,
        action: 'Revisa precios, marketing y selección de fechas',
        priority: 1
      })
    }

    return insights.sort((a, b) => a.priority - b.priority)
  }

  const calculateBusinessMetrics = (data: any) => {
    const { monthlyTrend, overview } = data
    
    // Growth Rate Calculation
    let growthRate = 0
    if (monthlyTrend.length >= 2) {
      const current = monthlyTrend[monthlyTrend.length - 1]
      const previous = monthlyTrend[monthlyTrend.length - 2]
      growthRate = ((current.revenue - previous.revenue) / previous.revenue) * 100
    }

    // Market Trend Analysis
    let marketTrend: 'rising' | 'stable' | 'declining' = 'stable'
    if (growthRate > 15) marketTrend = 'rising'
    else if (growthRate < -15) marketTrend = 'declining'

    // Seasonality Detection
    let seasonality = 'No disponible'
    if (monthlyTrend.length >= 12) {
      const monthlyAverages = new Array(12).fill(0)
      monthlyTrend.forEach((item: any) => {
        const month = parseInt(item.month.split('-')[1]) - 1
        monthlyAverages[month] += item.revenue
      })
      
      const maxMonth = monthlyAverages.indexOf(Math.max(...monthlyAverages))
      const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                         'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
      seasonality = monthNames[maxMonth]
    }

    // Competitive Position
    let competitivePosition: 'strong' | 'average' | 'weak' = 'average'
    if (overview.averageOrderValue > 75000 && growthRate > 20) competitivePosition = 'strong'
    else if (overview.averageOrderValue < 25000 || growthRate < -20) competitivePosition = 'weak'

    return {
      growthRate: Math.round(growthRate * 100) / 100,
      customerRetention: Math.min(95, Math.max(60, 85 + (growthRate / 2))), // Simulated
      marketTrend,
      seasonality,
      competitivePosition
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const organizerId = getCurrentOrganizerId()
      if (!organizerId) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        })
        return
      }

      // Load dashboard stats
      const statsResponse = await apiClient.getOrganizerDashboard()
      if (statsResponse.success && statsResponse.data) {
        // Generate AI insights from the data
        const aiInsights = generateAIInsights(statsResponse.data)
        const businessMetrics = calculateBusinessMetrics(statsResponse.data)
        
        const enhancedStats = {
          ...statsResponse.data,
          aiInsights,
          businessMetrics
        }
        
        setDashboardStats(enhancedStats)
      } else {
        console.error("Error loading dashboard stats:", statsResponse.message)
        setDashboardStats({
          overview: {
            totalEvents: 0,
            publishedEvents: 0,
            draftEvents: 0,
            totalSales: 0,
            totalRevenue: 0,
            totalTicketsSold: 0,
            uniqueCustomers: 0,
            averageOrderValue: 0,
          },
          monthlyTrend: [],
          topEvents: [],
          recentActivity: [],
          aiInsights: [],
          businessMetrics: {
            growthRate: 0,
            customerRetention: 0,
            marketTrend: 'stable',
            seasonality: 'No disponible',
            competitivePosition: 'average'
          }
        })
      }

      // Load real-time sales data - using events data instead
      const eventsResponse = await apiClient.getOrganizerEvents()
      if (eventsResponse.success && eventsResponse.data) {
        // Convert events data to realtime format
        const realtimeEvents = eventsResponse.data.events?.map((event: any) => ({
          eventId: event.id,
          eventTitle: event.title,
          eventDate: event.date,
          totalCapacity: event.total_capacity || 0,
          ticketsSold: event.tickets_sold || 0,
          remainingCapacity: (event.total_capacity || 0) - (event.tickets_sold || 0),
          occupancyRate: event.total_capacity ? ((event.tickets_sold || 0) / event.total_capacity) * 100 : 0,
          totalSales: event.tickets_sold || 0,
          totalRevenue: event.revenue || 0,
          averageSaleAmount: event.tickets_sold ? (event.revenue || 0) / event.tickets_sold : 0,
          salesLastHour: 0,
          salesToday: 0,
          salesThisWeek: 0,
          lastSaleTime: event.created_at || new Date().toISOString(),
          recentSales: [],
          hourlySales: [],
          timestamp: new Date().toISOString(),
        })) || []
        
        setRealtimeData(realtimeEvents)
      } else {
        console.error("Error loading events data:", eventsResponse.message)
        setRealtimeData([])
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard. Mostrando datos de ejemplo.",
        variant: "destructive",
      })

      // Set empty data on error
      setDashboardStats({
        overview: {
          totalEvents: 0,
          publishedEvents: 0,
          draftEvents: 0,
          totalSales: 0,
          totalRevenue: 0,
          totalTicketsSold: 0,
          uniqueCustomers: 0,
          averageOrderValue: 0,
        },
        monthlyTrend: [],
        topEvents: [],
        recentActivity: [],
        aiInsights: [],
        businessMetrics: {
          growthRate: 0,
          customerRetention: 0,
          marketTrend: 'stable' as const,
          seasonality: 'No disponible',
          competitivePosition: 'average' as const
        }
      })
      setRealtimeData([])
    } finally {
      setLoading(false)
    }
  }

  const refreshData = async () => {
    try {
      setRefreshing(true)
      await loadDashboardData()
      toast({
        title: "Datos actualizados",
        description: "La información se ha actualizado correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los datos",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadDashboardData()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadDashboardData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard del Organizador</h1>
          <p className="text-muted-foreground">Monitorea tus eventos y ventas en tiempo real</p>
        </div>
        <Button onClick={refreshData} disabled={refreshing} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Overview Stats */}
      {dashboardStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${dashboardStats.overview.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Promedio por venta: ${dashboardStats.overview.averageOrderValue.toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.overview.publishedEvents}</div>
              <p className="text-xs text-muted-foreground">{dashboardStats.overview.draftEvents} borradores</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.overview.totalTicketsSold}</div>
              <p className="text-xs text-muted-foreground">{dashboardStats.overview.totalSales} transacciones</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardStats.overview.uniqueCustomers}</div>
              <p className="text-xs text-muted-foreground">Base de clientes activa</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Real-time Sales Data */}
      {realtimeData.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Ventas en Tiempo Real
              </CardTitle>
              <CardDescription>Última actualización: {new Date().toLocaleTimeString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {realtimeData.slice(0, 3).map((event) => (
                  <div key={event.eventId} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <p className="font-medium">{event.eventTitle}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Última hora: {event.salesLastHour} ventas</span>
                        <span>Hoy: {event.salesToday} ventas</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${event.totalRevenue.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">{event.occupancyRate}% ocupación</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardStats?.recentActivity.slice(0, 5).map((activity, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.eventTitle} • {activity.timeAgo}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-green-600">+${activity.amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top Events */}
      {dashboardStats?.topEvents && dashboardStats.topEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Eventos con Mejor Rendimiento</CardTitle>
            <CardDescription>Tus eventos ordenados por ingresos generados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dashboardStats.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-pink-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()} • {event.salesCount} ventas
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="font-bold">${event.revenue.toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={event.occupancyRate} className="w-20" />
                      <span className="text-xs text-muted-foreground">{event.occupancyRate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Insights & Business Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            🧠 Insights IA & Inteligencia de Negocios
          </CardTitle>
          <CardDescription>
            Análisis inteligente y recomendaciones basadas en tus datos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Business Metrics */}
            {dashboardStats?.businessMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-600">Tendencia del Mercado</p>
                  <Badge className={`mt-1 ${
                    dashboardStats.businessMetrics.marketTrend === 'rising' ? 'bg-green-100 text-green-800' :
                    dashboardStats.businessMetrics.marketTrend === 'declining' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {dashboardStats.businessMetrics.marketTrend === 'rising' ? '📈 En Auge' :
                     dashboardStats.businessMetrics.marketTrend === 'declining' ? '📉 En Declive' :
                     '➡️ Estable'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Posición Competitiva</p>
                  <Badge className={`mt-1 ${
                    dashboardStats.businessMetrics.competitivePosition === 'strong' ? 'bg-green-100 text-green-800' :
                    dashboardStats.businessMetrics.competitivePosition === 'weak' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {dashboardStats.businessMetrics.competitivePosition === 'strong' ? '🏆 Fuerte' :
                     dashboardStats.businessMetrics.competitivePosition === 'weak' ? '⚠️ Débil' :
                     '⚖️ Promedio'}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Temporada</p>
                  <p className="font-semibold text-blue-600">{dashboardStats.businessMetrics.seasonality}</p>
                </div>
              </div>
            )}

            {/* AI Insights */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">💡 Insights Inteligentes</h4>
              {dashboardStats?.aiInsights?.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'success' ? 'border-green-500 bg-green-50' :
                  insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                  insight.type === 'opportunity' ? 'border-blue-500 bg-blue-50' :
                  'border-red-500 bg-red-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h5 className="font-semibold">{insight.title}</h5>
                        <Badge className={`${
                          insight.impact === 'high' ? 'bg-red-100 text-red-800' :
                          insight.impact === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {insight.impact === 'high' ? 'Alto Impacto' :
                           insight.impact === 'medium' ? 'Medio Impacto' :
                           'Bajo Impacto'}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{insight.description}</p>
                      <p className="text-sm font-medium text-blue-600">🎯 {insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
              {(!dashboardStats?.aiInsights || dashboardStats.aiInsights.length === 0) && (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay insights disponibles</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
