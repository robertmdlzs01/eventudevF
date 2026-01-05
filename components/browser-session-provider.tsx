"use client"

import { useBrowserSession } from '@/hooks/use-browser-session'
import { useSessionTimeout } from '@/hooks/use-session-timeout'
import { SessionTimeoutWarning } from './session-timeout-warning'
import { SessionStatusIndicator } from './session-status-indicator'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

interface BrowserSessionProviderProps {
  children: React.ReactNode
}

export function BrowserSessionProvider({ children }: BrowserSessionProviderProps) {
  const [showWarning, setShowWarning] = useState(false)
  const router = useRouter()
  
  // Hook para manejar cierre de navegador y pestañas
  useBrowserSession({
    tabTimeoutMinutes: 5,
    onSessionInvalidated: () => {
      toast({
        title: "Sesión cerrada",
        description: "Tu sesión ha sido cerrada por seguridad.",
        variant: "destructive"
      })
      router.push('/login?reason=session_closed')
    }
  })

  // Hook para manejar timeout de inactividad
  const { updateLastActivity, getMinutesSinceLastActivity } = useSessionTimeout({
    timeoutMinutes: 15,
    onTimeout: () => {
      setShowWarning(false)
    }
  })

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
      <SessionStatusIndicator />
    </>
  )
}
