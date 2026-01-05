"use client"

import { Suspense, useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getSales, getSalesStats } from "@/app/admin/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, RefreshCw, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AdminSale {
  id: string
  ticketNumber: string
  eventName: string
  customerName: string
  customerEmail: string
  ticketType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentMethod: string
  status: string
  purchaseDate: string
  eventDate: string
  abandonedAt?: string
}

interface SalesStats {
  stats: {
    total_transactions: number
    completed_sales: number
    pending_payments: number
    failed_payments: number
    abandoned_carts: number
    cancelled_sales: number
    total_revenue: number
    average_sale: number
    cart_abandonments: number
    payment_attempts: number
  }
  conversion: {
    conversion_rate: number
    abandonment_rate: number
  }
  recent_transactions: any[]
}

export default function AdminSalesPageClient() {
  const [sales, setSales] = useState<AdminSale[]>([])
  const [filteredSales, setFilteredSales] = useState<AdminSale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  const [stats, setStats] = useState<SalesStats | null>(null)
  const { toast } = useToast()

  const fetchSales = async (searchParams?: { search?: string, status?: string, payment_method?: string }) => {
    setLoading(true)
    try {
      const [salesData, statsData] = await Promise.all([
        getSales(),
        getSalesStats()
      ])
      setSales(salesData)
      setFilteredSales(salesData)
      setStats(statsData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las ventas.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar ventas en el backend
  const searchSales = async () => {
    const searchParams: { search?: string, status?: string, payment_method?: string } = {}
    
    if (searchTerm) {
      searchParams.search = searchTerm
    }
    
    if (statusFilter !== "all") {
      searchParams.status = statusFilter
    }
    
    if (transactionTypeFilter !== "all") {
      searchParams.payment_method = transactionTypeFilter
    }
    
    await fetchSales(searchParams)
  }

  useEffect(() => {
    fetchSales()
  }, [])

  // Debounce para evitar demasiadas búsquedas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSales()
    }, 500) // Esperar 500ms después del último cambio

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, transactionTypeFilter])

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      abandoned: "outline",
      cancelled: "destructive",
    } as const

    const labels = {
      completed: "Completada",
      pending: "Pendiente",
      failed: "Fallida",
      abandoned: "Abandonada",
      cancelled: "Cancelada",
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    )
  }

  const getTransactionTypeBadge = (type: string) => {
    const variants = {
      direct_sale: "default",
      payment_attempt: "secondary",
      cart_abandonment: "outline",
    } as const

    const labels = {
      direct_sale: "Venta Directa",
      payment_attempt: "Intento de Pago",
      cart_abandonment: "Abandono de Carrito",
    }

    return (
      <Badge variant={variants[type as keyof typeof variants] || "outline"}>
        {labels[type as keyof typeof labels] || type}
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

  const completedSales = filteredSales.filter(sale => sale.status === 'completed')
  const totalRevenue = completedSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const totalTickets = completedSales.reduce((sum, sale) => sum + sale.quantity, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Transacciones
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => fetchSales()} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Transacciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.stats.total_transactions}</div>
              <p className="text-xs text-muted-foreground">Todas las transacciones</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Ventas Completadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.stats.completed_sales}</div>
              <p className="text-xs text-muted-foreground">{formatCurrency(stats.stats.total_revenue)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversion.conversion_rate}%</div>
              <p className="text-xs text-muted-foreground">Abandono: {stats.conversion.abandonment_rate}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Carritos Abandonados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.stats.abandoned_carts}</div>
              <p className="text-xs text-muted-foreground">Pagos fallidos: {stats.stats.failed_payments}</p>
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
                  placeholder="Buscar por cliente, evento o tipo de boleto..."
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
                  <SelectItem value="failed">Fallidas</SelectItem>
                  <SelectItem value="abandoned">Abandonadas</SelectItem>
                  <SelectItem value="cancelled">Canceladas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="direct_sale">Venta Directa</SelectItem>
                  <SelectItem value="payment_attempt">Intento de Pago</SelectItem>
                  <SelectItem value="cart_abandonment">Abandono de Carrito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listado de Transacciones</CardTitle>
          <CardContent className="p-0">
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredSales.length} de {sales.length} transacciones
            </p>
          </CardContent>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Cargando transacciones...</p>
            </div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm || statusFilter !== "all" || transactionTypeFilter !== "all"
                  ? "No se encontraron transacciones con los filtros aplicados."
                  : "No hay transacciones registradas."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Tipo Trans.</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.customerName}</div>
                          <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{sale.eventName}</div>
                          <div className="text-sm text-gray-500">{formatDate(sale.eventDate)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{sale.ticketType}</TableCell>
                      <TableCell>{sale.quantity}</TableCell>
                      <TableCell className="font-medium">
                        {sale.status === 'completed' ? (
                          <span className="text-green-600">{formatCurrency(sale.totalAmount)}</span>
                        ) : (
                          <span className="text-gray-500">{formatCurrency(sale.totalAmount)}</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(sale.status)}</TableCell>
                      <TableCell>{getTransactionTypeBadge(sale.paymentMethod)}</TableCell>
                      <TableCell>{formatDate(sale.purchaseDate)}</TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">
                          N/A
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

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Filtros Aplicados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium">Ventas Completadas</div>
              <div className="text-2xl font-bold text-green-600">{completedSales.length}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Ingresos Totales</div>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Boletas Vendidas</div>
              <div className="text-2xl font-bold">{totalTickets}</div>
            </div>
            <div>
              <div className="text-sm font-medium">Promedio por Venta</div>
              <div className="text-2xl font-bold">
                {completedSales.length > 0 ? formatCurrency(totalRevenue / completedSales.length) : '$0'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
