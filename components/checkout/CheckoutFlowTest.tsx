'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, LogIn, User, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { useAuthSimple } from '@/hooks/use-auth-simple'
import { useCart } from '@/hooks/use-cart'
import { cartPersistenceService } from '@/lib/cart-persistence'
import Link from 'next/link'

export function CheckoutFlowTest() {
  const { isAuthenticated, user, isLoading } = useAuthSimple()
  const { cart, addItem } = useCart()
  const [logs, setLogs] = useState<string[]>([])
  const [testStep, setTestStep] = useState<'setup' | 'cart' | 'checkout' | 'login' | 'restore'>('setup')

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const addTestItem = async () => {
    if (!cart) {
      addLog('Error: No hay carrito para agregar item')
      return
    }

    const testItem = {
      productId: 1,
      productName: 'Ticket de Prueba',
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
      addLog(`Item agregado al carrito: ${success ? 'Exitoso' : 'Falló'}`)
      setTestStep('cart')
    } catch (error) {
      addLog(`Error agregando item: ${error}`)
    }
  }

  const simulateCheckoutRedirect = () => {
    if (!cart || cart.items.length === 0) {
      addLog('Error: No hay items en el carrito')
      return
    }

    if (isAuthenticated) {
      addLog('Usuario ya autenticado, procedería al checkout')
      setTestStep('checkout')
    } else {
      addLog('Usuario no autenticado, guardando carrito y redirigiendo al login')
      
      // Simular el flujo del checkout
      cartPersistenceService.saveCartBeforeLogin(cart, cart.sessionId)
      addLog('Carrito guardado para persistencia')
      
      setTestStep('login')
    }
  }

  const simulateLogin = () => {
    // Simular login exitoso
    const testUser = {
      id: 1,
      name: "Usuario de Prueba",
      email: "test@example.com",
      first_name: "Usuario",
      last_name: "Prueba",
      phone: "1234567890",
      role: "user",
      is_verified: true,
      created_at: new Date().toISOString()
    }
    
    const testToken = "test-token-" + Date.now()
    
    // Simular el login
    localStorage.setItem("eventu_authenticated", "true")
    localStorage.setItem("auth_token", testToken)
    localStorage.setItem("current_user", JSON.stringify(testUser))
    localStorage.setItem("userRole", "user")
    
    addLog('Login simulado exitosamente')
    setTestStep('restore')
    
    // Recargar para que el hook detecte el cambio
    setTimeout(() => {
      window.location.reload()
    }, 1000)
  }

  const checkCartRestoration = () => {
    const persistedData = cartPersistenceService.getPersistedCart()
    if (persistedData) {
      addLog(`Carrito persistido encontrado: ${persistedData.cartData.items.length} items`)
      addLog('El carrito debería restaurarse automáticamente')
    } else {
      addLog('No hay carrito persistido')
    }
  }

  const resetTest = () => {
    setTestStep('setup')
    setLogs([])
    cartPersistenceService.clearPersistedCart()
    addLog('Test reiniciado')
  }

  const getStepStatus = (step: string) => {
    switch (testStep) {
      case 'setup':
        return step === 'setup' ? 'current' : 'pending'
      case 'cart':
        return step === 'cart' ? 'current' : (step === 'setup' ? 'completed' : 'pending')
      case 'checkout':
        return step === 'checkout' ? 'current' : (['setup', 'cart'].includes(step) ? 'completed' : 'pending')
      case 'login':
        return step === 'login' ? 'current' : (['setup', 'cart'].includes(step) ? 'completed' : 'pending')
      case 'restore':
        return step === 'restore' ? 'current' : 'completed'
      default:
        return 'pending'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5" />
          Prueba de Flujo de Checkout
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado actual */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Autenticado:</strong> 
            {isLoading ? (
              <Badge variant="secondary">Cargando...</Badge>
            ) : isAuthenticated ? (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="w-3 h-3 mr-1" />
                Sí
              </Badge>
            ) : (
              <Badge variant="destructive">
                <XCircle className="w-3 h-3 mr-1" />
                No
              </Badge>
            )}
          </div>
          <div>
            <strong>Carrito:</strong> {cart ? `${cart.items.length} items` : 'No hay carrito'}
          </div>
          <div>
            <strong>Usuario:</strong> {user ? user.name : 'N/A'}
          </div>
          <div>
            <strong>Paso:</strong> {testStep}
          </div>
        </div>

        {/* Flujo de pasos */}
        <div className="flex items-center gap-2 text-sm">
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStepStatus('setup') === 'current' ? 'bg-blue-100 text-blue-800' : getStepStatus('setup') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <span>1. Setup</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStepStatus('cart') === 'current' ? 'bg-blue-100 text-blue-800' : getStepStatus('cart') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <span>2. Carrito</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStepStatus('checkout') === 'current' ? 'bg-blue-100 text-blue-800' : getStepStatus('checkout') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <span>3. Checkout</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStepStatus('login') === 'current' ? 'bg-blue-100 text-blue-800' : getStepStatus('login') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <span>4. Login</span>
          </div>
          <ArrowRight className="w-4 h-4" />
          <div className={`flex items-center gap-1 px-2 py-1 rounded ${getStepStatus('restore') === 'current' ? 'bg-blue-100 text-blue-800' : getStepStatus('restore') === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
            <span>5. Restaurar</span>
          </div>
        </div>

        {/* Botones de prueba */}
        <div className="flex gap-2 flex-wrap">
          <Button onClick={addTestItem} size="sm" disabled={testStep !== 'setup'}>
            <ShoppingCart className="w-4 h-4 mr-1" />
            Agregar Item
          </Button>
          <Button onClick={simulateCheckoutRedirect} size="sm" disabled={testStep !== 'cart'}>
            Simular Checkout
          </Button>
          <Button onClick={simulateLogin} size="sm" disabled={testStep !== 'login'}>
            <LogIn className="w-4 h-4 mr-1" />
            Simular Login
          </Button>
          <Button onClick={checkCartRestoration} size="sm" disabled={testStep !== 'restore'}>
            Verificar Restauración
          </Button>
          <Button onClick={resetTest} size="sm" variant="outline">
            Reiniciar
          </Button>
        </div>

        {/* Información del carrito */}
        {cart && cart.items.length > 0 && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="font-semibold text-blue-900 mb-2">Carrito Actual:</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div><strong>Items:</strong> {cart.items.length}</div>
              <div><strong>Total:</strong> ${cart.total.toLocaleString()}</div>
              <div><strong>Session ID:</strong> {cart.sessionId}</div>
            </div>
          </div>
        )}

        {/* Log */}
        <div className="max-h-40 overflow-y-auto space-y-1">
          <h4 className="font-semibold">Log del Flujo:</h4>
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
