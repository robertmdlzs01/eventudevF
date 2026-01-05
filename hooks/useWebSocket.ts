import { useEffect, useState, useCallback } from 'react'

interface WebSocketMessage {
  type: string
  data: any
}

interface UseWebSocketOptions {
  url?: string
  onMessage?: (message: WebSocketMessage) => void
  onError?: (error: Event) => void
  onOpen?: () => void
  onClose?: () => void
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const [socket, setSocket] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) return

    const wsUrl = options.url || 'ws://localhost:3001'
    const ws = new WebSocket(wsUrl)

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
      options.onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        options.onMessage?.(message)
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }

    ws.onerror = (error) => {
      setError('WebSocket connection error')
      options.onError?.(error)
    }

    ws.onclose = () => {
      setIsConnected(false)
      options.onClose?.()
    }

    setSocket(ws)
  }, [options, socket])

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close()
      setSocket(null)
      setIsConnected(false)
    }
  }, [socket])

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message))
    }
  }, [socket])

  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket,
    connect,
    disconnect,
    sendMessage,
    isConnected,
    error
  }
}

// Hook específico para admin
export function useAdminWebSocket(token?: string | null) {
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [connectedAdmins, setConnectedAdmins] = useState<any[]>([])
  const [adminChanges, setAdminChanges] = useState<any[]>([])

  const { socket, connect, disconnect, sendMessage, isConnected, error } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001',
    onMessage: (message) => {
      console.log('Admin WebSocket message:', message)
      
      switch (message.type) {
        case 'dashboard_update':
          setDashboardData(message.data)
          break
        case 'admin_connected':
          setConnectedAdmins(prev => [...prev, message.data])
          break
        case 'admin_change':
          setAdminChanges(prev => [...prev, message.data])
          break
      }
    }
  })

  const refreshDashboard = useCallback(() => {
    if (socket?.readyState === WebSocket.OPEN) {
      sendMessage({ type: 'request_dashboard', data: { token } })
    }
  }, [socket, sendMessage, token])

  const requestDashboardUpdate = useCallback(() => {
    refreshDashboard()
  }, [refreshDashboard])

  return {
    socket,
    connect,
    disconnect,
    sendMessage,
    isConnected: isConnected,
    connected: isConnected, // Alias para compatibilidad
    error,
    dashboardData,
    connectedAdmins,
    adminChanges,
    refreshDashboard,
    requestDashboardUpdate
  }
}
