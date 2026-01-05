const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const crypto = require('crypto');

// Rate limiting para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por IP
  skipSuccessfulRequests: true,
  message: {
    error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    // Log del intento de rate limiting
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
      retryAfter: 15 * 60
    });
  }
});

// Rate limiting general
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    error: 'Demasiadas peticiones. Intenta de nuevo en 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Configuración de Helmet para headers de seguridad
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" }
});

// Middleware para validar JWT
const validateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar expiración
    if (decoded.exp < Date.now() / 1000) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    console.warn(`JWT validation failed: ${error.message}`);
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para sanitizar entrada
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj.replace(/<script[^>]*>.*?</script>/gi, '')
                .replace(/<[^>]*>/g, '')
                .trim();
    }
    if (typeof obj === 'object' && obj !== null) {
      for (let key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };
  
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

// Middleware para logging de seguridad
const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      duration: duration,
      userId: req.user?.userId || 'anonymous'
    };
    
    // Log eventos de seguridad
    if (res.statusCode >= 400) {
      console.warn('Security Event:', JSON.stringify(logData));
    }
    
    // Log intentos de acceso a recursos sensibles
    if (req.url.includes('/admin') || req.url.includes('/api/admin')) {
      console.info('Admin Access:', JSON.stringify(logData));
    }
  });
  
  next();
};

module.exports = {
  authLimiter,
  generalLimiter,
  helmetConfig,
  validateJWT,
  sanitizeInput,
  securityLogger
};