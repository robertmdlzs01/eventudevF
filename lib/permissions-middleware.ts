// Middleware de permisos basado en el sistema de roles del WordPress
// Control de acceso granular para el sistema POS

import { UserRoleService, UserPermissions } from './user-roles'

export interface PermissionContext {
  user: UserPermissions
  feature: string
  action?: string
  resource?: any
}

export class PermissionMiddleware {
  // Verificar acceso a una funcionalidad
  static canAccess(context: PermissionContext): boolean {
    const { user, feature } = context
    
    // Administradores tienen acceso completo
    if (UserRoleService.isAdministrator(user)) {
      return true
    }
    
    // Verificar permisos específicos
    return UserRoleService.canAccess(user, feature)
  }

  // Verificar si puede realizar una acción específica
  static canPerformAction(context: PermissionContext): boolean {
    const { user, action } = context
    
    if (!action) return false
    
    // Administradores pueden realizar todas las acciones
    if (UserRoleService.isAdministrator(user)) {
      return true
    }
    
    return UserRoleService.canPerformAction(user.role, action)
  }

  // Verificar acceso a un punto de venta específico
  static canAccessSalesPoint(context: PermissionContext, salesPointId: number): boolean {
    const { user } = context
    
    return UserRoleService.canManageSalesPoint(user, salesPointId)
  }

  // Verificar permisos de caja registradora
  static canManageRegister(context: PermissionContext, registerId: number): boolean {
    const { user } = context
    
    // Administradores pueden gestionar todas las cajas
    if (UserRoleService.isAdministrator(user)) {
      return true
    }
    
    // Verificar si el usuario tiene permisos para esta caja específica
    return user.salesPoints.includes(registerId)
  }

  // Verificar permisos de sesión de caja
  static canOpenRegister(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'open_register')
  }

  static canCloseRegister(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'close_register')
  }

  // Verificar permisos de venta
  static canSellTickets(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'sell_tickets')
  }

  // Verificar permisos de reembolso
  static canProcessRefund(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'process_refunds') || 
           UserRoleService.hasPermission(user, 'manage_refunds')
  }

  // Verificar permisos de gestión de usuarios
  static canManageUsers(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'manage_users')
  }

  // Verificar permisos de reportes
  static canViewReports(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'view_reports')
  }

  // Verificar permisos de gestión de eventos
  static canManageEvents(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'manage_events')
  }

  // Verificar permisos de gestión de tickets
  static canManageTickets(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'manage_tickets')
  }

  // Verificar permisos de check-in
  static canCheckInTickets(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.hasPermission(user, 'check_in_tickets')
  }

  // Obtener nivel de acceso
  static getAccessLevel(context: PermissionContext): number {
    const { user } = context
    
    return UserRoleService.getAccessLevel(user)
  }

  // Verificar si es administrador
  static isAdministrator(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.isAdministrator(user)
  }

  // Verificar si es gerente POS
  static isPOSManager(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.isPOSManager(user)
  }

  // Verificar si es cajero
  static isCashier(context: PermissionContext): boolean {
    const { user } = context
    
    return UserRoleService.isCashier(user)
  }

  // Obtener permisos filtrados por categoría
  static getFilteredPermissions(context: PermissionContext, category: string) {
    const { user } = context
    
    return user.permissions.filter(permission => permission.category === category)
  }

  // Verificar múltiples permisos (AND)
  static hasAllPermissions(context: PermissionContext, permissions: string[]): boolean {
    return permissions.every(permission => 
      UserRoleService.hasPermission(context.user, permission)
    )
  }

  // Verificar múltiples permisos (OR)
  static hasAnyPermission(context: PermissionContext, permissions: string[]): boolean {
    return permissions.some(permission => 
      UserRoleService.hasPermission(context.user, permission)
    )
  }

  // Validar contexto de permisos
  static validateContext(context: PermissionContext): boolean {
    if (!context.user || !context.feature) {
      return false
    }
    
    // Verificar que el usuario tenga un rol válido
    if (!context.user.role || !context.user.permissions) {
      return false
    }
    
    return true
  }
}

// Hook para usar permisos en componentes React
export function usePermissions(user: UserPermissions) {
  const createContext = (feature: string, action?: string, resource?: any): PermissionContext => ({
    user,
    feature,
    action,
    resource
  })

  return {
    canAccess: (feature: string) => PermissionMiddleware.canAccess(createContext(feature)),
    canPerformAction: (action: string) => PermissionMiddleware.canPerformAction(createContext('', action)),
    canAccessSalesPoint: (salesPointId: number) => PermissionMiddleware.canAccessSalesPoint(createContext('pos'), salesPointId),
    canManageRegister: (registerId: number) => PermissionMiddleware.canManageRegister(createContext('pos'), registerId),
    canOpenRegister: () => PermissionMiddleware.canOpenRegister(createContext('pos')),
    canCloseRegister: () => PermissionMiddleware.canCloseRegister(createContext('pos')),
    canSellTickets: () => PermissionMiddleware.canSellTickets(createContext('pos')),
    canProcessRefund: () => PermissionMiddleware.canProcessRefund(createContext('payments')),
    canManageUsers: () => PermissionMiddleware.canManageUsers(createContext('users')),
    canViewReports: () => PermissionMiddleware.canViewReports(createContext('reports')),
    canManageEvents: () => PermissionMiddleware.canManageEvents(createContext('events')),
    canManageTickets: () => PermissionMiddleware.canManageTickets(createContext('tickets')),
    canCheckInTickets: () => PermissionMiddleware.canCheckInTickets(createContext('tickets')),
    getAccessLevel: () => PermissionMiddleware.getAccessLevel(createContext('')),
    isAdministrator: () => PermissionMiddleware.isAdministrator(createContext('')),
    isPOSManager: () => PermissionMiddleware.isPOSManager(createContext('')),
    isCashier: () => PermissionMiddleware.isCashier(createContext('')),
    hasAllPermissions: (permissions: string[]) => PermissionMiddleware.hasAllPermissions(createContext(''), permissions),
    hasAnyPermission: (permissions: string[]) => PermissionMiddleware.hasAnyPermission(createContext(''), permissions)
  }
}
