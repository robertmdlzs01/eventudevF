export interface AdminUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "organizer" | "user"
  status: "active" | "inactive" | "suspended"
  createdAt: string
  lastLogin: string
  is2FAEnabled: boolean
  twoFactorSecret: string
}

export interface AdminRole {
  id: string
  name: string
  description?: string
  permissions: string[]
  createdAt: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  eventCount: number
}

export interface AdminEvent {
  id: string
  title: string
  slug: string
  description?: string
  date: string
  location: string
  locationDisplay: string
  category: string
  categoryDisplay: string
  subcategory?: string
  organizer: string
  price: number
  capacity: number
  ticketsSold: number
  revenue: number
  views: number
  attendees: number
  status: "draft" | "published" | "cancelled"
  salesStartDate: string
  youtubeUrl?: string
  createdAt: string
  additionalData: Array<{
    key: string
    value: string
  }>
}

export interface AdminTicketType {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  remaining: number
  status: string
  eventId: string
  eventName: string
  createdAt: string
  isDefault: boolean
}

export interface AdminSale {
  id: string
  eventId: string
  eventTitle: string
  customerName: string
  customerEmail: string
  ticketType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  status: "completed" | "pending" | "cancelled"
  paymentMethod: string
  createdAt: string
}

export interface Event {
  id: string
  title: string
  slug: string
  description: string
  long_description?: string
  category?: {
    id: string
    name: string
  }
  date: string
  time: string
  venue?: string
  location: string
  price: number
  total_capacity: number
  sold: number
  status: "active" | "inactive" | "cancelled"
  image_url?: string
  image?: string
  video_url?: string
  gallery_images?: string[]
  organizer?: {
    id: string
    name: string
  }
  tags: string[]
  ticketTypes?: TicketType[]
  seatMapId?: string
  featured?: boolean
  // Campos personalizados para información del evento
  organizerName?: string
  organizerId?: string
  ageRestriction?: string
  alcoholSales?: boolean
  pregnantWomen?: boolean
  disabledAccess?: boolean
  accommodationType?: string
  pulepCode?: string
  externalFood?: boolean
  parking?: boolean
}

export interface TicketType {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  status: "active" | "inactive"
  benefits?: string[]
}

export interface Category {
  id: string
  name: string
  description: string
  eventCount: number
}

export interface Role {
  id: string
  name: string
  displayName: string
  description: string
  permissions: string[]
  userCount: number
}

export interface Ticket {
  id: string
  eventId: string
  eventTitle: string
  eventDate: string
  eventTime: string
  eventLocation: string
  ticketType: string
  price: number
  qrCode: string
  status: "pending" | "active" | "used" | "expired"
  purchaseDate: string
  activationTime: string
  expirationTime: string
  userId: string
  orderNumber: string
}

export interface QRCodeData {
  ticketId: string
  eventId: string
  userId: string
  timestamp: number
  hash: string
}
