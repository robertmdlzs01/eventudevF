const express = require("express")
const jwt = require("jsonwebtoken")
const User = require("../models/User")
const { auth } = require("../middleware/auth")
const AuditService = require("../services/auditService")
const { userValidationSchemas, validateUser } = require("../validators/userValidator")
// El middleware de auditoría global ya maneja todas las acciones automáticamente
const { Pool } = require("pg")
require("dotenv").config()

const router = express.Router()

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:Eventu321@localhost:5432/eventu_db",
})

// Function to check if user has events (for organizers)
async function userHasEvents(userId) {
  try {
    const result = await pool.query(
      "SELECT COUNT(*) as event_count FROM events WHERE organizer_id = $1",
      [userId]
    )
    return parseInt(result.rows[0].event_count) > 0
  } catch (error) {
    console.error("Error checking user events:", error)
    return false
  }
}

// Register con validación robusta
router.post("/register", validateUser(userValidationSchemas.register), async (req, res) => {
  try {
    const { email, password, name, phone } = req.body

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      })
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email)
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email",
      })
    }

    // Create user
    const user = await User.create({ email, password, name, phone })

    // Generate token with activity timestamp
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        lastActivity: Date.now()
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    )

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        user: user.toJSON(),
        token,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Login con validación robusta
router.post("/login", validateUser(userValidationSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      })
    }

    // Find user
    const user = await User.findByEmail(email)
    if (!user) {
      // Registrar intento de login fallido
      try {
        await AuditService.logActivity({
          userId: 'login_attempt',
          userName: `Usuario (${email})`,
          userEmail: email,
          action: 'LOGIN',
          resource: 'AUTH',
          resourceId: null,
          details: {
            method: 'POST',
            path: '/api/auth/login',
            reason: 'user_not_found'
          },
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'Unknown',
          severity: 'medium',
          status: 'failure'
        })
      } catch (auditError) {
        console.error('Error logging failed login attempt:', auditError)
      }
      
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check password
    const isValidPassword = await user.validatePassword(password)
    if (!isValidPassword) {
      // Registrar intento de login fallido por contraseña incorrecta
      try {
        await AuditService.logActivity({
          userId: user.id.toString(),
          userName: user.name || user.email,
          userEmail: user.email,
          action: 'LOGIN',
          resource: 'AUTH',
          resourceId: null,
          details: {
            method: 'POST',
            path: '/api/auth/login',
            reason: 'invalid_password'
          },
          ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
          userAgent: req.get('User-Agent') || 'Unknown',
          severity: 'medium',
          status: 'failure'
        })
      } catch (auditError) {
        console.error('Error logging failed login attempt:', auditError)
      }
      
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      })
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      })
    }

    // Generate token with activity timestamp
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        lastActivity: Date.now()
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    )

    // Determine redirect URL based on user role
    let redirectUrl = "/"
    let welcomeMessage = "Bienvenido"
    
    switch (user.role) {
      case "admin":
        redirectUrl = "/admin"
        welcomeMessage = "Bienvenido al Panel de Administración"
        break
      case "organizer":
        // Check if organizer has events
        const hasEvents = await userHasEvents(user.id)
        if (hasEvents) {
          redirectUrl = "/organizer"
          welcomeMessage = "Bienvenido al Panel de Organizador"
        } else {
          redirectUrl = "/"
          welcomeMessage = "Bienvenido a Eventu. Para acceder al panel de organizador, necesitas crear al menos un evento."
        }
        break
      case "user":
      default:
        redirectUrl = "/"
        welcomeMessage = "Bienvenido a Eventu"
        break
    }

    // Registrar login exitoso en auditoría
    try {
      await AuditService.logActivity({
        userId: user.id.toString(),
        userName: user.name || user.email,
        userEmail: user.email,
        action: 'LOGIN',
        resource: 'AUTH',
        resourceId: null,
        details: {
          method: 'POST',
          path: '/api/auth/login',
          role: user.role,
          redirectUrl: redirectUrl
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        severity: 'medium',
        status: 'success'
      })
    } catch (auditError) {
      console.error('Error logging login activity:', auditError)
      // No interrumpir el flujo de login por errores de auditoría
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: user.toJSON(),
        token,
        redirectUrl,
        welcomeMessage,
        role: user.role
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      data: user.toJSON(),
    })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update profile
router.put("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const updatedUser = await user.update(req.body)

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser.toJSON(),
    })
  } catch (error) {
    console.error("Update profile error:", error)
    
    // Manejar errores específicos
    if (error.message === "Current password is incorrect") {
      return res.status(400).json({
        success: false,
        message: "La contraseña actual es incorrecta",
      })
    }
    
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Refresh token
router.post("/refresh", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        lastActivity: Date.now()
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    )

    res.json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        token,
      },
    })
  } catch (error) {
    console.error("Refresh token error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update user role to admin (temporary endpoint for testing)
router.post("/make-admin", async (req, res) => {
  try {
    const { email } = req.body
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      })
    }

    const result = await pool.query(
      "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING *",
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    res.json({
      success: true,
      message: "User role updated to admin",
      data: result.rows[0]
    })
  } catch (error) {
    console.error("Make admin error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Change password
router.post("/change-password", auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      })
    }

    // Find user
    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Verify current password
    const bcrypt = require("bcryptjs")
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      })
    }

    // Hash new password
    const saltRounds = 10
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update password in database
    const result = await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, first_name, last_name, role, status, phone",
      [hashedNewPassword, user.id]
    )

    if (result.rows.length === 0) {
      return res.status(500).json({
        success: false,
        message: "Failed to update password",
      })
    }

    const updatedUser = result.rows[0]

    res.json({
      success: true,
      message: "Password changed successfully",
      data: {
        user: updatedUser,
      },
    })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Verify token and update activity
router.get("/verify-token", auth, async (req, res) => {
  try {
    // El middleware auth ya verificó el token
    res.json({
      success: true,
      message: "Token válido",
      data: {
        id: req.user.userId,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        phone: req.user.phone,
        company: req.user.company
      }
    })
  } catch (error) {
    console.error("Verify token error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Logout (client-side token removal, optional endpoint for logging)
router.post("/logout", auth, async (req, res) => {
  try {
    // Registrar logout en auditoría
    try {
      await AuditService.logActivity({
        userId: req.user.userId.toString(),
        userName: req.user.name || req.user.email,
        userEmail: req.user.email,
        action: 'LOGOUT',
        resource: 'AUTH',
        resourceId: null,
        details: {
          method: 'POST',
          path: '/api/auth/logout'
        },
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        userAgent: req.get('User-Agent') || 'Unknown',
        severity: 'low',
        status: 'success'
      })
    } catch (auditError) {
      console.error('Error logging logout activity:', auditError)
      // No interrumpir el flujo de logout por errores de auditoría
    }
    
    // In a real app, you might want to blacklist the token
    // For now, we'll just acknowledge the logout
    res.json({
      success: true,
      message: "Logged out successfully",
    })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update activity timestamp
router.post("/update-activity", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }

    // Generate new token with updated activity timestamp
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        lastActivity: Date.now()
      },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" },
    )

    res.json({
      success: true,
      message: "Activity updated successfully",
      data: {
        token,
        lastActivity: Date.now()
      },
    })
  } catch (error) {
    console.error("Update activity error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Invalidate session (for browser/tab close)
router.post("/invalidate-session", auth, async (req, res) => {
  try {
    const { action, timestamp } = req.body
    
    // Log the session invalidation
    console.log(`Session invalidated for user ${req.user.userId}: ${action} at ${new Date(timestamp).toISOString()}`)
    
    // Aquí podrías agregar lógica adicional como:
    // - Registrar en base de datos
    // - Notificar otros dispositivos
    // - Limpiar datos temporales
    
    res.json({
      success: true,
      message: "Session invalidated successfully"
    })
  } catch (error) {
    console.error("Invalidate session error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error"
    })
  }
})

// Verify token endpoint

module.exports = router
