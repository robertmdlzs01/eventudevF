"use client"

import { Event } from "@/lib/types"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, MapPin, Users, ShoppingCart, Check, ZoomIn, ZoomOut, RotateCcw, Clock, AlertCircle, Star, Crown, Accessibility } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { useCart } from "@/hooks/use-cart"
import { useSeatReservation } from "@/lib/seat-reservation-manager"
import { toast } from "sonner"

interface SeatSelectionClientProps {
  event: any // Cambiar a any para evitar problemas de tipo
  selectedTickets: { [key: string]: number }
}

interface Seat {
  id: string
  row: string
  number: string
  section: string
  status: 'available' | 'occupied' | 'reserved' | 'blocked'
  price?: number
  type?: 'regular' | 'vip' | 'accessible' | 'premium'
  isWheelchairAccessible?: boolean
  hasExtraLegroom?: boolean
  isAisleSeat?: boolean
  isWindowSeat?: boolean
  category?: 'economy' | 'business' | 'first'
}

export default function SeatSelectionClient({ event, selectedTickets }: SeatSelectionClientProps) {
  const router = useRouter()
  const { addItem, updateQuantity, cart } = useCart()
  
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Calcular el total de boletas necesarias
  const totalTicketsNeeded = Object.values(selectedTickets).reduce((total, quantity) => total + quantity, 0)
  
  // Usar el máximo configurado en el evento, o el total de boletas necesarias, o 4 por defecto
  const eventMaxSeats = event.maxSeatsPerPurchase || 4
  const maxSeatsToSelect = totalTicketsNeeded > 0 ? Math.min(totalTicketsNeeded, eventMaxSeats) : eventMaxSeats

  const loadSeats = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🪑 Loading seats for event:', event.id, 'with seatMapId:', event.seatMapId)
      
      // Si el evento tiene mapa de asientos, obtener asientos reales
      if (event.seatMapId) {
        try {
          // Intentar obtener asientos desde la API
          const response = await apiClient.getEventSeats(event.id)
          console.log('📡 API Response:', response)
          if (response.success && response.data) {
            console.log('✅ Seats loaded from API:', response.data.length, 'seats')
            setSeats(response.data)
            return
          } else {
            console.warn('❌ API response not successful:', response)
          }
        } catch (apiError) {
          console.warn('Failed to fetch seats from API, using mock data:', apiError)
        }
      }
      
      // Fallback a datos mock si no hay API o falla
      console.log('🔄 Using mock data fallback')
      const mockSeats: Seat[] = generateMockSeats()
      setSeats(mockSeats)
    } catch (err) {
      console.error('💥 Error loading seats:', err)
      setError('Error al cargar los asientos')
    } finally {
      setLoading(false)
    }
  }, [event.id, event.seatMapId])

  useEffect(() => {
    loadSeats()
  }, [loadSeats])

  // Debug: Log cuando cambia el estado de seats
  useEffect(() => {
    console.log('🔄 Seats state changed:', seats.length, 'seats')
    if (seats.length > 0) {
      console.log('📊 First few seats:', seats.slice(0, 3))
    }
  }, [seats])

  // Función para obtener asientos reales de la base de datos
  const fetchRealSeats = async (): Promise<Seat[]> => {
    try {
      const response = await fetch(`/api/events/${event.id}/seats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener asientos');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.map((seat: any) => ({
          id: seat.id.toString(),
          row: seat.row?.toString() || '1',
          number: seat.number?.toString() || '1',
          section: seat.section || 'general',
          status: seat.status || 'available',
          price: seat.price || 0,
          type: seat.type || 'regular',
          category: seat.category || 'economy',
          isWheelchairAccessible: seat.is_wheelchair_accessible || false,
          hasExtraLegroom: seat.has_extra_legroom || false,
          isAisleSeat: seat.is_aisle_seat || false,
          isWindowSeat: seat.is_window_seat || false,
          isHearingImpaired: seat.is_hearing_impaired || false,
          isRestrictedView: seat.is_restricted_view || false,
          customPrice: seat.custom_price || false,
          label: seat.label || `${seat.row}${seat.number}`,
          displayLabel: seat.display_label || `${seat.row}${seat.number}`
        }));
      }

      return [];
    } catch (error) {
      console.error('Error obteniendo asientos reales:', error);
      return [];
    }
  };

  const generateMockSeats = (): Seat[] => {
    const sections = [
      { name: 'A', type: 'premium', price: 80000, category: 'first' },
      { name: 'B', type: 'vip', price: 65000, category: 'business' },
      { name: 'C', type: 'regular', price: 45000, category: 'economy' },
      { name: 'D', type: 'regular', price: 40000, category: 'economy' },
      { name: 'E', type: 'accessible', price: 45000, category: 'accessible' }
    ]
    
    const seats: Seat[] = []
    
    sections.forEach((section, sectionIndex) => {
      for (let row = 1; row <= 10; row++) {
        for (let seatNum = 1; seatNum <= 20; seatNum++) {
          const isWheelchair = section.name === 'E' && seatNum <= 4
          const isAisle = seatNum === 1 || seatNum === 20
          const isWindow = seatNum === 1 || seatNum === 20
          const hasExtraLegroom = row === 1 || row === 10
          
          seats.push({
            id: `${section.name}-${row}-${seatNum}`,
            row: row.toString(),
            number: seatNum.toString(),
            section: section.name,
            status: Math.random() > 0.3 ? 'available' : 'occupied',
            price: section.price,
            type: section.type as any,
            category: section.category as any,
            isWheelchairAccessible: isWheelchair,
            hasExtraLegroom,
            isAisleSeat: isAisle,
            isWindowSeat: isWindow
          })
        }
      }
    })
    
    return seats
  }

  const handleSeatClick = useCallback((seat: Seat) => {
    if (seat.status !== 'available') {
      toast.error("Asiento no disponible", {
        description: "Este asiento no está disponible para selección"
      })
      return
    }

    setSelectedSeats(prev => {
      const isSelected = prev.find(s => s.id === seat.id)
      if (isSelected) {
        // Deseleccionar asiento
        toast.success("Asiento deseleccionado", {
          description: `Asiento ${seat.section}-${seat.row}-${seat.number} deseleccionado`
        })
        return prev.filter(s => s.id !== seat.id)
      } else {
        // Seleccionar asiento (si no excede la cantidad necesaria)
        if (prev.length < maxSeatsToSelect) {
          toast.success("Asiento seleccionado", {
            description: `Asiento ${seat.section}-${seat.row}-${seat.number} seleccionado`
          })
          return [...prev, seat]
        } else {
          toast.error("Límite alcanzado", {
            description: `Puedes seleccionar máximo ${maxSeatsToSelect} asientos`
          })
          return prev
        }
      }
    })
  }, [maxSeatsToSelect, toast])

  const getSeatColor = (seat: Seat) => {
    if (selectedSeats.find(s => s.id === seat.id)) {
      return 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 shadow-green-500/50'
    }
    
    switch (seat.status) {
      case 'available':
        return 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 border-slate-300 hover:from-slate-300 hover:to-slate-400'
      case 'occupied':
        return 'bg-gradient-to-br from-red-400 to-red-600 text-white border-red-500'
      case 'reserved':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-500'
      case 'blocked':
        return 'bg-gradient-to-br from-gray-400 to-gray-600 text-white border-gray-500'
      default:
        return 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-800 border-slate-300'
    }
  }

  const getSeatIcon = (seat: Seat) => {
    if (seat.isWheelchairAccessible) return <Users className="w-3 h-3" />
    if (seat.type === 'vip') return <Crown className="w-3 h-3" />
    if (seat.type === 'premium') return <Star className="w-3 h-3" />
    if (seat.hasExtraLegroom) return <Users className="w-3 h-3" />
    return null
  }



  const calculateTotalPrice = () => {
    const ticketPrice = Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = event.ticketTypes?.find((t: any) => t.id === ticketTypeId)
      return total + (ticketType ? quantity * ticketType.price : 0)
    }, 0)
    
    const seatPrice = selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0)
    
    return ticketPrice + seatPrice
  }

  const handleContinue = () => {
    if (selectedSeats.length === 0) return

    // Calcular el precio total de los asientos
    const seatPrice = selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0)
    
    // Calcular el precio total de los tickets
    const ticketPrice = Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = event.ticketTypes?.find((t: any) => t.id === ticketTypeId)
      return total + (ticketType ? quantity * ticketType.price : 0)
    }, 0)

    // Crear item del carrito con la estructura correcta
    const cartItem = {
      productId: event.id,
      productName: event.title,
      productType: 'ticket' as const,
      eventId: event.id,
      eventName: event.title,
      ticketType: 'Selección de Asientos',
      seatNumber: selectedSeats.map(seat => `${seat.section}-${seat.row}-${seat.number}`).join(', '),
      price: (seatPrice + ticketPrice) / selectedSeats.length, // Precio promedio por asiento
      quantity: selectedSeats.length,
      subtotal: seatPrice + ticketPrice,
      tax: (seatPrice + ticketPrice) * 0.19, // 19% impuesto
      total: (seatPrice + ticketPrice) * 1.19,
      metadata: {
        eventDate: event.date,
        eventLocation: event.location,
        seatSection: selectedSeats[0]?.section,
        gate: undefined,
        restrictions: [],
        imageUrl: event.image_url
      }
    }

    // Buscar si ya existe un item para este evento en el carrito
    const existingItemIndex = cart?.items.findIndex((item: any) => item.eventId === event.id) || -1
    
    if (existingItemIndex >= 0) {
      // Actualizar item existente
      updateQuantity(existingItemIndex.toString(), cartItem.quantity)
    } else {
      // Agregar nuevo item
      addItem(cartItem)
    }

    // Redirigir al carrito
    router.push('/carrito')
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando mapa de asientos...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadSeats}>Reintentar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header superior como en la imagen */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href={`/evento/${event.slug}`}>
                <Button variant="ghost" size="sm" className="text-gray-600">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-800">
                  Selección de asiento en el mapa
                </h1>
                <p className="text-sm text-gray-600">
                  {event.title} | {event.location} | {event.date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  placeholder="Ingresa tu código" 
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Aplicar
                </Button>
              </div>
              <Button variant="outline" size="sm">
                Cerrar pantalla completa
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal en pantalla completa */}
      <div className="flex h-screen">
        {/* Mapa de asientos - Área principal */}
        <div className="flex-1 relative bg-gray-50">
          {/* Controles de zoom en la esquina izquierda */}
          <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="w-10 h-10 rounded-full bg-white shadow-lg"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="w-10 h-10 rounded-full bg-white shadow-lg"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="w-10 h-10 rounded-full bg-white shadow-lg"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Contenedor del mapa */}
          <div 
            className="w-full h-full overflow-auto bg-gray-50"
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Lienzo del mapa */}
            <div 
              className="relative p-8 min-h-full"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center',
                transition: 'transform 0.1s ease-out'
              }}
            >
              {/* Escenario como en la imagen - rectangular gris */}
              <div className="text-center mb-8">
                <div className="bg-gray-300 h-16 w-96 mx-auto rounded-lg shadow-lg flex items-center justify-center">
                  <span className="text-gray-600 font-semibold text-lg">ESCENARIO</span>
                </div>
              </div>

              {/* Layout de asientos funcional */}
              <div className="max-w-6xl mx-auto">
                {/* Tribunas superiores */}
                <div className="flex justify-between mb-8">
                  <div className="text-center">
                    <div className="bg-blue-100 px-4 py-2 rounded-lg mb-4">
                      <span className="font-semibold text-blue-800">TRIBUNA FAN NORTE</span>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {Array.from({ length: 20 }, (_, i) => {
                        const seatId = `tribuna-norte-${i}`
                        const seat = { id: seatId, section: 'TRIBUNA NORTE', row: '1', number: (i + 1).toString(), status: 'available' as const, price: 495000 }
                        const isSelected = selectedSeats.find(s => s.id === seatId)
                        return (
                          <button
                            key={i}
                            onClick={() => handleSeatClick(seat)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                              isSelected ? 'bg-green-500' : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                            title={`Tribuna Norte - Asiento ${i + 1} - $495.000`}
                          />
                        )
                      })}
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="bg-blue-100 px-4 py-2 rounded-lg mb-4">
                      <span className="font-semibold text-blue-800">TRIBUNA FAN SUR</span>
                    </div>
                    <div className="flex gap-1 justify-center">
                      {Array.from({ length: 20 }, (_, i) => {
                        const seatId = `tribuna-sur-${i}`
                        const seat = { id: seatId, section: 'TRIBUNA SUR', row: '1', number: (i + 1).toString(), status: 'available' as const, price: 495000 }
                        const isSelected = selectedSeats.find(s => s.id === seatId)
                        return (
                          <button
                            key={i}
                            onClick={() => handleSeatClick(seat)}
                            className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                              isSelected ? 'bg-green-500' : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                            title={`Tribuna Sur - Asiento ${i + 1} - $495.000`}
                          />
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Secciones laterales */}
                <div className="flex justify-between mb-8">
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <div className="bg-orange-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-orange-800">219</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 6 }, (_, j) => {
                              const seatId = `219-${i}-${j}`
                              const seat = { id: seatId, section: '219', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 353600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-orange-400 hover:bg-orange-500'
                                  }`}
                                  title={`219 - Fila ${i + 1}, Asiento ${j + 1} - $353.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="bg-orange-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-orange-800">217</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 6 }, (_, j) => {
                              const seatId = `217-${i}-${j}`
                              const seat = { id: seatId, section: '217', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 353600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-orange-400 hover:bg-orange-500'
                                  }`}
                                  title={`217 - Fila ${i + 1}, Asiento ${j + 1} - $353.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Secciones centrales - Platea */}
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="bg-cyan-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-cyan-800">PLATEA 101</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-101-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 101', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 400700 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-cyan-400 hover:bg-cyan-500'
                                  }`}
                                  title={`Platea 101 - Fila ${i + 1}, Asiento ${j + 1} - $400.700`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-cyan-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-cyan-800">PLATEA 102</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-102-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 102', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 400700 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-cyan-400 hover:bg-cyan-500'
                                  }`}
                                  title={`Platea 102 - Fila ${i + 1}, Asiento ${j + 1} - $400.700`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-cyan-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-cyan-800">PLATEA 103</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-103-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 103', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 400700 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-cyan-400 hover:bg-cyan-500'
                                  }`}
                                  title={`Platea 103 - Fila ${i + 1}, Asiento ${j + 1} - $400.700`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-yellow-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-yellow-800">PLATEA 104</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-104-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 104', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 340600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-yellow-400 hover:bg-yellow-500'
                                  }`}
                                  title={`Platea 104 - Fila ${i + 1}, Asiento ${j + 1} - $340.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-yellow-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-yellow-800">PLATEA 105</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-105-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 105', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 340600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-yellow-400 hover:bg-yellow-500'
                                  }`}
                                  title={`Platea 105 - Fila ${i + 1}, Asiento ${j + 1} - $340.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-yellow-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-yellow-800">PLATEA 106</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 12 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 8 }, (_, j) => {
                              const seatId = `platea-106-${i}-${j}`
                              const seat = { id: seatId, section: 'PLATEA 106', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 340600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-yellow-400 hover:bg-yellow-500'
                                  }`}
                                  title={`Platea 106 - Fila ${i + 1}, Asiento ${j + 1} - $340.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Secciones derechas */}
                  <div className="flex flex-col gap-4">
                    <div className="text-center">
                      <div className="bg-green-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-green-800">201</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 6 }, (_, j) => {
                              const seatId = `201-${i}-${j}`
                              const seat = { id: seatId, section: '201', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 495000 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-green-400 hover:bg-green-500'
                                  }`}
                                  title={`201 - Fila ${i + 1}, Asiento ${j + 1} - $495.000`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-orange-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-orange-800">202</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 6 }, (_, j) => {
                              const seatId = `202-${i}-${j}`
                              const seat = { id: seatId, section: '202', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 353600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-orange-400 hover:bg-orange-500'
                                  }`}
                                  title={`202 - Fila ${i + 1}, Asiento ${j + 1} - $353.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="text-center">
                      <div className="bg-orange-100 px-3 py-1 rounded mb-2">
                        <span className="text-sm font-semibold text-orange-800">203</span>
                      </div>
                      <div className="flex flex-col gap-1">
                        {Array.from({ length: 8 }, (_, i) => (
                          <div key={i} className="flex gap-1">
                            {Array.from({ length: 6 }, (_, j) => {
                              const seatId = `203-${i}-${j}`
                              const seat = { id: seatId, section: '203', row: (i + 1).toString(), number: (j + 1).toString(), status: 'available' as const, price: 353600 }
                              const isSelected = selectedSeats.find(s => s.id === seatId)
                              return (
                                <button
                                  key={j}
                                  onClick={() => handleSeatClick(seat)}
                                  className={`w-3 h-3 rounded-full transition-all duration-200 hover:scale-125 ${
                                    isSelected ? 'bg-green-500' : 'bg-orange-400 hover:bg-orange-500'
                                  }`}
                                  title={`203 - Fila ${i + 1}, Asiento ${j + 1} - $353.600`}
                                />
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Sidebar derecho como en la imagen */}
        <div className="w-80 bg-white border-l border-gray-200 p-6">
          <div className="space-y-6">
            {/* Título principal */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Seleccione un asiento</h2>
              <p className="text-sm text-gray-600">Por favor, asegúrate de no dejar asientos aislados.</p>
            </div>

            {/* Rangos de precios */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Rangos de precios</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium">Tribuna Fan Sur</span>
                  </div>
                  <span className="font-bold text-green-600">$495.000</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-cyan-400 rounded-full"></div>
                    <span className="text-sm font-medium">Platea 101 - 103</span>
                  </div>
                  <span className="font-bold text-cyan-600">$400.700</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
                    <span className="text-sm font-medium">Platea 104 - 106</span>
                  </div>
                  <span className="font-bold text-yellow-600">$340.600</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
                    <span className="text-sm font-medium">SEGUNDO PISO 202 - 205/215 - 218</span>
                  </div>
                  <span className="font-bold text-orange-600">$353.600</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 bg-pink-400 rounded-full"></div>
                    <span className="text-sm font-medium">SEGUNDO PISO 206 - 214</span>
                  </div>
                  <span className="font-bold text-pink-600">$306.500</span>
                </div>
              </div>
            </div>

            {/* Información de gastos */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                El importe mostrado ya incluye un gasto de reserva de al menos $75.000.
              </p>
            </div>

            {/* Asientos seleccionados */}
            {selectedSeats.length > 0 && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-3">Asientos seleccionados:</h4>
                <div className="space-y-2">
                  {selectedSeats.map(seat => (
                    <div key={seat.id} className="flex justify-between items-center text-sm">
                      <span className="font-medium">{seat.section}-{seat.row}-{seat.number}</span>
                      <span className="font-semibold text-green-600">${seat.price?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subtotal */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">SUBTOTAL</span>
                <span className="text-2xl font-bold text-gray-800">
                  ${selectedSeats.reduce((total, seat) => total + (seat.price || 0), 0).toLocaleString()}
                </span>
              </div>
              
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
                disabled={selectedSeats.length === 0}
                onClick={handleContinue}
              >
                {selectedSeats.length > 0 ? 'Añadir al carrito' : 'Selecciona un asiento'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
