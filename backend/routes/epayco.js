const express = require('express');
const router = express.Router();
const EPaycoService = require('../services/epaycoService');
const { auth } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Instanciar servicio de ePayco
const epaycoService = new EPaycoService();

/**
 * POST /api/payments/epayco/create
 * Crear transacción de pago con ePayco
 */
router.post('/create', auth, async (req, res) => {
  try {
    const {
      amount,
      currency = 'COP',
      description,
      eventId,
      ticketIds,
      customerInfo
    } = req.body;

    const userId = req.user.id;

    // Validar datos requeridos
    if (!amount || !description || !eventId || !ticketIds || !Array.isArray(ticketIds)) {
      return res.status(400).json({
        success: false,
        message: 'Datos de pago incompletos'
      });
    }

    // Crear ID único para la factura
    const invoiceId = `EVENTU_${Date.now()}_${userId}`;

    // Preparar datos para ePayco
    const paymentData = {
      amount: parseFloat(amount),
      currency,
      description,
      invoice: invoiceId,
      name_billing: customerInfo?.name || 'Cliente',
      address_billing: customerInfo?.address || 'Dirección no especificada',
      phone_billing: customerInfo?.phone || '0000000000',
      email_billing: customerInfo?.email || req.user.email,
      extra1: null, // Se asignará después de crear la venta
      extra2: eventId,
      extra3: userId
    };

    // Crear registro de venta en la base de datos
    const saleQuery = `
      INSERT INTO sales (
        user_id, event_id, buyer_name, buyer_email, 
        quantity, total_amount, status, payment_method, 
        payment_gateway, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
      RETURNING id
    `;

    const saleResult = await db.query(saleQuery, [
      userId,
      eventId,
      customerInfo?.name || 'Cliente',
      customerInfo?.email || req.user.email,
      ticketIds.length,
      amount,
      'pending',
      'credit_card',
      'epayco'
    ]);

    const saleId = saleResult.rows[0].id;

    // Actualizar extra1 con el ID de la venta
    paymentData.extra1 = saleId.toString();

    // Crear transacción en ePayco
    const epaycoResponse = await epaycoService.createTransaction(paymentData);

    if (!epaycoResponse.success) {
      // Si falla ePayco, marcar la venta como fallida
      await db.query('UPDATE sales SET status = $1 WHERE id = $2', ['failed', saleId]);
      
      return res.status(500).json({
        success: false,
        message: 'Error creando transacción de pago'
      });
    }

    // Crear registro de pago
    const paymentQuery = `
      INSERT INTO payments (
        sale_id, payment_method, payment_gateway, 
        gateway_transaction_id, amount, currency, 
        status, gateway_response, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `;

    await db.query(paymentQuery, [
      saleId,
      'credit_card',
      'epayco',
      epaycoResponse.data.transactionId,
      amount,
      currency,
      'pending',
      JSON.stringify(epaycoResponse.data)
    ]);

    // Respuesta exitosa
    res.json({
      success: true,
      data: {
        saleId,
        transactionId: epaycoResponse.data.transactionId,
        amount,
        currency,
        description,
        sandbox: epaycoResponse.sandbox,
        redirectUrl: epaycoResponse.data.p_url_response || null,
        epaycoConfig: epaycoService.getFrontendConfig()
      },
      message: 'Transacción creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando transacción ePayco:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/payments/epayco/confirm
 * Webhook de confirmación de ePayco
 */
router.post('/confirm', async (req, res) => {
  try {
    const webhookData = req.body;

    console.log('Webhook ePayco recibido:', webhookData);

    // Procesar webhook
    const processedData = epaycoService.processWebhook(webhookData);

    if (!processedData.success) {
      return res.status(400).json({
        success: false,
        message: 'Error procesando webhook'
      });
    }

    const {
      transactionId,
      saleId,
      status,
      isApproved,
      amount,
      authorization
    } = processedData;

    // Actualizar estado de la venta
    const newStatus = isApproved ? 'completed' : 'failed';
    
    await db.query(
      'UPDATE sales SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, saleId]
    );

    // Actualizar estado del pago
    await db.query(
      `UPDATE payments 
       SET status = $1, gateway_response = $2, processed_at = NOW(), updated_at = NOW()
       WHERE gateway_transaction_id = $3`,
      [
        newStatus,
        JSON.stringify(processedData),
        transactionId
      ]
    );

    // Si el pago fue aprobado, actualizar tickets
    if (isApproved) {
      // Aquí podrías actualizar el estado de los tickets, enviar emails, etc.
      console.log(`Pago aprobado para venta ${saleId}, transacción ${transactionId}`);
    }

    // Responder a ePayco
    res.json({
      success: true,
      message: 'Webhook procesado exitosamente',
      transactionId,
      status: newStatus
    });

  } catch (error) {
    console.error('Error procesando webhook ePayco:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook'
    });
  }
});

/**
 * GET /api/payments/epayco/status/:transactionId
 * Consultar estado de una transacción
 */
router.get('/status/:transactionId', auth, async (req, res) => {
  try {
    const { transactionId } = req.params;

    // Consultar estado en ePayco
    const statusResponse = await epaycoService.getTransactionStatus(transactionId);

    if (!statusResponse.success) {
      return res.status(500).json({
        success: false,
        message: 'Error consultando estado de transacción'
      });
    }

    // Consultar estado en la base de datos
    const dbQuery = `
      SELECT s.id, s.status, s.total_amount, s.created_at,
             p.gateway_transaction_id, p.status as payment_status, p.processed_at
      FROM sales s
      JOIN payments p ON s.id = p.sale_id
      WHERE p.gateway_transaction_id = $1
    `;

    const dbResult = await db.query(dbQuery, [transactionId]);

    res.json({
      success: true,
      data: {
        transactionId,
        epaycoStatus: statusResponse.data,
        databaseStatus: dbResult.rows[0] || null,
        sandbox: statusResponse.sandbox
      }
    });

  } catch (error) {
    console.error('Error consultando estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error consultando estado de transacción'
    });
  }
});

/**
 * GET /api/payments/epayco/config
 * Obtener configuración para el frontend
 */
router.get('/config', (req, res) => {
  try {
    const config = epaycoService.getFrontendConfig();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error obteniendo configuración ePayco:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo configuración'
    });
  }
});

module.exports = router;
