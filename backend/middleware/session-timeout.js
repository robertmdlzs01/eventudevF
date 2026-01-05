const jwt = require("jsonwebtoken")

// Middleware para verificar timeout de sesión
const sessionTimeout = (timeoutMinutes = 15) => {
  return (req, res, next) => {
    try {
      const authHeader = req.header("Authorization")
      
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next() // Si no hay token, continuar (será manejado por auth middleware)
      }

      const token = authHeader.replace("Bearer ", "")
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret")
      
      // Verificar si el token tiene timestamp de última actividad
      if (decoded.lastActivity) {
        const now = Date.now()
        const lastActivity = decoded.lastActivity
        const timeoutMs = timeoutMinutes * 60 * 1000
        const warningMs = (timeoutMinutes - 2) * 60 * 1000 // 2 minutos antes del timeout
        
        // Si ha pasado más tiempo del permitido, rechazar la petición
        if (now - lastActivity > timeoutMs) {
          return res.status(401).json({
            success: false,
            message: "Session expired due to inactivity.",
            code: "SESSION_TIMEOUT"
          })
        }
        
        // Agregar header de advertencia si está cerca del timeout
        if (now - lastActivity > warningMs) {
          const remainingMinutes = Math.ceil((timeoutMs - (now - lastActivity)) / 1000 / 60)
          res.setHeader("X-Session-Warning", `Session will expire in ${remainingMinutes} minutes`)
          res.setHeader("X-Session-Remaining", remainingMinutes.toString())
        }
      }
      
      next()
    } catch (error) {
      // Si hay error en el token, continuar (será manejado por auth middleware)
      next()
    }
  }
}

// Middleware para actualizar timestamp de actividad
const updateActivity = (req, res, next) => {
  // Interceptar la respuesta para agregar el nuevo token
  const originalSend = res.send
  const originalJson = res.json
  
  res.send = function(body) {
    // Actualizar token si existe en req.user (después de auth middleware)
    if (req.user && req.user.userId) {
      try {
        const authHeader = req.header("Authorization")
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "")
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret")
          
          // Crear nuevo token con timestamp actualizado
          // Remover la propiedad exp del payload decodificado para evitar conflictos
          const { exp, iat, ...payload } = decoded
          const newToken = jwt.sign(
            {
              ...payload,
              lastActivity: Date.now()
            },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "24h" }
          )
          
          // Agregar el nuevo token al header de respuesta
          res.setHeader("X-New-Token", newToken)
          console.log('🔄 Token actualizado para usuario:', req.user.email)
        }
      } catch (error) {
        console.log('⚠️ Error actualizando token:', error.message)
      }
    }
    
    return originalSend.call(this, body)
  }
  
  res.json = function(body) {
    // Actualizar token si existe en req.user (después de auth middleware)
    if (req.user && req.user.userId) {
      try {
        const authHeader = req.header("Authorization")
        if (authHeader && authHeader.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "")
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret")
          
          // Crear nuevo token con timestamp actualizado
          // Remover la propiedad exp del payload decodificado para evitar conflictos
          const { exp, iat, ...payload } = decoded
          const newToken = jwt.sign(
            {
              ...payload,
              lastActivity: Date.now()
            },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "24h" }
          )
          
          // Agregar el nuevo token al header de respuesta
          res.setHeader("X-New-Token", newToken)
          console.log('🔄 Token actualizado para usuario:', req.user.email)
        }
      } catch (error) {
        console.log('⚠️ Error actualizando token:', error.message)
      }
    }
    
    return originalJson.call(this, body)
  }
  
  next()
}

module.exports = { sessionTimeout, updateActivity }
