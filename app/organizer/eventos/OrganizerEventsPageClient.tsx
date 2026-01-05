"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Event {
  id: string
  title: string
  date: string
  time: string
  venue: string
  status: string
  ticketsSold: number
  totalCapacity: number
  revenue: number
  category: string
  image: string
  description: string
}

export default function OrganizerEventsPageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [events, setEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      // Obtener el usuario actual del localStorage
      const currentUser = localStorage.getItem("current_user")
      if (!currentUser) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        })
        return
      }

      const user = JSON.parse(currentUser)
      const response = await apiClient.getOrganizerEvents(user.id)
      
      if (response.success && response.data) {
        const eventsData = response.data.map((event: any) => ({
          id: event.id.toString(),
          title: event.title,
          date: event.date,
          time: event.time,
          venue: event.venue,
          status: event.status,
          ticketsSold: event.tickets_sold || 0,
          totalCapacity: event.total_capacity,
          revenue: event.revenue || 0,
          category: typeof event.category === 'object' ? event.category.name : event.category || "General",
          image: event.image_url || `https://via.placeholder.com/300x200/cccccc/666666?text=${encodeURIComponent(event.title)}`,
          description: event.description,
        }))
        
        setEvents(eventsData)
        setFilteredEvents(eventsData)
      }
    } catch (error) {
      console.error("Error loading events:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = events

    if (searchTerm) {
      filtered = filtered.filter(
        event =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(event => event.status === statusFilter)
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(event => event.category === categoryFilter)
    }

    setFilteredEvents(filtered)
  }, [events, searchTerm, statusFilter, categoryFilter])

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este evento?")) {
      return
    }

    try {
      const response = await apiClient.deleteOrganizerEvent(eventId)
      if (response.success) {
        toast({
          title: "Evento eliminado",
          description: "El evento se ha eliminado correctamente",
        })
        loadEvents() // Recargar eventos
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting event:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el evento",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Activo
          </Badge>
        )
      case "published":
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Eye className="h-3 w-3 mr-1" />
            Publicado
          </Badge>
        )
      case "draft":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Edit className="h-3 w-3 mr-1" />
            Borrador
          </Badge>
        )
      case "completed":
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completado
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        )
    }
  }

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(events.map((event) => event.category)))
    return categories.sort()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Eventos</h1>
          <p className="text-gray-600">Gestiona todos tus eventos y su rendimiento</p>
        </div>
        <Button onClick={() => router.push("/organizer/eventos/crear")} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Crear Evento
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {getUniqueCategories().map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("")
              setStatusFilter("all")
              setCategoryFilter("all")
            }}>
              <Filter className="h-4 w-4 mr-2" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEvents.map((event) => (
          <Card key={event.id} className="overflow-hidden">
            <div className="aspect-video bg-gray-200 relative">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = `/placeholder.svg`
                }}
              />
              <div className="absolute top-2 right-2">
                {getStatusBadge(event.status)}
              </div>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{event.description}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{event.venue}</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <Users className="h-4 w-4" />
                      <span>Vendidos</span>
                    </div>
                    <p className="font-semibold">{event.ticketsSold}</p>
                    <p className="text-xs text-gray-500">de {event.totalCapacity}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>Ingresos</span>
                    </div>
                    <p className="font-semibold">{formatCurrency(event.revenue)}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600">Categoría</div>
                    <p className="font-semibold text-sm">{typeof event.category === 'object' ? (event.category as any).name : event.category}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/evento/${event.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/organizer/eventos/${event.id}/editar`)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/evento/${event.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/organizer/eventos/${event.id}/editar`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "No se encontraron eventos"
              : "No tienes eventos aún"}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "Intenta ajustar los filtros de búsqueda"
              : "Crea tu primer evento para comenzar"}
          </p>
          <Button onClick={() => router.push("/organizer/eventos/crear")}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Evento
          </Button>
        </div>
      )}
    </div>
  )
}
