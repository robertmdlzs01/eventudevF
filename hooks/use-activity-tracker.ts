"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'

interface ActivityTrackerOptions {
  interval?: number // Intervalo en milisegundos para actualizar actividad
  events?: string[] // Eventos del DOM a escuchar
}

export function useActivityTracker(options: ActivityTrackerOptions = {}) {
  const { isAuthenticated, token } = useAuth()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  
  const {
    interval = 2 * 60 * 1000, // 2 minutos por defecto (más frecuente para detectar advertencias)
    events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
  } = options

  const updateActivity = async () => {
    if (!isAuthenticated || !token) return

    try {
      const response = await fetch('http://localhost:3002/api/auth/verify-token', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const newToken = response.headers.get('X-New-Token')
        if (newToken && typeof window !== "undefined") {
          localStorage.setItem("auth_token", newToken)
        }
      }
    } catch (error) {
      console.warn('Error updating activity:', error)
    }
  }

  const handleUserActivity = () => {
    lastActivityRef.current = Date.now()
  }

  useEffect(() => {
    if (!isAuthenticated) return

    // Configurar intervalo para actualizar actividad
    intervalRef.current = setInterval(() => {
      const now = Date.now()
      const timeSinceLastActivity = now - lastActivityRef.current
      
      // Solo actualizar si ha habido actividad en los últimos 15 minutos
      if (timeSinceLastActivity < 15 * 60 * 1000) {
        updateActivity()
      }
    }, interval)

    // Escuchar eventos de actividad del usuario
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true })
    })

    // Actualizar actividad inicial
    updateActivity()

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity)
      })
    }
  }, [isAuthenticated, token, interval])

  return {
    updateActivity,
    lastActivity: lastActivityRef.current
  }
}
