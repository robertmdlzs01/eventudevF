"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Ticket, 
  DollarSign, 
  Calendar,
  BarChart3,
  Activity,
  RefreshCw,
  Eye
} from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface EventMetrics {
  event: {
    id: number
    title: string
    date: string
    total_capacity: number
    status: string
  }
  metrics: {
    total_sales: number
    total_tickets_sold: number
    total_revenue: number
    unique_customers: number
    occupancy_rate: number
    average_order_value: number
    remaining_capacity: number
    conversion_rate: number
  }
  hourly_sales: Array<{
    hour: string
    sales_count: number
    tickets_sold: number
    revenue: number
  }>
  ticket_type_sales: Array<{
    ticket_type: string
    price: number
    sales_count: number
    tickets_sold: number
    revenue: number
  }>
  recent_sales: Array<{
    id: number
    buyer_name: string
    buyer_email: string
    quantity: number
    amount: number
    payment_method: string
    status: string
    created_at: string
    ticket_type: string
  }>
  trends: Array<{
    day: string
    daily_sales: number
    daily_tickets: number
    daily_revenue: number
  }>
  last_updated: string
}

interface EventMetricsDashboardProps {
  eventId: number
  refreshInterval?: number // en milisegundos
}

export function EventMetricsDashboard({ eventId, refreshInterval = 30000 }: EventMetricsDashboardProps) {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getOrganizerEventAnalytics(eventId.toString())
      
      if (response.success) {
        setMetrics(response.data)
        setLastRefresh(new Date())
        setError(null)
      } else {
        setError(response.message || "Error al cargar métricas")
      }
    } catch (err) {
      setError("Error de conexión")
      console.error("Error fetching metrics:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    
    // Configurar actualización automática
    const interval = setInterval(fetchMetrics, refreshInterval)
    
    return () => clearInterval(interval)
  }, [eventId, refreshInterval])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando métricas...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <Activity className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
          <Button onClick={fetchMetrics} variant="outline" className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!metrics) return null

  return (
    <div className="space-y-6">
      {/* Header con información del evento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{metrics.event.title}</CardTitle>
              <CardDescription>
                {formatDate(metrics.event.date)} • {metrics.event.total_capacity} capacidad total
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant={metrics.event.status === 'published' ? 'default' : 'secondary'}>
                {metrics.event.status === 'published' ? 'Publicado' : 'Borrador'}
              </Badge>
              <Button onClick={fetchMetrics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Última actualización: {formatDate(metrics.last_updated)}
          </div>
        </CardHeader>
      </Card>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.total_sales}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(metrics.metrics.total_revenue)} en ingresos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.total_tickets_sold}</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={metrics.metrics.occupancy_rate} className="flex-1" />
              <span className="text-xs text-muted-foreground">
                {metrics.metrics.occupancy_rate.toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.unique_customers}</div>
            <p className="text-xs text-muted-foreground">
              Promedio: {formatCurrency(metrics.metrics.average_order_value)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Restante</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.metrics.remaining_capacity}</div>
            <p className="text-xs text-muted-foreground">
              {metrics.metrics.conversion_rate.toFixed(1)}% de conversión
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para diferentes vistas */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="sales">Ventas por Hora</TabsTrigger>
          <TabsTrigger value="tickets">Tipos de Boletos</TabsTrigger>
          <TabsTrigger value="recent">Actividad Reciente</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Gráfico de tendencias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Tendencias (7 días)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.trends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm">
                        {new Date(trend.day).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm">{trend.daily_sales} ventas</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(trend.daily_revenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resumen de rendimiento */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Rendimiento</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Ocupación</span>
                      <span>{metrics.metrics.occupancy_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.metrics.occupancy_rate} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Conversión</span>
                      <span>{metrics.metrics.conversion_rate.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.metrics.conversion_rate} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Hora (Últimas 24 horas)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.hourly_sales.map((hour, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">
                        {new Date(hour.hour).toLocaleTimeString('es-CO', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {hour.sales_count} ventas • {hour.tickets_sold} boletos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(hour.revenue)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ventas por Tipo de Boleto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.ticket_type_sales.map((ticket, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">{ticket.ticket_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {ticket.sales_count} ventas • {ticket.tickets_sold} boletos
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(ticket.revenue)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(ticket.price)} por boleto
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics.recent_sales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="font-medium">{sale.buyer_name}</div>
                        <div className="text-sm text-muted-foreground">{sale.buyer_email}</div>
                        <div className="text-xs text-muted-foreground">
                          {sale.ticket_type} • {sale.quantity} boletos
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(sale.amount)}</div>
                      <Badge className={getStatusColor(sale.status)}>
                        {sale.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatDate(sale.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
