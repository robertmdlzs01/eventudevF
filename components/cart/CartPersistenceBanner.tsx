'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ShoppingCart, ArrowRight, Clock } from 'lucide-react'
import { cartPersistenceService } from '@/lib/cart-persistence'
import Link from 'next/link'

export function CartPersistenceBanner() {
  const [hasPersistedCart, setHasPersistedCart] = useState(false)
  const [cartItems, setCartItems] = useState(0)

  useEffect(() => {
    const checkPersistedCart = () => {
      const persistedData = cartPersistenceService.getPersistedCart()
      if (persistedData) {
        setHasPersistedCart(true)
        setCartItems(persistedData.cartData.items?.length || 0)
      }
    }

    checkPersistedCart()
  }, [])

  if (!hasPersistedCart) return null

  return (
    <Card className="border-blue-200 bg-blue-50 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">
                ¡Tu carrito está guardado!
              </h3>
              <p className="text-sm text-blue-700">
                Tienes {cartItems} {cartItems === 1 ? 'item' : 'items'} esperando en tu carrito
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-blue-600">24h</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200">
          <p className="text-sm text-blue-700 mb-3">
            Una vez que inicies sesión, tus boletos y asientos seleccionados se restaurarán automáticamente.
          </p>
          <div className="flex gap-2">
            <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Link href="/carrito">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ver Carrito
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/registro">
                Crear Cuenta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
