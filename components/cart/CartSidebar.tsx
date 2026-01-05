// Componente de Carrito Mejorado basado en WordPress
// Sidebar de carrito con funcionalidades del POS

'use client'

import { useState } from 'react'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
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
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CartSidebarProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export function CartSidebar({ isOpen, onClose, onCheckout }: CartSidebarProps) {
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
    applyDiscount,
    removeDiscount,
    validateDiscountCode,
    validateCart,
    isLoading,
    error
  } = useCart()

  const [discountCodeInput, setDiscountCodeInput] = useState('')
  const [discountError, setDiscountError] = useState<string | null>(null)
  const [showDiscountForm, setShowDiscountForm] = useState(false)

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
      setShowDiscountForm(false)
    } else {
      setDiscountError('Error aplicando descuento')
    }
  }

  // Validar carrito antes del checkout
  const handleCheckout = () => {
    const validation = validateCart()
    if (!validation.isValid) {
      alert(`Error: ${validation.errors.join(', ')}`)
      return
    }
    onCheckout()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50" onClick={onClose}>
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="text-lg font-semibold">Carrito de Compras</h2>
              {itemCount > 0 && (
                <Badge variant="secondary">{itemCount}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Contenido del carrito */}
          <ScrollArea className="flex-1 p-4">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <ShoppingCart className="w-12 h-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Tu carrito está vacío</p>
                <p className="text-sm text-gray-400">Agrega tickets para continuar</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className="p-3">
                    <div className="space-y-2">
                      {/* Información del producto */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{item.productName}</h4>
                          {item.eventName && (
                            <p className="text-xs text-gray-500">{item.eventName}</p>
                          )}
                          {item.ticketType && (
                            <Badge variant="outline" className="text-xs">
                              {item.ticketType}
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Detalles del evento */}
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

                      {/* Controles de cantidad */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(item.total)}</p>
                          <p className="text-xs text-gray-500">
                            {formatCurrency(item.price)} c/u
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Resumen y checkout */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              {/* Descuento */}
              {!discountCode && !showDiscountForm && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDiscountForm(true)}
                  className="w-full"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Aplicar Descuento
                </Button>
              )}

              {showDiscountForm && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Código de descuento"
                      value={discountCodeInput}
                      onChange={(e) => setDiscountCodeInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      size="sm"
                      onClick={handleApplyDiscount}
                      disabled={!discountCodeInput.trim() || isLoading}
                    >
                      Aplicar
                    </Button>
                  </div>
                  {discountError && (
                    <p className="text-xs text-red-500">{discountError}</p>
                  )}
                  {discountCodeInput && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowDiscountForm(false)
                        setDiscountCodeInput('')
                        setDiscountError(null)
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              )}

              {discountCode && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600">Descuento aplicado</span>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">-{formatCurrency(discount)}</span>
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

              {/* Resumen de precios */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos (19%)</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión de servicio</span>
                  <span>{formatCurrency(fees.serviceFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión de procesamiento</span>
                  <span>{formatCurrency(fees.processingFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Comisión de conveniencia</span>
                  <span>{formatCurrency(fees.convenienceFee)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Descuento</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Botón de checkout */}
              <Button
                onClick={handleCheckout}
                disabled={isLoading || items.length === 0}
                className="w-full"
                size="lg"
              >
                <CreditCard className="w-4 h-4 mr-2" />
                {isLoading ? 'Procesando...' : 'Proceder al Pago'}
              </Button>

              {/* Información adicional */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Tu carrito expira en 30 minutos</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
