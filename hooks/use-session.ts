'use client'

import { useState, useEffect } from 'react'

export function useSession() {
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    // Obtener o crear sessionId
    let currentSessionId = sessionStorage.getItem('cart-session-id')
    
    if (!currentSessionId) {
      // Crear nuevo sessionId
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('cart-session-id', currentSessionId)
    }
    
    setSessionId(currentSessionId)
  }, [])

  return sessionId
}
