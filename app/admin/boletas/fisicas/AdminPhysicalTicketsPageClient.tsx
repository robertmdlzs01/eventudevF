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
import { Textarea } from "@/components/ui/textarea"
import { Plus, Search, Edit, Trash2, Printer, MapPin, Package, Eye, Download } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { getPhysicalTickets, createPhysicalTicketBatch, updatePhysicalTicketStatus, getSalesPoints, exportData } from "@/app/admin/actions"
import { TicketPrintDialog } from "@/components/admin/ticket-print-dialog"
import type { TicketData } from "@/lib/ticket-templates"

interface PhysicalTicket {
  id: string
  batchNumber: string
  eventName: string
  ticketType: string
  quantity: number
  printed: number
  sold: number
  remaining: number
  price: number
  salesPoint: string
  status: "pending" | "printed" | "distributed" | "completed"
  createdDate: string
  printedDate?: string
  distributedDate?: string
}

// Función para obtener boletas físicas reales de la base de datos
const fetchRealPhysicalTickets = async (): Promise<PhysicalTicket[]> => {
  try {
    const response = await fetch('/api/admin/physical-tickets', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Error al obtener boletas físicas');
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data.map((ticket: any) => ({
        id: ticket.id.toString(),
        batchNumber: ticket.batch_number,
        eventName: ticket.event_name,
        ticketType: ticket.ticket_type,
        quantity: ticket.quantity,
        printed: ticket.printed,
        sold: ticket.sold,
        remaining: ticket.remaining,
        price: ticket.price,
        salesPoint: ticket.sales_point,
        status: ticket.status,
        createdDate: ticket.created_date,
        printedDate: ticket.printed_date,
        distributedDate: ticket.distributed_date,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error obteniendo boletas físicas reales:', error);
    return [];
  }
};

const mockPhysicalTickets: PhysicalTicket[] = [
  {
    id: "1",
    batchNumber: "PT-2024-001",
    eventName: "Concierto de Rock Nacional",
    ticketType: "General",
    quantity: 500,
    printed: 500,
    sold: 350,
    remaining: 150,
    price: 25000,
    salesPoint: "Punto de Venta Centro",
    status: "distributed",
    createdDate: "2024-01-10",
    printedDate: "2024-01-12",
    distributedDate: "2024-01-15",
  },
  {
    id: "2",
    batchNumber: "PT-2024-002",
    eventName: "Festival de Jazz",
    ticketType: "VIP",
    quantity: 100,
    printed: 100,
    sold: 85,
    remaining: 15,
    price: 45000,
    salesPoint: "Punto de Venta Norte",
    status: "completed",
    createdDate: "2024-01-08",
    printedDate: "2024-01-10",
    distributedDate: "2024-01-12",
  },
  {
    id: "3",
    batchNumber: "PT-2024-003",
    eventName: "Obra de Teatro Clásico",
    ticketType: "Palco",
    quantity: 200,
    printed: 200,
    sold: 0,
    remaining: 200,
    price: 35000,
    salesPoint: "Punto de Venta Sur",
    status: "printed",
    createdDate: "2024-01-15",
    printedDate: "2024-01-18",
  },
]

export default function AdminPhysicalTicketsPageClient() {
  const [tickets, setTickets] = useState<PhysicalTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<PhysicalTicket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [salesPointFilter, setSalesPointFilter] = useState<string>("all")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [salesPoints, setSalesPoints] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [selectedTicketForPrint, setSelectedTicketForPrint] = useState<PhysicalTicket | null>(null)
  const [formData, setFormData] = useState({
    event_id: '',
    ticket_type_id: '',
    quantity: '',
    price: '',
    sales_point: '',
    notes: ''
  })

  // Filter tickets
  useEffect(() => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.salesPoint.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }

    if (salesPointFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.salesPoint === salesPointFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, searchTerm, statusFilter, salesPointFilter])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [ticketsData, salesPointsData] = await Promise.all([
        getPhysicalTickets(),
        getSalesPoints()
      ])
      
      if (ticketsData?.physicalTickets) {
        setTickets(ticketsData.physicalTickets)
        setFilteredTickets(ticketsData.physicalTickets)
      }
      
      if (salesPointsData) {
        setSalesPoints(salesPointsData)
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBatch = async () => {
    try {
      // Validate form data
      if (!formData.event_id || !formData.ticket_type_id || !formData.quantity || !formData.price || !formData.sales_point) {
        toast({
          title: "Error",
          description: "Todos los campos son requeridos.",
          variant: "destructive",
        })
        return
      }

      const success = await createPhysicalTicketBatch({
        event_id: parseInt(formData.event_id),
        ticket_type_id: parseInt(formData.ticket_type_id),
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        sales_point: formData.sales_point,
        notes: formData.notes
      })

      if (success) {
        toast({
          title: "Lote creado",
          description: "El nuevo lote de boletas físicas ha sido creado exitosamente.",
        })
        setIsCreateDialogOpen(false)
        setFormData({
          event_id: '',
          ticket_type_id: '',
          quantity: '',
          price: '',
          sales_point: '',
          notes: ''
        })
        loadData() // Reload data
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el lote.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error creating batch:', error)
      toast({
        title: "Error",
        description: "Error al crear el lote.",
        variant: "destructive",
      })
    }
  }

  const handlePrintBatch = (ticket: PhysicalTicket) => {
    setSelectedTicketForPrint(ticket)
  }

  const convertToTicketData = (ticket: PhysicalTicket): TicketData => {
    // Buscar el evento correspondiente
    const event = events.find(e => e.title === ticket.eventName)
    
    return {
      eventName: ticket.eventName,
      eventDate: event?.date || new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      eventTime: event?.time || '20:00',
      eventLocation: event?.location || ticket.salesPoint,
      ticketNumber: ticket.batchNumber,
      ticketId: ticket.id,
      ticketType: ticket.ticketType,
      price: ticket.price,
      customerName: 'Cliente General', // Para boletos físicos sin cliente específico
      customerEmail: '',
      qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${ticket.batchNumber}`,
      purchaseDate: ticket.createdDate,
      purchaseId: ticket.id,
    }
  }

  const handleDistributeBatch = async (ticket: PhysicalTicket) => {
    try {
      const success = await updatePhysicalTicketStatus(ticket.id, 'distributed')
      if (success) {
        toast({
          title: "Lote distribuido",
          description: "El lote de boletas ha sido distribuido al punto de venta.",
        })
        loadData() // Reload data
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del lote.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error distributing batch:', error)
      toast({
        title: "Error",
        description: "Error al distribuir el lote.",
        variant: "destructive",
      })
    }
  }

  const handleExport = async () => {
    try {
      const exportResult = await exportData({
        type: 'physical_tickets',
        format: 'json'
      })
      
      if (exportResult) {
        // Create and download file
        const dataStr = JSON.stringify(exportResult.data, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(dataBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = exportResult.filename || 'boletas_fisicas.json'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast({
          title: "Exportado",
          description: "Los datos han sido exportados exitosamente.",
        })
      }
    } catch (error) {
      console.error('Error exporting data:', error)
      toast({
        title: "Error",
        description: "Error al exportar los datos.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: "secondary",
      printed: "default",
      distributed: "outline",
      completed: "destructive",
    } as const

    const labels = {
      pending: "Pendiente",
      printed: "Impreso",
      distributed: "Distribuido",
      completed: "Completado",
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const uniqueSalesPoints = [...new Set(tickets.map((ticket) => ticket.salesPoint))]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Boletas Físicas</h1>
          <p className="text-gray-600">Gestiona la impresión y distribución de boletas físicas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Crear Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Lote de Boletas Físicas</DialogTitle>
                <DialogDescription>Crea un nuevo lote de boletas físicas para un evento específico</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event">Evento</Label>
                    <Select onValueChange={(value) => setFormData({...formData, event_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {events.map((event) => (
                          <SelectItem key={event.id} value={event.id.toString()}>
                            {event.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ticketType">Tipo de Boleta</Label>
                    <Select onValueChange={(value) => setFormData({...formData, ticket_type_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Cantidad</Label>
                    <Input 
                      id="quantity" 
                      type="number" 
                      placeholder="500" 
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Precio</Label>
                    <Input 
                      id="price" 
                      type="number" 
                      placeholder="25000" 
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="salesPoint">Punto de Venta</Label>
                    <Select onValueChange={(value) => setFormData({...formData, sales_point: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar punto" />
                      </SelectTrigger>
                      <SelectContent>
                        {salesPoints.map((point) => (
                          <SelectItem key={point.id} value={point.name}>
                            {point.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Notas adicionales sobre el lote..." 
                    value={formData.notes}
                    onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateBatch}>Crear Lote</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {loading ? (
          <div className="col-span-4 text-center py-8">Cargando datos...</div>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Lotes</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boletas Impresas</CardTitle>
                <Printer className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.reduce((acc, ticket) => acc + ticket.printed, 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boletas Vendidas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tickets.reduce((acc, ticket) => acc + ticket.sold, 0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Físicas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${tickets.reduce((acc, ticket) => acc + ticket.sold * ticket.price, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </>
        )}
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
                  placeholder="Buscar lotes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="printed">Impreso</SelectItem>
                <SelectItem value="distributed">Distribuido</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={salesPointFilter} onValueChange={setSalesPointFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Punto de Venta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los puntos</SelectItem>
                {uniqueSalesPoints.map((point) => (
                  <SelectItem key={point} value={point}>
                    {point}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Physical Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lotes de Boletas Físicas</CardTitle>
          <CardDescription>Lista de todos los lotes de boletas físicas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lote</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Vendidas</TableHead>
                <TableHead>Restantes</TableHead>
                <TableHead>Punto de Venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium">{ticket.batchNumber}</TableCell>
                  <TableCell>{ticket.eventName}</TableCell>
                  <TableCell>{ticket.ticketType}</TableCell>
                  <TableCell>{ticket.quantity}</TableCell>
                  <TableCell>{ticket.sold}</TableCell>
                  <TableCell>{ticket.remaining}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {ticket.salesPoint}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      {ticket.status === "pending" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handlePrintBatch(ticket)}
                          title="Imprimir boleto con plantilla"
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                      )}
                      {ticket.status === "printed" && (
                        <Button variant="ghost" size="sm" onClick={() => handleDistributeBatch(ticket)}>
                          <Package className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Diálogo de Impresión con Plantillas */}
      {selectedTicketForPrint && (
        <TicketPrintDialog
          ticketData={convertToTicketData(selectedTicketForPrint)}
          open={!!selectedTicketForPrint}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedTicketForPrint(null)
            }
          }}
        />
      )}
    </div>
  )
}
