export interface EventCapacity {
  eventId: string
  totalCapacity: number
  digitalCapacity: number
  physicalCapacity: number
  digitalSold: number
  physicalSold: number
  reservedSlots: number
  availableDigital: number
  availablePhysical: number
  totalAvailable: number
}

export interface TicketSale {
  id: string
  eventId: string
  ticketType: "digital" | "physical"
  quantity: number
  customerEmail: string
  customerName: string
  saleChannel: "online" | "physical_store" | "box_office"
  timestamp: string
  status: "confirmed" | "pending" | "cancelled"
  tickets: TicketData[]
}

export interface TicketData {
  ticketId: string
  eventId: string
  eventTitle: string
  ticketType: "digital" | "physical"
  ticketCategory: string // VIP, General, etc.
  purchaseId: string
  customerEmail: string
  customerName: string
  seatNumber?: string
  price: number
  purchaseDate: string
  eventDate: string
  eventTime: string
  venue: string
  saleChannel: "online" | "physical_store" | "box_office"
  isActive: boolean
  activationTime?: string
  expirationTime?: string
  qrCode?: string
  physicalTicketNumber?: string
  isUsed: boolean
  usedAt?: string
  checkInLocation?: string
}

export class TicketManager {
  private static eventCapacities: Map<string, EventCapacity> = new Map()
  private static ticketSales: TicketSale[] = []
  private static allTickets: TicketData[] = []
  private static reservations: Map<
    string,
    {
      eventId: string
      ticketType: "digital" | "physical"
      quantity: number
      reservedAt: Date
      expiresAt: Date
    }
  > = new Map()

  // Inicializar capacidades de eventos
  static initializeEventCapacity(
    eventId: string,
    totalCapacity: number,
    digitalPercentage = 0.7, // 70% digital, 30% físico por defecto
  ): EventCapacity {
    const digitalCapacity = Math.floor(totalCapacity * digitalPercentage)
    const physicalCapacity = totalCapacity - digitalCapacity

    const capacity: EventCapacity = {
      eventId,
      totalCapacity,
      digitalCapacity,
      physicalCapacity,
      digitalSold: 0,
      physicalSold: 0,
      reservedSlots: 0,
      availableDigital: digitalCapacity,
      availablePhysical: physicalCapacity,
      totalAvailable: totalCapacity,
    }

    this.eventCapacities.set(eventId, capacity)
    return capacity
  }

  // Verificar disponibilidad antes de venta
  static checkAvailability(
    eventId: string,
    ticketType: "digital" | "physical",
    quantity: number,
  ): { available: boolean; message?: string; availableQuantity: number } {
    const capacity = this.eventCapacities.get(eventId)
    if (!capacity) {
      return { available: false, message: "Evento no encontrado", availableQuantity: 0 }
    }

    const availableQuantity = ticketType === "digital" ? capacity.availableDigital : capacity.availablePhysical

    if (quantity > availableQuantity) {
      return {
        available: false,
        message: `Solo quedan ${availableQuantity} boletos ${ticketType === "digital" ? "digitales" : "físicos"} disponibles`,
        availableQuantity,
      }
    }

    return { available: true, availableQuantity }
  }

  // Reservar boletos temporalmente (durante proceso de compra)
  static reserveTickets(
    eventId: string,
    ticketType: "digital" | "physical",
    quantity: number,
    reservationId?: string,
  ): boolean {
    const capacity = this.eventCapacities.get(eventId)
    if (!capacity) return false

    const availability = this.checkAvailability(eventId, ticketType, quantity)
    if (!availability.available) return false

    // Reservar temporalmente
    capacity.reservedSlots += quantity
    if (ticketType === "digital") {
      capacity.availableDigital -= quantity
    } else {
      capacity.availablePhysical -= quantity
    }
    capacity.totalAvailable -= quantity

    const resId = reservationId || `RES-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const reservedAt = new Date()
    const expiresAt = new Date(reservedAt.getTime() + 15 * 60 * 1000) // 15 minutes expiration

    this.reservations.set(resId, {
      eventId,
      ticketType,
      quantity,
      reservedAt,
      expiresAt,
    })

    this.eventCapacities.set(eventId, capacity)
    return true
  }

  // Confirmar venta y generar boletos
  static async confirmSale(
    eventId: string,
    eventTitle: string,
    ticketType: "digital" | "physical",
    ticketCategory: string,
    quantity: number,
    customerEmail: string,
    customerName: string,
    price: number,
    eventDate: string,
    eventTime: string,
    venue: string,
    saleChannel: "online" | "physical_store" | "box_office",
    reservationId: string,
  ): Promise<{ success: boolean; sale?: TicketSale; message?: string }> {
    const capacity = this.eventCapacities.get(eventId)
    if (!capacity) {
      return { success: false, message: "Evento no encontrado" }
    }

    const reservation = this.reservations.get(reservationId)
    if (
      !reservation ||
      reservation.eventId !== eventId ||
      reservation.ticketType !== ticketType ||
      reservation.quantity !== quantity
    ) {
      return { success: false, message: "Reserva no válida o expirada" }
    }

    // Generar boletos individuales
    const tickets: TicketData[] = []
    const purchaseId = `PUR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`

    for (let i = 0; i < quantity; i++) {
      const ticket = await this.generateTicket({
        eventId,
        eventTitle,
        ticketType,
        ticketCategory,
        purchaseId,
        customerEmail,
        customerName,
        price,
        eventDate,
        eventTime,
        venue,
        saleChannel,
      })
      tickets.push(ticket)
    }

    // Crear registro de venta
    const sale: TicketSale = {
      id: purchaseId,
      eventId,
      ticketType,
      quantity,
      customerEmail,
      customerName,
      saleChannel,
      timestamp: new Date().toISOString(),
      status: "confirmed",
      tickets,
    }

    // Actualizar capacidades
    capacity.reservedSlots -= quantity
    if (ticketType === "digital") {
      capacity.digitalSold += quantity
    } else {
      capacity.physicalSold += quantity
    }

    this.eventCapacities.set(eventId, capacity)
    this.ticketSales.push(sale)
    this.allTickets.push(...tickets)
    this.reservations.delete(reservationId)

    return { success: true, sale }
  }

  // Generar boleto individual
  private static async generateTicket(data: {
    eventId: string
    eventTitle: string
    ticketType: "digital" | "physical"
    ticketCategory: string
    purchaseId: string
    customerEmail: string
    customerName: string
    price: number
    eventDate: string
    eventTime: string
    venue: string
    saleChannel: "online" | "physical_store" | "box_office"
  }): Promise<TicketData> {
    const ticketId = this.generateTicketId(data.ticketType)
    const eventDateTime = new Date(`${data.eventDate} ${data.eventTime}`)

    // Activar 2 horas antes del evento
    const activationTime = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000)
    // Expirar 4 horas después del evento
    const expirationTime = new Date(eventDateTime.getTime() + 4 * 60 * 60 * 1000)

    const ticket: TicketData = {
      ticketId,
      eventId: data.eventId,
      eventTitle: data.eventTitle,
      ticketType: data.ticketType,
      ticketCategory: data.ticketCategory,
      purchaseId: data.purchaseId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      price: data.price,
      purchaseDate: new Date().toISOString(),
      eventDate: data.eventDate,
      eventTime: data.eventTime,
      venue: data.venue,
      saleChannel: data.saleChannel,
      isActive: false,
      activationTime: activationTime.toISOString(),
      expirationTime: expirationTime.toISOString(),
      isUsed: false,
    }

    // Generar código QR
    if (data.ticketType === "digital") {
      ticket.qrCode = await this.generateQRCode(ticket)
    } else {
      // Para boletos físicos, generar número de boleto físico
      ticket.physicalTicketNumber = this.generatePhysicalTicketNumber()
      ticket.qrCode = await this.generateQRCode(ticket)
    }

    return ticket
  }

  // Generar ID único para boleto
  private static generateTicketId(type: "digital" | "physical"): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    const prefix = type === "digital" ? "DIG" : "PHY"
    return `${prefix}-${timestamp}-${random}`
  }

  // Generar número de boleto físico
  private static generatePhysicalTicketNumber(): string {
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, "0")
    return `${timestamp}${random}`
  }

  // Generar código QR
  private static async generateQRCode(ticket: TicketData): Promise<string> {
    const qrData = {
      id: ticket.ticketId,
      event: ticket.eventId,
      type: ticket.ticketType,
      category: ticket.ticketCategory,
      purchase: ticket.purchaseId,
      channel: ticket.saleChannel,
      hash: this.generateSecurityHash(ticket),
      timestamp: Date.now(),
    }

    // En una implementación real, usar una librería de QR
    // Por ahora, retornamos los datos como string
    return JSON.stringify(qrData)
  }

  // Generar hash de seguridad
  private static generateSecurityHash(ticket: TicketData): string {
    const dataString = `${ticket.ticketId}-${ticket.eventId}-${ticket.purchaseId}-${ticket.customerEmail}-${ticket.saleChannel}`
    return btoa(dataString).substring(0, 16)
  }

  // Verificar boleto en check-in
  static verifyTicket(qrData: string): {
    valid: boolean
    ticket?: TicketData
    message: string
    canCheckIn: boolean
  } {
    try {
      const parsedData = JSON.parse(qrData)
      const ticket = this.allTickets.find((t) => t.ticketId === parsedData.id)

      if (!ticket) {
        return {
          valid: false,
          message: "Boleto no encontrado",
          canCheckIn: false,
        }
      }

      // Verificar hash de seguridad
      const expectedHash = this.generateSecurityHash(ticket)
      if (parsedData.hash !== expectedHash) {
        return {
          valid: false,
          ticket,
          message: "Boleto inválido o falsificado",
          canCheckIn: false,
        }
      }

      // Verificar si ya fue usado
      if (ticket.isUsed) {
        return {
          valid: true,
          ticket,
          message: "Este boleto ya fue utilizado",
          canCheckIn: false,
        }
      }

      // Verificar si está activo
      const now = new Date()
      const activationTime = new Date(ticket.activationTime!)
      const expirationTime = new Date(ticket.expirationTime!)

      if (now < activationTime) {
        return {
          valid: true,
          ticket,
          message: "Boleto aún no está activo",
          canCheckIn: false,
        }
      }

      if (now > expirationTime) {
        return {
          valid: true,
          ticket,
          message: "Boleto expirado",
          canCheckIn: false,
        }
      }

      return {
        valid: true,
        ticket,
        message: "Boleto válido",
        canCheckIn: true,
      }
    } catch (error) {
      return {
        valid: false,
        message: "Código QR inválido",
        canCheckIn: false,
      }
    }
  }

  // Realizar check-in
  static performCheckIn(
    ticketId: string,
    location: string,
  ): { success: boolean; ticket?: TicketData; message: string } {
    const ticket = this.allTickets.find((t) => t.ticketId === ticketId)

    if (!ticket) {
      return { success: false, message: "Boleto no encontrado" }
    }

    if (ticket.isUsed) {
      return { success: false, ticket, message: "Boleto ya utilizado" }
    }

    // Marcar como usado
    ticket.isUsed = true
    ticket.usedAt = new Date().toISOString()
    ticket.checkInLocation = location

    return { success: true, ticket, message: "Check-in exitoso" }
  }

  // Obtener estadísticas de evento
  static getEventStats(eventId: string): {
    capacity: EventCapacity | null
    totalSales: number
    digitalSales: number
    physicalSales: number
    checkIns: number
    revenue: number
  } {
    const capacity = this.eventCapacities.get(eventId)
    const eventTickets = this.allTickets.filter((t) => t.eventId === eventId)
    const checkIns = eventTickets.filter((t) => t.isUsed).length
    const revenue = eventTickets.reduce((sum, t) => sum + t.price, 0)

    return {
      capacity: capacity || null,
      totalSales: eventTickets.length,
      digitalSales: eventTickets.filter((t) => t.ticketType === "digital").length,
      physicalSales: eventTickets.filter((t) => t.ticketType === "physical").length,
      checkIns,
      revenue,
    }
  }

  // Obtener boletos por usuario
  static getUserTickets(userEmail: string): TicketData[] {
    return this.allTickets.filter((t) => t.customerEmail === userEmail)
  }

  // Obtener capacidad de evento
  static getEventCapacity(eventId: string): EventCapacity | null {
    return this.eventCapacities.get(eventId) || null
  }

  // Liberar reservas expiradas (llamar periódicamente)
  static releaseExpiredReservations(): void {
    const now = new Date()
    const expiredReservations: string[] = []

    // Find expired reservations
    for (const [reservationId, reservation] of this.reservations.entries()) {
      if (now > reservation.expiresAt) {
        expiredReservations.push(reservationId)

        // Release the reserved capacity
        const capacity = this.eventCapacities.get(reservation.eventId)
        if (capacity) {
          capacity.reservedSlots -= reservation.quantity
          if (reservation.ticketType === "digital") {
            capacity.availableDigital += reservation.quantity
          } else {
            capacity.availablePhysical += reservation.quantity
          }
          capacity.totalAvailable += reservation.quantity
          this.eventCapacities.set(reservation.eventId, capacity)
        }
      }
    }

    // Remove expired reservations
    expiredReservations.forEach((id) => this.reservations.delete(id))

    if (expiredReservations.length > 0) {
      console.log(`Released ${expiredReservations.length} expired reservations`)
    }
  }

  // Manually release a specific reservation
  static releaseReservation(reservationId: string): boolean {
    const reservation = this.reservations.get(reservationId)
    if (!reservation) return false

    const capacity = this.eventCapacities.get(reservation.eventId)
    if (capacity) {
      capacity.reservedSlots -= reservation.quantity
      if (reservation.ticketType === "digital") {
        capacity.availableDigital += reservation.quantity
      } else {
        capacity.availablePhysical += reservation.quantity
      }
      capacity.totalAvailable += reservation.quantity
      this.eventCapacities.set(reservation.eventId, capacity)
    }

    this.reservations.delete(reservationId)
    return true
  }

  // Get reservation info
  static getReservation(reservationId: string) {
    return this.reservations.get(reservationId) || null
  }

  // Start automatic cleanup interval
  static startReservationCleanup(intervalMinutes = 5): NodeJS.Timeout {
    return setInterval(
      () => {
        this.releaseExpiredReservations()
      },
      intervalMinutes * 60 * 1000,
    )
  }
}
