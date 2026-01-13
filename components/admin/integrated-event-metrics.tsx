"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'
import { 
  Ticket, 
  DollarSign, 
  TrendingUp, 
  Mail, 
  Printer, 
  CheckCircle2, 
  XCircle,
  Package,
  Users,
  Calendar
} from 'lucide-react'

interface EventMetrics {
  event_id: number
  event_name: string
  event_date: string
  event_venue: string
  ticket_types_count: number
  total_capacity: number
  total_sold: number
  total_available: number
  completed_sales_count: number
  pending_sales_count: number
  failed_attempts_count: number
  total_tickets_sold_quantity: number
  digital_tickets_count: number
  physical_tickets_count: number
  printed_tickets_count: number
  email_sent_count: number
  email_delivered_count: number
  total_revenue: number
}

interface IntegratedEventMetricsProps {
  eventId: string | number
  className?: string
}

export function IntegratedEventMetrics({ eventId, className }: IntegratedEventMetricsProps) {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMetrics()
  }, [eventId])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getEventMetrics(eventId)
      if (response.success && response.data) {
        setMetrics(response.data)
      } else {
        toast.error('Error al cargar métricas del evento')
      }
    } catch (error) {
      console.error('Error cargando métricas:', error)
      toast.error('Error al cargar métricas del evento')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={className}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-20 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <Card className={className}>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No hay métricas disponibles para este evento</p>
        </CardContent>
      </Card>
    )
  }

  const salesRate = metrics.total_capacity > 0 
    ? ((metrics.total_sold / metrics.total_capacity) * 100).toFixed(1)
    : '0'

  const digitalPercentage = metrics.total_tickets_sold_quantity > 0
    ? ((metrics.digital_tickets_count / metrics.total_tickets_sold_quantity) * 100).toFixed(1)
    : '0'

  const physicalPercentage = metrics.total_tickets_sold_quantity > 0
    ? ((metrics.physical_tickets_count / metrics.total_tickets_sold_quantity) * 100).toFixed(1)
    : '0'

  const emailDeliveryRate = metrics.email_sent_count > 0
    ? ((metrics.email_delivered_count / metrics.email_sent_count) * 100).toFixed(1)
    : '0'

  return (
    <div className={className}>
      {/* Estadísticas Principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vendido</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_sold}</div>
            <p className="text-xs text-muted-foreground">
              de {metrics.total_capacity} disponibles ({salesRate}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${new Intl.NumberFormat('es-CO').format(metrics.total_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.completed_sales_count} ventas completadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tipos de Boletos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.ticket_types_count}</div>
            <p className="text-xs text-muted-foreground">
              categorías diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.completed_sales_count + metrics.pending_sales_count + metrics.failed_attempts_count > 0
                ? ((metrics.completed_sales_count / (metrics.completed_sales_count + metrics.pending_sales_count + metrics.failed_attempts_count)) * 100).toFixed(1)
                : '0'}%
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.pending_sales_count} pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribución de Boletos */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución de Boletos
            </CardTitle>
            <CardDescription>
              Boletos digitales vs. físicos vendidos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Digitales</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metrics.digital_tickets_count}</span>
                  <Badge variant="outline">{digitalPercentage}%</Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${digitalPercentage}%` }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">Físicos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metrics.physical_tickets_count}</span>
                  <Badge variant="outline">{physicalPercentage}%</Badge>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${physicalPercentage}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Boletos Vendidos:</span>
                <span className="font-bold">{metrics.total_tickets_sold_quantity}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Estado de Entregas
            </CardTitle>
            <CardDescription>
              Boletos enviados por email e impresos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Emails Enviados</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metrics.email_sent_count}</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    {emailDeliveryRate}% entregados
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{metrics.email_delivered_count} entregados exitosamente</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Printer className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">Boletos Impresos</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">{metrics.printed_tickets_count}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Ventas Completadas:</span>
                <Badge variant="default">{metrics.completed_sales_count}</Badge>
              </div>
              {metrics.pending_sales_count > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Ventas Pendientes:</span>
                  <Badge variant="secondary">{metrics.pending_sales_count}</Badge>
                </div>
              )}
              {metrics.failed_attempts_count > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Intentos Fallidos:</span>
                  <Badge variant="destructive">{metrics.failed_attempts_count}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
