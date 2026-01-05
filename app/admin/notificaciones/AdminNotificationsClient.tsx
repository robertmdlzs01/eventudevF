"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Bell, Send, Users, Target, Clock, CheckCircle, AlertCircle, XCircle } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: "info" | "success" | "warning" | "error"
  target: "all" | "admins" | "organizers" | "users" | "specific"
  recipients?: string[]
  sentAt: string
  readBy: string[]
  status: "sent" | "delivered" | "failed"
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Nuevo evento publicado",
    message: "El evento 'Conferencia Tech 2024' ha sido publicado exitosamente",
    type: "success",
    target: "all",
    sentAt: "2024-08-25T10:30:00Z",
    readBy: ["user1", "user2"],
    status: "delivered"
  },
  {
    id: "2",
    title: "Mantenimiento programado",
    message: "El sistema estará en mantenimiento el próximo domingo de 2:00 AM a 4:00 AM",
    type: "warning",
    target: "admins",
    sentAt: "2024-08-25T09:15:00Z",
    readBy: ["admin1"],
    status: "sent"
  },
  {
    id: "3",
    title: "Error en el sistema",
    message: "Se ha detectado un problema con el procesamiento de pagos",
    type: "error",
    target: "admins",
    sentAt: "2024-08-25T08:45:00Z",
    readBy: [],
    status: "failed"
  }
]

export default function AdminNotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [newNotification, setNewNotification] = useState({
    title: "",
    message: "",
    type: "info" as const,
    target: "all" as const,
    recipients: [] as string[]
  })

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast({
        title: "Error",
        description: "Título y mensaje son requeridos",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)
    try {
      // Simular envío de notificación
      await new Promise(resolve => setTimeout(resolve, 1000))

      const notification: Notification = {
        id: Date.now().toString(),
        title: newNotification.title,
        message: newNotification.message,
        type: newNotification.type,
        target: newNotification.target,
        recipients: newNotification.recipients,
        sentAt: new Date().toISOString(),
        readBy: [],
        status: "sent"
      }

      setNotifications(prev => [notification, ...prev])
      setNewNotification({ title: "", message: "", type: "info", target: "all", recipients: [] })
      setShowCreateDialog(false)

      toast({
        title: "Notificación enviada",
        description: "La notificación ha sido enviada exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al enviar la notificación",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNotification = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta notificación?")) return

    try {
      setNotifications(prev => prev.filter(n => n.id !== id))
      toast({
        title: "Notificación eliminada",
        description: "La notificación ha sido eliminada exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar la notificación",
        variant: "destructive"
      })
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-blue-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    const variants = {
      info: "default",
      success: "default",
      warning: "secondary",
      error: "destructive"
    } as const

    const labels = {
      info: "Información",
      success: "Éxito",
      warning: "Advertencia",
      error: "Error"
    }

    return <Badge variant={variants[type as keyof typeof variants]}>{labels[type as keyof typeof labels]}</Badge>
  }

  const getTargetLabel = (target: string) => {
    const labels = {
      all: "Todos los usuarios",
      admins: "Administradores",
      organizers: "Organizadores",
      users: "Usuarios",
      specific: "Usuarios específicos"
    }
    return labels[target as keyof typeof labels] || target
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notificaciones Push</h1>
          <p className="text-gray-600">Gestiona las notificaciones en tiempo real del sistema</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Send className="h-4 w-4 mr-2" />
              Nueva Notificación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Notificación</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={newNotification.title}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título de la notificación"
                />
              </div>
              <div>
                <Label>Mensaje</Label>
                <Textarea
                  value={newNotification.message}
                  onChange={(e) => setNewNotification(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Mensaje de la notificación"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Tipo</Label>
                  <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Información</SelectItem>
                      <SelectItem value="success">Éxito</SelectItem>
                      <SelectItem value="warning">Advertencia</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destinatarios</Label>
                  <Select value={newNotification.target} onValueChange={(value: any) => setNewNotification(prev => ({ ...prev, target: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los usuarios</SelectItem>
                      <SelectItem value="admins">Administradores</SelectItem>
                      <SelectItem value="organizers">Organizadores</SelectItem>
                      <SelectItem value="users">Usuarios</SelectItem>
                      <SelectItem value="specific">Usuarios específicos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateNotification} disabled={isLoading}>
                  {isLoading ? "Enviando..." : "Enviar Notificación"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {notifications.map((notification) => (
          <Card key={notification.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(notification.type)}
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <span>{notification.title}</span>
                      {getTypeBadge(notification.type)}
                    </CardTitle>
                    <p className="text-gray-600">{getTargetLabel(notification.target)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(notification.sentAt).toLocaleString()}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteNotification(notification.id)}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">{notification.message}</p>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Estado: {notification.status}</span>
                <span>Leído por: {notification.readBy.length} usuarios</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {notifications.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No hay notificaciones</h3>
            <p className="text-gray-600 mb-4">Crea tu primera notificación push</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Send className="w-4 h-4 mr-2" />
              Nueva Notificación
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
