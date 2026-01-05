'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, Trash2 } from 'lucide-react'

export function CartTest() {
  const {
    cart,
    items,
    itemCount,
    subtotal,
    total,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    isLoading,
    error
  } = useCart()

  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleAddTestItem = async () => {
    addTestResult('Iniciando agregar item...')
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

      const result = await addItem(testItem)
      addTestResult(`Item agregado: ${result}`)
    } catch (err) {
      addTestResult(`Error agregando item: ${err}`)
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    addTestResult(`Actualizando cantidad de ${itemId} a ${newQuantity}...`)
    try {
      const result = await updateQuantity(itemId, newQuantity)
      addTestResult(`Cantidad actualizada: ${result}`)
    } catch (err) {
      addTestResult(`Error actualizando cantidad: ${err}`)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    addTestResult(`Removiendo item ${itemId}...`)
    try {
      const result = await removeItem(itemId)
      addTestResult(`Item removido: ${result}`)
    } catch (err) {
      addTestResult(`Error removiendo item: ${err}`)
    }
  }

  const handleClearCart = async () => {
    addTestResult('Limpiando carrito...')
    try {
      const result = await clearCart()
      addTestResult(`Carrito limpiado: ${result}`)
    } catch (err) {
      addTestResult(`Error limpiando carrito: ${err}`)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Estado del Carrito</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><strong>Carrito ID:</strong> {cart?.id || 'N/A'}</div>
            <div><strong>Session ID:</strong> {cart?.sessionId || 'N/A'}</div>
            <div><strong>Items:</strong> {itemCount}</div>
            <div><strong>Total:</strong> ${total.toLocaleString()}</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Funciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddTestItem} disabled={isLoading}>
              Agregar Item de Prueba
            </Button>
            <Button onClick={handleClearCart} disabled={isLoading} variant="destructive">
              Limpiar Carrito
            </Button>
          </div>

          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Items en el carrito:</h3>
              {items.map((item) => (
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

          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              Error: {error}
            </div>
          )}

          {isLoading && (
            <div className="text-sm text-blue-600">Cargando...</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Pruebas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-xs font-mono text-gray-600">
                {result}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
