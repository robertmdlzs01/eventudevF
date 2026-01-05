const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Obtener todos los roles del sistema
router.get('/roles', auth, async (req, res) => {
  try {
    const roles = [
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
    ];

    res.json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error obteniendo roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener permisos de un usuario específico
router.get('/user/:userId/permissions', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Obtener información del usuario
    const userQuery = `
      SELECT u.id, u.email, u.first_name, u.last_name, u.role
      FROM users u 
      WHERE u.id = $1
    `;
    
    const userResult = await db.query(userQuery, [userId]);
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = userResult.rows[0];
    
    // Obtener puntos de venta asignados
    const salesPointsQuery = `
      SELECT sp.id, sp.name, sp.location
      FROM sales_point_privileges spp
      JOIN sales_points sp ON spp.sales_point_id = sp.id
      WHERE spp.user_id = $1
    `;
    
    const salesPointsResult = await db.query(salesPointsQuery, [userId]);
    
    // Determinar rol y permisos basado en el rol del usuario
    let role, permissions;
    
    switch (user.role) {
      case 'administrator':
        role = {
          id: 'administrator',
          name: 'administrator',
          displayName: 'Administrador',
          description: 'Acceso completo al sistema',
          level: 1,
          color: 'red',
          icon: 'Shield'
        };
        permissions = [
          { id: 'manage_all', name: 'Gestionar Todo', description: 'Acceso completo al sistema', category: 'system', required: true },
          { id: 'manage_users', name: 'Gestionar Usuarios', description: 'Crear, editar y eliminar usuarios', category: 'users', required: true },
          { id: 'manage_events', name: 'Gestionar Eventos', description: 'Crear, editar y eliminar eventos', category: 'events', required: true },
          { id: 'manage_tickets', name: 'Gestionar Tickets', description: 'Gestionar tipos de tickets', category: 'tickets', required: true },
          { id: 'manage_sales_points', name: 'Gestionar Puntos de Venta', description: 'Gestionar cajas registradoras', category: 'pos', required: true },
          { id: 'view_reports', name: 'Ver Reportes', description: 'Acceso a todos los reportes', category: 'reports', required: true },
          { id: 'manage_refunds', name: 'Gestionar Reembolsos', description: 'Procesar reembolsos', category: 'payments', required: true },
          { id: 'system_settings', name: 'Configuración del Sistema', description: 'Configurar sistema', category: 'system', required: true }
        ];
        break;
        
      case 'pos_manager':
        role = {
          id: 'pos_manager',
          name: 'pos_manager',
          displayName: 'Gerente POS',
          description: 'Gestión de ventas y operaciones',
          level: 2,
          color: 'blue',
          icon: 'UserCheck'
        };
        permissions = [
          { id: 'manage_sales_points', name: 'Gestionar Puntos de Venta', description: 'Gestionar cajas registradoras', category: 'pos', required: true },
          { id: 'open_register', name: 'Abrir Caja', description: 'Abrir sesiones de caja', category: 'pos', required: true },
          { id: 'close_register', name: 'Cerrar Caja', description: 'Cerrar sesiones de caja', category: 'pos', required: true },
          { id: 'sell_tickets', name: 'Vender Tickets', description: 'Procesar ventas', category: 'pos', required: true },
          { id: 'process_refunds', name: 'Procesar Reembolsos', description: 'Procesar reembolsos', category: 'payments', required: true },
          { id: 'view_reports', name: 'Ver Reportes', description: 'Acceso a reportes de ventas', category: 'reports', required: true }
        ];
        break;
        
      case 'cashier':
        role = {
          id: 'cashier',
          name: 'cashier',
          displayName: 'Cajero',
          description: 'Operaciones de venta básicas',
          level: 3,
          color: 'green',
          icon: 'CreditCard'
        };
        permissions = [
          { id: 'open_register', name: 'Abrir Caja', description: 'Abrir sesiones de caja', category: 'pos', required: true },
          { id: 'close_register', name: 'Cerrar Caja', description: 'Cerrar sesiones de caja', category: 'pos', required: true },
          { id: 'sell_tickets', name: 'Vender Tickets', description: 'Procesar ventas', category: 'pos', required: true },
          { id: 'view_orders', name: 'Ver Órdenes', description: 'Ver órdenes de venta', category: 'pos', required: true },
          { id: 'check_in_tickets', name: 'Check-in Tickets', description: 'Validar tickets en eventos', category: 'tickets', required: true }
        ];
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Rol de usuario no válido'
        });
    }
    
    res.json({
      success: true,
      data: {
        userId: parseInt(userId),
        role,
        permissions,
        salesPoints: salesPointsResult.rows,
        canOpenRegister: permissions.some(p => p.id === 'open_register'),
        canCloseRegister: permissions.some(p => p.id === 'close_register'),
        canSell: permissions.some(p => p.id === 'sell_tickets'),
        canRefund: permissions.some(p => p.id === 'process_refunds'),
        canManageUsers: permissions.some(p => p.id === 'manage_users'),
        canViewReports: permissions.some(p => p.id === 'view_reports'),
        canManageEvents: permissions.some(p => p.id === 'manage_events'),
        canManageTickets: permissions.some(p => p.id === 'manage_tickets')
      }
    });
  } catch (error) {
    console.error('Error obteniendo permisos del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Asignar rol a un usuario
router.put('/user/:userId/role', auth, requireRole(['administrator']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Validar rol
    const validRoles = ['administrator', 'pos_manager', 'cashier'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Rol no válido'
      });
    }
    
    // Actualizar rol del usuario
    const updateQuery = `
      UPDATE users 
      SET role = $1, updated_at = NOW()
      WHERE id = $2
    `;
    
    await db.query(updateQuery, [role, userId]);
    
    res.json({
      success: true,
      message: 'Rol actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando rol del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Asignar puntos de venta a un usuario
router.post('/user/:userId/sales-points', auth, requireRole(['administrator', 'pos_manager']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { salesPointIds } = req.body;
    
    // Eliminar asignaciones existentes
    const deleteQuery = `
      DELETE FROM sales_point_privileges 
      WHERE user_id = $1
    `;
    await db.query(deleteQuery, [userId]);
    
    // Insertar nuevas asignaciones
    if (salesPointIds && salesPointIds.length > 0) {
      const insertQuery = `
        INSERT INTO sales_point_privileges (user_id, sales_point_id, created_at)
        VALUES ($1, $2, NOW())
      `;
      
      for (const salesPointId of salesPointIds) {
        await db.query(insertQuery, [userId, salesPointId]);
      }
    }
    
    res.json({
      success: true,
      message: 'Puntos de venta asignados correctamente'
    });
  } catch (error) {
    console.error('Error asignando puntos de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar permisos de un usuario para una funcionalidad
router.post('/check-permission', auth, async (req, res) => {
  try {
    const { userId, feature, action, salesPointId } = req.body;
    
    // Obtener permisos del usuario
    const permissionsQuery = `
      SELECT u.role, spp.sales_point_id
      FROM users u
      LEFT JOIN sales_point_privileges spp ON u.id = spp.user_id
      WHERE u.id = $1
    `;
    
    const result = await db.query(permissionsQuery, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }
    
    const user = result.rows[0];
    const assignedSalesPoints = result.rows.map(row => row.sales_point_id).filter(id => id !== null);
    
    // Lógica de verificación de permisos (simplificada)
    let hasPermission = false;
    
    if (user.role === 'administrator') {
      hasPermission = true;
    } else if (user.role === 'pos_manager') {
      hasPermission = ['pos', 'payments', 'reports'].includes(feature);
    } else if (user.role === 'cashier') {
      hasPermission = ['pos', 'tickets'].includes(feature);
    }
    
    // Verificar acceso a punto de venta específico
    if (salesPointId && !assignedSalesPoints.includes(parseInt(salesPointId))) {
      hasPermission = false;
    }
    
    res.json({
      success: true,
      hasPermission,
      userRole: user.role,
      assignedSalesPoints
    });
  } catch (error) {
    console.error('Error verificando permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
