const express = require('express');
const router = express.Router();
const { auth, requireRole } = require('../middleware/auth');
const { db } = require('../config/database-postgres');

// Obtener todas las plantillas de notificación
router.get('/templates', auth, async (req, res) => {
  try {
    const templates = [
      {
        id: 'sale_confirmation',
        name: 'Confirmación de Venta',
        subject: 'Confirmación de Venta - {{eventName}}',
        body: `
          <h2>¡Venta Confirmada!</h2>
          <p>Hola {{customerName}},</p>
          <p>Tu compra ha sido procesada exitosamente:</p>
          <ul>
            <li><strong>Evento:</strong> {{eventName}}</li>
            <li><strong>Fecha:</strong> {{eventDate}}</li>
            <li><strong>Ubicación:</strong> {{eventLocation}}</li>
            <li><strong>Total:</strong> ${{totalAmount}}</li>
            <li><strong>Número de Orden:</strong> {{orderNumber}}</li>
          </ul>
          <p>Tu ticket será enviado por separado.</p>
          <p>¡Gracias por tu compra!</p>
        `,
        type: 'email',
        category: 'sales',
        variables: ['customerName', 'eventName', 'eventDate', 'eventLocation', 'totalAmount', 'orderNumber'],
        isActive: true
      },
      {
        id: 'ticket_delivery',
        name: 'Entrega de Ticket',
        subject: 'Tu Ticket - {{eventName}}',
        body: `
          <h2>Tu Ticket está Listo</h2>
          <p>Hola {{customerName}},</p>
          <p>Tu ticket para <strong>{{eventName}}</strong> está listo:</p>
          <div style="border: 2px solid #000; padding: 20px; text-align: center; margin: 20px 0;">
            <h3>{{eventName}}</h3>
            <p><strong>Fecha:</strong> {{eventDate}}</p>
            <p><strong>Hora:</strong> {{eventTime}}</p>
            <p><strong>Ubicación:</strong> {{eventLocation}}</p>
            <p><strong>Asiento:</strong> {{seatNumber}}</p>
            <div style="margin: 20px 0;">
              <img src="{{qrCodeUrl}}" alt="QR Code" style="max-width: 200px;">
            </div>
            <p><strong>Código:</strong> {{ticketCode}}</p>
          </div>
          <p><strong>Instrucciones:</strong></p>
          <ul>
            <li>Presenta este ticket en la entrada del evento</li>
            <li>El código QR será escaneado para validar tu entrada</li>
            <li>Llega 30 minutos antes del inicio</li>
          </ul>
        `,
        type: 'email',
        category: 'tickets',
        variables: ['customerName', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'seatNumber', 'qrCodeUrl', 'ticketCode'],
        isActive: true
      },
      {
        id: 'payment_failed',
        name: 'Pago Fallido',
        subject: 'Pago No Procesado - {{eventName}}',
        body: `
          <h2>Problema con el Pago</h2>
          <p>Hola {{customerName}},</p>
          <p>Lamentamos informarte que tu pago para <strong>{{eventName}}</strong> no pudo ser procesado.</p>
          <p><strong>Detalles del problema:</strong></p>
          <ul>
            <li><strong>Monto:</strong> ${{totalAmount}}</li>
            <li><strong>Método:</strong> {{paymentMethod}}</li>
            <li><strong>Error:</strong> {{errorMessage}}</li>
          </ul>
          <p><strong>¿Qué puedes hacer?</strong></p>
          <ul>
            <li>Verifica que tu tarjeta tenga fondos suficientes</li>
            <li>Intenta con otro método de pago</li>
            <li>Contacta a tu banco si el problema persiste</li>
          </ul>
          <p>Puedes reintentar tu compra <a href="{{retryUrl}}">aquí</a>.</p>
        `,
        type: 'email',
        category: 'payments',
        variables: ['customerName', 'eventName', 'totalAmount', 'paymentMethod', 'errorMessage', 'retryUrl'],
        isActive: true
      },
      {
        id: 'refund_processed',
        name: 'Reembolso Procesado',
        subject: 'Reembolso Procesado - {{orderNumber}}',
        body: `
          <h2>Reembolso Procesado</h2>
          <p>Hola {{customerName}},</p>
          <p>Tu reembolso ha sido procesado exitosamente:</p>
          <ul>
            <li><strong>Orden:</strong> {{orderNumber}}</li>
            <li><strong>Monto:</strong> ${{refundAmount}}</li>
            <li><strong>Método:</strong> {{refundMethod}}</li>
            <li><strong>Fecha:</strong> {{refundDate}}</li>
          </ul>
          <p>El reembolso aparecerá en tu cuenta bancaria en 3-5 días hábiles.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        `,
        type: 'email',
        category: 'payments',
        variables: ['customerName', 'orderNumber', 'refundAmount', 'refundMethod', 'refundDate'],
        isActive: true
      },
      {
        id: 'event_reminder',
        name: 'Recordatorio de Evento',
        subject: 'Recordatorio - {{eventName}} es mañana',
        body: `
          <h2>¡No olvides tu evento!</h2>
          <p>Hola {{customerName}},</p>
          <p>Te recordamos que tienes un evento mañana:</p>
          <div style="border: 1px solid #ddd; padding: 15px; margin: 15px 0;">
            <h3>{{eventName}}</h3>
            <p><strong>Fecha:</strong> {{eventDate}}</p>
            <p><strong>Hora:</strong> {{eventTime}}</p>
            <p><strong>Ubicación:</strong> {{eventLocation}}</p>
            <p><strong>Asiento:</strong> {{seatNumber}}</p>
          </div>
          <p><strong>Consejos para el evento:</strong></p>
          <ul>
            <li>Llega 30 minutos antes del inicio</li>
            <li>Trae una identificación válida</li>
            <li>Presenta tu ticket en la entrada</li>
          </ul>
          <p>¡Esperamos verte allí!</p>
        `,
        type: 'email',
        category: 'events',
        variables: ['customerName', 'eventName', 'eventDate', 'eventTime', 'eventLocation', 'seatNumber'],
        isActive: true
      },
      {
        id: 'system_alert',
        name: 'Alerta del Sistema',
        subject: 'Alerta del Sistema - {{alertType}}',
        body: `
          <h2>Alerta del Sistema</h2>
          <p>Se ha detectado una alerta en el sistema:</p>
          <ul>
            <li><strong>Tipo:</strong> {{alertType}}</li>
            <li><strong>Severidad:</strong> {{severity}}</li>
            <li><strong>Descripción:</strong> {{description}}</li>
            <li><strong>Fecha:</strong> {{alertDate}}</li>
          </ul>
          <p><strong>Acción requerida:</strong> {{actionRequired}}</p>
          <p>Por favor, revisa el sistema y toma las medidas necesarias.</p>
        `,
        type: 'email',
        category: 'system',
        variables: ['alertType', 'severity', 'description', 'alertDate', 'actionRequired'],
        isActive: true
      }
    ];

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error obteniendo plantillas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Enviar notificación
router.post('/send', auth, async (req, res) => {
  try {
    const { userId, templateId, variables, options = {} } = req.body;
    
    // Validar datos requeridos
    if (!userId || !templateId || !variables) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: userId, templateId, variables'
      });
    }

    // Obtener plantilla
    const templates = [
      {
        id: 'sale_confirmation',
        subject: 'Confirmación de Venta - {{eventName}}',
        body: 'Tu compra ha sido procesada exitosamente para {{eventName}}'
      },
      {
        id: 'ticket_delivery',
        subject: 'Tu Ticket - {{eventName}}',
        body: 'Tu ticket para {{eventName}} está listo'
      },
      {
        id: 'payment_failed',
        subject: 'Pago No Procesado - {{eventName}}',
        body: 'Tu pago para {{eventName}} no pudo ser procesado'
      }
    ];

    const template = templates.find(t => t.id === templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Plantilla no encontrada'
      });
    }

    // Procesar plantilla con variables
    let processedSubject = template.subject;
    let processedBody = template.body;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedSubject = processedSubject.replace(regex, String(value));
      processedBody = processedBody.replace(regex, String(value));
    });

    // Simular envío de notificación
    const notification = {
      id: Date.now().toString(),
      userId,
      templateId,
      subject: processedSubject,
      body: processedBody,
      status: 'sent',
      sentAt: new Date(),
      variables
    };

    console.log('Notificación enviada:', notification);

    res.json({
      success: true,
      message: 'Notificación enviada correctamente',
      data: notification
    });
  } catch (error) {
    console.error('Error enviando notificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener historial de notificaciones
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;
    
    // Simular historial de notificaciones
    const notifications = [
      {
        id: '1',
        userId: 1,
        templateId: 'sale_confirmation',
        subject: 'Confirmación de Venta - Concierto Rock',
        status: 'sent',
        type: 'email',
        sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 horas atrás
        variables: {
          customerName: 'Juan Pérez',
          eventName: 'Concierto Rock',
          totalAmount: '150000'
        }
      },
      {
        id: '2',
        userId: 2,
        templateId: 'ticket_delivery',
        subject: 'Tu Ticket - Festival de Música',
        status: 'sent',
        type: 'email',
        sentAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 horas atrás
        variables: {
          customerName: 'María García',
          eventName: 'Festival de Música'
        }
      }
    ];

    // Filtrar por estado si se especifica
    let filteredNotifications = notifications;
    if (status) {
      filteredNotifications = notifications.filter(n => n.status === status);
    }
    if (type) {
      filteredNotifications = filteredNotifications.filter(n => n.type === type);
    }

    // Paginación
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedNotifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredNotifications.length,
        pages: Math.ceil(filteredNotifications.length / limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Obtener estadísticas de notificaciones
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = {
      sentToday: 0,
      pending: 0,
      successful: 0,
      failed: 0,
      byType: {
        email: 0,
        sms: 0,
        push: 0,
        system: 0
      },
      byCategory: {
        sales: 0,
        tickets: 0,
        payments: 0,
        system: 0,
        events: 0
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Probar configuración de email
router.post('/test-email', auth, requireRole(['administrator']), async (req, res) => {
  try {
    const { smtpConfig, testEmail } = req.body;
    
    // Simular prueba de configuración
    console.log('Probando configuración de email:', { smtpConfig, testEmail });
    
    // Aquí implementarías la prueba real de SMTP
    // Por ahora simulamos éxito
    res.json({
      success: true,
      message: 'Configuración de email probada exitosamente'
    });
  } catch (error) {
    console.error('Error probando configuración de email:', error);
    res.status(500).json({
      success: false,
      message: 'Error probando configuración de email'
    });
  }
});

module.exports = router;
