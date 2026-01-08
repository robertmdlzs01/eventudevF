const express = require("express")
const { auth, requireRole } = require("../middleware/auth")
const db = require("../config/database-postgres")

const router = express.Router()

// Función auxiliar para actualizar inventario de boletos
async function updateTicketInventory(ticketTypeId, eventId, quantity) {
  await db.query("BEGIN")

  try {
    // 1. Verificar disponibilidad antes de actualizar
    const checkAvailabilityQuery = `
      SELECT 
        e.total_capacity,
        COALESCE(SUM(s.quantity), 0) as sold,
        tt.quantity - tt.sold as ticket_type_available,
        tt.name as ticket_type_name
      FROM events e
      LEFT JOIN ticket_types tt ON tt.id = $1
      LEFT JOIN sales s ON e.id = s.event_id AND s.status = 'completed'
      WHERE e.id = $2
      GROUP BY e.total_capacity, tt.quantity, tt.sold, tt.name
    `
    const availabilityCheck = await db.query(checkAvailabilityQuery, [ticketTypeId, eventId])
    
    if (availabilityCheck.rows.length === 0) {
      throw new Error("Evento o tipo de boleto no encontrado")
    }

    const eventData = availabilityCheck.rows[0]
    
    // Verificar si hay suficientes boletos disponibles
    if (eventData.ticket_type_available < quantity) {
      throw new Error(`No hay suficientes boletos disponibles de ${eventData.ticket_type_name}. Disponibles: ${eventData.ticket_type_available}, Solicitados: ${quantity}`)
    }

    // Verificar si se excedería la capacidad total del evento
    if (eventData.sold + quantity > eventData.total_capacity) {
      throw new Error(`La compra excedería la capacidad total del evento. Disponibles: ${eventData.total_capacity - eventData.sold}, Solicitados: ${quantity}`)
    }

    // 2. Actualizar inventario del tipo de boleto específico
    const updateTicketTypeQuery = `
      UPDATE ticket_types 
      SET sold = sold + $1
      WHERE id = $2
    `
    await db.query(updateTicketTypeQuery, [quantity, ticketTypeId])

    // 3. No necesitamos actualizar la tabla events ya que calculamos sold dinámicamente

    await db.query("COMMIT")
    
    return {
      success: true,
      message: `Inventario actualizado correctamente. ${quantity} boletos vendidos.`
    }
  } catch (error) {
    await db.query("ROLLBACK")
    throw error
  }
}

// Procesar pago con tarjeta de crédito/débito - DESACTIVADO
router.post("/process-card", auth, async (req, res) => {
  // FUNCIONALIDAD DE PAGOS HABILITADA
  // return res.status(503).json({
  //   success: false,
  //   message: "La funcionalidad de pagos está temporalmente desactivada. Por favor, contacta con el organizador del evento para más información.",
  //   code: "PAYMENTS_DISABLED"
  // })
  
  try {
    const {
      cardNumber,
      expiryDate,
      cvv,
      holderName,
      amount,
      currency = "COP",
      description,
      customerId,
      eventId,
      ticketTypeId,
      quantity
    } = req.body

    // Validar datos de entrada
    if (!cardNumber || !expiryDate || !cvv || !holderName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Datos de tarjeta incompletos"
      })
    }

    // Simular procesamiento de pago con gateway
    const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const paymentStatus = "approved" // Simular aprobación exitosa

    // Registrar transacción en la base de datos
    const insertQuery = `
      INSERT INTO sales (
        transaction_id, customer_id, event_id, ticket_type_id, quantity,
        unit_price, total_amount, payment_method, payment_status, card_last_four,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `

    const cardLastFour = cardNumber.slice(-4)
    const unitPrice = amount / quantity

    const result = await db.query(insertQuery, [
      transactionId,
      customerId,
      eventId,
      ticketTypeId,
      quantity,
      unitPrice,
      amount,
      "credit_card",
      paymentStatus,
      cardLastFour
    ])

    // Actualizar inventario de boletas y capacidad del evento
    await updateTicketInventory(ticketTypeId, eventId, quantity)

    res.json({
      success: true,
      message: "Pago procesado exitosamente",
      data: {
        transactionId,
        status: paymentStatus,
        amount,
        currency,
        saleId: result.rows[0].id
      }
    })

  } catch (error) {
    console.error("Error processing card payment:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Procesar pago PSE - HABILITADO
router.post("/process-pse", auth, async (req, res) => {
  // FUNCIONALIDAD DE PAGOS HABILITADA
  // return res.status(503).json({
  //   success: false,
  //   message: "La funcionalidad de pagos está temporalmente desactivada. Por favor, contacta con el organizador del evento para más información.",
  //   code: "PAYMENTS_DISABLED"
  // })
  
  try {
    const {
      bank,
      accountType,
      documentType,
      documentNumber,
      amount,
      currency = "COP",
      description,
      customerId,
      eventId,
      ticketTypeId,
      quantity
    } = req.body

    // Validar datos de entrada
    if (!bank || !accountType || !documentType || !documentNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: "Datos bancarios incompletos"
      })
    }

    // Simular procesamiento PSE
    const transactionId = `PSE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const paymentStatus = "pending" // PSE requiere confirmación bancaria

    // Registrar transacción
    const insertQuery = `
      INSERT INTO sales (
        transaction_id, customer_id, event_id, ticket_type_id, quantity,
        unit_price, total_amount, payment_method, payment_status, bank_info,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `

    const bankInfo = JSON.stringify({
      bank,
      accountType,
      documentType,
      documentNumber: documentNumber.slice(-4) // Solo últimos 4 dígitos por seguridad
    })

    const unitPrice = amount / quantity

    const result = await db.query(insertQuery, [
      transactionId,
      customerId,
      eventId,
      ticketTypeId,
      quantity,
      unitPrice,
      amount,
      "pse",
      paymentStatus,
      bankInfo
    ])

    // Para PSE, no actualizamos el inventario inmediatamente ya que el pago está pendiente
    // El inventario se actualizará cuando se confirme el pago via webhook

    res.json({
      success: true,
      message: "Transacción PSE iniciada",
      data: {
        transactionId,
        status: paymentStatus,
        amount,
        currency,
        saleId: result.rows[0].id,
        redirectUrl: `https://pse.example.com/payment/${transactionId}` // URL simulada
      }
    })

  } catch (error) {
    console.error("Error processing PSE payment:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Procesar pago Daviplata - HABILITADO
router.post("/process-daviplata", auth, async (req, res) => {
  // FUNCIONALIDAD DE PAGOS HABILITADA
  // return res.status(503).json({
  //   success: false,
  //   message: "La funcionalidad de pagos está temporalmente desactivada. Por favor, contacta con el organizador del evento para más información.",
  //   code: "PAYMENTS_DISABLED"
  // })
  
  try {
    const {
      phone,
      amount,
      currency = "COP",
      description,
      customerId,
      eventId,
      ticketTypeId,
      quantity
    } = req.body

    // Validar datos de entrada
    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        message: "Número de teléfono requerido"
      })
    }

    // Simular procesamiento Daviplata
    const transactionId = `DVP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const paymentStatus = "pending" // Requiere confirmación en app

    // Registrar transacción
    const insertQuery = `
      INSERT INTO sales (
        transaction_id, customer_id, event_id, ticket_type_id, quantity,
        unit_price, total_amount, payment_method, payment_status, phone_number,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `

    const unitPrice = amount / quantity

    const result = await db.query(insertQuery, [
      transactionId,
      customerId,
      eventId,
      ticketTypeId,
      quantity,
      unitPrice,
      amount,
      "daviplata",
      paymentStatus,
      phone
    ])

    // Para Daviplata, no actualizamos el inventario inmediatamente ya que el pago está pendiente
    // El inventario se actualizará cuando se confirme el pago via webhook

    res.json({
      success: true,
      message: "Transacción Daviplata iniciada",
      data: {
        transactionId,
        status: paymentStatus,
        amount,
        currency,
        saleId: result.rows[0].id,
        phone: phone.slice(-4), // Solo últimos 4 dígitos por seguridad
        instructions: "Confirma el pago en tu aplicación Daviplata"
      }
    })

  } catch (error) {
    console.error("Error processing Daviplata payment:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Endpoint de prueba para pagos (sin autenticación)
router.post("/test-payment", async (req, res) => {
  try {
    const {
      cardNumber,
      expiryDate,
      cvv,
      holderName,
      amount,
      currency = "COP",
      description,
      customerId = 1,
      eventId = 3,
      ticketTypeId = 1,
      quantity = 1
    } = req.body

    // Validar datos de entrada
    if (!cardNumber || !expiryDate || !cvv || !holderName || !amount) {
      return res.status(400).json({
        success: false,
        message: "Datos de tarjeta incompletos"
      })
    }

    // Simular procesamiento de pago con gateway
    const transactionId = `TEST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const paymentStatus = "completed" // Simular aprobación exitosa

    // Registrar transacción en la base de datos
    const insertQuery = `
      INSERT INTO sales (
        user_id, event_id, ticket_type_id, quantity,
        unit_price, total_amount, payment_method, payment_reference, status,
        buyer_name, buyer_email, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `

    const unitPrice = amount / quantity

    const result = await db.query(insertQuery, [
      customerId,
      eventId,
      ticketTypeId,
      quantity,
      unitPrice,
      amount,
      "credit_card",
      transactionId,
      paymentStatus,
      holderName,
      "test@eventu.co"
    ])

    // Actualizar inventario de boletas y capacidad del evento
    await updateTicketInventory(ticketTypeId, eventId, quantity)

    res.json({
      success: true,
      message: "Pago de prueba procesado exitosamente",
      data: {
        transactionId,
        status: paymentStatus,
        amount,
        currency,
        saleId: result.rows[0].id,
        testMode: true
      }
    })

  } catch (error) {
    console.error("Error processing test payment:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: error.message
    })
  }
})

// Verificar estado de transacción
router.get("/status/:transactionId", auth, async (req, res) => {
  try {
    const { transactionId } = req.params

    const query = `
      SELECT 
        s.*,
        e.title as event_title,
        tt.name as ticket_type_name,
        u.first_name,
        u.last_name,
        u.email
      FROM sales s
      LEFT JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      LEFT JOIN users u ON s.customer_id = u.id
      WHERE s.transaction_id = $1
    `

    const result = await db.query(query, [transactionId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transacción no encontrada"
      })
    }

    const transaction = result.rows[0]

    res.json({
      success: true,
      data: {
        transactionId: transaction.transaction_id,
        status: transaction.payment_status,
        amount: transaction.total_amount,
        paymentMethod: transaction.payment_method,
        eventTitle: transaction.event_title,
        ticketTypeName: transaction.ticket_type_name,
        customerName: `${transaction.first_name} ${transaction.last_name}`,
        customerEmail: transaction.email,
        createdAt: transaction.created_at,
        updatedAt: transaction.updated_at
      }
    })

  } catch (error) {
    console.error("Error checking payment status:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Obtener historial de pagos del usuario
router.get("/history", auth, async (req, res) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 10 } = req.query
    const offset = (page - 1) * limit

    const query = `
      SELECT 
        s.*,
        e.title as event_title,
        e.date as event_date,
        tt.name as ticket_type_name
      FROM sales s
      LEFT JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      WHERE s.customer_id = $1
      ORDER BY s.created_at DESC
      LIMIT $2 OFFSET $3
    `

    const result = await db.query(query, [userId, limit, offset])

    // Contar total de transacciones
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales
      WHERE customer_id = $1
    `
    const countResult = await db.query(countQuery, [userId])

    res.json({
      success: true,
      data: {
        transactions: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        }
      }
    })

  } catch (error) {
    console.error("Error fetching payment history:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Webhook para confirmar pagos PSE
router.post("/webhook/pse", async (req, res) => {
  try {
    const { transactionId, status, bankReference } = req.body

    // Validar firma del webhook (implementar según proveedor PSE)
    // const isValidSignature = validateWebhookSignature(req.headers, req.body)
    // if (!isValidSignature) {
    //   return res.status(401).json({ success: false, message: "Invalid signature" })
    // }

    // Actualizar estado de la transacción
    const updateQuery = `
      UPDATE sales 
      SET payment_status = $1, bank_reference = $2, updated_at = NOW()
      WHERE transaction_id = $3
      RETURNING *
    `

    const result = await db.query(updateQuery, [status, bankReference, transactionId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transacción no encontrada"
      })
    }

    const transaction = result.rows[0]

    // Si el pago fue aprobado, actualizar inventario
    if (status === "approved") {
      await updateTicketInventory(transaction.ticket_type_id, transaction.event_id, transaction.quantity)
    }

    res.json({
      success: true,
      message: "Webhook procesado correctamente"
    })

  } catch (error) {
    console.error("Error processing PSE webhook:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Webhook para confirmar pagos Daviplata
router.post("/webhook/daviplata", async (req, res) => {
  try {
    const { transactionId, status, phoneNumber } = req.body

    // Validar firma del webhook (implementar según Daviplata)
    // const isValidSignature = validateDaviplataSignature(req.headers, req.body)
    // if (!isValidSignature) {
    //   return res.status(401).json({ success: false, message: "Invalid signature" })
    // }

    // Actualizar estado de la transacción
    const updateQuery = `
      UPDATE sales 
      SET payment_status = $1, updated_at = NOW()
      WHERE transaction_id = $2
      RETURNING *
    `

    const result = await db.query(updateQuery, [status, transactionId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Transacción no encontrada"
      })
    }

    const transaction = result.rows[0]

    // Si el pago fue aprobado, actualizar inventario
    if (status === "approved") {
      await updateTicketInventory(transaction.ticket_type_id, transaction.event_id, transaction.quantity)
    }

    res.json({
      success: true,
      message: "Webhook procesado correctamente"
    })

  } catch (error) {
    console.error("Error processing Daviplata webhook:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Verificar disponibilidad de boletos antes del pago
router.post("/check-availability", auth, async (req, res) => {
  try {
    const { eventId, ticketTypeId, quantity } = req.body

    if (!eventId || !ticketTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "Evento, tipo de boleto y cantidad son requeridos"
      })
    }

    // Verificar disponibilidad
    const availabilityQuery = `
      SELECT 
        e.id as event_id,
        e.title as event_title,
        e.total_capacity,
        COALESCE(SUM(s.quantity), 0) as event_sold,
        tt.id as ticket_type_id,
        tt.name as ticket_type_name,
        tt.available_quantity,
        tt.sold as ticket_type_sold,
        tt.price
      FROM events e
      LEFT JOIN ticket_types tt ON tt.id = $1
      LEFT JOIN sales s ON e.id = s.event_id AND s.status = 'completed'
      WHERE e.id = $2 AND tt.id = $1
      GROUP BY e.id, e.title, e.total_capacity, tt.id, tt.name, tt.available_quantity, tt.sold, tt.price
    `

    const result = await db.query(availabilityQuery, [ticketTypeId, eventId])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Evento o tipo de boleto no encontrado"
      })
    }

    const data = result.rows[0]
    const availableInEvent = data.total_capacity - data.event_sold
    const availableInTicketType = data.available_quantity
    const isAvailable = availableInTicketType >= quantity && availableInEvent >= quantity

    res.json({
      success: true,
      data: {
        eventId: data.event_id,
        eventTitle: data.event_title,
        ticketTypeId: data.ticket_type_id,
        ticketTypeName: data.ticket_type_name,
        requestedQuantity: quantity,
        availableInEvent,
        availableInTicketType,
        isAvailable,
        price: data.price,
        totalPrice: data.price * quantity,
        message: isAvailable 
          ? `Disponibles: ${Math.min(availableInEvent, availableInTicketType)} boletos`
          : `No hay suficientes boletos. Disponibles: ${Math.min(availableInEvent, availableInTicketType)}`
      }
    })

  } catch (error) {
    console.error("Error checking availability:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// ===== ADMIN ROUTES =====

// Obtener todos los pagos (admin only)
router.get("/", auth, requireRole("admin"), async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      status, 
      payment_method, 
      search,
      startDate,
      endDate
    } = req.query
    
    const offset = (page - 1) * limit
    
    let whereClause = 'WHERE 1=1'
    const params = []
    let paramIndex = 1

    if (search) {
      whereClause += ` AND (
        s.transaction_id ILIKE $${paramIndex} OR
        s.buyer_name ILIKE $${paramIndex} OR 
        s.buyer_email ILIKE $${paramIndex} OR 
        e.title ILIKE $${paramIndex}
      )`
      params.push(`%${search}%`)
      paramIndex++
    }

    if (status && status !== 'all') {
      whereClause += ` AND s.status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (payment_method && payment_method !== 'all') {
      whereClause += ` AND s.payment_method = $${paramIndex}`
      params.push(payment_method)
      paramIndex++
    }

    if (startDate) {
      whereClause += ` AND s.created_at >= $${paramIndex}`
      params.push(startDate)
      paramIndex++
    }

    if (endDate) {
      whereClause += ` AND s.created_at <= $${paramIndex}`
      params.push(endDate)
      paramIndex++
    }

    const query = `
      SELECT 
        s.id,
        s.transaction_id,
        s.buyer_name,
        s.buyer_email,
        s.quantity,
        s.total_amount,
        s.status,
        s.payment_method,
        s.payment_status,
        s.payment_reference,
        s.created_at,
        s.updated_at,
        e.title as event_title,
        e.date as event_date,
        tt.name as ticket_type_name,
        tt.price as ticket_price
      FROM sales s
      LEFT JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `

    params.push(parseInt(limit), parseInt(offset))

    const result = await db.query(query, params)

    // Contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM sales s
      LEFT JOIN events e ON s.event_id = e.id
      ${whereClause}
    `
    const countParams = params.slice(0, -2)
    const countResult = await db.query(countQuery, countParams)

    // Calcular estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) FILTER (WHERE s.status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE s.status = 'pending') as pending_count,
        COUNT(*) FILTER (WHERE s.status = 'failed') as failed_count,
        COUNT(*) FILTER (WHERE s.status = 'refunded') as refunded_count,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'completed'), 0) as total_revenue,
        COALESCE(SUM(s.total_amount) FILTER (WHERE s.status = 'pending'), 0) as pending_amount
      FROM sales s
      ${whereClause}
    `
    const statsResult = await db.query(statsQuery, countParams)

    res.json({
      success: true,
      data: {
        payments: result.rows.map(row => ({
          id: row.id.toString(),
          transactionId: row.transaction_id || `TXN-${row.id}`,
          amount: parseFloat(row.total_amount) || 0,
          status: row.status || 'pending',
          paymentMethod: row.payment_method || 'unknown',
          customerName: row.buyer_name || 'N/A',
          customerEmail: row.buyer_email || 'N/A',
          eventTitle: row.event_title || 'N/A',
          ticketType: row.ticket_type_name || 'N/A',
          createdAt: row.created_at,
          processedAt: row.updated_at,
          quantity: parseInt(row.quantity) || 0
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(countResult.rows[0].total / limit)
        },
        stats: {
          total: parseInt(countResult.rows[0].total),
          completed: parseInt(statsResult.rows[0].completed_count) || 0,
          pending: parseInt(statsResult.rows[0].pending_count) || 0,
          failed: parseInt(statsResult.rows[0].failed_count) || 0,
          refunded: parseInt(statsResult.rows[0].refunded_count) || 0,
          totalRevenue: parseFloat(statsResult.rows[0].total_revenue) || 0,
          pendingAmount: parseFloat(statsResult.rows[0].pending_amount) || 0
        }
      }
    })
  } catch (error) {
    console.error("Error obteniendo pagos:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

// Obtener detalles de un pago específico
router.get("/:id", auth, requireRole("admin"), async (req, res) => {
  try {
    const { id } = req.params

    const query = `
      SELECT 
        s.*,
        e.title as event_title,
        e.date as event_date,
        e.time as event_time,
        e.venue as event_venue,
        tt.name as ticket_type_name,
        tt.price as ticket_price,
        u.first_name,
        u.last_name,
        u.email as user_email
      FROM sales s
      LEFT JOIN events e ON s.event_id = e.id
      LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.id = $1
    `

    const result = await db.query(query, [id])

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado"
      })
    }

    const payment = result.rows[0]

    res.json({
      success: true,
      data: {
        id: payment.id.toString(),
        transactionId: payment.transaction_id || `TXN-${payment.id}`,
        amount: parseFloat(payment.total_amount) || 0,
        status: payment.status || 'pending',
        paymentMethod: payment.payment_method || 'unknown',
        paymentStatus: payment.payment_status,
        paymentReference: payment.payment_reference,
        customerName: payment.buyer_name || 'N/A',
        customerEmail: payment.buyer_email || 'N/A',
        customerPhone: payment.buyer_phone,
        eventTitle: payment.event_title || 'N/A',
        eventDate: payment.event_date,
        eventTime: payment.event_time,
        eventVenue: payment.event_venue,
        ticketType: payment.ticket_type_name || 'N/A',
        ticketPrice: parseFloat(payment.ticket_price) || 0,
        quantity: parseInt(payment.quantity) || 0,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
        notes: payment.notes
      }
    })
  } catch (error) {
    console.error("Error obteniendo detalle de pago:", error)
    res.status(500).json({
      success: false,
      message: "Error interno del servidor"
    })
  }
})

module.exports = router
