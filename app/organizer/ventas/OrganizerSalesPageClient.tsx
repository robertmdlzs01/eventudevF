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
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  CreditCard,
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
} from "lucide-react"

interface Sale {
  id: string
  transactionId: string
  customerName: string
  customerEmail: string
  event: string
  ticketType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  commission: number
  netAmount: number
  paymentMethod: string
  paymentStatus: string
  saleDate: string
}

interface SalesStats {
  totalRevenue: number
  totalSales: number
  totalTickets: number
  averageOrderValue: number
  conversionRate: number
  refundRate: number
  topEvent: string
  topPaymentMethod: string
}

export default function OrganizerSalesPageClient() {
  const { toast } = useToast()
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [stats, setStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalSales: 0,
    totalTickets: 0,
    averageOrderValue: 0,
    conversionRate: 0,
    refundRate: 0,
    topEvent: "",
    topPaymentMethod: "",
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")

  useEffect(() => {
    loadSales()
  }, [])

  const loadSales = async () => {
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
      const response = await apiClient.getUserPayments(user.id)
      
      if (response.success && response.data) {
        const salesData = response.data.map((payment: any) => ({
          id: payment.id.toString(),
          transactionId: payment.transaction_id || `TXN-${payment.id}`,
          customerName: payment.customer_name || "Cliente",
          customerEmail: payment.customer_email || "cliente@example.com",
          event: payment.event_title || "Evento",
          ticketType: payment.ticket_type || "General",
          quantity: payment.quantity || 1,
          unitPrice: payment.unit_price || payment.amount || 0,
          totalAmount: payment.amount || 0,
          commission: payment.commission || 0,
          netAmount: payment.net_amount || payment.amount || 0,
          paymentMethod: payment.payment_method || "Tarjeta",
          paymentStatus: payment.status || "completed",
          saleDate: payment.created_at || new Date().toISOString(),
        }))
        
        setSales(salesData)
        setFilteredSales(salesData)
        calculateStats(salesData)
      }
    } catch (error) {
      console.error("Error loading sales:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las ventas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.totalAmount, 0)
    const totalSales = salesData.length
    const totalTickets = salesData.reduce((sum, sale) => sum + sale.quantity, 0)
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    const completedSales = salesData.filter(sale => sale.paymentStatus === "completed").length
    const conversionRate = totalSales > 0 ? (completedSales / totalSales) * 100 : 0
    const refundedSales = salesData.filter(sale => sale.paymentStatus === "refunded").length
    const refundRate = totalSales > 0 ? (refundedSales / totalSales) * 100 : 0

    // Encontrar el evento más vendido
    const eventCounts = salesData.reduce((acc, sale) => {
      acc[sale.event] = (acc[sale.event] || 0) + sale.quantity
      return acc
    }, {} as Record<string, number>)
    const topEvent = Object.entries(eventCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || ""

    // Encontrar el método de pago más usado
    const paymentMethodCounts = salesData.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topPaymentMethod = Object.entries(paymentMethodCounts).sort(([,a], [,b]) => b - a)[0]?.[0] || ""

    setStats({
      totalRevenue,
      totalSales,
      totalTickets,
      averageOrderValue,
      conversionRate,
      refundRate,
      topEvent,
      topPaymentMethod,
    })
  }

  useEffect(() => {
    let filtered = sales

    if (searchTerm) {
      filtered = filtered.filter(
        sale =>
          sale.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.transactionId.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(sale => sale.paymentStatus === statusFilter)
    }

    if (dateFilter !== "all") {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0)
          break
        case "week":
          filterDate.setDate(now.getDate() - 7)
          break
        case "month":
          filterDate.setMonth(now.getMonth() - 1)
          break
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1)
          break
      }

      filtered = filtered.filter(sale => new Date(sale.saleDate) >= filterDate)
    }

    setFilteredSales(filtered)
  }, [sales, searchTerm, statusFilter, dateFilter])

  const exportSales = () => {
    const csvContent = [
      ["ID", "Transacción", "Cliente", "Email", "Evento", "Tipo", "Cantidad", "Precio Unitario", "Total", "Método", "Estado", "Fecha"],
      ...filteredSales.map(sale => [
        sale.id,
        sale.transactionId,
        sale.customerName,
        sale.customerEmail,
        sale.event,
        sale.ticketType,
        sale.quantity.toString(),
        sale.unitPrice.toString(),
        sale.totalAmount.toString(),
        sale.paymentMethod,
        sale.paymentStatus,
        new Date(sale.saleDate).toLocaleDateString(),
      ])
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `ventas_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Exportado",
      description: "Las ventas se han exportado correctamente",
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      case "refunded":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "failed":
        return "Fallido"
      case "refunded":
        return "Reembolsado"
      default:
        return status
    }
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
          <h1 className="text-3xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600">Gestiona y analiza las ventas de tus eventos</p>
        </div>
        <Button onClick={exportSales} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-600">
              {stats.totalSales} ventas realizadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Vendidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-gray-600">
              Promedio: ${stats.averageOrderValue.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">
              Ventas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Reembolso</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.refundRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-600">
              Reembolsos realizados
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
                placeholder="Buscar ventas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado de pago" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="failed">Fallido</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el período</SelectItem>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mes</SelectItem>
                <SelectItem value="year">Último año</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Ventas</CardTitle>
          <CardDescription>
            {filteredSales.length} ventas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transacción</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell className="font-medium">{sale.transactionId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{sale.customerName}</div>
                      <div className="text-sm text-gray-500">{sale.customerEmail}</div>
                    </div>
                  </TableCell>
                  <TableCell>{sale.event}</TableCell>
                  <TableCell>{sale.ticketType}</TableCell>
                  <TableCell>{sale.quantity}</TableCell>
                  <TableCell>${sale.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>{sale.paymentMethod}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(sale.paymentStatus)}>
                      {getStatusText(sale.paymentStatus)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredSales.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron ventas con los filtros seleccionados</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
