"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Trash2, QrCode, Download, Send, Eye, RefreshCw, DollarSign, Users, Calendar } from "lucide-react"
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
import { toast } from "@/hooks/use-toast"
import { getSales, getSaleDetails, cancelSale, getSalesStats } from "@/app/admin/actions"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface VirtualTicket {
  id: string
  ticketNumber: string
  eventName: string
  customerName: string
  customerEmail: string
  ticketType: string
  price: number
  quantity: number
  totalAmount: number
  status: "completed" | "cancelled" | "pending"
  purchaseDate: string
  eventDate: string
  paymentMethod: string
}

export default function AdminVirtualTicketsPageClient() {
  const [tickets, setTickets] = useState<VirtualTicket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<VirtualTicket[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [selectedTicket, setSelectedTicket] = useState<VirtualTicket | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)

  // Filter tickets
  useEffect(() => {
    let filtered = tickets

    if (searchTerm) {
      filtered = filtered.filter(
        (ticket) =>
          ticket.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.ticketType.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((ticket) => ticket.status === statusFilter)
    }

    setFilteredTickets(filtered)
  }, [tickets, searchTerm, statusFilter])

  // Load data on component mount
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [salesData, statsData] = await Promise.all([
        getSales(),
        getSalesStats()
      ])
      
      if (salesData) {
        // Mapear AdminSale a VirtualTicket
        const virtualTickets: VirtualTicket[] = salesData.map(sale => ({
          id: sale.id,
          ticketNumber: sale.ticketNumber,
          eventName: sale.eventName,
          customerName: sale.customerName,
          customerEmail: sale.customerEmail,
          ticketType: sale.ticketType,
          price: sale.unitPrice,
          quantity: sale.quantity,
          totalAmount: sale.totalAmount,
          status: sale.status as "completed" | "cancelled" | "pending",
          purchaseDate: sale.purchaseDate,
          eventDate: sale.eventDate,
          paymentMethod: sale.paymentMethod,
        }))
        setTickets(virtualTickets)
        setFilteredTickets(virtualTickets)
      }

      if (statsData) {
        setStats(statsData)
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

  const handleViewDetails = async (ticket: VirtualTicket) => {
    try {
      const details = await getSaleDetails(ticket.id)
      if (details) {
        setSelectedTicket({ ...ticket, ...details })
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error('Error loading ticket details:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los detalles.",
        variant: "destructive",
      })
    }
  }

  const handleCancelTicket = async (id: string) => {
    try {
      const success = await cancelSale(id, "Cancelado por administrador")
      if (success) {
        toast({
          title: "Venta cancelada",
          description: "La venta ha sido cancelada exitosamente.",
        })
        loadData() // Reload data
      } else {
        toast({
          title: "Error",
          description: "No se pudo cancelar la venta.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error cancelling sale:', error)
      toast({
        title: "Error",
        description: "Error al cancelar la venta.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      cancelled: "destructive",
    } as const

    const labels = {
      completed: "Completada",
      pending: "Pendiente",
      cancelled: "Cancelada",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch {
      return dateString
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Boletas Virtuales
        </h1>
        <Button onClick={loadData} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Actualizar
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats?.total_sales || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ventas totales registradas
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.stats?.total_revenue || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ingresos generados
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Venta Promedio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.stats?.average_sale || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Promedio por venta
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Completadas</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats?.completed_sales || 0}</div>
              <p className="text-xs text-muted-foreground">
                Ventas exitosas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por evento, cliente o tipo de boleto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="pending">Pendientes</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Boletas Virtuales</CardTitle>
          <CardDescription>
            Gestión de boletas virtuales generadas automáticamente al realizar compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Cargando boletas virtuales...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" 
                  ? "No se encontraron boletas con los filtros aplicados." 
                  : "No hay boletas virtuales registradas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha Compra</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.eventName}</div>
                          <div className="text-sm text-gray-500">{formatDate(ticket.eventDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ticket.customerName}</div>
                          <div className="text-sm text-gray-500">{ticket.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>{ticket.ticketType}</TableCell>
                      <TableCell>{ticket.quantity}</TableCell>
                      <TableCell className="font-medium text-green-600">
                        {formatCurrency(ticket.totalAmount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>{formatDate(ticket.purchaseDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(ticket)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {ticket.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelTicket(ticket.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Venta</DialogTitle>
            <DialogDescription>
              Información completa de la venta y boletas generadas
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Número de Venta</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.ticketNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedTicket.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Evento</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.eventName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha del Evento</Label>
                  <p className="text-sm text-gray-600">{formatDate(selectedTicket.eventDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tipo de Boleto</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.ticketType}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cantidad</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Precio Unitario</Label>
                  <p className="text-sm text-gray-600">{formatCurrency(selectedTicket.price)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total</Label>
                  <p className="text-sm font-medium text-green-600">{formatCurrency(selectedTicket.totalAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Método de Pago</Label>
                  <p className="text-sm text-gray-600">{selectedTicket.paymentMethod}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha de Compra</Label>
                  <p className="text-sm text-gray-600">{formatDate(selectedTicket.purchaseDate)}</p>
                </div>
              </div>

              {/* Tickets List - Comentado temporalmente hasta definir estructura correcta */}
              {/* selectedTicket.tickets && selectedTicket.tickets.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Boletas Generadas</Label>
                  <div className="mt-2 space-y-2">
                    {selectedTicket.tickets.map((ticket: any, index: number) => (
                      <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">Boleto #{index + 1}</div>
                          <div className="text-sm text-gray-500">Código: {ticket.ticket_code}</div>
                        </div>
                        <Badge variant={ticket.status === 'valid' ? 'default' : 'destructive'}>
                          {ticket.status === 'valid' ? 'Válido' : 'Cancelado'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ) */}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
