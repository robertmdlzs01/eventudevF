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
}

const mockPayments: Payment[] = [
  {
    id: "1",
    transactionId: "TXN-2024-001",
    amount: 150.00,
    status: 'completed',
    paymentMethod: 'credit_card',
    customerName: 'Juan Pérez',
    customerEmail: 'juan@example.com',
    eventTitle: 'Concierto de Rock Nacional',
    createdAt: '2024-02-15T19:15:00',
    processedAt: '2024-02-15T19:16:00'
  },
  {
    id: "2",
    transactionId: "TXN-2024-002",
    amount: 75.50,
    status: 'pending',
    paymentMethod: 'paypal',
    customerName: 'Ana Martínez',
    customerEmail: 'ana@example.com',
    eventTitle: 'Festival de Jazz',
    createdAt: '2024-02-15T18:30:00'
  },
  {
    id: "3",
    transactionId: "TXN-2024-003",
    amount: 200.00,
    status: 'failed',
    paymentMethod: 'credit_card',
    customerName: 'Pedro Rodríguez',
    customerEmail: 'pedro@example.com',
    eventTitle: 'Obra de Teatro Clásico',
    createdAt: '2024-02-15T17:45:00'
  }
]

export default function AdminPagosClient() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments)
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>(mockPayments)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [methodFilter, setMethodFilter] = useState("all")
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [isPaymentDetailOpen, setIsPaymentDetailOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    let filtered = payments

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.eventTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter)
    }

    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.paymentMethod === methodFilter)
    }

    setFilteredPayments(filtered)
  }, [payments, searchTerm, statusFilter, methodFilter])

  // Funciones de gestión de pagos
  const handleViewPayment = (payment: Payment) => {
    setSelectedPayment(payment)
    setIsPaymentDetailOpen(true)
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

  const totalRevenue = filteredPayments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.amount, 0)
  
  const pendingAmount = filteredPayments
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Pagos
        </h1>
        <Button variant="outline" size="sm" onClick={exportPayments} disabled>
          <Download className="mr-2 h-4 w-4" />
          Exportar (Desactivado)
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
            <div className="text-2xl font-bold">{filteredPayments.length}</div>
            <p className="text-xs text-muted-foreground">Total de pagos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredPayments.length > 0 
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
