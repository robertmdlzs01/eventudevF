// Dashboard de Alertas basado en WordPress
// Gestión completa de alertas del sistema POS

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Shield, 
  DollarSign, 
  Users, 
  Settings,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Check,
  X,
  Clock,
  Zap,
  Activity
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { alertsService, Alert as AlertType, AlertFilter, AlertStats } from '@/lib/alerts-service'

interface AlertsDashboardProps {
  className?: string
}

export function AlertsDashboard({ className }: AlertsDashboardProps) {
  const [activeTab, setActiveTab] = useState('active')
  const [alerts, setAlerts] = useState<AlertType[]>([])
  const [stats, setStats] = useState<AlertStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<AlertFilter>({})
  const [selectedAlert, setSelectedAlert] = useState<AlertType | null>(null)

  // Cargar alertas
  const loadAlerts = async () => {
    setLoading(true)
    try {
      const alertsData = await alertsService.getAlerts(filter)
      setAlerts(alertsData)
    } catch (error) {
      console.error('Error cargando alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Cargar estadísticas
  const loadStats = async () => {
    try {
      const statsData = await alertsService.getAlertStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error cargando estadísticas:', error)
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    loadAlerts()
    loadStats()
  }, [filter])

  // Suscribirse a alertas en tiempo real
  useEffect(() => {
    const unsubscribe = alertsService.subscribeToAlerts((newAlert) => {
      setAlerts(prev => [newAlert, ...prev])
      loadStats() // Actualizar estadísticas
    })

    return unsubscribe
  }, [])

  // Filtrar alertas por estado
  const getFilteredAlerts = () => {
    switch (activeTab) {
      case 'active':
        return alerts.filter(alert => alert.status === 'active')
      case 'acknowledged':
        return alerts.filter(alert => alert.status === 'acknowledged')
      case 'resolved':
        return alerts.filter(alert => alert.status === 'resolved')
      case 'dismissed':
        return alerts.filter(alert => alert.status === 'dismissed')
      default:
        return alerts
    }
  }

  // Obtener icono por tipo
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  // Obtener color por prioridad
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Reconocer alerta
  const acknowledgeAlert = async (alertId: string) => {
    try {
      await alertsService.acknowledgeAlert(alertId, 'current-user')
      loadAlerts()
      loadStats()
    } catch (error) {
      console.error('Error reconociendo alerta:', error)
    }
  }

  // Resolver alerta
  const resolveAlert = async (alertId: string) => {
    try {
      await alertsService.resolveAlert(alertId, 'current-user')
      loadAlerts()
      loadStats()
    } catch (error) {
      console.error('Error resolviendo alerta:', error)
    }
  }

  // Descartar alerta
  const dismissAlert = async (alertId: string) => {
    try {
      await alertsService.dismissAlert(alertId, 'current-user')
      loadAlerts()
      loadStats()
    } catch (error) {
      console.error('Error descartando alerta:', error)
    }
  }

  // Exportar alertas
  const exportAlerts = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const blob = await alertsService.exportAlerts(format, filter)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `alerts.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando alertas:', error)
    }
  }

  const filteredAlerts = getFilteredAlerts()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alertas</CardTitle>
              <Bell className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.active} activas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.byPriority.critical || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Requieren atención inmediata
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reconocidas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.acknowledged}</div>
              <p className="text-xs text-muted-foreground">
                {stats.resolved} resueltas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sistema</CardTitle>
              <Activity className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byCategory.system || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Alertas del sistema
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros y controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros y Controles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Tipo</label>
              <select
                value={filter.type || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="">Todos</option>
                <option value="info">Info</option>
                <option value="warning">Advertencia</option>
                <option value="error">Error</option>
                <option value="success">Éxito</option>
                <option value="critical">Crítico</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium">Categoría</label>
              <select
                value={filter.category || ''}
                onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value || undefined }))}
                className="w-full px-3 py-2 border rounded-md mt-1"
              >
                <option value="">Todas</option>
                <option value="system">Sistema</option>
                <option value="security">Seguridad</option>
                <option value="business">Negocio</option>
                <option value="technical">Técnico</option>
                <option value="financial">Financiero</option>
              </select>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={loadAlerts}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>

              <Button
                onClick={() => exportAlerts('pdf')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>

              <Button
                onClick={() => exportAlerts('excel')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Excel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas de alertas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Activas ({alerts.filter(a => a.status === 'active').length})
          </TabsTrigger>
          <TabsTrigger value="acknowledged" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Reconocidas ({alerts.filter(a => a.status === 'acknowledged').length})
          </TabsTrigger>
          <TabsTrigger value="resolved" className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            Resueltas ({alerts.filter(a => a.status === 'resolved').length})
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="flex items-center gap-2">
            <X className="h-4 w-4" />
            Descartadas ({alerts.filter(a => a.status === 'dismissed').length})
          </TabsTrigger>
        </TabsList>

        {/* Lista de alertas */}
        <TabsContent value={activeTab}>
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-500">Cargando alertas...</p>
                </div>
              </div>
            ) : filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No hay alertas en esta categoría</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredAlerts.map((alert) => (
                <Card key={alert.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{alert.title}</h3>
                            <Badge className={getPriorityColor(alert.priority)}>
                              {alert.priority}
                            </Badge>
                            <Badge variant="outline">
                              {alert.category}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-3">{alert.message}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(alert.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <Zap className="h-4 w-4" />
                              {alert.source}
                            </span>
                            {alert.acknowledgedAt && (
                              <span className="flex items-center gap-1 text-green-600">
                                <Check className="h-4 w-4" />
                                Reconocida por {alert.acknowledgedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {alert.status === 'active' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              Reconocer
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resolveAlert(alert.id)}
                              className="flex items-center gap-1"
                            >
                              <Check className="h-4 w-4" />
                              Resolver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => dismissAlert(alert.id)}
                              className="flex items-center gap-1"
                            >
                              <X className="h-4 w-4" />
                              Descartar
                            </Button>
                          </>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                            className="flex items-center gap-1"
                          >
                            <Check className="h-4 w-4" />
                            Resolver
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAlert(alert)}
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de detalles de alerta */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getAlertIcon(selectedAlert.type)}
                {selectedAlert.title}
              </CardTitle>
              <CardDescription>
                {formatDate(selectedAlert.createdAt)} • {selectedAlert.source}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Descripción</h4>
                <p className="text-gray-600">{selectedAlert.message}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Estado</h4>
                  <Badge className={getPriorityColor(selectedAlert.priority)}>
                    {selectedAlert.status}
                  </Badge>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Prioridad</h4>
                  <Badge className={getPriorityColor(selectedAlert.priority)}>
                    {selectedAlert.priority}
                  </Badge>
                </div>
              </div>

              {selectedAlert.acknowledgedAt && (
                <div>
                  <h4 className="font-medium mb-2">Reconocida</h4>
                  <p className="text-sm text-gray-600">
                    Por {selectedAlert.acknowledgedBy} el {formatDate(selectedAlert.acknowledgedAt)}
                  </p>
                </div>
              )}

              {selectedAlert.resolvedAt && (
                <div>
                  <h4 className="font-medium mb-2">Resuelta</h4>
                  <p className="text-sm text-gray-600">
                    Por {selectedAlert.resolvedBy} el {formatDate(selectedAlert.resolvedAt)}
                  </p>
                </div>
              )}

              {selectedAlert.actions && selectedAlert.actions.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Acciones Disponibles</h4>
                  <div className="flex gap-2">
                    {selectedAlert.actions.map((action) => (
                      <Button
                        key={action.id}
                        size="sm"
                        variant={action.style === 'primary' ? 'default' : 'outline'}
                        onClick={() => {
                          // Implementar ejecución de acción
                          console.log('Ejecutando acción:', action.action)
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
            <div className="p-6 pt-0">
              <Button
                onClick={() => setSelectedAlert(null)}
                className="w-full"
              >
                Cerrar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
