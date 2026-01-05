const express = require('express');
const { auth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { securityMonitoringService } = require('../services/securityMonitoringService');
const router = express.Router();

/**
 * Rutas para monitoreo de seguridad
 * Solo accesibles para administradores
 */

// Obtener estadísticas de seguridad
router.get('/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const stats = securityMonitoringService.getSecurityStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Resetear contadores de alertas
router.post('/reset-counters', auth, requireRole(['admin']), async (req, res) => {
  try {
    securityMonitoringService.resetAlertCounters();
    
    res.json({
      success: true,
      message: 'Contadores de alertas reseteados'
    });
  } catch (error) {
    console.error('Error reseteando contadores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener eventos de seguridad recientes
router.get('/events', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { limit = 50, type, severity } = req.query;
    const stats = securityMonitoringService.getSecurityStats();
    
    let events = stats.recentEvents;
    
    // Filtrar por tipo si se especifica
    if (type) {
      events = events.filter(event => event.type === type);
    }
    
    // Filtrar por severidad si se especifica
    if (severity) {
      events = events.filter(event => event.severity === severity);
    }
    
    // Limitar resultados
    events = events.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
  } catch (error) {
    console.error('Error obteniendo eventos de seguridad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
