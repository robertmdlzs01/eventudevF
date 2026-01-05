"use client"

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'

interface UseBrowserSessionOptions {
  tabTimeoutMinutes?: number
  onSessionInvalidated?: () => void
}

export function useBrowserSession({
  tabTimeoutMinutes = 5,
  onSessionInvalidated
}: UseBrowserSessionOptions = {}) {
  const { isAuthenticated, logout } = useAuth()
  const tabCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTabVisibleRef = useRef(true)
  const lastActivityRef = useRef(Date.now())

  const TAB_TIMEOUT_MS = tabTimeoutMinutes * 60 * 1000

  // Función para invalidar sesión en el backend
  const invalidateSession = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      if (!token) return

      // Usar sendBeacon para asegurar que la petición se envíe incluso si la página se cierra
      const data = JSON.stringify({ 
        action: 'invalidate_session',
        timestamp: Date.now()
      })
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/invalidate-session`,
          data
        )
      } else {
        // Fallback para navegadores que no soportan sendBeacon
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/auth/invalidate-session`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: data,
          keepalive: true
        }).catch(() => {
          // Ignorar errores ya que la página puede estar cerrando
        })
      }
    } catch (error) {
      console.error('Error invalidating session:', error)
    }
  }

  // Función para limpiar sesión local
  const clearLocalSession = () => {
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("session_start_time")
    localStorage.removeItem("last_activity")
    localStorage.removeItem("tab_closed_time")
  }

  // Manejar cierre de pestaña
  const handleTabClose = () => {
    if (!isAuthenticated) return
    
    // Marcar que la pestaña no está visible
    isTabVisibleRef.current = false
    
    // Guardar timestamp de cuando se cerró la pestaña
    localStorage.setItem("tab_closed_time", Date.now().toString())
    
    // Configurar timeout para invalidar sesión si no regresa
    tabCloseTimeoutRef.current = setTimeout(() => {
      invalidateSession()
      clearLocalSession()
      onSessionInvalidated?.()
    }, TAB_TIMEOUT_MS)
  }

  // Manejar regreso a la pestaña
  const handleTabReturn = () => {
    if (!isAuthenticated) return
    
    // Limpiar timeout si existe
    if (tabCloseTimeoutRef.current) {
      clearTimeout(tabCloseTimeoutRef.current)
      tabCloseTimeoutRef.current = null
    }
    
    // Verificar si la pestaña estuvo cerrada por más de 5 minutos
    const tabClosedTime = localStorage.getItem("tab_closed_time")
    if (tabClosedTime) {
      const timeClosed = Date.now() - parseInt(tabClosedTime)
      if (timeClosed > TAB_TIMEOUT_MS) {
        // La pestaña estuvo cerrada por más de 5 minutos, invalidar sesión
        invalidateSession()
        clearLocalSession()
        onSessionInvalidated?.()
        return
      }
    }
    
    // Marcar que la pestaña está visible
    isTabVisibleRef.current = true
    lastActivityRef.current = Date.now()
    
    // Limpiar timestamp de cierre de pestaña
    localStorage.removeItem("tab_closed_time")
  }

  // Manejar cierre del navegador
  const handleBrowserClose = () => {
    if (!isAuthenticated) return
    
    // Invalidar sesión inmediatamente
    invalidateSession()
    clearLocalSession()
  }

  // Detectar actividad del usuario
  const handleActivity = () => {
    if (!isAuthenticated || !isTabVisibleRef.current) return
    
    lastActivityRef.current = Date.now()
    localStorage.setItem("last_activity", Date.now().toString())
  }

  useEffect(() => {
    if (!isAuthenticated) return

    // Marcar tiempo de inicio de sesión
    const sessionStartTime = Date.now()
    localStorage.setItem("session_start_time", sessionStartTime.toString())
    localStorage.setItem("last_activity", sessionStartTime.toString())

    // Eventos para detectar cierre de pestaña
    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleTabClose()
      } else {
        handleTabReturn()
      }
    }

    // Eventos para detectar cierre del navegador
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      handleBrowserClose()
      
      // Mostrar mensaje de confirmación (opcional)
      // event.preventDefault()
      // event.returnValue = '¿Estás seguro de que quieres cerrar la página?'
    }

    // Eventos para detectar actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    // Agregar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('unload', handleBrowserClose)
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Verificar si la sesión ya expiró al cargar
    const checkSessionValidity = () => {
      const lastActivity = localStorage.getItem("last_activity")
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
        if (timeSinceLastActivity > TAB_TIMEOUT_MS) {
          // Sesión expiró mientras la pestaña estaba cerrada
          invalidateSession()
          clearLocalSession()
          logout()
          onSessionInvalidated?.()
        }
      }
    }

    // Verificar al cargar si la pestaña estaba cerrada
    if (document.hidden) {
      checkSessionValidity()
    }

    return () => {
      // Limpiar event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('unload', handleBrowserClose)
      
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true)
      })

      // Limpiar timeout si existe
      if (tabCloseTimeoutRef.current) {
        clearTimeout(tabCloseTimeoutRef.current)
      }
    }
  }, [isAuthenticated])

  return {
    isTabVisible: isTabVisibleRef.current,
    lastActivity: lastActivityRef.current
  }
}
