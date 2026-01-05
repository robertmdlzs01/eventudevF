"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Bell, Smartphone, Mail, Globe, Clock, Volume2, VolumeX } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface NotificationSettings {
  pushNotifications: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  browserNotifications: boolean
  soundEnabled: boolean
  quietHours: boolean
  quietHoursStart: string
  quietHoursEnd: string
  eventReminders: boolean
  purchaseConfirmations: boolean
  securityAlerts: boolean
  marketingNotifications: boolean
  socialUpdates: boolean
  systemUpdates: boolean
}

export default function NotificacionesPage() {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    browserNotifications: true,
    soundEnabled: true,
    quietHours: false,
    quietHoursStart: "22:00",
    quietHoursEnd: "08:00",
    eventReminders: true,
    purchaseConfirmations: true,
    securityAlerts: true,
    marketingNotifications: false,
    socialUpdates: true,
    systemUpdates: true
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Cargar configuración guardada
    const savedSettings = localStorage.getItem("notification_settings")
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (error) {
        console.error("Error loading notification settings:", error)
      }
    }
  }, [])

  const handleToggle = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleTimeChange = (key: 'quietHoursStart' | 'quietHoursEnd', value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Simular guardado en backend
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Guardar en localStorage
      localStorage.setItem("notification_settings", JSON.stringify(settings))
      
      toast({
        title: "Configuración guardada",
        description: "Tus preferencias de notificaciones se han actualizado correctamente.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar la configuración. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleTestNotification = () => {
    if (settings.browserNotifications) {
      if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Eventu', {
              body: 'Esta es una notificación de prueba',
              icon: '/images/eventu-logo.svg'
            })
            toast({
              title: "Notificación enviada",
              description: "Se ha enviado una notificación de prueba.",
              variant: "default",
            })
          }
        })
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Notificaciones</h1>
        <p className="text-gray-600">
          Personaliza cómo y cuándo recibes notificaciones
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Panel principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Canales de notificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Canales de Notificación
              </CardTitle>
              <CardDescription>
                Selecciona cómo quieres recibir las notificaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">Notificaciones Push</Label>
                    <p className="text-xs text-gray-500">Notificaciones en tu dispositivo móvil</p>
                  </div>
                </div>
                <Switch
                  checked={settings.pushNotifications}
                  onCheckedChange={() => handleToggle("pushNotifications")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="text-sm font-medium">Notificaciones por Email</Label>
                    <p className="text-xs text-gray-500">Recibe notificaciones en tu correo</p>
                  </div>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={() => handleToggle("emailNotifications")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="text-sm font-medium">Notificaciones SMS</Label>
                    <p className="text-xs text-gray-500">Mensajes de texto importantes</p>
                  </div>
                </div>
                <Switch
                  checked={settings.smsNotifications}
                  onCheckedChange={() => handleToggle("smsNotifications")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <div>
                    <Label className="text-sm font-medium">Notificaciones del Navegador</Label>
                    <p className="text-xs text-gray-500">Alertas en tu navegador web</p>
                  </div>
                </div>
                <Switch
                  checked={settings.browserNotifications}
                  onCheckedChange={() => handleToggle("browserNotifications")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuración de sonido y horarios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Sonido y Horarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-gray-400" />
                  )}
                  <div>
                    <Label className="text-sm font-medium">Sonido de Notificaciones</Label>
                    <p className="text-xs text-gray-500">Reproducir sonido al recibir notificaciones</p>
                  </div>
                </div>
                <Switch
                  checked={settings.soundEnabled}
                  onCheckedChange={() => handleToggle("soundEnabled")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <div>
                    <Label className="text-sm font-medium">Horas Silenciosas</Label>
                    <p className="text-xs text-gray-500">No recibir notificaciones en horarios específicos</p>
                  </div>
                </div>
                <Switch
                  checked={settings.quietHours}
                  onCheckedChange={() => handleToggle("quietHours")}
                />
              </div>

              {settings.quietHours && (
                <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-gray-50">
                  <div>
                    <Label className="text-sm font-medium">Inicio</Label>
                    <Select value={settings.quietHoursStart} onValueChange={(value) => handleTimeChange('quietHoursStart', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 24}, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Fin</Label>
                    <Select value={settings.quietHoursEnd} onValueChange={(value) => handleTimeChange('quietHoursEnd', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({length: 24}, (_, i) => (
                          <SelectItem key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                            {`${i.toString().padStart(2, '0')}:00`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tipos de notificación */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Tipos de Notificación
              </CardTitle>
              <CardDescription>
                Selecciona qué tipos de notificaciones quieres recibir
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <div>
                    <Label className="text-sm font-medium">Recordatorios de Eventos</Label>
                    <p className="text-xs text-gray-500">Recordatorios antes de tus eventos</p>
                  </div>
                </div>
                <Switch
                  checked={settings.eventReminders}
                  onCheckedChange={() => handleToggle("eventReminders")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-green-600" />
                  <div>
                    <Label className="text-sm font-medium">Confirmaciones de Compra</Label>
                    <p className="text-xs text-gray-500">Confirmación cuando compres boletos</p>
                  </div>
                </div>
                <Switch
                  checked={settings.purchaseConfirmations}
                  onCheckedChange={() => handleToggle("purchaseConfirmations")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-red-600" />
                  <div>
                    <Label className="text-sm font-medium">Alertas de Seguridad</Label>
                    <p className="text-xs text-gray-500">Notificaciones sobre la seguridad de tu cuenta</p>
                  </div>
                </div>
                <Switch
                  checked={settings.securityAlerts}
                  onCheckedChange={() => handleToggle("securityAlerts")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-purple-600" />
                  <div>
                    <Label className="text-sm font-medium">Notificaciones de Marketing</Label>
                    <p className="text-xs text-gray-500">Ofertas y promociones</p>
                  </div>
                </div>
                <Switch
                  checked={settings.marketingNotifications}
                  onCheckedChange={() => handleToggle("marketingNotifications")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Globe className="h-5 w-5 text-orange-600" />
                  <div>
                    <Label className="text-sm font-medium">Actualizaciones Sociales</Label>
                    <p className="text-xs text-gray-500">Actividad de amigos y eventos sociales</p>
                  </div>
                </div>
                <Switch
                  checked={settings.socialUpdates}
                  onCheckedChange={() => handleToggle("socialUpdates")}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <div>
                    <Label className="text-sm font-medium">Actualizaciones del Sistema</Label>
                    <p className="text-xs text-gray-500">Nuevas funciones y mejoras</p>
                  </div>
                </div>
                <Switch
                  checked={settings.systemUpdates}
                  onCheckedChange={() => handleToggle("systemUpdates")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="w-full"
              >
                {saving ? "Guardando..." : "Guardar Configuración"}
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleTestNotification}
                className="w-full"
              >
                Probar Notificación
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Información</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Las alertas de seguridad siempre se envían</p>
                <p>• Las horas silenciosas respetan tu zona horaria</p>
                <p>• Puedes cambiar estas configuraciones en cualquier momento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
