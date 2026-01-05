'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { Loader2, ShoppingCart } from 'lucide-react'

interface CheckoutRedirectProps {
  children: React.ReactNode
}

export function CheckoutRedirect({ children }: CheckoutRedirectProps) {
  const { isAuthenticated, isLoading } = useAuthSimple()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      // Verificar si hay carrito persistido después del login
      const persistedCart = cartPersistenceService.getPersistedCart()
      const needsRecovery = localStorage.getItem("cart_recovery_needed") === "true"
      const justLoggedIn = localStorage.getItem("just_logged_in") === "true"
      
      console.log('🔍 [CheckoutRedirect] Verificando flujo de confirmación:', { 
        hasPersistedCart: !!persistedCart, 
        needsRecovery,
        justLoggedIn,
        isAuthenticated
      })
      
      // TODOS los usuarios autenticados deben pasar por confirmación
      // Esto incluye tanto carrito persistido como carrito normal
      if (justLoggedIn) {
        console.log('🛒 [CheckoutRedirect] Usuario acaba de hacer login, redirigiendo a confirmación')
        // Limpiar la bandera de login reciente
        localStorage.removeItem("just_logged_in")
        router.push('/carrito/confirmar')
        return
      }
    }

    setIsChecking(false)
  }, [isAuthenticated, isLoading, router])

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {isLoading ? 'Verificando autenticación...' : 'Verificando carrito...'}
          </h1>
          <p className="text-gray-600">
            {isLoading ? 'Por favor espera...' : 'Revisando si tienes items guardados'}
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
