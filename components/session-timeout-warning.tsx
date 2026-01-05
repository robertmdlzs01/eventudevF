"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'

interface SessionWarning {
  message: string
  remainingMinutes: number
}

export function SessionTimeoutWarning() {
  const [warning, setWarning] = useState<SessionWarning | null>(null)
  const [countdown, setCountdown] = useState<number>(0)
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) return

    const handleSessionWarning = (event: CustomEvent<SessionWarning>) => {
      setWarning(event.detail)
      setCountdown(event.detail.remainingMinutes * 60) // Convertir a segundos
    }

    // Escuchar eventos de advertencia de sesión
    window.addEventListener('sessionWarning', handleSessionWarning as EventListener)

    return () => {
      window.removeEventListener('sessionWarning', handleSessionWarning as EventListener)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!warning || countdown <= 0) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setWarning(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [warning, countdown])

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleExtendSession = () => {
    // Simular actividad del usuario para extender la sesión
    window.dispatchEvent(new Event('mousedown'))
    window.dispatchEvent(new Event('keypress'))
    setWarning(null)
    setCountdown(0)
  }

  if (!warning || !isAuthenticated) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Sesión por expirar</p>
              <p className="text-sm mt-1">
                Tu sesión expirará en{' '}
                <span className="font-mono font-bold text-orange-900">
                  {formatTime(countdown)}
                </span>
              </p>
              <p className="text-xs mt-1 text-orange-700">
                Haz clic en "Extender sesión" para continuar
              </p>
            </div>
            <div className="ml-4 flex flex-col gap-2">
              <Button
                size="sm"
                onClick={handleExtendSession}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                Extender sesión
              </Button>
              <div className="flex items-center gap-1 text-xs text-orange-600">
                <Clock className="h-3 w-3" />
                <span>{formatTime(countdown)}</span>
              </div>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}