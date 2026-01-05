// Sistema de Notificaciones basado en WordPress
// Emails automáticos y notificaciones del sistema POS

export interface NotificationTemplate {
  id: string
  name: string
  subject: string
  body: string
  type: 'email' | 'sms' | 'push' | 'system'
  category: 'sales' | 'tickets' | 'payments' | 'system' | 'events'
  variables: string[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: number
  templateId: string
  type: 'email' | 'sms' | 'push' | 'system'
  subject: string
  body: string
  status: 'pending' | 'sent' | 'failed' | 'delivered'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  scheduledAt?: Date
  sentAt?: Date
  deliveredAt?: Date
  errorMessage?: string
  metadata: Record<string, any>
  createdAt: Date
}

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    auth: {
      user: string
      pass: string
    }
  }
  from: {
    name: string
    email: string
  }
  replyTo?: string
}

export interface NotificationPreferences {
  userId: number
  email: boolean
  sms: boolean
  push: boolean
  system: boolean
  categories: {
    sales: boolean
    tickets: boolean
    payments: boolean
    system: boolean
    events: boolean
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

class NotificationService {
  private emailConfig: EmailConfig
  private templates: Map<string, NotificationTemplate> = new Map()
  private preferences: Map<number, NotificationPreferences> = new Map()

  constructor() {
    this.emailConfig = {
      smtp: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || ''
        }
      },
      from: {
        name: process.env.EMAIL_FROM_NAME || 'Eventu POS',
        email: process.env.EMAIL_FROM_EMAIL || 'noreply@eventu.com'
      }
    }
  }

  // Plantillas de notificación del WordPress
  private initializeTemplates(): void {
    const templates: NotificationTemplate[] = [
      {
        id: 'sale_confirmation',
        name: 'Confirmación de Venta',
        subject: 'Confirmación de Venta - {{eventName}}',
        body: 
          '<h2>¡Venta Confirmada!</h2>' +
          '<p>Hola {{customerName}},</p>' +
          '<p>Tu compra ha sido procesada exitosamente:</p>' +
          '<ul>' +
            '<li><strong>Evento:</strong> {{eventName}}</li>' +
            '<li><strong>Fecha:</strong> {{eventDate}}</li>' +
            '<li><strong>Ubicación:</strong> {{eventLocation}}</li>' +
            '<li><strong>Total:</strong> ${{total}}</li>' +
            '<li><strong>Número de Orden:</strong> {{orderNumber}}</li>' +
          '</ul>' +
          '<p>Tu ticket será enviado por separado.</p>' +
          '<p>¡Gracias por tu compra!</p>',
        type: 'email',
        category: 'sales',
        variables: ['customerName', 'eventName', 'eventDate', 'eventLocation', 'total', 'orderNumber'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'payment_failed',
        name: 'Pago Fallido',
        subject: 'Pago No Procesado - {{eventName}}',
        body: 
          '<h2>Problema con el Pago</h2>' +
          '<p>Hola {{customerName}},</p>' +
          '<p>Lamentamos informarte que tu pago para <strong>{{eventName}}</strong> no pudo ser procesado.</p>' +
          '<p><strong>Detalles del problema:</strong></p>' +
          '<ul>' +
            '<li><strong>Monto:</strong> ${{total}}</li>' +
            '<li><strong>Método:</strong> {{paymentMethod}}</li>' +
            '<li><strong>Error:</strong> {{errorMessage}}</li>' +
          '</ul>' +
          '<p><strong>¿Qué puedes hacer?</strong></p>' +
          '<ul>' +
            '<li>Verifica que tu tarjeta tenga fondos suficientes</li>' +
            '<li>Intenta con otro método de pago</li>' +
            '<li>Contacta a tu banco si el problema persiste</li>' +
          '</ul>' +
          '<p>Puedes reintentar tu compra <a href="{{retryUrl}}">aquí</a>.</p>',
        type: 'email',
        category: 'payments',
        variables: ['customerName', 'eventName', 'total', 'paymentMethod', 'errorMessage', 'retryUrl'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'refund_processed',
        name: 'Reembolso Procesado',
        subject: 'Reembolso Procesado - {{orderNumber}}',
        body: 
          '<h2>Reembolso Procesado</h2>' +
          '<p>Hola {{customerName}},</p>' +
          '<p>Tu reembolso ha sido procesado exitosamente:</p>' +
          '<ul>' +
            '<li><strong>Orden:</strong> {{orderNumber}}</li>' +
            '<li><strong>Monto:</strong> ${{total}}</li>' +
            '<li><strong>Método:</strong> {{refundMethod}}</li>' +
            '<li><strong>Fecha:</strong> {{refundDate}}</li>' +
          '</ul>' +
          '<p>El reembolso aparecerá en tu cuenta bancaria en 3-5 días hábiles.</p>' +
          '<p>Si tienes alguna pregunta, no dudes en contactarnos.</p>',
        type: 'email',
        category: 'payments',
        variables: ['customerName', 'orderNumber', 'total', 'refundMethod', 'refundDate'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
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
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    templates.forEach(template => {
      this.templates.set(template.id, template)
    })
  }

  // Enviar notificación
  async sendNotification(
    userId: number,
    templateId: string,
    variables: Record<string, any>,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent'
      scheduledAt?: Date
      type?: 'email' | 'sms' | 'push' | 'system'
    } = {}
  ): Promise<boolean> {
    try {
      const template = this.templates.get(templateId)
      if (!template) {
        throw new Error(`Template ${templateId} not found`)
      }

      // Verificar preferencias del usuario
      const preferences = this.preferences.get(userId)
      if (preferences && !this.canSendNotification(preferences, template)) {
        return false
      }

      // Procesar plantilla
      const processedSubject = this.processTemplate(template.subject, variables)
      const processedBody = this.processTemplate(template.body, variables)

      // Crear notificación
      const notification: Notification = {
        id: this.generateId(),
        userId,
        templateId,
        type: options.type || template.type,
        subject: processedSubject,
        body: processedBody,
        status: 'pending',
        priority: options.priority || 'medium',
        scheduledAt: options.scheduledAt,
        metadata: variables,
        createdAt: new Date()
      }

      // Enviar según el tipo
      switch (notification.type) {
        case 'email':
          return await this.sendEmail(notification)
        case 'sms':
          return await this.sendSMS(notification)
        case 'push':
          return await this.sendPush(notification)
        case 'system':
          return await this.sendSystem(notification)
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`)
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      return false
    }
  }

  // Procesar plantilla con variables
  private processTemplate(template: string, variables: Record<string, any>): string {
    let processed = template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processed = processed.replace(regex, String(value))
    })
    return processed
  }

  // Enviar email
  private async sendEmail(notification: Notification): Promise<boolean> {
    try {
      // Aquí implementarías el envío real de email
      // Por ahora simulamos el envío
      console.log('Sending email:', {
        to: notification.userId,
        subject: notification.subject,
        body: notification.body
      })
      
      notification.status = 'sent'
      notification.sentAt = new Date()
      return true
    } catch (error) {
      notification.status = 'failed'
      notification.errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return false
    }
  }

  // Enviar SMS
  private async sendSMS(notification: Notification): Promise<boolean> {
    try {
      console.log('Sending SMS:', {
        to: notification.userId,
        body: notification.body
      })
      
      notification.status = 'sent'
      notification.sentAt = new Date()
      return true
    } catch (error) {
      notification.status = 'failed'
      notification.errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return false
    }
  }

  // Enviar push notification
  private async sendPush(notification: Notification): Promise<boolean> {
    try {
      console.log('Sending push notification:', {
        to: notification.userId,
        title: notification.subject,
        body: notification.body
      })
      
      notification.status = 'sent'
      notification.sentAt = new Date()
      return true
    } catch (error) {
      notification.status = 'failed'
      notification.errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return false
    }
  }

  // Enviar notificación del sistema
  private async sendSystem(notification: Notification): Promise<boolean> {
    try {
      console.log('Sending system notification:', {
        to: notification.userId,
        title: notification.subject,
        body: notification.body
      })
      
      notification.status = 'sent'
      notification.sentAt = new Date()
      return true
    } catch (error) {
      notification.status = 'failed'
      notification.errorMessage = error instanceof Error ? error.message : 'Error desconocido'
      return false
    }
  }

  // Verificar si se puede enviar notificación
  private canSendNotification(preferences: NotificationPreferences, template: NotificationTemplate): boolean {
    // Verificar si el tipo está habilitado
    if (!preferences[template.type]) {
      return false
    }

    // Verificar si la categoría está habilitada
    if (!preferences.categories[template.category]) {
      return false
    }

    // Verificar horas silenciosas
    if (preferences.quietHours.enabled) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()
      const startTime = this.parseTime(preferences.quietHours.start)
      const endTime = this.parseTime(preferences.quietHours.end)
      
      if (currentTime >= startTime && currentTime <= endTime) {
        return false
      }
    }

    return true
  }

  // Parsear tiempo (HH:MM)
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number)
    return hours * 60 + minutes
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Obtener plantillas
  getTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values())
  }

  // Obtener plantilla por ID
  getTemplate(id: string): NotificationTemplate | undefined {
    return this.templates.get(id)
  }

  // Configurar preferencias de usuario
  setUserPreferences(userId: number, preferences: NotificationPreferences): void {
    this.preferences.set(userId, preferences)
  }

  // Obtener preferencias de usuario
  getUserPreferences(userId: number): NotificationPreferences | undefined {
    return this.preferences.get(userId)
  }
}

export const notificationService = new NotificationService()
