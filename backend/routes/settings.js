const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs")
const db = require("../config/database-postgres")
const { auth, requireRole } = require("../middleware/auth")

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/settings')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /json|csv/
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mimetype = allowedTypes.test(file.mimetype)

    if (mimetype && extname) {
      return cb(null, true)
    } else {
      cb(new Error('Only JSON and CSV files are allowed'))
    }
  }
})

// Get all settings
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const query = `
      SELECT * FROM system_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const result = await db.query(query)

    if (result.rows.length === 0) {
      // Create default settings if none exist
      const defaultSettings = {
        site_name: 'Eventu',
        site_description: 'La mejor plataforma para eventos en Colombia',
        contact_email: 'contacto@eventu.com',
        support_email: 'soporte@eventu.com',
        currency: 'COP',
        timezone: 'America/Bogota',
        maintenance_mode: false,
        registration_enabled: true,
        email_notifications: true,
        sms_notifications: false,
        max_tickets_per_purchase: 10,
        commission_rate: 5,
        // Configuraciones de seguridad por defecto
        two_factor_auth: false,
        login_attempts_limit: true,
        max_login_attempts: 5,
        lockout_duration: 30,
        auto_logout: true,
        session_timeout: 60,
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: false,
        activity_logging: true,
        security_notifications: true,
      }

      const insertQuery = `
        INSERT INTO system_settings (
          site_name, site_description, contact_email, support_email,
          currency, timezone, maintenance_mode, registration_enabled,
          email_notifications, sms_notifications, max_tickets_per_purchase,
          commission_rate, two_factor_auth, login_attempts_limit, max_login_attempts,
          lockout_duration, auto_logout, session_timeout, password_min_length,
          password_require_uppercase, password_require_lowercase, password_require_numbers,
          password_require_symbols, activity_logging, security_notifications,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const insertResult = await db.query(insertQuery, [
        defaultSettings.site_name,
        defaultSettings.site_description,
        defaultSettings.contact_email,
        defaultSettings.support_email,
        defaultSettings.currency,
        defaultSettings.timezone,
        defaultSettings.maintenance_mode,
        defaultSettings.registration_enabled,
        defaultSettings.email_notifications,
        defaultSettings.sms_notifications,
        defaultSettings.max_tickets_per_purchase,
        defaultSettings.commission_rate,
        defaultSettings.two_factor_auth,
        defaultSettings.login_attempts_limit,
        defaultSettings.max_login_attempts,
        defaultSettings.lockout_duration,
        defaultSettings.auto_logout,
        defaultSettings.session_timeout,
        defaultSettings.password_min_length,
        defaultSettings.password_require_uppercase,
        defaultSettings.password_require_lowercase,
        defaultSettings.password_require_numbers,
        defaultSettings.password_require_symbols,
        defaultSettings.activity_logging,
        defaultSettings.security_notifications,
      ])

      res.json({
        success: true,
        data: insertResult.rows[0],
      })
    } else {
      res.json({
        success: true,
        data: result.rows[0],
      })
    }
  } catch (error) {
    console.error("Get settings error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update settings
router.put("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const {
      siteName,
      siteDescription,
      contactEmail,
      supportEmail,
      currency,
      timezone,
      maintenanceMode,
      registrationEnabled,
      emailNotifications,
      smsNotifications,
      maxTicketsPerPurchase,
      commissionRate,
      // Configuraciones de seguridad
      twoFactorAuth,
      loginAttemptsLimit,
      maxLoginAttempts,
      lockoutDuration,
      autoLogout,
      sessionTimeout,
      passwordMinLength,
      passwordRequireUppercase,
      passwordRequireLowercase,
      passwordRequireNumbers,
      passwordRequireSymbols,
      activityLogging,
      securityNotifications,
    } = req.body

    // Validate required fields
    if (!siteName || !contactEmail) {
      return res.status(400).json({
        success: false,
        message: "Site name and contact email are required",
      })
    }

    // Check if settings exist
    const checkQuery = "SELECT id FROM system_settings LIMIT 1"
    const checkResult = await db.query(checkQuery)

    if (checkResult.rows.length === 0) {
      // Create new settings
      const insertQuery = `
        INSERT INTO system_settings (
          site_name, site_description, contact_email, support_email,
          currency, timezone, maintenance_mode, registration_enabled,
          email_notifications, sms_notifications, max_tickets_per_purchase,
          commission_rate, two_factor_auth, login_attempts_limit, max_login_attempts,
          lockout_duration, auto_logout, session_timeout, password_min_length,
          password_require_uppercase, password_require_lowercase, password_require_numbers,
          password_require_symbols, activity_logging, security_notifications,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `

      const result = await db.query(insertQuery, [
        siteName,
        siteDescription,
        contactEmail,
        supportEmail,
        currency,
        timezone,
        maintenanceMode,
        registrationEnabled,
        emailNotifications,
        smsNotifications,
        maxTicketsPerPurchase,
        commissionRate,
        twoFactorAuth,
        loginAttemptsLimit,
        maxLoginAttempts,
        lockoutDuration,
        autoLogout,
        sessionTimeout,
        passwordMinLength,
        passwordRequireUppercase,
        passwordRequireLowercase,
        passwordRequireNumbers,
        passwordRequireSymbols,
        activityLogging,
        securityNotifications,
      ])

      res.json({
        success: true,
        message: "Settings created successfully",
        data: result.rows[0],
      })
    } else {
      // Update existing settings
      const updateQuery = `
        UPDATE system_settings SET
          site_name = $1,
          site_description = $2,
          contact_email = $3,
          support_email = $4,
          currency = $5,
          timezone = $6,
          maintenance_mode = $7,
          registration_enabled = $8,
          email_notifications = $9,
          sms_notifications = $10,
          max_tickets_per_purchase = $11,
          commission_rate = $12,
          two_factor_auth = $13,
          login_attempts_limit = $14,
          max_login_attempts = $15,
          lockout_duration = $16,
          auto_logout = $17,
          session_timeout = $18,
          password_min_length = $19,
          password_require_uppercase = $20,
          password_require_lowercase = $21,
          password_require_numbers = $22,
          password_require_symbols = $23,
          activity_logging = $24,
          security_notifications = $25,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $26
        RETURNING *
      `

      const result = await db.query(updateQuery, [
        siteName,
        siteDescription,
        contactEmail,
        supportEmail,
        currency,
        timezone,
        maintenanceMode,
        registrationEnabled,
        emailNotifications,
        smsNotifications,
        maxTicketsPerPurchase,
        commissionRate,
        twoFactorAuth,
        loginAttemptsLimit,
        maxLoginAttempts,
        lockoutDuration,
        autoLogout,
        sessionTimeout,
        passwordMinLength,
        passwordRequireUppercase,
        passwordRequireLowercase,
        passwordRequireNumbers,
        passwordRequireSymbols,
        activityLogging,
        securityNotifications,
        checkResult.rows[0].id,
      ])

      res.json({
        success: true,
        message: "Settings updated successfully",
        data: result.rows[0],
      })
    }
  } catch (error) {
    console.error("Update settings error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Get specific setting
router.get("/:key", auth, requireRole("admin"), async (req, res) => {
  try {
    const { key } = req.params

    const query = `
      SELECT ${key} as value
      FROM system_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const result = await db.query(query)

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Setting not found",
      })
    }

    res.json({
      success: true,
      data: {
        key,
        value: result.rows[0].value,
      },
    })
  } catch (error) {
    console.error("Get setting error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Update specific setting
router.put("/:key", auth, requireRole("admin"), async (req, res) => {
  try {
    const { key } = req.params
    const { value } = req.body

    // Validate key
    const validKeys = [
      'site_name',
      'site_description',
      'contact_email',
      'support_email',
      'currency',
      'timezone',
      'maintenance_mode',
      'registration_enabled',
      'email_notifications',
      'sms_notifications',
      'max_tickets_per_purchase',
      'commission_rate',
      // Configuraciones de seguridad
      'two_factor_auth',
      'login_attempts_limit',
      'max_login_attempts',
      'lockout_duration',
      'auto_logout',
      'session_timeout',
      'password_min_length',
      'password_require_uppercase',
      'password_require_lowercase',
      'password_require_numbers',
      'password_require_symbols',
      'activity_logging',
      'security_notifications',
    ]

    if (!validKeys.includes(key)) {
      return res.status(400).json({
        success: false,
        message: "Invalid setting key",
      })
    }

    const query = `
      UPDATE system_settings 
      SET ${key} = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM system_settings ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `

    const result = await db.query(query, [value])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Settings not found",
      })
    }

    res.json({
      success: true,
      message: "Setting updated successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Update setting error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Reset settings to defaults
router.post("/reset", auth, requireRole("admin"), async (req, res) => {
  try {
    const defaultSettings = {
      site_name: 'Eventu',
      site_description: 'La mejor plataforma para eventos en Colombia',
      contact_email: 'contacto@eventu.com',
      support_email: 'soporte@eventu.com',
      currency: 'COP',
      timezone: 'America/Bogota',
      maintenance_mode: false,
      registration_enabled: true,
      email_notifications: true,
      sms_notifications: false,
      max_tickets_per_purchase: 10,
      commission_rate: 5,
      // Configuraciones de seguridad por defecto
      two_factor_auth: false,
      login_attempts_limit: true,
      max_login_attempts: 5,
      lockout_duration: 30,
      auto_logout: true,
      session_timeout: 60,
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_symbols: false,
      activity_logging: true,
      security_notifications: true,
    }

    const query = `
      UPDATE system_settings SET
        site_name = $1,
        site_description = $2,
        contact_email = $3,
        support_email = $4,
        currency = $5,
        timezone = $6,
        maintenance_mode = $7,
        registration_enabled = $8,
        email_notifications = $9,
        sms_notifications = $10,
        max_tickets_per_purchase = $11,
        commission_rate = $12,
        two_factor_auth = $13,
        login_attempts_limit = $14,
        max_login_attempts = $15,
        lockout_duration = $16,
        auto_logout = $17,
        session_timeout = $18,
        password_min_length = $19,
        password_require_uppercase = $20,
        password_require_lowercase = $21,
        password_require_numbers = $22,
        password_require_symbols = $23,
        activity_logging = $24,
        security_notifications = $25,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM system_settings ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `

    const result = await db.query(query, [
      defaultSettings.site_name,
      defaultSettings.site_description,
      defaultSettings.contact_email,
      defaultSettings.support_email,
      defaultSettings.currency,
      defaultSettings.timezone,
      defaultSettings.maintenance_mode,
      defaultSettings.registration_enabled,
      defaultSettings.email_notifications,
      defaultSettings.sms_notifications,
      defaultSettings.max_tickets_per_purchase,
      defaultSettings.commission_rate,
      defaultSettings.two_factor_auth,
      defaultSettings.login_attempts_limit,
      defaultSettings.max_login_attempts,
      defaultSettings.lockout_duration,
      defaultSettings.auto_logout,
      defaultSettings.session_timeout,
      defaultSettings.password_min_length,
      defaultSettings.password_require_uppercase,
      defaultSettings.password_require_lowercase,
      defaultSettings.password_require_numbers,
      defaultSettings.password_require_symbols,
      defaultSettings.activity_logging,
      defaultSettings.security_notifications,
    ])

    res.json({
      success: true,
      message: "Settings reset to defaults successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Reset settings error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Export settings
router.post("/export", auth, requireRole("admin"), async (req, res) => {
  try {
    const query = `
      SELECT * FROM system_settings 
      ORDER BY created_at DESC 
      LIMIT 1
    `

    const result = await db.query(query)

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No settings found to export",
      })
    }

    const settings = result.rows[0]
    const exportData = {
      site_name: settings.site_name,
      site_description: settings.site_description,
      contact_email: settings.contact_email,
      support_email: settings.support_email,
      currency: settings.currency,
      timezone: settings.timezone,
      maintenance_mode: settings.maintenance_mode,
      registration_enabled: settings.registration_enabled,
      email_notifications: settings.email_notifications,
      sms_notifications: settings.sms_notifications,
      max_tickets_per_purchase: settings.max_tickets_per_purchase,
      commission_rate: settings.commission_rate,
      // Configuraciones de seguridad
      two_factor_auth: settings.two_factor_auth,
      login_attempts_limit: settings.login_attempts_limit,
      max_login_attempts: settings.max_login_attempts,
      lockout_duration: settings.lockout_duration,
      auto_logout: settings.auto_logout,
      session_timeout: settings.session_timeout,
      password_min_length: settings.password_min_length,
      password_require_uppercase: settings.password_require_uppercase,
      password_require_lowercase: settings.password_require_lowercase,
      password_require_numbers: settings.password_require_numbers,
      password_require_symbols: settings.password_require_symbols,
      activity_logging: settings.activity_logging,
      security_notifications: settings.security_notifications,
      exported_at: new Date().toISOString(),
    }

    // In a real implementation, you would save this to a file
    const downloadUrl = `/api/settings/download/${Date.now()}`

    res.json({
      success: true,
      message: "Settings exported successfully",
      data: {
        download_url: downloadUrl,
        settings: exportData,
      },
    })
  } catch (error) {
    console.error("Export settings error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

// Import settings
router.post("/import", auth, requireRole("admin"), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      })
    }

    const filePath = req.file.path
    const fileContent = fs.readFileSync(filePath, 'utf8')

    let importData
    try {
      importData = JSON.parse(fileContent)
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON file",
      })
    }

    // Validate required fields
    if (!importData.site_name || !importData.contact_email) {
      return res.status(400).json({
        success: false,
        message: "Invalid settings file: missing required fields",
      })
    }

    // Update settings with imported data
    const query = `
      UPDATE system_settings SET
        site_name = $1,
        site_description = $2,
        contact_email = $3,
        support_email = $4,
        currency = $5,
        timezone = $6,
        maintenance_mode = $7,
        registration_enabled = $8,
        email_notifications = $9,
        sms_notifications = $10,
        max_tickets_per_purchase = $11,
        commission_rate = $12,
        two_factor_auth = $13,
        login_attempts_limit = $14,
        max_login_attempts = $15,
        lockout_duration = $16,
        auto_logout = $17,
        session_timeout = $18,
        password_min_length = $19,
        password_require_uppercase = $20,
        password_require_lowercase = $21,
        password_require_numbers = $22,
        password_require_symbols = $23,
        activity_logging = $24,
        security_notifications = $25,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT id FROM system_settings ORDER BY created_at DESC LIMIT 1)
      RETURNING *
    `

    const result = await db.query(query, [
      importData.site_name,
      importData.site_description,
      importData.contact_email,
      importData.support_email,
      importData.currency,
      importData.timezone,
      importData.maintenance_mode,
      importData.registration_enabled,
      importData.email_notifications,
      importData.sms_notifications,
      importData.max_tickets_per_purchase,
      importData.commission_rate,
      importData.two_factor_auth,
      importData.login_attempts_limit,
      importData.max_login_attempts,
      importData.lockout_duration,
      importData.auto_logout,
      importData.session_timeout,
      importData.password_min_length,
      importData.password_require_uppercase,
      importData.password_require_lowercase,
      importData.password_require_numbers,
      importData.password_require_symbols,
      importData.activity_logging,
      importData.security_notifications,
    ])

    // Clean up uploaded file
    fs.unlinkSync(filePath)

    res.json({
      success: true,
      message: "Settings imported successfully",
      data: result.rows[0],
    })
  } catch (error) {
    console.error("Import settings error:", error)
    res.status(500).json({
      success: false,
      message: "Internal server error",
    })
  }
})

module.exports = router
