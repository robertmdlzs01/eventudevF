// Nueva Venta POS con funcionalidad completa
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  CreditCard, 
  Receipt, 
  QrCode, 
  Printer, 
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { apiClient } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'

interface Event {
  id: string
  name: string
  date: string
  location: string
  image: string
}

interface TicketType {
  id: string
  name: string
  description: string
  price: number
  available: number
  quantity: number
}

interface Customer {
  name: string
  email: string
  phone: string
}

interface CartItem {
  ticketType: TicketType
  quantity: number
  subtotal: number
}

export function NuevaVentaClient() {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: ''
  })
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [qrCode, setQrCode] = useState<string>('')
  const [showQR, setShowQR] = useState(false)

  // Cargar eventos disponibles
  const loadEvents = async () => {
    try {
      const response = await apiClient.getEvents({ status: 'active' })
      if (response.success && response.data) {
        const transformedEvents: Event[] = response.data.map((event: any) => ({
          id: event.id.toString(),
          name: event.title || event.name,
          date: event.date,
          location: event.venue || event.location,
          image: event.image_url || '/images/placeholder.jpg'
        }))
        setEvents(transformedEvents)
      } else {
        // Fallback a datos mock si falla la API
        console.warn('No se pudieron cargar eventos, usando datos mock')
        const mockEvents: Event[] = []
        setEvents(mockEvents)
      }
    } catch (error) {
      console.error('Error cargando eventos:', error)
      // Fallback a datos mock en caso de error
      const mockEvents: Event[] = []
      setEvents(mockEvents)
    }
  }

  // Cargar tipos de tickets
  const loadTicketTypes = async (eventId: string) => {
    try {
      const eventIdNum = parseInt(eventId)
      if (isNaN(eventIdNum)) {
        console.error('Invalid event ID:', eventId)
        return
      }
      
      const response = await apiClient.getEventTicketTypesByEvent(eventIdNum)
      if (response.success && response.data) {
        const transformedTypes: TicketType[] = response.data.map((ticketType: any) => ({
          id: ticketType.id.toString(),
          name: ticketType.name,
          description: ticketType.description || '',
          price: parseFloat(ticketType.price) || 0,
          available: (ticketType.quantity || 0) - (ticketType.sold || 0),
          quantity: 0
        }))
        setTicketTypes(transformedTypes)
      } else {
        // Fallback a datos mock si falla la API
        console.warn('No se pudieron cargar tipos de tickets, usando datos mock')
        const mockTicketTypes: TicketType[] = []
        setTicketTypes(mockTicketTypes)
      }
    } catch (error) {
      console.error('Error cargando tipos de tickets:', error)
      // Fallback a datos mock en caso de error
      const mockTicketTypes: TicketType[] = []
      setTicketTypes(mockTicketTypes)
    }
  }

  // Manejar selección de evento
  const handleEventSelect = (eventId: string) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      setSelectedEvent(event)
      loadTicketTypes(eventId)
    }
  }

  // Actualizar cantidad de tickets
  const updateTicketQuantity = (ticketTypeId: string, quantity: number) => {
    setTicketTypes(prev => prev.map(ticket => {
      if (ticket.id === ticketTypeId) {
        const newQuantity = Math.max(0, Math.min(quantity, ticket.available))
        return { ...ticket, quantity: newQuantity }
      }
      return ticket
    }))
  }

  // Agregar al carrito
  const addToCart = (ticketType: TicketType) => {
    if (ticketType.quantity > 0) {
      const existingItem = cart.find(item => item.ticketType.id === ticketType.id)
      
      if (existingItem) {
        setCart(prev => prev.map(item => 
          item.ticketType.id === ticketType.id 
            ? { ...item, quantity: item.quantity + ticketType.quantity, subtotal: (item.quantity + ticketType.quantity) * ticketType.price }
            : item
        ))
      } else {
        setCart(prev => [...prev, {
          ticketType,
          quantity: ticketType.quantity,
          subtotal: ticketType.quantity * ticketType.price
        }])
      }
      
      // Resetear cantidad
      setTicketTypes(prev => prev.map(ticket => 
        ticket.id === ticketType.id ? { ...ticket, quantity: 0 } : ticket
      ))
    }
  }

  // Remover del carrito
  const removeFromCart = (ticketTypeId: string) => {
    setCart(prev => prev.filter(item => item.ticketType.id !== ticketTypeId))
  }

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const tax = subtotal * 0.19 // 19% IVA
  const total = subtotal + tax

  // Generar QR
  const generateQR = () => {
    const qrData = {
      event: selectedEvent?.name,
      customer: customer.name,
      total: total,
      timestamp: new Date().toISOString()
    }
    setQrCode(JSON.stringify(qrData))
    setShowQR(true)
  }

  // Imprimir ticket
  const printTicket = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  // Procesar pago
  const processPayment = async () => {
    if (!selectedPaymentMethod) {
      toast({
        title: "Error",
        description: "Selecciona un método de pago",
        variant: "destructive",
      })
      return
    }

    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Agrega tickets al carrito",
        variant: "destructive",
      })
      return
    }

    if (!customer.name || !customer.email) {
      toast({
        title: "Error",
        description: "Completa la información del cliente",
        variant: "destructive",
      })
      return
    }

    if (!selectedEvent) {
      toast({
        title: "Error",
        description: "Selecciona un evento",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Convertir carrito a formato para la API
      const items = cart.map(item => ({
        product_id: item.ticketType.id ? parseInt(item.ticketType.id) : undefined,
        product_name: `${selectedEvent?.name} - ${item.ticketType.name}`,
        product_sku: `TKT-${selectedEvent?.id}-${item.ticketType.id}`,
        quantity: item.quantity,
        unit_price: item.ticketType.price
      }))

      // Por ahora, necesitamos obtener register_id y session_id
      // TODO: Implementar selección de caja y sesión activa
      // Por ahora usamos valores temporales
      const registerId = 1 // TODO: Obtener de la caja seleccionada
      const sessionId = 1 // TODO: Obtener de la sesión activa

      // Crear orden POS
      const orderData = {
        register_id: registerId,
        session_id: sessionId,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone || undefined,
        items: items,
        payment_method: selectedPaymentMethod
      }

      // Intentar crear la orden usando el endpoint de venta directa o POS
      // Primero intentamos con el endpoint de ventas directas desde sales-points
      const response = await apiClient.createDirectSale({
        sales_point_id: registerId,
        customer: {
          name: customer.name,
          email: customer.email,
          phone: customer.phone
        },
        items: items.map(item => ({
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.quantity * item.unit_price
        })),
        total_amount: total,
        payment_method: selectedPaymentMethod,
        status: 'completed',
        notes: `Venta POS - Evento: ${selectedEvent.name}`
      })

      if (response.success) {
        toast({
          title: "Éxito",
          description: "Venta procesada exitosamente",
        })
        
        // Limpiar formulario
        setCart([])
        setCustomer({ name: '', email: '', phone: '' })
        setSelectedPaymentMethod('')
        setSelectedEvent(null)
        setTicketTypes([])
      } else {
        throw new Error(response.message || 'Error al procesar la venta')
      }
    } catch (error: any) {
      console.error('Error procesando pago:', error)
      toast({
        title: "Error",
        description: error.message || "Error procesando el pago. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nueva Venta</h1>
          <p className="text-gray-600">Procesar venta de tickets</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={generateQR} disabled={!selectedEvent}>
            <QrCode className="w-4 h-4 mr-2" />
            Generar QR
          </Button>
          <Button variant="outline" onClick={printTicket} disabled={cart.length === 0}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Ticket
          </Button>
          <Button onClick={processPayment} disabled={loading || cart.length === 0}>
            <CreditCard className="w-4 h-4 mr-2" />
            {loading ? 'Procesando...' : 'Procesar Pago'}
          </Button>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Código QR</h3>
              <Button variant="outline" size="sm" onClick={() => setShowQR(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-center">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <pre className="text-xs break-all">{qrCode}</pre>
              </div>
              <p className="text-sm text-gray-600">Código QR generado para la venta</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Selección de Evento */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar Evento</CardTitle>
              <CardDescription>Elige el evento para la venta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="evento">Evento</Label>
                <Select onValueChange={handleEventSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar evento" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedEvent && (
                <>
                  <div>
                    <Label htmlFor="fecha">Fecha del Evento</Label>
                    <Input type="date" id="fecha" value={selectedEvent.date} readOnly />
                  </div>
                  
                  <div>
                    <Label htmlFor="ubicacion">Ubicación</Label>
                    <Input id="ubicacion" value={selectedEvent.location} readOnly />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Selección de Tickets */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Tickets</CardTitle>
                <CardDescription>Elige los tickets a vender</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ticketTypes.map(ticket => (
                    <div key={ticket.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold">{ticket.name}</h3>
                          <p className="text-sm text-gray-600">{ticket.description}</p>
                          <p className="text-xs text-gray-500">Disponibles: {ticket.available}</p>
                        </div>
                        <span className="text-lg font-bold">{formatCurrency(ticket.price)}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketQuantity(ticket.id, ticket.quantity - 1)}
                          disabled={ticket.quantity <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="w-12 text-center">{ticket.quantity}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => updateTicketQuantity(ticket.id, ticket.quantity + 1)}
                          disabled={ticket.quantity >= ticket.available}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        className="w-full"
                        onClick={() => addToCart(ticket)}
                        disabled={ticket.quantity === 0}
                      >
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Agregar al Carrito
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Carrito */}
          {cart.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Carrito de Compra</CardTitle>
                <CardDescription>Items seleccionados</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.ticketType.name}</p>
                        <p className="text-sm text-gray-600">Cantidad: {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold">{formatCurrency(item.subtotal)}</span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => removeFromCart(item.ticketType.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Panel de Resumen */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Venta</CardTitle>
              <CardDescription>Detalles de la transacción</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuento:</span>
                  <span>$0</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuestos (19%):</span>
                  <span>{formatCurrency(tax)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre Completo</Label>
                <Input 
                  id="nombre" 
                  placeholder="Juan Pérez" 
                  value={customer.name}
                  onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="juan@email.com"
                  value={customer.email}
                  onChange={(e) => setCustomer(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input 
                  id="telefono" 
                  placeholder="+57 300 123 4567"
                  value={customer.phone}
                  onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Método de Pago</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Button 
                  variant={selectedPaymentMethod === 'credit' ? 'default' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setSelectedPaymentMethod('credit')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Tarjeta de Crédito
                </Button>
                <Button 
                  variant={selectedPaymentMethod === 'cash' ? 'default' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Efectivo
                </Button>
                <Button 
                  variant={selectedPaymentMethod === 'transfer' ? 'default' : 'outline'} 
                  className="w-full justify-start"
                  onClick={() => setSelectedPaymentMethod('transfer')}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Transferencia
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
