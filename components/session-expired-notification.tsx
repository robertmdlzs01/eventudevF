"use client"

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, LogIn } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function SessionExpiredNotification() {
  const [showNotification, setShowNotification] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const handleSessionExpired = () => {
      setShowNotification(true)
      
      // Auto-ocultar después de 5 segundos
      setTimeout(() => {
        setShowNotification(false)
      }, 5000)
    }

    window.addEventListener('sessionExpired', handleSessionExpired)
    
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired)
    }
  }, [])

  const handleGoToLogin = () => {
    setShowNotification(false)
    router.push('/login?reason=timeout')
  }

  if (!showNotification) return null

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-md w-full mx-4">
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium">Sesión expirada</p>
              <p className="text-sm mt-1">
                Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.
              </p>
            </div>
            <div className="ml-4">
              <Button
                size="sm"
                onClick={handleGoToLogin}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Iniciar sesión
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

