#!/usr/bin/env node
/**
 * Script para aplicar la migración de integración del sistema de boletos
 * Aplica backend/migrations/integrate_ticket_system.sql
 */

const fs = require('fs')
const path = require('path')
const { Pool } = require('pg')
require('dotenv').config({ path: path.join(__dirname, '../config.env') })

async function applyMigration() {
  let pool

  try {
    console.log('🔧 Aplicando migración de integración del sistema de boletos...\n')

    // Configurar conexión a la base de datos
    const poolConfig = process.env.DATABASE_URL ? {
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    } : {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'eventu_db',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    }

    pool = new Pool(poolConfig)

    // Verificar conexión
    await pool.query('SELECT NOW()')
    console.log('✅ Conectado a la base de datos PostgreSQL\n')

    // Leer archivo SQL
    const sqlFile = path.join(__dirname, '../migrations/integrate_ticket_system.sql')
    const sql = fs.readFileSync(sqlFile, 'utf8')

    console.log('📋 Leyendo archivo de migración...')
    console.log(`   Archivo: ${sqlFile}\n`)

    // Ejecutar migración
    console.log('⚙️  Ejecutando migración...\n')
    await pool.query(sql)

    console.log('\n✅ ¡Migración aplicada exitosamente!')
    console.log('\n📊 Cambios aplicados:')
    console.log('   - Campo sale_id agregado a physical_tickets')
    console.log('   - Campo delivery_type agregado a sales y tickets')
    console.log('   - Tabla ticket_deliveries creada')
    console.log('   - Vistas de métricas creadas:')
    console.log('     • event_ticket_metrics')
    console.log('     • ticket_type_metrics')
    console.log('     • delivery_metrics')
    console.log('   - Índices y triggers creados\n')

    // Verificar que las tablas/columnas fueron creadas
    try {
      const tablesResult = await pool.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('ticket_deliveries', 'event_ticket_metrics', 'ticket_type_metrics', 'delivery_metrics')
        ORDER BY table_name
      `)

      if (tablesResult.rows.length > 0) {
        console.log('✅ Tablas y vistas verificadas:')
        tablesResult.rows.forEach(row => {
          console.log(`   - ${row.table_name}`)
        })
        console.log('')
      }

      // Verificar columnas nuevas
      const columnsResult = await pool.query(`
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND (
          (table_name = 'physical_tickets' AND column_name = 'sale_id') OR
          (table_name = 'sales' AND column_name = 'delivery_type') OR
          (table_name = 'tickets' AND column_name = 'delivery_type')
        )
        ORDER BY table_name, column_name
      `)

      if (columnsResult.rows.length > 0) {
        console.log('✅ Columnas nuevas verificadas:')
        columnsResult.rows.forEach(row => {
          console.log(`   - ${row.table_name}.${row.column_name}`)
        })
        console.log('')
      }
    } catch (verifyError) {
      console.warn('⚠️  No se pudieron verificar las tablas/columnas:', verifyError.message)
    }

  } catch (error) {
    console.error('\n❌ Error al aplicar la migración:')
    console.error('   ', error.message)
    if (error.detail) {
      console.error('   Detalle:', error.detail)
    }
    if (error.position) {
      console.error('   Posición:', error.position)
    }
    process.exit(1)
  } finally {
    if (pool) {
      await pool.end()
      console.log('🔌 Conexión a la base de datos cerrada\n')
    }
  }
}

// Ejecutar migración
applyMigration().catch(error => {
  console.error('Error fatal:', error)
  process.exit(1)
})
