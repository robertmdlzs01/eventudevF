// Sistema de Roles de Usuario basado en WordPress
// Implementación de permisos y roles del sistema POS

export interface UserRole {
  id: string
  name: string
  displayName: string
  description: string
  level: number
  permissions: Permission[]
  color: string
  icon: string
}

export interface Permission {
  id: string
  name: string
  description: string
  category: string
  required: boolean
}

export interface UserPermissions {
  userId: number
  role: UserRole
  permissions: Permission[]
  salesPoints: number[] // IDs de puntos de venta asignados
  canOpenRegister: boolean
  canCloseRegister: boolean
  canSell: boolean
  canRefund: boolean
  canManageUsers: boolean
  canViewReports: boolean
  canManageEvents: boolean
  canManageTickets: boolean
}

// Roles del sistema basados en WordPress
export const USER_ROLES: UserRole[] = [
  {
    id: 'administrator',
    name: 'administrator',
    displayName: 'Administrador',
    description: 'Acceso completo al sistema',
    level: 1,
    color: 'red',
    icon: 'Shield',
    permissions: [
      { id: 'manage_all', name: 'Gestionar Todo', description: 'Acceso completo al sistema', category: 'system', required: true },
      { id: 'manage_users', name: 'Gestionar Usuarios', description: 'Crear, editar y eliminar usuarios', category: 'users', required: true },
      { id: 'manage_events', name: 'Gestionar Eventos', description: 'Crear, editar y eliminar eventos', category: 'events', required: true },
      { id: 'manage_tickets', name: 'Gestionar Tickets', description: 'Gestionar tipos de tickets', category: 'tickets', required: true },
      { id: 'manage_sales_points', name: 'Gestionar Puntos de Venta', description: 'Gestionar cajas registradoras', category: 'pos', required: true },
      { id: 'view_reports', name: 'Ver Reportes', description: 'Acceso a todos los reportes', category: 'reports', required: true },
      { id: 'manage_refunds', name: 'Gestionar Reembolsos', description: 'Procesar reembolsos', category: 'payments', required: true },
      { id: 'system_settings', name: 'Configuración del Sistema', description: 'Configurar sistema', category: 'system', required: true }
    ]
  },
  {
    id: 'pos_manager',
    name: 'pos_manager',
    displayName: 'Gerente POS',
    description: 'Gestión de ventas y operaciones',
    level: 2,
    color: 'blue',
    icon: 'UserCheck',
    permissions: [
      { id: 'manage_sales_points', name: 'Gestionar Puntos de Venta', description: 'Gestionar cajas registradoras', category: 'pos', required: true },
      { id: 'open_register', name: 'Abrir Caja', description: 'Abrir sesiones de caja', category: 'pos', required: true },
      { id: 'close_register', name: 'Cerrar Caja', description: 'Cerrar sesiones de caja', category: 'pos', required: true },
      { id: 'sell_tickets', name: 'Vender Tickets', description: 'Procesar ventas', category: 'pos', required: true },
      { id: 'process_refunds', name: 'Procesar Reembolsos', description: 'Procesar reembolsos', category: 'payments', required: true },
      { id: 'view_reports', name: 'Ver Reportes', description: 'Acceso a reportes de ventas', category: 'reports', required: true },
      { id: 'manage_events', name: 'Gestionar Eventos', description: 'Crear y editar eventos', category: 'events', required: false },
      { id: 'manage_tickets', name: 'Gestionar Tickets', description: 'Gestionar tipos de tickets', category: 'tickets', required: false }
    ]
  },
  {
    id: 'cashier',
    name: 'cashier',
    displayName: 'Cajero',
    description: 'Operaciones de venta básicas',
    level: 3,
    color: 'green',
    icon: 'CreditCard',
    permissions: [
      { id: 'open_register', name: 'Abrir Caja', description: 'Abrir sesiones de caja', category: 'pos', required: true },
      { id: 'close_register', name: 'Cerrar Caja', description: 'Cerrar sesiones de caja', category: 'pos', required: true },
      { id: 'sell_tickets', name: 'Vender Tickets', description: 'Procesar ventas', category: 'pos', required: true },
      { id: 'view_orders', name: 'Ver Órdenes', description: 'Ver órdenes de venta', category: 'pos', required: true },
      { id: 'check_in_tickets', name: 'Check-in Tickets', description: 'Validar tickets en eventos', category: 'tickets', required: true }
    ]
  }
]

// Categorías de permisos
export const PERMISSION_CATEGORIES = [
  { id: 'system', name: 'Sistema', description: 'Permisos del sistema' },
  { id: 'users', name: 'Usuarios', description: 'Gestión de usuarios' },
  { id: 'events', name: 'Eventos', description: 'Gestión de eventos' },
  { id: 'tickets', name: 'Tickets', description: 'Gestión de tickets' },
  { id: 'pos', name: 'Punto de Venta', description: 'Operaciones POS' },
  { id: 'payments', name: 'Pagos', description: 'Gestión de pagos' },
  { id: 'reports', name: 'Reportes', description: 'Acceso a reportes' }
]

// Funciones de utilidad para roles
export class UserRoleService {
  // Obtener rol por ID
  static getRoleById(roleId: string): UserRole | undefined {
    return USER_ROLES.find(role => role.id === roleId)
  }

  // Obtener rol por nivel
  static getRoleByLevel(level: number): UserRole | undefined {
    return USER_ROLES.find(role => role.level === level)
  }

  // Verificar si un usuario tiene un permiso específico
  static hasPermission(userPermissions: UserPermissions, permissionId: string): boolean {
    return userPermissions.permissions.some(permission => permission.id === permissionId)
  }

  // Verificar si un usuario puede acceder a una funcionalidad
  static canAccess(userPermissions: UserPermissions, feature: string): boolean {
    const featurePermissions: { [key: string]: string[] } = {
      'dashboard': ['manage_all', 'view_reports'],
      'users': ['manage_all', 'manage_users'],
      'events': ['manage_all', 'manage_events'],
      'tickets': ['manage_all', 'manage_tickets'],
      'pos': ['manage_all', 'manage_sales_points', 'open_register', 'sell_tickets'],
      'payments': ['manage_all', 'process_refunds', 'manage_refunds'],
      'reports': ['manage_all', 'view_reports'],
      'settings': ['manage_all', 'system_settings']
    }

    const requiredPermissions = featurePermissions[feature] || []
    return requiredPermissions.some(permission => 
      this.hasPermission(userPermissions, permission)
    )
  }

  // Verificar si un usuario puede gestionar un punto de venta específico
  static canManageSalesPoint(userPermissions: UserPermissions, salesPointId: number): boolean {
    if (this.hasPermission(userPermissions, 'manage_all')) {
      return true
    }
    
    return userPermissions.salesPoints.includes(salesPointId)
  }

  // Obtener permisos por categoría
  static getPermissionsByCategory(role: UserRole, category: string): Permission[] {
    return role.permissions.filter(permission => permission.category === category)
  }

  // Verificar si un rol puede realizar una acción
  static canPerformAction(role: UserRole, action: string): boolean {
    const actionPermissions: { [key: string]: string[] } = {
      'create_user': ['manage_all', 'manage_users'],
      'edit_user': ['manage_all', 'manage_users'],
      'delete_user': ['manage_all', 'manage_users'],
      'open_register': ['manage_all', 'open_register'],
      'close_register': ['manage_all', 'close_register'],
      'sell_tickets': ['manage_all', 'sell_tickets'],
      'process_refund': ['manage_all', 'process_refunds', 'manage_refunds'],
      'view_reports': ['manage_all', 'view_reports'],
      'manage_events': ['manage_all', 'manage_events'],
      'manage_tickets': ['manage_all', 'manage_tickets']
    }

    const requiredPermissions = actionPermissions[action] || []
    return requiredPermissions.some(permission => 
      role.permissions.some(p => p.id === permission)
    )
  }

  // Obtener nivel de acceso de un usuario
  static getAccessLevel(userPermissions: UserPermissions): number {
    return userPermissions.role.level
  }

  // Verificar si un usuario es administrador
  static isAdministrator(userPermissions: UserPermissions): boolean {
    return userPermissions.role.id === 'administrator'
  }

  // Verificar si un usuario es gerente POS
  static isPOSManager(userPermissions: UserPermissions): boolean {
    return userPermissions.role.id === 'pos_manager'
  }

  // Verificar si un usuario es cajero
  static isCashier(userPermissions: UserPermissions): boolean {
    return userPermissions.role.id === 'cashier'
  }
}

// Hook para usar roles en componentes React
export function useUserRoles() {
  return {
    roles: USER_ROLES,
    categories: PERMISSION_CATEGORIES,
    service: UserRoleService
  }
}
