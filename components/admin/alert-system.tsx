"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { AlertTriangle, Bell, BellOff, Settings, CheckCircle, XCircle } from "lucide-react"
import { useState, useEffect } from "react"

interface Alert {
  id: string
  type: 'warning' | 'error' | 'info' | 'success'
  title: string
  message: string
  timestamp: Date
  acknowledged: boolean
}

interface AlertSystemProps {
  metrics?: {
    activeUsers?: number
    todaySales?: number
    todayRevenue?: number
    currentEvents?: number
    onlineUsers?: number
    conversionRate?: number
  }
}

const ALERT_THRESHOLDS = {
  activeUsers: { min: 10, max: 100 },
  todaySales: { min: 5, max: 50 },
  todayRevenue: { min: 1000000, max: 10000000 },
  currentEvents: { min: 1, max: 20 },
  onlineUsers: { min: 20, max: 200 },
  conversionRate: { min: 5, max: 20 }
}

export default function AlertSystem({ metrics }: AlertSystemProps) {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [showSettings, setShowSettings] = useState(false)

  // Generar alertas basadas en métricas
  useEffect(() => {
    if (!metrics || !alertsEnabled) return

    const newAlerts: Alert[] = []

    // Verificar métricas críticas
    if (metrics.activeUsers !== undefined) {
      if (metrics.activeUsers < ALERT_THRESHOLDS.activeUsers.min) {
        newAlerts.push({
          id: 'low-active-users',
          type: 'warning',
          title: 'Usuarios Activos Bajos',
          message: `Solo ${metrics.activeUsers} usuarios activos en los últimos 15 minutos`,
          timestamp: new Date(),
          acknowledged: false
        })
      } else if (metrics.activeUsers > ALERT_THRESHOLDS.activeUsers.max) {
        newAlerts.push({
          id: 'high-active-users',
          type: 'info',
          title: 'Alto Tráfico',
          message: `${metrics.activeUsers} usuarios activos - Considerar escalar recursos`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    if (metrics.todaySales !== undefined) {
      if (metrics.todaySales < ALERT_THRESHOLDS.todaySales.min) {
        newAlerts.push({
          id: 'low-sales',
          type: 'error',
          title: 'Ventas Bajas',
          message: `Solo ${metrics.todaySales} ventas hoy - Revisar estrategia de marketing`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    if (metrics.conversionRate !== undefined) {
      if (metrics.conversionRate < ALERT_THRESHOLDS.conversionRate.min) {
        newAlerts.push({
          id: 'low-conversion',
          type: 'warning',
          title: 'Tasa de Conversión Baja',
          message: `Tasa de conversión del ${metrics.conversionRate.toFixed(1)}% - Optimizar UX`,
          timestamp: new Date(),
          acknowledged: false
        })
      } else if (metrics.conversionRate > ALERT_THRESHOLDS.conversionRate.max) {
        newAlerts.push({
          id: 'high-conversion',
          type: 'success',
          title: 'Excelente Conversión',
          message: `Tasa de conversión del ${metrics.conversionRate.toFixed(1)}% - ¡Excelente trabajo!`,
          timestamp: new Date(),
          acknowledged: false
        })
      }
    }

    // Agregar alertas nuevas (evitar duplicados)
    setAlerts(prevAlerts => {
      const existingIds = prevAlerts.map(alert => alert.id)
      const newUniqueAlerts = newAlerts.filter(alert => !existingIds.includes(alert.id))
      return [...prevAlerts, ...newUniqueAlerts].slice(-10) // Mantener solo las últimas 10
    })
  }, [metrics, alertsEnabled])

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prevAlerts =>
      prevAlerts.map(alert =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    )
  }

  const dismissAlert = (alertId: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId))
  }

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      default:
        return <Bell className="h-5 w-5 text-blue-500" />
    }
  }

  const getAlertBadgeColor = (type: Alert['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800'
      case 'warning':
        return 'bg-yellow-100 text-yellow-800'
      case 'success':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-blue-100 text-blue-800'
    }
  }

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged)
  const acknowledgedAlerts = alerts.filter(alert => alert.acknowledged)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {alertsEnabled ? (
              <Bell className="h-5 w-5 text-green-500" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400" />
            )}
            Sistema de Alertas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Switch
              checked={alertsEnabled}
              onCheckedChange={setAlertsEnabled}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuración de alertas */}
        {showSettings && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-3">
            <h4 className="font-medium">Umbrales de Alertas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Usuarios Activos:</strong> {ALERT_THRESHOLDS.activeUsers.min} - {ALERT_THRESHOLDS.activeUsers.max}</p>
                <p><strong>Ventas Diarias:</strong> {ALERT_THRESHOLDS.todaySales.min} - {ALERT_THRESHOLDS.todaySales.max}</p>
                <p><strong>Conversión:</strong> {ALERT_THRESHOLDS.conversionRate.min}% - {ALERT_THRESHOLDS.conversionRate.max}%</p>
              </div>
              <div>
                <p><strong>Usuarios Online:</strong> {ALERT_THRESHOLDS.onlineUsers.min} - {ALERT_THRESHOLDS.onlineUsers.max}</p>
                <p><strong>Eventos Activos:</strong> {ALERT_THRESHOLDS.currentEvents.min} - {ALERT_THRESHOLDS.currentEvents.max}</p>
                <p><strong>Ingresos:</strong> ${ALERT_THRESHOLDS.todayRevenue.min.toLocaleString()} - ${ALERT_THRESHOLDS.todayRevenue.max.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Alertas no reconocidas */}
        {unacknowledgedAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-red-600">Alertas Activas ({unacknowledgedAlerts.length})</h4>
            {unacknowledgedAlerts.map((alert) => (
              <div key={alert.id} className="p-3 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{alert.title}</h5>
                        <Badge className={getAlertBadgeColor(alert.type)}>
                          {alert.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {alert.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Reconocer
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => dismissAlert(alert.id)}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alertas reconocidas */}
        {acknowledgedAlerts.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-600">Alertas Reconocidas ({acknowledgedAlerts.length})</h4>
            {acknowledgedAlerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="p-2 border border-gray-200 bg-gray-50 rounded-lg opacity-75">
                <div className="flex items-center gap-2">
                  {getAlertIcon(alert.type)}
                  <span className="text-sm font-medium">{alert.title}</span>
                  <Badge className={getAlertBadgeColor(alert.type)}>
                    {alert.type}
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissAlert(alert.id)}
                    className="ml-auto"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Sin alertas */}
        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No hay alertas activas</p>
            <p className="text-sm">Todas las métricas están dentro de los rangos normales</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
