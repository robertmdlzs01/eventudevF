const express = require('express');
const router = express.Router();
const { db } = require('../config/database-postgres');

// Obtener todas las boletas físicas
router.get('/', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        pt.*,
        e.title as event_title,
        e.date as event_date,
        e.venue as event_venue
      FROM physical_tickets pt
      LEFT JOIN events e ON pt.event_id = e.id
      ORDER BY pt.created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener boletas físicas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener boletas físicas por evento
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await db.query(`
      SELECT 
        pt.*,
        e.title as event_title,
        e.date as event_date,
        e.venue as event_venue
      FROM physical_tickets pt
      LEFT JOIN events e ON pt.event_id = e.id
      WHERE pt.event_id = $1
      ORDER BY pt.created_at DESC
    `, [eventId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error al obtener boletas físicas del evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Crear nueva boleta física
router.post('/', async (req, res) => {
  try {
    const {
      event_id,
      ticket_type,
      price,
      quantity_available,
      description,
      is_active = true
    } = req.body;

    // Validar datos requeridos
    if (!event_id || !ticket_type || !price || !quantity_available) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos'
      });
    }

    const result = await db.query(`
      INSERT INTO physical_tickets (
        event_id, ticket_type, price, quantity_available, 
        description, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [event_id, ticket_type, price, quantity_available, description, is_active]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Boleta física creada exitosamente'
    });
  } catch (error) {
    console.error('Error al crear boleta física:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Actualizar boleta física
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      ticket_type,
      price,
      quantity_available,
      description,
      is_active
    } = req.body;

    const result = await db.query(`
      UPDATE physical_tickets 
      SET 
        ticket_type = COALESCE($1, ticket_type),
        price = COALESCE($2, price),
        quantity_available = COALESCE($3, quantity_available),
        description = COALESCE($4, description),
        is_active = COALESCE($5, is_active),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `, [ticket_type, price, quantity_available, description, is_active, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Boleta física no encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Boleta física actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar boleta física:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Eliminar boleta física
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      DELETE FROM physical_tickets 
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Boleta física no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Boleta física eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar boleta física:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de boletas físicas
router.get('/stats/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const result = await db.query(`
      SELECT 
        COUNT(*) as total_tickets,
        SUM(quantity_available) as total_available,
        SUM(price * quantity_available) as total_value,
        AVG(price) as average_price
      FROM physical_tickets 
      WHERE event_id = $1 AND is_active = true
    `, [eventId]);

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;

