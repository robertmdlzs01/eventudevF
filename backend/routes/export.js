const express = require('express')
const router = express.Router()
const { auth, requireRole } = require('../middleware/auth')
const db = require('../config/database-postgres')
const fs = require('fs')
const path = require('path')

// Middleware para verificar que el usuario es administrador
const requireAdmin = requireRole('admin')

// ===== EXPORTACIÓN A PDF =====

// POST /api/export/pdf - Exportar a PDF
router.post('/pdf', auth, requireAdmin, async (req, res) => {
  try {
    const { reportType, filters, data } = req.body

    // En una implementación real, usarías una librería como puppeteer o jsPDF
    // Por ahora, simulamos la generación del PDF
    
    const reportData = {
      type: reportType,
      filters,
      data,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.id
    }

    // Crear directorio de exports si no existe
    const exportsDir = path.join(__dirname, '../exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const fileName = `report_${reportType}_${Date.now()}.json`
    const filePath = path.join(exportsDir, fileName)

    // Guardar datos del reporte (en producción, esto sería el PDF)
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/export/download/${fileName}`,
        fileName,
        fileSize: fs.statSync(filePath).size,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== EXPORTACIÓN A EXCEL =====

// POST /api/export/excel - Exportar a Excel
router.post('/excel', auth, requireAdmin, async (req, res) => {
  try {
    const { reportType, filters, data } = req.body

    // En una implementación real, usarías una librería como exceljs
    // Por ahora, simulamos la generación del Excel
    
    const reportData = {
      type: reportType,
      format: 'excel',
      filters,
      data,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.id
    }

    // Crear directorio de exports si no existe
    const exportsDir = path.join(__dirname, '../exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const fileName = `report_${reportType}_${Date.now()}.xlsx`
    const filePath = path.join(exportsDir, fileName)

    // Guardar datos del reporte (en producción, esto sería el Excel)
    fs.writeFileSync(filePath, JSON.stringify(reportData, null, 2))

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/export/download/${fileName}`,
        fileName,
        fileSize: fs.statSync(filePath).size,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating Excel:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== EXPORTACIÓN A CSV =====

// POST /api/export/csv - Exportar a CSV
router.post('/csv', auth, requireAdmin, async (req, res) => {
  try {
    const { reportType, filters, data } = req.body

    // Convertir datos a formato CSV
    const convertToCSV = (data) => {
      if (!data || data.length === 0) return ''
      
      const headers = Object.keys(data[0])
      const csvRows = [headers.join(',')]
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header]
          return typeof value === 'string' ? `"${value}"` : value
        })
        csvRows.push(values.join(','))
      }
      
      return csvRows.join('\n')
    }

    const csvContent = convertToCSV(data)

    // Crear directorio de exports si no existe
    const exportsDir = path.join(__dirname, '../exports')
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    // Generar nombre único para el archivo
    const fileName = `report_${reportType}_${Date.now()}.csv`
    const filePath = path.join(exportsDir, fileName)

    // Guardar archivo CSV
    fs.writeFileSync(filePath, csvContent)

    res.json({
      success: true,
      data: {
        downloadUrl: `/api/export/download/${fileName}`,
        fileName,
        fileSize: fs.statSync(filePath).size,
        generatedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error generating CSV:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== DESCARGAR ARCHIVO =====

// GET /api/export/download/:fileName - Descargar archivo
router.get('/download/:fileName', auth, requireAdmin, async (req, res) => {
  try {
    const { fileName } = req.params
    const filePath = path.join(__dirname, '../exports', fileName)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado'
      })
    }

    // Determinar el tipo de contenido basado en la extensión
    const ext = path.extname(fileName).toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf'
        break
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break
      case '.csv':
        contentType = 'text/csv'
        break
      case '.json':
        contentType = 'application/json'
        break
    }

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    
    const fileStream = fs.createReadStream(filePath)
    fileStream.pipe(res)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// ===== REPORTES PROGRAMADOS =====

// GET /api/export/scheduled - Obtener reportes programados
router.get('/scheduled', auth, requireAdmin, async (req, res) => {
  try {
    // En una implementación real, esto vendría de la base de datos
    const scheduledReports = [
      {
        id: 1,
        name: 'Reporte Mensual de Ventas',
        type: 'sales',
        format: 'pdf',
        frequency: 'monthly',
        lastRun: '2024-01-31T23:59:59Z',
        nextRun: '2024-02-29T23:59:59Z',
        status: 'active',
        recipients: ['admin@eventu.co'],
        filters: { period: 'monthly' }
      },
      {
        id: 2,
        name: 'Análisis Semanal de Eventos',
        type: 'events',
        format: 'excel',
        frequency: 'weekly',
        lastRun: '2024-01-28T23:59:59Z',
        nextRun: '2024-02-04T23:59:59Z',
        status: 'active',
        recipients: ['admin@eventu.co', 'manager@eventu.co'],
        filters: { period: 'weekly' }
      }
    ]

    res.json({
      success: true,
      data: scheduledReports
    })
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// POST /api/export/scheduled - Crear reporte programado
router.post('/scheduled', auth, requireAdmin, async (req, res) => {
  try {
    const { name, type, format, frequency, recipients, filters } = req.body

    // Validar datos requeridos
    if (!name || !type || !format || !frequency || !recipients) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son requeridos'
      })
    }

    // En una implementación real, guardarías esto en la base de datos
    const newScheduledReport = {
      id: Date.now(),
      name,
      type,
      format,
      frequency,
      lastRun: null,
      nextRun: calculateNextRun(frequency),
      status: 'active',
      recipients,
      filters: filters || {},
      createdAt: new Date().toISOString(),
      createdBy: req.user.id
    }

    res.status(201).json({
      success: true,
      data: newScheduledReport
    })
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// PUT /api/export/scheduled/:id - Actualizar reporte programado
router.put('/scheduled/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // En una implementación real, actualizarías en la base de datos
    const updatedReport = {
      id: parseInt(id),
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    }

    res.json({
      success: true,
      data: updatedReport
    })
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// DELETE /api/export/scheduled/:id - Eliminar reporte programado
router.delete('/scheduled/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params

    // En una implementación real, eliminarías de la base de datos
    res.json({
      success: true,
      message: 'Reporte programado eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
})

// Función auxiliar para calcular la próxima ejecución
function calculateNextRun(frequency) {
  const now = new Date()
  
  switch (frequency) {
    case 'daily':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    case 'weekly':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()).toISOString()
    case 'quarterly':
      return new Date(now.getFullYear(), now.getMonth() + 3, now.getDate()).toISOString()
    case 'yearly':
      return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString()
    default:
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
  }
}

module.exports = router
