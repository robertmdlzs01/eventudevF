const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const rateLimit = require("express-rate-limit")
const winston = require("winston")
const http = require("http")
const path = require("path")
require("dotenv").config({ path: "./config.env" })

const dbType = "postgresql"
const db = require("./config/database-postgres")

const authRoutes = require("./routes/auth")
const eventRoutes = require("./routes/events")
const userRoutes = require("./routes/users")
const categoryRoutes = require("./routes/categories")
const ticketTypeRoutes = require("./routes/ticketTypes")
const mediaRoutes = require("./routes/media")
const reportsRoutes = require("./routes/reports")
const analyticsRoutes = require("./routes/analytics")
const exportRoutes = require("./routes/export")
const settingsRoutes = require("./routes/settings")
const organizerRoutes = require("./routes/organizer")
const adminRoutes = require("./routes/admin")
const seatMapRoutes = require("./routes/seatMaps")
const paymentRoutes = require("./routes/payments")
const epaycoRoutes = require("./routes/epayco")
const cobruRoutes = require("./routes/cobru")
const ticketRoutes = require("./routes/tickets")
const salesRoutes = require("./routes/sales")
const passwordResetRoutes = require("./routes/passwordReset")
const auditRoutes = require("./routes/audit")
const adminDataRoutes = require("./routes/admin-data")
const backupRoutes = require("./routes/backup")
const securityRoutes = require("./routes/security")
const healthRoutes = require("./routes/health")
const physicalTicketsRoutes = require("./routes/physicalTickets")
const salesPointsRoutes = require("./routes/salesPoints")
const productsRoutes = require("./routes/products")
const userPrivilegesRoutes = require("./routes/userPrivileges")
const posRoutes = require("./routes/pos")
const userRolesRoutes = require("./routes/userRoles")
const notificationsRoutes = require("./routes/notifications")
const cartRoutes = require("./routes/cart")
const alertsRoutes = require("./routes/alerts")
const configRoutes = require("./routes/config")
const checkinRoutes = require("./routes/checkin")
const { sessionTimeout, updateActivity } = require("./middleware/session-timeout")
const auditMiddleware = require("./middleware/auditMiddleware")
const { require2FA } = require("./middleware/require2FA")
const { securityMonitoringMiddleware } = require("./middleware/securityMonitoring")
const { waf } = require("./middleware/waf")

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3001

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: { service: "eventu-backend" },
  transports: [
    new winston.transports.File({ filename: "logs/error.log", level: "error" }),
    new winston.transports.File({ filename: "logs/combined.log" }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: "Demasiadas peticiones. Intenta de nuevo en 15 minutos.",
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.method === 'OPTIONS'
  }
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    error: "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`🚨 Rate limit exceeded for IP: ${req.ip} on ${req.path}`);
    res.status(429).json({
      error: "Demasiados intentos de login. Intenta de nuevo en 15 minutos.",
      retryAfter: 15 * 60
    });
  }
})

app.use(helmet({
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
}))
app.use(compression())
app.use(generalLimiter)
// Configuración CORS más flexible para desarrollo
const corsOptions = {
  origin: function (origin, callback) {
    // En desarrollo, permitir localhost y direcciones IP locales
    if (process.env.NODE_ENV === 'development') {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
        'https://dev1.eventu.co',
        'https://www.dev1.eventu.co',
        'http://localhost:3000',
        'http://localhost:3001'
      ]
      
      // Permitir localhost con cualquier puerto
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true)
      }
      
      // Permitir direcciones IP locales (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const localIPPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/
      if (localIPPattern.test(origin)) {
        return callback(null, true)
      }
      
      // Verificar si el origen está en la lista permitida
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
    } else {
      // En producción, solo permitir orígenes específicos
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
        'https://dev1.eventu.co',
        'https://www.dev1.eventu.co'
      ]
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }
    }
    
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`)
  next()
})

app.use(securityMonitoringMiddleware)

app.use(express.json({ limit: "10mb" }))
app.use(express.urlencoded({ extended: true, limit: "10mb" }))

app.use('/images', express.static(path.join(__dirname, 'images')))
app.use('/videos', express.static(path.join(__dirname, 'videos')))
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbType,
  })
})

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API funcionando correctamente",
    timestamp: new Date().toISOString(),
    database: dbType,
    port: PORT
  })
})

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Eventu API v1.0",
    endpoints: [
      "/api/health",
      "/api/test",
      "/api/auth",
      "/api/events",
      "/api/users",
      "/api/organizer",
      "/api/admin"
    ]
  })
})

app.use(sessionTimeout(15))
app.use(updateActivity)
app.use(auditMiddleware())
app.use("/api/auth", authLimiter, authRoutes)
app.use("/api/password-reset", passwordResetRoutes)
app.use("/api/events", eventRoutes)
app.use("/api/users", userRoutes)
app.use("/api/categories", categoryRoutes)
app.use("/api/ticket-types", ticketTypeRoutes)
app.use("/api/media", mediaRoutes)
app.use("/api/reports", reportsRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/export", exportRoutes)
app.use("/api/settings", settingsRoutes)
app.use("/api/organizer", organizerRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/backup", require2FA, backupRoutes)
app.use("/api/security", require2FA, securityRoutes)
app.use("/api/seat-maps", seatMapRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/payments/epayco", epaycoRoutes)
app.use("/api/payments/cobru", cobruRoutes)
app.use("/api/tickets", ticketRoutes)
app.use("/api/sales", salesRoutes)
app.use("/api/audit", auditRoutes)
app.use("/api/health", healthRoutes)
app.use("/api/physical-tickets", physicalTicketsRoutes)
app.use("/api/sales-points", salesPointsRoutes)
app.use("/api/products", productsRoutes)
app.use("/api/users", userPrivilegesRoutes)
app.use("/api/pos", posRoutes)
app.use("/api/user-roles", userRolesRoutes)
app.use("/api/notifications", notificationsRoutes)
app.use("/api/cart", cartRoutes)
app.use("/api/alerts", alertsRoutes)
app.use("/api/config", configRoutes)
app.use("/api/checkin", checkinRoutes)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use((err, req, res, next) => {
  logger.error(err.stack)

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation error",
      errors: err.details,
    })
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    })
  }

  res.status(500).json({
    success: false,
    message: "Internal server error",
  })
})

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
})

const WebSocketServer = require('./websocket-server')
const wsServer = new WebSocketServer(server)

global.wsServer = wsServer
const HOST = process.env.HOST || '0.0.0.0'
server.listen(PORT, HOST, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`WebSocket server initialized`)
  logger.info(`Using ${dbType} database`)

  const testQuery = dbType === "postgresql" ? "SELECT NOW()" : "SELECT NOW()"

  db.query(testQuery)
    .then((result) => {
      logger.info(`${dbType} database connected successfully`)
    })
    .catch((err) => {
      logger.error(`${dbType} connection failed:`, err)
    })
})

module.exports = app
