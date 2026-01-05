const jwt = require("jsonwebtoken")
const User = require("../models/User")

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      })
    }

    const token = authHeader.replace("Bearer ", "")
    const decoded = jwt.verify(token, process.env.JWT_SECRET)



    // Verificar timeout de sesión si existe timestamp de actividad
    // Solo verificar timeout si el token tiene lastActivity y ha pasado más de 15 minutos
    if (decoded.lastActivity) {
      const now = Date.now()
      const lastActivity = decoded.lastActivity
      const timeoutMs = 15 * 60 * 1000 // 15 minutos
      const warningMs = 13 * 60 * 1000 // 13 minutos (advertencia)
      
      // Solo rechazar si ha pasado más de 15 minutos de inactividad
      if (now - lastActivity > timeoutMs) {
        console.log(`Session timeout for user ${decoded.userId}: ${Math.round((now - lastActivity) / 1000 / 60)} minutes of inactivity`)
        return res.status(401).json({
          success: false,
          message: "Session expired due to inactivity.",
          code: "SESSION_TIMEOUT",
          details: {
            lastActivity: new Date(lastActivity).toISOString(),
            timeoutMinutes: 15,
            inactiveMinutes: Math.round((now - lastActivity) / 1000 / 60)
          }
        })
      }
      
      // Agregar header de advertencia si está cerca del timeout
      if (now - lastActivity > warningMs) {
        const remainingMinutes = Math.ceil((timeoutMs - (now - lastActivity)) / 1000 / 60)
        res.setHeader("X-Session-Warning", `Session will expire in ${remainingMinutes} minutes`)
        res.setHeader("X-Session-Remaining", remainingMinutes.toString())
      }
    }

    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found.",
      })
    }

    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is not active.",
      })
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      company: user.company
    }

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      })
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired.",
      })
    }

    res.status(500).json({
      success: false,
      message: "Internal server error.",
    })
  }
}

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      })
    }

    const userRoles = Array.isArray(roles) ? roles : [roles]

    if (!userRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions.",
      })
    }

    next()
  }
}

module.exports = { auth, requireRole }
