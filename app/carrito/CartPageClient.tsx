// Página de Carrito Mejorada basada en WordPress
// Gestión completa del carrito con funcionalidades del POS

'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Tag, 
  CreditCard, 
  Clock,
  MapPin,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  RefreshCw
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

export function CartPageClient() {
  const {
    cart,
    items,
    itemCount,
    subtotal,
    tax,
    total,
    discount,
    discountCode,
    fees,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    removeDiscount,
    validateDiscountCode,
    validateCart,
    completePurchase,
    isLoading,
    error
  } = useCart()

  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  // Aplicar descuento
  const handleApplyDiscount = async () => {
    if (!discountCodeInput.trim()) return

    setDiscountError(null)
    const validation = validateDiscountCode(discountCodeInput.trim())
    
    if (!validation.isValid) {
      setDiscountError(validation.error || 'Código no válido')
      return
    }

    const success = await applyDiscount(discountCodeInput.trim())
    if (success) {
      setDiscountCodeInput('')
    } else {
      setDiscountError('Error aplicando descuento')
    }
  }

  // Proceder al checkout
  const handleCheckout = async () => {
    const validation = validateCart()
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`)
      return
    }

    setIsCheckingOut(true)
    try {
      // Simular datos de pago
      const paymentData = {
        method: 'credit_card',
        cardNumber: '**** **** **** 1234'
      }

      const result = await completePurchase(paymentData)
      if (result.success) {
        // Redirigir a página de éxito
        window.location.href = `/checkout/success?orderId=${result.orderId}`
      } else {
        alert(`Error: ${result.errors.join(', ')}`)
      }
    } catch (err) {
      alert('Error procesando el pago')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tu carrito está vacío</h1>
            <p className="text-gray-600 mb-8">Agrega tickets para continuar con tu compra</p>
            <Link href="/eventos">
              <Button size="lg">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Ver Eventos
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/eventos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a Eventos
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Carrito de Compras</h1>
              <p className="text-gray-600">{itemCount} {itemCount === 1 ? 'item' : 'items'} en tu carrito</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={clearCart}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Limpiar Carrito
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Lista de items */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Items en tu Carrito</CardTitle>
                <CardDescription>Revisa y modifica los items antes de proceder al pago</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-medium">{item.productName}</h4>
                            <Badge variant="outline">{item.productType}</Badge>
                          </div>
                          
                          {item.eventName && (
                            <p className="text-sm text-gray-600 mb-1">{item.eventName}</p>
                          )}
                          
                          {item.ticketType && (
                            <Badge variant="secondary" className="text-xs">
                              {item.ticketType}
                            </Badge>
                          )}

                          {/* Detalles del evento */}
                          <div className="mt-2 space-y-1">
                            {item.metadata.eventDate && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{item.metadata.eventDate}</span>
                              </div>
                            )}
                            {item.metadata.eventLocation && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <MapPin className="w-3 h-3" />
                                <span>{item.metadata.eventLocation}</span>
                              </div>
                            )}
                            {item.seatNumber && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <User className="w-3 h-3" />
                                <span>Asiento: {item.seatNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(item.total)}</p>
                          <p className="text-sm text-gray-500">
                            {formatCurrency(item.price)} c/u
                          </p>
                        </div>
                      </div>

                      {/* Controles de cantidad */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resumen y checkout */}
          <div className="space-y-6">
            {/* Descuento */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Descuento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!discountCode ? (
                  <div className="space-y-2">
                    <Label htmlFor="discount-code">Código de Descuento</Label>
                    <div className="flex gap-2">
                      <Input
                        id="discount-code"
                        placeholder="Ingresa tu código"
                        value={discountCodeInput}
                        onChange={(e) => setDiscountCodeInput(e.target.value)}
                      />
                      <Button
                        onClick={handleApplyDiscount}
                        disabled={!discountCodeInput.trim() || isLoading}
                      >
                        <Tag className="w-4 h-4 mr-1" />
                        Aplicar
                      </Button>
                    </div>
                    {discountError && (
                      <p className="text-sm text-red-500">{discountError}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        Descuento aplicado
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-800">
                        -{formatCurrency(discount)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeDiscount}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumen de precios */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Subtotal ({itemCount} items)</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Impuestos (19%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Comisión de servicio</span>
                  <span>{formatCurrency(fees.serviceFee)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Comisión de procesamiento</span>
                  <span>{formatCurrency(fees.processingFee)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span>Comisión de conveniencia</span>
                  <span>{formatCurrency(fees.convenienceFee)}</span>
                </div>
                
                {discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Botón de checkout */}
            <Button
              onClick={handleCheckout}
              disabled={isLoading || isCheckingOut || items.length === 0}
              className="w-full"
              size="lg"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {isCheckingOut ? 'Procesando...' : 'Proceder al Pago'}
            </Button>

            {/* Información adicional */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>Tu carrito expira en 30 minutos</span>
              </div>
              <p className="text-xs text-gray-400">
                Al proceder al pago, aceptas nuestros términos y condiciones
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
