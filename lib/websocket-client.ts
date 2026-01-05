"use client"

import { io, Socket } from 'socket.io-client'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  target: 'all' | 'admins' | 'organizers' | 'users' | 'specific'
  recipients?: string[]
  sentAt: string
  readBy: string[]
  status: 'sent' | 'delivered' | 'failed'
}

interface RealtimeUpdate {
  type: string
  data: any
  timestamp: string
}

interface SeatMapUpdate {
  eventId: string
  updates: Array<{
    seatId: string
    status: 'available' | 'reserved' | 'occupied'
    userId?: string
    timestamp: string
  }>
}

class WebSocketClient {
  private socket: Socket | null = null
  private isConnected = false
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    // Escuchar eventos de autenticación
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'auth_token') {
          if (e.newValue) {
            this.connect()
          } else {
            this.disconnect()
          }
        }
      })
    }
  }

  connect(eventId?: string) {
    if (this.socket?.connected) {
      return
    }

    const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
    
    if (!authToken) {
      console.warn('No authentication token available for WebSocket connection')
      return
    }

    try {
      this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3002', {
        auth: {
          token: authToken
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.reconnectDelay
      })

      this.setupSocketEventHandlers()
      
      // Unirse a la sala del evento si se proporciona
      if (eventId) {
        this.socket.emit('joinEvent', eventId)
      }
    } catch (error) {
      console.error('WebSocket connection error:', error)
    }
  }

  private setupSocketEventHandlers() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log('WebSocket connected')
      this.isConnected = true
      this.reconnectAttempts = 0
    })

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason)
      this.isConnected = false
    })

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error)
      this.reconnectAttempts++
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached')
      }
    })

    this.socket.on('newNotification', (notification: Notification) => {
      this.handleNewNotification(notification)
    })

    this.socket.on('unreadNotifications', (notifications: Notification[]) => {
      this.handleUnreadNotifications(notifications)
    })

    this.socket.on('realtimeUpdate', (update: RealtimeUpdate) => {
      this.handleRealtimeUpdate(update)
    })

    this.socket.on('seatUpdate', (update: SeatMapUpdate) => {
      this.handleSeatUpdate(update)
    })
  }

  private handleNewNotification(notification: Notification) {
    // Emitir evento personalizado para que los componentes puedan escuchar
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('newNotification', { detail: notification })
      window.dispatchEvent(event)
    }

    // Mostrar notificación toast
    this.showNotificationToast(notification)
  }

  private handleUnreadNotifications(notifications: Notification[]) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('unreadNotifications', { detail: notifications })
      window.dispatchEvent(event)
    }
  }

  private handleRealtimeUpdate(update: RealtimeUpdate) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('realtimeUpdate', { detail: update })
      window.dispatchEvent(event)
    }
  }

  private handleSeatUpdate(update: SeatMapUpdate) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('seatUpdate', { detail: update })
      window.dispatchEvent(event)
    }
  }

  private showNotificationToast(notification: Notification) {
    // Importar dinámicamente para evitar errores de SSR
    if (typeof window !== 'undefined') {
      import('@/hooks/use-toast').then(({ toast }) => {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'error' ? 'destructive' : 'default'
        })
      }).catch(() => {
        // Fallback: mostrar notificación nativa del navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico'
          })
        }
      })
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.isConnected = false
    }
  }

  markNotificationAsRead(notificationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('markNotificationRead', notificationId)
    }
  }

  markAllNotificationsAsRead() {
    if (this.socket?.connected) {
      this.socket.emit('markAllNotificationsRead')
    }
  }

  // Funciones para reserva de asientos
  reserveSeats(seatIds: string[], userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('reserveSeats', { seatIds, userId })
    }
  }

  releaseSeats(seatIds: string[], userId: string) {
    if (this.socket?.connected) {
      this.socket.emit('releaseSeats', { seatIds, userId })
    }
  }

  occupySeats(seatIds: string[], userId: string, transactionId: string) {
    if (this.socket?.connected) {
      this.socket.emit('occupySeats', { seatIds, userId, transactionId })
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true
  }

  // Métodos para escuchar eventos
  onNewNotification(callback: (notification: Notification) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('newNotification', (e: any) => {
        callback(e.detail)
      })
    }
  }

  onUnreadNotifications(callback: (notifications: Notification[]) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('unreadNotifications', (e: any) => {
        callback(e.detail)
      })
    }
  }

  onRealtimeUpdate(callback: (update: RealtimeUpdate) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('realtimeUpdate', (e: any) => {
        callback(e.detail)
      })
    }
  }

  onSeatUpdate(callback: (update: SeatMapUpdate) => void) {
    if (typeof window !== 'undefined') {
      window.addEventListener('seatUpdate', (e: any) => {
        callback(e.detail)
      })
    }
  }

  // Métodos para remover listeners
  offNewNotification(callback: (notification: Notification) => void) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('newNotification', (e: any) => {
        callback(e.detail)
      })
    }
  }

  offUnreadNotifications(callback: (notifications: Notification[]) => void) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('unreadNotifications', (e: any) => {
        callback(e.detail)
      })
    }
  }

  offRealtimeUpdate(callback: (update: RealtimeUpdate) => void) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('realtimeUpdate', (e: any) => {
        callback(e.detail)
      })
    }
  }

  offSeatUpdate(callback: (update: SeatMapUpdate) => void) {
    if (typeof window !== 'undefined') {
      window.removeEventListener('seatUpdate', (e: any) => {
        callback(e.detail)
      })
    }
  }
}

// Exportar singleton
export const wsClient = new WebSocketClient()

// Hook para usar WebSocket en componentes React
export const useWebSocket = () => {
  return {
    connect: (eventId?: string) => wsClient.connect(eventId),
    disconnect: () => wsClient.disconnect(),
    isConnected: () => wsClient.isConnectedToServer(),
    markNotificationAsRead: (id: string) => wsClient.markNotificationAsRead(id),
    markAllNotificationsAsRead: () => wsClient.markAllNotificationsAsRead(),
    reserveSeats: (seatIds: string[], userId: string) => wsClient.reserveSeats(seatIds, userId),
    releaseSeats: (seatIds: string[], userId: string) => wsClient.releaseSeats(seatIds, userId),
    occupySeats: (seatIds: string[], userId: string, transactionId: string) => wsClient.occupySeats(seatIds, userId, transactionId),
    onNewNotification: (callback: (notification: Notification) => void) => wsClient.onNewNotification(callback),
    onUnreadNotifications: (callback: (notifications: Notification[]) => void) => wsClient.onUnreadNotifications(callback),
    onRealtimeUpdate: (callback: (update: RealtimeUpdate) => void) => wsClient.onRealtimeUpdate(callback),
    onSeatUpdate: (callback: (update: SeatMapUpdate) => void) => wsClient.onSeatUpdate(callback),
    offNewNotification: (callback: (notification: Notification) => void) => wsClient.offNewNotification(callback),
    offUnreadNotifications: (callback: (notifications: Notification[]) => void) => wsClient.offUnreadNotifications(callback),
    offRealtimeUpdate: (callback: (update: RealtimeUpdate) => void) => wsClient.offRealtimeUpdate(callback),
    offSeatUpdate: (callback: (update: SeatMapUpdate) => void) => wsClient.offSeatUpdate(callback)
  }
}

// Función para obtener el cliente WebSocket
export const getWebSocketClient = () => wsClient

// Exportar tipos
export type { SeatMapUpdate, Notification, RealtimeUpdate }
