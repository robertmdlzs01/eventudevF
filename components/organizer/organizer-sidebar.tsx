"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  BarChart3,
  Calendar,
  Users,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  Home,
} from "lucide-react"

const navigation = [
  {
    name: "Dashboard",
    href: "/organizer",
    icon: Home,
    description: "Vista general de tus eventos",
    badge: null,
  },
  {
    name: "Mis Eventos",
    href: "/organizer/eventos",
    icon: Calendar,
    description: "Eventos asignados a tu gestión",
    badge: null,
  },
  {
    name: "Ventas",
    href: "/organizer/ventas",
    icon: DollarSign,
    description: "Seguimiento de ventas y ingresos",
    badge: null,
  },
  {
    name: "Asistentes",
    href: "/organizer/asistentes",
    icon: Users,
    description: "Gestión de participantes",
    badge: null,
  },
  {
    name: "Analíticas",
    href: "/organizer/analytics",
    icon: BarChart3,
    description: "Métricas y rendimiento",
    badge: null,
  },
  {
    name: "Reportes",
    href: "/organizer/reportes",
    icon: FileText,
    description: "Informes detallados",
    badge: null,
  },
]



export default function OrganizerSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-semibold text-gray-900">Organizador</span>
        </div>
      </div>





      {/* Navigation */}
      <nav className="flex-1 px-6 py-4 space-y-1 overflow-y-auto">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Navegación</h3>
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={`group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"}`}
                  />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500 group-hover:text-gray-600">{item.description}</p>
                  </div>
                </div>
                {item.badge && (
                  <Badge
                    variant={isActive ? "default" : "secondary"}
                    className={`text-xs ${
                      isActive ? "bg-blue-100 text-blue-700 hover:bg-blue-100" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-gray-200">
        <div className="space-y-2">
          <Link href="/organizer/configuracion">
            <Button variant="ghost" className="w-full justify-start text-gray-700 hover:text-gray-900">
              <Settings className="h-4 w-4 mr-3" />
              Configuración
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-3" />
            Cerrar Sesión
          </Button>
        </div>

      </div>
    </div>
  )
}
