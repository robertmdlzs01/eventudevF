const express = require('express');
const router = express.Router();
const cobruService = require('../services/cobruService');
const { db } = require('../config/database-postgres');

// Middleware para validar autenticación (opcional para webhooks)
const authenticateWebhook = (req, res, next) => {
  const signature = req.headers['x-cobru-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Firma de webhook requerida' });
  }
  req.cobruSignature = signature;
  next();
};

// Crear pago
router.post('/create-payment', async (req, res) => {
  try {
    const {
      amount,
      currency = 'COP',
      description,
      customerEmail,
      customerName,
      customerPhone,
      orderId,
      items = []
    } = req.body;

    // Validar datos requeridos
    if (!amount || !description || !customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Datos de pago incompletos'
      });
    }

    // Crear pago con Cobru
    const result = await cobruService.createPayment({
      amount,
      currency,
      description,
      customerEmail,
      customerName,
      customerPhone,
      orderId,
      items
    });

    if (result.success) {
      // Guardar transacción en la base de datos
      try {
        await db.query(`
          INSERT INTO cobru_payments (
            transaction_id, amount, currency, description, 
            customer_email, customer_name, customer_phone,
            order_id, status, payment_url, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        `, [
          result.data.id,
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          customerPhone,
          orderId,
          'pending',
          result.paymentUrl
        ]);
      } catch (dbError) {
        console.error('Error guardando transacción:', dbError);
        // No fallar la respuesta si hay error en la BD
      }

      res.json({
        success: true,
        data: {
          paymentUrl: result.paymentUrl,
          transactionId: result.data.id,
          amount,
          currency,
          status: 'pending'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error creando pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Verificar estado de pago
router.get('/payment-status/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Verificar estado con Cobru
    const result = await cobruService.getPaymentStatus(transactionId);

    if (result.success) {
      // Actualizar estado en la base de datos
      try {
        await db.query(`
          UPDATE cobru_payments 
          SET status = $1, updated_at = NOW()
          WHERE transaction_id = $2
        `, [result.data.status, transactionId]);

        // Si el pago fue aprobado, actualizar inventario y notificar al POS
        if (result.data.status === 'approved') {
          const RealTimeUpdatesService = require('../services/realTimeUpdates');
          const realTimeService = new RealTimeUpdatesService();
          
          // Obtener datos de la transacción
          const transactionData = await db.query(`
            SELECT * FROM cobru_payments WHERE transaction_id = $1
          `, [transactionId]);

          if (transactionData.rows.length > 0) {
            const transaction = transactionData.rows[0];
            
            // Actualizar inventario si hay datos del evento
            if (transaction.event_id && transaction.ticket_type_id && transaction.quantity) {
              await cobruService.updateTicketInventory(
                transaction.ticket_type_id,
                transaction.event_id,
                transaction.quantity
              );
            }

            // Notificar al POS
            await realTimeService.notifyNewSale({
              id: transaction.id,
              total_amount: transaction.amount,
              buyer_name: transaction.customer_name,
              created_at: transaction.created_at
            });
          }
        }
      } catch (dbError) {
        console.error('Error actualizando estado:', dbError);
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error verificando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Webhook de Cobru
router.post('/webhook', authenticateWebhook, async (req, res) => {
  try {
    const result = await cobruService.processWebhook(req.body, req.cobruSignature);

    if (result.success) {
      res.status(200).json({ success: true, message: 'Webhook procesado' });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error procesando webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener métodos de pago disponibles
router.get('/payment-methods', async (req, res) => {
  try {
    const result = await cobruService.getPaymentMethods();

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error obteniendo métodos de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de pagos
router.get('/stats', async (req, res) => {
  try {
    const filters = req.query;
    const result = await cobruService.getPaymentStats(filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error
      });
    }

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener historial de pagos
router.get('/payments', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, customer_email } = req.query;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM cobru_payments WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (customer_email) {
      paramCount++;
      query += ` AND customer_email = $${paramCount}`;
      params.push(customer_email);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Obtener total de registros
    let countQuery = 'SELECT COUNT(*) FROM cobru_payments WHERE 1=1';
    const countParams = [];
    let countParamCount = 0;

    if (status) {
      countParamCount++;
      countQuery += ` AND status = $${countParamCount}`;
      countParams.push(status);
    }

    if (customer_email) {
      countParamCount++;
      countQuery += ` AND customer_email = $${countParamCount}`;
      countParams.push(customer_email);
    }

    const countResult = await db.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;