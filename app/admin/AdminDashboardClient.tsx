"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Activity,
  UserPlus,
  CalendarPlus,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  User
} from "lucide-react"
import Link from "next/link"

interface AdminDashboardClientProps {
  dashboardData: {
    stats: {
      totalUsers: number
      adminUsers: number
      organizerUsers: number
      regularUsers: number
      totalEvents: number
      publishedEvents: number
      draftEvents: number
      cancelledEvents: number
      totalSales: number
      totalRevenue: number
      salesLast30Days: number
      revenueLast30Days: number
    }
    growth: {
      newUsers30Days: number
      newEvents30Days: number
      newSales30Days: number
      newRevenue30Days: number
    }
    recentEvents: any[]
    recentSales: any[]
    recentUsers: any[]
  }
}

export default function AdminDashboardClient({ dashboardData }: AdminDashboardClientProps) {
  const { stats, growth, recentEvents, recentSales, recentUsers } = dashboardData

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    )
  }

  const getGrowthColor = (value: number) => {
    return value >= 0 ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard de Administración</h1>
          <p className="text-muted-foreground">
            Resumen general del sistema Eventu
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Users */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(growth.newUsers30Days)}
              <span className={`ml-1 ${getGrowthColor(growth.newUsers30Days)}`}>
                +{growth.newUsers30Days} este mes
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge variant="secondary">{stats.adminUsers} Admin</Badge>
              <Badge variant="secondary">{stats.organizerUsers} Organizadores</Badge>
              <Badge variant="secondary">{stats.regularUsers} Usuarios</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(growth.newEvents30Days)}
              <span className={`ml-1 ${getGrowthColor(growth.newEvents30Days)}`}>
                +{growth.newEvents30Days} este mes
              </span>
            </div>
            <div className="mt-2 flex gap-2">
              <Badge variant="default">{stats.publishedEvents} Publicados</Badge>
              <Badge variant="secondary">{stats.draftEvents} Borradores</Badge>
              <Badge variant="destructive">{stats.cancelledEvents} Cancelados</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Total Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(growth.newSales30Days)}
              <span className={`ml-1 ${getGrowthColor(growth.newSales30Days)}`}>
                +{growth.newSales30Days} este mes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.salesLast30Days} ventas en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(growth.newRevenue30Days)}
              <span className={`ml-1 ${getGrowthColor(growth.newRevenue30Days)}`}>
                +{formatCurrency(growth.newRevenue30Days)} este mes
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.revenueLast30Days)} en los últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Eventos Recientes
            </CardTitle>
            <CardDescription>
              Últimos eventos creados en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{event.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.first_name} {event.last_name}
                    </p>
                  </div>
                  <Badge variant={event.status === 'published' ? 'default' : 'secondary'}>
                    {event.status}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/eventos">Ver todos los eventos</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Ventas Recientes
            </CardTitle>
            <CardDescription>
              Últimas transacciones realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">{sale.event_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {sale.customer_email}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(sale.total_amount)}</p>
                    <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
                      {sale.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/pagos">Ver todas las ventas</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Usuarios Recientes
            </CardTitle>
            <CardDescription>
              Nuevos usuarios registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'organizer' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/admin/usuarios">Ver todos los usuarios</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>
            Acceso directo a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Button asChild className="h-auto p-4 flex flex-col items-center gap-2">
            <Link href="/admin/usuarios/crear?role=administrator">
              <Shield className="h-6 w-6" />
              <span>Crear Administrador</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Link href="/admin/usuarios/crear?role=pos_manager">
              <User className="h-6 w-6" />
              <span>Crear Gerente POS</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Link href="/admin/usuarios/crear?role=cashier">
              <UserPlus className="h-6 w-6" />
              <span>Crear Cajero</span>
            </Link>
          </Button>
          <Button asChild variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
            <Link href="/admin/eventos/crear">
              <CalendarPlus className="h-6 w-6" />
              <span>Crear Evento</span>
            </Link>
          </Button>
        </div>
        </CardContent>
      </Card>
    </div>
  )
}
