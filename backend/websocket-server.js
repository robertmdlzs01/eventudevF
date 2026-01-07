const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const adminSharedState = require('./services/adminSharedState')
const realTimeUpdatesService = require('./services/realTimeUpdates')

class WebSocketServer {
  constructor(server) {
    // Configuración CORS para WebSocket más flexible en desarrollo
    const wsCorsOrigin = process.env.NODE_ENV === 'development' 
      ? (origin, callback) => {
          // Permitir localhost y direcciones IP locales en desarrollo
          if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
            return callback(null, true)
          }
          const localIPPattern = /^https?:\/\/(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/
          if (localIPPattern.test(origin)) {
            return callback(null, true)
          }
          const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || []
          if (allowedOrigins.includes(origin)) {
            return callback(null, true)
          }
          callback(new Error('Not allowed by CORS'))
        }
      : process.env.FRONTEND_URL || "https://dev1.eventu.co"
    
    this.io = new Server(server, {
      cors: {
        origin: wsCorsOrigin,
        methods: ["GET", "POST"],
        credentials: true
      }
    })
    
    this.connectedUsers = new Map() // userId -> socket
    this.userRooms = new Map() // userId -> room
    
    this.setupMiddleware()
    this.setupEventHandlers()
  }

  setupMiddleware() {
    // Autenticación JWT
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '')
      
      if (!token) {
        return next(new Error('Authentication error'))
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        socket.userId = decoded.userId
        socket.userRole = decoded.role
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.userId} connected`)
      
      // Agregar información adicional al socket
      socket.connectedAt = new Date()
      socket.userEmail = socket.handshake.auth.email || 'unknown@eventu.co'
      
      // Agregar usuario a la lista de conectados
      this.connectedUsers.set(socket.userId, socket)
      
      // Agregar cliente al servicio de actualizaciones en tiempo real
      realTimeUpdatesService.addClient(socket.userId, socket, socket.userId, socket.userRole)
      
      // Unirse a sala según el rol
      const room = this.getRoomByRole(socket.userRole)
      socket.join(room)
      this.userRooms.set(socket.userId, room)
      
      // Unirse a sala en el servicio de actualizaciones
      realTimeUpdatesService.joinRoom(socket.userId, room)
      
      // Si es administrador, agregarlo al estado compartido
      if (socket.userRole === 'admin') {
        adminSharedState.addSubscriber(socket)
        
        // Enviar datos actuales del dashboard
        this.sendDashboardData(socket)
        
        // Enviar lista de administradores conectados
        this.sendConnectedAdmins()
      }
      
      // Enviar notificaciones no leídas
      this.sendUnreadNotifications(socket)
      
      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log(`User ${socket.userId} disconnected`)
        this.connectedUsers.delete(socket.userId)
        this.userRooms.delete(socket.userId)
        
        // Remover del servicio de actualizaciones
        realTimeUpdatesService.removeClient(socket.userId)
        const room = this.userRooms.get(socket.userId)
        if (room) {
          realTimeUpdatesService.leaveRoom(socket.userId, room)
        }
        
        // Si era administrador, removerlo del estado compartido
        if (socket.userRole === 'admin') {
          adminSharedState.removeSubscriber(socket)
          this.sendConnectedAdmins()
        }
      })
      
      // Marcar notificación como leída
      socket.on('markNotificationRead', (notificationId) => {
        this.markNotificationAsRead(socket.userId, notificationId)
      })
      
      // Marcar todas las notificaciones como leídas
      socket.on('markAllNotificationsRead', () => {
        this.markAllNotificationsAsRead(socket.userId)
      })
      
      // Eventos específicos para administradores
      if (socket.userRole === 'admin') {
        // Solicitar actualización del dashboard
        socket.on('request_dashboard_update', async () => {
          await this.sendDashboardData(socket)
        })
        
        // Forzar actualización del cache
        socket.on('force_dashboard_refresh', async () => {
          const freshData = await adminSharedState.invalidateCache()
          socket.emit('dashboard_updated', freshData)
        })
      }
    })
  }

  getRoomByRole(role) {
    switch (role) {
      case 'admin':
        return 'admins'
      case 'organizer':
        return 'organizers'
      default:
        return 'users'
    }
  }

  // Enviar notificación a usuarios específicos
  sendNotification(notification) {
    const { target, recipients } = notification
    
    switch (target) {
      case 'all':
        this.io.emit('newNotification', notification)
        break
      case 'admins':
        this.io.to('admins').emit('newNotification', notification)
        break
      case 'organizers':
        this.io.to('organizers').emit('newNotification', notification)
        break
      case 'users':
        this.io.to('users').emit('newNotification', notification)
        break
      case 'specific':
        if (recipients && Array.isArray(recipients)) {
          recipients.forEach(userId => {
            const userSocket = this.connectedUsers.get(userId)
            if (userSocket) {
              userSocket.emit('newNotification', notification)
            }
          })
        }
        break
    }
  }

  // Enviar notificaciones no leídas al usuario
  async sendUnreadNotifications(socket) {
    try {
      const db = require('./config/database-postgres')
      const query = `
        SELECT * FROM notifications 
        WHERE (target = 'all' OR target = $1 OR (target = 'specific' AND recipients @> $2))
        AND NOT (read_by @> $2)
        ORDER BY sent_at DESC
        LIMIT 10
      `
      const result = await db.query(query, [socket.userRole, JSON.stringify([socket.userId])])
      
      if (result.rows.length > 0) {
        socket.emit('unreadNotifications', result.rows)
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
    }
  }

  // Marcar notificación como leída
  async markNotificationAsRead(userId, notificationId) {
    try {
      const db = require('./config/database-postgres')
      const query = `
        UPDATE notifications 
        SET read_by = COALESCE(read_by, '[]'::jsonb) || $1::jsonb
        WHERE id = $2
      `
      await db.query(query, [JSON.stringify([userId]), notificationId])
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Marcar todas las notificaciones como leídas
  async markAllNotificationsAsRead(userId) {
    try {
      const db = require('./config/database-postgres')
      const query = `
        UPDATE notifications 
        SET read_by = COALESCE(read_by, '[]'::jsonb) || $1::jsonb
        WHERE NOT (read_by @> $1::jsonb)
      `
      await db.query(query, [JSON.stringify([userId])])
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  // Enviar actualización en tiempo real
  sendRealtimeUpdate(type, data) {
    this.io.emit('realtimeUpdate', { type, data, timestamp: new Date().toISOString() })
  }

  // Enviar actualización específica por rol
  sendRoleUpdate(role, type, data) {
    this.io.to(role).emit('realtimeUpdate', { type, data, timestamp: new Date().toISOString() })
  }

  // Enviar datos del dashboard a un administrador específico
  async sendDashboardData(socket) {
    try {
      const dashboardData = await adminSharedState.getDashboardStats()
      socket.emit('dashboard_data', dashboardData)
    } catch (error) {
      console.error('Error sending dashboard data:', error)
      socket.emit('dashboard_error', { message: 'Error al cargar datos del dashboard' })
    }
  }

  // Enviar lista de administradores conectados a todos los admins
  sendConnectedAdmins() {
    const connectedAdmins = adminSharedState.getConnectedAdmins()
    this.io.to('admins').emit('connected_admins', connectedAdmins)
  }

  // Notificar a todos los administradores sobre cambios
  async notifyAdminsOfChange(changeType, data) {
    console.log(`Notificando a administradores sobre cambio: ${changeType}`)
    
    // Invalidar cache y obtener datos frescos
    const freshData = await adminSharedState.invalidateCache()
    
    // Enviar notificación específica del cambio
    this.io.to('admins').emit('admin_change', {
      type: changeType,
      data: data,
      timestamp: new Date().toISOString()
    })
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    return {
      totalConnections: this.connectedUsers.size,
      admins: this.io.sockets.adapter.rooms.get('admins')?.size || 0,
      organizers: this.io.sockets.adapter.rooms.get('organizers')?.size || 0,
      users: this.io.sockets.adapter.rooms.get('users')?.size || 0
    }
  }
}

module.exports = WebSocketServer
