"use server"

import { apiClient } from "../../lib/api-client"

export interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  status: string
  created_at: string
  lastLogin: string
}

export interface AdminEvent {
  id: string
  title: string
  slug: string
  description: string
  date: string
  time: string
  venue: string
  location: string
  locationDisplay: string
  category: string
  categoryDisplay: string
  status: "draft" | "published" | "cancelled"
  ticketsSold: number
  totalCapacity: number
  revenue: number
  createdAt: string
  organizer: string
  seatMapId?: string
  price: number
  capacity: number
  views: number
  attendees: number
  salesStartDate: string
  additionalData: { key: string; value: string; }[]
  paymentMethods?: {
    pse?: boolean
    credit_card?: boolean
    debit_card?: boolean
    daviplata?: boolean
    tc_serfinanza?: boolean
  }
  serviceFeeType?: "percentage" | "fixed"
  serviceFeeValue?: number
  serviceFeeDescription?: string
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
  ticketNumber: string
  eventName: string
  customerName: string
  customerEmail: string
  ticketType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentMethod: string
  status: string
  transactionType: string
  failureReason?: string
  abandonmentReason?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  purchaseDate: string
  transactionDate: string
  eventDate: string
}

export interface AdminTicket {
  id: string
  ticketNumber: string
  eventName: string
  customerName: string
  customerEmail: string
  ticketType: string
  price: number
  status: string
  purchaseDate: string
  eventDate: string
  qrCode: string
  usedAt: string
  sentAt: string
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  color: string
  eventCount: number
  status: "active" | "inactive"
  createdAt: string
  updatedAt: string
}

export interface AdminSeatMap {
  id: string
  name: string
  venueName: string
  totalCapacity: number
  mapData: any
  templateId?: string
  eventId?: string
  eventTitle?: string
  totalSeats: number
  availableSeats: number
  reservedSeats: number
  occupiedSeats: number
  createdAt: string
  updatedAt: string
}

export interface AuditLog {
  id: number
  user_id: number
  first_name: string
  last_name: string
  email: string
  action: string
  module: string
  description: string
  ip_address: string
  user_agent: string
  created_at: string
}


export interface AdminMedia {
  id: string
  name: string
  originalName?: string
  type: "image" | "video" | "audio" | "document"
  size: number
  url: string
  uploadDate: string
  alt?: string
  description?: string
  tags: string[]
  folder?: string
  lastUsed?: string
  usageCount?: number
}

export interface AdminMediaFolder {
  id: string
  name: string
  parentId?: string
  createdDate: string
  fileCount: number
}

export interface AdminAnalytics {
  totalRevenue: number
  monthlyRevenue: number
  activeEvents: number
  totalTicketsSold: number
  newUsers: number
  revenueGrowth: number
  eventsGrowth: number
  ticketsGrowth: number
  usersGrowth: number
}

export interface SalesReportFilters {
  startDate?: string
  endDate?: string
  eventId?: string
  categoryId?: string
  paymentMethod?: string
}

export interface AdminSalesReport {
  totalSales: number
  totalRevenue: number
  averageTicketPrice: number
  salesByChannel: Record<string, number>
  salesByPaymentMethod: Record<string, number>
  salesByEvent: Array<{
    eventId: string
    eventName: string
    sales: number
    revenue: number
  }>
  salesByDate: Array<{
    date: string
    sales: number
    revenue: number
  }>
  topSellingEvents: Array<{
    eventId: string
    eventName: string
    ticketsSold: number
    revenue: number
  }>
}

export interface EventsReportFilters {
  startDate?: string
  endDate?: string
  categoryId?: string
  status?: string
  organizerId?: string
}

export interface AdminEventsReport {
  totalEvents: number
  publishedEvents: number
  draftEvents: number
  cancelledEvents: number
  eventsByCategory: Array<{
    categoryId: string
    categoryName: string
    count: number
  }>
  eventsByStatus: Record<string, number>
  eventsByDate: Array<{
    date: string
    count: number
  }>
  topPerformingEvents: Array<{
    eventId: string
    eventName: string
    ticketsSold: number
    revenue: number
    attendance: number
  }>
  averageAttendance: number
}

export interface UsersReportFilters {
  startDate?: string
  endDate?: string
  role?: string
  status?: string
}

export interface AdminUsersReport {
  totalUsers: number
  newUsers: number
  activeUsers: number
  usersByRole: Record<string, number>
  usersByStatus: Record<string, number>
  usersByDate: Array<{
    date: string
    count: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    eventsCreated: number
    ticketsSold: number
  }>
  averageEventsPerUser: number
}

export interface AdminReport {
  id: string
  type: string
  title: string
  description: string
  data: any
  filters: any
  generatedAt: string
  downloadUrl: string
}

export interface AdminSavedReport {
  id: string
  name: string
  type: string
  description: string
  filters: any
  createdAt: string
  lastRun: string
  downloadUrl: string
}

export interface AdminDailySalesReport {
  todaySales: number
  todayRevenue: number
  yesterdaySales: number
  yesterdayRevenue: number
  weeklySales: Array<{
    date: string
    sales: number
    revenue: number
  }>
  dailyGrowth: number
  topProducts: Array<{
    eventId: string
    eventName: string
    sales: number
    revenue: number
  }>
  salesByHour: Array<{
    hour: number
    sales: number
    revenue: number
  }>
}

export interface AdminTopEventsReport {
  topByRevenue: Array<{
    eventId: string
    eventName: string
    revenue: number
    ticketsSold: number
  }>
  topByTickets: Array<{
    eventId: string
    eventName: string
    ticketsSold: number
    revenue: number
  }>
  topByAttendance: Array<{
    eventId: string
    eventName: string
    attendance: number
    capacity: number
  }>
  topByRating: Array<{
    eventId: string
    eventName: string
    rating: number
    reviews: number
  }>
  trendingEvents: Array<{
    eventId: string
    eventName: string
    trend: number
    category: string
  }>
  upcomingEvents: Array<{
    eventId: string
    eventName: string
    date: string
    ticketsSold: number
    capacity: number
  }>
}

export interface AdminTrendsReport {
  revenueTrend: Array<{
    period: string
    revenue: number
    growth: number
  }>
  salesTrend: Array<{
    period: string
    sales: number
    growth: number
  }>
  userGrowthTrend: Array<{
    period: string
    users: number
    growth: number
  }>
  eventCreationTrend: Array<{
    period: string
    events: number
    growth: number
  }>
  popularCategories: Array<{
    categoryId: string
    categoryName: string
    events: number
    revenue: number
  }>
  seasonalTrends: Array<{
    season: string
    revenue: number
    events: number
  }>
  marketInsights: Array<{
    insight: string
    impact: string
    recommendation: string
  }>
}

export interface AdminCompleteReport {
  executiveSummary: {
    totalRevenue: number
    totalEvents: number
    totalUsers: number
    growthRate: number
    keyHighlights: string[]
  }
  financialMetrics: {
    revenue: number
    expenses: number
    profit: number
    profitMargin: number
    averageTicketPrice: number
  }
  operationalMetrics: {
    eventsPublished: number
    eventsDraft: number
    eventsCancelled: number
    averageAttendance: number
    customerSatisfaction: number
  }
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newUsers: number
    userRetention: number
    averageEventsPerUser: number
  }
  eventMetrics: {
    totalEvents: number
    eventsByCategory: Record<string, number>
    eventsByStatus: Record<string, number>
    topPerformingEvents: Array<{
      eventId: string
      eventName: string
      performance: number
    }>
  }
  recommendations: Array<{
    category: string
    recommendation: string
    impact: string
    priority: 'high' | 'medium' | 'low'
  }>
  riskAnalysis: {
    risks: Array<{
      risk: string
      probability: number
      impact: string
      mitigation: string
    }>
    overallRisk: 'low' | 'medium' | 'high'
  }
  forecast: {
    nextMonthRevenue: number
    nextMonthEvents: number
    nextMonthUsers: number
    growthProjection: number
  }
}

export interface AdminSettings {
  id: string
  siteName: string
  siteDescription: string
  contactEmail: string
  supportEmail: string
  currency: string
  timezone: string
  maintenanceMode: boolean
  registrationEnabled: boolean
  emailNotifications: boolean
  smsNotifications: boolean
  maxTicketsPerPurchase: number
  commissionRate: number
  // Configuraciones de seguridad
  twoFactorAuth: boolean
  loginAttemptsLimit: boolean
  maxLoginAttempts: number
  lockoutDuration: number
  autoLogout: boolean
  sessionTimeout: number
  passwordMinLength: number
  passwordRequireUppercase: boolean
  passwordRequireLowercase: boolean
  passwordRequireNumbers: boolean
  passwordRequireSymbols: boolean
  activityLogging: boolean
  securityNotifications: boolean
  createdAt: string
  updatedAt: string
}

// Función para obtener usuarios desde la API
export async function getUsers(): Promise<AdminUser[]> {
  try {
    const response = await apiClient.getUsers()
    if (response.success && response.data) {
      return response.data.map((user: any) => ({
        id: user.id.toString(),
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        lastLogin: user.last_login || "Nunca",
      }))
    }
  } catch (error) {
    console.error('Error fetching users from backend:', error)
  }
  
  return []
}

// Función para obtener eventos desde la API
export async function getEvents(): Promise<AdminEvent[]> {
  try {
    const response = await apiClient.getEvents()
    if (response.success && response.data) {
      return response.data.map((event: any) => ({
        id: event.id.toString(),
        title: event.title,
        slug: event.slug || '',
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        location: event.location || '',
        locationDisplay: event.locationDisplay || event.location || 'Ubicación no especificada',
        category: event.category || "General",
        categoryDisplay: event.categoryDisplay || event.category || "General",
        status: event.status,
        ticketsSold: event.tickets_sold || 0,
        totalCapacity: event.total_capacity,
        revenue: event.revenue || 0,
        createdAt: event.created_at,
        organizer: event.organizer || "Sin organizador",
        seatMapId: event.seat_map_id?.toString(),
        price: parseFloat(event.price) || 0,
        capacity: parseInt(event.total_capacity) || 0,
        views: parseInt(event.views) || 0,
        attendees: parseInt(event.attendees) || 0,
        salesStartDate: event.sales_start_date || event.date,
        additionalData: event.additional_data || [],
      }))
    }
  } catch (error) {
    console.error('Error fetching events from backend:', error)
  }
  
  return []
}

// Función para obtener eventos del admin (alias de getEvents)
export async function getAdminEvents(): Promise<AdminEvent[]> {
  return getEvents()
}

// Función para obtener eventos disponibles para asignar a organizadores
export async function getEventsForOrganizers(): Promise<any[]> {
  try {
    // Usar la API pública de eventos que no requiere autenticación
    const response = await apiClient.getEvents()
    
    if (response.success && response.data) {
      return response.data.map((event: any) => ({
        id: event.id.toString(),
        title: event.title,
        date: event.date,
        venue: event.venue || event.location || 'Sin ubicación',
        status: event.status,
        category: event.category || 'Sin categoría',
        organizer_id: event.organizer_id
      }))
    }
  } catch (error) {
    console.error('Error fetching events for organizers:', error)
  }
  
  return []
}



// Función para obtener tipos de boletos desde la API
export async function getTicketTypes(): Promise<AdminTicketType[]> {
  try {
    const response = await apiClient.getTicketTypes()
    if (response.success && response.data) {
      return response.data.map((ticketType: any) => ({
        id: ticketType.id.toString(),
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price,
        quantity: ticketType.quantity,
        sold: ticketType.sold || 0,
        remaining: ticketType.remaining || 0,
        status: ticketType.status,
        eventId: ticketType.event_id?.toString() || '',
        eventName: ticketType.event_title || '',
        createdAt: ticketType.created_at,
        isDefault: ticketType.is_default || false,
      }))
    }
  } catch (error) {
    console.error('Error fetching ticket types from backend:', error)
  }
  
  return []
}

// Función para obtener tipos de boletos del admin (alias de getTicketTypes)
export async function getAdminTicketTypes(): Promise<AdminTicketType[]> {
  return getTicketTypes()
}

// Función para obtener tipos de boletos de un evento específico
export async function getEventTicketTypes(eventId: string): Promise<any[]> {
  try {
    const response = await apiClient.getEventTicketTypesByEvent(parseInt(eventId))
    if (response.success && response.data) {
      return response.data
    }
    return []
  } catch (error) {
    console.error('Error getting event ticket types:', error)
    return []
  }
}

// Función para crear tipo de boleto para un evento
export async function createEventTicketType(eventId: string, ticketTypeData: any): Promise<boolean> {
  try {
    const response = await apiClient.createEventTicketTypeByEvent(parseInt(eventId), ticketTypeData)
    return response.success
  } catch (error) {
    console.error('Error creating event ticket type:', error)
    return false
  }
}

// Función para actualizar tipo de boleto de un evento
export async function updateEventTicketType(ticketTypeId: string, ticketTypeData: any): Promise<boolean> {
  try {
    const response = await apiClient.updateEventTicketTypeByEvent(parseInt(ticketTypeId), ticketTypeData)
    return response.success
  } catch (error) {
    console.error('Error updating event ticket type:', error)
    return false
  }
}

// Función para eliminar tipo de boleto de un evento
export async function deleteEventTicketType(ticketTypeId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteEventTicketTypeByEvent(parseInt(ticketTypeId))
    return response.success
  } catch (error) {
    console.error('Error deleting event ticket type:', error)
    return false
  }
}



// Función para exportar datos
export async function exportData(exportData: any): Promise<any> {
  try {
    const response = await apiClient.exportData(exportData)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error exporting data:', error)
  }
  return null
}

// Función para obtener vista previa de boleto
export async function getTicketPreview(ticketId: string): Promise<any> {
  try {
    const response = await apiClient.getTicketPreview(ticketId)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error getting ticket preview:', error)
  }
  return null
}

// Función para obtener código QR
export async function getQRCode(ticketId: string): Promise<any> {
  try {
    const response = await apiClient.getQRCode(ticketId)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error getting QR code:', error)
  }
  return null
}

// Physical tickets functions
export async function getPhysicalTickets(params?: any): Promise<any> {
  try {
    const response = await apiClient.getPhysicalTickets(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching physical tickets:', error)
  }
  return { physicalTickets: [], pagination: null }
}

export async function createPhysicalTicketBatch(ticketData: any): Promise<boolean> {
  try {
    const response = await apiClient.createPhysicalTicketBatch(ticketData)
    return response.success
  } catch (error) {
    console.error('Error creating physical ticket batch:', error)
    return false
  }
}

export async function updatePhysicalTicketStatus(id: string, status: string): Promise<boolean> {
  try {
    const response = await apiClient.updatePhysicalTicketStatus(id, status)
    return response.success
  } catch (error) {
    console.error('Error updating physical ticket status:', error)
    return false
  }
}

export async function getSalesPoints(): Promise<any[]> {
  try {
    const response = await apiClient.getSalesPoints()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sales points:', error)
  }
  return []
}

// Virtual tickets functions
export async function getVirtualTickets(params?: any): Promise<any> {
  try {
    const response = await apiClient.getVirtualTickets(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching virtual tickets:', error)
  }
  return { virtualTickets: [], pagination: null }
}

export async function createVirtualTicket(ticketData: any): Promise<boolean> {
  try {
    const response = await apiClient.createVirtualTicket(ticketData)
    return response.success
  } catch (error) {
    console.error('Error creating virtual ticket:', error)
    return false
  }
}

export async function updateVirtualTicketStatus(id: string, status: string): Promise<boolean> {
  try {
    const response = await apiClient.updateVirtualTicketStatus(id, status)
    return response.success
  } catch (error) {
    console.error('Error updating virtual ticket status:', error)
    return false
  }
}

export async function resendVirtualTicket(id: string): Promise<boolean> {
  try {
    const response = await apiClient.resendVirtualTicket(id)
    return response.success
  } catch (error) {
    console.error('Error resending virtual ticket:', error)
    return false
  }
}



// Función para obtener ventas desde la API
export async function getSales(): Promise<AdminSale[]> {
  try {
    const response = await apiClient.getSales()
    if (response.success && response.data) {
      return response.data.map((sale: any) => ({
        id: sale.id.toString(),
        ticketNumber: sale.id.toString(), // Usar ID de venta como número de ticket
        eventName: sale.event_name,
        customerName: sale.buyer_name,
        customerEmail: sale.buyer_email,
        ticketType: sale.ticket_type_name,
        quantity: sale.quantity,
        unitPrice: sale.ticket_price,
        totalAmount: sale.total_amount,
        paymentMethod: sale.payment_method || 'online',
        status: sale.status,
        transactionType: sale.transaction_type || 'purchase',
        transactionDate: sale.transaction_date || sale.purchase_date,
        purchaseDate: sale.purchase_date,
        eventDate: sale.event_date,
      }))
    }
  } catch (error) {
    console.error('Error fetching sales from backend:', error)
  }
  
  return []
}

// Función para obtener estadísticas de ventas
export async function getSalesStats(): Promise<any> {
  try {
    const response = await apiClient.getSalesStats()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sales stats from backend:', error)
  }
  
  return null
}

// Función para registrar abandono de carrito
export async function recordCartAbandonment(cartData: {
  event_id: number
  ticket_type_id: number
  quantity: number
  buyer_name: string
  buyer_email: string
  total_amount: number
  session_id: string
  ip_address: string
  user_agent: string
  abandonment_reason?: string
}): Promise<any> {
  try {
    const response = await apiClient.recordCartAbandonment(cartData)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Error recording cart abandonment')
  } catch (error) {
    console.error('Error recording cart abandonment:', error)
    throw error
  }
}

// Función para registrar intento de pago
export async function recordPaymentAttempt(paymentData: {
  event_id: number
  ticket_type_id: number
  quantity: number
  buyer_name: string
  buyer_email: string
  total_amount: number
  payment_method: string
  session_id: string
  ip_address: string
  user_agent: string
  payment_gateway?: string
  gateway_transaction_id?: string
}): Promise<any> {
  try {
    const response = await apiClient.recordPaymentAttempt(paymentData)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Error recording payment attempt')
  } catch (error) {
    console.error('Error recording payment attempt:', error)
    throw error
  }
}

// Función para actualizar estado de intento de pago
export async function updatePaymentAttempt(saleId: string, updateData: {
  status: 'completed' | 'failed' | 'pending'
  failure_reason?: string
  gateway_response?: any
}): Promise<any> {
  try {
    const response = await apiClient.updatePaymentAttempt(saleId, updateData)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Error updating payment attempt')
  } catch (error) {
    console.error('Error updating payment attempt:', error)
    throw error
  }
}

// Función para crear una venta y generar boletas virtuales
export async function createSale(saleData: {
  event_id: number
  ticket_type_id: number
  quantity: number
  buyer_name: string
  buyer_email: string
  total_amount: number
  payment_method?: string
  seat_ids?: number[]
}): Promise<any> {
  try {
    const response = await apiClient.createSale(saleData)
    if (response.success && response.data) {
      return response.data
    }
    throw new Error(response.message || 'Error creating sale')
  } catch (error) {
    console.error('Error creating sale:', error)
    throw error
  }
}

// Función para obtener detalles de una venta
export async function getSaleDetails(saleId: string): Promise<any> {
  try {
    const response = await apiClient.getSaleDetails(saleId)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sale details:', error)
  }
  
  return null
}

// Función para cancelar una venta
export async function cancelSale(saleId: string, reason?: string): Promise<boolean> {
  try {
    const response = await apiClient.cancelSale(saleId, reason)
    return response.success
  } catch (error) {
    console.error('Error cancelling sale:', error)
    return false
  }
}

// Función para obtener categorías desde la API
export async function getCategories(): Promise<AdminCategory[]> {
  try {
    const response = await apiClient.getCategories()
    if (response.success && response.data) {
      return response.data.map((category: any) => ({
        id: category.id.toString(),
        name: category.name,
        slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
        description: category.description,
        icon: category.icon || "tag",
        color: category.color || "blue",
        eventCount: category.event_count || 0,
        status: category.status || "active",
        createdAt: category.created_at,
        updatedAt: category.updated_at,
      }))
    }
  } catch (error) {
    console.error('Error fetching categories from backend:', error)
  }
  
  return []
}

// Función para obtener categorías del admin (alias de getCategories)
export async function getAdminCategories(): Promise<AdminCategory[]> {
  return getCategories()
}

// ===== FUNCIONES DE DASHBOARD Y USUARIOS =====

// Función para obtener estadísticas del dashboard del administrador
export async function getAdminDashboardStats(): Promise<any> {
  try {
    const response = await apiClient.getAdminDashboardStats()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
  }
  
  return {
    stats: {
      totalUsers: 0,
      adminUsers: 0,
      organizerUsers: 0,
      regularUsers: 0,
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      cancelledEvents: 0,
      totalSales: 0,
      totalRevenue: 0,
      salesLast30Days: 0,
      revenueLast30Days: 0
    },
    growth: {
      newUsers30Days: 0,
      newEvents30Days: 0,
      newSales30Days: 0,
      newRevenue30Days: 0
    },
    recentEvents: [],
    recentSales: [],
    recentUsers: []
  }
}

// Función para obtener usuarios del administrador
export async function getAdminUsers(params?: {
  page?: number
  limit?: number
  role?: string
  status?: string
  search?: string
}): Promise<{ users: AdminUser[], pagination: any }> {
  try {
    // Refresh token before making the request
    apiClient.refreshToken()
    const response = await apiClient.getAdminUsers(params)
    if (response.success && response.data) {
      return {
        users: response.data.users.map((user: any) => ({
          id: user.id.toString(),
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          email: user.email,
          phone: user.phone || '',
          role: user.role,
          status: user.status,
          created_at: user.created_at,
          lastLogin: user.last_login || "Nunca",
          eventsCreated: user.events_created || 0,
          ticketsSold: user.tickets_purchased || 0,
          twoFactorAuthEnabled: false, // Por implementar
        })),
        pagination: response.data.pagination
      }
    }
  } catch (error) {
    console.error('Error fetching admin users:', error)
  }
  
  return {
    users: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      pages: 0
    }
  }
}

// Función para obtener logs de auditoría
export async function getAdminAuditLogs(params?: {
  page?: number
  limit?: number
  search?: string
  severity?: string
  status?: string
  action?: string
}): Promise<{ logs: any[], pagination: any }> {
  try {
    // Refresh token before making the request
    apiClient.refreshToken()
    const response = await apiClient.getAdminAuditLogs(params)
    if (response.success && response.data) {
      return {
        logs: response.data.logs,
        pagination: response.data.pagination
      }
    }
    return { logs: [], pagination: null }
  } catch (error: any) {
    console.error("Error fetching audit logs:", error)
    throw new Error(error.message || "Error al obtener logs de auditoría")
  }
}

// Función para obtener un usuario específico del administrador
export async function getAdminUser(id: string): Promise<AdminUser | null> {
  try {
    const response = await apiClient.getAdminUser(parseInt(id))
    if (response.success && response.data) {
      const user = response.data.user
      return {
        id: user.id.toString(),
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        lastLogin: user.last_login || "Nunca",
      }
    }  
  } catch (error) {
    console.error('Error fetching admin user:', error)
  }
  
  return null
}

// Función para actualizar un usuario del administrador
export async function updateAdminUser(userId: string, userData: Partial<AdminUser>): Promise<boolean> {
  try {
    const response = await apiClient.updateAdminUser(parseInt(userId), userData)
    return response.success
  } catch (error) {
    console.error('Error updating admin user:', error)
    return false
  }
}

// Función para eliminar un usuario del administrador
export async function deleteAdminUser(userId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteAdminUser(parseInt(userId))
    return response.success
  } catch (error) {
    console.error('Error deleting admin user:', error)
    return false
  }
}

// Función para actualizar usuario
export async function updateUser(userId: string, userData: Partial<AdminUser>): Promise<boolean> {
  try {
    const response = await apiClient.updateUser(parseInt(userId), userData)
    return response.success
  } catch (error) {
    console.error('Error updating user:', error)
    return false
  }
}

// Función para actualizar evento
export async function updateEvent(eventId: string, eventData: Partial<AdminEvent>): Promise<boolean> {
  try {
    const response = await apiClient.updateEvent(parseInt(eventId), eventData)
    return response.success
  } catch (error) {
    console.error('Error updating event:', error)
    return false
  }
}

// Función para actualizar tipo de boleto
export async function updateTicketType(ticketTypeId: string, ticketTypeData: Partial<AdminTicketType>): Promise<boolean> {
  try {
    const response = await apiClient.updateTicketType(parseInt(ticketTypeId), ticketTypeData)
    return response.success
  } catch (error) {
    console.error('Error updating ticket type:', error)
    return false
  }
}

// Función para obtener mapas de asientos desde la API
export async function getSeatMaps(): Promise<AdminSeatMap[]> {
  try {
    const response = await apiClient.getSeatMaps()
    if (response.success && response.data) {
      return response.data.map((seatMap: any) => ({
        id: seatMap.id.toString(),
        name: seatMap.name,
        venueName: seatMap.venue_name,
        totalCapacity: seatMap.total_capacity,
        mapData: seatMap.map_data,
        templateId: seatMap.template_id?.toString(),
        eventId: seatMap.event_id?.toString(),
        eventTitle: seatMap.event_title,
        totalSeats: seatMap.total_seats || 0,
        availableSeats: seatMap.available_seats || 0,
        reservedSeats: seatMap.reserved_seats || 0,
        occupiedSeats: seatMap.occupied_seats || 0,
        createdAt: seatMap.created_at,
        updatedAt: seatMap.updated_at,
      }))
    }
  } catch (error) {
    console.error('Error fetching seat maps from backend:', error)
  }
  
  return []
}

// Función para obtener un mapa de asientos específico
export async function getSeatMap(id: string): Promise<AdminSeatMap | null> {
  try {
    const response = await apiClient.getSeatMap(id)
    if (response.success && response.data) {
      const seatMap = response.data
      return {
        id: seatMap.id.toString(),
        name: seatMap.name,
        venueName: seatMap.venue_name,
        totalCapacity: seatMap.total_capacity,
        mapData: seatMap.map_data,
        templateId: seatMap.template_id?.toString(),
        eventId: seatMap.event_id?.toString(),
        eventTitle: seatMap.event_title,
        totalSeats: seatMap.total_seats || 0,
        availableSeats: seatMap.available_seats || 0,
        reservedSeats: seatMap.reserved_seats || 0,
        occupiedSeats: seatMap.occupied_seats || 0,
        createdAt: seatMap.created_at,
        updatedAt: seatMap.updated_at,
      }
    }
  } catch (error) {
    console.error('Error fetching seat map from backend:', error)
  }
  
  return null
}

// Función para crear mapa de asientos
export async function createSeatMap(seatMapData: Partial<AdminSeatMap>): Promise<boolean> {
  try {
    const response = await apiClient.createSeatMap(seatMapData)
    return response.success
  } catch (error) {
    console.error('Error creating seat map:', error)
    return false
  }
}

// Función para actualizar mapa de asientos
export async function updateSeatMap(seatMapId: string, seatMapData: Partial<AdminSeatMap>): Promise<boolean> {
  try {
    const response = await apiClient.updateSeatMap(seatMapId, seatMapData)
    return response.success
  } catch (error) {
    console.error('Error updating seat map:', error)
    return false
  }
}

// Función para eliminar mapa de asientos
export async function deleteSeatMap(seatMapId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteSeatMap(seatMapId)
    return response.success
  } catch (error) {
    console.error('Error deleting seat map:', error)
    return false
  }
}

// Función para obtener plantillas de mapas de asientos
export async function getSeatMapTemplates(): Promise<any[]> {
  try {
    const response = await apiClient.getSeatMapTemplates()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching seat map templates from backend:', error)
  }
  
  return []
}

// ===== CRUD DE EVENTOS =====

// Función para crear un evento
export async function createAdminEvent(formData: FormData): Promise<boolean> {
  try {
    console.log('🔄 Procesando datos del formulario...')
    
    // Obtener datos del formulario
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const shortDescription = formData.get('shortDescription') as string
    const date = formData.get('date') as string
    const time = formData.get('time') as string
    const endDate = formData.get('endDate') as string
    const endTime = formData.get('endTime') as string
    const location = formData.get('location') as string
    const address = formData.get('address') as string
    const city = formData.get('city') as string
    const category = formData.get('category') as string
    const organizerName = formData.get('organizerName') as string
    const organizerEmail = formData.get('organizerEmail') as string
    const organizerPhone = formData.get('organizerPhone') as string
    const status = formData.get('status') as string
    const featured = formData.get('featured') === 'true'
    const allowRefunds = formData.get('allowRefunds') === 'true'
    const refundPolicy = formData.get('refundPolicy') as string
    const ageRestriction = formData.get('ageRestriction') as string
    const dresscode = formData.get('dresscode') as string
    const tags = formData.get('tags') as string
    const mainImage = formData.get('mainImage') as string
    const videoUrl = formData.get('videoUrl') as string
    const galleryImages = formData.get('galleryImages') as string
    const socialLinks = formData.get('socialLinks') as string
    const ticketTypes = formData.get('ticketTypes') as string
    const customFields = formData.get('customFields') as string
    const serviceFeeType = formData.get('serviceFeeType') as string
    const serviceFeeValue = formData.get('serviceFeeValue') as string
    const serviceFeeDescription = formData.get('serviceFeeDescription') as string
    const paymentMethods = formData.get('paymentMethods') as string
    const maxSeatsPerPurchase = formData.get('maxSeatsPerPurchase') as string

    console.log('📋 Datos recibidos del formulario:')
    console.log('   - title:', title)
    console.log('   - description:', description)
    console.log('   - date:', date)
    console.log('   - time:', time)
    console.log('   - location:', location)
    console.log('   - category:', category)
    console.log('   - status:', status)

    // Validaciones básicas
    if (!title || title.trim() === '') {
      throw new Error('El título del evento es obligatorio')
    }

    if (!date || date.trim() === '') {
      throw new Error('La fecha del evento es obligatoria')
    }

    if (!time || time.trim() === '') {
      throw new Error('La hora del evento es obligatoria')
    }

    if (!location || location.trim() === '') {
      throw new Error('La ubicación del evento es obligatoria')
    }

    // Generar slug automáticamente
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    // Obtener categoría por nombre
    let category_id = 1 // Default
    if (category) {
      try {
        const categoriesResponse = await apiClient.getCategories()
        if (categoriesResponse.success && categoriesResponse.data) {
          const foundCategory = categoriesResponse.data.find((cat: any) => cat.name === category)
          if (foundCategory) {
            category_id = foundCategory.id
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener la categoría, usando default:', error)
      }
    }

    // Obtener organizador por email o usar default
    let organizer_id = 1 // Default
    if (organizerEmail) {
      try {
        const usersResponse = await apiClient.getUsers()
        if (usersResponse.success && usersResponse.data) {
          const foundUser = usersResponse.data.find((user: any) => user.email === organizerEmail)
          if (foundUser) {
            organizer_id = foundUser.id
          }
        }
      } catch (error) {
        console.warn('No se pudo obtener el organizador, usando default:', error)
      }
    }

    // Preparar datos para el backend
    const eventData = {
      title: title.trim(),
      slug: slug,
      description: description || shortDescription || '',
      long_description: description || '',
      date: date,
      time: time,
      venue: location || address || '',
      location: city || location || '',
      category_id: category_id,
      organizer_id: organizer_id,
      total_capacity: 100, // Default
      price: 0, // Default
      status: status || 'draft',
      featured: featured,
      // Campos adicionales
      sales_start_date: date,
      sales_end_date: endDate || date,
      youtube_url: videoUrl || '',
      image_url: mainImage || '',
      main_image_url: mainImage || '',
      video_url: videoUrl || '',
      gallery_images: galleryImages ? JSON.parse(galleryImages) : [],
      social_links: socialLinks ? JSON.parse(socialLinks) : {},
      // Campos de tarifa de servicio
      service_fee_type: serviceFeeType || 'percentage',
      service_fee_value: parseFloat(serviceFeeValue) || 5.00,
      service_fee_description: serviceFeeDescription || 'Tarifa de servicio',
      // Campos de métodos de pago
      payment_methods: paymentMethods ? JSON.parse(paymentMethods) : {
        pse: true,
        credit_card: true,
        debit_card: true,
        daviplata: true,
        tc_serfinanza: true,
      },
      // Configuración de asientos
      max_seats_per_purchase: parseInt(maxSeatsPerPurchase) || 4,
    }

    console.log('📤 Datos a enviar al backend:')
    console.log('   - title:', eventData.title)
    console.log('   - slug:', eventData.slug)
    console.log('   - date:', eventData.date)
    console.log('   - time:', eventData.time)
    console.log('   - category_id:', eventData.category_id)
    console.log('   - organizer_id:', eventData.organizer_id)
    console.log('   - status:', eventData.status)

    const response = await apiClient.createAdminEvent(eventData)
    
    if (response.success) {
      console.log('✅ Evento creado exitosamente')
      
      // Si hay tipos de boletos, crearlos
      if (ticketTypes) {
        try {
          const ticketTypesData = JSON.parse(ticketTypes)
          const eventId = response.data.id
          
          for (const ticketType of ticketTypesData) {
            await apiClient.createEventTicketTypeByEvent(eventId, {
              name: ticketType.name,
              description: ticketType.description,
              price: ticketType.price,
              quantity: ticketType.quantity,
              status: 'active'
            })
          }
          console.log('✅ Tipos de boletos creados')
        } catch (error) {
          console.warn('No se pudieron crear los tipos de boletos:', error)
        }
      }
    }
    
    return response.success
  } catch (error) {
    console.error('❌ Error creating event:', error)
    throw error // Re-lanzar el error para que el frontend lo maneje
  }
}

// Función para actualizar un evento
export async function updateAdminEvent(formData: FormData): Promise<boolean> {
  try {
    const eventId = formData.get('id') as string
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      long_description: formData.get('long_description') as string,
      date: formData.get('date') as string,
      time: formData.get('time') as string,
      venue: formData.get('venue') as string,
      location: formData.get('location') as string,
      category_id: parseInt(formData.get('category_id') as string),
      organizer_id: parseInt(formData.get('organizer_id') as string),
      total_capacity: parseInt(formData.get('total_capacity') as string),
      price: parseFloat(formData.get('price') as string),
      status: formData.get('status') as string,
      featured: formData.get('featured') === 'true',
      image_url: formData.get('image_url') as string,
      seat_map_id: formData.get('seat_map_id') ? parseInt(formData.get('seat_map_id') as string) : null,
    }

    const response = await apiClient.updateAdminEvent(parseInt(eventId), eventData)
    return response.success
  } catch (error) {
    console.error('Error updating event:', error)
    return false
  }
}

// Función para eliminar un evento
export async function deleteAdminEvent(formData: FormData): Promise<boolean> {
  try {
    const eventId = formData.get('id') as string
    const response = await apiClient.deleteAdminEvent(parseInt(eventId))
    return response.success
  } catch (error) {
    console.error('Error deleting event:', error)
    return false
  }
}

// Función para obtener un evento específico
export async function getAdminEvent(id: string): Promise<AdminEvent | null> {
  try {
    const response = await apiClient.getAdminEvent(parseInt(id))
    if (response.success && response.data) {
      const event = response.data
      return {
        id: event.id.toString(),
        title: event.title,
        slug: event.slug || '',
        description: event.description || '',
        date: event.date,
        time: event.time || '',
        venue: event.venue || '',
        location: event.location || '',
        locationDisplay: event.locationDisplay || 'Ubicación no especificada',
        category: event.category || 'Sin categoría',
        categoryDisplay: event.categoryDisplay || 'Sin categoría',
        organizer: event.organizer || 'Sin organizador',
        price: parseFloat(event.price) || 0,
        capacity: parseInt(event.capacity) || 0,
        totalCapacity: parseInt(event.capacity) || 0,
        ticketsSold: parseInt(event.ticketsSold) || 0,
        revenue: parseFloat(event.revenue) || 0,
        views: parseInt(event.views) || 0,
        attendees: parseInt(event.attendees) || 0,
        status: event.status || 'draft',
        salesStartDate: event.salesStartDate || event.date,
        createdAt: event.createdAt || new Date().toISOString(),
        additionalData: event.additionalData || []
      }
    }
  } catch (error) {
    console.error('Error fetching event from backend:', error)
  }
  
  return null
}

// Función para cambiar el estado de un evento (draft/published/cancelled)
export async function changeEventStatus(eventId: string, status: 'draft' | 'published' | 'cancelled'): Promise<boolean> {
  try {
    const response = await apiClient.updateAdminEventStatus(parseInt(eventId), status)
    return response.success
  } catch (error) {
    console.error('Error changing event status:', error)
    return false
  }
}

// ===== CRUD DE CATEGORÍAS =====

// Función para crear una categoría
export async function createAdminCategory(categoryData: Partial<AdminCategory>): Promise<boolean> {
  try {
    // TODO: Implementar cuando el método esté disponible
    // const response = await apiClient.createCategory(categoryData)
    console.log('createAdminCategory not implemented yet')
    return false
  } catch (error) {
    console.error('Error creating category:', error)
    return false
  }
}

// Función para actualizar una categoría
export async function updateAdminCategory(categoryId: string, categoryData: Partial<AdminCategory>): Promise<boolean> {
  try {
    // TODO: Implementar cuando el método esté disponible
    // const response = await apiClient.updateCategory(parseInt(categoryId), categoryData)
    console.log('updateAdminCategory not implemented yet')
    return false
  } catch (error) {
    console.error('Error updating category:', error)
    return false
  }
}

// Función para eliminar una categoría
export async function deleteAdminCategory(categoryId: string): Promise<boolean> {
  try {
    // TODO: Implementar cuando el método esté disponible
    // const response = await apiClient.deleteCategory(parseInt(categoryId))
    console.log('deleteAdminCategory not implemented yet')
    return false
  } catch (error) {
    console.error('Error deleting category:', error)
    return false
  }
}

// Función para obtener una categoría específica
export async function getAdminCategory(id: string): Promise<AdminCategory | null> {
  try {
    // TODO: Implementar cuando el método esté disponible
    // const response = await apiClient.getCategory(parseInt(id))
    console.log('getAdminCategory not implemented yet')
    return null
  } catch (error) {
    console.error('Error getting category:', error)
    return null
  }
}

// ===== CRUD DE TIPOS DE BOLETAS =====

// Función para crear un tipo de boleta
export async function createAdminTicketType(ticketTypeData: Partial<AdminTicketType>): Promise<boolean> {
  try {
    // TODO: Implementar cuando el método esté disponible
    // const response = await apiClient.createTicketType(ticketTypeData)
    console.log('createAdminTicketType not implemented yet')
    return false
  } catch (error) {
    console.error('Error creating ticket type:', error)
    return false
  }
}

// Función para actualizar un tipo de boleta
export async function updateAdminTicketType(ticketTypeId: string, ticketTypeData: Partial<AdminTicketType>): Promise<boolean> {
  try {
    const response = await apiClient.updateTicketType(parseInt(ticketTypeId), ticketTypeData)
    return response.success
  } catch (error) {
    console.error('Error updating ticket type:', error)
    return false
  }
}

// Función para eliminar un tipo de boleta
export async function deleteAdminTicketType(ticketTypeId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteTicketType(parseInt(ticketTypeId))
    return response.success
  } catch (error) {
    console.error('Error deleting ticket type:', error)
    return false
  }
}

// Función para obtener un tipo de boleta específico
export async function getAdminTicketType(id: string): Promise<AdminTicketType | null> {
  try {
    const response = await apiClient.getTicketType(parseInt(id))
    if (response.success && response.data) {
      const ticketType = response.data
      return {
        id: ticketType.id.toString(),
        name: ticketType.name,
        description: ticketType.description,
        price: ticketType.price || 0,
        quantity: ticketType.quantity || 0,
        sold: ticketType.sold || 0,
        remaining: ticketType.remaining || 0,
        status: ticketType.status || 'active',
        eventId: ticketType.event_id?.toString() || '',
        eventName: ticketType.event_title || '',
        createdAt: ticketType.created_at,
        isDefault: ticketType.is_default || false,
      }
    }
  } catch (error) {
    console.error('Error fetching ticket type from backend:', error)
  }
  
  return null
}

// ===== CRUD DE BOLETAS =====

// Función para obtener todas las ventas
export async function getAdminSales(): Promise<AdminSale[]> {
  try {
    const response = await apiClient.getAdminSales()
    if (response.success && response.data) {
      return response.data.sales.map((sale: any) => ({
        id: sale.id.toString(),
        ticketNumber: sale.id.toString(), // Usar ID como número de ticket
        eventName: sale.event_title || 'Evento sin nombre',
        customerName: `${sale.first_name} ${sale.last_name}`,
        customerEmail: sale.customer_email,
        ticketType: sale.ticket_type_name,
        quantity: sale.quantity,
        unitPrice: sale.total_amount / sale.quantity || 0,
        totalAmount: sale.total_amount,
        status: sale.status,
        purchaseDate: sale.created_at,
        eventDate: sale.event_date || sale.created_at,
        paymentMethod: sale.payment_method,
      }))
    }
  } catch (error) {
    console.error('Error fetching sales from backend:', error)
  }
  
  return []
}

// Función para obtener una venta específica
export async function getAdminSale(id: string): Promise<AdminSale | null> {
  try {
    const response = await apiClient.getAdminSale(parseInt(id))
    if (response.success && response.data) {
      const sale = response.data
      return {
        id: sale.id.toString(),
        ticketNumber: sale.id.toString(), // Usar ID como número de ticket
        eventName: sale.event_title || 'Evento sin nombre',
        customerName: `${sale.first_name} ${sale.last_name}`,
        customerEmail: sale.customer_email,
        ticketType: sale.ticket_type_name,
        quantity: sale.quantity,
        unitPrice: sale.total_amount / sale.quantity || 0,
        totalAmount: sale.total_amount,
        status: sale.status,
        transactionType: sale.transaction_type || 'purchase',
        transactionDate: sale.transaction_date || sale.created_at,
        purchaseDate: sale.created_at,
        eventDate: sale.event_date || sale.created_at,
        paymentMethod: sale.payment_method,
      }
    }
  } catch (error) {
    console.error('Error fetching sale from backend:', error)
  }
  
  return null
}

// Función para actualizar el estado de una venta
export async function updateAdminSaleStatus(saleId: string, status: string): Promise<boolean> {
  try {
    const response = await apiClient.updateAdminSaleStatus(parseInt(saleId), status)
    return response.success
  } catch (error) {
    console.error('Error updating sale status:', error)
    return false
  }
}

// Función para realizar check-in
export async function performCheckIn(saleId: string, checkInData: {
  operator: string
  gate?: string
  notes?: string
}): Promise<boolean> {
  try {
    const response = await apiClient.performCheckIn(parseInt(saleId), checkInData)
    return response.success
  } catch (error) {
    console.error('Error performing check-in:', error)
    return false
  }
}

// ===== GESTIÓN DE PAGOS =====

export async function getAdminPayments(): Promise<any[]> {
  try {
    const response = await apiClient.getPayments()
    if (response.success && response.data) {
      return response.data.map((payment: any) => ({
        id: payment.id.toString(),
        transactionId: payment.transaction_id || payment.id.toString(),
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.payment_method,
        customerName: payment.customer_name,
        customerEmail: payment.customer_email,
        eventTitle: payment.event_title,
        createdAt: payment.created_at,
        processedAt: payment.processed_at
      }))
    }
  } catch (error) {
    console.error('Error fetching payments from backend:', error)
  }
  
  return []
}

export async function getAdminPayment(id: string): Promise<any | null> {
  try {
    const response = await apiClient.getPaymentById(parseInt(id))
    if (response.success && response.data) {
      const payment = response.data
      return {
        id: payment.id.toString(),
        transactionId: payment.transaction_id || payment.id.toString(),
        amount: payment.amount,
        status: payment.status,
        paymentMethod: payment.payment_method,
        customerName: payment.customer_name,
        customerEmail: payment.customer_email,
        eventTitle: payment.event_title,
        createdAt: payment.created_at,
        processedAt: payment.processed_at
      }
    }
  } catch (error) {
    console.error('Error fetching payment from backend:', error)
  }
  
  return null
}

export async function processPayment(paymentData: {
  amount: number
  paymentMethod: string
  customerId: string
  eventId: string
  ticketTypeId: string
  quantity: number
}): Promise<boolean> {
  try {
    const response = await apiClient.processPayment(paymentData)
    return response.success
  } catch (error) {
    console.error('Error processing payment:', error)
    return false
  }
}

export async function cancelPayment(paymentId: string): Promise<boolean> {
  try {
    const response = await apiClient.cancelPayment(parseInt(paymentId))
    return response.success
  } catch (error) {
    console.error('Error canceling payment:', error)
    return false
  }
}

// ===== REPORTES AVANZADOS =====

// ===== 2FA (AUTENTICACIÓN DE DOS FACTORES) =====

export async function enable2FA(): Promise<any> {
  try {
    const response = await apiClient.enable2FA()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error enabling 2FA:', error)
  }
  
  return null
}

export async function verify2FACode(code: string): Promise<boolean> {
  try {
    const response = await apiClient.verify2FA(code)
    return response.success
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return false
  }
}

export async function disable2FA(code: string): Promise<boolean> {
  try {
    const response = await apiClient.disable2FA(code)
    return response.success
  } catch (error) {
    console.error('Error disabling 2FA:', error)
    return false
  }
}

export async function get2FAStatus(): Promise<any> {
  try {
    const response = await apiClient.get2FAStatus()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error getting 2FA status:', error)
  }
  
  return {
    enabled: false,
    configured: false
  }
}



// ===== REPORTES GUARDADOS =====

export async function getSavedReports(userId?: number): Promise<any[]> {
  try {
    const response = await apiClient.getSavedReports(userId)
    if (response.success && response.data) {
      return response.data.map((report: any) => ({
        id: report.id.toString(),
        name: report.name,
        description: report.description,
        type: report.type,
        filters: JSON.parse(report.filters || '{}'),
        schedule: JSON.parse(report.schedule || '{}'),
        lastRun: report.last_run,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
        createdBy: report.created_by
      }))
    }
  } catch (error) {
    console.error('Error fetching saved reports:', error)
  }
  
  return []
}

export async function saveReport(reportData: {
  name: string
  description?: string
  type: string
  filters?: any
  schedule?: any
}): Promise<boolean> {
  try {
    const response = await apiClient.saveReport(reportData)
    return response.success
  } catch (error) {
    console.error('Error saving report:', error)
    return false
  }
}

export async function updateSavedReport(id: string, reportData: {
  name: string
  description?: string
  filters?: any
  schedule?: any
}): Promise<boolean> {
  try {
    const response = await apiClient.updateSavedReport(parseInt(id), reportData)
    return response.success
  } catch (error) {
    console.error('Error updating saved report:', error)
    return false
  }
}

export async function deleteSavedReport(id: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteSavedReport(parseInt(id))
    return response.success
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return false
  }
}

export async function runSavedReport(id: string): Promise<any> {
  try {
    const response = await apiClient.runSavedReport(parseInt(id))
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error running saved report:', error)
  }
  
  return null
}

// ===== REPORTES PROGRAMADOS =====

export async function toggleScheduledReport(id: string, enabled: boolean): Promise<boolean> {
  try {
    const response = await apiClient.toggleScheduledReport(parseInt(id), enabled)
    return response.success
  } catch (error) {
    console.error('Error toggling scheduled report:', error)
    return false
  }
}

// ===== SISTEMA DE AUDITORÍA DE LOGS =====

export async function getAuditLogs(params?: {
  page?: number
  limit?: number
  user_id?: number
  action?: string
  module?: string
  start_date?: string
  end_date?: string
}): Promise<any[]> {
  try {
    const response = await apiClient.getAuditLogs(params)
    if (response.success && response.data) {
      // El API devuelve directamente un array de logs, no un objeto con auditLogs
      return (response.data as any[]).map((log: any) => ({
        id: log.id.toString(),
        userId: log.user_id,
        userName: `${log.first_name} ${log.last_name}`,
        userEmail: log.email,
        action: log.action,
        module: log.module,
        description: log.description,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        createdAt: log.created_at
      }))
    }
  } catch (error) {
    console.error('Error fetching audit logs:', error)
  }
  
  return []
}

export async function createAuditLog(auditData: {
  user_id: number
  action: string
  module: string
  description: string
  ip_address?: string
  user_agent?: string
}): Promise<boolean> {
  try {
    const response = await apiClient.createAuditLog(auditData)
    return response.success
  } catch (error) {
    console.error('Error creating audit log:', error)
    return false
  }
}

export async function exportAuditLogs(params?: {
  format?: string
  start_date?: string
  end_date?: string
}): Promise<boolean> {
  try {
    const response = await apiClient.exportAuditLogs(params)
    return response.success
  } catch (error) {
    console.error('Error exporting audit logs:', error)
    return false
  }
}

// ===== SISTEMA DE BACKUP AUTOMÁTICO =====

export async function getBackups(): Promise<any[]> {
  try {
    const response = await apiClient.getBackups()
    if (response.success && response.data) {
      // El API devuelve directamente un array de backups, no un objeto con backups
      return (response.data as any[]).map((backup: any) => ({
        id: backup.id.toString(),
        filename: backup.filename,
        size: backup.size,
        type: backup.type,
        status: backup.status,
        createdAt: backup.created_at,
        completedAt: backup.completed_at,
        createdBy: backup.created_by
      }))
    }
  } catch (error) {
    console.error('Error fetching backups:', error)
  }
  
  return []
}

export async function createBackup(backupData: {
  type?: string
  description?: string
}): Promise<boolean> {
  try {
    const response = await apiClient.createBackup(backupData)
    return response.success
  } catch (error) {
    console.error('Error creating backup:', error)
    return false
  }
}

export async function downloadBackup(id: string): Promise<boolean> {
  try {
    const response = await apiClient.downloadBackup(parseInt(id))
    return response.success
  } catch (error) {
    console.error('Error downloading backup:', error)
    return false
  }
}

export async function deleteBackup(id: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteBackup(parseInt(id))
    return response.success
  } catch (error) {
    console.error('Error deleting backup:', error)
    return false
  }
}

export async function scheduleBackup(scheduleData: {
  frequency: string
  time: string
  type?: string
  enabled?: boolean
}): Promise<boolean> {
  try {
    const response = await apiClient.scheduleBackup(scheduleData)
    return response.success
  } catch (error) {
    console.error('Error scheduling backup:', error)
    return false
  }
}

// ===== SISTEMA DE NOTIFICACIONES PUSH =====

export async function getNotifications(params?: {
  page?: number
  limit?: number
  unread_only?: boolean
}): Promise<any> {
  try {
    const response = await apiClient.getNotifications(params)
    if (response.success && response.data) {
      // El API devuelve un objeto con propiedades, no un array
      const data = response.data as any
      return {
        notifications: (data.notifications || []).map((notification: any) => ({
          id: notification.id.toString(),
          title: notification.title,
          message: notification.message,
          type: notification.type,
          data: JSON.parse(notification.data || '{}'),
          readAt: notification.read_at,
          createdAt: notification.created_at,
          updatedAt: notification.updated_at
        })),
        unreadCount: data.unreadCount || 0,
        pagination: data.pagination || {}
      }
    }
  } catch (error) {
    console.error('Error fetching notifications:', error)
  }
  
  return {
    notifications: [],
    unreadCount: 0,
    pagination: { page: 1, limit: 20, total: 0, pages: 0 }
  }
}

export async function createNotification(notificationData: {
  user_id: number
  title: string
  message: string
  type?: string
  data?: any
}): Promise<boolean> {
  try {
    const response = await apiClient.createNotification(notificationData)
    return response.success
  } catch (error) {
    console.error('Error creating notification:', error)
    return false
  }
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const response = await apiClient.markNotificationAsRead(parseInt(id))
    return response.success
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await apiClient.markAllNotificationsAsRead()
    return response.success
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

export async function deleteNotification(id: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteNotification(parseInt(id))
    return response.success
  } catch (error) {
    console.error('Error deleting notification:', error)
    return false
  }
}

export async function broadcastNotification(broadcastData: {
  title: string
  message: string
  type?: string
  data?: any
  user_roles?: string[]
}): Promise<boolean> {
  try {
    const response = await apiClient.broadcastNotification(broadcastData)
    return response.success
  } catch (error) {
    console.error('Error broadcasting notification:', error)
    return false
  }
}

// Función para obtener todas las boletas
export async function getAdminTickets(): Promise<AdminTicket[]> {
  try {
    const response = await apiClient.getTickets()
    if (response.success && response.data) {
      return response.data.map((ticket: any) => ({
        id: ticket.id.toString(),
        ticketNumber: ticket.ticket_number,
        eventName: ticket.event_name,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        ticketType: ticket.ticket_type,
        price: ticket.price,
        status: ticket.status,
        purchaseDate: ticket.purchase_date,
        eventDate: ticket.event_date,
        qrCode: ticket.qr_code,
        usedAt: ticket.used_at,
        sentAt: ticket.sent_at,
      }))
    }
  } catch (error) {
    console.error('Error fetching tickets from backend:', error)
  }
  
  return []
}

// Función para crear una boleta
export async function createAdminTicket(ticketData: Partial<AdminTicket>): Promise<boolean> {
  try {
    const response = await apiClient.createTicket(ticketData)
    return response.success
  } catch (error) {
    console.error('Error creating ticket:', error)
    return false
  }
}

// Función para actualizar una boleta
export async function updateAdminTicket(ticketId: string, ticketData: Partial<AdminTicket>): Promise<boolean> {
  try {
    const response = await apiClient.updateTicket(parseInt(ticketId), ticketData)
    return response.success
  } catch (error) {
    console.error('Error updating ticket:', error)
    return false
  }
}

// Función para eliminar una boleta
export async function deleteAdminTicket(ticketId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteTicket(parseInt(ticketId))
    return response.success
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return false
  }
}

// Función para obtener una boleta específica
export async function getAdminTicket(id: string): Promise<AdminTicket | null> {
  try {
    const response = await apiClient.getTicket(parseInt(id))
    if (response.success && response.data) {
      const ticket = response.data
      return {
        id: ticket.id.toString(),
        ticketNumber: ticket.ticket_number,
        eventName: ticket.event_name,
        customerName: ticket.customer_name,
        customerEmail: ticket.customer_email,
        ticketType: ticket.ticket_type,
        price: ticket.price,
        status: ticket.status,
        purchaseDate: ticket.purchase_date,
        eventDate: ticket.event_date,
        qrCode: ticket.qr_code,
        usedAt: ticket.used_at,
        sentAt: ticket.sent_at,
      }
    }
  } catch (error) {
    console.error('Error fetching ticket from backend:', error)
  }
  
  return null
}

// Función para validar una boleta (check-in)
export async function validateAdminTicket(ticketId: string): Promise<boolean> {
  try {
    const response = await apiClient.validateTicket(parseInt(ticketId))
    return response.success
  } catch (error) {
    console.error('Error validating ticket:', error)
    return false
  }
}

// Función para reenviar una boleta por email
export async function resendAdminTicket(ticketId: string): Promise<boolean> {
  try {
    const response = await apiClient.resendTicket(parseInt(ticketId))
    return response.success
  } catch (error) {
    console.error('Error resending ticket:', error)
    return false
  }
}

// ===== CRUD DE MEDIOS =====

// Función para obtener todos los medios
export async function getAdminMedia(): Promise<AdminMedia[]> {
  try {
    const response = await apiClient.getMedia()
    if (response.success && response.data) {
      return response.data.map((media: any) => ({
        id: media.id.toString(),
        name: media.name,
        originalName: media.original_name,
        type: media.type,
        size: media.size,
        url: media.url,
        uploadDate: media.upload_date,
        alt: media.alt,
        description: media.description,
        tags: media.tags || [],
        folder: media.folder,
        lastUsed: media.last_used,
        usageCount: media.usage_count || 0,
      }))
    }
  } catch (error) {
    console.error('Error fetching media from backend:', error)
  }
  
  return []
}

// Función para crear un medio
export async function createAdminMedia(mediaData: Partial<AdminMedia>): Promise<boolean> {
  try {
    const response = await apiClient.createMedia(mediaData)
    return response.success
  } catch (error) {
    console.error('Error creating media:', error)
    return false
  }
}

// Función para actualizar un medio
export async function updateAdminMedia(mediaId: string, mediaData: Partial<AdminMedia>): Promise<boolean> {
  try {
    const response = await apiClient.updateMedia(mediaId, mediaData)
    return response.success
  } catch (error) {
    console.error('Error updating media:', error)
    return false
  }
}

// Función para eliminar un medio
export async function deleteAdminMedia(mediaId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteMedia(mediaId)
    return response.success
  } catch (error) {
    console.error('Error deleting media:', error)
    return false
  }
}

// Función para obtener un medio específico
export async function getAdminMediaItem(id: string): Promise<AdminMedia | null> {
  try {
    const response = await apiClient.getMediaItem(parseInt(id))
    if (response.success && response.data) {
      const media = response.data
      return {
        id: media.id.toString(),
        name: media.name,
        originalName: media.original_name,
        type: media.type,
        size: media.size,
        url: media.url,
        uploadDate: media.upload_date,
        alt: media.alt,
        description: media.description,
        tags: media.tags || [],
        folder: media.folder,
        lastUsed: media.last_used,
        usageCount: media.usage_count || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching media from backend:', error)
  }
  
  return null
}

// Función para subir archivos
export async function uploadAdminMedia(files: FileList): Promise<AdminMedia[]> {
  try {
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }
    
    const response = await apiClient.uploadMedia(formData)
    if (response.success && response.data) {
      return response.data.map((media: any) => ({
        id: media.id.toString(),
        name: media.name,
        originalName: media.original_name,
        type: media.type,
        size: media.size,
        url: media.url,
        uploadDate: media.upload_date,
        alt: media.alt,
        description: media.description,
        tags: media.tags || [],
        folder: media.folder,
        lastUsed: media.last_used,
        usageCount: media.usage_count || 0,
      }))
    }
  } catch (error) {
    console.error('Error uploading media:', error)
  }
  
  return []
}

// Función para obtener carpetas de medios
export async function getAdminMediaFolders(): Promise<AdminMediaFolder[]> {
  try {
    const response = await apiClient.getMediaFolders()
    if (response.success && response.data) {
      return response.data.map((folder: any) => ({
        id: folder.id.toString(),
        name: folder.name,
        parentId: folder.parent_id?.toString(),
        createdDate: folder.created_date,
        fileCount: folder.file_count || 0,
      }))
    }
  } catch (error) {
    console.error('Error fetching media folders from backend:', error)
  }
  
  return []
}

// Función para crear una carpeta de medios
export async function createAdminMediaFolder(folderData: Partial<AdminMediaFolder>): Promise<boolean> {
  try {
    const response = await apiClient.createMediaFolder(folderData)
    return response.success
  } catch (error) {
    console.error('Error creating media folder:', error)
    return false
  }
}

// Función para eliminar una carpeta de medios
export async function deleteAdminMediaFolder(folderId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteMediaFolder(parseInt(folderId))
    return response.success
  } catch (error) {
    console.error('Error deleting media folder:', error)
    return false
  }
}

// ===== CRUD DE REPORTES Y ESTADÍSTICAS =====

// Función para obtener estadísticas generales
export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  try {
    const response = await apiClient.getAnalytics()
    if (response.success && response.data) {
      return {
        totalRevenue: response.data.total_revenue || 0,
        monthlyRevenue: response.data.monthly_revenue || 0,
        activeEvents: response.data.active_events || 0,
        totalTicketsSold: response.data.total_tickets_sold || 0,
        newUsers: response.data.new_users || 0,
        revenueGrowth: response.data.revenue_growth || 0,
        eventsGrowth: response.data.events_growth || 0,
        ticketsGrowth: response.data.tickets_growth || 0,
        usersGrowth: response.data.users_growth || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching analytics from backend:', error)
  }
  
  return {
    totalRevenue: 0,
    monthlyRevenue: 0,
    activeEvents: 0,
    totalTicketsSold: 0,
    newUsers: 0,
    revenueGrowth: 0,
    eventsGrowth: 0,
    ticketsGrowth: 0,
    usersGrowth: 0,
  }
}

// Función para obtener reporte de ventas
export async function getAdminSalesReport(filters?: SalesReportFilters): Promise<AdminSalesReport> {
  try {
    const response = await apiClient.getSalesReport(filters)
    if (response.success && response.data) {
      return {
        totalSales: response.data.total_sales || 0,
        totalRevenue: response.data.total_revenue || 0,
        averageTicketPrice: response.data.average_ticket_price || 0,
        salesByChannel: response.data.sales_by_channel || {},
        salesByPaymentMethod: response.data.sales_by_payment_method || {},
        salesByEvent: response.data.sales_by_event || [],
        salesByDate: response.data.sales_by_date || [],
        topSellingEvents: response.data.top_selling_events || [],
      }
    }
  } catch (error) {
    console.error('Error fetching sales report from backend:', error)
  }
  
  return {
    totalSales: 0,
    totalRevenue: 0,
    averageTicketPrice: 0,
    salesByChannel: {},
    salesByPaymentMethod: {},
    salesByEvent: [],
    salesByDate: [],
    topSellingEvents: [],
  }
}

// Función para obtener reporte de eventos
export async function getAdminEventsReport(filters?: EventsReportFilters): Promise<AdminEventsReport> {
  try {
    const response = await apiClient.getEventsReport(filters)
    if (response.success && response.data) {
      return {
        totalEvents: response.data.total_events || 0,
        publishedEvents: response.data.published_events || 0,
        draftEvents: response.data.draft_events || 0,
        cancelledEvents: response.data.cancelled_events || 0,
        eventsByCategory: response.data.events_by_category || [],
        eventsByStatus: response.data.events_by_status || {},
        eventsByDate: response.data.events_by_date || [],
        topPerformingEvents: response.data.top_performing_events || [],
        averageAttendance: response.data.average_attendance || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching events report from backend:', error)
  }
  
  return {
    totalEvents: 0,
    publishedEvents: 0,
    draftEvents: 0,
    cancelledEvents: 0,
    eventsByCategory: [],
    eventsByStatus: {},
    eventsByDate: [],
    topPerformingEvents: [],
    averageAttendance: 0,
  }
}

// Función para obtener reporte de usuarios
export async function getAdminUsersReport(filters?: UsersReportFilters): Promise<AdminUsersReport> {
  try {
    const response = await apiClient.getUsersReport(filters)
    if (response.success && response.data) {
      return {
        totalUsers: response.data.total_users || 0,
        newUsers: response.data.new_users || 0,
        activeUsers: response.data.active_users || 0,
        usersByRole: response.data.users_by_role || {},
        usersByStatus: response.data.users_by_status || {},
        usersByDate: response.data.users_by_date || [],
        topUsers: response.data.top_users || [],
        averageEventsPerUser: response.data.average_events_per_user || 0,
      }
    }
  } catch (error) {
    console.error('Error fetching users report from backend:', error)
  }
  
  return {
    totalUsers: 0,
    newUsers: 0,
    activeUsers: 0,
    usersByRole: {},
    usersByStatus: {},
    usersByDate: [],
    topUsers: [],
    averageEventsPerUser: 0,
  }
}

// Función para generar reporte personalizado
export async function generateAdminReport(reportType: string, filters?: any): Promise<AdminReport> {
  try {
    const response = await apiClient.generateReport({ type: reportType, filters })
    if (response.success && response.data) {
      return {
        id: response.data.id,
        type: response.data.type,
        title: response.data.title,
        description: response.data.description,
        data: response.data.data,
        filters: response.data.filters,
        generatedAt: response.data.generated_at,
        downloadUrl: response.data.download_url,
      }
    }
  } catch (error) {
    console.error('Error generating report from backend:', error)
  }
  
  return {
    id: '',
    type: '',
    title: '',
    description: '',
    data: {},
    filters: {},
    generatedAt: '',
    downloadUrl: '',
  }
}

// Función para exportar reporte
export async function exportAdminReport(reportId: string, format: 'pdf' | 'excel' | 'csv'): Promise<string> {
  try {
    const response = await apiClient.exportReport(parseInt(reportId), format)
    if (response.success && response.data) {
      return response.data.download_url
    }
  } catch (error) {
    console.error('Error exporting report from backend:', error)
  }
  
  return ''
}

// Función para obtener reportes guardados
export async function getAdminSavedReports(): Promise<AdminSavedReport[]> {
  try {
    const response = await apiClient.getSavedReports()
    if (response.success && response.data) {
      return response.data.map((report: any) => ({
        id: report.id.toString(),
        name: report.name,
        type: report.type,
        description: report.description,
        filters: report.filters,
        createdAt: report.created_at,
        lastRun: report.last_run,
        downloadUrl: report.download_url,
      }))
    }
  } catch (error) {
    console.error('Error fetching saved reports from backend:', error)
  }
  
  return []
}

// Función para guardar reporte
export async function saveAdminReport(reportData: Partial<AdminSavedReport>): Promise<boolean> {
  try {
    const response = await apiClient.saveReport(reportData)
    return response.success
  } catch (error) {
    console.error('Error saving report:', error)
    return false
  }
}

// Función para eliminar reporte guardado
export async function deleteAdminSavedReport(reportId: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteSavedReport(parseInt(reportId))
    return response.success
  } catch (error) {
    console.error('Error deleting saved report:', error)
    return false
  }
}

// ===== REPORTES RÁPIDOS =====

// Función para obtener reporte de ventas diarias
export async function getAdminDailySalesReport(): Promise<AdminDailySalesReport> {
  try {
    const response = await apiClient.getDailySalesReport()
    if (response.success && response.data) {
      return {
        todaySales: response.data.today_sales || 0,
        todayRevenue: response.data.today_revenue || 0,
        yesterdaySales: response.data.yesterday_sales || 0,
        yesterdayRevenue: response.data.yesterday_revenue || 0,
        weeklySales: response.data.weekly_sales || [],
        dailyGrowth: response.data.daily_growth || 0,
        topProducts: response.data.top_products || [],
        salesByHour: response.data.sales_by_hour || [],
      }
    }
  } catch (error) {
    console.error('Error fetching daily sales report from backend:', error)
  }
  
  return {
    todaySales: 0,
    todayRevenue: 0,
    yesterdaySales: 0,
    yesterdayRevenue: 0,
    weeklySales: [],
    dailyGrowth: 0,
    topProducts: [],
    salesByHour: [],
  }
}

// Función para obtener reporte de top eventos
export async function getAdminTopEventsReport(): Promise<AdminTopEventsReport> {
  try {
    const response = await apiClient.getTopEventsReport()
    if (response.success && response.data) {
      return {
        topByRevenue: response.data.top_by_revenue || [],
        topByTickets: response.data.top_by_tickets || [],
        topByAttendance: response.data.top_by_attendance || [],
        topByRating: response.data.top_by_rating || [],
        trendingEvents: response.data.trending_events || [],
        upcomingEvents: response.data.upcoming_events || [],
      }
    }
  } catch (error) {
    console.error('Error fetching top events report from backend:', error)
  }
  
  return {
    topByRevenue: [],
    topByTickets: [],
    topByAttendance: [],
    topByRating: [],
    trendingEvents: [],
    upcomingEvents: [],
  }
}

// Función para obtener reporte de tendencias
export async function getAdminTrendsReport(): Promise<AdminTrendsReport> {
  try {
    const response = await apiClient.getTrendsReport()
    if (response.success && response.data) {
      return {
        revenueTrend: response.data.revenue_trend || [],
        salesTrend: response.data.sales_trend || [],
        userGrowthTrend: response.data.user_growth_trend || [],
        eventCreationTrend: response.data.event_creation_trend || [],
        popularCategories: response.data.popular_categories || [],
        seasonalTrends: response.data.seasonal_trends || [],
        marketInsights: response.data.market_insights || [],
      }
    }
  } catch (error) {
    console.error('Error fetching trends report from backend:', error)
  }
  
  return {
    revenueTrend: [],
    salesTrend: [],
    userGrowthTrend: [],
    eventCreationTrend: [],
    popularCategories: [],
    seasonalTrends: [],
    marketInsights: [],
  }
}

// Función para obtener reporte completo
export async function getAdminCompleteReport(): Promise<AdminCompleteReport> {
  try {
    const response = await apiClient.getCompleteReport()
    if (response.success && response.data) {
      return {
        executiveSummary: response.data.executive_summary || {},
        financialMetrics: response.data.financial_metrics || {},
        operationalMetrics: response.data.operational_metrics || {},
        userMetrics: response.data.user_metrics || {},
        eventMetrics: response.data.event_metrics || {},
        recommendations: response.data.recommendations || [],
        riskAnalysis: response.data.risk_analysis || {},
        forecast: response.data.forecast || {},
      }
    }
  } catch (error) {
    console.error('Error fetching complete report from backend:', error)
  }
  
  return {
    executiveSummary: {
      totalRevenue: 0,
      totalEvents: 0,
      totalUsers: 0,
      growthRate: 0,
      keyHighlights: []
    },
    financialMetrics: {
      revenue: 0,
      expenses: 0,
      profit: 0,
      profitMargin: 0,
      averageTicketPrice: 0
    },
    operationalMetrics: {
      eventsPublished: 0,
      eventsDraft: 0,
      eventsCancelled: 0,
      averageAttendance: 0,
      customerSatisfaction: 0
    },
    userMetrics: {
      totalUsers: 0,
      activeUsers: 0,
      newUsers: 0,
      userRetention: 0,
      averageEventsPerUser: 0
    },
    eventMetrics: {
      totalEvents: 0,
      eventsByCategory: {},
      eventsByStatus: {},
      topPerformingEvents: []
    },
    recommendations: [],
    riskAnalysis: {
      risks: [],
      overallRisk: 'low'
    },
    forecast: {
      nextMonthRevenue: 0,
      nextMonthEvents: 0,
      nextMonthUsers: 0,
      growthProjection: 0
    },
  }
}

// ===== CRUD DE CONFIGURACIONES =====

// Función para obtener configuraciones del sistema
export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const response = await apiClient.getSettings()
    if (response.success && response.data) {
      return {
        id: response.data.id?.toString() || '1',
        siteName: response.data.site_name || 'Eventu',
        siteDescription: response.data.site_description || 'La mejor plataforma para eventos en Colombia',
        contactEmail: response.data.contact_email || 'contacto@eventu.com',
        supportEmail: response.data.support_email || 'soporte@eventu.com',
        currency: response.data.currency || 'COP',
        timezone: response.data.timezone || 'America/Bogota',
        maintenanceMode: response.data.maintenance_mode || false,
        registrationEnabled: response.data.registration_enabled || true,
        emailNotifications: response.data.email_notifications || true,
        smsNotifications: response.data.sms_notifications || false,
        maxTicketsPerPurchase: response.data.max_tickets_per_purchase || 10,
        commissionRate: response.data.commission_rate || 5,
        // Configuraciones de seguridad
        twoFactorAuth: response.data.two_factor_auth || false,
        loginAttemptsLimit: response.data.login_attempts_limit || true,
        maxLoginAttempts: response.data.max_login_attempts || 5,
        lockoutDuration: response.data.lockout_duration || 30,
        autoLogout: response.data.auto_logout || true,
        sessionTimeout: response.data.session_timeout || 60,
        passwordMinLength: response.data.password_min_length || 8,
        passwordRequireUppercase: response.data.password_require_uppercase || true,
        passwordRequireLowercase: response.data.password_require_lowercase || true,
        passwordRequireNumbers: response.data.password_require_numbers || true,
        passwordRequireSymbols: response.data.password_require_symbols || false,
        activityLogging: response.data.activity_logging || true,
        securityNotifications: response.data.security_notifications || true,
        createdAt: response.data.created_at || new Date().toISOString(),
        updatedAt: response.data.updated_at || new Date().toISOString(),
      }
    }
  } catch (error) {
    console.error('Error fetching settings from backend:', error)
  }
  
  return {
    id: '1',
    siteName: 'Eventu',
    siteDescription: 'La mejor plataforma para eventos en Colombia',
    contactEmail: 'contacto@eventu.com',
    supportEmail: 'soporte@eventu.com',
    currency: 'COP',
    timezone: 'America/Bogota',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    maxTicketsPerPurchase: 10,
    commissionRate: 5,
    // Configuraciones de seguridad por defecto
    twoFactorAuth: false,
    loginAttemptsLimit: true,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    autoLogout: true,
    sessionTimeout: 60,
    passwordMinLength: 8,
    passwordRequireUppercase: true,
    passwordRequireLowercase: true,
    passwordRequireNumbers: true,
    passwordRequireSymbols: false,
    activityLogging: true,
    securityNotifications: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

// Función para actualizar configuraciones del sistema
export async function updateAdminSettings(settingsData: Partial<AdminSettings>): Promise<boolean> {
  try {
    const response = await apiClient.updateSettings(settingsData)
    return response.success
  } catch (error) {
    console.error('Error updating settings:', error)
    return false
  }
}

// Función para obtener configuración específica
export async function getAdminSetting(key: string): Promise<any> {
  try {
    const response = await apiClient.getSetting(key)
    if (response.success && response.data) {
      return response.data.value
    }
  } catch (error) {
    console.error('Error fetching setting from backend:', error)
  }
  
  return null
}

// Función para actualizar configuración específica
export async function updateAdminSetting(key: string, value: any): Promise<boolean> {
  try {
    const response = await apiClient.updateSetting(key, value)
    return response.success
  } catch (error) {
    console.error('Error updating setting:', error)
    return false
  }
}

// Función para resetear configuraciones a valores por defecto
export async function resetAdminSettings(): Promise<boolean> {
  try {
    const response = await apiClient.resetSettings()
    return response.success
  } catch (error) {
    console.error('Error resetting settings:', error)
    return false
  }
}

// Función para exportar configuraciones
export async function exportAdminSettings(): Promise<string> {
  try {
    const response = await apiClient.exportSettings()
    if (response.success && response.data) {
      return response.data.download_url
    }
  } catch (error) {
    console.error('Error exporting settings:', error)
  }
  
  return ''
}

// Función para importar configuraciones
export async function importAdminSettings(file: File): Promise<boolean> {
  try {
    const response = await apiClient.importSettings(file)
    return response.success
  } catch (error) {
    console.error('Error importing settings:', error)
    return false
  }
}

// ===== FUNCIONES DE AUTENTICACIÓN DE DOS FACTORES =====

// Función para simular verificación de código 2FA
export async function simulate2FACodeVerification(code: string): Promise<boolean> {
  try {
    // Simulación de verificación de código 2FA
    // En producción, esto debería verificar contra el código real generado
    const validCodes = ['123456', '654321', '000000']
    return validCodes.includes(code)
  } catch (error) {
    console.error('Error verifying 2FA code:', error)
    return false
  }
}

// Función para alternar el estado de 2FA
export async function toggle2FAStatus(userId: string, enabled: boolean): Promise<boolean> {
  try {
    // Por ahora, simulamos la actualización
    // En producción, esto debería usar la API real
    console.log(`Simulando cambio de 2FA para usuario ${userId} a ${enabled}`)
    return true
  } catch (error) {
    console.error('Error toggling 2FA status:', error)
    return false
  }
}

// ===== REPORTES =====

// Reporte de Ventas
export async function getSalesReport(params?: {
  startDate?: string
  endDate?: string
  eventId?: string
  categoryId?: string
  paymentMethod?: string
}): Promise<any> {
  try {
    const response = await apiClient.getSalesReport(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sales report:', error)
  }
  return {
    stats: {
      totalSales: 0,
      totalRevenue: 0,
      averageTicketPrice: 0,
      uniqueCustomers: 0,
      eventsWithSales: 0
    },
    salesByPaymentMethod: [],
    salesByEvent: [],
    salesByDate: []
  }
}

// Reporte de Eventos
export async function getEventsReport(params?: {
  startDate?: string
  endDate?: string
  categoryId?: string
  status?: string
  organizerId?: string
}): Promise<any> {
  try {
    const response = await apiClient.getEventsReport(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching events report:', error)
  }
  return {
    stats: {
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      cancelledEvents: 0,
      uniqueOrganizers: 0
    },
    eventsByCategory: [],
    eventsByStatus: [],
    eventsByDate: [],
    topPerformingEvents: []
  }
}

// Reporte de Usuarios
export async function getUsersReport(params?: {
  startDate?: string
  endDate?: string
  role?: string
  status?: string
}): Promise<any> {
  try {
    const response = await apiClient.getUsersReport(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching users report:', error)
  }
  return {
    stats: {
      totalUsers: 0,
      adminUsers: 0,
      organizerUsers: 0,
      regularUsers: 0,
      activeUsers: 0,
      activeLast30Days: 0
    },
    usersByRole: [],
    usersByStatus: [],
    usersByDate: [],
    topUsers: []
  }
}

// Reporte Financiero
export async function getFinancialReport(params?: {
  startDate?: string
  endDate?: string
}): Promise<any> {
  try {
    const response = await apiClient.getFinancialReport(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching financial report:', error)
  }
  return {
    summary: {
      totalTransactions: 0,
      totalRevenue: 0,
      averageTransaction: 0,
      uniqueCustomers: 0,
      eventsWithRevenue: 0
    },
    revenueByMonth: [],
    revenueByDay: [],
    topEventsByRevenue: []
  }
}

// ===== ANALYTICS INTELIGENTE =====

// Análisis de Patrones de Ventas con IA
export async function getSalesPatterns(params?: {
  startDate?: string
  endDate?: string
  eventId?: string
}): Promise<any> {
  try {
    const response = await apiClient.getSalesPatterns(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sales patterns:', error)
  }
  return {
    hourlyAnalysis: {
      data: [],
      peakHour: { hour: 0, sales: 0, revenue: 0, formattedHour: '00:00' },
      lowHour: { hour: 0, sales: 0, revenue: 0, formattedHour: '00:00' },
      averages: { salesPerHour: 0, revenuePerHour: 0 }
    },
    dailyAnalysis: {
      data: [],
      bestDay: null,
      worstDay: null
    },
    trends: {
      morningTrend: 0,
      afternoonTrend: 0,
      eveningTrend: 0,
      nightTrend: 0
    },
    recommendations: [],
    summary: {
      totalSales: 0,
      totalRevenue: 0,
      totalHours: 24,
      dataPoints: 0
    }
  }
}

// ===== ACTIVITY DATA =====
// Obtener datos de actividad para gráficos
export async function getActivityData(days: number = 30): Promise<any> {
  try {
    const response = await apiClient.getActivityData(days)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching activity data:', error)
  }
  return {
    activityData: [],
    summary: {
      totalSales: 0,
      totalRevenue: 0,
      totalBuyers: 0,
      totalEvents: 0,
      averageSalesPerDay: 0,
      averageRevenuePerDay: 0
    }
  }
}

// ===== TRANSACTION DISTRIBUTION =====
// Obtener distribución de transacciones
export async function getTransactionDistribution(): Promise<any> {
  try {
    const response = await apiClient.getTransactionDistribution()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching transaction distribution:', error)
  }
  return {
    distribution: [],
    summary: {
      totalTransactions: 0,
      completedTransactions: 0,
      pendingTransactions: 0,
      failedTransactions: 0,
      abandonedTransactions: 0,
      conversionRate: 0,
      abandonmentRate: 0
    }
  }
}

// ===== HOURLY ACTIVITY =====
// Obtener datos de actividad por hora
export async function getHourlyActivity(): Promise<any> {
  try {
    const response = await apiClient.getHourlyActivity()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching hourly activity:', error)
  }
  return {
    hourlyData: [],
    summary: {
      totalSales: 0,
      totalRevenue: 0,
      totalEvents: 0,
      peakHour: {
        hour: '00:00',
        sales: 0,
        revenue: 0
      },
      lowHour: {
        hour: '00:00',
        sales: 0,
        revenue: 0
      },
      averages: {
        salesPerHour: 0,
        revenuePerHour: 0,
        eventsPerHour: 0
      }
    }
  }
}

// ===== ANALYTICS AVANZADOS =====

// Métricas de Rendimiento
export async function getPerformanceMetrics(params?: {
  period?: string
}): Promise<any> {
  try {
    const response = await apiClient.getPerformanceMetrics(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
  }
  return {
    conversion: {
      uniqueBuyers: 0,
      totalVisitors: 0,
      conversionRate: 0,
      totalTransactions: 0,
      avgTransactionsPerUser: 0
    },
    retention: {
      active7Days: 0,
      active30Days: 0,
      active90Days: 0
    },
    events: {
      totalEvents: 0,
      publishedEvents: 0,
      avgOccupancyRate: 0,
      avgTicketPrice: 0
    },
    financial: {
      totalRevenue: 0,
      avgTransactionValue: 0,
      totalTransactions: 0,
      revenuePerTransaction: 0
    }
  }
}

// Tendencias de Mercado
export async function getMarketTrends(params?: {
  period?: string
}): Promise<any> {
  try {
    const response = await apiClient.getMarketTrends(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching market trends:', error)
  }
  return {
    salesTrends: [],
    categoryTrends: [],
    priceTrends: [],
    userTrends: []
  }
}

// Análisis de Comportamiento
export async function getBehaviorAnalysis(params?: {
  period?: string
}): Promise<any> {
  try {
    const response = await apiClient.getBehaviorAnalysis(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching behavior analysis:', error)
  }
  return {
    purchasePatterns: [],
    dayPatterns: [],
    userBehavior: [],
    categoryPreferences: []
  }
}

// Predicciones de Ventas
export async function getSalesPredictions(params?: {
  days?: string
}): Promise<any> {
  try {
    const response = await apiClient.getSalesPredictions(params)
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching sales predictions:', error)
  }
  return {
    historicalData: [],
    trends: { growth: 0, trend: 'stable' },
    predictions: [],
    seasonality: [],
    summary: {
      currentTrend: 'stable',
      growthRate: 0,
      nextMonthPrediction: 0,
      confidence: 0
    }
  }
}

// ===== EXPORTACIÓN DE DATOS =====

// Exportar a PDF
export async function exportToPDF(data: {
  reportType: string
  filters?: any
  data: any
}): Promise<string> {
  try {
    const response = await apiClient.exportToPDF(data)
    if (response.success && response.data) {
      return response.data.downloadUrl
    }
  } catch (error) {
    console.error('Error exporting to PDF:', error)
  }
  return ''
}

// Exportar a Excel
export async function exportToExcel(data: {
  reportType: string
  filters?: any
  data: any
}): Promise<string> {
  try {
    const response = await apiClient.exportToExcel(data)
    if (response.success && response.data) {
      return response.data.downloadUrl
    }
  } catch (error) {
    console.error('Error exporting to Excel:', error)
  }
  return ''
}

// Exportar a CSV
export async function exportToCSV(data: {
  reportType: string
  filters?: any
  data: any
}): Promise<string> {
  try {
    const response = await apiClient.exportToCSV(data)
    if (response.success && response.data) {
      return response.data.downloadUrl
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error)
  }
  return ''
}

// Obtener Reportes Programados
export async function getScheduledReports(): Promise<any[]> {
  try {
    const response = await apiClient.getScheduledReports()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching scheduled reports:', error)
  }
  return []
}

// Crear Reporte Programado
export async function createScheduledReport(data: {
  name: string
  type: string
  format: string
  frequency: string
  recipients: string[]
  filters?: any
}): Promise<boolean> {
  try {
    const response = await apiClient.createScheduledReport(data)
    return response.success
  } catch (error) {
    console.error('Error creating scheduled report:', error)
    return false
  }
}

// Actualizar Reporte Programado
export async function updateScheduledReport(id: number, data: any): Promise<boolean> {
  try {
    const response = await apiClient.updateScheduledReport(id, data)
    return response.success
  } catch (error) {
    console.error('Error updating scheduled report:', error)
    return false
  }
}

// Eliminar Reporte Programado
export async function deleteScheduledReport(id: number): Promise<boolean> {
  try {
    const response = await apiClient.deleteScheduledReport(id)
    return response.success
  } catch (error) {
    console.error('Error deleting scheduled report:', error)
    return false
  }
}

// Crear Usuario Administrador
export async function createAdminUser(userData: {
  firstName: string
  lastName: string
  email: string
  password: string
  role: string
  phone?: string
  assignedEvents?: string[]
}): Promise<AdminUser> {
  try {
    const response = await apiClient.createAdminUser(userData)
    if (response.success && response.data) {
      const user = response.data.user
      
      // Si es organizador y tiene eventos asignados, asignarlos
      if (userData.role === 'organizer' && userData.assignedEvents && userData.assignedEvents.length > 0) {
        try {
          // Asignar eventos al organizador
          for (const eventId of userData.assignedEvents) {
            await apiClient.assignEventToOrganizer(parseInt(eventId), user.id)
          }
        } catch (assignError) {
          console.error('Error assigning events to organizer:', assignError)
          // No fallar la creación del usuario si falla la asignación de eventos
        }
      }
      
      return {
        id: user.id.toString(),
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        status: user.status,
        created_at: user.created_at,
        lastLogin: user.last_login || "Nunca",
      }
    }
    throw new Error('Error al crear el usuario')
  } catch (error) {
    console.error('Error creating admin user:', error)
    throw error
  }
}

// Obtener Roles de Administrador
export async function getAdminRoles(): Promise<any[]> {
  try {
    const response = await apiClient.getAdminRoles()
    if (response.success && response.data) {
      return response.data
    }
  } catch (error) {
    console.error('Error fetching admin roles:', error)
  }
  return []
}

// Crear Rol de Administrador
export async function createAdminRole(roleData: {
  name: string
  description?: string
  permissions: string[]
}): Promise<boolean> {
  try {
    const response = await apiClient.createAdminRole(roleData)
    return response.success
  } catch (error) {
    console.error('Error creating admin role:', error)
    return false
  }
}

// Actualizar Rol de Administrador
export async function updateAdminRole(id: string, roleData: {
  name: string
  description?: string
  permissions: string[]
}): Promise<boolean> {
  try {
    const response = await apiClient.updateAdminRole(id, roleData)
    return response.success
  } catch (error) {
    console.error('Error updating admin role:', error)
    return false
  }
}

// Eliminar Rol de Administrador
export async function deleteAdminRole(id: string): Promise<boolean> {
  try {
    const response = await apiClient.deleteAdminRole(id)
    return response.success
  } catch (error) {
    console.error('Error deleting admin role:', error)
    return false
  }
}
