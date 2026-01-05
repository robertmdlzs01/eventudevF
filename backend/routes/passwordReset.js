const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const router = express.Router()
const { db } = require('../config/database-postgres')
const emailService = require('../services/emailService')
const { passwordResetLimiter } = require('../middleware/rateLimiter')

// Solicitar recuperación de contraseña
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'El email es requerido'
      })
    }

    // Verificar si el usuario existe
    const userQuery = 'SELECT id, email, first_name, last_name FROM users WHERE email = $1'
    const userResult = await db.query(userQuery, [email])
    
    if (userResult.rows.length === 0) {
      // Por seguridad, no revelamos si el email existe o no
      return res.json({
        success: true,
        message: 'Si el email existe en nuestra base de datos, recibirás las instrucciones de recuperación.'
      })
    }

    const user = userResult.rows[0]

    // Generar token JWT para recuperación (expira en 1 hora)
    const resetToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        type: 'password_reset'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    )

    // Guardar token en la base de datos (opcional, para invalidar tokens)
    const tokenQuery = `
      INSERT INTO password_reset_tokens (user_id, token, expires_at) 
      VALUES ($1, $2, NOW() + INTERVAL '1 hour')
      ON CONFLICT (user_id) 
      DO UPDATE SET token = $2, expires_at = NOW() + INTERVAL '1 hour'
    `
    await db.query(tokenQuery, [user.id, resetToken])

    // Enviar email de recuperación
    const userName = user.first_name || user.email
    const emailResult = await emailService.sendPasswordResetEmail(email, resetToken, userName)

    if (emailResult.success) {
      console.log(`Email de recuperación enviado a ${email}`)
      res.json({
        success: true,
        message: 'Si el email existe en nuestra base de datos, recibirás las instrucciones de recuperación.'
      })
    } else {
      console.error('Error enviando email:', emailResult.error)
      res.status(500).json({
        success: false,
        error: 'Error al enviar el email de recuperación. Inténtalo de nuevo.'
      })
    }

  } catch (error) {
    console.error('Error en forgot-password:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Verificar token de recuperación
router.post('/verify-reset-token', async (req, res) => {
  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      })
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      })
    }

    // Verificar si el token existe en la base de datos y no ha expirado
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE user_id = $1 AND token = $2 AND expires_at > NOW()
    `
    const tokenResult = await db.query(tokenQuery, [decoded.userId, token])

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado'
      })
    }

    // Verificar si el usuario existe
    const userQuery = 'SELECT id, email FROM users WHERE id = $1'
    const userResult = await db.query(userQuery, [decoded.userId])

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    res.json({
      success: true,
      message: 'Token válido',
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email
      }
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'Token expirado'
      })
    }

    console.error('Error en verify-reset-token:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

// Restablecer contraseña
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        error: 'Token y nueva contraseña son requeridos'
      })
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      })
    }

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      })
    }

    // Verificar si el token existe en la base de datos y no ha expirado
    const tokenQuery = `
      SELECT * FROM password_reset_tokens 
      WHERE user_id = $1 AND token = $2 AND expires_at > NOW()
    `
    const tokenResult = await db.query(tokenQuery, [decoded.userId, token])

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Token inválido o expirado'
      })
    }

    // Verificar si el usuario existe
    const userQuery = 'SELECT id, email, first_name FROM users WHERE id = $1'
    const userResult = await db.query(userQuery, [decoded.userId])

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Usuario no encontrado'
      })
    }

    const user = userResult.rows[0]

    // Hashear nueva contraseña
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Actualizar contraseña en la base de datos
    const updateQuery = 'UPDATE users SET password_hash = $1 WHERE id = $2'
    await db.query(updateQuery, [hashedPassword, user.id])

    // Eliminar token usado
    const deleteTokenQuery = 'DELETE FROM password_reset_tokens WHERE user_id = $1'
    await db.query(deleteTokenQuery, [user.id])

    // Enviar email de confirmación
    const userName = user.first_name || user.email
    await emailService.sendPasswordChangedEmail(user.email, userName)

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        error: 'Token inválido'
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        error: 'Token expirado'
      })
    }

    console.error('Error en reset-password:', error)
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    })
  }
})

module.exports = router
