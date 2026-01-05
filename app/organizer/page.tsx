"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Badge } from "../../components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs"
import { 
  Calendar, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Plus,
  Eye,
  Edit,
  BarChart3,
  RefreshCw,
  AlertCircle
} from "lucide-react"
import { apiClient } from "../../lib/api-client"
import { EventMetricsDashboard } from "../../components/organizer/event-metrics-dashboard"
import { PromoterDashboard } from "../../components/organizer/promoter-dashboard"
import Link from "next/link"

interface OrganizerEvent {
  id: number
  title: string
  description: string
  date: string
  time: string
  venue: string
  location: string
  status: string
  total_capacity: number
  price: number
  created_at: string
  updated_at: string
  metrics?: {
    total_sales: number
    total_tickets_sold: number
    total_revenue: number
    occupancy_rate: number
  }
}

interface OrganizerStats {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  totalSales: number
  totalRevenue: number
  totalTicketsSold: number
  uniqueCustomers: number
  averageOrderValue: number
  todaySales: number
  todayRevenue: number
  totalAttendees: number
  alerts: number
  eventsThisWeek: number
}

export default function OrganizerDashboard() {
  const [events, setEvents] = useState<OrganizerEvent[]>([])
  const [stats, setStats] = useState<OrganizerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const fetchOrganizerData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Obtener información del usuario actual
      const userResponse = await apiClient.getCurrentUser()
      if (userResponse.success) {
        setCurrentUser(userResponse.data)
      }
      
      // Obtener estadísticas del organizador usando el endpoint sin ID
      const statsResponse = await apiClient.getOrganizerDashboard()
      if (statsResponse.success) {
        setStats(statsResponse.data.stats)
      } else {
        setError(statsResponse.message || "Error al cargar estadísticas")
      }

      // Obtener eventos del organizador usando el endpoint sin ID
      const eventsResponse = await apiClient.getOrganizerEvents()
      if (eventsResponse.success) {
        setEvents(eventsResponse.data || [])
      } else {
        setError(eventsResponse.message || "Error al cargar eventos")
      }
    } catch (err) {
      setError("Error de conexión con el servidor")
      console.error("Error fetching organizer data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizerData()
  }, [])

  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return '$0'
    }
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800'
      case 'draft': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'published': return 'Publicado'
      case 'draft': return 'Borrador'
      case 'cancelled': return 'Cancelado'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Cargando panel de organizador...</span>
        </div>
      </div>
    )
  }

  // Si es un promotor, mostrar el dashboard visual
  if (currentUser && currentUser.first_name === "Promotor") {
    return <PromoterDashboard />
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span>Error: {error}</span>
          </div>
          <Button onClick={fetchOrganizerData} variant="outline" className="mt-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Organizador</h1>
          <p className="text-muted-foreground">
            Gestiona tus eventos y monitorea el rendimiento en tiempo real
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={fetchOrganizerData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          {/* Solo mostrar el botón "Crear Evento" si no es un promotor */}
          {currentUser && currentUser.first_name !== "Promotor" && (
            <Button asChild>
              <Link href="/organizer/eventos/crear">
                <Plus className="h-4 w-4 mr-2" />
                Crear Evento
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Estadísticas generales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalEvents || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.publishedEvents || 0} publicados • {stats.draftEvents || 0} borradores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales || 0}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalRevenue)} en ingresos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Boletos Vendidos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTicketsSold || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.uniqueCustomers || 0} clientes únicos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Promedio por Venta</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue)}</div>
              <p className="text-xs text-muted-foreground">
                Valor promedio por transacción
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista de eventos y métricas */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Mis Eventos</TabsTrigger>
          {selectedEvent && <TabsTrigger value="metrics">Métricas del Evento</TabsTrigger>}
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {events.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium">No tienes eventos aún</h3>
                    <p className="text-muted-foreground">
                      Crea tu primer evento para comenzar a vender boletos
                    </p>
                  </div>
                  <Button asChild>
                    <Link href="/organizer/eventos/crear">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Primer Evento
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{event.title}</CardTitle>
                        <CardDescription>
                          {formatDate(event.date)} • {event.time} • {event.venue}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(event.status)}>
                        {getStatusText(event.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description}
                    </p>
                    
                    {/* Métricas rápidas del evento */}
                    {event.metrics && (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold">{event.metrics.total_sales}</div>
                          <div className="text-xs text-muted-foreground">Ventas</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{event.metrics.total_tickets_sold}</div>
                          <div className="text-xs text-muted-foreground">Boletos</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{formatCurrency(event.metrics.total_revenue)}</div>
                          <div className="text-xs text-muted-foreground">Ingresos</div>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4">
                      <div className="text-sm text-muted-foreground">
                        Capacidad: {event.total_capacity} • Precio: {formatCurrency(event.price)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedEvent(event.id)}
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Métricas
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/organizer/eventos/${event.id}/editar`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/evento/${event.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {selectedEvent && (
          <TabsContent value="metrics" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Métricas en Tiempo Real</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
              >
                Volver a Eventos
              </Button>
            </div>
            <EventMetricsDashboard eventId={selectedEvent} refreshInterval={30000} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
