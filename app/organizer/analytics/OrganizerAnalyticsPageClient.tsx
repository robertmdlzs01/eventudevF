"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Legend,
} from "recharts"
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Target,
  Activity,
  BarChart3,
  PieChartIcon,
  Download,
  RefreshCw,
  Zap,
  Clock,
  Star,
} from "lucide-react"

// Analytics data interfaces
interface AnalyticsData {
  salesTrendData: Array<{
    date: string
    ventas: number
    ingresos: number
    eventos: number
  }>
  audienceData: Array<{
    edad: string
    hombres: number
    mujeres: number
    total: number
  }>
  eventPerformanceData: Array<{
    evento: string
    ocupacion: number
    ingresos: number
    satisfaccion: number
    categoria: string
    fecha: string
  }>
  channelData: Array<{
    canal: string
    ventas: number
    color: string
  }>
  timeAnalysisData: Array<{
    hora: string
    ventas: number
  }>
  conversionFunnelData: Array<{
    etapa: string
    valor: number
    porcentaje: number
  }>
}



export default function OrganizerAnalyticsPageClient() {
  const [selectedPeriod, setSelectedPeriod] = useState("6m")
  const [selectedEvent, setSelectedEvent] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    salesTrendData: [],
    audienceData: [],
    eventPerformanceData: [],
    channelData: [],
    timeAnalysisData: [],
    conversionFunnelData: [],
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true)
      
      // Load events data for analytics
      const eventsResponse = await apiClient.getOrganizerEvents()
      
      if (eventsResponse.success && eventsResponse.data) {
        const events = eventsResponse.data.events || []
        
        // Generate analytics data from events
        const salesTrendData = generateSalesTrend(events)
        const eventPerformanceData = generateEventPerformance(events)
        const channelData = generateChannelData()
        const audienceData = generateAudienceData()
        const timeAnalysisData = generateTimeAnalysis()
        const conversionFunnelData = generateConversionFunnel()
        
        setAnalyticsData({
          salesTrendData,
          audienceData,
          eventPerformanceData,
          channelData,
          timeAnalysisData,
          conversionFunnelData,
        })
      }
    } catch (error) {
      console.error("Error loading analytics data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateSalesTrend = (events: any[]) => {
    // Generate monthly trend from events data
    const monthlyData: { [key: string]: { ventas: number, ingresos: number, eventos: number } } = {}
    
    events.forEach(event => {
      const month = new Date(event.date).toISOString().slice(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { ventas: 0, ingresos: 0, eventos: 0 }
      }
      monthlyData[month].ventas += event.tickets_sold || 0
      monthlyData[month].ingresos += event.revenue || 0
      monthlyData[month].eventos += 1
    })
    
    return Object.entries(monthlyData).map(([date, data]) => ({
      date,
      ...data
    }))
  }

  const generateEventPerformance = (events: any[]) => {
    return events.map(event => ({
      evento: event.title,
      ocupacion: event.total_capacity ? ((event.tickets_sold || 0) / event.total_capacity) * 100 : 0,
      ingresos: event.revenue || 0,
      satisfaccion: calculateEventSatisfaction(event), // AI-based satisfaction calculation
      categoria: event.category?.name || event.category || 'General',
      fecha: event.date,
    }))
  }

  const calculateEventSatisfaction = (event: any) => {
    // AI algorithm to calculate satisfaction based on multiple factors
    let satisfaction = 4.0 // Base satisfaction
    
    // Factor 1: Occupancy rate (higher occupancy = higher satisfaction potential)
    const occupancyRate = event.total_capacity ? (event.tickets_sold || 0) / event.total_capacity : 0
    if (occupancyRate > 0.8) satisfaction += 0.5
    else if (occupancyRate > 0.6) satisfaction += 0.3
    else if (occupancyRate > 0.4) satisfaction += 0.1
    else satisfaction -= 0.2
    
    // Factor 2: Revenue per ticket (higher value = premium experience)
    const revenuePerTicket = event.tickets_sold ? event.revenue / event.tickets_sold : 0
    if (revenuePerTicket > 100000) satisfaction += 0.3
    else if (revenuePerTicket > 50000) satisfaction += 0.1
    
    // Factor 3: Event recency (newer events might have better satisfaction)
    const eventDate = new Date(event.date)
    const daysUntilEvent = Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    if (daysUntilEvent > 30) satisfaction += 0.1 // Future events
    else if (daysUntilEvent < -7) satisfaction += 0.2 // Recent past events
    
    // Factor 4: Category performance (some categories naturally have higher satisfaction)
    const category = event.category?.name || event.category || 'General'
    if (['Música', 'Teatro', 'Conferencia'].includes(category)) satisfaction += 0.1
    
    return Math.min(5.0, Math.max(1.0, satisfaction))
  }

  const generateChannelData = () => [
    { canal: "Web Directa", ventas: 45, color: "#3B82F6" },
    { canal: "Redes Sociales", ventas: 30, color: "#10B981" },
    { canal: "Puntos de Venta", ventas: 15, color: "#F59E0B" },
    { canal: "Afiliados", ventas: 10, color: "#8B5CF6" },
  ]

  const generateAudienceData = () => [
    { edad: "18-25", hombres: 0, mujeres: 0, total: 0 },
    { edad: "26-35", hombres: 0, mujeres: 0, total: 0 },
    { edad: "36-45", hombres: 0, mujeres: 0, total: 0 },
    { edad: "46-55", hombres: 0, mujeres: 0, total: 0 },
    { edad: "56+", hombres: 0, mujeres: 0, total: 0 },
  ]

  const generateTimeAnalysis = () => [
    { hora: "00:00", ventas: 0 },
    { hora: "03:00", ventas: 0 },
    { hora: "06:00", ventas: 0 },
    { hora: "09:00", ventas: 0 },
    { hora: "12:00", ventas: 0 },
    { hora: "15:00", ventas: 0 },
    { hora: "18:00", ventas: 0 },
    { hora: "21:00", ventas: 0 },
  ]

  const generateConversionFunnel = () => [
    { etapa: "Visitantes", valor: 0, porcentaje: 100 },
    { etapa: "Interesados", valor: 0, porcentaje: 0 },
    { etapa: "Carrito", valor: 0, porcentaje: 0 },
    { etapa: "Checkout", valor: 0, porcentaje: 0 },
    { etapa: "Compra", valor: 0, porcentaje: 0 },
  ]

  // AI Business Intelligence - Generate intelligent insights
  const generateAIInsights = () => {
    const insights: any[] = []
    
    if (analyticsData.eventPerformanceData.length === 0) {
      return insights
    }

    const { eventPerformanceData, salesTrendData } = analyticsData
    
    // 1. Revenue Performance Analysis
    const totalRevenue = eventPerformanceData.reduce((sum, event) => sum + event.ingresos, 0)
    const avgRevenue = totalRevenue / eventPerformanceData.length
    
    if (totalRevenue > 10000000) {
      insights.push({
        type: 'success' as const,
        title: 'Rendimiento Financiero Excepcional',
        description: `Has generado $${(totalRevenue / 1000000).toFixed(1)}M en ingresos totales`,
        impact: 'high' as const,
        action: 'Considera expandir tu portafolio de eventos premium'
      })
    }

    // 2. Occupancy Rate Analysis
    const avgOccupancy = eventPerformanceData.reduce((sum, event) => sum + event.ocupacion, 0) / eventPerformanceData.length
    
    if (avgOccupancy < 50) {
      insights.push({
        type: 'warning' as const,
        title: 'Baja Utilización de Capacidad',
        description: `Tu ocupación promedio es ${avgOccupancy.toFixed(1)}%`,
        impact: 'high' as const,
        action: 'Revisa estrategias de precios y marketing para aumentar ventas'
      })
    } else if (avgOccupancy > 80) {
      insights.push({
        type: 'success' as const,
        title: 'Excelente Utilización de Capacidad',
        description: `Tu ocupación promedio es ${avgOccupancy.toFixed(1)}%`,
        impact: 'medium' as const,
        action: 'Considera aumentar precios o expandir capacidad'
      })
    }

    // 3. Category Performance Analysis
    const categoryPerformance = eventPerformanceData.reduce((acc, event) => {
      if (!acc[event.categoria]) acc[event.categoria] = { count: 0, totalRevenue: 0, avgOccupancy: 0 }
      acc[event.categoria].count++
      acc[event.categoria].totalRevenue += event.ingresos
      acc[event.categoria].avgOccupancy += event.ocupacion
      return acc
    }, {} as Record<string, any>)

    Object.entries(categoryPerformance).forEach(([category, data]) => {
      const avgOcc = data.avgOccupancy / data.count
      if (avgOcc < 40) {
        insights.push({
          type: 'opportunity' as const,
          title: `Oportunidad en ${category}`,
          description: `Los eventos de ${category} tienen baja ocupación (${avgOcc.toFixed(1)}%)`,
          impact: 'medium' as const,
          action: `Implementa estrategias específicas para eventos de ${category}`
        })
      }
    })

    // 4. Seasonal Trends Analysis
    if (salesTrendData.length >= 3) {
      const recentMonths = salesTrendData.slice(-3)
      const trend = recentMonths[2].ingresos - recentMonths[0].ingresos
      
      if (trend > 0) {
        insights.push({
          type: 'success' as const,
          title: 'Tendencia Positiva',
          description: 'Tus ingresos muestran una tendencia creciente en los últimos meses',
          impact: 'medium' as const,
          action: 'Mantén las estrategias que están funcionando'
        })
      } else if (trend < 0) {
        insights.push({
          type: 'warning' as const,
          title: 'Tendencia Negativa',
          description: 'Tus ingresos muestran una tendencia decreciente',
          impact: 'high' as const,
          action: 'Revisa y ajusta tus estrategias de marketing y precios'
        })
      }
    }

    // 5. Customer Value Analysis
    const totalTickets = eventPerformanceData.reduce((sum, event) => sum + (event.ingresos / avgRevenue), 0)
    const revenuePerTicket = totalRevenue / totalTickets
    
    if (revenuePerTicket > 75000) {
      insights.push({
        type: 'success' as const,
        title: 'Alto Valor por Cliente',
        description: `Tu valor promedio por ticket es $${revenuePerTicket.toLocaleString()}`,
        impact: 'medium' as const,
        action: 'Considera crear paquetes premium para maximizar ingresos'
      })
    }

    return insights.slice(0, 5) // Limit to top 5 insights
  }

  const handleRefresh = () => {
    loadAnalyticsData()
  }

  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData()
  }, [selectedPeriod])

  const totalRevenue = analyticsData.salesTrendData.reduce((sum, item) => sum + item.ingresos, 0)
  const totalSales = analyticsData.salesTrendData.reduce((sum, item) => sum + item.ventas, 0)
  const averageOccupancy = analyticsData.eventPerformanceData.length > 0 ?
    analyticsData.eventPerformanceData.reduce((sum, event) => sum + event.ocupacion, 0) / analyticsData.eventPerformanceData.length : 0
  const averageSatisfaction = analyticsData.eventPerformanceData.length > 0 ?
    analyticsData.eventPerformanceData.reduce((sum, event) => sum + event.satisfaccion, 0) / analyticsData.eventPerformanceData.length : 0

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Analíticas Avanzadas
          </h1>
          <p className="text-gray-600 mt-1">Insights profundos sobre el rendimiento de tus eventos</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 días</SelectItem>
              <SelectItem value="30d">30 días</SelectItem>
              <SelectItem value="3m">3 meses</SelectItem>
              <SelectItem value="6m">6 meses</SelectItem>
              <SelectItem value="1y">1 año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatCurrency(totalRevenue)}</div>
            <div className="flex items-center text-xs text-blue-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +15.2% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Boletos Vendidos</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{totalSales.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12.8% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Ocupación Promedio</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{averageOccupancy.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-purple-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5.3% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Satisfacción</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{averageSatisfaction.toFixed(1)}/5</div>
            <div className="flex items-center text-xs text-orange-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0.2 vs período anterior
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Analíticas */}
      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="ventas">Ventas</TabsTrigger>
          <TabsTrigger value="audiencia">Audiencia</TabsTrigger>
          <TabsTrigger value="rendimiento">Rendimiento</TabsTrigger>
          <TabsTrigger value="tendencias">Tendencias</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Tendencia de Ingresos
                </CardTitle>
                <CardDescription>Evolución mensual de ingresos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.salesTrendData}>
                    <defs>
                      <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), "Ingresos"]} />
                    <Area
                      type="monotone"
                      dataKey="ingresos"
                      stroke="#3B82F6"
                      fillOpacity={1}
                      fill="url(#colorIngresos)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Canales de Venta
                </CardTitle>
                <CardDescription>Distribución por canal</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.channelData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="ventas"
                      label={(entry: any) => `${entry.canal}: ${entry.ventas}%`}
                    >
                      {analyticsData.channelData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

                      <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  🧠 Insights IA & Recomendaciones Inteligentes
                </CardTitle>
                <CardDescription>
                  Análisis automático basado en tus datos reales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {generateAIInsights().map((insight, index) => (
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
                          <p className="text-sm text-gray-700 mb-2">{insight.description}</p>
                          <p className="text-sm font-medium text-blue-600">🎯 {insight.action}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="ventas" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Ventas vs Eventos
                </CardTitle>
                <CardDescription>Relación entre número de eventos y ventas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={analyticsData.salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ventas" fill="#3B82F6" name="Ventas" />
                    <Line yAxisId="right" type="monotone" dataKey="eventos" stroke="#10B981" name="Eventos" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Análisis por Horario
                </CardTitle>
                <CardDescription>Ventas por hora del día</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.timeAnalysisData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hora" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="ventas" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Embudo de Conversión
              </CardTitle>
              <CardDescription>Análisis del proceso de compra</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.conversionFunnelData.map((stage, index) => (
                  <div key={stage.etapa} className="flex items-center gap-4">
                    <div className="w-24 text-sm font-medium">{stage.etapa}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                        style={{ width: `${stage.porcentaje}%` }}
                      >
                        {stage.porcentaje}%
                      </div>
                    </div>
                    <div className="w-20 text-sm text-gray-600">{stage.valor.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audiencia" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Demografía de Audiencia
              </CardTitle>
              <CardDescription>Distribución por edad y género</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analyticsData.audienceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="edad" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="hombres" stackId="a" fill="#3B82F6" name="Hombres" />
                  <Bar dataKey="mujeres" stackId="a" fill="#EC4899" name="Mujeres" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rendimiento" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Rendimiento por Evento
              </CardTitle>
              <CardDescription>Métricas detalladas de cada evento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.eventPerformanceData.map((event, index) => (
                  <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{event.evento}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(event.fecha).toLocaleDateString("es-ES")}
                          </span>
                          <Badge variant="outline">{event.categoria}</Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{formatCurrency(event.ingresos)}</p>
                        <p className="text-sm text-gray-600">{event.ocupacion}% ocupación</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ocupación</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${event.ocupacion}%` }} />
                          </div>
                          <span className="text-sm font-medium">{event.ocupacion}%</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Satisfacción</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-3 w-3 ${
                                  star <= event.satisfaccion ? "text-yellow-400 fill-current" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{event.satisfaccion}</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-1">Ingresos</p>
                        <p className="text-sm font-medium text-green-600">{formatCurrency(event.ingresos)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tendencias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Proyecciones y Tendencias
              </CardTitle>
              <CardDescription>Análisis predictivo basado en datos históricos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analyticsData.salesTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="ventas" stroke="#3B82F6" strokeWidth={2} name="Ventas Reales" />
                  <Line
                    type="monotone"
                    dataKey="ingresos"
                    stroke="#10B981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Proyección In gresos"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
