const express = require("express")
const { auth, requireRole } = require("../middleware/auth")
const db = require("../config/database-postgres")
const multer = require("multer")
const path = require("path")
const fs = require("fs")

const router = express.Router()

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads')
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true })
    }
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

// Configuración más flexible de multer
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB límite
    files: 10 // Máximo 10 archivos
  },
  fileFilter: (req, file, cb) => {
    // Permitir todos los tipos de archivo
    cb(null, true)
  }
})

// GET /api/media
// Obtener todos los archivos de medios
router.get("/", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { folder, type, search } = req.query
    
    let query = `
      SELECT 
        m.id,
        m.name,
        m.original_name,
        m.type,
        m.size,
        m.url,
        m.alt,
        m.description,
        m.tags,
        m.folder,
        m.last_used,
        m.usage_count,
        m.created_at,
        m.updated_at
      FROM media m
      WHERE 1=1
    `
    
    const params = []
    let paramCount = 0
    
    if (folder) {
      paramCount++
      query += ` AND m.folder = $${paramCount}`
      params.push(folder)
    }
    
    if (type) {
      paramCount++
      query += ` AND m.type = $${paramCount}`
      params.push(type)
    }
    
    if (search) {
      paramCount++
      query += ` AND (m.name ILIKE $${paramCount} OR m.description ILIKE $${paramCount} OR m.tags::text ILIKE $${paramCount})`
      params.push(`%${search}%`)
    }
    
    query += ` ORDER BY m.created_at DESC`
    
    const result = await db.query(query, params)
    
    res.json({
      success: true,
      data: result.rows.map(file => ({
        id: file.id,
        name: file.name,
        originalName: file.original_name,
        type: file.type,
        size: file.size,
        url: file.url,
        alt: file.alt,
        description: file.description,
        tags: file.tags || [],
        folder: file.folder,
        lastUsed: file.last_used,
        usageCount: file.usage_count || 0,
        createdAt: file.created_at,
        updatedAt: file.updated_at
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo archivos de medios:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// GET /api/media/folders
// Obtener todas las carpetas de medios
router.get("/folders", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const query = `
      SELECT 
        f.id,
        f.name,
        f.parent_id,
        f.created_at,
        COUNT(m.id) as file_count
      FROM media_folders f
      LEFT JOIN media m ON f.id = m.folder
      GROUP BY f.id, f.name, f.parent_id, f.created_at
      ORDER BY f.name
    `
    
    const result = await db.query(query)
    
    res.json({
      success: true,
      data: result.rows.map(folder => ({
        id: folder.id,
        name: folder.name,
        parentId: folder.parent_id,
        createdDate: folder.created_at,
        fileCount: parseInt(folder.file_count)
      }))
    })
    
  } catch (error) {
    console.error("Error obteniendo carpetas:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Ruta de prueba simple
router.post("/test-upload", (req, res) => {
  console.log('📁 Test upload request received')
  console.log('📁 Request body:', req.body)
  console.log('📁 Request files:', req.files)
  res.json({ success: true, message: "Test upload received" })
})

// Ruta de prueba sin middleware
router.post("/simple-upload", (req, res) => {
  console.log('📁 Simple upload request received')
  console.log('📁 Request body:', req.body)
  console.log('📁 Request headers:', req.headers)
  res.json({ 
    success: true, 
    message: "Simple upload received",
    body: req.body,
    contentType: req.headers['content-type']
  })
})

// Ruta de prueba con JSON
router.post("/json-upload", (req, res) => {
  console.log('📁 JSON upload request received')
  console.log('📁 Request body:', req.body)
  
  // Simular subida exitosa
  res.json({
    success: true,
    message: "Archivo subido exitosamente (JSON)",
    data: [{
      id: 1,
      name: "test-file.json",
      type: "application",
      size: 1024,
      url: "/uploads/test-file.json",
      alt: req.body.alt || "Test file",
      description: req.body.description || "Test upload",
      tags: req.body.tags || [],
      folder: req.body.folder || "1",
      createdAt: new Date().toISOString()
    }]
  })
})

// POST /api/media/upload
// Subir un archivo de medios (implementación manual)
router.post("/upload", async (req, res) => {
  try {
    console.log('📁 Upload request received')
    console.log('📁 Request body:', req.body)
    console.log('📁 Request files:', req.files)
    console.log('📁 Content-Type:', req.headers['content-type'])
    
    // Crear un archivo de prueba en la base de datos
    const { folder, alt, description, tags } = req.body
    
    const insertQuery = `
      INSERT INTO media (
        name, original_name, type, size, url, alt, description, tags, folder
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `
    
    const result = await db.query(insertQuery, [
      'test-file-' + Date.now() + '.txt',
      'test-upload.txt',
      'text',
      1024,
      '/uploads/test-file.txt',
      alt || 'Test file',
      description || 'Test upload',
      tags ? JSON.parse(tags) : [],
      folder || '1'
    ])
    
    res.json({
      success: true,
      message: "Archivo subido exitosamente (modo prueba)",
      data: [{
        id: result.rows[0].id,
        name: result.rows[0].name,
        type: result.rows[0].type,
        size: result.rows[0].size,
        url: result.rows[0].url,
        alt: result.rows[0].alt,
        description: result.rows[0].description,
        tags: result.rows[0].tags,
        folder: result.rows[0].folder,
        createdAt: result.rows[0].created_at
      }]
    })
    
  } catch (error) {
    console.error("Error subiendo archivo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// POST /api/media/folders
// Crear una nueva carpeta
router.post("/folders", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { name, parentId } = req.body
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "El nombre de la carpeta es requerido"
      })
    }
    
    const insertQuery = `
      INSERT INTO media_folders (name, parent_id)
      VALUES ($1, $2)
      RETURNING *
    `
    
    const result = await db.query(insertQuery, [name, parentId || null])
    
    res.json({
      success: true,
      message: "Carpeta creada exitosamente",
      data: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        parentId: result.rows[0].parent_id,
        createdDate: result.rows[0].created_at
      }
    })
    
  } catch (error) {
    console.error("Error creando carpeta:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// PUT /api/media/:id
// Actualizar un archivo de medios
router.put("/:id", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { id } = req.params
    const { name, alt, description, tags, folder } = req.body
    
    const updateQuery = `
      UPDATE media 
      SET 
        name = COALESCE($1, name),
        alt = COALESCE($2, alt),
        description = COALESCE($3, description),
        tags = COALESCE($4, tags),
        folder = COALESCE($5, folder),
        updated_at = NOW()
      WHERE id = $6
      RETURNING *
    `
    
    const result = await db.query(updateQuery, [
      name,
      alt,
      description,
      tags ? JSON.parse(tags) : null,
      folder,
      id
    ])
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado"
      })
    }
    
    res.json({
      success: true,
      message: "Archivo actualizado exitosamente",
      data: result.rows[0]
    })
    
  } catch (error) {
    console.error("Error actualizando archivo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// DELETE /api/media/:id
// Eliminar un archivo de medios
router.delete("/:id", auth, requireRole(['admin', 'organizer']), async (req, res) => {
  try {
    const { id } = req.params
    
    // Obtener información del archivo antes de eliminarlo
    const selectQuery = "SELECT url FROM media WHERE id = $1"
    const selectResult = await db.query(selectQuery, [id])
    
    if (selectResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Archivo no encontrado"
      })
    }
    
    // Eliminar de la base de datos
    const deleteQuery = "DELETE FROM media WHERE id = $1"
    await db.query(deleteQuery, [id])
    
    // Eliminar archivo físico
    const filePath = path.join(__dirname, '../uploads', selectResult.rows[0].url.replace('/uploads/', ''))
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }
    
    res.json({
      success: true,
      message: "Archivo eliminado exitosamente"
    })
    
  } catch (error) {
    console.error("Error eliminando archivo:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

module.exports = router