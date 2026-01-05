const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Health check simple sin verificar DB
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Eventu Backend API',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 8080,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        type: process.env.DB_TYPE || 'mysql',
        host: process.env.DB_HOST || 'not configured',
        status: 'not checked' // No verificamos DB para evitar fallos
      }
    };

    console.log('✅ Health check successful:', healthData.status);
    res.status(200).json(healthData);
  } catch (error) {
    console.error('❌ Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'Eventu Backend API',
      error: error.message,
      uptime: process.uptime()
    });
  }
});

module.exports = router;
