const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Helper para verificar si la tabla alerts existe
async function checkAlertsTableExists() {
  try {
    const result = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'alerts'
      )
    `);
    return result.rows[0]?.exists || false;
  } catch (error) {
    console.warn('Error verificando existencia de tabla alerts:', error);
    return false;
  }
}

// Obtener todas las alertas
router.get('/', auth, async (req, res) => {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkAlertsTableExists();
    if (!tableExists) {
      return res.json({
        success: true,
        data: []
      });
    }

    const { type, category, priority, status, startDate, endDate, source } = req.query;
    
    let query = 'SELECT * FROM alerts WHERE 1=1';
    const params = [];
    let paramCount = 1;
    
    if (type) {
      query += ` AND type = $${paramCount}`;
      params.push(type);
      paramCount++;
    }
    
    if (category) {
      query += ` AND category = $${paramCount}`;
      params.push(category);
      paramCount++;
    }
    
    if (priority) {
      query += ` AND priority = $${paramCount}`;
      params.push(priority);
      paramCount++;
    }
    
    if (status) {
      query += ` AND status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (startDate) {
      query += ` AND created_at >= $${paramCount}`;
      params.push(startDate);
      paramCount++;
    }
    
    if (endDate) {
      query += ` AND created_at <= $${paramCount}`;
      params.push(endDate);
      paramCount++;
    }
    
    if (source) {
      query += ` AND source = $${paramCount}`;
      params.push(source);
      paramCount++;
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await db.query(query, params);
    const alerts = result.rows.map(alert => ({
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    }));
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// IMPORTANTE: Las rutas específicas (/stats, /realtime) deben ir ANTES de las rutas dinámicas (/:id)
// para evitar que Express las capture con el parámetro :id

// Obtener estadísticas de alertas
router.get('/stats', auth, async (req, res) => {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkAlertsTableExists();
    if (!tableExists) {
      return res.json({
        success: true,
        data: {
          total: 0,
          active: 0,
          acknowledged: 0,
          resolved: 0,
          dismissed: 0,
          byType: {},
          byCategory: {},
          byPriority: {},
          recent: []
        }
      });
    }

    // Total de alertas
    const totalQuery = 'SELECT COUNT(*) as total FROM alerts';
    const totalResult = await db.query(totalQuery);
    const total = parseInt(totalResult.rows[0].total);
    
    // Alertas por estado
    const statusQuery = `
      SELECT status, COUNT(*) as count 
      FROM alerts 
      GROUP BY status
    `;
    const statusResult = await db.query(statusQuery);
    const statusStats = statusResult.rows.reduce((acc, row) => {
      acc[row.status] = parseInt(row.count);
      return acc;
    }, {});
    
    // Alertas por tipo
    const typeQuery = `
      SELECT type, COUNT(*) as count 
      FROM alerts 
      GROUP BY type
    `;
    const typeResult = await db.query(typeQuery);
    const typeStats = typeResult.rows.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {});
    
    // Alertas por categoría
    const categoryQuery = `
      SELECT category, COUNT(*) as count 
      FROM alerts 
      GROUP BY category
    `;
    const categoryResult = await db.query(categoryQuery);
    const categoryStats = categoryResult.rows.reduce((acc, row) => {
      acc[row.category] = parseInt(row.count);
      return acc;
    }, {});
    
    // Alertas por prioridad
    const priorityQuery = `
      SELECT priority, COUNT(*) as count 
      FROM alerts 
      GROUP BY priority
    `;
    const priorityResult = await db.query(priorityQuery);
    const priorityStats = priorityResult.rows.reduce((acc, row) => {
      acc[row.priority] = parseInt(row.count);
      return acc;
    }, {});
    
    // Alertas recientes
    const recentQuery = `
      SELECT * FROM alerts 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    const recentResult = await db.query(recentQuery);
    const recent = recentResult.rows.map(alert => ({
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    }));
    
    const stats = {
      total,
      active: statusStats.active || 0,
      acknowledged: statusStats.acknowledged || 0,
      resolved: statusStats.resolved || 0,
      dismissed: statusStats.dismissed || 0,
      byType: typeStats,
      byCategory: categoryStats,
      byPriority: priorityStats,
      recent
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alertas en tiempo real
router.get('/realtime', auth, async (req, res) => {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkAlertsTableExists();
    if (!tableExists) {
      return res.json({
        success: true,
        data: []
      });
    }

    const query = `
      SELECT * FROM alerts 
      WHERE status = 'active' 
      AND created_at >= NOW() - INTERVAL '1 hour'
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query);
    const alerts = result.rows.map(alert => ({
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    }));
    
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error obteniendo alertas en tiempo real:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener alerta por ID (DEBE ir DESPUÉS de las rutas específicas)
router.get('/:id', auth, async (req, res) => {
  try {
    // Verificar si la tabla existe
    const tableExists = await checkAlertsTableExists();
    if (!tableExists) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    const { id } = req.params;
    
    const query = 'SELECT * FROM alerts WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    const alert = result.rows[0];
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error obteniendo alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva alerta
router.post('/', auth, async (req, res) => {
  try {
    const {
      type,
      title,
      message,
      category,
      priority,
      source,
      metadata,
      actions
    } = req.body;
    
    const query = `
      INSERT INTO alerts (
        type, title, message, category, priority, status, source, 
        metadata, actions, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const params = [
      type,
      title,
      message,
      category,
      priority,
      source,
      metadata ? JSON.stringify(metadata) : null,
      actions ? JSON.stringify(actions) : null
    ];
    
    const result = await db.query(query, params);
    const alert = result.rows[0];
    
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar alerta
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['title', 'message', 'category', 'priority', 'status', 'metadata', 'actions'];
    const updateFields = [];
    const params = [];
    let paramCount = 1;
    
    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        if (key === 'metadata' || key === 'actions') {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          params.push(value);
        }
        paramCount++;
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }
    
    updateFields.push(`updated_at = NOW()`);
    params.push(id);
    
    const query = `
      UPDATE alerts 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    const alert = result.rows[0];
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error actualizando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Reconocer alerta
router.post('/:id/acknowledge', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy, acknowledgedAt } = req.body;
    
    const query = `
      UPDATE alerts 
      SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [acknowledgedBy, acknowledgedAt, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    const alert = result.rows[0];
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error reconociendo alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Resolver alerta
router.post('/:id/resolve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolvedBy, resolvedAt, resolution } = req.body;
    
    const query = `
      UPDATE alerts 
      SET status = 'resolved', resolved_by = $1, resolved_at = $2, resolution = $3, updated_at = NOW()
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await db.query(query, [resolvedBy, resolvedAt, resolution, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    const alert = result.rows[0];
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error resolviendo alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Descartar alerta
router.post('/:id/dismiss', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { dismissedBy, dismissedAt } = req.body;
    
    const query = `
      UPDATE alerts 
      SET status = 'dismissed', dismissed_by = $1, dismissed_at = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;
    
    const result = await db.query(query, [dismissedBy, dismissedAt, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    const alert = result.rows[0];
    const formattedAlert = {
      ...alert,
      createdAt: new Date(alert.created_at),
      updatedAt: new Date(alert.updated_at),
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : null,
      resolvedAt: alert.resolved_at ? new Date(alert.resolved_at) : null,
      metadata: alert.metadata ? JSON.parse(alert.metadata) : null,
      actions: alert.actions ? JSON.parse(alert.actions) : null
    };
    
    res.json({
      success: true,
      data: formattedAlert
    });
  } catch (error) {
    console.error('Error descartando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar alerta
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = 'DELETE FROM alerts WHERE id = $1';
    const result = await db.query(query, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }
    
    res.json({
      success: true,
      message: 'Alerta eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando alerta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Exportar alertas
router.post('/export', auth, async (req, res) => {
  try {
    const { format, filter } = req.body;
    
    // Simular exportación
    const exportData = {
      format,
      filter,
      timestamp: new Date().toISOString(),
      count: 0
    };
    
    let contentType, filename;
    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        filename = 'alerts.csv';
        break;
      case 'excel':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = 'alerts.xlsx';
        break;
      case 'pdf':
        contentType = 'application/pdf';
        filename = 'alerts.pdf';
        break;
      default:
        contentType = 'application/json';
        filename = 'alerts.json';
    }
    
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(exportData, null, 2));
  } catch (error) {
    console.error('Error exportando alertas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Limpiar alertas antiguas
router.post('/cleanup', auth, async (req, res) => {
  try {
    const { daysOld } = req.body;
    
    const query = `
      DELETE FROM alerts 
      WHERE status IN ('resolved', 'dismissed') 
      AND created_at < NOW() - INTERVAL '${daysOld} days'
    `;
    
    const result = await db.query(query);
    
    res.json({
      success: true,
      cleanedCount: result.rowCount
    });
  } catch (error) {
    console.error('Error limpiando alertas antiguas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
