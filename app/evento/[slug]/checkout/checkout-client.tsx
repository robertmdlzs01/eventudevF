"use client"

import { Event } from "@/lib/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, CreditCard, Check, MapPin, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface CheckoutClientProps {
  event: Event
  checkoutData: {
    selectedTickets?: { [key: string]: number }
    selectedSeats?: string[]
  }
}

export default function CheckoutClient({ event, checkoutData }: CheckoutClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  })

  const selectedTickets = checkoutData.selectedTickets || {}
  const selectedSeats = checkoutData.selectedSeats || []

  // Calcular total
  const calculateTotal = () => {
    let total = 0
    Object.entries(selectedTickets).forEach(([ticketTypeId, quantity]) => {
      const ticketType = event.ticketTypes?.find(t => t.id === ticketTypeId)
      if (ticketType) {
        total += quantity * ticketType.price
      }
    })
    return total
  }

  const total = calculateTotal()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      alert('La funcionalidad de pagos está temporalmente desactivada. Por favor, contacta con el organizador del evento para más información.')
      setLoading(false)
      return
    } catch (error) {
      console.error('Error processing payment:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href={`/evento/${event.id}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold">Finalizar Compra</h1>
              <p className="text-sm text-gray-500">{event.title}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de pago */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Información de Pago
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Información personal */}
                  <div>
                    <h3 className="font-semibold mb-4">Información Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => handleInputChange('firstName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => handleInputChange('lastName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Información de tarjeta */}
                  <div>
                    <h3 className="font-semibold mb-4">Información de Tarjeta</h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                        <Input
                          id="cardNumber"
                          value={formData.cardNumber}
                          onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
                          <Input
                            id="expiryDate"
                            value={formData.expiryDate}
                            onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                            placeholder="MM/AA"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            value={formData.cvv}
                            onChange={(e) => handleInputChange('cvv', e.target.value)}
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? 'Procesando...' : `Pagar $${total.toLocaleString()}`}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Resumen de compra */}
          <div className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Resumen de Compra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del evento */}
                <div className="space-y-3">
                  <h4 className="font-semibold">{event.title}</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(event.date).toLocaleDateString('es-ES')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{event.venue}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Boletas seleccionadas */}
                <div className="space-y-3">
                  <h4 className="font-semibold">Boletas</h4>
                  {Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => {
                    if (quantity === 0) return null
                    const ticketType = event.ticketTypes?.find(t => t.id === ticketTypeId)
                    if (!ticketType) return null
                    
                    return (
                      <div key={ticketTypeId} className="flex justify-between items-center text-sm">
                        <div>
                          <p className="font-medium">{ticketType.name}</p>
                          <p className="text-gray-500">{quantity} x ${ticketType.price?.toLocaleString()}</p>
                        </div>
                        <p className="font-semibold">
                          ${(quantity * ticketType.price).toLocaleString()}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Asientos seleccionados */}
                {selectedSeats.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold mb-2">Asientos Seleccionados</h4>
                      <div className="space-y-1">
                        {selectedSeats.map((seatId, index) => (
                          <div key={seatId} className="flex items-center gap-2 text-sm">
                            <Check className="h-3 w-3 text-green-500" />
                            <span>Asiento {seatId}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-green-600">${total.toLocaleString()}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
