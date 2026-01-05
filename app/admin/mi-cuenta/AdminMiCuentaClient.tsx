"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Shield, 
  Settings, 
  Lock, 
  Mail, 
  Phone, 
  Calendar,
  Activity,
  Bell,
  Key,
  Eye,
  EyeOff,
  Save,
  Edit,
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  status: string
  created_at: string
  last_login?: string
  is_2fa_enabled?: boolean
  email_verified_at?: string
}

export default function AdminMiCuentaClient() {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeSection, setActiveSection] = useState("profile")
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const loadUserData = () => {
      try {
        const currentUser = localStorage.getItem('current_user')
        if (currentUser) {
          const userData = JSON.parse(currentUser)
          setUser(userData)
        } else {
          // Si no hay usuario, redirigir al login
          router.push('/login')
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    loadUserData()
  }, [router])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Activo</Badge>
      case 'inactive':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800">Inactivo</Badge>
      case 'suspended':
        return <Badge variant="destructive">Suspendido</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Administrador</Badge>
      case 'super_admin':
        return <Badge variant="default" className="bg-purple-100 text-purple-800">Super Administrador</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No se pudo cargar tu cuenta</h2>
          <p className="text-muted-foreground mb-4">Por favor, inicia sesión nuevamente.</p>
          <Button asChild>
            <Link href="/login">Ir al Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi Cuenta de Administrador</h1>
          <p className="text-muted-foreground">
            Gestiona tu perfil y configuración de administrador
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navegación</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant={activeSection === "profile" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("profile")}
              >
                <User className="mr-2 h-4 w-4" />
                Perfil
              </Button>
              <Button
                variant={activeSection === "security" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("security")}
              >
                <Lock className="mr-2 h-4 w-4" />
                Seguridad
              </Button>
              <Button
                variant={activeSection === "notifications" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("notifications")}
              >
                <Bell className="mr-2 h-4 w-4" />
                Notificaciones
              </Button>
              <Button
                variant={activeSection === "activity" ? "default" : "ghost"}
                className="w-full justify-start"
                onClick={() => setActiveSection("activity")}
              >
                <Activity className="mr-2 h-4 w-4" />
                Actividad
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeSection === "profile" && (
            <div className="space-y-6">
              {/* Profile Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Perfil
                  </CardTitle>
                  <CardDescription>
                    Datos personales y de contacto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Nombre Completo</label>
                        <p className="text-lg font-semibold">{user.first_name} {user.last_name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Correo Electrónico</label>
                        <p className="text-lg font-semibold flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {user.email}
                          {user.email_verified_at && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                        <p className="text-lg font-semibold flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {user.phone || "No especificado"}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Rol</label>
                        <div className="mt-1">
                          {getRoleBadge(user.role)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estado</label>
                        <div className="mt-1">
                          {getStatusBadge(user.status)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Miembro desde</label>
                        <p className="text-lg font-semibold flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {formatDate(user.created_at)}
                        </p>
                      </div>
                      {user.last_login && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Último acceso</label>
                          <p className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-4 w-4" />
                            {formatDate(user.last_login)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 flex gap-2">
                    <Button asChild>
                      <Link href="/admin/mi-cuenta/editar-perfil">
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Perfil
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/admin/mi-cuenta/cambiar-contrasena">
                        <Key className="mr-2 h-4 w-4" />
                        Cambiar Contraseña
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Estado de Seguridad
                  </CardTitle>
                  <CardDescription>
                    Configuraciones de seguridad de tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="font-medium">Verificación de Email</p>
                          <p className="text-sm text-muted-foreground">
                            {user.email_verified_at ? "Email verificado" : "Email no verificado"}
                          </p>
                        </div>
                      </div>
                      {user.email_verified_at ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button size="sm" variant="outline">
                          Verificar
                        </Button>
                      )}
                    </div>
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-purple-500" />
                        <div>
                          <p className="font-medium">Autenticación de Dos Factores</p>
                          <p className="text-sm text-muted-foreground">
                            {user.is_2fa_enabled ? "Activada" : "No activada"}
                          </p>
                        </div>
                      </div>
                      {user.is_2fa_enabled ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button size="sm" variant="outline">
                          Activar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "security" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Configuración de Seguridad
                </CardTitle>
                <CardDescription>
                  Gestiona la seguridad de tu cuenta de administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Button asChild className="h-auto p-4 flex flex-col items-center gap-2">
                      <Link href="/admin/mi-cuenta/cambiar-contrasena">
                        <Key className="h-6 w-6" />
                        <span>Cambiar Contraseña</span>
                      </Link>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Shield className="h-6 w-6" />
                      <span>Configurar 2FA</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Activity className="h-6 w-6" />
                      <span>Sesiones Activas</span>
                    </Button>
                    <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                      <Bell className="h-6 w-6" />
                      <span>Alertas de Seguridad</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Configuración de Notificaciones
                </CardTitle>
                <CardDescription>
                  Gestiona cómo recibes las notificaciones del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Configuración de notificaciones para administradores en desarrollo...
                </p>
              </CardContent>
            </Card>
          )}

          {activeSection === "activity" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Actividad Reciente
                </CardTitle>
                <CardDescription>
                  Historial de actividades en tu cuenta de administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Historial de actividad para administradores en desarrollo...
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
