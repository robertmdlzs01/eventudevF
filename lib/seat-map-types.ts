export interface Seat {
  id: string
  row: string
  number: number
  x: number
  y: number
  status: "available" | "selected" | "occupied" | "reserved" | "blocked"
  price: number
  type: "regular" | "vip" | "accessible" | "premium"
  sectionId: string
  // Nuevas propiedades para funcionalidades avanzadas
  isWheelchairAccessible?: boolean
  hasExtraLegroom?: boolean
  isAisleSeat?: boolean
  isWindowSeat?: boolean
  reservationExpiry?: Date
  reservedBy?: string
  category?: "economy" | "business" | "first"
}

export interface SeatMapSection {
  id: string
  name: string
  type: "seats" | "boxes" | "tables" | "general" | "vip" | "accessible"
  x: number
  y: number
  width: number
  height: number
  capacity: number
  price: number
  color: string
  rows: number
  seatsPerRow: number
  seats: Seat[]
  isSelected?: boolean
  // Nuevas propiedades
  description?: string
  category?: "economy" | "business" | "first" | "vip"
  hasWheelchairAccess?: boolean
  isPremium?: boolean
  amenities?: string[]
  pricingTiers?: {
    [row: string]: number
  }
}

export interface SeatMapConfig {
  id: string
  eventId: string
  name: string
  // Nuevas propiedades para configuración avanzada
  venue: {
    name: string
    address: string
    capacity: number
    type: "theater" | "arena" | "stadium" | "conference" | "custom"
  }
  stage: {
    position: "front" | "center" | "back"
    width: number
    height: number
    name: string
  }
  pricing: {
    currency: string
    showPrices: boolean
    allowDiscounts: boolean
    discountCodes?: string[]
  }
  features: {
    allowSeatSelection: boolean
    allowGroupBooking: boolean
    maxSeatsPerBooking: number
    reservationTimeout: number // en minutos
    showSeatNumbers: boolean
    showRowNumbers: boolean
    allowZoom: boolean
    allowPan: boolean
  }
  // Nuevas propiedades para templates
  template?: {
    id: string
    name: string
    category: string
  }
}

// Nuevas interfaces para funcionalidades avanzadas
export interface SeatReservation {
  id: string
  seatId: string
  userId: string
  eventId: string
  expiresAt: Date
  status: "pending" | "confirmed" | "expired"
}

export interface SeatMapTemplate {
  id: string
  name: string
  description: string
  category: "theater" | "arena" | "stadium" | "conference" | "custom"
  thumbnail: string
  config: Partial<SeatMapConfig>
  sections: Omit<SeatMapSection, "isSelected">[]
  popularity: number
  tags: string[]
}

export interface SeatMapAnalytics {
  totalSeats: number
  availableSeats: number
  occupiedSeats: number
  reservedSeats: number
  revenue: number
  occupancyRate: number
  popularSections: Array<{
    sectionId: string
    sectionName: string
    occupancyRate: number
    revenue: number
  }>
  salesByHour: Array<{
    hour: number
    sales: number
    revenue: number
  }>
}

export interface CreateSectionParams {
  name: string
  type: "seats" | "boxes" | "tables" | "general"
  x: number
  y: number
  width: number
  height: number
  capacity: number
  price: number
  color: string
  rows: number
  seatsPerRow: number
}

export interface SavedSeatMap {
  id: string
  eventId: string
  name: string
  config: SeatMapConfig
  lastSaved: Date
  autoSave: boolean
}
