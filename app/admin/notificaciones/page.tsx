import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Bell, 
  Mail, 
  Settings, 
  Plus, 
  Edit, 
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react"

export default function NotificationsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Notificaciones</h1>
          <p className="text-gray-600">Gestionar notificaciones y emails automáticos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nueva Notificación
          </Button>
        </div>
      </div>

      {/* Métricas de Notificaciones */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas Hoy</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Notificaciones enviadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              En cola de envío
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exitosas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Entregadas correctamente
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fallidas</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Con errores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Plantillas de Notificación */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas de Notificación</CardTitle>
          <CardDescription>Gestionar plantillas de emails y notificaciones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Plantilla de Confirmación de Venta */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <CardTitle className="text-lg">Confirmación de Venta</CardTitle>
                </div>
                <CardDescription>Email de confirmación de compra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Ventas</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía automáticamente cuando se confirma una venta
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plantilla de Entrega de Ticket */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-500" />
                  <CardTitle className="text-lg">Entrega de Ticket</CardTitle>
                </div>
                <CardDescription>Email con ticket adjunto</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Tickets</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía cuando el ticket está listo para descargar
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plantilla de Pago Fallido */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-500" />
                  <CardTitle className="text-lg">Pago Fallido</CardTitle>
                </div>
                <CardDescription>Notificación de pago no procesado</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Pagos</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía cuando un pago no puede ser procesado
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plantilla de Reembolso */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-orange-500" />
                  <CardTitle className="text-lg">Reembolso Procesado</CardTitle>
                </div>
                <CardDescription>Confirmación de reembolso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Pagos</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía cuando se procesa un reembolso
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plantilla de Recordatorio */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-purple-500" />
                  <CardTitle className="text-lg">Recordatorio de Evento</CardTitle>
                </div>
                <CardDescription>Recordatorio antes del evento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Eventos</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía 24 horas antes del evento
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Plantilla de Alerta del Sistema */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <CardTitle className="text-lg">Alerta del Sistema</CardTitle>
                </div>
                <CardDescription>Notificaciones del sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Email</Badge>
                  <Badge variant="secondary">Sistema</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Se envía para alertas del sistema
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Send className="w-3 h-3 mr-1" />
                    Probar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}