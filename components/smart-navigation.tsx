"use client"

import { useAuth } from "@/lib/auth-guard"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  Home, 
  User, 
  Settings, 
  LogOut, 
  Calendar, 
  BarChart3, 
  Users, 
  FileText,
  Crown,
  Building2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function SmartNavigation() {
  const { user, role, logout } = useAuth()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión exitosamente.",
      variant: "default",
    })
    router.push("/")
  }

  if (!user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/login">
          <Button variant="ghost">Iniciar Sesión</Button>
        </Link>
        <Link href="/registro">
          <Button>Registrarse</Button>
        </Link>
      </div>
    )
  }

  const getNavigationItems = () => {
    switch (role) {
      case "admin":
        return [
          {
            href: "/admin",
            label: "Dashboard Admin",
            icon: Crown,
            description: "Panel de administración"
          },
          {
            href: "/admin/eventos",
            label: "Eventos",
            icon: Calendar,
            description: "Gestionar eventos"
          },
          {
            href: "/admin/usuarios",
            label: "Usuarios",
            icon: Users,
            description: "Gestionar usuarios"
          },
          {
            href: "/admin/reportes",
            label: "Reportes",
            icon: BarChart3,
            description: "Ver reportes"
          },
          {
            href: "/admin/configuracion",
            label: "Configuración",
            icon: Settings,
            description: "Configurar sistema"
          }
        ]

      case "organizer":
        return [
          {
            href: "/organizer",
            label: "Dashboard Organizador",
            icon: Building2,
            description: "Panel de organizador"
          },
          {
            href: "/organizer/eventos",
            label: "Mis Eventos",
            icon: Calendar,
            description: "Gestionar mis eventos"
          },
          {
            href: "/organizer/ventas",
            label: "Ventas",
            icon: BarChart3,
            description: "Ver ventas"
          },
          {
            href: "/organizer/asistentes",
            label: "Asistentes",
            icon: Users,
            description: "Gestionar asistentes"
          },
          {
            href: "/organizer/analytics",
            label: "Analíticas",
            icon: BarChart3,
            description: "Ver métricas"
          }
        ]

      case "user":
      default:
        return [
          {
            href: "/",
            label: "Inicio",
            icon: Home,
            description: "Página principal"
          },
          {
            href: "/eventos",
            label: "Eventos",
            icon: Calendar,
            description: "Ver eventos"
          },
          {
            href: "/mi-cuenta",
            label: "Mi Cuenta",
            icon: User,
            description: "Mi perfil"
          },
          {
            href: "/mi-cuenta/boletos",
            label: "Mis Boletos",
            icon: FileText,
            description: "Ver mis boletos"
          }
        ]
    }
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="flex items-center gap-4">
      {/* User Info */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Hola, {user.name}</span>
        <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
          {role === "admin" && "Administrador"}
          {role === "organizer" && "Organizador"}
          {role === "user" && "Usuario"}
        </span>
      </div>

      {/* Navigation Links */}
      <div className="hidden md:flex items-center gap-2">
        {navigationItems.slice(0, 3).map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            </Link>
          )
        })}
      </div>

      {/* Dropdown for more options */}
      <div className="relative group">
        <Button variant="outline" size="sm">
          Más opciones
        </Button>
        <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
          <div className="p-2">
            {navigationItems.slice(3).map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href}>
                  <div className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium text-sm">{item.label}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </div>
                </Link>
              )
            })}
            <div className="border-t border-gray-200 mt-2 pt-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md transition-colors w-full text-left"
              >
                <LogOut className="h-4 w-4 text-red-500" />
                <div>
                  <div className="font-medium text-sm text-red-600">Cerrar Sesión</div>
                  <div className="text-xs text-gray-500">Salir de la cuenta</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <Button variant="outline" size="sm" onClick={handleLogout}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}

// Componente para mostrar el panel de acceso rápido basado en rol
export function QuickAccessPanel() {
  const { user, role } = useAuth()

  if (!user) return null

  const getQuickAccessItems = () => {
    switch (role) {
      case "admin":
        return [
          { href: "/admin/eventos/crear", label: "Crear Evento", icon: Calendar },
          { href: "/admin/usuarios/crear", label: "Crear Usuario", icon: Users },
          { href: "/admin/reportes", label: "Ver Reportes", icon: BarChart3 },
          { href: "/admin/configuracion", label: "Configuración", icon: Settings }
        ]

      case "organizer":
        return [
          { href: "/organizer/eventos", label: "Mis Eventos", icon: Calendar },
          { href: "/organizer/ventas", label: "Ventas", icon: BarChart3 },
          { href: "/organizer/asistentes", label: "Asistentes", icon: Users },
          { href: "/organizer/checkin", label: "Check-in", icon: FileText }
        ]

      case "user":
      default:
        return [
          { href: "/eventos", label: "Ver Eventos", icon: Calendar },
          { href: "/mi-cuenta/boletos", label: "Mis Boletos", icon: FileText },
          { href: "/mi-cuenta", label: "Mi Cuenta", icon: User }
        ]
    }
  }

  const quickAccessItems = getQuickAccessItems()

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Acceso Rápido</h3>
      <div className="grid grid-cols-2 gap-2">
        {quickAccessItems.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md transition-colors">
                <Icon className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
