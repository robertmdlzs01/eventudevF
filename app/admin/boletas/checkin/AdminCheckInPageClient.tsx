"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Plus, Search, QrCode, UserCheck, Clock, AlertCircle, CheckCircle, Users, Download, Scan, Smartphone, Camera } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/hooks/use-auth"

interface CheckInRecord {
  id: string
  ticketNumber: string
  eventName: string
  customerName: string
  ticketType: string
  checkInTime: string
  gate: string
  status: "checked-in" | "pending" | "duplicate" | "invalid"
  operator: string
}

interface Event {
  id: number
  title: string
  date: string
}

export default function AdminCheckInPageClient() {
  const { user } = useAuth()
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<CheckInRecord[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)
  const [checkInStats, setCheckInStats] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [gateFilter, setGateFilter] = useState<string>("all")
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false)
  const [qrScannerActive, setQrScannerActive] = useState(false)
  const [manualCheckInData, setManualCheckInData] = useState({
    ticketNumber: "",
    eventId: "",
    gate: "",
    operator: user?.name || "Admin"
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingRecords, setIsLoadingRecords] = useState(false)

  // Cargar eventos disponibles
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await apiClient.getEvents({ status: 'active' })
        if (response.success && response.data) {
          setEvents(response.data.map((e: any) => ({
            id: e.id,
            title: e.title || e.name,
            date: e.date
          })))
        }
      } catch (error) {
        console.error('Error cargando eventos:', error)
      }
    }
    loadEvents()
  }, [])

  // Cargar check-ins cuando se selecciona un evento
  useEffect(() => {
    if (selectedEventId) {
      loadCheckIns(selectedEventId)
      loadStats(selectedEventId)
    } else {
      // Si no hay evento seleccionado, cargar todos los check-ins recientes
      loadRecentCheckIns()
    }
  }, [selectedEventId])

  // Cargar check-ins de un evento
  const loadCheckIns = async (eventId: number) => {
    setIsLoadingRecords(true)
    try {
      const response = await apiClient.getEventCheckIns(eventId, {
        limit: 100,
        offset: 0
      })
      if (response.success && response.data) {
        const transformedRecords: CheckInRecord[] = response.data.map((record: any) => ({
          id: record.id.toString(),
          ticketNumber: record.ticketNumber,
          eventName: record.eventName,
          customerName: record.customerName,
          ticketType: record.ticketType,
          checkInTime: record.checkInTime,
          gate: record.gate,
          status: "checked-in",
          operator: record.operator
        }))
        setCheckInRecords(transformedRecords)
      }
    } catch (error) {
      console.error('Error cargando check-ins:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros de check-in",
        variant: "destructive"
      })
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // Cargar check-ins recientes (de todos los eventos)
  const loadRecentCheckIns = async () => {
    setIsLoadingRecords(true)
    try {
      // Por ahora, cargar del primer evento activo como fallback
      if (events.length > 0) {
        await loadCheckIns(events[0].id)
      }
    } catch (error) {
      console.error('Error cargando check-ins recientes:', error)
    } finally {
      setIsLoadingRecords(false)
    }
  }

  // Cargar estadísticas
  const loadStats = async (eventId: number) => {
    try {
      const response = await apiClient.getEventCheckInStats(eventId)
      if (response.success && response.data) {
        setCheckInStats(response.data)
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Filter records
  useEffect(() => {
    let filtered = checkInRecords

    if (searchTerm) {
      filtered = filtered.filter(
        (record) =>
          record.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          record.eventName.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (eventFilter !== "all") {
      filtered = filtered.filter((record) => record.eventName === eventFilter)
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((record) => record.status === statusFilter)
    }

    if (gateFilter !== "all") {
      filtered = filtered.filter((record) => record.gate === gateFilter)
    }

    setFilteredRecords(filtered)
  }, [checkInRecords, searchTerm, eventFilter, statusFilter, gateFilter])



  const getStatusBadge = (status: string) => {
    const variants = {
      "checked-in": "default",
      pending: "secondary",
      duplicate: "destructive",
      invalid: "outline",
    } as const

    const labels = {
      "checked-in": "Ingresado",
      pending: "Pendiente",
      duplicate: "Duplicado",
      invalid: "Inválido",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "checked-in":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "duplicate":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "invalid":
        return <AlertCircle className="h-4 w-4 text-gray-500" />
      default:
        return null
    }
  }

  // Funciones de check-in
  const handleQRScan = () => {
    setQrScannerActive(!qrScannerActive)
    if (qrScannerActive) {
      toast({
        title: "Escáner detenido",
        description: "El escáner QR ha sido detenido",
      })
    } else {
      toast({
        title: "Escáner iniciado",
        description: "Escanea el código QR del boleto",
      })
    }
  }

  // Manejar escaneo QR (cuando se detecta un código)
  const handleQRCodeScanned = async (qrCode: string) => {
    setIsLoading(true)
    try {
      // Validar ticket primero
      const validateResponse = await apiClient.validateTicket({
        ticketCode: qrCode,
        eventId: selectedEventId || undefined
      })

      if (!validateResponse.success) {
        toast({
          title: "Ticket inválido",
          description: validateResponse.message || "No se pudo validar el ticket",
          variant: "destructive"
        })
        return
      }

      const ticket = validateResponse.data?.ticket
      
      // Registrar check-in
      const checkInResponse = await apiClient.performCheckIn({
        ticketCode: qrCode,
        eventId: ticket.event_id,
        gate: "Principal",
        operator_name: user?.name || "Admin",
        operator_id: user?.id
      })

      if (checkInResponse.success) {
        toast({
          title: "Check-in exitoso",
          description: `Ticket ${ticket.ticket_code} registrado correctamente`,
        })
        // Recargar check-ins
        if (ticket.event_id) {
          await loadCheckIns(ticket.event_id)
          await loadStats(ticket.event_id)
        }
      } else {
        throw new Error(checkInResponse.message || "Error al registrar check-in")
      }
    } catch (error: any) {
      console.error('Error procesando QR:', error)
      toast({
        title: "Error",
        description: error.message || "Error al procesar el código QR",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualCheckIn = async () => {
    if (!manualCheckInData.ticketNumber || !manualCheckInData.eventId || !manualCheckInData.gate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      const eventIdNum = parseInt(manualCheckInData.eventId)
      
      // Validar ticket primero
      const validateResponse = await apiClient.validateTicket({
        ticketCode: manualCheckInData.ticketNumber,
        eventId: eventIdNum
      })

      if (!validateResponse.success) {
        // El código de error puede estar en response.data o response.message
        const errorCode = (validateResponse as any).code || (validateResponse.data as any)?.code
        const errorMessage = validateResponse.message || (validateResponse.data as any)?.message || "No se pudo validar el ticket"
        
        if (errorCode === "TICKET_ALREADY_USED") {
          toast({
            title: "Ticket ya utilizado",
            description: errorMessage,
            variant: "destructive"
          })
        } else {
          toast({
            title: "Ticket inválido",
            description: errorMessage,
            variant: "destructive"
          })
        }
        return
      }

      const ticket = validateResponse.data?.ticket

      // Registrar check-in
      const checkInResponse = await apiClient.performCheckIn({
        ticketCode: manualCheckInData.ticketNumber,
        eventId: eventIdNum,
        gate: manualCheckInData.gate,
        operator_name: manualCheckInData.operator,
        operator_id: user?.id
      })

      if (checkInResponse.success) {
        toast({
          title: "Check-in exitoso",
          description: `Ticket ${ticket.ticket_code} registrado correctamente`,
        })
        
        // Limpiar formulario
        setManualCheckInData({
          ticketNumber: "",
          eventId: "",
          gate: "",
          operator: user?.name || "Admin"
        })
        setIsManualCheckInOpen(false)

        // Recargar check-ins y estadísticas
        await loadCheckIns(eventIdNum)
        await loadStats(eventIdNum)
      } else {
        throw new Error(checkInResponse.message || "Error al registrar check-in")
      }
    } catch (error: any) {
      console.error('Error en check-in manual:', error)
      toast({
        title: "Error",
        description: error.message || "Error al registrar el check-in",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const exportCheckInRecords = () => {
    try {
      const csvContent = [
        "Estado,Boleta,Cliente,Evento,Tipo,Hora Check-in,Puerta,Operador",
        ...filteredRecords.map(record => 
          `${record.status},${record.ticketNumber},${record.customerName},${record.eventName},${record.ticketType},${record.checkInTime},${record.gate},${record.operator}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `check-in-records-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "Registros exportados correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar los registros",
        variant: "destructive"
      })
    }
  }

  const uniqueEvents = [...new Set(checkInRecords.map((record) => record.eventName))]
  const uniqueGates = [...new Set(checkInRecords.map((record) => record.gate))]

  // Seleccionar evento
  const handleEventSelect = (eventId: string) => {
    if (eventId === "all") {
      setSelectedEventId(null)
      setEventFilter("all")
    } else {
      const eventIdNum = parseInt(eventId)
      setSelectedEventId(eventIdNum)
      setEventFilter(events.find(e => e.id === eventIdNum)?.title || "all")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Check-in</h1>
          <p className="text-gray-600">Control centralizado de acceso para todos los eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant={qrScannerActive ? "destructive" : "outline"} onClick={handleQRScan}>
            <QrCode className="h-4 w-4 mr-2" />
            {qrScannerActive ? "Detener Escáner" : "Escáner QR"}
          </Button>
          <Button variant="outline" onClick={exportCheckInRecords}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Registros
          </Button>
          <Dialog open={isManualCheckInOpen} onOpenChange={setIsManualCheckInOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Check-in Manual
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Check-in Manual</DialogTitle>
                <DialogDescription>Registra manualmente el ingreso de un asistente</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="ticketNumber">Número de Boleta</Label>
                  <Input 
                    id="ticketNumber" 
                    placeholder="VT-2024-001"
                    value={manualCheckInData.ticketNumber}
                    onChange={(e) => setManualCheckInData(prev => ({ ...prev, ticketNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event">Evento *</Label>
                  <Select value={manualCheckInData.eventId} onValueChange={(value) => setManualCheckInData(prev => ({ ...prev, eventId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {events.map((event) => (
                        <SelectItem key={event.id} value={event.id.toString()}>
                          {event.title} - {new Date(event.date).toLocaleDateString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gate">Puerta de Acceso</Label>
                  <Select value={manualCheckInData.gate} onValueChange={(value) => setManualCheckInData(prev => ({ ...prev, gate: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar puerta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Puerta A">Puerta A</SelectItem>
                      <SelectItem value="Puerta B">Puerta B</SelectItem>
                      <SelectItem value="Puerta VIP">Puerta VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsManualCheckInOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleManualCheckIn} disabled={isLoading}>
                  {isLoading ? "Registrando..." : "Registrar Check-in"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* QR Scanner Active Indicator */}
      {qrScannerActive && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <QrCode className="h-6 w-6 text-blue-600 animate-pulse" />
                <div>
                  <h3 className="font-semibold text-blue-900">Escáner QR Activo</h3>
                  <p className="text-sm text-blue-700">
                    Ingresa manualmente el código del ticket o escanea el QR
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Ingresa código de ticket o QR"
                  className="w-64"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleQRCodeScanned(e.currentTarget.value)
                      e.currentTarget.value = ''
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrScannerActive(false)}
                >
                  Detener
                </Button>
              </div>
            </div>
            <div className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed border-blue-300 text-center">
              <Camera className="h-12 w-12 mx-auto text-blue-500 mb-2" />
              <p className="text-sm text-gray-600">
                Nota: Para escaneo con cámara, se requiere implementación adicional con biblioteca de escáner QR
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Evento</CardTitle>
          <CardDescription>Elige el evento para ver sus check-ins</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId?.toString() || "all"} onValueChange={handleEventSelect}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Todos los eventos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los eventos</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id.toString()}>
                  {event.title} - {new Date(event.date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkInStats?.total_checked_in || checkInRecords.length}
            </div>
            {checkInStats && (
              <p className="text-xs text-muted-foreground mt-1">
                de {checkInStats.total_tickets_sold} boletos vendidos
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {checkInRecords.filter((r) => r.status === "checked-in").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {checkInStats?.total_pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Check-in</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {checkInStats?.check_in_rate || 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar registros..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={eventFilter} onValueChange={setEventFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los eventos</SelectItem>
                {uniqueEvents.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="checked-in">Ingresado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="duplicate">Duplicado</SelectItem>
                <SelectItem value="invalid">Inválido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gateFilter} onValueChange={setGateFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Puerta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {uniqueGates.map((gate) => (
                  <SelectItem key={gate} value={gate}>
                    {gate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Check-in Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Registros de Check-in</CardTitle>
          <CardDescription>Historial de todos los ingresos registrados</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Estado</TableHead>
                <TableHead>Boleta</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Hora Check-in</TableHead>
                <TableHead>Puerta</TableHead>
                <TableHead>Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(record.status)}
                      {getStatusBadge(record.status)}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{record.ticketNumber}</TableCell>
                  <TableCell>{record.customerName}</TableCell>
                  <TableCell>{record.eventName}</TableCell>
                  <TableCell>{record.ticketType}</TableCell>
                  <TableCell>{new Date(record.checkInTime).toLocaleString()}</TableCell>
                  <TableCell>{record.gate}</TableCell>
                  <TableCell>{record.operator}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
