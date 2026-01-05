"use client"

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

export function SessionStatusIndicator() {
  const { isAuthenticated } = useAuth()
  const [isOnline, setIsOnline] = useState(true)
  const [sessionTime, setSessionTime] = useState(0)

  useEffect(() => {
    if (!isAuthenticated) return

    // Detectar estado de conexión
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Calcular tiempo de sesión
    const sessionStartTime = localStorage.getItem("session_start_time")
    if (sessionStartTime) {
      const updateSessionTime = () => {
        const elapsed = Date.now() - parseInt(sessionStartTime)
        setSessionTime(Math.floor(elapsed / 1000))
      }

      updateSessionTime()
      const interval = setInterval(updateSessionTime, 1000)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        clearInterval(interval)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) return null

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  return null
}
