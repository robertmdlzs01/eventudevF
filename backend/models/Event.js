// Selección dinámica de base de datos según DB_TYPE
const db = require("../config/database-postgres")
require("dotenv").config({ path: require("path").join(__dirname, "../config.env") })
const dbType = process.env.DB_TYPE || "postgresql"

class Event {
  constructor(data) {
    // Normalizar campos para soportar ambos esquemas (legacy MySQL y PostgreSQL)
    // PostgreSQL (scripts/01_create_database_postgres.sql → tabla `events`)
    this.id = data.id ?? data.ID
    this.title = data.title ?? data.name ?? null
    this.slug = data.slug ?? null
    this.description = data.description ?? null
    this.long_description = data.long_description ?? null
    this.date = data.date ?? null
    this.time = data.time ?? null
    this.venue = data.venue ?? null
    this.location = data.location ?? null
    this.category_id = data.category_id ?? null
    this.organizer_id = data.organizer_id ?? data.organizer_id ?? null
    this.total_capacity = data.total_capacity ?? data.pos_boxes ?? null
    this.price = data.price ?? null
    this.status = data.status ?? null
    this.sales_start_date = data.sales_start_date ?? data.visibility_start ?? null
    this.sales_end_date = data.sales_end_date ?? data.visibility_end ?? null
    this.youtube_url = data.youtube_url ?? null
    this.video_url = data.video_url ?? null
    this.image_url = data.image_url ?? data.image ?? null
    this.gallery_images = data.gallery_images ?? null
    this.featured = data.featured ?? (typeof data.web_visible !== "undefined" ? Boolean(data.web_visible) : null)
    this.seat_map_id = data.seat_map_id ?? null
    this.max_seats_per_purchase = data.max_seats_per_purchase ?? 4
    this.created_at = data.created_at ?? null
    this.updated_at = data.updated_at ?? null
  }

  // Create new event
  static async create(eventData) {
    const {
      title,
      slug: providedSlug,
      description,
      long_description,
      date,
      time,
      venue,
      location,
      category_id,
      organizer_id,
      total_capacity,
      price,
      status = 'draft',
      sales_start_date,
      sales_end_date,
      youtube_url,
      image_url,
      featured = false,
      seat_map_id,
      max_seats_per_purchase = 4,
    } = eventData

    // Generar slug automáticamente si no se proporciona
    const slug = providedSlug || (title ? title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-') : null)

    if (dbType === "postgresql") {
      const query = `
        INSERT INTO events (
          title, slug, description, long_description, date, time, venue, location,
          category_id, organizer_id, total_capacity, price, status, sales_start_date,
          sales_end_date, youtube_url, image_url, featured, seat_map_id, max_seats_per_purchase
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
        RETURNING *
      `

      const result = await db.query(query, [
        title,
        slug,
        description,
        long_description,
        date,
        time,
        venue,
        location,
        category_id,
        organizer_id,
        total_capacity,
        price,
        status,
        sales_start_date,
        sales_end_date,
        youtube_url,
        image_url,
        featured,
        seat_map_id,
        max_seats_per_purchase,
      ])

      return new Event(result.rows[0])
    } else {
      // MySQL legacy support
      const query = `
        INSERT INTO eventu_events (
          ID, status, name, fecha, location, location_id, image, date, date_end,
          visibility_start, visibility_end, web_visible, pos_boxes, checkin_start,
          chekin_end, grupo, grupo_label
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `

      const result = await db.query(query, [
        eventData.ID,
        status,
        eventData.name,
        eventData.fecha,
        eventData.location,
        eventData.location_id,
        eventData.image,
        eventData.date,
        eventData.date_end,
        eventData.visibility_start,
        eventData.visibility_end,
        eventData.web_visible || 1,
        eventData.pos_boxes,
        eventData.checkin_start,
        eventData.chekin_end,
        eventData.grupo,
        eventData.grupo_label,
      ])

      return new Event(eventData)
    }
  }

  // Find event by ID
  static async findById(id) {
    let query
    let params
    if (dbType === "postgresql") {
      query = "SELECT * FROM events WHERE id = $1"
      params = [id]
    } else {
      query = "SELECT * FROM eventu_events WHERE ID = ?"
      params = [id]
    }
    const result = await db.query(query, params)

    if (result.rows.length === 0) {
      return null
    }

    return new Event(result.rows[0])
  }

  // Find all events with filters
  static async findAll(filters = {}) {
    let query = dbType === "postgresql" ? "SELECT * FROM events WHERE 1=1" : "SELECT * FROM eventu_events WHERE 1=1"
    const params = []
    let paramIndex = 1

    // Normalizar filtros comunes
    let normalizedStatus = filters.status
    if (dbType === "postgresql") {
      // Mapear estados: "active" → "published"
      if (normalizedStatus === undefined || normalizedStatus === null) {
        normalizedStatus = "published"
      } else if (normalizedStatus === "active") {
        normalizedStatus = "published"
      } else if (normalizedStatus === "inactive") {
        normalizedStatus = "draft"
      }
    } else {
      // Legacy MySQL: active/inactive → 1/0
      normalizedStatus = typeof normalizedStatus === "string"
        ? normalizedStatus === "active"
          ? 1
          : normalizedStatus === "inactive"
            ? 0
            : normalizedStatus
        : normalizedStatus
    }

    // Agregar filtros específicos para PostgreSQL
    if (dbType === "postgresql") {
      if (normalizedStatus !== undefined) {
        query += ` AND status = $${paramIndex++}`
        params.push(normalizedStatus)
      }

      if (filters.organizer_id) {
        query += ` AND organizer_id = $${paramIndex++}`
        params.push(filters.organizer_id)
      }

      if (filters.category_id) {
        query += ` AND category_id = $${paramIndex++}`
        params.push(filters.category_id)
      }

      if (filters.featured !== undefined) {
        query += ` AND featured = $${paramIndex++}`
        params.push(filters.featured)
      }

      if (filters.search) {
        query += ` AND (title ILIKE $${paramIndex} OR venue ILIKE $${paramIndex + 1} OR location ILIKE $${paramIndex + 2})`
        params.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`)
        paramIndex += 3
      }

      if (filters.slug) {
        query += ` AND slug = $${paramIndex++}`
        params.push(filters.slug)
      }
    } else {
      // MySQL legacy filters
      if (normalizedStatus !== undefined) {
        query += ` AND status = ?`
        params.push(normalizedStatus)
      }

      const normalizedWebVisible = typeof filters.web_visible === "boolean" ? (filters.web_visible ? 1 : 0) : filters.web_visible
      if (normalizedWebVisible !== undefined) {
        query += ` AND web_visible = ?`
        params.push(normalizedWebVisible)
      }

      if (filters.grupo) {
        query += ` AND grupo = ?`
        params.push(filters.grupo)
      }

      if (filters.search) {
        query += ` AND (name LIKE ? OR location LIKE ?)`
        params.push(`%${filters.search}%`, `%${filters.search}%`)
      }

      if (filters.slug) {
        query += ` AND slug = ?`
        params.push(filters.slug)
      }
    }

    query += " ORDER BY date ASC"

    if (filters.limit) {
      if (dbType === "postgresql") {
        query += ` LIMIT $${paramIndex++}`
        params.push(Number.parseInt(filters.limit))
      } else {
        query += ` LIMIT ?`
        params.push(Number.parseInt(filters.limit))
      }
    }

    const result = await db.query(query, params)
    return result.rows.map((row) => new Event(row))
  }

  // Get featured/visible events
  static async getFeatured(limit = 6) {
    let query
    let params
    if (dbType === "postgresql") {
      query = `
        SELECT * FROM events
        WHERE status = 'published' AND featured = TRUE AND date >= CURRENT_DATE
        ORDER BY date ASC
        LIMIT $1
      `
      params = [limit]
    } else {
      query = `
        SELECT * FROM eventu_events 
        WHERE status = 1 AND web_visible = 1 AND date > NOW()
        ORDER BY date ASC
        LIMIT ?
      `
      params = [limit]
    }
    const result = await db.query(query, params)
    return result.rows.map((row) => new Event(row))
  }

  // Update event
  async update(updateData) {
    if (dbType === "postgresql") {
      const {
        title,
        slug,
        description,
        long_description,
        date,
        time,
        venue,
        location,
        category_id,
        organizer_id,
        total_capacity,
        price,
        status,
        sales_start_date,
        sales_end_date,
        youtube_url,
        image_url,
        featured,
        seat_map_id,
      } = updateData

      const query = `
        UPDATE events 
        SET title = COALESCE($1, title),
            slug = COALESCE($2, slug),
            description = COALESCE($3, description),
            long_description = COALESCE($4, long_description),
            date = COALESCE($5, date),
            time = COALESCE($6, time),
            venue = COALESCE($7, venue),
            location = COALESCE($8, location),
            category_id = COALESCE($9, category_id),
            organizer_id = COALESCE($10, organizer_id),
            total_capacity = COALESCE($11, total_capacity),
            price = COALESCE($12, price),
            status = COALESCE($13, status),
            sales_start_date = COALESCE($14, sales_start_date),
            sales_end_date = COALESCE($15, sales_end_date),
            youtube_url = COALESCE($16, youtube_url),
            image_url = COALESCE($17, image_url),
            featured = COALESCE($18, featured),
            seat_map_id = COALESCE($19, seat_map_id),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $20
        RETURNING *
      `

      const result = await db.query(query, [
        title,
        slug,
        description,
        long_description,
        date,
        time,
        venue,
        location,
        category_id,
        organizer_id,
        total_capacity,
        price,
        status,
        sales_start_date,
        sales_end_date,
        youtube_url,
        image_url,
        featured,
        seat_map_id,
        this.id,
      ])

      if (result.rows.length === 0) {
        throw new Error("Event not found")
      }

      Object.assign(this, result.rows[0])
      return this
    } else {
      // MySQL legacy update
      const {
        name,
        fecha,
        location,
        location_id,
        image,
        date,
        date_end,
        visibility_start,
        visibility_end,
        web_visible,
        pos_boxes,
        checkin_start,
        chekin_end,
        grupo,
        grupo_label,
        status,
      } = updateData

      const query = `
        UPDATE eventu_events 
        SET name = COALESCE(?, name),
            fecha = COALESCE(?, fecha),
            location = COALESCE(?, location),
            location_id = COALESCE(?, location_id),
            image = COALESCE(?, image),
            date = COALESCE(?, date),
            date_end = COALESCE(?, date_end),
            visibility_start = COALESCE(?, visibility_start),
            visibility_end = COALESCE(?, visibility_end),
            web_visible = COALESCE(?, web_visible),
            pos_boxes = COALESCE(?, pos_boxes),
            checkin_start = COALESCE(?, checkin_start),
            chekin_end = COALESCE(?, chekin_end),
            grupo = COALESCE(?, grupo),
            grupo_label = COALESCE(?, grupo_label),
            status = COALESCE(?, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE ID = ?
      `

      await db.query(query, [
        name,
        fecha,
        location,
        location_id,
        image,
        date,
        date_end,
        visibility_start,
        visibility_end,
        web_visible,
        pos_boxes,
        checkin_start,
        chekin_end,
        grupo,
        grupo_label,
        status,
        this.ID,
      ])

      Object.assign(this, updateData)
      return this
    }
  }

  // Delete event
  async delete() {
    if (dbType === "postgresql") {
      const query = "DELETE FROM events WHERE id = $1"
      await db.query(query, [this.id])
    } else {
      const query = "DELETE FROM eventu_events WHERE ID = ?"
      await db.query(query, [this.ID])
    }
  }

  // Update ticket availability
  async updateAvailability(ticketsSold) {
    const newAvailable = this.available_tickets - ticketsSold

    if (newAvailable < 0) {
      throw new Error("Not enough tickets available")
    }

    const query = `
      UPDATE eventu_events 
      SET available_tickets = $1, updated_at = CURRENT_TIMESTAMP
      WHERE ID = $2
      RETURNING *
    `

    const result = await db.query(query, [newAvailable, this.ID])
    this.available_tickets = newAvailable
    return this
  }

  // Check if event is sold out
  isSoldOut() {
    return this.available_tickets <= 0
  }

  // Check if event is upcoming
  isUpcoming() {
    return new Date(this.date) > new Date()
  }

  // Convert to JSON
  toJSON() {
    return { ...this }
  }
}

module.exports = Event
