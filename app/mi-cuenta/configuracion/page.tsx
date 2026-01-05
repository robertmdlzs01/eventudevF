"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Bell, 
  Shield, 
  Save,
  Eye,
  EyeOff
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface UserSettings {
  firstName: string
  lastName: string
  email: string
  phone: string
  currentPassword: string
  newPassword: string
  confirmPassword: string
  emailNotifications: boolean
  smsNotifications: boolean
  marketingEmails: boolean
  twoFactorAuth: boolean
  publicProfile: boolean
}

export default function ConfiguracionCuentaPage() {
  const [settings, setSettings] = useState<UserSettings>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    twoFactorAuth: false,
    publicProfile: false
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPasswords, setShowPasswords] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token")
      const userStr = localStorage.getItem("current_user")
      
      if (!token || !userStr) {
        router.push("/login")
        return
      }

      try {
        const user = JSON.parse(userStr)
        setSettings(prev => ({
          ...prev,
          firstName: user.first_name || "",
          lastName: user.last_name || "",
          email: user.email || "",
          phone: user.phone || ""
        }))
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/login")
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    
    // Simular guardado
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    toast({
      title: "Configuración guardada",
      description: "Tus cambios han sido guardados exitosamente.",
      variant: "default",
    })
    
    setSaving(false)
  }

  const handlePasswordChange = async () => {
    if (settings.newPassword !== settings.confirmPassword) {
      toast({
        title: "Error",
        description: "Las contraseñas no coinciden.",
        variant: "destructive",
      })
      return
    }

    if (settings.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "La nueva contraseña debe tener al menos 6 caracteres.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    
    try {
      const response = await apiClient.changePassword(settings.currentPassword, settings.newPassword)
      
      if (response.success) {
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente.",
          variant: "default",
        })
        
        setSettings(prev => ({
          ...prev,
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        }))
      } else {
        toast({
          title: "Error al cambiar contraseña",
          description: response.error || "No se pudo cambiar la contraseña.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor.",
        variant: "destructive",
      })
    }
    
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configuración de Cuenta</h1>
        <p className="text-gray-600">Gestiona tu información personal y preferencias</p>
      </div>

      <div className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tu información personal básica
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={settings.firstName}
                  onChange={(e) => setSettings(prev => ({ ...prev, firstName: e.target.value }))}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={settings.lastName}
                  onChange={(e) => setSettings(prev => ({ ...prev, lastName: e.target.value }))}
                  placeholder="Tu apellido"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => setSettings(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="tu@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={settings.phone}
                  onChange={(e) => setSettings(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </CardContent>
        </Card>

        {/* Cambio de Contraseña */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña de acceso
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords ? "text" : "password"}
                  value={settings.currentPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Tu contraseña actual"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPasswords(!showPasswords)}
                >
                  {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input
                  id="newPassword"
                  type={showPasswords ? "text" : "password"}
                  value={settings.newPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Nueva contraseña"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  value={settings.confirmPassword}
                  onChange={(e) => setSettings(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirmar nueva contraseña"
                />
              </div>
            </div>
            <Button onClick={handlePasswordChange} disabled={saving}>
              <Lock className="h-4 w-4 mr-2" />
              {saving ? "Cambiando..." : "Cambiar Contraseña"}
            </Button>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Configura cómo quieres recibir las notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="emailNotifications">Notificaciones por Email</Label>
                <p className="text-sm text-gray-500">Recibe notificaciones importantes por email</p>
              </div>
              <Switch
                id="emailNotifications"
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, emailNotifications: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="smsNotifications">Notificaciones por SMS</Label>
                <p className="text-sm text-gray-500">Recibe alertas importantes por mensaje de texto</p>
              </div>
              <Switch
                id="smsNotifications"
                checked={settings.smsNotifications}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, smsNotifications: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="marketingEmails">Emails de Marketing</Label>
                <p className="text-sm text-gray-500">Recibe ofertas especiales y novedades</p>
              </div>
              <Switch
                id="marketingEmails"
                checked={settings.marketingEmails}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, marketingEmails: checked }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Configura las opciones de seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="twoFactorAuth">Autenticación de Dos Factores</Label>
                <p className="text-sm text-gray-500">Añade una capa extra de seguridad a tu cuenta</p>
              </div>
              <Switch
                id="twoFactorAuth"
                checked={settings.twoFactorAuth}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, twoFactorAuth: checked }))}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="publicProfile">Perfil Público</Label>
                <p className="text-sm text-gray-500">Permite que otros usuarios vean tu perfil</p>
              </div>
              <Switch
                id="publicProfile"
                checked={settings.publicProfile}
                onCheckedChange={(checked) => setSettings(prev => ({ ...prev, publicProfile: checked }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
