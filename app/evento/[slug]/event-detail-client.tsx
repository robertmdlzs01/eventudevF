"use client"

import { EventData } from "@/lib/events-data"
import { Calendar, Clock, MapPin, Users, Star, Ticket, Info, AlertCircle, Plus, Minus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/hooks/use-cart"
import { useRouter } from "next/navigation"

interface EventDetailClientProps {
  event: EventData
}

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const { addItem } = useCart()
  const router = useRouter()
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({})
  const [totalPrice, setTotalPrice] = useState(0)



  // Crear tipos de boletas de ejemplo si no existen
  const defaultTicketTypes = [
    {
      id: "general",
      name: "General",
      description: "Acceso general al evento",
      price: event.price || 45000,
      available_quantity: event.total_capacity || 100,
      benefits: ["Acceso completo al evento", "Asientos disponibles"]
    },
    {
      id: "vip",
      name: "VIP",
      description: "Acceso VIP con beneficios especiales",
      price: (event.price || 45000) * 1.5,
      available_quantity: Math.floor((event.total_capacity || 100) * 0.2),
      benefits: ["Acceso VIP", "Asientos preferenciales", "Área exclusiva", "Catering incluido"]
    }
  ]

  // Usar tipos de boletas del evento o los por defecto
  const ticketTypes = event.ticketTypes && event.ticketTypes.length > 0 
    ? event.ticketTypes 
    : defaultTicketTypes

  console.log('Evento:', event)
  console.log('Tipos de boletas:', ticketTypes)

  // Función para formatear la fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Función para formatear la hora
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  // Función para obtener el color temático basado en la categoría
  const getThemeColor = (categoryName: string) => {
    const themes: { [key: string]: string } = {
      'Conciertos': 'bg-gradient-to-r from-purple-600 to-pink-600',
      'Teatro': 'bg-gradient-to-r from-blue-600 to-indigo-600',
      'Deportes': 'bg-gradient-to-r from-green-600 to-emerald-600',
      'Conferencias': 'bg-gradient-to-r from-orange-600 to-red-600',
      'Festivales': 'bg-gradient-to-r from-yellow-500 to-orange-500',
      'Familiar': 'bg-gradient-to-r from-cyan-500 to-blue-500',
      'default': 'bg-gradient-to-r from-gray-600 to-gray-800'
    }
    return themes[categoryName] || themes.default
  }

  // Función para manejar cambios en la cantidad de boletas
  const handleQuantityChange = (ticketTypeId: string, change: number) => {
    const currentQuantity = selectedTickets[ticketTypeId] || 0
    const newQuantity = Math.max(0, currentQuantity + change)
    
    setSelectedTickets(prev => ({
      ...prev,
      [ticketTypeId]: newQuantity
    }))

    // Calcular precio total
    const ticketType = ticketTypes.find(t => t.id === ticketTypeId)
    if (ticketType) {
      const priceChange = change * ticketType.price
      setTotalPrice(prev => prev + priceChange)
    }
  }

  // Función para verificar si hay boletas seleccionadas
  const hasSelectedTickets = () => {
    return Object.values(selectedTickets).some(quantity => quantity > 0)
  }

  // Función para obtener el total de boletas seleccionadas
  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0)
  }

  // Función para agregar boletos al carrito
  const handleAddToCart = () => {
    if (!hasSelectedTickets()) return

    console.log('Agregando al carrito:', selectedTickets)

    // Agregar cada tipo de boleta seleccionada al carrito
    Object.entries(selectedTickets).forEach(([ticketTypeId, quantity]) => {
      if (quantity > 0) {
        const ticketType = ticketTypes.find(t => t.id === ticketTypeId)
        if (ticketType) {
          const cartItem = {
            productId: parseInt(ticketType.id),
            productName: ticketType.name,
            productType: 'ticket' as const,
            eventId: parseInt(event.id),
            eventName: event.title,
            ticketType: ticketType.name,
            price: ticketType.price,
            quantity: quantity,
            subtotal: ticketType.price * quantity,
            tax: ticketType.price * quantity * 0.19, // 19% impuesto
            total: ticketType.price * quantity * 1.19,
            metadata: {
              eventDate: event.date,
              eventLocation: event.location,
              seatSection: undefined,
              gate: undefined,
              restrictions: [],
              imageUrl: event.image_url
            }
          }
          
          console.log('Agregando item al carrito:', cartItem)
          addItem(cartItem)
        }
      }
    })

    // Redirigir al carrito
    router.push('/carrito')
  }

  const themeColor = getThemeColor(event.category?.name || '')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section con imagen principal */}
      <div className="relative h-96 overflow-hidden">
        <Image
          src={event.image_url || '/placeholder.jpg'}
          alt={event.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-4 bg-white/20 text-white border-white/30">
              {event.category?.name || 'Evento'}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">{event.title}</h1>
            <p className="text-xl md:text-2xl text-white/90 max-w-2xl">
              {event.description}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Columna principal - Información del evento */}
          <div className="lg:col-span-2 space-y-8">
            {/* Información básica */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Información del Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Fecha</p>
                      <p className="text-gray-600">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Hora</p>
                      <p className="text-gray-600">{formatTime(event.time)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Lugar</p>
                      <p className="text-gray-600">{event.venue}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Capacidad</p>
                      <p className="text-gray-600">{event.total_capacity} personas</p>
                    </div>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="font-semibold mb-2">Ubicación</h3>
                  <p className="text-gray-600">{event.location}</p>
                </div>
              </CardContent>
            </Card>

            {/* Descripción detallada */}
            <Card>
              <CardHeader>
                <CardTitle>Descripción</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {event.long_description || event.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Tipos de boletas con selector de cantidad - Solo mostrar si NO tiene mapa de asientos */}
            {!event.seatMapId && ticketTypes && ticketTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Tipos de Boleta
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {ticketTypes.map((ticketType, index) => (
                      <div key={index} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <h4 className="font-semibold text-xl mb-2">{ticketType.name}</h4>
                            <p className="text-gray-600 mb-3">{ticketType.description}</p>
                            {ticketType.benefits && ticketType.benefits.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Beneficios incluidos:</p>
                                <ul className="text-sm text-gray-600 space-y-1">
                                  {ticketType.benefits.map((benefit: string, idx: number) => (
                                    <li key={idx} className="flex items-center gap-2">
                                      <Star className="h-3 w-3 text-yellow-500" />
                                      {benefit}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-6">
                            <p className="text-3xl font-bold text-green-600 mb-2">
                              ${ticketType.price?.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                              {'quantity' in ticketType ? ticketType.quantity - ticketType.sold : ticketType.available_quantity} disponibles
                            </p>
                            
                            {/* Selector de cantidad */}
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(ticketType.id, -1)}
                                disabled={!selectedTickets[ticketType.id]}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="text-lg font-semibold min-w-[2rem] text-center">
                                {selectedTickets[ticketType.id] || 0}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuantityChange(ticketType.id, 1)}
                                disabled={selectedTickets[ticketType.id] >= ('quantity' in ticketType ? ticketType.quantity - ticketType.sold : ticketType.available_quantity)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Selección de asientos - Solo mostrar si TIENE mapa de asientos */}
            {event.seatMapId && event.seatMapId !== 'null' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Selección de Asientos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-6">
                    <div className="mb-4">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Ticket className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Selecciona tus asientos preferidos
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Este evento permite elegir asientos específicos para una experiencia personalizada.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <Link href={`/evento/${event.slug}/asientos`} className="w-full">
                        <Button className="w-full" size="lg">
                          <Ticket className="h-4 w-4 mr-2" />
                          Ir a Selección de Asientos
                        </Button>
                      </Link>
                      
                      <p className="text-sm text-gray-500">
                        Podrás ver el mapa del venue y elegir exactamente dónde sentarte
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Video promocional */}
            {event.video_url && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    Video Promocional
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={event.video_url}
                      title={`Video promocional de ${event.title}`}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Galería de imágenes */}
            {event.gallery_images && event.gallery_images.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Galería del Evento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {event.gallery_images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                        <Image
                          src={image}
                          alt={`Imagen ${index + 1} de ${event.title}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información importante */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Información del Evento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* DATOS DEL EVENTO */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">DATOS DEL EVENTO</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">TIPO DE EVENTO:</span>
                        <span>{typeof event.category === 'object' ? event.category.name : event.category || 'No especificado'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">NOMBRE DEL EVENTO:</span>
                        <span>{event.title}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">FECHA:</span>
                        <span>{new Date(event.date).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        }).toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">CIUDAD:</span>
                        <span>{event.location}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">LUGAR:</span>
                        <span>{event.venue || event.location}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">HORA DE APERTURA DE PUERTAS:</span>
                        <span>APERTURA DE PUERTAS DESDE LAS {event.time || 'POR CONFIRMAR'}</span>
                      </div>
                    </div>
                  </div>

                  {/* RESPONSABLE */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">RESPONSABLE</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">RESPONSABLE:</span>
                        <span>{event.organizerName || 'No especificado'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">CC / NIT:</span>
                        <span>{event.organizerId || 'No especificado'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">EDAD MINIMA:</span>
                        <span>{event.ageRestriction || 'MAYORES DE 18'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">VENTA DE LICOR:</span>
                        <span>{event.alcoholSales ? 'HABILITADA LA VENTA DE LICOR Y ALIMENTOS Y BEBIDAS' : 'NO HABILITADA'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">MUJERES EMBARAZADAS:</span>
                        <span>{event.pregnantWomen ? 'SI' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">ACCESO A DISCAPACITADOS:</span>
                        <span>{event.disabledAccess ? 'SI - DE ACUERDO A LAS ZONAS DEL VENUE' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">TIPO DE ACOMODACIÓN:</span>
                        <span>{event.accommodationType || 'MIXTA'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">CODIGO PULEP:</span>
                        <span>{event.pulepCode || 'NO ESPECIFICADO'}</span>
                      </div>
                    </div>
                  </div>

                  {/* DATOS ADICIONALES */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-gray-900">DATOS ADICIONALES</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">BEBIDAS Y ALIMENTOS:</span>
                        <span>{event.externalFood ? 'NO SE PERMITE EL INGRESO DE NINGUNA CLASE DE ALIMENTOS O BEBIDAS' : 'PERMITIDO'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">ZONA DE PARQUEOS:</span>
                        <span>{event.parking ? 'SI' : 'NO'}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-200 pb-2">
                        <span className="font-semibold">ARMAS:</span>
                        <span>PROHIBIDO EL INGRESO DE ARMAS DE TODO TIPO</span>
                      </div>
                    </div>
                  </div>

                  {/* Información adicional */}
                  {event.seatMapId && event.seatMapId !== 'null' && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm font-medium text-green-800">Este evento permite selección específica de asientos.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Acciones y información adicional */}
          <div className="space-y-6">
            {/* Card de compra - Solo mostrar si NO tiene mapa de asientos */}
            {!event.seatMapId && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Resumen de Compra
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hasSelectedTickets() ? (
                    <>
                      {/* Resumen de boletas seleccionadas */}
                      <div className="space-y-3">
                        {ticketTypes?.map((ticketType) => {
                          const quantity = selectedTickets[ticketType.id] || 0
                          if (quantity === 0) return null
                          
                          return (
                            <div key={ticketType.id} className="flex justify-between items-center text-sm">
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
                      
                      <Separator />
                      
                      <div className="flex justify-between items-center text-lg font-bold">
                        <span>Total ({getTotalTickets()} boletas):</span>
                        <span className="text-green-600">${totalPrice.toLocaleString()}</span>
                      </div>

                      <div className="space-y-3 pt-4">
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleAddToCart}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Agregar al Carrito
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="text-center py-8">
                        <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Selecciona la cantidad de boletas que deseas comprar</p>
                      </div>
                      
                      <div className="space-y-3">
                        <Button className="w-full" size="lg" disabled>
                          Agregar al Carrito
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Card de selección de asientos - Solo mostrar si TIENE mapa de asientos */}
            {event.seatMapId && event.seatMapId !== 'null' && (
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Selección de Asientos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-6">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Ticket className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Elige tus asientos
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Este evento permite seleccionar asientos específicos para una experiencia personalizada.
                    </p>
                    
                    <Link href={`/evento/${event.slug}/asientos`} className="w-full">
                      <Button className="w-full" size="lg">
                        <Ticket className="h-4 w-4 mr-2" />
                        Ir a Selección de Asientos
                      </Button>
                    </Link>
                    
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm text-blue-800">
                          <strong>Beneficio:</strong> Podrás ver el mapa del venue y elegir exactamente dónde sentarte
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Información del organizador */}
            <Card>
              <CardHeader>
                <CardTitle>Organizador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-medium">{event.organizer?.name || 'Organizador del Evento'}</p>
                    <p className="text-sm text-gray-500">Organizador verificado</p>
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Eventos similares */}
            <Card>
              <CardHeader>
                <CardTitle>Eventos similares</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">
                  Descubre más eventos de {event.category?.name || 'esta categoría'}
                </p>
                <Button variant="outline" className="w-full mt-3">
                  Ver más eventos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
