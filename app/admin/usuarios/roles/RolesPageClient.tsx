"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Shield, 
  UserCheck, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Settings,
  Eye,
  Lock,
  Unlock,
  Loader2
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

interface Role {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  color: string
  icon: string
  isSystem: boolean
  isActive: boolean
  permissions: Permission[]
}

interface Permission {
  id: string
  name: string
  description: string
  category: string
  required: boolean
}

interface PermissionCategory {
  id: string
  name: string
}

const PERMISSION_CATEGORIES: PermissionCategory[] = [
  { id: 'system', name: 'Sistema' },
  { id: 'users', name: 'Usuarios' },
  { id: 'events', name: 'Eventos' },
  { id: 'tickets', name: 'Tickets' },
  { id: 'pos', name: 'Punto de Venta' },
  { id: 'payments', name: 'Pagos' },
  { id: 'reports', name: 'Reportes' },
  { id: 'roles', name: 'Roles y Permisos' }
]

export default function RolesPageClient() {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    level: 999,
    color: 'gray',
    icon: '',
    selectedPermissions: [] as string[]
  })

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [])

  const loadRoles = async () => {
    setLoading(true)
    try {
      const response = await apiClient.getRoles()
      if (response.success && response.data) {
        setRoles(response.data)
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los roles",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cargando roles:', error)
      toast({
        title: "Error",
        description: "Error al cargar los roles",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadPermissions = async () => {
    try {
      const response = await apiClient.getPermissions()
      if (response.success && response.data) {
        setPermissions(response.data)
      }
    } catch (error) {
      console.error('Error cargando permisos:', error)
    }
  }

  const handleCreateRole = async () => {
    if (!formData.name || !formData.display_name) {
      toast({
        title: "Error",
        description: "Nombre y nombre de visualización son requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiClient.createRole({
        name: formData.name,
        display_name: formData.display_name,
        description: formData.description,
        level: formData.level,
        color: formData.color,
        icon: formData.icon,
        permissions: formData.selectedPermissions
      })

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol creado correctamente"
        })
        setIsCreateDialogOpen(false)
        resetForm()
        loadRoles()
      } else {
        throw new Error(response.message || "Error al crear el rol")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al crear el rol",
        variant: "destructive"
      })
    }
  }

  const handleEditRole = (role: Role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      display_name: role.displayName,
      description: role.description,
      level: role.level,
      color: role.color,
      icon: role.icon,
      selectedPermissions: role.permissions.map(p => p.id)
    })
    setIsEditDialogOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return

    try {
      const response = await apiClient.updateRole(selectedRole.id, {
        display_name: formData.display_name,
        description: formData.description,
        level: formData.level,
        color: formData.color,
        icon: formData.icon,
        permissions: formData.selectedPermissions
      })

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol actualizado correctamente"
        })
        setIsEditDialogOpen(false)
        setSelectedRole(null)
        resetForm()
        loadRoles()
      } else {
        throw new Error(response.message || "Error al actualizar el rol")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al actualizar el rol",
        variant: "destructive"
      })
    }
  }

  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('¿Estás seguro de eliminar este rol?')) return

    try {
      const response = await apiClient.deleteRole(roleId)
      if (response.success) {
        toast({
          title: "Éxito",
          description: "Rol eliminado correctamente"
        })
        loadRoles()
      } else {
        throw new Error(response.message || "Error al eliminar el rol")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar el rol",
        variant: "destructive"
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      level: 999,
      color: 'gray',
      icon: '',
      selectedPermissions: []
    })
  }

  const togglePermission = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPermissions: prev.selectedPermissions.includes(permissionId)
        ? prev.selectedPermissions.filter(id => id !== permissionId)
        : [...prev.selectedPermissions, permissionId]
    }))
  }

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'administrator':
        return <Shield className="w-6 h-6 text-red-500" />
      case 'pos_manager':
        return <UserCheck className="w-6 h-6 text-blue-500" />
      case 'cashier':
        return <CreditCard className="w-6 h-6 text-green-500" />
      default:
        return <Users className="w-6 h-6 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  const totalPermissions = roles.reduce((total, role) => total + role.permissions.length, 0)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600">Administrar roles y permisos del sistema</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Rol
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>
                Define un nuevo rol con sus permisos correspondientes
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Rol *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ej: manager"
                  />
                </div>
                <div>
                  <Label htmlFor="display_name">Nombre de Visualización *</Label>
                  <Input
                    id="display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                    placeholder="ej: Gerente"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción del rol..."
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="level">Nivel</Label>
                  <Input
                    id="level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 999 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    placeholder="gray"
                  />
                </div>
                <div>
                  <Label htmlFor="icon">Icono</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Shield"
                  />
                </div>
              </div>
              <div>
                <Label>Permisos</Label>
                <div className="mt-2 space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {PERMISSION_CATEGORIES.map(category => {
                    const categoryPerms = permissions.filter(p => p.category === category.id)
                    if (categoryPerms.length === 0) return null
                    return (
                      <div key={category.id} className="space-y-2">
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        <div className="space-y-2 pl-4">
                          {categoryPerms.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={formData.selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                              />
                              <Label
                                htmlFor={permission.id}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateRole}>
                  Crear Rol
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{roles.length}</div>
            <p className="text-xs text-muted-foreground">
              Roles configurados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Roles Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {roles.filter(r => r.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Roles activos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPermissions}</div>
            <p className="text-xs text-muted-foreground">
              Permisos asignados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getRoleIcon(role.id)}
                  <div>
                    <CardTitle className="text-lg">{role.displayName}</CardTitle>
                    <CardDescription>{role.description}</CardDescription>
                  </div>
                </div>
                <Badge 
                  variant={role.color === 'red' ? 'destructive' : role.color === 'blue' ? 'default' : 'secondary'}
                >
                  Nivel {role.level}
                </Badge>
              </div>
              {role.isSystem && (
                <Badge variant="outline" className="mt-2">
                  Sistema
                </Badge>
              )}
              {!role.isActive && (
                <Badge variant="secondary" className="mt-2">
                  Inactivo
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permisos por categoría */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {PERMISSION_CATEGORIES.map((category) => {
                  const categoryPermissions = role.permissions.filter(p => p.category === category.id)
                  if (categoryPermissions.length === 0) return null
                  
                  return (
                    <div key={category.id}>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        {category.name}
                      </h4>
                      <div className="space-y-1">
                        {categoryPermissions.map((permission) => (
                          <div key={permission.id} className="flex items-center gap-2 text-xs">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-gray-600">{permission.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Acciones */}
              <div className="flex gap-2 pt-4 border-t">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => handleEditRole(role)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                {!role.isSystem && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => handleDeleteRole(role.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog de Edición */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Rol</DialogTitle>
            <DialogDescription>
              Modifica el rol y sus permisos
            </DialogDescription>
          </DialogHeader>
          {selectedRole && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name">Nombre del Rol</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    disabled
                    className="bg-gray-100"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    El nombre no se puede modificar
                  </p>
                </div>
                <div>
                  <Label htmlFor="edit-display_name">Nombre de Visualización *</Label>
                  <Input
                    id="edit-display_name"
                    value={formData.display_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-level">Nivel</Label>
                  <Input
                    id="edit-level"
                    type="number"
                    value={formData.level}
                    onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 999 }))}
                    disabled={selectedRole.isSystem}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-color">Color</Label>
                  <Input
                    id="edit-color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    disabled={selectedRole.isSystem}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-icon">Icono</Label>
                  <Input
                    id="edit-icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    disabled={selectedRole.isSystem}
                  />
                </div>
              </div>
              <div>
                <Label>Permisos</Label>
                <div className="mt-2 space-y-4 max-h-64 overflow-y-auto border rounded-lg p-4">
                  {PERMISSION_CATEGORIES.map(category => {
                    const categoryPerms = permissions.filter(p => p.category === category.id)
                    if (categoryPerms.length === 0) return null
                    return (
                      <div key={category.id} className="space-y-2">
                        <h4 className="font-medium text-sm">{category.name}</h4>
                        <div className="space-y-2 pl-4">
                          {categoryPerms.map(permission => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`edit-${permission.id}`}
                                checked={formData.selectedPermissions.includes(permission.id)}
                                onCheckedChange={() => togglePermission(permission.id)}
                                disabled={selectedRole.isSystem && permission.required}
                              />
                              <Label
                                htmlFor={`edit-${permission.id}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {permission.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleUpdateRole}>
                  Guardar Cambios
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
