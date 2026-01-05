"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { useCart } from '@/hooks/use-cart'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, ShoppingCart, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function CartConfirmationPage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuthSimple()
  const { cart, restoreFromPersistence } = useCart()
  const router = useRouter()
  const [isRestoring, setIsRestoring] = useState(false)
  const [restorationStatus, setRestorationStatus] = useState<'idle' | 'success' | 'error' | 'no_cart'>('idle')

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkForCartRecovery()
    }
  }, [authLoading, isAuthenticated])

  const checkForCartRecovery = async () => {
    const needsRecovery = localStorage.getItem("cart_recovery_needed") === "true"
    
    if (needsRecovery) {
      setIsRestoring(true)
      
      try {
        const persistedCart = cartPersistenceService.getPersistedCart()
        
        if (persistedCart && persistedCart.cartData) {
          // Restaurar el carrito desde la persistencia
          const success = await restoreFromPersistence(persistedCart.cartData)
          
          if (success) {
            setRestorationStatus('success')
            // Limpiar la persistencia después de restaurar
            cartPersistenceService.clearPersistedCart()
            localStorage.removeItem("cart_recovery_needed")
          } else {
            setRestorationStatus('error')
          }
        } else {
          setRestorationStatus('no_cart')
        }
      } catch (error) {
        console.error('Error restaurando carrito:', error)
        setRestorationStatus('error')
      } finally {
        setIsRestoring(false)
      }
    } else {
      setRestorationStatus('no_cart')
    }
  }

  const handleProceedToCheckout = () => {
    if (cart && cart.items.length > 0) {
      router.push('/checkout')
    }
  }

  const handleBackToCart = () => {
    router.push('/carrito')
  }

  if (authLoading || isRestoring) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">
            {authLoading ? 'Verificando autenticación...' : 'Restaurando tu carrito...'}
          </h1>
          <p className="text-gray-600">
            {authLoading ? 'Por favor espera...' : 'Recuperando los items que tenías guardados'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/carrito">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Carrito
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold">Confirmar Carrito</h1>
                <p className="text-sm text-gray-500">Revisa los items antes de proceder al pago</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Estado de restauración */}
          {restorationStatus === 'success' && (
            <Card className="mb-6 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">¡Carrito restaurado exitosamente!</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  Hemos recuperado los items que tenías en tu carrito antes de iniciar sesión.
                </p>
              </CardContent>
            </Card>
          )}

          {restorationStatus === 'error' && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Error restaurando carrito</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  No pudimos recuperar tu carrito anterior. Puedes agregar items nuevamente.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Contenido principal */}
          {cart && cart.items.length > 0 ? (
            <div className="space-y-6">
              {/* Resumen del carrito */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumen de tu Carrito
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Items del carrito */}
                    <div className="space-y-3">
                      {cart.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium">{item.eventName || item.productName}</h3>
                            <p className="text-sm text-gray-600">{item.ticketType || item.productType}</p>
                            {item.seatNumber && (
                              <p className="text-xs text-gray-500">Asiento: {item.seatNumber}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{item.quantity} x {formatCurrency(item.price)}</p>
                            <p className="text-sm text-gray-600">
                              Total: {formatCurrency(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    {/* Totales */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(cart.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Servicio (5%):</span>
                        <span>{formatCurrency(Math.round(cart.total * 0.05))}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatCurrency(cart.total + Math.round(cart.total * 0.05))}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Información del usuario */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de Facturación</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nombre</label>
                      <p className="text-sm">{user?.first_name || user?.name} {user?.last_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm">{user?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Teléfono</label>
                      <p className="text-sm">{user?.phone || 'No especificado'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Estado</label>
                      <Badge variant="default">Verificado</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Acciones */}
              <div className="flex gap-4">
                <Button onClick={handleBackToCart} variant="outline" className="flex-1">
                  Modificar Carrito
                </Button>
                <Button onClick={handleProceedToCheckout} className="flex-1">
                  Proceder al Pago
                </Button>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Carrito Vacío</h3>
                <p className="text-gray-600 mb-4">
                  No hay items en tu carrito. Explora nuestros eventos y agrega algunos boletos.
                </p>
                <Link href="/eventos">
                  <Button>Explorar Eventos</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

