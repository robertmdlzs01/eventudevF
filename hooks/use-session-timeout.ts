import { useEffect, useRef } from 'react'

interface SessionTimeoutOptions {
  timeoutMinutes?: number
  onTimeout?: () => void
  updateActivityOnEvents?: boolean
}

export function useSessionTimeout({
  timeoutMinutes = 15,
  onTimeout,
  updateActivityOnEvents = true
}: SessionTimeoutOptions = {}) {
  const lastActivityRef = useRef<number>(Date.now())
  const timeoutRef = useRef<NodeJS.Timeout>()

  const updateLastActivity = () => {
    lastActivityRef.current = Date.now()
    
    // Actualizar el timestamp en el token si existe
    const token = localStorage.getItem("auth_token")
    if (token) {
      try {
        // Decodificar el token JWT (solo para obtener la información, no para validar)
        const payload = JSON.parse(atob(token.split('.')[1]))
        if (payload.lastActivity) {
          // Actualizar el timestamp de actividad en localStorage
          localStorage.setItem("last_activity", Date.now().toString())
        }
      } catch (error) {
        console.warn('Error updating activity timestamp:', error)
      }
    }
  }

  const checkSessionTimeout = () => {
    const now = Date.now()
    const timeSinceLastActivity = now - lastActivityRef.current
    const timeoutMs = timeoutMinutes * 60 * 1000
    const warningMs = (timeoutMinutes - 2) * 60 * 1000 // 2 minutos antes del timeout

    // Mostrar advertencia si está cerca del timeout
    if (timeSinceLastActivity > warningMs && timeSinceLastActivity < timeoutMs) {
      const remainingMinutes = Math.ceil((timeoutMs - timeSinceLastActivity) / 1000 / 60)
      
      // Disparar evento de advertencia
      window.dispatchEvent(new CustomEvent('sessionWarning', {
        detail: {
          message: `Tu sesión expirará en ${remainingMinutes} minutos`,
          remainingMinutes
        }
      }))
    }

    if (timeSinceLastActivity > timeoutMs) {
      console.log(`Session timeout: ${Math.round(timeSinceLastActivity / 1000 / 60)} minutes of inactivity`)
      if (onTimeout) {
        onTimeout()
      }
    }
  }

  useEffect(() => {
    // Cargar última actividad desde localStorage
    const savedActivity = localStorage.getItem("last_activity")
    if (savedActivity) {
      lastActivityRef.current = parseInt(savedActivity)
    }

    if (updateActivityOnEvents) {
      // Eventos que indican actividad del usuario
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
      
      const handleActivity = () => {
        updateLastActivity()
      }

      // Agregar listeners de eventos
      events.forEach(event => {
        document.addEventListener(event, handleActivity, true)
      })

      // Configurar verificación periódica cada minuto
      timeoutRef.current = setInterval(checkSessionTimeout, 60000)

      return () => {
        // Limpiar listeners
        events.forEach(event => {
          document.removeEventListener(event, handleActivity, true)
        })
        
        if (timeoutRef.current) {
          clearInterval(timeoutRef.current)
        }
      }
    }
  }, [timeoutMinutes, updateActivityOnEvents, onTimeout])

  return {
    updateLastActivity,
    getTimeSinceLastActivity: () => Date.now() - lastActivityRef.current,
    getMinutesSinceLastActivity: () => Math.round((Date.now() - lastActivityRef.current) / 1000 / 60)
  }
}