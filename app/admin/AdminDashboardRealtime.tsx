"use client"

import { useEffect, useState } from 'react'
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
  User,
  RefreshCw,
  Wifi,
  WifiOff,
  Users2,
  Bell
} from "lucide-react"
import Link from "next/link"
import { useAdminWebSocket } from '@/hooks/useWebSocket'
import { useAuth } from '@/lib/auth-guard'
import DashboardCharts from '@/components/admin/dashboard-charts'
import TimeFilters from '@/components/admin/time-filters'
import ExportTools from '@/components/admin/export-tools'
import AlertSystem from '@/components/admin/alert-system'

interface DashboardData {
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
  chartData?: any
  realtimeMetrics?: any
  lastUpdated: string
}

interface AdminChange {
  user: string
  action: string
  resource: string
  timestamp: string | Date
}

interface ConnectedAdmin {
  userEmail: string
  connectedAt: string | Date
}

export default function AdminDashboardRealtime() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const { user, role, isLoading: authLoading } = useAuth()
  
  // Obtener token del localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  
  const {
    socket,
    connected,
    error,
    dashboardData,
    connectedAdmins,
    adminChanges,
    refreshDashboard,
    requestDashboardUpdate
  } = useAdminWebSocket(token)
  
  // Asegurar que adminChanges tenga el tipo correcto
  const typedAdminChanges: AdminChange[] = adminChanges || []
  
  // Asegurar que connectedAdmins tenga el tipo correcto
  const typedConnectedAdmins: ConnectedAdmin[] = connectedAdmins || []

  // Actualizar timestamp cuando se reciben datos
  useEffect(() => {
    if (dashboardData) {
      setLastRefresh(new Date())
    }
  }, [dashboardData])

  const handleRefresh = () => {
    refreshDashboard()
    setLastRefresh(new Date())
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!user || role !== 'admin') {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Acceso denegado. Se requieren permisos de administrador.</p>
      </div>
    )
  }

  // Verificar que tenemos datos del dashboard antes de renderizar
  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Cargando datos del dashboard...</p>
      </div>
    )
  }

  const data = dashboardData as DashboardData

  return (
    <div className="space-y-6">
      {/* Header con estado de conexión */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-600">Dashboard en tiempo real compartido entre administradores</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Estado de conexión */}
          <div className="flex items-center space-x-2">
            {connected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">Conectado</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-600">Desconectado</span>
              </>
            )}
          </div>

          {/* Administradores conectados */}
          <div className="flex items-center space-x-2">
            <Users2 className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-gray-600">
              {typedConnectedAdmins.length} admin{typedConnectedAdmins.length !== 1 ? 's' : ''} conectado{typedConnectedAdmins.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Botón de actualización */}
          <Button 
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={!connected}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </div>

      {/* Notificaciones de cambios recientes */}
      {typedAdminChanges.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Cambios Recientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {typedAdminChanges.slice(0, 3).map((change, index) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{change.user}</span> realizó{' '}
                  <span className="font-medium">{change.action}</span> en{' '}
                  <span className="font-medium">{change.resource}</span>
                  <span className="text-gray-500 ml-2">
                    {formatDate(change.timestamp)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total de Usuarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth?.newUsers30Days || 0} en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        {/* Total de Eventos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Eventos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalEvents || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth?.newEvents30Days || 0} en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        {/* Total de Ventas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Ventas</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.stats?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth?.newSales30Days || 0} en los últimos 30 días
            </p>
          </CardContent>
        </Card>

        {/* Ingresos Totales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.stats?.totalRevenue ? formatCurrency(data.stats.totalRevenue) : '$0'}
            </div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth?.newRevenue30Days ? formatCurrency(data.growth.newRevenue30Days) : '$0'} en los últimos 30 días
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Estadísticas detalladas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Usuarios por Rol */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Usuarios por Rol</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-red-500" />
                <span className="text-sm">Administradores</span>
              </div>
              <Badge variant="secondary">{data?.stats?.adminUsers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Organizadores</span>
              </div>
              <Badge variant="secondary">{data?.stats?.organizerUsers || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-green-500" />
                <span className="text-sm">Usuarios</span>
              </div>
              <Badge variant="secondary">{data?.stats?.regularUsers || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Eventos por Estado */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Eventos por Estado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm">Publicados</span>
              </div>
              <Badge variant="secondary">{data?.stats?.publishedEvents || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">Borradores</span>
              </div>
              <Badge variant="secondary">{data?.stats?.draftEvents || 0}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm">Cancelados</span>
              </div>
              <Badge variant="secondary">{data?.stats?.cancelledEvents || 0}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Administradores Conectados */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Administradores Conectados</CardTitle>
          </CardHeader>
          <CardContent>
            {typedConnectedAdmins.length > 0 ? (
              <div className="space-y-2">
                {typedConnectedAdmins.map((admin, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm">{admin.userEmail}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(admin.connectedAt)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No hay administradores conectados</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información de última actualización */}
      <div className="text-center text-sm text-gray-500">
        Última actualización: {formatDate(lastRefresh.toISOString())}
        {data?.lastUpdated && (
          <span className="ml-2">
            (Datos del servidor: {formatDate(data.lastUpdated)})
          </span>
        )}
      </div>

      {/* Filtros de Tiempo */}
      <TimeFilters 
        onFilterChange={(filters) => {
          console.log('Filtros aplicados:', filters)
          // Aquí se implementaría la lógica para aplicar filtros
        }}
        loading={false}
      />

      {/* Sistema de Alertas */}
      <AlertSystem metrics={data?.realtimeMetrics} />

      {/* Gráficos y Visualizaciones */}
      <DashboardCharts data={data?.chartData} />

      {/* Herramientas de Exportación */}
      <ExportTools 
        onExport={(format, type) => {
          console.log('Exportando:', format, type)
          // Aquí se implementaría la lógica de exportación
        }}
        loading={false}
      />

      {/* Error de conexión */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600 text-sm">
              Error de conexión: {error}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
