'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  Users, 
  Target,
  Lightbulb,
  Calendar,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { getSalesPatterns } from '@/app/admin/actions'

interface SalesPatternsData {
  hourlyAnalysis: {
    data: Array<{
      hour: number
      sales_count: number
      revenue: number
      unique_customers: number
    }>
    peakHour: {
      hour: number
      sales: number
      revenue: number
      formattedHour: string
    }
    lowHour: {
      hour: number
      sales: number
      revenue: number
      formattedHour: string
    }
    averages: {
      salesPerHour: number
      revenuePerHour: number
    }
  }
  dailyAnalysis: {
    data: Array<{
      day_of_week: number
      sales_count: number
      revenue: number
    }>
    bestDay: {
      day: number
      sales: number
      revenue: number
      dayName: string
    } | null
    worstDay: {
      day: number
      sales: number
      revenue: number
      dayName: string
    } | null
  }
  trends: {
    morningTrend: number
    afternoonTrend: number
    eveningTrend: number
    nightTrend: number
  }
  recommendations: Array<{
    type: string
    title: string
    description: string
    action: string
    priority: 'high' | 'medium' | 'low'
  }>
  summary: {
    totalSales: number
    totalRevenue: number
    totalHours: number
    dataPoints: number
  }
}

export function IntelligentSalesAnalysis() {
  const [data, setData] = useState<SalesPatternsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    eventId: 'all'
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const getTrendIcon = (trend: number) => {
    if (trend > 0.1) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (trend < -0.1) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <BarChart3 className="h-4 w-4 text-gray-600" />
  }

  const getTrendText = (trend: number) => {
    if (trend > 0.1) return 'Crecimiento'
    if (trend < -0.1) return 'Descenso'
    return 'Estable'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'medium': return <Info className="h-4 w-4" />
      case 'low': return <CheckCircle className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const loadData = async () => {
    setLoading(true)
    try {
      // Filtrar el eventId si es "all" para enviar undefined
      const params = {
        ...filters,
        eventId: filters.eventId === 'all' ? undefined : filters.eventId
      }
      const patternsData = await getSalesPatterns(params)
      setData(patternsData)
    } catch (error) {
      console.error('Error loading sales patterns:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Análisis Inteligente de Ventas
            </CardTitle>
            <CardDescription>
              Detectando patrones automáticamente...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            No se pudieron cargar los datos de análisis
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Análisis Inteligente de Ventas
          </CardTitle>
          <CardDescription>
            Detección automática de patrones y recomendaciones con IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="startDate">Fecha Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="endDate">Fecha Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="eventId">Evento (Opcional)</Label>
              <Select value={filters.eventId} onValueChange={(value) => setFilters({ ...filters, eventId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los eventos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los eventos</SelectItem>
                  <SelectItem value="1">Evento 1</SelectItem>
                  <SelectItem value="2">Evento 2</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4">
            <Button onClick={loadData} className="w-full">
              Analizar Patrones
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hora Pico</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hourlyAnalysis.peakHour.formattedHour}</div>
            <p className="text-xs text-muted-foreground">
              {data.hourlyAnalysis.peakHour.sales} ventas • {formatCurrency(data.hourlyAnalysis.peakHour.revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hora Baja</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hourlyAnalysis.lowHour.formattedHour}</div>
            <p className="text-xs text-muted-foreground">
              {data.hourlyAnalysis.lowHour.sales} ventas • {formatCurrency(data.hourlyAnalysis.lowHour.revenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Ventas/Hora</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.hourlyAnalysis.averages.salesPerHour}</div>
            <p className="text-xs text-muted-foreground">
              Ventas promedio por hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Ingresos/Hora</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.hourlyAnalysis.averages.revenuePerHour)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos promedio por hora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Análisis de Tendencia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Análisis de Tendencia por Períodos
          </CardTitle>
          <CardDescription>
            Comportamiento de ventas durante diferentes períodos del día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getTrendIcon(data.trends.morningTrend)}
              <div>
                <p className="font-medium">Mañana</p>
                <p className="text-sm text-muted-foreground">{getTrendText(data.trends.morningTrend)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getTrendIcon(data.trends.afternoonTrend)}
              <div>
                <p className="font-medium">Tarde</p>
                <p className="text-sm text-muted-foreground">{getTrendText(data.trends.afternoonTrend)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getTrendIcon(data.trends.eveningTrend)}
              <div>
                <p className="font-medium">Noche</p>
                <p className="text-sm text-muted-foreground">{getTrendText(data.trends.eveningTrend)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border rounded-lg">
              {getTrendIcon(data.trends.nightTrend)}
              <div>
                <p className="font-medium">Madrugada</p>
                <p className="text-sm text-muted-foreground">{getTrendText(data.trends.nightTrend)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendaciones de IA */}
      {data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendaciones Inteligentes
            </CardTitle>
            <CardDescription>
              Sugerencias basadas en el análisis de patrones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendations.map((recommendation, index) => (
                <div key={index} className={`p-4 border rounded-lg ${getPriorityColor(recommendation.priority)}`}>
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(recommendation.priority)}
                    <div className="flex-1">
                      <h4 className="font-semibold">{recommendation.title}</h4>
                      <p className="text-sm mt-1">{recommendation.description}</p>
                      <p className="text-sm font-medium mt-2">{recommendation.action}</p>
                    </div>
                    <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                      {recommendation.priority === 'high' ? 'Alta' : 
                       recommendation.priority === 'medium' ? 'Media' : 'Baja'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumen de Datos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Resumen del Análisis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{data.summary.totalSales}</p>
              <p className="text-sm text-muted-foreground">Total Ventas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(data.summary.totalRevenue)}</p>
              <p className="text-sm text-muted-foreground">Total Ingresos</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.summary.totalHours}</p>
              <p className="text-sm text-muted-foreground">Horas Analizadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{data.summary.dataPoints}</p>
              <p className="text-sm text-muted-foreground">Puntos de Datos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
