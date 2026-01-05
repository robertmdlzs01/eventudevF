const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Obtener todas las configuraciones
router.get('/', auth, async (req, res) => {
  try {
    const { category } = req.query;
    
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
    const configs = result.rows.map(config => ({
      ...config,
      createdAt: new Date(config.created_at),
      updatedAt: new Date(config.updated_at),
      value: config.value_type === 'json' ? JSON.parse(config.value) : config.value
    }));
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener configuración por clave
router.get('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    
    const query = 'SELECT * FROM system_configs WHERE key = $1';
    const result = await db.query(query, [key]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Configuración no encontrada'
      });
    }
    
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
    console.error('Error obteniendo configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener configuraciones por categoría
router.get('/category/:category', auth, async (req, res) => {
  try {
    const { category } = req.params;
    
    const query = 'SELECT * FROM system_configs WHERE category = $1 ORDER BY key';
    const result = await db.query(query, [category]);
    
    const configs = result.rows.map(config => ({
      ...config,
      createdAt: new Date(config.created_at),
      updatedAt: new Date(config.updated_at),
      value: config.value_type === 'json' ? JSON.parse(config.value) : config.value
    }));
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar configuración
router.put('/:key', auth, async (req, res) => {
  try {
    const { key } = req.params;
    const { value, updatedBy, reason } = req.body;
    
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
    
    // Registrar cambio en el historial
    const historyQuery = `
      INSERT INTO config_history (config_key, old_value, new_value, changed_by, changed_at, reason, category)
      VALUES ($1, $2, $3, $4, NOW(), $5, $6)
    `;
    
    // Obtener valor anterior para el historial
    const oldValueQuery = 'SELECT value FROM system_configs WHERE key = $1';
    const oldResult = await db.query(oldValueQuery, [key]);
    const oldValue = oldResult.rows.length > 0 ? oldResult.rows[0].value : null;
    
    await db.query(historyQuery, [
      key,
      oldValue,
      stringValue,
      updatedBy,
      reason,
      result.rows[0].category
    ]);
    
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
    console.error('Error actualizando configuración:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar múltiples configuraciones
router.put('/batch', auth, async (req, res) => {
  try {
    const { configs, updatedBy, reason } = req.body;
    
    const results = [];
    
    for (const config of configs) {
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
      
      const result = await db.query(query, [stringValue, valueType, updatedBy, key]);
      
      if (result.rows.length > 0) {
        const configData = result.rows[0];
        const formattedConfig = {
          ...configData,
          createdAt: new Date(configData.created_at),
          updatedAt: new Date(configData.updated_at),
          value: configData.value_type === 'json' ? JSON.parse(configData.value) : configData.value
        };
        results.push(formattedConfig);
      }
    }
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error actualizando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

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

// Obtener categorías de configuración
router.get('/categories', auth, async (req, res) => {
  try {
    const query = 'SELECT * FROM config_categories ORDER BY order_index';
    const result = await db.query(query);
    
    const categories = result.rows.map(category => ({
      ...category,
      isActive: category.is_active
    }));
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

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

// Obtener información del sistema
router.get('/system-info', auth, async (req, res) => {
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
    
    // Obtener conteo de configuraciones
    const countQuery = 'SELECT COUNT(*) as count FROM system_configs';
    const countResult = await db.query(countQuery);
    info.configCount = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error obteniendo información del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

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

module.exports = router;
