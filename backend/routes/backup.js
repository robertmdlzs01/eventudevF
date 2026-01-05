const express = require('express');
const { auth } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const { backupService } = require('../services/backupService');
const router = express.Router();

/**
 * Rutas para gestión de backups
 * Solo accesibles para administradores
 */

// Crear backup manual
router.post('/create', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { type = 'full' } = req.body;
    
    let result;
    switch (type) {
      case 'full':
        result = await backupService.createFullBackup();
        break;
      case 'database':
        result = await backupService.createDatabaseBackup();
        break;
      case 'files':
        result = await backupService.createFilesBackup();
        break;
      case 'config':
        result = await backupService.createConfigBackup();
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo de backup inválido. Opciones: full, database, files, config'
        });
    }

    res.json({
      success: true,
      message: `Backup ${type} creado exitosamente`,
      data: result
    });

  } catch (error) {
    console.error('Error creando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Listar backups disponibles
router.get('/list', auth, requireRole(['admin']), async (req, res) => {
  try {
    const backups = backupService.getAvailableBackups();
    
    res.json({
      success: true,
      data: backups,
      count: backups.length
    });

  } catch (error) {
    console.error('Error listando backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener información de un backup específico
router.get('/info/:backupName', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { backupName } = req.params;
    const backups = backupService.getAvailableBackups();
    const backup = backups.find(b => b.name === backupName);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }

    // Verificar integridad
    const isValid = await backupService.verifyBackupIntegrity(backup.path);

    res.json({
      success: true,
      data: {
        ...backup,
        isValid,
        sizeFormatted: `${(backup.size / 1024 / 1024).toFixed(2)} MB`
      }
    });

  } catch (error) {
    console.error('Error obteniendo información del backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Restaurar backup
router.post('/restore/:backupName', auth, requireRole(['admin']), async (req, res) => {
  try {
    const { backupName } = req.params;
    const { confirm } = req.body;

    if (!confirm) {
      return res.status(400).json({
        success: false,
        message: 'Debe confirmar la restauración enviando confirm: true'
      });
    }

    const backups = backupService.getAvailableBackups();
    const backup = backups.find(b => b.name === backupName);

    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Backup no encontrado'
      });
    }

    const result = await backupService.restoreBackup(backup.path);

    res.json({
      success: true,
      message: 'Backup restaurado exitosamente',
      data: result
    });

  } catch (error) {
    console.error('Error restaurando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Limpiar backups antiguos
router.post('/cleanup', auth, requireRole(['admin']), async (req, res) => {
  try {
    await backupService.cleanupOldBackups();

    res.json({
      success: true,
      message: 'Limpieza de backups antiguos completada'
    });

  } catch (error) {
    console.error('Error limpiando backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener estadísticas de backups
router.get('/stats', auth, requireRole(['admin']), async (req, res) => {
  try {
    const backups = backupService.getAvailableBackups();
    
    const stats = {
      totalBackups: backups.length,
      totalSize: backups.reduce((sum, backup) => sum + backup.size, 0),
      oldestBackup: backups.length > 0 ? Math.min(...backups.map(b => b.created.getTime())) : null,
      newestBackup: backups.length > 0 ? Math.max(...backups.map(b => b.created.getTime())) : null,
      averageSize: backups.length > 0 ? backups.reduce((sum, backup) => sum + backup.size, 0) / backups.length : 0
    };

    res.json({
      success: true,
      data: {
        ...stats,
        totalSizeFormatted: `${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`,
        averageSizeFormatted: `${(stats.averageSize / 1024 / 1024).toFixed(2)} MB`,
        oldestBackupFormatted: stats.oldestBackup ? new Date(stats.oldestBackup).toISOString() : null,
        newestBackupFormatted: stats.newestBackup ? new Date(stats.newestBackup).toISOString() : null
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
