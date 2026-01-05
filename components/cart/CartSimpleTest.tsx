'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Save, RotateCcw, Trash2 } from 'lucide-react'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { cartService } from '@/lib/cart-service'

export function CartSimpleTest() {
  const [logs, setLogs] = useState<string[]>([])
  const [testCart, setTestCart] = useState<any>(null)

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const createTestCart = () => {
    try {
      const sessionId = 'test-session-' + Date.now()
      const cart = cartService.createCart(undefined, sessionId)
      
      // Agregar items de prueba
      const testItems = [
        {
          productId: 1,
          productName: 'Ticket General',
          productType: 'ticket' as const,
          eventId: 1,
          eventName: 'Concierto de Prueba',
          ticketType: 'General',
          price: 50000,
          quantity: 2,
          subtotal: 100000,
          tax: 19000,
          total: 119000,
          metadata: {
            eventDate: '2025-06-15',
            eventLocation: 'Bogotá, Colombia',
            imageUrl: '/placeholder.jpg'
          }
        },
        {
          productId: 2,
          productName: 'Ticket VIP',
          productType: 'ticket' as const,
          eventId: 1,
          eventName: 'Concierto de Prueba',
          ticketType: 'VIP',
          price: 100000,
          quantity: 1,
          subtotal: 100000,
          tax: 19000,
          total: 119000,
          metadata: {
            eventDate: '2025-06-15',
            eventLocation: 'Bogotá, Colombia',
            imageUrl: '/placeholder.jpg'
          }
        }
      ]

      testItems.forEach(item => {
        cartService.addItem(cart.id, item)
      })

      setTestCart(cart)
      addLog(`Carrito de prueba creado: ${cart.id} con ${cart.items.length} items`)
    } catch (error) {
      addLog(`Error creando carrito de prueba: ${error}`)
    }
  }

  const saveTestCart = () => {
    if (!testCart) {
      addLog('Error: No hay carrito para guardar')
      return
    }

    try {
      cartPersistenceService.saveCartBeforeLogin(testCart, testCart.sessionId)
      addLog(`Carrito guardado para persistencia: ${testCart.items.length} items`)
    } catch (error) {
      addLog(`Error guardando carrito: ${error}`)
    }
  }

  const restoreTestCart = () => {
    try {
      const persistedData = cartPersistenceService.getPersistedCart()
      if (!persistedData) {
        addLog('No hay carrito persistido')
        return
      }

      addLog(`Carrito persistido encontrado: ${persistedData.cartData.items.length} items`)
      
      // Crear nuevo carrito y restaurar items
      const sessionId = 'restored-session-' + Date.now()
      const restoredCart = cartService.createCart(undefined, sessionId)
      
      persistedData.cartData.items.forEach((item: any) => {
        cartService.addItem(restoredCart.id, item)
      })

      setTestCart(restoredCart)
      addLog(`Carrito restaurado: ${restoredCart.items.length} items`)
      
      // Limpiar persistencia
      cartPersistenceService.clearPersistedCart()
      addLog('Persistencia limpiada')
    } catch (error) {
      addLog(`Error restaurando carrito: ${error}`)
    }
  }

  const clearTest = () => {
    setTestCart(null)
    setLogs([])
    cartPersistenceService.clearPersistedCart()
    addLog('Test limpiado')
  }

  const checkPersisted = () => {
    const persistedData = cartPersistenceService.getPersistedCart()
    if (persistedData) {
      addLog(`Carrito persistido: ${persistedData.cartData.items.length} items, expira: ${new Date(persistedData.expiresAt).toLocaleString()}`)
    } else {
      addLog('No hay carrito persistido')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Prueba Simple de Persistencia
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="p-3 bg-gray-50 rounded">
          <strong>Carrito Actual:</strong> {testCart ? `${testCart.items.length} items` : 'No hay carrito'}
          {testCart && (
            <div className="mt-2 text-sm">
              <div>ID: {testCart.id}</div>
              <div>Session: {testCart.sessionId}</div>
              <div>Total: ${testCart.total}</div>
            </div>
          )}
        </div>

        {/* Botones de prueba */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={createTestCart} size="sm">
            <ShoppingCart className="w-4 h-4 mr-1" />
            Crear Carrito
          </Button>
          <Button onClick={saveTestCart} size="sm" variant="outline" disabled={!testCart}>
            <Save className="w-4 h-4 mr-1" />
            Guardar
          </Button>
          <Button onClick={restoreTestCart} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-1" />
            Restaurar
          </Button>
          <Button onClick={checkPersisted} size="sm" variant="secondary">
            Verificar
          </Button>
          <Button onClick={clearTest} size="sm" variant="destructive">
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        </div>

        {/* Items del carrito */}
        {testCart && testCart.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Items en Carrito:</h4>
            {testCart.items.map((item: any, index: number) => (
              <div key={index} className="flex justify-between items-center p-2 border rounded text-sm">
                <div>
                  <span className="font-medium">{item.productName}</span>
                  <span className="text-gray-500 ml-2">x{item.quantity}</span>
                </div>
                <span className="font-semibold">${item.total.toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}

        {/* Log */}
        <div className="max-h-40 overflow-y-auto space-y-1">
          <h4 className="font-semibold">Log:</h4>
          {logs.map((log, index) => (
            <div key={index} className="text-xs font-mono text-gray-600">
              {log}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
