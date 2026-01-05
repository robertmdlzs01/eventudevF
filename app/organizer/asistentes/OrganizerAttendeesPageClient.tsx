"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  UserCheck,
  MessageSquare,
} from "lucide-react"

interface Attendee {
  id: string
  name: string
  email: string
  phone: string
  ticketNumber: string
  ticketType: string
  event: string
  purchaseDate: string
  checkInStatus: string
  checkInTime?: string
  paymentStatus: string
  preferences?: {
    dietary: string
    accessibility: string
  }
}

interface CommunicationRecord {
  id: string
  type: string
  subject: string
  message: string
  recipients: number
  sentAt: string
  status: string
  openRate?: number
  clickRate?: number
}

export default function OrganizerAttendeesPageClient() {
  const { toast } = useToast()
  const [attendees, setAttendees] = useState<Attendee[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<Attendee[]>([])
  const [communications, setCommunications] = useState<CommunicationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")

  useEffect(() => {
    loadAttendees()
  }, [])

  const loadAttendees = async () => {
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
      const response = await apiClient.getUserTickets(user.id)
      
      if (response.success && response.data) {
        const attendeesData = response.data.map((ticket: any) => ({
          id: ticket.id.toString(),
          name: ticket.customer_name || "Cliente",
          email: ticket.customer_email || "cliente@example.com",
          phone: ticket.customer_phone || "+57 300 000 0000",
          ticketNumber: ticket.ticket_code || `TK-${ticket.id}`,
          ticketType: ticket.ticket_type_name || "General",
          event: ticket.event_title || "Evento",
          purchaseDate: ticket.purchase_date || new Date().toISOString(),
          checkInStatus: ticket.check_in_status || "pending",
          checkInTime: ticket.check_in_time,
          paymentStatus: ticket.payment_status || "completed",
          preferences: {
            dietary: ticket.dietary_preferences || "Ninguna",
            accessibility: ticket.accessibility_needs || "Ninguna",
          },
        }))
        
        setAttendees(attendeesData)
        setFilteredAttendees(attendeesData)
      }
    } catch (error) {
      console.error("Error loading attendees:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los asistentes",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let filtered = attendees

    if (searchTerm) {
      filtered = filtered.filter(
        attendee =>
          attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          attendee.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(attendee => attendee.checkInStatus === statusFilter)
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter(attendee => attendee.event === eventFilter)
    }

    setFilteredAttendees(filtered)
  }, [attendees, searchTerm, statusFilter, eventFilter])

  const exportAttendees = () => {
    const csvContent = [
      ["ID", "Nombre", "Email", "Teléfono", "Número de Ticket", "Tipo", "Evento", "Estado Check-in", "Fecha Compra"],
      ...filteredAttendees.map(attendee => [
        attendee.id,
        attendee.name,
        attendee.email,
        attendee.phone,
        attendee.ticketNumber,
        attendee.ticketType,
        attendee.event,
        attendee.checkInStatus,
        new Date(attendee.purchaseDate).toLocaleDateString(),
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `asistentes_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Exportado",
      description: "Los asistentes se han exportado correctamente",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "checked-in":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "no-show":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "checked-in":
        return "Registrado"
      case "pending":
        return "Pendiente"
      case "no-show":
        return "No asistió"
      default:
        return status
    }
  }

  const getUniqueEvents = () => {
    const events = Array.from(new Set(attendees.map((attendee) => attendee.event)))
    return events.sort()
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
          <h1 className="text-3xl font-bold text-gray-900">Asistentes</h1>
          <p className="text-gray-600">Gestiona y comunícate con los asistentes a tus eventos</p>
        </div>
        <Button onClick={exportAttendees} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Asistentes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendees.length}</div>
            <p className="text-xs text-gray-600">
              Registrados en todos los eventos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registrados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendees.filter(a => a.checkInStatus === "checked-in").length}
            </div>
            <p className="text-xs text-gray-600">
              Ya han ingresado al evento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendees.filter(a => a.checkInStatus === "pending").length}
            </div>
            <p className="text-xs text-gray-600">
              Aún no han llegado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Asistieron</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendees.filter(a => a.checkInStatus === "no-show").length}
            </div>
            <p className="text-xs text-gray-600">
              No se presentaron
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar asistentes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de registro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="checked-in">Registrado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="no-show">No asistió</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {getUniqueEvents().map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Attendees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Asistentes</CardTitle>
          <CardDescription>
            {filteredAttendees.length} asistentes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asistente</TableHead>
                <TableHead>Ticket</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Compra</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttendees.map((attendee) => (
                <TableRow key={attendee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{attendee.name}</div>
                      <div className="text-sm text-gray-500">{attendee.email}</div>
                      <div className="text-sm text-gray-500">{attendee.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">{attendee.ticketNumber}</div>
                  </TableCell>
                  <TableCell>{attendee.event}</TableCell>
                  <TableCell>{attendee.ticketType}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(attendee.checkInStatus)}>
                      {getStatusText(attendee.checkInStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(attendee.purchaseDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAttendees.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron asistentes con los filtros seleccionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
