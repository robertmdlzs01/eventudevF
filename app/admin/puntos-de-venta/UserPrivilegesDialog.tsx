"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  Search, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Settings,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

interface User {
  id: number
  first_name: string
  last_name: string
  email: string
  role: string
  status: string
  created_at: string
  sales_point_privileges: SalesPointPrivilege[]
}

interface SalesPointPrivilege {
  id: number
  user_id: number
  sales_point_id: number
  sales_point_name: string
  can_sell: boolean
  can_view_reports: boolean
  can_manage_inventory: boolean
  can_manage_users: boolean
  created_at: string
}

interface UserPrivilegesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UserPrivilegesDialog({
  open,
  onOpenChange
}: UserPrivilegesDialogProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [salesPoints, setSalesPoints] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAddUser, setShowAddUser] = useState(false)
  const [newUserData, setNewUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'sales_point_manager'
  })

  useEffect(() => {
    if (open) {
      loadUsers()
      loadSalesPoints()
    }
  }, [open])

  useEffect(() => {
    let filtered = users

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchTerm])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getUsersWithPrivileges()
      
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
      toast.error('Error al cargar usuarios')
    } finally {
      setLoading(false)
    }
  }

  const loadSalesPoints = async () => {
    try {
      const response = await apiClient.getSalesPoints()
      
      if (response.success && response.data) {
        setSalesPoints(response.data)
      }
    } catch (error) {
      console.error('Error cargando puntos de venta:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await apiClient.createUser(newUserData)
      
      if (response.success) {
        toast.success('Usuario creado exitosamente')
        setShowAddUser(false)
        setNewUserData({
          first_name: '',
          last_name: '',
          email: '',
          password: '',
          role: 'sales_point_manager'
        })
        loadUsers()
      } else {
        toast.error(response.error || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error creando usuario:', error)
      toast.error('Error al crear usuario')
    }
  }

  const handleUpdatePrivilege = async (userId: number, salesPointId: number, privilege: string, value: boolean) => {
    try {
      const response = await apiClient.updateUserPrivilege(userId, salesPointId, privilege, value)
      
      if (response.success) {
        toast.success('Privilegio actualizado exitosamente')
        loadUsers()
      } else {
        toast.error(response.error || 'Error al actualizar privilegio')
      }
    } catch (error) {
      console.error('Error actualizando privilegio:', error)
      toast.error('Error al actualizar privilegio')
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return
    }

    try {
      const response = await apiClient.deleteUser(userId)
      
      if (response.success) {
        toast.success('Usuario eliminado exitosamente')
        loadUsers()
      } else {
        toast.error(response.error || 'Error al eliminar usuario')
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error)
      toast.error('Error al eliminar usuario')
    }
  }

  const getPrivilegeBadge = (user: User, salesPointId: number) => {
    const privilege = user.sales_point_privileges.find(p => p.sales_point_id === salesPointId)
    
    if (!privilege) {
      return <Badge variant="outline">Sin acceso</Badge>
    }

    const privileges = []
    if (privilege.can_sell) privileges.push('Vender')
    if (privilege.can_view_reports) privileges.push('Reportes')
    if (privilege.can_manage_inventory) privileges.push('Inventario')
    if (privilege.can_manage_users) privileges.push('Usuarios')

    if (privileges.length === 0) {
      return <Badge variant="outline">Sin acceso</Badge>
    }

    return <Badge variant="default">{privileges.length} privilegio(s)</Badge>
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Gestión de Privilegios de Usuarios
          </DialogTitle>
          <DialogDescription>
            Administra los privilegios de los usuarios para los puntos de venta
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="privileges">Privilegios</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={() => setShowAddUser(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Nuevo Usuario
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredUsers.map((user) => (
                  <Card key={user.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status === 'active' ? 'Activo' : 'Inactivo'}
                            </Badge>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="privileges" className="space-y-4">
            {selectedUser ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Privilegios de {selectedUser.first_name} {selectedUser.last_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {salesPoints.map((salesPoint) => (
                        <Card key={salesPoint.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-medium">{salesPoint.name}</h4>
                                <p className="text-sm text-muted-foreground">{salesPoint.location}</p>
                              </div>
                              {getPrivilegeBadge(selectedUser, salesPoint.id)}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedUser.sales_point_privileges.find(p => p.sales_point_id === salesPoint.id)?.can_sell || false}
                                  onCheckedChange={(checked) => handleUpdatePrivilege(selectedUser.id, salesPoint.id, 'can_sell', checked)}
                                />
                                <Label>Puede vender</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedUser.sales_point_privileges.find(p => p.sales_point_id === salesPoint.id)?.can_view_reports || false}
                                  onCheckedChange={(checked) => handleUpdatePrivilege(selectedUser.id, salesPoint.id, 'can_view_reports', checked)}
                                />
                                <Label>Ver reportes</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedUser.sales_point_privileges.find(p => p.sales_point_id === salesPoint.id)?.can_manage_inventory || false}
                                  onCheckedChange={(checked) => handleUpdatePrivilege(selectedUser.id, salesPoint.id, 'can_manage_inventory', checked)}
                                />
                                <Label>Gestionar inventario</Label>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={selectedUser.sales_point_privileges.find(p => p.sales_point_id === salesPoint.id)?.can_manage_users || false}
                                  onCheckedChange={(checked) => handleUpdatePrivilege(selectedUser.id, salesPoint.id, 'can_manage_users', checked)}
                                />
                                <Label>Gestionar usuarios</Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Selecciona un usuario</h3>
                  <p className="text-muted-foreground">
                    Selecciona un usuario de la lista para gestionar sus privilegios.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Diálogo para agregar nuevo usuario */}
        {showAddUser && (
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                <DialogDescription>
                  Crea un nuevo usuario para gestionar puntos de venta
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">Nombre</Label>
                    <Input
                      id="first_name"
                      value={newUserData.first_name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, first_name: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Apellido</Label>
                    <Input
                      id="last_name"
                      value={newUserData.last_name}
                      onChange={(e) => setNewUserData(prev => ({ ...prev, last_name: e.target.value }))}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserData.email}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserData.password}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="role">Rol</Label>
                  <select
                    id="role"
                    value={newUserData.role}
                    onChange={(e) => setNewUserData(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="sales_point_manager">Gerente de Punto de Venta</option>
                    <option value="sales_point_staff">Personal de Punto de Venta</option>
                  </select>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Crear Usuario</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  )
}


