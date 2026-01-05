const crypto = require('crypto');

class EPaycoService {
  constructor() {
    this.publicKey = process.env.EPAYCO_PUBLIC_KEY;
    this.privateKey = process.env.EPAYCO_PRIVATE_KEY;
    this.pKey = process.env.EPAYCO_P_KEY;
    this.customerId = process.env.EPAYCO_CUSTOMER_ID;
    this.isSandbox = process.env.PAYMENT_MODE === 'sandbox';
    
    // URLs base según el modo
    this.baseUrl = this.isSandbox 
      ? 'https://api.secure.payco.co' 
      : 'https://api.secure.payco.co';
    
    this.confirmUrl = process.env.EPAYCO_CONFIRM_URL;
    this.responseUrl = process.env.EPAYCO_RESPONSE_URL;
    this.cancelUrl = process.env.EPAYCO_CANCEL_URL;
  }

  /**
   * Crear una transacción en ePayco
   * @param {Object} paymentData - Datos del pago
   * @returns {Object} Respuesta de ePayco
   */
  async createTransaction(paymentData) {
    try {
      const {
        amount,
        currency = 'COP',
        description,
        invoice,
        name_billing,
        address_billing,
        phone_billing,
        email_billing,
        extra1, // ID de la venta
        extra2, // ID del evento
        extra3  // ID del usuario
      } = paymentData;

      // Validar datos requeridos
      if (!amount || !description || !invoice) {
        throw new Error('Datos de pago incompletos');
      }

      // Crear firma de seguridad
      const signature = this.generateSignature({
        p_cust_id_cliente: this.customerId,
        p_key: this.pKey,
        p_id_invoice: invoice,
        p_amount: amount,
        p_currency_code: currency
      });

      const transactionData = {
        // Datos básicos
        p_cust_id_cliente: this.customerId,
        p_key: this.pKey,
        p_id_invoice: invoice,
        p_description: description,
        p_amount: amount,
        p_currency_code: currency,
        p_signature: signature,
        
        // URLs de respuesta
        p_url_response: this.responseUrl,
        p_url_confirmation: this.confirmUrl,
        p_cancel_url: this.cancelUrl,
        
        // Datos del comprador
        p_name_billing: name_billing || 'Cliente',
        p_address_billing: address_billing || 'Dirección no especificada',
        p_phone_billing: phone_billing || '0000000000',
        p_email_billing: email_billing || 'cliente@ejemplo.com',
        
        // Datos adicionales
        p_extra1: extra1 || '',
        p_extra2: extra2 || '',
        p_extra3: extra3 || '',
        
        // Configuración de la transacción
        p_test_request: this.isSandbox ? 'TRUE' : 'FALSE',
        p_autoredirect: 'TRUE',
        p_language: 'es'
      };

      // En modo sandbox, retornar datos simulados
      if (this.isSandbox) {
        return this.createSandboxResponse(transactionData);
      }

      // En producción, hacer la llamada real a ePayco
      return await this.makeEPaycoRequest(transactionData);

    } catch (error) {
      console.error('Error creando transacción ePayco:', error);
      throw new Error(`Error en ePayco: ${error.message}`);
    }
  }

  /**
   * Generar firma de seguridad para ePayco
   */
  generateSignature(data) {
    const { p_cust_id_cliente, p_key, p_id_invoice, p_amount, p_currency_code } = data;
    const signatureString = `${p_cust_id_cliente}^${p_key}^${p_id_invoice}^${p_amount}^${p_currency_code}`;
    return crypto.createHash('md5').update(signatureString).digest('hex');
  }

  /**
   * Crear respuesta simulada para sandbox
   */
  createSandboxResponse(transactionData) {
    const transactionId = `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      success: true,
      data: {
        transactionId: transactionId,
        ref_payco: transactionId,
        transactionRef: transactionId,
        factura: transactionData.p_id_invoice,
        descripcion: transactionData.p_description,
        valor: transactionData.p_amount,
        iva: '0',
        baseiva: transactionData.p_amount,
        moneda: transactionData.p_currency_code,
        banco: 'BANCO_SANDBOX',
        estado: 'Pendiente',
        respuesta: '1',
        autorizacion: transactionId,
        recibo: transactionId,
        fecha: new Date().toISOString(),
        franquicia: 'VISA',
        cod_respuesta: '1',
        ip: '127.0.0.1',
        tipoDoc: 'CC',
        documento: '12345678',
        nombres: transactionData.p_name_billing,
        apellidos: 'Cliente',
        email: transactionData.p_email_billing,
        ciudad: 'Bogotá',
        direccion: transactionData.p_address_billing,
        ind_pais: 'CO',
        phone: transactionData.p_phone_billing,
        p_url_response: transactionData.p_url_response,
        p_url_confirmation: transactionData.p_url_confirmation,
        p_cancel_url: transactionData.p_cancel_url,
        p_test_request: transactionData.p_test_request,
        p_extra1: transactionData.p_extra1,
        p_extra2: transactionData.p_extra2,
        p_extra3: transactionData.p_extra3
      },
      sandbox: true,
      message: 'Transacción creada en modo sandbox'
    };
  }

  /**
   * Hacer petición real a ePayco (para producción)
   */
  async makeEPaycoRequest(transactionData) {
    const axios = require('axios');
    
    try {
      const response = await axios.post(`${this.baseUrl}/v1/transaction`, transactionData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        sandbox: false
      };
    } catch (error) {
      console.error('Error en petición a ePayco:', error.response?.data || error.message);
      throw new Error('Error comunicándose con ePayco');
    }
  }

  /**
   * Verificar el estado de una transacción
   */
  async getTransactionStatus(transactionId) {
    try {
      if (this.isSandbox) {
        // En sandbox, simular diferentes estados
        const states = ['Pendiente', 'Aprobada', 'Rechazada'];
        const randomState = states[Math.floor(Math.random() * states.length)];
        
        return {
          success: true,
          data: {
            ref_payco: transactionId,
            estado: randomState,
            respuesta: randomState === 'Aprobada' ? '1' : '2',
            fecha: new Date().toISOString()
          },
          sandbox: true
        };
      }

      // En producción, consultar estado real
      const axios = require('axios');
      const response = await axios.get(`${this.baseUrl}/v1/transaction/${transactionId}`, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return {
        success: true,
        data: response.data,
        sandbox: false
      };
    } catch (error) {
      console.error('Error consultando estado de transacción:', error);
      throw new Error('Error consultando estado de transacción');
    }
  }

  /**
   * Procesar webhook de confirmación de ePayco
   */
  processWebhook(webhookData) {
    try {
      const {
        ref_payco,
        factura,
        descripcion,
        valor,
        iva,
        baseiva,
        moneda,
        banco,
        estado,
        respuesta,
        autorizacion,
        recibo,
        fecha,
        franquicia,
        cod_respuesta,
        ip,
        tipoDoc,
        documento,
        nombres,
        apellidos,
        email,
        ciudad,
        direccion,
        ind_pais,
        phone,
        p_extra1, // ID de la venta
        p_extra2, // ID del evento
        p_extra3  // ID del usuario
      } = webhookData;

      // Validar firma del webhook
      const expectedSignature = this.generateSignature({
        p_cust_id_cliente: this.customerId,
        p_key: this.pKey,
        p_id_invoice: factura,
        p_amount: valor,
        p_currency_code: moneda
      });

      if (webhookData.p_signature !== expectedSignature) {
        throw new Error('Firma de webhook inválida');
      }

      return {
        success: true,
        transactionId: ref_payco,
        saleId: p_extra1,
        eventId: p_extra2,
        userId: p_extra3,
        status: estado,
        responseCode: cod_respuesta,
        amount: parseFloat(valor),
        currency: moneda,
        authorization: autorizacion,
        receipt: recibo,
        bank: banco,
        franchise: franquicia,
        customer: {
          document: documento,
          name: nombres,
          lastName: apellidos,
          email: email,
          phone: phone,
          address: direccion,
          city: ciudad,
          country: ind_pais
        },
        processedAt: new Date(fecha),
        isApproved: respuesta === '1' && cod_respuesta === '1'
      };
    } catch (error) {
      console.error('Error procesando webhook de ePayco:', error);
      throw new Error(`Error procesando webhook: ${error.message}`);
    }
  }

  /**
   * Obtener configuración para el frontend
   */
  getFrontendConfig() {
    return {
      publicKey: this.publicKey,
      isSandbox: this.isSandbox,
      confirmUrl: this.confirmUrl,
      responseUrl: this.responseUrl,
      cancelUrl: this.cancelUrl,
      customerId: this.customerId
    };
  }
}

module.exports = EPaycoService;
