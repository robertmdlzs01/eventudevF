"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Activity, 
  Users, 
  ShoppingCart, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  Eye
} from "lucide-react"
import { useEffect, useState } from "react"

interface RealtimeMetricsProps {
  data?: {
    activeUsers?: number
    todaySales?: number
    todayRevenue?: number
    currentEvents?: number
    onlineUsers?: number
    conversionRate?: number
  }
}

export default function RealtimeMetrics({ data }: RealtimeMetricsProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isLive, setIsLive] = useState(true)

  // Actualizar tiempo cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Simular datos en tiempo real si no se proporcionan
  const metrics = data || {
    activeUsers: Math.floor(Math.random() * 50) + 20,
    todaySales: Math.floor(Math.random() * 20) + 5,
    todayRevenue: Math.floor(Math.random() * 5000000) + 1000000,
    currentEvents: Math.floor(Math.random() * 10) + 3,
    onlineUsers: Math.floor(Math.random() * 100) + 30,
    conversionRate: Math.random() * 5 + 8
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header de Métricas en Tiempo Real */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <CardTitle className="text-lg">Métricas en Tiempo Real</CardTitle>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-mono">{formatTime(currentTime)}</span>
              </div>
              <Badge variant={isLive ? "default" : "secondary"} className="bg-green-100 text-green-800">
                {isLive ? "EN VIVO" : "PAUSADO"}
              </Badge>
            </div>
          </div>
          <CardDescription>
            Datos actualizados cada segundo - Última actualización: {formatTime(currentTime)}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Métricas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Usuarios Activos Ahora */}
        <Card className="border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Activos</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.activeUsers}</p>
                <p className="text-xs text-gray-500">últimos 15 min</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+12% vs ayer</span>
            </div>
          </CardContent>
        </Card>

        {/* Ventas del Día */}
        <Card className="border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas Hoy</p>
                <p className="text-2xl font-bold text-green-600">{metrics.todaySales}</p>
                <p className="text-xs text-gray-500">tickets vendidos</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+8% vs ayer</span>
            </div>
          </CardContent>
        </Card>

        {/* Ingresos del Día */}
        <Card className="border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos Hoy</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(metrics.todayRevenue || 0)}
                </p>
                <p className="text-xs text-gray-500">recaudado</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+15% vs ayer</span>
            </div>
          </CardContent>
        </Card>

        {/* Eventos Activos */}
        <Card className="border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Activos</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.currentEvents}</p>
                <p className="text-xs text-gray-500">en este momento</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-600">+3 vs ayer</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Secundarias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Usuarios Online */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Usuarios Online</p>
                <p className="text-xl font-bold">{metrics.onlineUsers}</p>
              </div>
              <Eye className="h-5 w-5 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        {/* Tasa de Conversión */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-xl font-bold">{(metrics.conversionRate || 0).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        {/* Tiempo de Respuesta */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo de Respuesta</p>
                <p className="text-xl font-bold">245ms</p>
              </div>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actividad Reciente */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas acciones de usuarios en tiempo real
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">Usuario registrado: juan@email.com</span>
              </div>
              <span className="text-xs text-gray-500">hace 30s</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Venta realizada: Concierto Rock - $150,000</span>
              </div>
              <span className="text-xs text-gray-500">hace 1m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span className="text-sm">Evento creado: Conferencia Tech 2024</span>
              </div>
              <span className="text-xs text-gray-500">hace 2m</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span className="text-sm">Login de administrador: admin@eventu.co</span>
              </div>
              <span className="text-xs text-gray-500">hace 3m</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
