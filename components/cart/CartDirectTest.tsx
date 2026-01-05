'use client'

import { useState, useEffect } from 'react'
import { cartService } from '@/lib/cart-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, Trash2, RefreshCw } from 'lucide-react'

export function CartDirectTest() {
  const [cart, setCart] = useState<any>(null)
  const [sessionId, setSessionId] = useState<string>('')
  const [logs, setLogs] = useState<string[]>([])

  useEffect(() => {
    // Obtener o crear sessionId
    let currentSessionId = sessionStorage.getItem('cart-session-id')
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('cart-session-id', currentSessionId)
    }
    setSessionId(currentSessionId)
    
    // Cargar carrito inicial
    loadCart()
  }, [])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const loadCart = () => {
    try {
      let currentCart = cartService.getCartBySession(sessionId)
      if (!currentCart) {
        currentCart = cartService.createCart(undefined, sessionId)
        addLog('Carrito creado')
      } else {
        addLog('Carrito cargado')
      }
      setCart(currentCart)
      addLog(`Items: ${currentCart.items.length}, Total: $${currentCart.total}`)
    } catch (err) {
      addLog(`Error cargando carrito: ${err}`)
    }
  }

  const handleAddItem = () => {
    try {
      const testItem = {
        productId: 1,
        productName: 'Entrada de Prueba',
        productType: 'ticket' as const,
        eventId: 1,
        eventName: 'Evento de Prueba',
        ticketType: 'General',
        price: 50000,
        quantity: 1,
        subtotal: 50000,
        tax: 9500,
        total: 59500,
        metadata: {
          eventDate: '2025-06-15',
          eventLocation: 'Bogotá, Colombia',
          imageUrl: '/placeholder.jpg'
        }
      }

      const success = cartService.addItem(cart.id, testItem)
      addLog(`Item agregado: ${success}`)
      loadCart()
    } catch (err) {
      addLog(`Error agregando item: ${err}`)
    }
  }

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    try {
      addLog(`Actualizando cantidad de ${itemId} a ${newQuantity}`)
      const success = cartService.updateItemQuantity(cart.id, itemId, newQuantity)
      addLog(`Cantidad actualizada: ${success}`)
      loadCart()
    } catch (err) {
      addLog(`Error actualizando cantidad: ${err}`)
    }
  }

  const handleRemoveItem = (itemId: string) => {
    try {
      addLog(`Removiendo item ${itemId}`)
      const success = cartService.removeItem(cart.id, itemId)
      addLog(`Item removido: ${success}`)
      loadCart()
    } catch (err) {
      addLog(`Error removiendo item: ${err}`)
    }
  }

  const handleClearCart = () => {
    try {
      addLog('Limpiando carrito')
      const success = cartService.clearCart(cart.id)
      addLog(`Carrito limpiado: ${success}`)
      loadCart()
    } catch (err) {
      addLog(`Error limpiando carrito: ${err}`)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Prueba Directa del Carrito
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><strong>Session ID:</strong> {sessionId}</div>
            <div><strong>Carrito ID:</strong> {cart?.id || 'N/A'}</div>
            <div><strong>Items:</strong> {cart?.items.length || 0}</div>
            <div><strong>Total:</strong> ${cart?.total || 0}</div>
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            <Button onClick={handleAddItem}>
              <Plus className="w-4 h-4 mr-1" />
              Agregar Item
            </Button>
            <Button onClick={handleClearCart} variant="destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar Carrito
            </Button>
            <Button onClick={loadCart} variant="outline">
              <RefreshCw className="w-4 h-4 mr-1" />
              Recargar
            </Button>
          </div>

          {cart?.items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Items en el carrito:</h3>
              {cart.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-500">
                      {item.ticketType} - ${item.price.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-600">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
