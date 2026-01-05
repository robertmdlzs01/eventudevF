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

const mockCheckInRecords: CheckInRecord[] = [
  {
    id: "1",
    ticketNumber: "VT-2024-001",
    eventName: "Concierto de Rock Nacional",
    customerName: "Juan Pérez",
    ticketType: "General",
    checkInTime: "2024-02-15T19:15:00",
    gate: "Puerta A",
    status: "checked-in",
    operator: "María González",
  },
  {
    id: "2",
    ticketNumber: "PT-2024-002",
    eventName: "Festival de Jazz",
    customerName: "Ana Martínez",
    ticketType: "VIP",
    checkInTime: "2024-01-20T18:30:00",
    gate: "Puerta VIP",
    status: "checked-in",
    operator: "Carlos López",
  },
  {
    id: "3",
    ticketNumber: "VT-2024-003",
    eventName: "Obra de Teatro Clásico",
    customerName: "Pedro Rodríguez",
    ticketType: "Palco",
    checkInTime: "2024-02-10T20:00:00",
    gate: "Puerta B",
    status: "duplicate",
    operator: "Laura Sánchez",
  },
]

export default function AdminCheckInPageClient() {
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>(mockCheckInRecords)
  const [filteredRecords, setFilteredRecords] = useState<CheckInRecord[]>(mockCheckInRecords)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [gateFilter, setGateFilter] = useState<string>("all")
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false)
  const [qrScannerActive, setQrScannerActive] = useState(false)
  const [manualCheckInData, setManualCheckInData] = useState({
    ticketNumber: "",
    event: "",
    gate: "",
    operator: "Admin"
  })
  const [isLoading, setIsLoading] = useState(false)

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

  const handleManualCheckIn = async () => {
    if (!manualCheckInData.ticketNumber || !manualCheckInData.event || !manualCheckInData.gate) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simular validación de boleto
      const existingRecord = checkInRecords.find(
        record => record.ticketNumber === manualCheckInData.ticketNumber
      )

      if (existingRecord) {
        toast({
          title: "Boleto ya registrado",
          description: "Este boleto ya fue registrado anteriormente",
          variant: "destructive"
        })
        return
      }

      // Crear nuevo registro de check-in
      const newRecord: CheckInRecord = {
        id: Date.now().toString(),
        ticketNumber: manualCheckInData.ticketNumber,
        eventName: manualCheckInData.event,
        customerName: "Cliente Verificado", // En producción vendría de la base de datos
        ticketType: "General",
        checkInTime: new Date().toISOString(),
        gate: manualCheckInData.gate,
        status: "checked-in",
        operator: manualCheckInData.operator,
      }

      setCheckInRecords(prev => [newRecord, ...prev])
      setManualCheckInData({ ticketNumber: "", event: "", gate: "", operator: "Admin" })
      setIsManualCheckInOpen(false)

      toast({
        title: "Check-in exitoso",
        description: `Boleto ${manualCheckInData.ticketNumber} registrado correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al registrar el check-in",
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
                  <Label htmlFor="event">Evento</Label>
                  <Select value={manualCheckInData.event} onValueChange={(value) => setManualCheckInData(prev => ({ ...prev, event: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar evento" />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueEvents.map((event) => (
                        <SelectItem key={event} value={event}>
                          {event}
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
            <div className="flex items-center gap-3">
              <QrCode className="h-6 w-6 text-blue-600 animate-pulse" />
              <div>
                <h3 className="font-semibold text-blue-900">Escáner QR Activo</h3>
                <p className="text-sm text-blue-700">
                  Escanea el código QR de la boleta para realizar el check-in automático
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Check-ins</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInRecords.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInRecords.filter((r) => r.status === "checked-in").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duplicados</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{checkInRecords.filter((r) => r.status === "duplicate").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueEvents.length}</div>
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
