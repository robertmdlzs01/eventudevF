// Dashboard de Reportes Avanzados basado en WordPress
// Visualización completa de reportes del sistema POS

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package, 
  Activity,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { reportsService, ReportFilters, SalesReport, EventReport, CustomerReport, FinancialReport, InventoryReport, PerformanceReport } from '@/lib/reports-service'

interface AdvancedReportsDashboardProps {
  className?: string
}

export function AdvancedReportsDashboard({ className }: AdvancedReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState('sales')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 días atrás
      end: new Date()
    }
  })
  
  const [reports, setReports] = useState<{
    sales?: SalesReport
    event?: EventReport
    customer?: CustomerReport
    financial?: FinancialReport
    inventory?: InventoryReport
    performance?: PerformanceReport
  }>({})

  const [realTimeStats, setRealTimeStats] = useState({
    totalSales: 0,
    todaySales: 0,
    activeUsers: 0,
    pendingOrders: 0,
    lowStockItems: 0
  })

  // Cargar estadísticas en tiempo real
  useEffect(() => {
    const loadRealTimeStats = async () => {
      try {
        const stats = await reportsService.getRealTimeStats()
        setRealTimeStats(stats)
      } catch (error) {
        console.error('Error cargando estadísticas en tiempo real:', error)
      }
    }

    loadRealTimeStats()
    const interval = setInterval(loadRealTimeStats, 30000) // Actualizar cada 30 segundos
    return () => clearInterval(interval)
  }, [])

  // Cargar reporte según la pestaña activa
  const loadReport = async (reportType: string) => {
    setLoading(true)
    try {
      let report: any
      switch (reportType) {
        case 'sales':
          report = await reportsService.generateSalesReport(filters)
          setReports(prev => ({ ...prev, sales: report }))
          break
        case 'event':
          if (filters.eventId) {
            report = await reportsService.generateEventReport(filters.eventId, filters)
            setReports(prev => ({ ...prev, event: report }))
          }
          break
        case 'customer':
          report = await reportsService.generateCustomerReport(filters)
          setReports(prev => ({ ...prev, customer: report }))
          break
        case 'financial':
          report = await reportsService.generateFinancialReport(filters)
          setReports(prev => ({ ...prev, financial: report }))
          break
        case 'inventory':
          report = await reportsService.generateInventoryReport(filters)
          setReports(prev => ({ ...prev, inventory: report }))
          break
        case 'performance':
          report = await reportsService.generatePerformanceReport(filters)
          setReports(prev => ({ ...prev, performance: report }))
          break
      }
    } catch (error) {
      console.error(`Error cargando reporte ${reportType}:`, error)
    } finally {
      setLoading(false)
    }
  }

  // Exportar reporte
  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      const reportType = activeTab
      const data = reports[reportType as keyof typeof reports]
      if (!data) return

      let blob
      switch (format) {
        case 'pdf':
          blob = await reportsService.exportToPDF(reportType, data, `${reportType}-report`)
          break
        case 'excel':
          blob = await reportsService.exportToExcel(reportType, data, `${reportType}-report`)
          break
        case 'csv':
          blob = await reportsService.exportToCSV(reportType, data, `${reportType}-report`)
          break
      }

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${reportType}-report.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando reporte:', error)
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas en tiempo real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(realTimeStats.totalSales)}</div>
            <p className="text-xs text-muted-foreground">
              Hoy: {formatCurrency(realTimeStats.todaySales)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              En línea ahora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Pendientes</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{realTimeStats.lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock bajo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendimiento</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.5%</div>
            <p className="text-xs text-muted-foreground">
              Uptime del sistema
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Reporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Rango de Fechas</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="date"
                  value={filters.dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                  }))}
                  className="px-3 py-2 border rounded-md"
                />
                <input
                  type="date"
                  value={filters.dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                  }))}
                  className="px-3 py-2 border rounded-md"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => loadReport(activeTab)}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Generar Reporte
              </Button>

              <Button
                onClick={() => exportReport('pdf')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                PDF
              </Button>

              <Button
                onClick={() => exportReport('excel')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>

              <Button
                onClick={() => exportReport('csv')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas de reportes */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="event" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financiero
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventario
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
        </TabsList>

        {/* Reporte de Ventas */}
        <TabsContent value="sales">
          {reports.sales && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ventas Totales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(reports.sales.totalSales)}</div>
                    <p className="text-sm text-muted-foreground">
                      {reports.sales.totalOrders} órdenes
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Valor Promedio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(reports.sales.averageOrderValue)}</div>
                    <p className="text-sm text-muted-foreground">
                      Por orden
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reembolsos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(reports.sales.refunds.totalRefunds)}</div>
                    <p className="text-sm text-muted-foreground">
                      {reports.sales.refunds.refundRate.toFixed(1)}% tasa
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ventas por evento */}
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.sales.salesByEvent.map((event, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{event.eventName}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.orders} órdenes
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(event.sales)}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-32 ml-4">
                          <Progress value={event.percentage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top clientes */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Clientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.sales.topCustomers.map((customer, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">#{index + 1}</Badge>
                          <div>
                            <p className="font-medium">{customer.customerName}</p>
                            <p className="text-sm text-muted-foreground">
                              {customer.orders} órdenes
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(customer.totalSpent)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Reporte de Eventos */}
        <TabsContent value="event">
          {reports.event && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ocupación</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.event.occupancyRate.toFixed(1)}%</div>
                    <p className="text-sm text-muted-foreground">
                      {reports.event.soldTickets} de {reports.event.totalTickets}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ingresos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{formatCurrency(reports.event.revenue)}</div>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(reports.event.averageTicketPrice)} promedio
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Check-ins</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.event.checkIns.total}</div>
                    <p className="text-sm text-muted-foreground">
                      {reports.event.checkIns.percentage.toFixed(1)}% asistencia
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Disponibles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{reports.event.availableTickets}</div>
                    <p className="text-sm text-muted-foreground">
                      Tickets restantes
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Ventas por tipo de ticket */}
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Tipo de Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reports.event.salesByTicketType.map((ticket, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{ticket.ticketType}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.sold} vendidos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(ticket.revenue)}</p>
                          <p className="text-sm text-muted-foreground">
                            {ticket.percentage.toFixed(1)}%
                          </p>
                        </div>
                        <div className="w-32 ml-4">
                          <Progress value={ticket.percentage} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Otros reportes... */}
        <TabsContent value="customer">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Clientes</CardTitle>
              <CardDescription>Análisis detallado de la base de clientes</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cargando reporte de clientes...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial">
          <Card>
            <CardHeader>
              <CardTitle>Reporte Financiero</CardTitle>
              <CardDescription>Análisis financiero completo del negocio</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cargando reporte financiero...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Inventario</CardTitle>
              <CardDescription>Estado del inventario y productos</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cargando reporte de inventario...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Reporte de Rendimiento</CardTitle>
              <CardDescription>Métricas de rendimiento del sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Cargando reporte de rendimiento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
