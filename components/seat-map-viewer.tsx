"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ZoomIn, ZoomOut, RotateCcw, Users, DollarSign, Calendar, MapPin } from 'lucide-react'

interface Seat {
  id: string
  x: number
  y: number
  section: string
  row: string
  number: string
  price: number
  type: string
  status: 'available' | 'sold' | 'reserved' | 'blocked'
  soldAt?: string
  soldTo?: string
  reservedUntil?: string
  isWheelchairAccessible: boolean
  isHearingImpaired: boolean
  isRestrictedView: boolean
  hasExtraLegroom: boolean
  customPrice: boolean
  label: string
  displayLabel: string
  entrance?: string
}

interface Section {
  id: string
  name: string
  color: string
  price: number
  type: string
  capacity: number
  description: string
}

interface Stage {
  x: number
  y: number
  width: number
  height: number
  label: string
}

interface SeatMapViewerProps {
  seatMapData: {
    id: string
    eventId: string
    name: string
    seats: Seat[]
    sections: Section[]
    stage: Stage
    nonSellableElements: any[]
    layers: any[]
    metadata: {
      createdAt: string
      updatedAt: string
      createdBy: string
      version: number
      totalSeats: number
      totalSections: number
    }
    settings: {
      gridSize: number
      seatSize: number
      seatSpacing: number
      snapToGrid: boolean
      showGrid: boolean
    }
  }
  onSeatClick?: (seat: Seat) => void
  showStats?: boolean
  interactive?: boolean
}

export default function SeatMapViewer({ 
  seatMapData, 
  onSeatClick, 
  showStats = true, 
  interactive = true 
}: SeatMapViewerProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null)

  // Estadísticas del mapa
  const stats = {
    totalSeats: seatMapData.seats.length,
    availableSeats: seatMapData.seats.filter(seat => seat.status === 'available').length,
    soldSeats: seatMapData.seats.filter(seat => seat.status === 'sold').length,
    reservedSeats: seatMapData.seats.filter(seat => seat.status === 'reserved').length,
    blockedSeats: seatMapData.seats.filter(seat => seat.status === 'blocked').length,
    totalRevenue: seatMapData.seats
      .filter(seat => seat.status === 'sold')
      .reduce((sum, seat) => sum + seat.price, 0),
    occupancyRate: Math.round((seatMapData.seats.filter(seat => seat.status === 'sold').length / seatMapData.seats.length) * 100)
  }

  const getSeatColor = (seat: Seat) => {
    const section = seatMapData.sections.find(s => s.id === seat.section)
    const baseColor = section?.color || '#6B7280'
    
    switch (seat.status) {
      case 'sold':
        return '#EF4444' // Rojo para vendido
      case 'reserved':
        return '#F59E0B' // Amarillo para reservado
      case 'blocked':
        return '#9CA3AF' // Gris para bloqueado
      case 'available':
      default:
        return baseColor
    }
  }

  const getSeatIcon = (seat: Seat) => {
    if (seat.isWheelchairAccessible) return '♿'
    if (seat.hasExtraLegroom) return '★'
    if (seat.status === 'sold') return '✓'
    if (seat.status === 'reserved') return '⏰'
    if (seat.status === 'blocked') return '🚫'
    return seat.number
  }

  const handleSeatClick = (seat: Seat) => {
    if (!interactive) return
    
    setSelectedSeat(seat)
    if (onSeatClick) {
      onSeatClick(seat)
    }
  }

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 3))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1))
  const handleReset = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && interactive) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header con estadísticas */}
      {showStats && (
        <div className="bg-white border-b p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{seatMapData.name}</h2>
              <p className="text-sm text-gray-600">
                Creado: {new Date(seatMapData.metadata.createdAt).toLocaleDateString()} | 
                Versión: {seatMapData.metadata.version}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <span className="text-xs px-2">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Total</div>
                    <div className="text-lg font-bold">{stats.totalSeats}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Disponibles</div>
                    <div className="text-lg font-bold text-green-600">{stats.availableSeats}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Vendidos</div>
                    <div className="text-lg font-bold text-red-600">{stats.soldSeats}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div>
                    <div className="text-sm font-medium">Reservados</div>
                    <div className="text-lg font-bold text-yellow-600">{stats.reservedSeats}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">Ingresos</div>
                    <div className="text-lg font-bold text-green-600">
                      ${stats.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-sm font-medium">Ocupación</div>
                    <div className="text-lg font-bold text-blue-600">{stats.occupancyRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Área de dibujo principal */}
        <div className="flex-1 relative bg-gray-100">
          <div
            className="w-full h-full overflow-auto cursor-crosshair"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{
              cursor: interactive ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
          >
            {/* Lienzo con zoom y pan */}
            <div
              className="relative min-h-full min-w-full"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'top left',
                transition: 'transform 0.1s ease-out'
              }}
            >
              {/* Escenario */}
              <div
                className="absolute bg-gray-300 rounded-lg flex items-center justify-center text-gray-600 font-semibold text-lg shadow-lg"
                style={{
                  left: seatMapData.stage.x,
                  top: seatMapData.stage.y,
                  width: seatMapData.stage.width,
                  height: seatMapData.stage.height
                }}
              >
                {seatMapData.stage.label}
              </div>

              {/* Elementos no vendibles */}
              {seatMapData.nonSellableElements.map((element) => (
                <div
                  key={element.id}
                  className="absolute rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md"
                  style={{
                    left: element.x,
                    top: element.y,
                    width: element.width,
                    height: element.height,
                    backgroundColor: element.color
                  }}
                >
                  {element.label}
                </div>
              ))}

              {/* Asientos */}
              {seatMapData.seats.map((seat) => (
                <div
                  key={seat.id}
                  className={`absolute rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md hover:shadow-lg transition-all ${
                    interactive ? 'cursor-pointer' : ''
                  } ${selectedSeat?.id === seat.id ? 'ring-2 ring-blue-400' : ''}`}
                  style={{
                    left: seat.x,
                    top: seat.y,
                    width: seatMapData.settings.seatSize,
                    height: seatMapData.settings.seatSize,
                    backgroundColor: getSeatColor(seat)
                  }}
                  onClick={() => handleSeatClick(seat)}
                  title={`${seat.section} - Fila ${seat.row} - Asiento ${seat.number} - $${seat.price.toLocaleString()} - ${seat.status.toUpperCase()}`}
                >
                  {getSeatIcon(seat)}
                  
                  {/* Indicadores especiales */}
                  {seat.isWheelchairAccessible && (
                    <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-2 h-2 text-white" />
                    </div>
                  )}
                  {seat.hasExtraLegroom && (
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-xs">★</span>
                    </div>
                  )}
                </div>
              ))}

              {/* Grid de ayuda */}
              {seatMapData.settings.showGrid && (
                <div className="absolute inset-0 pointer-events-none">
                  <svg className="w-full h-full">
                    <defs>
                      <pattern id="grid" width={seatMapData.settings.gridSize} height={seatMapData.settings.gridSize} patternUnits="userSpaceOnUse">
                        <path d={`M ${seatMapData.settings.gridSize} 0 L 0 0 0 ${seatMapData.settings.gridSize}`} fill="none" stroke="#E5E7EB" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar derecho - Información del asiento seleccionado */}
        {selectedSeat && (
          <div className="w-80 bg-white border-l p-4 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg">Asiento {selectedSeat.row}{selectedSeat.number}</h3>
                <Badge 
                  variant={selectedSeat.status === 'available' ? 'default' : 
                          selectedSeat.status === 'sold' ? 'destructive' : 
                          selectedSeat.status === 'reserved' ? 'secondary' : 'outline'}
                >
                  {selectedSeat.status === 'available' ? 'Disponible' :
                   selectedSeat.status === 'sold' ? 'Vendido' :
                   selectedSeat.status === 'reserved' ? 'Reservado' : 'Bloqueado'}
                </Badge>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-sm font-medium">Sección</Label>
                  <div className="text-sm text-gray-600">{selectedSeat.section}</div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Precio</Label>
                  <div className="text-sm text-gray-600">${selectedSeat.price.toLocaleString()}</div>
                </div>

                {selectedSeat.soldAt && (
                  <div>
                    <Label className="text-sm font-medium">Vendido el</Label>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedSeat.soldAt).toLocaleString()}
                    </div>
                  </div>
                )}

                {selectedSeat.soldTo && (
                  <div>
                    <Label className="text-sm font-medium">Comprador</Label>
                    <div className="text-sm text-gray-600">{selectedSeat.soldTo}</div>
                  </div>
                )}

                {selectedSeat.reservedUntil && (
                  <div>
                    <Label className="text-sm font-medium">Reservado hasta</Label>
                    <div className="text-sm text-gray-600">
                      {new Date(selectedSeat.reservedUntil).toLocaleString()}
                    </div>
                  </div>
                )}

                {/* Características especiales */}
                {(selectedSeat.isWheelchairAccessible || selectedSeat.hasExtraLegroom || selectedSeat.isHearingImpaired) && (
                  <div>
                    <Label className="text-sm font-medium">Características</Label>
                    <div className="space-y-1">
                      {selectedSeat.isWheelchairAccessible && (
                        <div className="text-sm text-blue-600">♿ Accesible para silla de ruedas</div>
                      )}
                      {selectedSeat.hasExtraLegroom && (
                        <div className="text-sm text-green-600">★ Espacio extra para piernas</div>
                      )}
                      {selectedSeat.isHearingImpaired && (
                        <div className="text-sm text-purple-600">👂 Accesible para personas con discapacidad auditiva</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
