"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, CreditCard, DollarSign, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface Payment {
  id: string
  transactionId: string
  amount: number
  status: 'pending' | 'completed' | 'failed' | 'refunded'
  paymentMethod: string
  customerName: string
  customerEmail: string
  eventTitle: string
  createdAt: string
  processedAt?: string
  quantity?: number
}

export default function AdminPagosClient() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false)
  const [paymentStats, setPaymentStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    failed: 0,
    refunded: 0,
    totalRevenue: 0,
    pendingAmount: 0
  })
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // Cargar pagos del backend
  useEffect(() => {
    loadPayments()
  }, [page, statusFilter, methodFilter, searchTerm])

  // Filtrar pagos localmente (además del filtrado del backend)
  useEffect(() => {
    let filtered = payments

    // El backend ya filtra por status y method, pero podemos aplicar filtros adicionales si es necesario
    setFilteredPayments(filtered)
  }, [payments])

  const loadPayments = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getAllPayments({
        page,
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        payment_method: methodFilter !== "all" ? methodFilter : undefined,
        search: searchTerm || undefined
      })

      if (response.success && response.data) {
        setPayments(response.data.payments || [])
        setFilteredPayments(response.data.payments || [])
        
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.pages || 1)
        }

        if (response.data.stats) {
          setPaymentStats(response.data.stats)
        }
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los pagos",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cargando pagos:', error)
      toast({
        title: "Error",
        description: "Error al cargar los pagos. Intenta nuevamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Funciones de gestión de pagos
  const handleViewPayment = async (payment: Payment) => {
    setLoading(true)
    try {
      const response = await apiClient.getPaymentDetails(parseInt(payment.id))
      if (response.success && response.data) {
        const paymentDetail = response.data
        setSelectedPayment({
          id: paymentDetail.id,
          transactionId: paymentDetail.transactionId,
          amount: paymentDetail.amount,
          status: paymentDetail.status,
          paymentMethod: paymentDetail.paymentMethod,
          customerName: paymentDetail.customerName,
          customerEmail: paymentDetail.customerEmail,
          eventTitle: paymentDetail.eventTitle,
          createdAt: paymentDetail.createdAt,
          processedAt: paymentDetail.updatedAt,
          quantity: paymentDetail.quantity
        })
        setIsPaymentDetailOpen(true)
      } else {
        // Fallback a datos locales
        setSelectedPayment(payment)
        setIsPaymentDetailOpen(true)
      }
    } catch (error) {
      console.error('Error cargando detalles del pago:', error)
      // Fallback a datos locales
      setSelectedPayment(payment)
      setIsPaymentDetailOpen(true)
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async (paymentId: string) => {
    // Función desactivada temporalmente
  }

  const handleRefundPayment = async (paymentId: string) => {
    toast({
      title: "Función desactivada",
      description: "El procesamiento de reembolsos está temporalmente desactivado",
      variant: "destructive"
    })
    return
  }

  const exportPayments = () => {
    try {
      const csvContent = [
        "ID Transacción,Cliente,Email,Evento,Monto,Método,Estado,Fecha",
        ...filteredPayments.map(payment => 
          `${payment.transactionId},${payment.customerName},${payment.customerEmail},${payment.eventTitle},${payment.amount},${payment.paymentMethod},${payment.status},${payment.createdAt}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Exportación exitosa",
        description: "Datos de pagos exportados correctamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar los datos",
        variant: "destructive"
      })
    }
  }

  const totalRevenue = paymentStats.totalRevenue || filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0)
  
  const pendingAmount = paymentStats.pendingAmount || filteredPayments
    .filter(p => p.status === 'pending')
    .reduce((sum, payment) => sum + payment.amount, 0)

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline"
    } as const

    const labels = {
      completed: "Completado",
      pending: "Pendiente",
      failed: "Fallido",
      refunded: "Reembolsado"
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getMethodLabel = (method: string) => {
    const labels = {
      credit_card: "Tarjeta de Crédito",
      paypal: "PayPal",
      bank_transfer: "Transferencia Bancaria",
      cash: "Efectivo"
    }
    return labels[method as keyof typeof labels] || method
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Gestión de Pagos
          </h1>
          <p className="text-gray-600 mt-1">Administra y monitorea todas las transacciones de pago</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportPayments}>
          <Download className="mr-2 h-4 w-4" />
          Exportar
        </Button>
      </div>


      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pagos completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">${pendingAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pagos en proceso</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentStats.total || filteredPayments.length}</div>
            <p className="text-xs text-muted-foreground">Total de pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {paymentStats.total > 0 
                ? Math.round((paymentStats.completed / paymentStats.total) * 100)
                : filteredPayments.length > 0 
                  ? Math.round((filteredPayments.filter(p => p.status === 'completed').length / filteredPayments.length) * 100)
                  : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Pagos exitosos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar transacciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="failed">Fallido</SelectItem>
                  <SelectItem value="refunded">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Método de Pago</label>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los métodos</SelectItem>
                  <SelectItem value="credit_card">Tarjeta de Crédito</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Transferencia Bancaria</SelectItem>
                  <SelectItem value="cash">Efectivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando pagos...
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron pagos
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Transacción</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-mono text-sm">
                    {payment.transactionId}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{payment.customerName}</div>
                      <div className="text-sm text-muted-foreground">{payment.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {payment.eventTitle}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${payment.amount.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      {getMethodLabel(payment.paymentMethod)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewPayment(payment)}>
                        Ver
                      </Button>
                      {payment.status === 'pending' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleProcessPayment(payment.id)}
                          disabled={true}
                        >
                          Procesar (Desactivado)
                        </Button>
                      )}
                      {payment.status === 'completed' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleRefundPayment(payment.id)}
                          disabled={true}
                        >
                          Reembolsar (Desactivado)
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Página {page} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
          )}
        </CardContent>
      </Card>

      {/* Modal de detalles del pago */}
      <Dialog open={isPaymentDetailOpen} onOpenChange={setIsPaymentDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles de la Transacción</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">ID Transacción</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estado</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cliente</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.customerEmail}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Evento</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.eventTitle}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Monto</Label>
                  <p className="text-sm font-bold text-green-600">${selectedPayment.amount.toFixed(2)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Método de Pago</Label>
                  <p className="text-sm text-muted-foreground">{getMethodLabel(selectedPayment.paymentMethod)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Fecha de Creación</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedPayment.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedPayment.processedAt && (
                  <div>
                    <Label className="text-sm font-medium">Fecha de Procesamiento</Label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedPayment.processedAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDetailOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
