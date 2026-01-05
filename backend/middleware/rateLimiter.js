const rateLimit = require('express-rate-limit')

// Rate limiter para recuperación de contraseña
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 3, // máximo 3 intentos por IP
  message: {
    success: false,
    error: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de recuperación de contraseña. Intenta de nuevo en 15 minutos.'
    })
  }
})

// Rate limiter para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos por IP
  message: {
    success: false,
    error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.'
    })
  }
})

// Rate limiter general para API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    success: false,
    error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
    })
  }
})

module.exports = {
  passwordResetLimiter,
  loginLimiter,
  apiLimiter
}
