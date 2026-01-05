"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  User, 
  Calendar, 
  FileText, 
  Settings, 
  LogOut, 
  Crown, 
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock
} from "lucide-react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

interface UserData {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  phone?: string
  created_at: string
  last_login?: string
}

export default function MiCuentaClient() {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("auth_token")
      const userStr = localStorage.getItem("current_user")
      
      if (!token || !userStr) {
        router.push("/login")
        return
      }

      try {
        const userData = JSON.parse(userStr)
        setUser(userData)
      } catch (error) {
        console.error("Error parsing user data:", error)
        router.push("/login")
      }
      
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("userRole")
    localStorage.removeItem("redirectUrl")
    localStorage.removeItem("welcomeMessage")
    localStorage.removeItem("eventu_user_id")
    // Limpiar carrito al hacer logout
    localStorage.removeItem("eventu_cart")
    localStorage.removeItem("eventu_cart_user_id")
    
    apiClient.logout()
    window.dispatchEvent(new Event("authStateChanged"))
    router.push("/")
  }

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return { label: "Administrador", icon: Crown, color: "bg-red-100 text-red-800" }
      case "organizer":
        return { label: "Organizador", icon: Building2, color: "bg-blue-100 text-blue-800" }
      case "user":
        return { label: "Usuario", icon: User, color: "bg-green-100 text-green-800" }
      default:
        return { label: "Usuario", icon: User, color: "bg-gray-100 text-gray-800" }
    }
  }

  const getNavigationItems = () => {
    if (!user) return []

    switch (user.role) {
      case "admin":
        return [
          { href: "/admin", label: "Dashboard Admin", icon: Crown, description: "Panel de administración" },
          { href: "/admin/eventos", label: "Gestionar Eventos", icon: Calendar, description: "Administrar eventos" },
          { href: "/admin/usuarios", label: "Gestionar Usuarios", icon: User, description: "Administrar usuarios" },
          { href: "/admin/reportes", label: "Reportes", icon: FileText, description: "Ver reportes" },
          { href: "/admin/configuracion", label: "Configuración", icon: Settings, description: "Configurar sistema" }
        ]
      case "organizer":
        return [
          { href: "/organizer", label: "Dashboard Organizador", icon: Building2, description: "Panel de organizador" },
          { href: "/organizer/eventos", label: "Mis Eventos", icon: Calendar, description: "Gestionar mis eventos" },
          { href: "/organizer/ventas", label: "Ventas", icon: FileText, description: "Ver ventas" },
          { href: "/organizer/asistentes", label: "Asistentes", icon: User, description: "Gestionar asistentes" },
          { href: "/organizer/analytics", label: "Analíticas", icon: FileText, description: "Ver métricas" }
        ]
      default:
        return [
          { href: "/eventos", label: "Ver Eventos", icon: Calendar, description: "Explorar eventos" },
          { href: "/mi-cuenta/boletos", label: "Mis Boletos", icon: FileText, description: "Ver mis boletos" },
          { href: "/mi-cuenta/historial-compras", label: "Historial de Compras", icon: FileText, description: "Ver historial" }
        ]
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const roleInfo = getRoleDisplay(user.role)
  const navigationItems = getNavigationItems()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mi Cuenta</h1>
        <p className="text-gray-600">Gestiona tu perfil y accede a tus herramientas</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información del Usuario */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Nombre completo</span>
                <span className="text-sm text-gray-900">{user.first_name} {user.last_name}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Email</span>
                <span className="text-sm text-gray-900">{user.email}</span>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Rol</span>
                <Badge className={roleInfo.color}>
                  <roleInfo.icon className="h-3 w-3 mr-1" />
                  {roleInfo.label}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Estado</span>
                <Badge variant={user.status === "active" ? "default" : "secondary"}>
                  {user.status === "active" ? "Activo" : "Inactivo"}
                </Badge>
              </div>
              
              {user.phone && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Teléfono</span>
                    <span className="text-sm text-gray-900">{user.phone}</span>
                  </div>
                </>
              )}
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Miembro desde</span>
                <span className="text-sm text-gray-900">
                  {new Date(user.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              
              {user.last_login && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">Último acceso</span>
                    <span className="text-sm text-gray-900">
                      {new Date(user.last_login).toLocaleDateString('es-ES')}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Navegación y Acciones */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Acceso Rápido</CardTitle>
              <CardDescription>
                Accede rápidamente a las funciones principales de tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {navigationItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <Button
                      key={item.href}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start gap-2 hover:bg-gray-50"
                      onClick={() => router.push(item.href)}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <p className="text-xs text-gray-500 text-left">{item.description}</p>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Acciones de Cuenta */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Acciones de Cuenta</CardTitle>
              <CardDescription>
                Gestiona tu cuenta y configuración
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push("/mi-cuenta/configuracion")}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configuración de Cuenta
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push("/mi-cuenta/preferencias-email")}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Preferencias de Email
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push("/mi-cuenta/notificaciones")}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Configuración de Notificaciones
                </Button>
                <Button 
                  variant="outline" 
                  className="justify-start"
                  onClick={() => router.push("/mi-cuenta/contacto")}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Información de Contacto
                </Button>
              </div>
              
              <Separator />
              
              <Button 
                variant="destructive" 
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
