const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Acceso denegado. Token de autenticación requerido."
        })
      }

      // Verificar que el usuario tenga el rol requerido
      if (req.user.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: `Acceso denegado. Se requiere rol: ${requiredRole}. Tu rol actual: ${req.user.role}`
        })
      }

      // Si pasa todas las verificaciones, continuar
      next()
    } catch (error) {
      console.error("Error en middleware requireRole:", error)
      return res.status(500).json({
        success: false,
        message: "Error interno del servidor"
      })
    }
  }
}

module.exports = requireRole
