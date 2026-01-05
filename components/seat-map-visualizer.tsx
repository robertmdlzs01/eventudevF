"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { MapPin, Users, Check } from "lucide-react"

interface Seat {
  id: number
  row: string
  number: number
  status: "available" | "reserved" | "occupied"
  price?: number
}

interface SeatMapVisualizerProps {
  seatMapId: number
  eventId: number
  maxSeats?: number
  onSeatsSelected?: (selectedSeats: Seat[], totalPrice: number) => void
}

export default function SeatMapVisualizer({
  seatMapId,
  eventId,
  maxSeats = 8,
  onSeatsSelected,
}: SeatMapVisualizerProps) {
  const { toast } = useToast()
  const [seatMap, setSeatMap] = useState<any>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSeatMap()
  }, [seatMapId])

  const loadSeatMap = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getSeatMap(seatMapId.toString())
      if (response.success && response.data) {
        setSeatMap(response.data)
        // Simular asientos disponibles
        const mockSeats: Seat[] = []
        for (let row = 1; row <= 10; row++) {
          for (let seat = 1; seat <= 15; seat++) {
            mockSeats.push({
              id: row * 100 + seat,
              row: String.fromCharCode(64 + row), // A, B, C, etc.
              number: seat,
              status: Math.random() > 0.3 ? "available" : "reserved",
              price: 50000 + Math.floor(Math.random() * 50000),
            })
          }
        }
        setSeats(mockSeats)
      }
    } catch (error) {
      console.error("Error loading seat map:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el mapa de asientos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeatClick = (seat: Seat) => {
    if (seat.status !== "available") return

    setSelectedSeats((prev) => {
      const isSelected = prev.find((s) => s.id === seat.id)
      if (isSelected) {
        return prev.filter((s) => s.id !== seat.id)
      } else {
        if (prev.length >= maxSeats) {
          toast({
            title: "Límite alcanzado",
            description: `Puedes seleccionar máximo ${maxSeats} asientos`,
            variant: "destructive",
          })
          return prev
        }
        return [...prev, seat]
      }
    })
  }

  const getSeatStatusColor = (seat: Seat) => {
    if (selectedSeats.find((s) => s.id === seat.id)) {
      return "bg-green-500 text-white"
    }
    switch (seat.status) {
      case "available":
        return "bg-gray-200 hover:bg-gray-300"
      case "reserved":
        return "bg-yellow-400"
      case "occupied":
        return "bg-red-400"
      default:
        return "bg-gray-200"
    }
  }

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0)

  const handleConfirmSelection = () => {
    if (onSeatsSelected) {
      onSeatsSelected(selectedSeats, totalPrice)
    }
    toast({
      title: "Asientos seleccionados",
      description: `${selectedSeats.length} asientos seleccionados por $${totalPrice.toLocaleString("es-CO")}`,
    })
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Cargando mapa de asientos...</p>
      </div>
    )
  }

  if (!seatMap) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No se pudo cargar el mapa de asientos</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información del mapa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {seatMap.name || "Mapa de Asientos"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Capacidad: {seatMap.total_capacity || seats.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-gray-200 rounded"></span>
              <span>Disponible</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-400 rounded"></span>
              <span>Reservado</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-400 rounded"></span>
              <span>Ocupado</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mapa de asientos */}
      <Card>
        <CardHeader>
          <CardTitle>Selecciona tus asientos</CardTitle>
          <p className="text-sm text-gray-600">
            Haz clic en los asientos disponibles para seleccionarlos (máximo {maxSeats})
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              {/* Escenario */}
              <div className="text-center mb-8">
                <div className="bg-gray-800 text-white py-4 px-8 rounded-lg inline-block">
                  <h3 className="font-bold">ESCENARIO</h3>
                </div>
              </div>

              {/* Asientos */}
              <div className="space-y-2">
                {Array.from(new Set(seats.map((s) => s.row))).map((row) => (
                  <div key={row} className="flex justify-center gap-1">
                    <div className="w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-600">
                      {row}
                    </div>
                    {seats
                      .filter((seat) => seat.row === row)
                      .map((seat) => (
                        <button
                          key={seat.id}
                          onClick={() => handleSeatClick(seat)}
                          disabled={seat.status !== "available"}
                          className={`w-8 h-8 rounded text-xs font-bold transition-colors ${getSeatStatusColor(
                            seat
                          )} ${seat.status === "available" ? "cursor-pointer" : "cursor-not-allowed"}`}
                          title={`${row}${seat.number} - $${seat.price?.toLocaleString("es-CO")}`}
                        >
                          {selectedSeats.find((s) => s.id === seat.id) ? (
                            <Check className="w-3 h-3 mx-auto" />
                          ) : (
                            seat.number
                          )}
                        </button>
                      ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de selección */}
      {selectedSeats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Asientos seleccionados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <Badge key={seat.id} variant="secondary">
                    {seat.row}{seat.number} - ${seat.price?.toLocaleString("es-CO")}
                  </Badge>
                ))}
              </div>
              <div className="flex justify-between items-center pt-4 border-t">
                <span className="font-semibold">
                  Total ({selectedSeats.length} asientos):
                </span>
                <span className="text-xl font-bold text-green-600">
                  ${totalPrice.toLocaleString("es-CO")}
                </span>
              </div>
              <Button onClick={handleConfirmSelection} className="w-full">
                Confirmar selección
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
