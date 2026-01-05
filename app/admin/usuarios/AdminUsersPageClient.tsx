"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { getAdminUsers, deleteAdminUser } from "@/app/admin/actions"
import { apiClient } from "@/lib/api-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AdminUser } from "@/app/admin/actions"

interface AdminUsersPageClientProps {
  usersData: { users: AdminUser[], pagination: any }
}

export default function AdminUsersPageClient({ usersData }: AdminUsersPageClientProps) {
  const [users, setUsers] = useState<AdminUser[]>(usersData?.users || [])
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>(usersData?.users || [])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchUsers = async (searchParams?: { search?: string, role?: string, status?: string }) => {
    setLoading(true)
    try {
      // Refresh token before making the request
      apiClient.refreshToken()
      const fetchedUsers = await getAdminUsers(searchParams)
      if (fetchedUsers?.users) {
        setUsers(fetchedUsers.users)
        setFilteredUsers(fetchedUsers.users)
      }
    } catch (error: any) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los usuarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar usuarios en el backend
  const searchUsers = async () => {
    const searchParams: { search?: string, role?: string, status?: string } = {}
    
    if (searchTerm) {
      searchParams.search = searchTerm
    }
    
    if (roleFilter !== "all") {
      searchParams.role = roleFilter
    }
    
    await fetchUsers(searchParams)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Debounce para evitar demasiadas búsquedas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 500) // Esperar 500ms después del último cambio

    return () => clearTimeout(timeoutId)
  }, [searchTerm, roleFilter])

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminUser(id)
      toast({
        title: "Usuario Eliminado",
        description: "El usuario ha sido eliminado exitosamente.",
      })
      fetchUsers() // Re-fetch users after deletion
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al eliminar el usuario.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Usuarios
        </h1>
        <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-600">
          <Link href="/admin/usuarios/crear">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Usuario
          </Link>
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle>Listado de Usuarios</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros de búsqueda */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda por texto */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filtro por rol */}
              <div className="w-full sm:w-48">
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los roles</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="organizer">Organizador</SelectItem>
                    <SelectItem value="user">Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Información de resultados */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando {filteredUsers.length} de {users.length} usuarios
              </span>
              {(searchTerm || roleFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setRoleFilter("all")
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
          <Suspense fallback={<div>Cargando usuarios...</div>}>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando usuarios...</div>
            ) : !Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {!Array.isArray(filteredUsers) ? "Error al cargar usuarios" : 
                 searchTerm || roleFilter !== "all" ? "No se encontraron usuarios con los filtros aplicados." : 
                 "No hay usuarios registrados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 text-blue-800">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha Creación</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{`${user.first_name} ${user.last_name}`}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === "admin"
                                ? "bg-purple-100 text-purple-800"
                                : user.role === "organizer"
                                  ? "bg-orange-100 text-orange-800"
                                  : "bg-gray-100 text-gray-800"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.status === "active"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {user.status === "active" ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/usuarios/${user.id}/editar`}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(user.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
