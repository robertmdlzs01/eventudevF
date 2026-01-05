"use client"

import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { SessionTimeoutWarning } from './session-timeout-warning'
import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'

interface SessionTimeoutProviderProps {
  children: React.ReactNode
}

export function SessionTimeoutProvider({ children }: SessionTimeoutProviderProps) {
  const [showWarning, setShowWarning] = useState(false)
  const { logout } = useAuth()
  
  const { updateLastActivity, getMinutesSinceLastActivity } = useSessionTimeout({
    timeoutMinutes: 15,
    onTimeout: () => {
      console.log('🕐 Sesión expirada por inactividad')
      setShowWarning(false)
      
      // Limpiar localStorage
      localStorage.removeItem("eventu_authenticated")
      localStorage.removeItem("auth_token")
      localStorage.removeItem("current_user")
      localStorage.removeItem("eventu_user_id")
      localStorage.removeItem("userRole")
      localStorage.removeItem("redirectUrl")
      localStorage.removeItem("welcomeMessage")
      localStorage.removeItem('last_token_verification')
      localStorage.removeItem("eventu_cart")
      localStorage.removeItem("eventu_cart_user_id")
      localStorage.removeItem("last_activity")
      
      // Ejecutar logout para actualizar el estado
      logout()
      
      // Notificar a todos los componentes que la sesión ha expirado
      window.dispatchEvent(new Event("authStateChanged"))
      window.dispatchEvent(new Event("sessionExpired"))
      
      // Redirigir al login después de un breve delay
      setTimeout(() => {
        window.location.href = '/login?reason=timeout'
      }, 1000)
    }
  })

  // Escuchar eventos de advertencia de sesión del backend
  useEffect(() => {
    const handleSessionWarning = (event: CustomEvent) => {
      const remainingMinutes = event.detail?.remainingMinutes || 2
      setShowWarning(true)
      
      // Disparar evento personalizado para el componente de advertencia
      window.dispatchEvent(new CustomEvent('sessionWarning', {
        detail: {
          message: `Tu sesión expirará en ${remainingMinutes} minutos`,
          remainingMinutes
        }
      }))
    }

    window.addEventListener('sessionWarning', handleSessionWarning as EventListener)
    
    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning as EventListener)
    }
  }, [])

  const handleExtendSession = () => {
    updateLastActivity()
    setShowWarning(false)
  }

  const handleCloseWarning = () => {
    setShowWarning(false)
  }

  return (
    <>
      {children}
      {showWarning && <SessionTimeoutWarning />}
    </>
  )
}
