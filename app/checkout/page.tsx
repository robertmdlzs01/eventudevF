"use client"

import { useCart } from "@/hooks/use-cart"
import { useAuthSimple as useAuth } from "@/hooks/use-auth-simple"
import { cartPersistenceService } from "@/lib/cart-persistence"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { trackBeginCheckout, trackPurchase } from "@/lib/analytics"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CreditCard, Check, MapPin, Calendar, Clock, User, Mail, Phone, Shield, Lock, Info, Building } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { PaymentMethods } from "@/components/payment/payment-methods"
import CobruTestPayment from "@/components/payment/CobruTestPayment"
import { PaymentLogos } from "@/components/payment/payment-logos"
import { CheckoutRedirect } from "@/components/auth/CheckoutRedirect"
import { apiClient } from "@/lib/api-client"
import { toast } from "@/hooks/use-toast"

export default function CheckoutPage() {
  const { cart, clearCart } = useCart()
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // Estado para información personal
  const [personalData, setPersonalData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Estado para método de pago
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('cobru')
  const setSelectedMethod = setSelectedPaymentMethod
  
  // Estado para datos de tarjeta
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holderName: ''
  })

  // Estado para datos bancarios (PSE)
  const [bankData, setBankData] = useState({
    bank: '',
    accountType: '',
    documentType: '',
    documentNumber: ''
  })

  // Estado para datos de Daviplata
  const [phoneData, setPhoneData] = useState({
    phone: ''
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (user) {
      setPersonalData({
        firstName: user.first_name || user.name || '',
        lastName: user.last_name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  // Si no hay items en el carrito, redirigir
  useEffect(() => {
    if (cart && cart.items.length === 0) {
      router.push('/carrito')
    } else if (cart) {
      // Track begin checkout
      trackBeginCheckout(cart.total)
    }
  }, [cart?.items.length, router])

  const handlePersonalDataChange = (field: string, value: string) => {
    setPersonalData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleCardDataChange = (field: string, value: string) => {
    setCardData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleBankDataChange = (field: string, value: string) => {
    setBankData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePhoneDataChange = (field: string, value: string) => {
    setPhoneData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Procesar el pago normalmente
      console.log('Procesando pago...')
      
    } catch (error) {
      console.error('Error processing payment:', error)
      toast({
        title: "Error",
        description: "Hubo un error al procesar el pago. Por favor, intenta de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Calcular total
  const calculateTotal = () => {
    if (!cart) return 0
    return cart.total + Math.round(cart.total * 0.05) // 5% de servicio
  }

  // Evitar error de hidratación mostrando contenido consistente
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
          <p className="text-gray-600 mb-4">Inicializando checkout...</p>
        </div>
      </div>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Carrito vacío</h1>
          <p className="text-gray-600 mb-4">No hay items en tu carrito para procesar.</p>
          <Link href="/carrito">
            <Button>Volver al Carrito</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <CheckoutRedirect>
      <ProtectedRoute requireAuth={true} saveCartOnRedirect={true}>
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
              <h1 className="text-xl font-semibold">Finalizar Compra</h1>
              <p className="text-sm text-gray-500">Completa tu información de pago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de pago */}
          <div className="lg:col-span-2 space-y-6">
            {/* Información personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      value={personalData.firstName}
                      onChange={(e) => handlePersonalDataChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      value={personalData.lastName}
                      onChange={(e) => handlePersonalDataChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalData.email}
                      onChange={(e) => handlePersonalDataChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={personalData.phone}
                      onChange={(e) => handlePersonalDataChange("phone", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Métodos de pago */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Métodos de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      type="button" 
                      variant={selectedPaymentMethod === 'card' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedMethod('card')}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span>Tarjeta de Crédito</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedPaymentMethod === 'pse' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedMethod('pse')}
                    >
                      <Building className="h-6 w-6" />
                      <span>PSE</span>
                    </Button>
                    <Button 
                      type="button" 
                      variant={selectedPaymentMethod === 'cobru' ? 'default' : 'outline'}
                      className="h-20 flex-col gap-2"
                      onClick={() => setSelectedMethod('cobru')}
                    >
                      <CreditCard className="h-6 w-6" />
                      <span>Cobru</span>
                    </Button>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    <p>Selecciona tu método de pago preferido para completar la compra de forma segura.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Componente de pago Cobru */}
            {selectedPaymentMethod === 'cobru' && (
              <Card>
                <CardHeader>
                  <CardTitle>Procesar Pago con Cobru</CardTitle>
                </CardHeader>
                <CardContent>
                  <CobruTestPayment
                    amount={calculateTotal()}
                    currency="COP"
                    description={`Compra de boletos - ${cart?.items.map(item => item.eventName || item.productName).join(', ')}`}
                    reference={`ORDER-${Date.now()}`}
                    customerEmail={personalData.email}
                    customerName={`${personalData.firstName} ${personalData.lastName}`}
                    customerPhone={personalData.phone}
                    eventId={cart?.items[0]?.eventId?.toString()}
                    ticketTypeId={cart?.items[0]?.ticketType}
                    quantity={cart?.items.reduce((sum, item) => sum + item.quantity, 0)}
                    onSuccess={(transactionData) => {
                      console.log('Pago exitoso:', transactionData)
                      toast({
                        title: "Pago Exitoso",
                        description: "Tu compra ha sido procesada correctamente.",
                      })
                      // Redirigir a página de éxito
                      router.push(`/checkout/success?orderId=${transactionData.transactionId}`)
                    }}
                    onError={(error) => {
                      console.error('Error en pago:', error)
                      toast({
                        title: "Error en el Pago",
                        description: error,
                        variant: "destructive",
                      })
                    }}
                    onCancel={() => {
                      console.log('Pago cancelado por el usuario')
                      toast({
                        title: "Pago Cancelado",
                        description: "El proceso de pago ha sido cancelado.",
                        variant: "destructive",
                      })
                    }}
                  />
                </CardContent>
              </Card>
            )}

          </div>

          {/* Resumen del pedido */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen del Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items del carrito */}
                <div className="space-y-3">
                  {cart?.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <p className="font-medium">{item.eventName || item.productName}</p>
                        <p className="text-gray-500">{item.ticketType || item.productType}</p>
                        <p className="text-gray-500">{item.quantity} x ${item.price.toLocaleString()}</p>
                        {item.seatNumber && (
                          <div className="mt-1">
                            <p className="text-xs text-gray-500">Asiento: {item.seatNumber}</p>
                          </div>
                        )}
                      </div>
                      <p className="font-semibold">
                        ${(item.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator />

                {/* Totales */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>${cart?.total.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Servicio (5%):</span>
                    <span>${Math.round((cart?.total || 0) * 0.05).toLocaleString()}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-green-600">${calculateTotal().toLocaleString()}</span>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="text-xs text-blue-800">
                      <p className="font-medium mb-1">Información importante:</p>
                      <ul className="space-y-1">
                        <li>• Tus datos se utilizan para procesar tu pedido</li>
                        <li>• Mejoramos tu experiencia en esta web</li>
                        <li>• Otros propósitos en nuestra política de privacidad</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Logos de métodos de pago */}
            <PaymentLogos />
          </div>
        </div>
      </div>
    </div>
      </ProtectedRoute>
    </CheckoutRedirect>
  )
}
