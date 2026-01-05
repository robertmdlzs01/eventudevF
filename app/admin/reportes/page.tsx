import { Suspense } from 'react'
import { getSalesReport, getEventsReport, getUsersReport, getFinancialReport } from '../actions'
import AdminReportsClient from './AdminReportsClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Activity
} from 'lucide-react'

export default async function AdminReportsPage() {
  // Obtener datos de todos los reportes
  const salesData = await getSalesReport()
  const eventsData = await getEventsReport()
  const usersData = await getUsersReport()
  const financialData = await getFinancialReport()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes y Estadísticas</h1>
          <p className="text-muted-foreground">
            Análisis completo del rendimiento de la plataforma
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Ventas
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Eventos
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuarios
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Financiero
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${financialData.summary?.totalRevenue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% desde el mes pasado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Eventos Activos</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {eventsData.stats?.publishedEvents || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {eventsData.stats?.totalEvents || '0'} eventos totales
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Usuarios Registrados</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {usersData.stats?.totalUsers || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  +180 desde el mes pasado
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ventas Este Mes</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {salesData.stats?.totalSales || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${salesData.stats?.totalRevenue?.toLocaleString() || '0'} en ingresos
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Resumen de Actividad</CardTitle>
                <CardDescription>
                  Métricas clave de rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <Suspense fallback={<div>Cargando...</div>}>
                  <AdminReportsClient 
                    salesData={salesData}
                    eventsData={eventsData}
                    usersData={usersData}
                    financialData={financialData}
                  />
                </Suspense>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Eventos Más Populares</CardTitle>
                <CardDescription>
                  Top 5 eventos por rendimiento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {eventsData.topPerformingEvents?.slice(0, 5).map((event: any, index: number) => (
                    <div key={event.event_id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {event.event_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${event.revenue?.toLocaleString() || '0'} - {event.tickets_sold || '0'} boletos
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {event.attendance_percentage || '0'}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4">
          <Suspense fallback={<div>Cargando reporte de ventas...</div>}>
            <AdminReportsClient 
              salesData={salesData}
              eventsData={eventsData}
              usersData={usersData}
              financialData={financialData}
              activeTab="sales"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Suspense fallback={<div>Cargando reporte de eventos...</div>}>
            <AdminReportsClient 
              salesData={salesData}
              eventsData={eventsData}
              usersData={usersData}
              financialData={financialData}
              activeTab="events"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Suspense fallback={<div>Cargando reporte de usuarios...</div>}>
            <AdminReportsClient 
              salesData={salesData}
              eventsData={eventsData}
              usersData={usersData}
              financialData={financialData}
              activeTab="users"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <Suspense fallback={<div>Cargando reporte financiero...</div>}>
            <AdminReportsClient 
              salesData={salesData}
              eventsData={eventsData}
              usersData={usersData}
              financialData={financialData}
              activeTab="financial"
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
