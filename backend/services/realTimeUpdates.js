const WebSocket = require('ws')
const db = require('../config/database-postgres')

class RealTimeUpdatesService {
  constructor() {
    this.clients = new Map() // Map de clientes conectados
    this.rooms = new Map() // Map de salas por evento
  }

  // Agregar cliente WebSocket
  addClient(clientId, ws, userId = null, role = null) {
    this.clients.set(clientId, {
      ws,
      userId,
      role,
      connectedAt: new Date(),
      lastActivity: new Date()
    })
    
    console.log(`🔌 Cliente ${clientId} conectado (${role || 'guest'})`)
  }

  // Remover cliente WebSocket
  removeClient(clientId) {
    if (this.clients.has(clientId)) {
      this.clients.delete(clientId)
      console.log(`🔌 Cliente ${clientId} desconectado`)
    }
  }

  // Unirse a una sala (evento específico)
  joinRoom(clientId, roomId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set())
    }
    
    this.rooms.get(roomId).add(clientId)
    console.log(`🏠 Cliente ${clientId} se unió a la sala ${roomId}`)
  }

  // Salir de una sala
  leaveRoom(clientId, roomId) {
    if (this.rooms.has(roomId)) {
      this.rooms.get(roomId).delete(clientId)
      console.log(`🏠 Cliente ${clientId} salió de la sala ${roomId}`)
    }
  }

  // Enviar actualización a todos los clientes
  broadcastToAll(type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    
    this.clients.forEach((client, clientId) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Error enviando mensaje a cliente ${clientId}:`, error)
          this.removeClient(clientId)
        }
      }
    })
  }

  // Enviar actualización a una sala específica
  broadcastToRoom(roomId, type, data) {
    if (!this.rooms.has(roomId)) return

    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    
    this.rooms.get(roomId).forEach(clientId => {
      const client = this.clients.get(clientId)
      if (client && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Error enviando mensaje a cliente ${clientId}:`, error)
          this.removeClient(clientId)
        }
      }
    })
  }

  // Enviar actualización a usuarios con rol específico
  broadcastToRole(role, type, data) {
    const message = JSON.stringify({ type, data, timestamp: new Date().toISOString() })
    
    this.clients.forEach((client, clientId) => {
      if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
        try {
          client.ws.send(message)
        } catch (error) {
          console.error(`Error enviando mensaje a cliente ${clientId}:`, error)
          this.removeClient(clientId)
        }
      }
    })
  }

  // Actualizar estadísticas del dashboard en tiempo real
  async updateDashboardStats() {
    try {
      // Obtener estadísticas actualizadas
      const stats = await this.getDashboardStats()
      
      // Enviar a todos los administradores
      this.broadcastToRole('admin', 'dashboard_stats_update', stats)
      
      console.log('📊 Estadísticas del dashboard actualizadas')
    } catch (error) {
      console.error('Error actualizando estadísticas del dashboard:', error)
    }
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats() {
    try {
      const [
        totalUsers,
        totalEvents,
        totalSales,
        totalRevenue,
        recentSales,
        activeEvents
      ] = await Promise.all([
        db.query('SELECT COUNT(*) as count FROM users WHERE status = $1', ['active']),
        db.query('SELECT COUNT(*) as count FROM events WHERE status = $1', ['active']),
        db.query('SELECT COUNT(*) as count FROM sales WHERE status = $1', ['completed']),
        db.query('SELECT COALESCE(SUM(total_amount), 0) as total FROM sales WHERE status = $1', ['completed']),
        db.query(`
          SELECT s.*, e.title as event_name, u.first_name, u.last_name 
          FROM sales s 
          LEFT JOIN events e ON s.event_id = e.id 
          LEFT JOIN users u ON s.user_id = u.id 
          WHERE s.status = $1 
          ORDER BY s.created_at DESC 
          LIMIT 10
        `, ['completed']),
        db.query(`
          SELECT e.*, 
                 COALESCE(SUM(s.quantity), 0) as sold_tickets,
                 e.total_capacity - COALESCE(SUM(s.quantity), 0) as remaining_tickets
          FROM events e 
          LEFT JOIN sales s ON e.id = s.event_id AND s.status = $1
          WHERE e.status = $2 
          GROUP BY e.id 
          ORDER BY e.date ASC 
          LIMIT 5
        `, ['completed', 'active'])
      ])

      return {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalEvents: parseInt(totalEvents.rows[0].count),
        totalSales: parseInt(totalSales.rows[0].count),
        totalRevenue: parseFloat(totalRevenue.rows[0].total),
        recentSales: recentSales.rows,
        activeEvents: activeEvents.rows
      }
    } catch (error) {
      console.error('Error obteniendo estadísticas del dashboard:', error)
      return null
    }
  }

  // Actualizar asientos de un evento
  async updateEventSeats(eventId) {
    try {
      const seatsQuery = `
        SELECT 
          s.id, s.row, s.number, s.section, s.status, s.price, s.type, s.category,
          s.is_wheelchair_accessible, s.has_extra_legroom, s.is_aisle_seat,
          s.is_window_seat, s.is_hearing_impaired, s.is_restricted_view,
          s.custom_price, s.label, s.display_label
        FROM seats s
        WHERE s.event_id = $1
        ORDER BY s.section, s.row, s.number
      `
      
      const seats = await db.query(seatsQuery, [eventId])
      
      // Enviar actualización a la sala del evento
      this.broadcastToRoom(`event_${eventId}`, 'seats_update', seats.rows)
      
      console.log(`🪑 Asientos del evento ${eventId} actualizados`)
    } catch (error) {
      console.error('Error actualizando asientos del evento:', error)
    }
  }

  // Actualizar ventas de un evento
  async updateEventSales(eventId) {
    try {
      const salesQuery = `
        SELECT 
          s.id, s.quantity, s.total_amount, s.status, s.created_at,
          u.first_name, u.last_name, u.email,
          tt.name as ticket_type
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN ticket_types tt ON s.ticket_type_id = tt.id
        WHERE s.event_id = $1
        ORDER BY s.created_at DESC
        LIMIT 20
      `
      
      const sales = await db.query(salesQuery, [eventId])
      
      // Enviar actualización a la sala del evento
      this.broadcastToRoom(`event_${eventId}`, 'sales_update', sales.rows)
      
      console.log(`💰 Ventas del evento ${eventId} actualizadas`)
    } catch (error) {
      console.error('Error actualizando ventas del evento:', error)
    }
  }

  // Notificar nueva venta
  async notifyNewSale(saleData) {
    try {
      // Actualizar estadísticas del dashboard
      await this.updateDashboardStats()
      
      // Actualizar asientos del evento
      if (saleData.event_id) {
        await this.updateEventSeats(saleData.event_id)
        await this.updateEventSales(saleData.event_id)
      }
      
      // Notificar a todos los administradores
      this.broadcastToRole('admin', 'new_sale', saleData)
      
      console.log(`🛒 Nueva venta notificada: ${saleData.id}`)
    } catch (error) {
      console.error('Error notificando nueva venta:', error)
    }
  }

  // Notificar cambio de estado de asiento
  async notifySeatStatusChange(eventId, seatId, newStatus, userId = null) {
    try {
      const seatQuery = `
        SELECT 
          s.id, s.row, s.number, s.section, s.status, s.price, s.type, s.category,
          s.is_wheelchair_accessible, s.has_extra_legroom, s.is_aisle_seat,
          s.is_window_seat, s.is_hearing_impaired, s.is_restricted_view,
          s.custom_price, s.label, s.display_label
        FROM seats s
        WHERE s.id = $1
      `
      
      const seat = await db.query(seatQuery, [seatId])
      
      if (seat.rows.length > 0) {
        // Enviar actualización a la sala del evento
        this.broadcastToRoom(`event_${eventId}`, 'seat_status_change', {
          seat: seat.rows[0],
          newStatus,
          userId,
          timestamp: new Date().toISOString()
        })
        
        console.log(`🪑 Estado del asiento ${seatId} cambiado a ${newStatus}`)
      }
    } catch (error) {
      console.error('Error notificando cambio de estado de asiento:', error)
    }
  }

  // Obtener estadísticas de conexiones
  getConnectionStats() {
    const stats = {
      totalClients: this.clients.size,
      totalRooms: this.rooms.size,
      clientsByRole: {},
      roomsInfo: {}
    }
    
    // Contar clientes por rol
    this.clients.forEach(client => {
      const role = client.role || 'guest'
      stats.clientsByRole[role] = (stats.clientsByRole[role] || 0) + 1
    })
    
    // Información de salas
    this.rooms.forEach((clients, roomId) => {
      stats.roomsInfo[roomId] = {
        clientCount: clients.size,
        clients: Array.from(clients)
      }
    })
    
    return stats
  }

  // Limpiar conexiones inactivas
  cleanupInactiveConnections() {
    const now = new Date()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutos
    
    this.clients.forEach((client, clientId) => {
      const timeSinceLastActivity = now - client.lastActivity
      
      if (timeSinceLastActivity > inactiveThreshold) {
        console.log(`🧹 Limpiando conexión inactiva: ${clientId}`)
        this.removeClient(clientId)
      }
    })
  }

  // Inicializar limpieza automática
  startCleanupInterval() {
    setInterval(() => {
      this.cleanupInactiveConnections()
    }, 5 * 60 * 1000) // Cada 5 minutos
  }
}

// Instancia singleton
const realTimeUpdatesService = new RealTimeUpdatesService()

module.exports = realTimeUpdatesService


