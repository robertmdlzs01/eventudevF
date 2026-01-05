"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminAnalytics, getAdminSalesReport, getAdminEventsReport, getAdminUsersReport, exportAdminReport, getAdminDailySalesReport, getAdminTopEventsReport, getAdminTrendsReport, getAdminCompleteReport } from "@/app/admin/actions"
import {
  BarChart3,
  Calendar,
  Download,
  FileText,
  PieChart,
  TrendingUp,
  Users,
  DollarSign,
  Ticket,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import { EventsPerformanceChart } from "@/components/admin/charts/events-performance-chart"
import { RevenueChart } from "@/components/admin/charts/revenue-chart"
import { CategoryChart } from "@/components/admin/charts/category-chart"

export default function AdminReportsPageClient() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [salesReport, setSalesReport] = useState<any>(null)
  const [eventsReport, setEventsReport] = useState<any>(null)
  const [usersReport, setUsersReport] = useState<any>(null)
  const [dailySalesReport, setDailySalesReport] = useState<any>(null)
  const [topEventsReport, setTopEventsReport] = useState<any>(null)
  const [trendsReport, setTrendsReport] = useState<any>(null)
  const [completeReport, setCompleteReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [quickReportLoading, setQuickReportLoading] = useState<string | null>(null)

  // Cargar datos del backend
  const fetchData = async () => {
    setLoading(true)
    try {
      const [analyticsData, salesData, eventsData, usersData] = await Promise.all([
        getAdminAnalytics(),
        getAdminSalesReport(),
        getAdminEventsReport(),
        getAdminUsersReport()
      ])
      setAnalytics(analyticsData)
      setSalesReport(salesData)
      setEventsReport(eventsData)
      setUsersReport(usersData)
    } catch (error) {
      console.error('Error fetching reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleExportAll = async () => {
    setExporting(true)
    try {
      // Exportar todos los reportes
      const downloadUrl = await exportAdminReport('all', 'excel')
      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
      }
    } catch (error) {
      console.error('Error exporting reports:', error)
    } finally {
      setExporting(false)
    }
  }

  const handleQuickReport = async (reportType: string) => {
    setQuickReportLoading(reportType)
    try {
      let reportData: any = null
      let downloadUrl = ''

      switch (reportType) {
        case 'daily-sales':
          reportData = await getAdminDailySalesReport()
          downloadUrl = await exportAdminReport('daily-sales', 'pdf')
          break
        case 'top-events':
          reportData = await getAdminTopEventsReport()
          downloadUrl = await exportAdminReport('top-events', 'pdf')
          break
        case 'trends':
          reportData = await getAdminTrendsReport()
          downloadUrl = await exportAdminReport('trends', 'pdf')
          break
        case 'complete':
          reportData = await getAdminCompleteReport()
          downloadUrl = await exportAdminReport('complete', 'pdf')
          break
      }

      if (downloadUrl) {
        window.open(downloadUrl, '_blank')
      }
    } catch (error) {
      console.error(`Error generating ${reportType} report:`, error)
    } finally {
      setQuickReportLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando reportes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Reportes y Estadísticas
        </h1>
        <Button variant="outline" size="sm" onClick={handleExportAll} disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Exportando..." : "Exportar Todo"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Vista General</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="events">Eventos</TabsTrigger>
          <TabsTrigger value="users">Usuarios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos del Mes</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${analytics?.monthlyRevenue?.toLocaleString() || '0'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {analytics?.revenueGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={analytics?.revenueGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {analytics?.revenueGrowth >= 0 ? '+' : ''}{analytics?.revenueGrowth || 0}%
                  </span>
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.activeEvents || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {analytics?.eventsGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={analytics?.eventsGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {analytics?.eventsGrowth >= 0 ? '+' : ''}{analytics?.eventsGrowth || 0}%
                  </span>
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Boletas Vendidas</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalTicketsSold?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {analytics?.ticketsGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={analytics?.ticketsGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {analytics?.ticketsGrowth >= 0 ? '+' : ''}{analytics?.ticketsGrowth || 0}%
                  </span>
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Nuevos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.newUsers?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {analytics?.usersGrowth >= 0 ? (
                    <ArrowUpRight className="h-3 w-3 text-green-500" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 text-red-500" />
                  )}
                  <span className={analytics?.usersGrowth >= 0 ? "text-green-500" : "text-red-500"}>
                    {analytics?.usersGrowth >= 0 ? '+' : ''}{analytics?.usersGrowth || 0}%
                  </span>
                  vs mes anterior
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos vs Gastos</CardTitle>
                <CardDescription>Comparación semanal</CardDescription>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Categoría</CardTitle>
                <CardDescription>Distribución actual</CardDescription>
              </CardHeader>
              <CardContent>
                <CategoryChart />
              </CardContent>
            </Card>
          </div>

          {/* Quick Reports */}
          <Card>
            <CardHeader>
              <CardTitle>Reportes Rápidos</CardTitle>
              <CardDescription>Accede a los reportes más utilizados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 bg-transparent hover:bg-slate-50"
                  onClick={() => handleQuickReport('daily-sales')}
                  disabled={quickReportLoading === 'daily-sales'}
                >
                  <BarChart3 className="h-6 w-6" />
                  <span className="text-sm">
                    {quickReportLoading === 'daily-sales' ? 'Generando...' : 'Ventas Diarias'}
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 bg-transparent hover:bg-slate-50"
                  onClick={() => handleQuickReport('top-events')}
                  disabled={quickReportLoading === 'top-events'}
                >
                  <PieChart className="h-6 w-6" />
                  <span className="text-sm">
                    {quickReportLoading === 'top-events' ? 'Generando...' : 'Top Eventos'}
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 bg-transparent hover:bg-slate-50"
                  onClick={() => handleQuickReport('trends')}
                  disabled={quickReportLoading === 'trends'}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-sm">
                    {quickReportLoading === 'trends' ? 'Generando...' : 'Tendencias'}
                  </span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 bg-transparent hover:bg-slate-50"
                  onClick={() => handleQuickReport('complete')}
                  disabled={quickReportLoading === 'complete'}
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-sm">
                    {quickReportLoading === 'complete' ? 'Generando...' : 'Reporte Completo'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Ventas</CardTitle>
              <CardDescription>Métricas detalladas de ventas y rendimiento</CardDescription>
            </CardHeader>
            <CardContent>
              <RevenueChart />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ventas por Canal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Online</span>
                    <span className="text-sm font-medium">75%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: "75%" }}></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Puntos de Venta</span>
                    <span className="text-sm font-medium">25%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "25%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Métodos de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tarjeta de Crédito</span>
                    <span className="text-sm font-medium">60%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Transferencia</span>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Efectivo</span>
                    <span className="text-sm font-medium">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Eventos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Concierto Rock</span>
                    <span className="text-sm font-medium">$48,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Festival Jazz</span>
                    <span className="text-sm font-medium">$32,000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Teatro Clásico</span>
                    <span className="text-sm font-medium">$15,000</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendimiento de Eventos</CardTitle>
              <CardDescription>Análisis comparativo de asistentes, ingresos y satisfacción por evento</CardDescription>
            </CardHeader>
            <CardContent>
              <EventsPerformanceChart />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Eventos por Estado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Activos</span>
                    </div>
                    <span className="text-sm font-medium">15</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span className="text-sm">Pendientes</span>
                    </div>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <span className="text-sm">Cancelados</span>
                    </div>
                    <span className="text-sm font-medium">2</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                      <span className="text-sm">Finalizados</span>
                    </div>
                    <span className="text-sm font-medium">12</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Promedio de Satisfacción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">4.7</div>
                  <div className="text-sm text-muted-foreground mb-4">de 5 estrellas</div>
                  <div className="space-y-2">
                    {[5, 4, 3, 2, 1].map((stars) => (
                      <div key={stars} className="flex items-center gap-2">
                        <span className="text-xs w-4">{stars}★</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{
                              width: `${stars === 5 ? 60 : stars === 4 ? 30 : stars === 3 ? 8 : stars === 2 ? 2 : 0}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground w-8">
                          {stars === 5 ? "60%" : stars === 4 ? "30%" : stars === 3 ? "8%" : stars === 2 ? "2%" : "0%"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análisis de Usuarios</CardTitle>
              <CardDescription>Comportamiento y estadísticas de usuarios registrados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">1,234</div>
                  <div className="text-sm text-muted-foreground">Usuarios Totales</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">856</div>
                  <div className="text-sm text-muted-foreground">Usuarios Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">69%</div>
                  <div className="text-sm text-muted-foreground">Tasa de Retención</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Usuarios por Edad</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { range: "18-25", percentage: 35 },
                    { range: "26-35", percentage: 40 },
                    { range: "36-45", percentage: 20 },
                    { range: "46+", percentage: 5 },
                  ].map((age) => (
                    <div key={age.range} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{age.range} años</span>
                        <span>{age.percentage}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${age.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actividad por Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day, index) => {
                    const activity = [20, 35, 30, 45, 50, 60, 25][index]
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm w-8">{day}</span>
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${activity}%` }}></div>
                        </div>
                        <span className="text-sm text-muted-foreground w-8">{activity}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
