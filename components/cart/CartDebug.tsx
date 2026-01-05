'use client'

import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Minus, Trash2, RefreshCw } from 'lucide-react'

export function CartDebug() {
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

  const handleAddTestItem = async () => {
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
    console.log('Item agregado:', result)
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    const result = await updateQuantity(itemId, newQuantity)
    console.log('Cantidad actualizada:', result)
  }

  const handleRemoveItem = async (itemId: string) => {
    const result = await removeItem(itemId)
    console.log('Item removido:', result)
  }

  const handleClearCart = async () => {
    const result = await clearCart()
    console.log('Carrito limpiado:', result)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5" />
          Debug del Carrito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado del carrito */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Carrito ID:</strong> {cart?.id || 'N/A'}
          </div>
          <div>
            <strong>Session ID:</strong> {cart?.sessionId || 'N/A'}
          </div>
          <div>
            <strong>Items:</strong> {itemCount}
          </div>
          <div>
            <strong>Total:</strong> ${total.toLocaleString()}
          </div>
        </div>

        {/* Botones de prueba */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={handleAddTestItem} disabled={isLoading}>
            <Plus className="w-4 h-4 mr-1" />
            Agregar Item de Prueba
          </Button>
          <Button onClick={handleClearCart} disabled={isLoading} variant="destructive">
            <Trash2 className="w-4 h-4 mr-1" />
            Limpiar Carrito
          </Button>
        </div>

        {/* Lista de items */}
        {items.length > 0 ? (
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
        ) : (
          <p className="text-gray-500">No hay items en el carrito</p>
        )}

        {/* Error */}
        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="text-sm text-blue-600">
            Cargando...
          </div>
        )}
      </CardContent>
    </Card>
  )
}
