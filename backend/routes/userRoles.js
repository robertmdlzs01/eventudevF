const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Obtener todos los roles del sistema
router.get('/roles', auth, async (req, res) => {
  try {
    // Obtener todos los roles con sus permisos
    const rolesQuery = `
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.level,
        r.color,
        r.icon,
        r.is_system,
        r.is_active,
        r.created_at,
        r.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', p.name,
              'name', p.display_name,
              'description', p.description,
              'category', p.category,
              'required', p.is_required
            ) ORDER BY p.category, p.name
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as permissions
      FROM roles r
      LEFT JOIN roles_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.is_active = true
      GROUP BY r.id, r.name, r.display_name, r.description, r.level, r.color, r.icon, r.is_system, r.is_active, r.created_at, r.updated_at
      ORDER BY r.level ASC, r.name ASC
    `;

    const result = await db.query(rolesQuery);

    const roles = result.rows.map(row => ({
      id: row.name, // Usar name como ID para compatibilidad
      name: row.name,
      displayName: row.display_name,
      description: row.description,
      level: row.level,
      color: row.color,
      icon: row.icon,
      isSystem: row.is_system,
      isActive: row.is_active,
      permissions: Array.isArray(row.permissions) ? row.permissions : []
    }));

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
    
    // Obtener rol y permisos desde la base de datos
    const roleQuery = `
      SELECT 
        r.id,
        r.name,
        r.display_name,
        r.description,
        r.level,
        r.color,
        r.icon,
        COALESCE(
          json_agg(
            DISTINCT json_build_object(
              'id', p.name,
              'name', p.display_name,
              'description', p.description,
              'category', p.category,
              'required', p.is_required
            )
          ) FILTER (WHERE p.id IS NOT NULL),
          '[]'::json
        ) as role_permissions
      FROM roles r
      LEFT JOIN roles_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = $1 AND r.is_active = true
      GROUP BY r.id, r.name, r.display_name, r.description, r.level, r.color, r.icon
    `;

    const roleResult = await db.query(roleQuery, [user.role]);

    let role, permissions = [];

    if (roleResult.rows.length > 0) {
      const roleData = roleResult.rows[0];
      role = {
        id: roleData.name,
        name: roleData.name,
        displayName: roleData.display_name,
        description: roleData.description,
        level: roleData.level,
        color: roleData.color,
        icon: roleData.icon
      };
      permissions = Array.isArray(roleData.role_permissions) ? roleData.role_permissions : [];
    } else {
      // Fallback si el rol no existe en la base de datos
      role = {
        id: user.role,
        name: user.role,
        displayName: user.role,
        description: 'Rol sin configurar',
        level: 999,
        color: 'gray',
        icon: 'User'
      };
      permissions = [];
    }

    // Obtener permisos personalizados del usuario (override)
    const userPermissionsQuery = `
      SELECT 
        p.name,
        p.display_name,
        p.description,
        p.category,
        p.is_required,
        up.granted
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
    `;

    const userPermissionsResult = await db.query(userPermissionsQuery, [userId]);

    // Aplicar overrides: si hay un permiso personalizado que está denegado, removerlo.
    // Si está otorgado y no está en los permisos del rol, agregarlo.
    const userPermissionMap = {};
    userPermissionsResult.rows.forEach(row => {
      userPermissionMap[row.name] = row.granted;
    });

    // Filtrar permisos basado en overrides
    permissions = permissions.filter(perm => {
      if (userPermissionMap[perm.id] === false) {
        return false; // Denegado explícitamente
      }
      return true;
    });

    // Agregar permisos otorgados explícitamente que no están en el rol
    userPermissionsResult.rows.forEach(row => {
      if (row.granted && !permissions.find(p => p.id === row.name)) {
        permissions.push({
          id: row.name,
          name: row.display_name,
          description: row.description,
          category: row.category,
          required: row.is_required
        });
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        },
        userId: parseInt(userId),
        role,
        permissions,
        salesPoints: salesPointsResult.rows.map(sp => ({
          id: sp.id,
          name: sp.name,
          location: sp.location
        })),
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

// Crear nuevo rol
router.post('/roles', auth, requireRole(['administrator']), async (req, res) => {
  try {
    const { name, display_name, description, level, color, icon, permissions } = req.body;

    if (!name || !display_name) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y nombre de visualización son requeridos'
      });
    }

    // Verificar si el rol ya existe
    const checkQuery = `SELECT id FROM roles WHERE name = $1`;
    const checkResult = await db.query(checkQuery, [name]);
    
    if (checkResult.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un rol con ese nombre'
      });
    }

    await db.query('BEGIN');

    try {
      // Crear rol
      const insertRoleQuery = `
        INSERT INTO roles (name, display_name, description, level, color, icon, is_system, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, false, true)
        RETURNING *
      `;

      const roleResult = await db.query(insertRoleQuery, [
        name,
        display_name,
        description || null,
        level || 999,
        color || 'gray',
        icon || null
      ]);

      const roleId = roleResult.rows[0].id;

      // Asignar permisos si se proporcionaron
      if (permissions && Array.isArray(permissions) && permissions.length > 0) {
        // Obtener IDs de permisos por nombre
        const permissionNames = permissions;
        const permissionQuery = `SELECT id, name FROM permissions WHERE name = ANY($1)`;
        const permissionResult = await db.query(permissionQuery, [permissionNames]);

        // Insertar relaciones
        for (const perm of permissionResult.rows) {
          await db.query(
            `INSERT INTO roles_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [roleId, perm.id]
          );
        }
      }

      await db.query('COMMIT');

      // Obtener rol completo con permisos
      const fullRoleQuery = `
        SELECT 
          r.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.name,
                'name', p.display_name,
                'description', p.description,
                'category', p.category,
                'required', p.is_required
              ) ORDER BY p.category, p.name
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          ) as permissions
        FROM roles r
        LEFT JOIN roles_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = $1
        GROUP BY r.id
      `;

      const fullRoleResult = await db.query(fullRoleQuery, [roleId]);

      res.json({
        success: true,
        message: 'Rol creado correctamente',
        data: {
          id: fullRoleResult.rows[0].name,
          name: fullRoleResult.rows[0].name,
          displayName: fullRoleResult.rows[0].display_name,
          description: fullRoleResult.rows[0].description,
          level: fullRoleResult.rows[0].level,
          color: fullRoleResult.rows[0].color,
          icon: fullRoleResult.rows[0].icon,
          permissions: Array.isArray(fullRoleResult.rows[0].permissions) 
            ? fullRoleResult.rows[0].permissions 
            : []
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar rol
router.put('/roles/:id', auth, requireRole(['administrator']), async (req, res) => {
  try {
    const { id } = req.params;
    const { display_name, description, level, color, icon, permissions, is_active } = req.body;

    // Buscar rol por name (id es el name en la API)
    const findRoleQuery = `SELECT id, is_system FROM roles WHERE name = $1`;
    const findResult = await db.query(findRoleQuery, [id]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    const roleId = findResult.rows[0].id;

    // No permitir editar roles del sistema (excepto is_active)
    if (findResult.rows[0].is_system && (display_name || description || level || color || icon)) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden modificar los roles del sistema (excepto estado activo/inactivo)'
      });
    }

    await db.query('BEGIN');

    try {
      // Actualizar rol
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (display_name !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        updateValues.push(display_name);
      }
      if (description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(description);
      }
      if (level !== undefined) {
        updateFields.push(`level = $${paramIndex++}`);
        updateValues.push(level);
      }
      if (color !== undefined) {
        updateFields.push(`color = $${paramIndex++}`);
        updateValues.push(color);
      }
      if (icon !== undefined) {
        updateFields.push(`icon = $${paramIndex++}`);
        updateValues.push(icon);
      }
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        updateValues.push(is_active);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(roleId);

      if (updateFields.length > 1) {
        const updateQuery = `
          UPDATE roles 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        await db.query(updateQuery, updateValues);
      }

      // Actualizar permisos si se proporcionaron
      if (permissions && Array.isArray(permissions)) {
        // Eliminar permisos existentes
        await db.query(`DELETE FROM roles_permissions WHERE role_id = $1`, [roleId]);

        // Insertar nuevos permisos
        if (permissions.length > 0) {
          const permissionQuery = `SELECT id, name FROM permissions WHERE name = ANY($1)`;
          const permissionResult = await db.query(permissionQuery, [permissions]);

          for (const perm of permissionResult.rows) {
            await db.query(
              `INSERT INTO roles_permissions (role_id, permission_id) VALUES ($1, $2)`,
              [roleId, perm.id]
            );
          }
        }
      }

      await db.query('COMMIT');

      // Obtener rol completo actualizado
      const fullRoleQuery = `
        SELECT 
          r.*,
          COALESCE(
            json_agg(
              json_build_object(
                'id', p.name,
                'name', p.display_name,
                'description', p.description,
                'category', p.category,
                'required', p.is_required
              ) ORDER BY p.category, p.name
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::json
          ) as permissions
        FROM roles r
        LEFT JOIN roles_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = $1
        GROUP BY r.id
      `;

      const fullRoleResult = await db.query(fullRoleQuery, [roleId]);

      res.json({
        success: true,
        message: 'Rol actualizado correctamente',
        data: {
          id: fullRoleResult.rows[0].name,
          name: fullRoleResult.rows[0].name,
          displayName: fullRoleResult.rows[0].display_name,
          description: fullRoleResult.rows[0].description,
          level: fullRoleResult.rows[0].level,
          color: fullRoleResult.rows[0].color,
          icon: fullRoleResult.rows[0].icon,
          isActive: fullRoleResult.rows[0].is_active,
          permissions: Array.isArray(fullRoleResult.rows[0].permissions) 
            ? fullRoleResult.rows[0].permissions 
            : []
        }
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error actualizando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar rol
router.delete('/roles/:id', auth, requireRole(['administrator']), async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar rol
    const findRoleQuery = `SELECT id, is_system FROM roles WHERE name = $1`;
    const findResult = await db.query(findRoleQuery, [id]);

    if (findResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Rol no encontrado'
      });
    }

    // No permitir eliminar roles del sistema
    if (findResult.rows[0].is_system) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden eliminar los roles del sistema'
      });
    }

    const roleId = findResult.rows[0].id;

    // Verificar si hay usuarios con este rol
    const usersQuery = `SELECT COUNT(*) as count FROM users WHERE role = $1`;
    const usersResult = await db.query(usersQuery, [id]);

    if (parseInt(usersResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un rol que tiene usuarios asignados'
      });
    }

    // Eliminar rol (CASCADE eliminará las relaciones en roles_permissions)
    await db.query(`DELETE FROM roles WHERE id = $1`, [roleId]);

    res.json({
      success: true,
      message: 'Rol eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando rol:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener todos los permisos disponibles
router.get('/permissions', auth, async (req, res) => {
  try {
    const query = `
      SELECT 
        name as id,
        name,
        display_name,
        description,
        category,
        is_required
      FROM permissions
      ORDER BY category, name
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows.map(row => ({
        id: row.id,
        name: row.name,
        displayName: row.display_name,
        description: row.description,
        category: row.category,
        required: row.is_required
      }))
    });
  } catch (error) {
    console.error('Error obteniendo permisos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
