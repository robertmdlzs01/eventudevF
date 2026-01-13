const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { query } = require('../config/database-postgres');

// Crear un objeto db que tenga el método query para compatibilidad
const db = {
  query: query
};

// Wrapper para manejar errores de manera más robusta
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      console.error('Error no capturado:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Error interno del servidor',
          error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }
    });
  };
};

// Obtener todas las configuraciones (sin auth en desarrollo)
router.get('/', process.env.NODE_ENV === 'production' ? auth : (req, res, next) => next(), asyncHandler(async (req, res) => {
  try {
    const { category } = req.query;
    
    // Verificar si la tabla existe (con manejo de errores)
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla system_configs:', tableCheckError);
      // Si falla la verificación, asumir que no existe
      tableExists = false;
    }
    
    if (!tableExists) {
      // Si la tabla no existe, retornar array vacío
      return res.json({
        success: true,
        data: []
      });
    }
    
    let query = 'SELECT * FROM system_configs WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    query += ' ORDER BY category, key';
    
    const result = await db.query(query, params);
    const configs = result.rows.map(config => {
      try {
        return {
          ...config,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          value: config.value_type === 'json' && config.value ? JSON.parse(config.value) : config.value
        };
      } catch (parseError) {
        console.warn(`Error parsing value for config ${config.key}:`, parseError);
        return {
          ...config,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          value: config.value
        };
      }
    });
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    // Si hay error, retornar array vacío en lugar de error 500
    if (!res.headersSent) {
      res.json({
        success: true,
        data: []
      });
    }
  }
}));

// Obtener configuraciones por categoría (sin auth en desarrollo)
router.get('/category/:category', process.env.NODE_ENV === 'production' ? auth : (req, res, next) => next(), asyncHandler(async (req, res) => {
  try {
    const { category } = req.params;
    
    // Verificar si la tabla existe (con manejo de errores)
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla system_configs:', tableCheckError);
      tableExists = false;
    }
    
    if (!tableExists) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const query = 'SELECT * FROM system_configs WHERE category = $1 ORDER BY key';
    const result = await db.query(query, [category]);
    
    const configs = result.rows.map(config => {
      try {
        return {
          ...config,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          value: config.value_type === 'json' && config.value ? JSON.parse(config.value) : config.value
        };
      } catch (parseError) {
        console.warn(`Error parsing value for config ${config.key}:`, parseError);
        return {
          ...config,
          createdAt: new Date(config.created_at),
          updatedAt: new Date(config.updated_at),
          value: config.value
        };
      }
    });
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones por categoría:', error);
    // Retornar array vacío en lugar de error 500
    if (!res.headersSent) {
      res.json({
        success: true,
        data: []
      });
    }
  }
}));

// Actualizar configuración
router.put('/:key', auth, asyncHandler(async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy, reason } = req.body;
    
    // Verificar si la tabla existe primero
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla system_configs:', tableCheckError);
      tableExists = false;
    }
    
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'La tabla de configuraciones no existe'
      });
    }
    
    // Determinar el tipo de valor
    const valueType = typeof value === 'object' ? 'json' : typeof value;
    const stringValue = valueType === 'json' ? JSON.stringify(value) : String(value);
    
    const query = `
      UPDATE system_configs 
      SET value = $1, value_type = $2, updated_at = NOW(), updated_by = $3
      WHERE key = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [stringValue, valueType, updatedBy, key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    // Registrar cambio en el historial (si la tabla existe)
    try {
      const historyTableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'config_history'
        )
      `);
      
      if (historyTableCheck.rows[0]?.exists) {
        // Obtener valor anterior para el historial
        const oldValueQuery = 'SELECT value FROM system_configs WHERE key = $1';
        const oldResult = await db.query(oldValueQuery, [key]);
        const oldValue = oldResult.rows.length > 0 ? oldResult.rows[0].value : null;
        
        const historyQuery = `
          INSERT INTO config_history (config_key, old_value, new_value, changed_by, changed_at, reason, category)
          VALUES ($1, $2, $3, $4, NOW(), $5, $6)
        `;
        
        await db.query(historyQuery, [
          key,
          oldValue,
          stringValue,
          updatedBy,
          reason,
          result.rows[0].category
        ]);
      }
    } catch (historyError) {
      console.warn('No se pudo registrar en historial:', historyError);
      // Continuar sin historial
    }
    
    const config = result.rows[0];
    try {
      const formattedConfig = {
        ...config,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        value: config.value_type === 'json' && config.value ? JSON.parse(config.value) : config.value
      };
      
      res.json({
        success: true,
        data: formattedConfig
      });
    } catch (parseError) {
      console.warn(`Error parsing config value:`, parseError);
      const formattedConfig = {
        ...config,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        value: config.value
      };
      
      res.json({
        success: true,
        data: formattedConfig
      });
    }
  } catch (error) {
    console.error('Error actualizando configuración:', error);
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
  }
}));

// Actualizar múltiples configuraciones
router.put('/batch', auth, asyncHandler(async (req, res) => {
  try {
    const { configs, updatedBy, reason } = req.body;
    
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de configuraciones'
      });
    }
    
    // Verificar si la tabla existe primero
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla system_configs:', tableCheckError);
      tableExists = false;
    }
    
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'La tabla de configuraciones no existe'
      });
    }
    
    const results = [];
    
    for (const config of configs) {
      try {
        const { key, value } = config;
        
        // Determinar el tipo de valor
        const valueType = typeof value === 'object' ? 'json' : typeof value;
        const stringValue = valueType === 'json' ? JSON.stringify(value) : String(value);
        
        const query = `
          UPDATE system_configs 
          SET value = $1, value_type = $2, updated_at = NOW(), updated_by = $3
          WHERE key = $4
          RETURNING *
        `;
        
        const result = await db.query(query, [stringValue, valueType, updatedBy || 'system', key]);
        
        if (result.rows.length > 0) {
          const configData = result.rows[0];
          try {
            const formattedConfig = {
              ...configData,
              createdAt: new Date(configData.created_at),
              updatedAt: new Date(configData.updated_at),
              value: configData.value_type === 'json' && configData.value ? JSON.parse(configData.value) : configData.value
            };
            results.push(formattedConfig);
          } catch (parseError) {
            console.warn(`Error parsing config value for ${key}:`, parseError);
            const formattedConfig = {
              ...configData,
              createdAt: new Date(configData.created_at),
              updatedAt: new Date(configData.updated_at),
              value: configData.value
            };
            results.push(formattedConfig);
          }
        }
      } catch (configError) {
        console.warn(`Error actualizando config ${config.key}:`, configError);
        // Continuar con el siguiente
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
}));

// Crear nueva configuración
router.post('/', auth, async (req, res) => {
  try {
    const {
      category,
      key,
      value,
      type,
      description,
      isRequired,
      isPublic,
      defaultValue,
      validation
    } = req.body;
    
    // Determinar el tipo de valor
    const valueType = typeof value === 'object' ? 'json' : typeof value;
    const stringValue = valueType === 'json' ? JSON.stringify(value) : String(value);
    
    const query = `
      INSERT INTO system_configs (
        category, key, value, value_type, type, description, is_required, is_public, 
        default_value, validation, created_at, updated_at, updated_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW(), $11)
      RETURNING *
    `;
    
    const params = [
      category,
      key,
      stringValue,
      valueType,
      type,
      description,
      isRequired,
      isPublic,
      defaultValue,
      validation ? JSON.stringify(validation) : null,
      'system'
    ];
    
    const result = await db.query(query, params);
    const config = result.rows[0];
    
    const formattedConfig = {
      ...config,
      createdAt: new Date(config.created_at),
      updatedAt: new Date(config.updated_at),
      value: config.value_type === 'json' ? JSON.parse(config.value) : config.value
    };
    
    res.json({
      success: true,
      data: formattedConfig
    });
  } catch (error) {
    console.error('Error creando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar configuración
router.delete('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    
    const query = 'DELETE FROM system_configs WHERE key = $1';
    const result = await db.query(query, [key]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Configuración eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener categorías de configuración (sin auth en desarrollo)
router.get('/categories', process.env.NODE_ENV === 'production' ? auth : (req, res, next) => next(), asyncHandler(async (req, res) => {
  try {
    // Verificar si la tabla existe (con manejo de errores)
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'config_categories'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla config_categories:', tableCheckError);
      tableExists = false;
    }
    
    if (!tableExists) {
      // Si la tabla no existe, retornar categorías por defecto
      return res.json({
        success: true,
        data: [
          { id: 'general', name: 'General', description: 'Configuraciones generales', icon: 'Settings', color: 'blue', order: 1, isActive: true, is_active: true, order_index: 1 },
          { id: 'security', name: 'Seguridad', description: 'Configuraciones de seguridad', icon: 'Shield', color: 'red', order: 2, isActive: true, is_active: true, order_index: 2 },
          { id: 'business', name: 'Negocio', description: 'Configuraciones de negocio', icon: 'DollarSign', color: 'green', order: 3, isActive: true, is_active: true, order_index: 3 },
          { id: 'notifications', name: 'Notificaciones', description: 'Configuraciones de notificaciones', icon: 'Bell', color: 'yellow', order: 4, isActive: true, is_active: true, order_index: 4 },
        ]
      });
    }
    
    const query = 'SELECT * FROM config_categories ORDER BY order_index';
    const result = await db.query(query);
    
    // Filtrar duplicados por ID y mapear datos
    const uniqueCategories = result.rows.reduce((acc, category) => {
      const existingIndex = acc.findIndex(c => c.id === category.id);
      if (existingIndex === -1) {
        acc.push({
          ...category,
          isActive: category.is_active
        });
      }
      return acc;
    }, []);
    
    res.json({
      success: true,
      data: uniqueCategories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    // Retornar categorías por defecto en caso de error
    if (!res.headersSent) {
      res.json({
        success: true,
        data: [
          { id: 'general', name: 'General', description: 'Configuraciones generales', icon: 'Settings', color: 'blue', order: 1, isActive: true, is_active: true, order_index: 1 },
          { id: 'security', name: 'Seguridad', description: 'Configuraciones de seguridad', icon: 'Shield', color: 'red', order: 2, isActive: true, is_active: true, order_index: 2 },
          { id: 'business', name: 'Negocio', description: 'Configuraciones de negocio', icon: 'DollarSign', color: 'green', order: 3, isActive: true, is_active: true, order_index: 3 },
          { id: 'notifications', name: 'Notificaciones', description: 'Configuraciones de notificaciones', icon: 'Bell', color: 'yellow', order: 4, isActive: true, is_active: true, order_index: 4 },
        ]
      });
    }
  }
}));

// Validar configuraciones
router.post('/validate', auth, async (req, res) => {
  try {
    const configs = req.body;
    const errors = [];
    const warnings = [];
    
    // Obtener reglas de validación de la base de datos
    const validationQuery = 'SELECT key, validation FROM system_configs WHERE validation IS NOT NULL';
    const validationResult = await db.query(validationQuery);
    
    for (const [key, value] of Object.entries(configs)) {
      const configValidation = validationResult.rows.find(row => row.key === key);
      
      if (configValidation) {
        const rules = JSON.parse(configValidation.validation);
        
        // Validar tipo
        if (rules.type && typeof value !== rules.type) {
          errors.push({
            key,
            message: `El valor debe ser de tipo ${rules.type}`,
            severity: 'error'
          });
        }
        
        // Validar rango numérico
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            key,
            message: `El valor debe ser mayor o igual a ${rules.min}`,
            severity: 'error'
          });
        }
        
        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            key,
            message: `El valor debe ser menor o igual a ${rules.max}`,
            severity: 'error'
          });
        }
        
        // Validar opciones
        if (rules.options && !rules.options.includes(value)) {
          errors.push({
            key,
            message: `El valor debe ser uno de: ${rules.options.join(', ')}`,
            severity: 'error'
          });
        }
        
        // Validar patrón
        if (rules.pattern && !new RegExp(rules.pattern).test(value)) {
          errors.push({
            key,
            message: `El valor no coincide con el patrón requerido`,
            severity: 'error'
          });
        }
      }
    }
    
    const validation = {
      isValid: errors.length === 0,
      errors,
      warnings
    };
    
    res.json({
      success: true,
      data: validation
    });
  } catch (error) {
    console.error('Error validando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener historial de cambios
router.get('/history', auth, async (req, res) => {
  try {
    const { key, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM config_history WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (key) {
      query += ` AND config_key = $${paramCount}`;
      params.push(key);
      paramCount++;
    }
    
    query += ` ORDER BY changed_at DESC LIMIT $${paramCount}`;
    params.push(parseInt(limit));
    
    const result = await db.query(query, params);
    const history = result.rows.map(change => ({
      ...change,
      changedAt: new Date(change.changed_at)
    }));
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener información del sistema (sin auth en desarrollo)
router.get('/system-info', process.env.NODE_ENV === 'production' ? auth : (req, res, next) => next(), asyncHandler(async (req, res) => {
  try {
    const info = {
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'PostgreSQL',
      server: 'Node.js',
      uptime: Math.floor(process.uptime() / 86400), // días
      lastUpdate: new Date(),
      configCount: 0,
      lastBackup: new Date()
    };
    
    // Verificar si la tabla existe antes de contar
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      
      if (tableCheck.rows[0]?.exists) {
        // Obtener conteo de configuraciones
        try {
          const countQuery = 'SELECT COUNT(*) as count FROM system_configs';
          const countResult = await db.query(countQuery);
          info.configCount = parseInt(countResult.rows[0]?.count) || 0;
        } catch (countError) {
          console.warn('No se pudo contar configuraciones:', countError);
          info.configCount = 0;
        }
      }
    } catch (tableCheckError) {
      console.warn('Error verificando tabla system_configs:', tableCheckError);
      // Continuar con configCount = 0
      info.configCount = 0;
    }
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error obteniendo información del sistema:', error);
    // Retornar información básica en caso de error
    if (!res.headersSent) {
      res.json({
        success: true,
        data: {
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          database: 'PostgreSQL',
          server: 'Node.js',
          uptime: 0,
          lastUpdate: new Date(),
          configCount: 0,
          lastBackup: new Date()
        }
      });
    }
  }
}));

// Exportar configuración
router.get('/export/:format', auth, async (req, res) => {
  try {
    const { format } = req.params;
    
    const query = 'SELECT key, value, category FROM system_configs WHERE is_public = true';
    const result = await db.query(query);
    
    const configs = result.rows.reduce((acc, row) => {
      acc[row.key] = row.value;
      return acc;
    }, {});
    
    let contentType, filename, content;
    
    switch (format) {
      case 'json':
        contentType = 'application/json';
        filename = 'config.json';
        content = JSON.stringify(configs, null, 2);
        break;
      case 'yaml':
        contentType = 'text/yaml';
        filename = 'config.yaml';
        content = Object.entries(configs)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join('\n');
        break;
      case 'env':
        contentType = 'text/plain';
        filename = 'config.env';
        content = Object.entries(configs)
          .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
          .join('\n');
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Formato no soportado'
        });
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  } catch (error) {
    console.error('Error exportando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener configuración por clave (DEBE IR AL FINAL, después de todas las rutas específicas)
router.get('/:key', process.env.NODE_ENV === 'production' ? auth : (req, res, next) => next(), asyncHandler(async (req, res) => {
  try {
    const { key } = req.params;
    
    // Verificar si la tabla existe primero
    let tableExists = false;
    try {
      const tableCheck = await db.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'system_configs'
        )
      `);
      tableExists = tableCheck.rows[0]?.exists || false;
    } catch (tableCheckError) {
      console.warn('Error verificando existencia de tabla system_configs:', tableCheckError);
      tableExists = false;
    }
    
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    const query = 'SELECT * FROM system_configs WHERE key = $1';
    const result = await db.query(query, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
    const config = result.rows[0];
    try {
      const formattedConfig = {
        ...config,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        value: config.value_type === 'json' && config.value ? JSON.parse(config.value) : config.value
      };
      
      res.json({
        success: true,
        data: formattedConfig
      });
    } catch (parseError) {
      console.warn(`Error parsing config value for ${key}:`, parseError);
      const formattedConfig = {
        ...config,
        createdAt: new Date(config.created_at),
        updatedAt: new Date(config.updated_at),
        value: config.value
      };
      
      res.json({
        success: true,
        data: formattedConfig
      });
    }
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    if (!res.headersSent) {
      res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
  }
}));

module.exports = router;
