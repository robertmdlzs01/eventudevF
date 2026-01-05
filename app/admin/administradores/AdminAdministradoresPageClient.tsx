"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  Mail,
  Phone,
  Calendar
} from "lucide-react"
import Link from "next/link"
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
  lastLogin: string
}

interface AdminAdministradoresPageClientProps {
  adminsData: {
    users: AdminUser[]
    pagination: {
      total: number
      page: number
      limit: number
      totalPages: number
    }
  }
}

export default function AdminAdministradoresPageClient({ adminsData }: AdminAdministradoresPageClientProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
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

  const filteredAdmins = adminsData.users.filter(admin => {
    const fullName = `${admin.first_name} ${admin.last_name}`
    const matchesSearch = 
      fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || admin.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleDeleteAdmin = async (adminId: string, adminName: string) => {
    if (confirm(`¿Estás seguro de que quieres eliminar al administrador ${adminName}?`)) {
      try {
        // Aquí iría la llamada al API para eliminar
        toast({
          title: "Administrador eliminado",
          description: `${adminName} ha sido eliminado del sistema.`,
          variant: "default",
        })
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar al administrador.",
          variant: "destructive",
        })
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Administradores</h1>
          <p className="text-muted-foreground">
            Administra las cuentas de administradores del sistema
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/administradores/crear">
            <UserPlus className="mr-2 h-4 w-4" />
            Crear Administrador
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Administradores</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adminsData.users.length}</div>
            <p className="text-xs text-muted-foreground">
              Administradores activos en el sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.users.filter(admin => admin.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Con acceso al sistema
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nuevos este Mes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.users.filter(admin => {
                const createdDate = new Date(admin.created_at)
                const thirtyDaysAgo = new Date()
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
                return createdDate >= thirtyDaysAgo
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Registrados en los últimos 30 días
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administradores Inactivos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {adminsData.users.filter(admin => admin.status !== 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Sin acceso temporal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros y Búsqueda</CardTitle>
          <CardDescription>
            Encuentra administradores específicos usando los filtros
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
                <option value="suspended">Suspendidos</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Administrators List */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Administradores</CardTitle>
          <CardDescription>
            {filteredAdmins.length} administrador{filteredAdmins.length !== 1 ? 'es' : ''} encontrado{filteredAdmins.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAdmins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {`${admin.first_name} ${admin.last_name}`.split(' ').map(n => n.charAt(0)).join('').slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {`${admin.first_name} ${admin.last_name}`}
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      {admin.email}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground">
                      Registrado: {formatDate(admin.created_at)}
                    </div>
                    {admin.lastLogin && (
                      <div className="text-sm text-muted-foreground">
                        Último acceso: {formatDate(admin.lastLogin)}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(admin.status)}
                    
                    <div className="relative">
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-8 bg-white border rounded-md shadow-lg py-1 z-10 min-w-[120px]">
                        <button className="w-full text-left px-3 py-1 text-sm hover:bg-muted flex items-center gap-2">
                          <Eye className="h-3 w-3" />
                          Ver detalles
                        </button>
                        <button className="w-full text-left px-3 py-1 text-sm hover:bg-muted flex items-center gap-2">
                          <Edit className="h-3 w-3" />
                          Editar
                        </button>
                        <button 
                          className="w-full text-left px-3 py-1 text-sm hover:bg-muted flex items-center gap-2 text-red-600"
                          onClick={() => handleDeleteAdmin(admin.id, `${admin.first_name} ${admin.last_name}`)}
                        >
                          <Trash2 className="h-3 w-3" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredAdmins.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No se encontraron administradores</h3>
                <p className="text-muted-foreground mb-4">
                  No hay administradores que coincidan con los filtros aplicados.
                </p>
                <Button asChild>
                  <Link href="/admin/administradores/crear">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Crear primer administrador
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
