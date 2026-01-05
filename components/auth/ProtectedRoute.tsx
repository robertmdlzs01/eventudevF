'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { useCart } from '@/hooks/use-cart'

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireAuth?: boolean
  saveCartOnRedirect?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = '/login', 
  requireAuth = true,
  saveCartOnRedirect = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthSimple()
  const { cart } = useCart()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // No hacer nada mientras está cargando
    if (isLoading) return

    // Si no requiere autenticación, mostrar contenido
    if (!requireAuth) return

    // Si está autenticado, mostrar contenido
    if (isAuthenticated) return

    // Si llegamos aquí, no está autenticado y requiere autenticación
    console.log('🔐 [ProtectedRoute] Usuario no autenticado, redirigiendo...')
    setIsRedirecting(true)

    // Si hay carrito y se debe guardar, guardarlo antes de redirigir
    if (saveCartOnRedirect && cart && cart.items.length > 0) {
      console.log('🛒 [ProtectedRoute] Guardando carrito antes de redirigir...')
      cartPersistenceService.saveCartBeforeLogin(cart, cart.sessionId)
    }

    // Redirigir con parámetros apropiados
    const currentPath = window.location.pathname
    const redirectUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}&message=${encodeURIComponent('Para acceder a esta página, inicia sesión o regístrate')}`
    
    router.push(redirectUrl)
  }, [isAuthenticated, isLoading, requireAuth, router, redirectTo, cart, saveCartOnRedirect])

  // Mostrar loading mientras se verifica la autenticación
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Verificando acceso...</h1>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje de redirección si no está autenticado
  if (requireAuth && !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Redirigiendo...</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para acceder a esta página</p>
        </div>
      </div>
    )
  }

  // Si está autenticado o no requiere autenticación, mostrar contenido
  return <>{children}</>
}