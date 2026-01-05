import React from 'react'
import SeatMapViewer from '@/components/seat-map-viewer'

interface SeatMapPageProps {
  params: {
    slug: string
  }
}

// Datos de ejemplo - en producción vendrían de la base de datos
const mockSeatMapData = {
  id: 'map-123',
  eventId: 'event-456',
  name: 'Mapa de Asientos - Teatro Principal',
  seats: [
    {
      id: 'seat-1',
      x: 100,
      y: 200,
      section: 'vip',
      row: 'A',
      number: '1',
      price: 500000,
      type: 'Seat',
      status: 'sold' as const,
      soldAt: '2024-01-15T10:30:00Z',
      soldTo: 'Juan Pérez',
      isWheelchairAccessible: false,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: true,
      customPrice: false,
      label: 'A1',
      displayLabel: 'A1'
    },
    {
      id: 'seat-2',
      x: 130,
      y: 200,
      section: 'vip',
      row: 'A',
      number: '2',
      price: 500000,
      type: 'Seat',
      status: 'available' as const,
      isWheelchairAccessible: false,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: true,
      customPrice: false,
      label: 'A2',
      displayLabel: 'A2'
    },
    {
      id: 'seat-3',
      x: 160,
      y: 200,
      section: 'vip',
      row: 'A',
      number: '3',
      price: 500000,
      type: 'Seat',
      status: 'reserved' as const,
      reservedUntil: '2024-01-20T18:00:00Z',
      isWheelchairAccessible: false,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: true,
      customPrice: false,
      label: 'A3',
      displayLabel: 'A3'
    },
    {
      id: 'seat-4',
      x: 100,
      y: 230,
      section: 'general',
      row: 'B',
      number: '1',
      price: 300000,
      type: 'Seat',
      status: 'available' as const,
      isWheelchairAccessible: true,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: false,
      customPrice: false,
      label: 'B1',
      displayLabel: 'B1'
    },
    {
      id: 'seat-5',
      x: 130,
      y: 230,
      section: 'general',
      row: 'B',
      number: '2',
      price: 300000,
      type: 'Seat',
      status: 'sold' as const,
      soldAt: '2024-01-14T15:45:00Z',
      soldTo: 'María García',
      isWheelchairAccessible: true,
      isHearingImpaired: false,
      isRestrictedView: false,
      hasExtraLegroom: false,
      customPrice: false,
      label: 'B2',
      displayLabel: 'B2'
    }
  ],
  sections: [
    {
      id: 'vip',
      name: 'VIP',
      color: '#EF4444',
      price: 500000,
      type: 'VIP',
      capacity: 0,
      description: 'Asientos VIP con vista privilegiada'
    },
    {
      id: 'general',
      name: 'General',
      color: '#6B7280',
      price: 300000,
      type: 'General',
      capacity: 0,
      description: 'Asientos generales'
    }
  ],
  stage: {
    x: 400,
    y: 100,
    width: 200,
    height: 80,
    label: 'ESCENARIO'
  },
  nonSellableElements: [
    {
      id: 'aisle-1',
      x: 250,
      y: 180,
      width: 50,
      height: 200,
      type: 'aisle',
      label: 'PASILLO',
      color: '#9CA3AF'
    }
  ],
  layers: [
    { id: 'seats', name: 'Asientos', visible: true, locked: false, order: 1, color: '#6B7280' },
    { id: 'stage', name: 'Escenario', visible: true, locked: false, order: 2, color: '#9CA3AF' },
    { id: 'elements', name: 'Elementos', visible: true, locked: false, order: 3, color: '#F59E0B' }
  ],
  metadata: {
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z',
    createdBy: 'admin',
    version: 2,
    totalSeats: 5,
    totalSections: 2
  },
  settings: {
    gridSize: 20,
    seatSize: 20,
    seatSpacing: 30,
    snapToGrid: true,
    showGrid: true
  }
}

export default function SeatMapPage({ params }: SeatMapPageProps) {
  const handleSeatClick = (seat: any) => {
    console.log('Asiento clickeado:', seat)
    // Aquí podrías abrir un modal con detalles del asiento
    // o redirigir a la compra del asiento
  }

  return (
    <div className="h-screen">
      <SeatMapViewer 
        seatMapData={mockSeatMapData}
        onSeatClick={handleSeatClick}
        showStats={true}
        interactive={true}
      />
    </div>
  )
}

