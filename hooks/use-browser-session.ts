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

  // Manejar cierre del navegador (solo cuando realmente se cierra, no en recarga)
  const handleBrowserClose = (event: BeforeUnloadEvent) => {
    if (!isAuthenticated) return
    
    // NO limpiar sesión en recarga - solo marcar para verificación posterior
    // El evento beforeunload se dispara tanto en recarga como en cierre
    // Usamos visibilitychange para detectar cierre real de pestaña
    // Solo invalidar si realmente se está cerrando el navegador (no recarga)
    const navigationType = (window.performance?.getEntriesByType('navigation')[0] as PerformanceNavigationTiming)?.type
    if (navigationType === 'reload') {
      // Es una recarga, no limpiar sesión
      return
    }
    
    // Solo invalidar si la pestaña estuvo oculta por más tiempo
    const tabClosedTime = localStorage.getItem("tab_closed_time")
    if (tabClosedTime) {
      const timeClosed = Date.now() - parseInt(tabClosedTime)
      if (timeClosed > TAB_TIMEOUT_MS) {
        // La pestaña estuvo cerrada por más del timeout, invalidar
        invalidateSession()
        clearLocalSession()
      }
    }
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
    // NOTA: beforeunload y unload se disparan también en recarga (F5)
    // Por eso NO limpiamos la sesión aquí, solo usamos visibilitychange
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      // NO limpiar sesión aquí - puede ser una recarga
      // Solo marcar timestamp para verificación posterior
      if (document.hidden) {
        localStorage.setItem("tab_closed_time", Date.now().toString())
      }
    }

    // Eventos para detectar actividad
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    
    // Agregar event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    // NO agregar beforeunload/unload porque se disparan en recarga
    // window.addEventListener('beforeunload', handleBeforeUnload)
    // window.addEventListener('unload', handleBrowserClose)
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true)
    })

    // Verificar si la sesión ya expiró al cargar
    // SOLO verificar si realmente la pestaña estuvo cerrada por mucho tiempo
    const checkSessionValidity = () => {
      const lastActivity = localStorage.getItem("last_activity")
      const tabClosedTime = localStorage.getItem("tab_closed_time")
      
      // Solo verificar si hay evidencia de que la pestaña estuvo cerrada
      if (tabClosedTime && lastActivity) {
        const timeSinceTabClosed = Date.now() - parseInt(tabClosedTime)
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity)
        
        // Solo invalidar si:
        // 1. La pestaña estuvo cerrada por más del timeout
        // 2. Y la última actividad fue antes de cerrar la pestaña
        if (timeSinceTabClosed > TAB_TIMEOUT_MS && timeSinceLastActivity > TAB_TIMEOUT_MS) {
          console.log('⏰ [useBrowserSession] Sesión expirada por inactividad prolongada')
          invalidateSession()
          clearLocalSession()
          logout()
          onSessionInvalidated?.()
        } else {
          // Si no expiró, actualizar la última actividad al momento actual
          // Esto previene que se cierre la sesión en recargas normales
          localStorage.setItem("last_activity", Date.now().toString())
        }
      } else {
        // Si no hay evidencia de cierre de pestaña, actualizar actividad
        // Esto es importante para recargas normales
        localStorage.setItem("last_activity", Date.now().toString())
      }
    }

    // Verificar al cargar solo si la pestaña estaba oculta
    // Pero NO invalidar inmediatamente - dar oportunidad de recuperar
    if (document.hidden) {
      // Esperar un momento antes de verificar para dar tiempo a que la página cargue
      setTimeout(() => {
        checkSessionValidity()
      }, 1000)
    } else {
      // Si la pestaña está visible, actualizar actividad inmediatamente
      // Esto previene que se cierre la sesión en recargas
      localStorage.setItem("last_activity", Date.now().toString())
    }

    return () => {
      // Limpiar event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // NO remover beforeunload/unload porque no los agregamos
      // window.removeEventListener('beforeunload', handleBeforeUnload)
      // window.removeEventListener('unload', handleBrowserClose)
      
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
