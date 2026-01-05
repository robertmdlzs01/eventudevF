import { Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  Unlock
} from "lucide-react"
import { USER_ROLES, PERMISSION_CATEGORIES, UserRoleService } from "@/lib/user-roles"

export default function RolesPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
          <p className="text-gray-600">Administrar roles y permisos del sistema</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Rol
        </Button>
      </div>

      {/* Métricas de Roles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{USER_ROLES.length}</div>
            <p className="text-xs text-muted-foreground">
              Roles configurados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Con roles asignados
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Permisos</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {USER_ROLES.reduce((total, role) => total + role.permissions.length, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Permisos disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {USER_ROLES.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {role.id === 'administrator' && <Shield className="w-6 h-6 text-red-500" />}
                  {role.id === 'pos_manager' && <UserCheck className="w-6 h-6 text-blue-500" />}
                  {role.id === 'cashier' && <CreditCard className="w-6 h-6 text-green-500" />}
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
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Permisos por categoría */}
              <div className="space-y-3">
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
                <Button size="sm" variant="outline" className="flex-1">
                  <Eye className="w-4 h-4 mr-1" />
                  Ver
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                {role.id !== 'administrator' && (
                  <Button size="sm" variant="outline" className="flex-1">
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
