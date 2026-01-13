const { Pool } = require('pg')
const path = require('path')
require("dotenv").config({ 
  path: process.env.NODE_ENV === 'production' 
    ? path.join(__dirname, '../.env.production')
    : path.join(__dirname, '../config.env')
})

// Configuración de SSL para PostgreSQL
// En producción (Railway), siempre usar SSL. En desarrollo, depende de DB_SSL
const isProduction = process.env.NODE_ENV === 'production'
const sslConfig = (isProduction || process.env.DB_SSL === 'true') ? {
  rejectUnauthorized: false, // Cambiar a true si tienes certificados válidos
  // ca: fs.readFileSync('/path/to/ca-certificate.crt').toString(), // Descomentar si tienes certificado CA
} : false

// Configuración de la base de datos PostgreSQL
// Prioridad: DATABASE_URL (Railway) > Variables individuales > Valores por defecto
let poolConfig = {}

if (process.env.DATABASE_URL) {
  // Railway proporciona DATABASE_URL automáticamente
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: isProduction ? sslConfig : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
} else {
  // Usar variables individuales (desarrollo o configuración manual)
  poolConfig = {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || "eventu_db",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "password",
    ssl: sslConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  }
}

const pool = new Pool(poolConfig)

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database')
  if (process.env.DATABASE_URL) {
    console.log('📊 Using DATABASE_URL (Railway/production)')
  } else {
    console.log(`📊 Database: ${process.env.DB_NAME || 'eventu_db'}`)
  }
  const sslEnabled = isProduction || process.env.DB_SSL === 'true'
  console.log(`🔒 SSL: ${sslEnabled ? 'Enabled' : 'Disabled'}`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL connection error:', err)
  console.error('💡 Verifica la configuración de la base de datos en .env.production')
})

// Función para ejecutar consultas
const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Query executed', { text, duration, rows: res.rowCount })
    return { rows: res.rows, rowCount: res.rowCount }
  } catch (error) {
    console.error('Query error:', error)
    throw error
  }
}

// Función para obtener una conexión
const getConnection = async () => {
  try {
    const client = await pool.connect()
    return client
  } catch (error) {
    console.error('Connection error:', error)
    throw error
  }
}

// Función para cerrar la conexión
const closeConnection = async () => {
  await pool.end()
}

module.exports = {
  query,
  getConnection,
  closeConnection,
  pool
}