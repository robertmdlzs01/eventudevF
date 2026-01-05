'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { Loader2, ShoppingCart, CheckCircle } from 'lucide-react'

interface SmartRedirectProps {
  children: React.ReactNode
}

export function SmartRedirect({ children }: SmartRedirectProps) {
  const { isAuthenticated, isLoading } = useAuthSimple()
  const router = useRouter()
  const pathname = usePathname()
  const [isChecking, setIsChecking] = useState(true)
  const [hasPersistedCart, setHasPersistedCart] = useState(false)

  useEffect(() => {
    if (isLoading) return

    if (isAuthenticated) {
      // Solo redirigir si hay carrito persistido Y el usuario acaba de hacer login
      // Y no estamos ya en la página de confirmación
      const persistedCart = cartPersistenceService.getPersistedCart()
      const needsRecovery = localStorage.getItem("cart_recovery_needed") === "true"
      const justLoggedIn = localStorage.getItem("just_logged_in") === "true"
      
      console.log('🔍 [SmartRedirect] Verificando carrito persistido:', { 
        hasPersistedCart: !!persistedCart, 
        needsRecovery,
        justLoggedIn,
        isAuthenticated,
        currentPath: pathname
      })
      
      // Solo redirigir si:
      // 1. Hay carrito persistido
      // 2. El usuario acaba de hacer login
      // 3. No estamos ya en la página de confirmación
      if ((persistedCart || needsRecovery) && justLoggedIn && pathname !== '/carrito/confirmar') {
        console.log('🛒 [SmartRedirect] Carrito persistido detectado después de login, redirigiendo a confirmación')
        setHasPersistedCart(true)
        // Limpiar la bandera de login reciente
        localStorage.removeItem("just_logged_in")
        router.push('/carrito/confirmar')
        return
      }
    }

    setIsChecking(false)
  }, [isAuthenticated, isLoading, router, pathname])

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

  if (hasPersistedCart) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Redirigiendo...</h1>
          <p className="text-gray-600">Te llevamos a confirmar tu carrito</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
