"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  DollarSign, 
  Clock, 
  User, 
  Receipt,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  Plus
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Refund {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  amount: number
  status: 'pending' | 'approved' | 'rejected' | 'processed'
  reason: string
  method: string
  createdAt: string
  processedAt?: string
  notes?: string
}

interface RefundForm {
  orderNumber: string
  amount: number
  reason: string
  method: string
  notes: string
}

export function ReembolsosClient() {
  const [refunds, setRefunds] = useState<Refund[]>([])
  const [filteredRefunds, setFilteredRefunds] = useState<Refund[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [refundForm, setRefundForm] = useState<RefundForm>({
    orderNumber: "",
    amount: 0,
    reason: "",
    method: "",
    notes: ""
  })
  const { toast } = useToast()

  // Cargar datos iniciales
  useEffect(() => {
    loadRefunds()
  }, [])

  // Filtrar reembolsos
  useEffect(() => {
    let filtered = refunds

    if (searchTerm) {
      filtered = filtered.filter(refund => 
        refund.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refund.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(refund => refund.status === statusFilter)
    }

    if (dateFrom) {
      filtered = filtered.filter(refund => new Date(refund.createdAt) >= new Date(dateFrom))
    }

    if (dateTo) {
      filtered = filtered.filter(refund => new Date(refund.createdAt) <= new Date(dateTo))
    }

    setFilteredRefunds(filtered)
  }, [refunds, searchTerm, statusFilter, dateFrom, dateTo])

  const loadRefunds = async () => {
    setIsLoading(true)
    try {
      // Simular carga de datos - en producción sería una llamada a la API
      const mockRefunds: Refund[] = [
        {
          id: '1',
          orderNumber: 'ORD-001',
          customerName: 'Juan Pérez',
          customerEmail: 'juan@email.com',
          amount: 150000,
          status: 'pending',
          reason: 'Cancelación del evento',
          method: 'Método original',
          createdAt: '2024-02-15T10:30:00Z',
          notes: 'Cliente solicitó reembolso por cancelación del evento'
        },
        {
          id: '2',
          orderNumber: 'ORD-002',
          customerName: 'María García',
          customerEmail: 'maria@email.com',
          amount: 75000,
          status: 'approved',
          reason: 'Error en la compra',
          method: 'Transferencia',
          createdAt: '2024-02-14T15:45:00Z',
          processedAt: '2024-02-14T16:00:00Z',
          notes: 'Error en el procesamiento del pago'
        }
      ]
      setRefunds(mockRefunds)
    } catch (error) {
      console.error('Error loading refunds:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los reembolsos",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const createRefund = async () => {
    if (!refundForm.orderNumber || !refundForm.amount || !refundForm.reason || !refundForm.method) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const newRefund: Refund = {
        id: (refunds.length + 1).toString(),
        orderNumber: refundForm.orderNumber,
        customerName: 'Cliente', // En producción se obtendría de la orden
        customerEmail: 'cliente@email.com',
        amount: refundForm.amount,
        status: 'pending',
        reason: refundForm.reason,
        method: refundForm.method,
        createdAt: new Date().toISOString(),
        notes: refundForm.notes
      }

      setRefunds([newRefund, ...refunds])
      setRefundForm({
        orderNumber: "",
        amount: 0,
        reason: "",
        method: "",
        notes: ""
      })
      setShowCreateDialog(false)
      
      toast({
        title: "Reembolso Creado",
        description: "La solicitud de reembolso ha sido creada"
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear el reembolso",
        variant: "destructive"
      })
    }
  }

  const processRefund = async (refundId: string, action: 'approve' | 'reject') => {
    try {
      setRefunds(refunds.map(refund => 
        refund.id === refundId 
          ? { 
              ...refund, 
              status: action === 'approve' ? 'approved' : 'rejected',
              processedAt: new Date().toISOString()
            }
          : refund
      ))

      toast({
        title: action === 'approve' ? "Reembolso Aprobado" : "Reembolso Rechazado",
        description: `El reembolso ha sido ${action === 'approve' ? 'aprobado' : 'rechazado'}`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo procesar el reembolso",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pendiente</Badge>
      case 'approved':
        return <Badge variant="default">Aprobado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>
      case 'processed':
        return <Badge variant="outline">Procesado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600'
      case 'approved':
        return 'text-green-600'
      case 'rejected':
        return 'text-red-600'
      case 'processed':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }

  const exportRefunds = () => {
    // Simular exportación
    toast({
      title: "Exportando",
      description: "Los datos se están exportando..."
    })
  }

  const refreshData = () => {
    loadRefunds()
    toast({
      title: "Actualizado",
      description: "Los datos han sido actualizados"
    })
  }

  const todayRefunds = refunds.filter(refund => 
    new Date(refund.createdAt).toDateString() === new Date().toDateString()
  ).reduce((sum, refund) => sum + refund.amount, 0)

  const pendingRefunds = refunds.filter(refund => refund.status === 'pending').length
  const processedRefunds = refunds.filter(refund => refund.status === 'processed').length
  const rejectedRefunds = refunds.filter(refund => refund.status === 'rejected').length

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando reembolsos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Reembolsos</h1>
          <p className="text-gray-600">Gestionar reembolsos y devoluciones</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={exportRefunds}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={refreshData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Métricas de Reembolsos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reembolsos Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todayRefunds.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total procesado
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRefunds}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Procesados</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processedRefunds}</div>
            <p className="text-xs text-muted-foreground">
              Completados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazados</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedRefunds}</div>
            <p className="text-xs text-muted-foreground">
              No aprobados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Búsqueda</CardTitle>
          <CardDescription>Buscar y filtrar reembolsos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Número de orden, cliente..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="status">Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="processed">Procesado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="date-from">Desde</Label>
              <Input 
                type="date" 
                id="date-from" 
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="date-to">Hasta</Label>
              <Input 
                type="date" 
                id="date-to" 
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Reembolsos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Reembolsos Recientes</CardTitle>
              <CardDescription>Últimas solicitudes de reembolso</CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Reembolso
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Procesar Reembolso</DialogTitle>
                  <DialogDescription>Procesar nueva solicitud de reembolso</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="order-number">Número de Orden</Label>
                      <Input 
                        id="order-number" 
                        placeholder="ORD-001"
                        value={refundForm.orderNumber}
                        onChange={(e) => setRefundForm({ ...refundForm, orderNumber: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="refund-amount">Monto a Reembolsar</Label>
                      <Input 
                        id="refund-amount" 
                        type="number" 
                        placeholder="150000"
                        value={refundForm.amount}
                        onChange={(e) => setRefundForm({ ...refundForm, amount: Number(e.target.value) })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="refund-reason">Motivo del Reembolso</Label>
                      <Select value={refundForm.reason} onValueChange={(value) => setRefundForm({ ...refundForm, reason: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar motivo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cancellation">Cancelación del evento</SelectItem>
                          <SelectItem value="duplicate">Compra duplicada</SelectItem>
                          <SelectItem value="error">Error en la compra</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="refund-method">Método de Reembolso</Label>
                      <Select value={refundForm.method} onValueChange={(value) => setRefundForm({ ...refundForm, method: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="original">Método original</SelectItem>
                          <SelectItem value="cash">Efectivo</SelectItem>
                          <SelectItem value="transfer">Transferencia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Textarea 
                      id="notes" 
                      placeholder="Información adicional sobre el reembolso..."
                      value={refundForm.notes}
                      onChange={(e) => setRefundForm({ ...refundForm, notes: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button onClick={createRefund} className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Procesar Reembolso
                    </Button>
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRefunds.map((refund) => (
                <TableRow key={refund.id}>
                  <TableCell className="font-medium">{refund.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{refund.customerName}</p>
                      <p className="text-sm text-gray-500">{refund.customerEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>${refund.amount.toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(refund.status)}</TableCell>
                  <TableCell>{new Date(refund.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedRefund(refund)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setSelectedRefund(refund)
                          setShowDetailsDialog(true)
                        }}
                      >
                        <Receipt className="w-4 h-4" />
                      </Button>
                      {refund.status === 'pending' && (
                        <>
                          <Button 
                            size="sm"
                            onClick={() => processRefund(refund.id, 'approve')}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => processRefund(refund.id, 'reject')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Detalles */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalles del Reembolso</DialogTitle>
            <DialogDescription>
              Información completa del reembolso seleccionado
            </DialogDescription>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Número de Orden</Label>
                  <p className="text-sm">{selectedRefund.orderNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monto</Label>
                  <p className="text-sm font-bold">${selectedRefund.amount.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm">{selectedRefund.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedRefund.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedRefund.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Método</Label>
                  <p className="text-sm">{selectedRefund.method}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Motivo</Label>
                  <p className="text-sm">{selectedRefund.reason}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha de Creación</Label>
                  <p className="text-sm">{new Date(selectedRefund.createdAt).toLocaleString()}</p>
                </div>
              </div>
              {selectedRefund.notes && (
                <div>
                  <Label className="text-sm font-medium">Notas</Label>
                  <p className="text-sm bg-gray-50 p-3 rounded-md">{selectedRefund.notes}</p>
                </div>
              )}
              {selectedRefund.processedAt && (
                <div>
                  <Label className="text-sm font-medium">Fecha de Procesamiento</Label>
                  <p className="text-sm">{new Date(selectedRefund.processedAt).toLocaleString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
