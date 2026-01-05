const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware para requerir 2FA obligatorio para administradores
 */
const require2FA = async (req, res, next) => {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación requerido'
      });
    }

    // Solo aplicar 2FA a administradores
    if (req.user.role === 'admin') {
      // Verificar si el token tiene 2FA verificado
      const token = req.header('Authorization')?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Token de acceso requerido'
        });
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Verificar si el token tiene 2FA verificado
        if (!decoded.twoFactorVerified) {
          return res.status(403).json({
            success: false,
            message: 'Autenticación de dos factores requerida para administradores',
            code: '2FA_REQUIRED',
            requires2FA: true
          });
        }

        // Verificar que el 2FA no haya expirado (máximo 8 horas)
        const twoFactorExpiry = decoded.twoFactorExpiry;
        if (twoFactorExpiry && Date.now() > twoFactorExpiry) {
          return res.status(403).json({
            success: false,
            message: 'Autenticación de dos factores expirada. Por favor, vuelve a autenticarte.',
            code: '2FA_EXPIRED',
            requires2FA: true
          });
        }

      } catch (jwtError) {
        console.error('Error verificando 2FA en token:', jwtError);
        return res.status(401).json({
          success: false,
          message: 'Token inválido o expirado'
        });
      }
    }

    // Si no es admin o 2FA está verificado, continuar
    next();
  } catch (error) {
    console.error('Error en middleware require2FA:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar 2FA en endpoints específicos
 */
const require2FAForEndpoint = (endpoint) => {
  return async (req, res, next) => {
    // Lista de endpoints que requieren 2FA para admins
    const protectedEndpoints = [
      '/api/admin/users',
      '/api/admin/events',
      '/api/admin/settings',
      '/api/admin/delete',
      '/api/admin/create',
      '/api/admin/update'
    ];

    const requires2FA = protectedEndpoints.some(protectedEndpoint => 
      req.path.startsWith(protectedEndpoint)
    );

    if (requires2FA) {
      return require2FA(req, res, next);
    }

    next();
  };
};

module.exports = {
  require2FA,
  require2FAForEndpoint
};
