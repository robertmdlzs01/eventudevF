"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { MinusCircle, PlusCircle, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"
import { PriceDisplay } from "@/components/ui/price-display"

interface Ticket {
  id: string
  name: string
  price: number
  description: string
  available: number
  total: number
  benefits?: string[]
}

interface TicketSelectorProps {
  tickets: Ticket[]
  eventId: string
}

export { TicketSelector }
export default TicketSelector

function TicketSelector({ tickets = [], eventId }: TicketSelectorProps) {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const { toast } = useToast()
  const { addItem } = useCart()
  const router = useRouter()

  // Handle case where tickets is undefined or empty
  if (!tickets || tickets.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Selecciona tus Boletos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">No hay boletos disponibles para este evento en este momento.</p>
        </CardContent>
      </Card>
    )
  }

  const handleQuantityChange = (ticketId: string, change: number) => {
    setQuantities((prev) => {
      const currentQuantity = prev[ticketId] || 0
      const newQuantity = Math.max(0, currentQuantity + change)
      const ticket = tickets.find((t) => t.id === ticketId)

      if (ticket && newQuantity > ticket.available) {
        toast({
          title: "No hay suficientes boletos",
          description: `Solo quedan ${ticket.available} boletos disponibles para ${ticket.name}.`,
          variant: "destructive",
        })
        return prev
      }

      return { ...prev, [ticketId]: newQuantity }
    })
  }

  const subtotal = Object.entries(quantities).reduce((sum, [ticketId, quantity]) => {
    const ticket = tickets.find((t) => t.id === ticketId)
    return sum + (ticket ? ticket.price * quantity : 0)
  }, 0)

  const totalTicketsSelected = Object.values(quantities).reduce((sum, quantity) => sum + quantity, 0)

  const handleAddToCart = () => {
    if (totalTicketsSelected === 0) {
      toast({
        title: "No hay boletos seleccionados",
        description: "Por favor, selecciona al menos un boleto para añadir al carrito.",
        variant: "destructive",
      })
      return
    }

    // Agregar cada tipo de boleta seleccionada al carrito
    Object.entries(quantities).forEach(([ticketId, quantity]) => {
      if (quantity > 0) {
        const ticket = tickets.find((t) => t.id === ticketId)
        if (ticket) {
          const cartItem = {
            productId: parseInt(ticketId),
            productName: ticket.name,
            productType: 'ticket' as const,
            eventId: parseInt(eventId),
            eventName: "Evento", // Se puede obtener del contexto del evento
            ticketType: ticket.name,
            price: ticket.price,
            quantity: quantity,
            subtotal: ticket.price * quantity,
            tax: ticket.price * quantity * 0.19, // 19% impuesto
            total: ticket.price * quantity * 1.19,
            metadata: {
              eventDate: undefined,
              eventLocation: undefined,
              seatSection: undefined,
              gate: undefined,
              restrictions: [],
              imageUrl: undefined
            }
          }
          
          console.log('Agregando item al carrito:', cartItem)
          addItem(cartItem)
        }
      }
    })

    toast({
      title: "Boletos añadidos al carrito",
      description: `Se han añadido ${totalTicketsSelected} boletos a tu carrito.`,
    })

    // Redirigir al carrito
    router.push('/carrito')
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Selecciona tus Boletos</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {tickets.map((ticket) => (
          <div key={ticket.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{ticket.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                <PriceDisplay price={ticket.price} className="text-primary-600 font-bold text-xl mb-2" />
                <p className="text-xs text-gray-500">
                  Disponibles: {ticket.available} de {ticket.total}
                </p>

                {ticket.benefits && ticket.benefits.length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs font-medium text-gray-700 mb-1">Incluye:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {ticket.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-green-500 mr-1">•</span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(ticket.id, -1)}
                  disabled={(quantities[ticket.id] || 0) === 0}
                >
                  <MinusCircle className="h-5 w-5" />
                </Button>
                <span className="text-lg font-medium w-8 text-center">{quantities[ticket.id] || 0}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleQuantityChange(ticket.id, 1)}
                  disabled={(quantities[ticket.id] || 0) >= ticket.available}
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Progress bar showing availability */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-pink-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((ticket.total - ticket.available) / ticket.total) * 100}%`,
                }}
              ></div>
            </div>
          </div>
        ))}
      </CardContent>

      {totalTicketsSelected > 0 && (
        <CardFooter className="flex flex-col space-y-4 pt-6 border-t">
          <div className="w-full space-y-2">
            {Object.entries(quantities)
              .filter(([, quantity]) => quantity > 0)
              .map(([ticketId, quantity]) => {
                const ticket = tickets.find((t) => t.id === ticketId)
                if (!ticket) return null

                return (
                  <div key={ticketId} className="flex justify-between text-sm">
                    <span>
                      {quantity}x {ticket.name}
                    </span>
                    <PriceDisplay price={ticket.price * quantity} />
                  </div>
                )
              })}
          </div>

          <div className="flex justify-between w-full text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <PriceDisplay price={subtotal} />
          </div>

          <Button
            className="w-full bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl py-3 text-lg font-semibold"
            onClick={handleAddToCart}
            disabled={totalTicketsSelected === 0}
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Añadir al Carrito ({totalTicketsSelected})
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}
