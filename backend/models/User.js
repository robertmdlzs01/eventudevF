// Selección dinámica de base de datos según DB_TYPE
const db = require("../config/database-postgres")
const bcrypt = require("bcryptjs")
require("dotenv").config({ path: require("path").join(__dirname, "../config.env") })
const dbType = process.env.DB_TYPE || "postgresql"

class User {
  constructor(data) {
    // Normalizar propiedades para ambos esquemas
    this.id = data.id ?? data.ID
    this.email = data.email
    this.role = data.role ?? "user"
    this.status = data.status ?? (dbType === "postgresql" ? "active" : 1)

    // Campos de nombre (PostgreSQL)
    this.first_name = data.first_name ?? null
    this.last_name = data.last_name ?? null

    // Teléfono
    this.phone = data.phone ?? data.cellphone ?? null

    // Compatibilidad legacy (MySQL)
    this.nickname = data.nickname
    this.t_document = data.t_document
    this.name = data.name // nombre completo legado
    this.name2 = data.name2
    this.lastname = data.lastname
    this.lastname2 = data.lastname2
    this.birthday = data.birthday
    this.gender = data.gender
    this.cellphone = data.cellphone

    // Password
    this.password_hash = data.password_hash ?? data.password ?? null
  }

  // Create new user
  static async create(userData) {
    const { email, password, phone } = userData
    const fullName = userData.name || ""
    const [first_name, ...rest] = fullName.trim().split(/\s+/)
    const last_name = rest.join(" ") || null
    const role = "user"
    const status = dbType === "postgresql" ? "active" : 1

    const hashedPassword = await bcrypt.hash(password, 12)

    let query
    let params
    if (dbType === "postgresql") {
      query = `
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `
      params = [first_name || null, last_name, email, phone || null, hashedPassword, role, status]
    } else {
      query = `
        INSERT INTO users (status, nickname, t_document, name, name2, lastname, lastname2, birthday, gender, email, cellphone, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      params = [status, null, "CC", fullName, null, null, null, null, null, email, phone || null, hashedPassword]
    }

    const result = await db.query(query, params)
    return new User(result.rows ? result.rows[0] : result[0])
  }

  // Find user by email
  static async findByEmail(email) {
    const query = dbType === "postgresql" ? "SELECT * FROM users WHERE email = $1" : "SELECT * FROM users WHERE email = ?"
    const result = await db.query(query, [email])

    const rows = result.rows || result[0]
    if (!rows || rows.length === 0) {
      return null
    }

    return new User(rows[0])
  }

  // Find user by ID
  static async findById(id) {
    const query = dbType === "postgresql" ? "SELECT * FROM users WHERE id = $1" : "SELECT * FROM users WHERE ID = ?"
    const result = await db.query(query, [id])

    const rows = result.rows || result[0]
    if (!rows || rows.length === 0) {
      return null
    }

    return new User(rows[0])
  }

  // Find all users with pagination
  static async findAll(limit = 50, offset = 0) {
    if (dbType === "postgresql") {
      const query = `
        SELECT * FROM users 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `
      const result = await db.query(query, [limit, offset])
      return result.rows.map((row) => new User(row))
    }
    const query = `SELECT * FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?`
    const result = await db.query(query, [limit, offset])
    const rows = result.rows || result[0] || []
    return rows.map((row) => new User(row))
  }

  // Validate password
  async validatePassword(password) {
    let hash = this.password_hash
    if (!hash) return false
    // Normalizar hashes $2y$ a $2a$ para compatibilidad
    if (hash.startsWith("$2y$")) {
      hash = "$2a$" + hash.slice(4)
    }
    return bcrypt.compare(password, hash)
  }

  // Update user
  async update(updateData) {
    const { first_name, last_name, email, phone, password, current_password, status } = updateData

    // Si se está cambiando la contraseña, validar la contraseña actual
    if (password && current_password) {
      const isValidCurrentPassword = await this.validatePassword(current_password)
      if (!isValidCurrentPassword) {
        throw new Error("Current password is incorrect")
      }
    }

    let hashedPassword = null
    if (password) {
      hashedPassword = await bcrypt.hash(password, 12)
    }

    if (dbType === "postgresql") {
      const query = `
        UPDATE users 
        SET status = COALESCE($1, status),
            first_name = COALESCE($2, first_name),
            last_name = COALESCE($3, last_name),
            email = COALESCE($4, email),
            phone = COALESCE($5, phone),
            password_hash = COALESCE($6, password_hash),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $7
        RETURNING *
      `
      const result = await db.query(query, [status, first_name, last_name, email, phone, hashedPassword, this.id])
      if (!result.rows || result.rows.length === 0) {
        throw new Error("User not found")
      }
      Object.assign(this, result.rows[0])
      return this
    }

    const query = `
      UPDATE users 
      SET status = COALESCE(?, status),
          name = COALESCE(?, name),
          lastname = COALESCE(?, lastname),
          email = COALESCE(?, email),
          cellphone = COALESCE(?, cellphone),
          password = COALESCE(?, password),
          updated_at = CURRENT_TIMESTAMP
      WHERE ID = ?
    `
    await db.query(query, [status, first_name, last_name, email, phone, hashedPassword, this.id])
    return this
  }

  // Delete user
  async delete() {
    const query = dbType === "postgresql" ? "DELETE FROM users WHERE id = $1" : "DELETE FROM users WHERE ID = ?"
    await db.query(query, [this.id])
  }

  // Verify email
  async verifyEmail() {
    if (dbType === "postgresql") {
      const query = `
        UPDATE users 
        SET email_verified_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP 
        WHERE id = $1
        RETURNING *
      `
      await db.query(query, [this.id])
      this.email_verified_at = new Date().toISOString()
      return this
    }
    await db.query("UPDATE users SET email_verified = 1 WHERE ID = ?", [this.id])
    return this
  }

  // Convert to JSON (exclude password)
  toJSON() {
    const { password_hash, password, ...rest } = this
    return rest
  }
}

module.exports = User
