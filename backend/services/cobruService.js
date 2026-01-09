const axios = require('axios');
const crypto = require('crypto');

class CobruService {
  constructor() {
    this.apiKey = process.env.COBRU_API_KEY;
    this.secretKey = process.env.COBRU_SECRET_KEY;
    this.refreshToken = process.env.COBRU_REFRESH_TOKEN;
    this.environment = process.env.COBRU_ENVIRONMENT || 'production';
    this.webhookSecret = process.env.COBRU_WEBHOOK_SECRET;
    this.baseUrl = process.env.COBRU_API_URL || 'https://prod.cobru.co';
    this.redirectUrl = process.env.COBRU_REDIRECT_URL;
    this.cancelUrl = process.env.COBRU_CANCEL_URL;
    this.merchantId = process.env.COBRU_MERCHANT_ID;
    
    // Token de acceso actual (se renueva automáticamente)
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Refrescar token de acceso usando refresh token
   * @returns {Promise<string>} - Token de acceso
   */
  async refreshToken() {
    try {
      if (!this.refreshToken) {
        throw new Error('Refresh token no configurado');
      }

      const response = await axios.request({
        method: 'POST',
        url: `${this.baseUrl}/token/refresh/`,
        headers: {
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-api-key': this.apiKey
        },
        data: {
          refresh: this.refreshToken
        }
      });

      if (response.data && response.data.access) {
        this.accessToken = response.data.access;
        // Asumir que el token expira en 1 hora (ajustar según la respuesta real)
        this.tokenExpiry = Date.now() + (60 * 60 * 1000);
        console.log('Token de Cobru renovado exitosamente');
        return this.accessToken;
      }

      throw new Error('No se recibió token de acceso en la respuesta');

    } catch (error) {
      console.error('Error refrescando token de Cobru:', error.response?.data || error.message);
      throw new Error('Error al refrescar token de Cobru');
    }
  }

  /**
   * Obtener token de acceso válido
   * @returns {Promise<string>} - Token de acceso
   */
  async getValidAccessToken() {
    try {
      // Si tenemos un token válido, lo devolvemos
      if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
        return this.accessToken;
      }

      // Intentar refrescar el token
      if (this.refreshToken) {
        try {
          return await this.refreshToken();
        } catch (refreshError) {
          console.log('No se pudo refrescar token, intentando usar API Key directamente');
        }
      }

      // Fallback: usar API Key directamente
      if (this.apiKey) {
        console.log('Usando API Key como token de acceso');
        this.accessToken = this.apiKey;
        this.tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hora
        return this.accessToken;
      }

      throw new Error('No se pudo obtener token de acceso');

    } catch (error) {
      console.error('Error obteniendo token de Cobru:', error.message);
      throw new Error('Error de autenticación con Cobru');
    }
  }

  /**
   * Crear un Cobru (link de pago)
   * @param {Object} cobruData - Datos para crear el Cobru
   * @returns {Promise<Object>} - Respuesta de Cobru con URL
   */
  async createCobru(cobruData) {
    try {
      const {
        amount,
        description,
        expiration_days = 1
      } = cobruData;

      // Validar datos requeridos
      if (!amount || !description) {
        throw new Error('Datos incompletos: amount y description son requeridos');
      }

      // Refrescar token
      const r = await this.refreshToken();
      const accessToken = r;

      const payload = {
        amount: amount,
        platform: "API",
        description: description,
        expiration_days: expiration_days,
        payment_method_enabled: JSON.stringify({ "credit_card": true })
      };

      console.log('Creando Cobru:', {
        amount: payload.amount,
        description: payload.description
      });

      const response = await axios.request({
        method: 'POST',
        url: `${this.baseUrl}/cobru/`,
        headers: {
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/json',
          'x-api-key': this.apiKey
        },
        data: payload
      });

      if (!response.data || !response.data.url) {
        throw new Error('No se pudo crear el Cobru: URL no recibida');
      }

      return {
        success: true,
        data: response.data,
        url: response.data.url,
        accessToken: accessToken
      };

    } catch (error) {
      console.error('Error creando Cobru:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'NO SE PUDO CREAR EL COBRU',
        error_axios: error.response ? {
          status: error.response.status,
          data: error.response.data
        } : error.message
      };
    }
  }

  /**
   * Procesar pago con tarjeta de crédito usando Cobru
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} - Resultado del pago
   */
  async processPayment(paymentData) {
    try {
      const {
        amount,
        description,
        payment = "credit_card",
        cc,
        name,
        email,
        phone,
        document_type,
        number, // número de tarjeta
        expiration, // fecha de expiración
        cvv,
        dues // cuotas
      } = paymentData;

      // Validar datos requeridos
      if (!amount || !description) {
        throw new Error('Datos incompletos: amount y description son requeridos');
      }

      // Crear Cobru primero
      const cobruResult = await this.createCobru({
        amount,
        description,
        expiration_days: 1
      });

      if (!cobruResult.success || !cobruResult.url) {
        return {
          success: false,
          error: cobruResult.error || 'NO SE PUDO CREAR EL COBRU',
          access: cobruResult.accessToken
        };
      }

      console.log('Cobru creado exitosamente, procesando pago...');

      // Preparar datos para el pago
      let senddata = {};
      
      if (payment === "credit_card") {
        if (!number || !expiration || !cvv || !name || !email) {
          throw new Error('Datos de tarjeta incompletos');
        }

        senddata = {
          cc: cc || name,
          name: name,
          email: email,
          phone: phone || '',
          payment: "credit_card",
          document_type: document_type || 'CC',
          credit_card: number,
          expiration_date: expiration,
          cvv: cvv,
          dues: dues || 1
        };
      }

      // Procesar el pago en el Cobru creado
      const paymentResponse = await axios.request({
        method: 'POST',
        url: `${this.baseUrl}/${cobruResult.url}`,
        headers: {
          'Access-Control-Allow-Headers': '*',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${cobruResult.accessToken}`,
          Accept: 'application/json',
          'x-api-key': this.apiKey
        },
        data: senddata
      });

      console.log('Pago procesado exitosamente');

      return {
        success: true,
        data: paymentResponse.data,
        url: cobruResult.url,
        transactionId: paymentResponse.data.id || paymentResponse.data.transaction_id
      };

    } catch (error) {
      console.error('Error procesando pago con Cobru:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'NO SE PUDO HACER EL PAGO',
        msg: error.response?.data || error.message
      };
    }
  }

  /**
   * Crear una transacción de pago (método legacy - mantiene compatibilidad)
   * @param {Object} paymentData - Datos del pago
   * @returns {Promise<Object>} - Respuesta de Cobru
   */
  async createPayment(paymentData) {
    // Si viene con datos de tarjeta, usar processPayment
    if (paymentData.number || paymentData.credit_card) {
      return await this.processPayment(paymentData);
    }

    // Si no, crear solo el Cobru (link de pago)
    return await this.createCobru(paymentData);
  }

  /**
   * Verificar el estado de una transacción
   * @param {string} transactionId - ID de la transacción
   * @returns {Promise<Object>} - Estado de la transacción
   */
  async getPaymentStatus(transactionId) {
    try {
      // Obtener token de acceso válido
      const accessToken = await this.getValidAccessToken();

      const response = await axios.get(`${this.baseUrl}/api/payments/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Environment': this.environment,
          'X-Merchant-ID': this.merchantId
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error verificando estado de pago:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Procesar webhook de Cobru
   * @param {Object} webhookData - Datos del webhook
   * @param {string} signature - Firma del webhook
   * @returns {Promise<Object>} - Resultado del procesamiento
   */
  async processWebhook(webhookData, signature) {
    try {
      // Verificar la firma del webhook
      if (!this.verifyWebhookSignature(webhookData, signature)) {
        throw new Error('Firma de webhook inválida');
      }

      const { event, data } = webhookData;

      switch (event) {
        case 'payment.approved':
          return await this.handlePaymentApproved(data);
        
        case 'payment.rejected':
          return await this.handlePaymentRejected(data);
        
        case 'payment.pending':
          return await this.handlePaymentPending(data);
        
        default:
          console.log(`Evento de webhook no manejado: ${event}`);
          return { success: true, message: 'Evento no manejado' };
      }

    } catch (error) {
      console.error('Error procesando webhook de Cobru:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manejar pago aprobado
   * @param {Object} paymentData - Datos del pago
   */
  async handlePaymentApproved(paymentData) {
    try {
      const { db } = require('../config/database-postgres');
      const RealTimeUpdatesService = require('./realTimeUpdates');
      const realTimeService = new RealTimeUpdatesService();

      console.log('Pago aprobado:', paymentData);
      
      // 1. Actualizar estado del pago en la base de datos
      await db.query(`
        UPDATE cobru_payments 
        SET status = 'approved', updated_at = NOW()
        WHERE transaction_id = $1
      `, [paymentData.id]);

      // 2. Crear registro de venta
      const saleQuery = `
        INSERT INTO sales (
          transaction_id, customer_id, event_id, ticket_type_id, quantity,
          unit_price, total_amount, payment_method, payment_status, 
          payment_gateway, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        RETURNING *
      `;

      const saleResult = await db.query(saleQuery, [
        paymentData.id,
        paymentData.customer_id,
        paymentData.event_id,
        paymentData.ticket_type_id,
        paymentData.quantity,
        paymentData.unit_price,
        paymentData.total_amount,
        'cobru',
        'completed',
        'cobru'
      ]);

      // 3. Actualizar inventario
      if (paymentData.event_id && paymentData.ticket_type_id && paymentData.quantity) {
        await this.updateTicketInventory(
          paymentData.ticket_type_id, 
          paymentData.event_id, 
          paymentData.quantity
        );
      }

      // 4. Notificar al POS en tiempo real
      await realTimeService.notifyNewSale(saleResult.rows[0]);
      await realTimeService.updateEventSales(paymentData.event_id);

      // 5. Enviar email de confirmación (opcional)
      // await this.sendConfirmationEmail(paymentData);

      return {
        success: true,
        message: 'Pago procesado exitosamente',
        saleId: saleResult.rows[0].id
      };

    } catch (error) {
      console.error('Error manejando pago aprobado:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Actualizar inventario de boletos
   */
  async updateTicketInventory(ticketTypeId, eventId, quantity) {
    const { db } = require('../config/database-postgres');
    
    await db.query("BEGIN");
    
    try {
      // Verificar disponibilidad
      const checkQuery = `
        SELECT tt.quantity - tt.sold as available
        FROM ticket_types tt
        WHERE tt.id = $1
      `;
      
      const availability = await db.query(checkQuery, [ticketTypeId]);
      
      if (availability.rows[0].available < quantity) {
        throw new Error('No hay suficientes boletos disponibles');
      }

      // Actualizar inventario
      await db.query(`
        UPDATE ticket_types 
        SET sold = sold + $1
        WHERE id = $2
      `, [quantity, ticketTypeId]);

      await db.query("COMMIT");
      
    } catch (error) {
      await db.query("ROLLBACK");
      throw error;
    }
  }

  /**
   * Manejar pago rechazado
   * @param {Object} paymentData - Datos del pago
   */
  async handlePaymentRejected(paymentData) {
    try {
      console.log('Pago rechazado:', paymentData);
      
      // TODO: Implementar lógica de negocio
      return {
        success: true,
        message: 'Pago rechazado procesado'
      };

    } catch (error) {
      console.error('Error manejando pago rechazado:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Manejar pago pendiente
   * @param {Object} paymentData - Datos del pago
   */
  async handlePaymentPending(paymentData) {
    try {
      console.log('Pago pendiente:', paymentData);
      
      // TODO: Implementar lógica de negocio
      return {
        success: true,
        message: 'Pago pendiente procesado'
      };

    } catch (error) {
      console.error('Error manejando pago pendiente:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Verificar la firma del webhook
   * @param {Object} payload - Datos del webhook
   * @param {string} signature - Firma recibida
   * @returns {boolean} - Si la firma es válida
   */
  verifyWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Error verificando firma del webhook:', error.message);
      return false;
    }
  }

  /**
   * Obtener métodos de pago disponibles
   * @returns {Promise<Object>} - Métodos de pago disponibles
   */
  async getPaymentMethods() {
    try {
      const response = await axios.get(`${this.baseUrl}/v1/payment-methods`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Environment': this.environment
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error obteniendo métodos de pago:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  /**
   * Obtener estadísticas de pagos
   * @param {Object} filters - Filtros para las estadísticas
   * @returns {Promise<Object>} - Estadísticas de pagos
   */
  async getPaymentStats(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await axios.get(`${this.baseUrl}/v1/payments/stats?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'X-Environment': this.environment
        }
      });

      return {
        success: true,
        data: response.data
      };

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }
}

module.exports = new CobruService();