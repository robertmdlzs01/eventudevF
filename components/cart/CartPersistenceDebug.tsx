'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Save, RotateCcw, Trash2, Eye } from 'lucide-react'
import { cartPersistenceService } from '@/lib/cart-persistence'
import { cartService } from '@/lib/cart-service'
import { useCart } from '@/hooks/use-cart'

export function CartPersistenceDebug() {
  const { cart, addItem } = useCart()
  const [persistedData, setPersistedData] = useState<any>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkPersistedCart()
  }, [])

  const checkPersistedCart = () => {
    const data = cartPersistenceService.getPersistedCart()
    setPersistedData(data)
    addLog(`Verificando carrito persistido: ${data ? 'Encontrado' : 'No encontrado'}`)
  }

  const handleSaveCart = () => {
    if (!cart) {
      addLog('Error: No hay carrito para guardar')
      return
    }

    try {
      cartPersistenceService.saveCartBeforeLogin(cart, cart.sessionId)
      addLog(`Carrito guardado: ${cart.items.length} items`)
      checkPersistedCart()
    } catch (error) {
      addLog(`Error guardando carrito: ${error}`)
    }
  }

  const handleRestoreCart = () => {
    if (!persistedData) {
      addLog('Error: No hay carrito persistido para restaurar')
      return
    }

    try {
      const success = cartPersistenceService.restoreCart(cartService)
      addLog(`Carrito restaurado: ${success ? 'Exitoso' : 'Falló'}`)
      checkPersistedCart()
    } catch (error) {
      addLog(`Error restaurando carrito: ${error}`)
    }
  }

  const handleClearPersisted = () => {
    try {
      cartPersistenceService.clearPersistedCart()
      addLog('Carrito persistido limpiado')
      checkPersistedCart()
    } catch (error) {
      addLog(`Error limpiando carrito persistido: ${error}`)
    }
  }

  const handleAddTestItem = async () => {
    if (!cart) {
      addLog('Error: No hay carrito para agregar item')
      return
    }

    const testItem = {
      productId: 1,
      productName: 'Item de Prueba',
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

    try {
      const success = await addItem(testItem)
      addLog(`Item agregado: ${success ? 'Exitoso' : 'Falló'}`)
    } catch (error) {
      addLog(`Error agregando item: ${error}`)
    }
  }

  const handleViewPersistedData = () => {
    if (persistedData) {
      addLog(`Datos persistidos: ${JSON.stringify(persistedData, null, 2)}`)
    } else {
      addLog('No hay datos persistidos')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Debug de Persistencia del Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Carrito Actual:</strong> {cart ? `${cart.items.length} items` : 'No hay carrito'}
            </div>
            <div>
              <strong>Carrito Persistido:</strong> {persistedData ? 'Sí' : 'No'}
            </div>
            <div>
              <strong>Session ID:</strong> {cart?.sessionId || 'N/A'}
            </div>
            <div>
              <strong>Total:</strong> ${cart?.total || 0}
            </div>
          </div>

          {/* Botones de prueba */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleAddTestItem} size="sm">
              <ShoppingCart className="w-4 h-4 mr-1" />
              Agregar Item
            </Button>
            <Button onClick={handleSaveCart} size="sm" variant="outline">
              <Save className="w-4 h-4 mr-1" />
              Guardar Carrito
            </Button>
            <Button onClick={handleRestoreCart} size="sm" variant="outline" disabled={!persistedData}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Restaurar
            </Button>
            <Button onClick={handleClearPersisted} size="sm" variant="destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              Limpiar
            </Button>
            <Button onClick={handleViewPersistedData} size="sm" variant="secondary">
              <Eye className="w-4 h-4 mr-1" />
              Ver Datos
            </Button>
          </div>

          {/* Información del carrito persistido */}
          {persistedData && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">Carrito Persistido:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><strong>Items:</strong> {persistedData.cartData.items?.length || 0}</div>
                <div><strong>Total:</strong> ${persistedData.cartData.total || 0}</div>
                <div><strong>Timestamp:</strong> {new Date(persistedData.timestamp).toLocaleString()}</div>
                <div><strong>Expira:</strong> {new Date(persistedData.expiresAt).toLocaleString()}</div>
                <div>
                  <strong>Estado:</strong> 
                  <Badge variant={Date.now() > persistedData.expiresAt ? "destructive" : "default"}>
                    {Date.now() > persistedData.expiresAt ? "Expirado" : "Válido"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Items del carrito actual */}
          {cart && cart.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Items en Carrito Actual:</h4>
              {cart.items.map((item, index) => (
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
