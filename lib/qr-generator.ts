import QRCode from "qrcode"

export interface TicketData {
  ticketId: string
  eventId: string
  eventTitle: string
  ticketType: string
  purchaseId: string
  customerEmail: string
  customerName: string
  seatNumber?: string
  price: number
  purchaseDate: string
  eventDate: string
  eventTime: string
  venue: string
  isActive: boolean
  activationTime?: string
  expirationTime?: string
}

export class QRTicketGenerator {
  private static generateTicketId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `TKT-${timestamp}-${random}`
  }

  static async generateTicketQR(ticketData: TicketData): Promise<string> {
    // Crear datos seguros para el QR (sin información sensible)
    const qrData = {
      id: ticketData.ticketId,
      event: ticketData.eventId,
      type: ticketData.ticketType,
      purchase: ticketData.purchaseId,
      hash: this.generateSecurityHash(ticketData),
      timestamp: Date.now(),
    }

    try {
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      })

      return qrCodeDataURL
    } catch (error) {
      console.error("Error generating QR code:", error)
      throw new Error("Failed to generate QR code")
    }
  }

  private static generateSecurityHash(ticketData: TicketData): string {
    // Generar hash de seguridad basado en datos del boleto
    const dataString = `${ticketData.ticketId}-${ticketData.eventId}-${ticketData.purchaseId}-${ticketData.customerEmail}`
    return btoa(dataString).substring(0, 16)
  }

  static createTicket(
    eventId: string,
    eventTitle: string,
    ticketType: string,
    purchaseId: string,
    customerEmail: string,
    customerName: string,
    price: number,
    eventDate: string,
    eventTime: string,
    venue: string,
    seatNumber?: string,
  ): TicketData {
    const ticketId = this.generateTicketId()
    const eventDateTime = new Date(`${eventDate} ${eventTime}`)

    // Activar 2 horas antes del evento
    const activationTime = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000)

    // Expirar 4 horas después del evento
    const expirationTime = new Date(eventDateTime.getTime() + 4 * 60 * 60 * 1000)

    return {
      ticketId,
      eventId,
      eventTitle,
      ticketType,
      purchaseId,
      customerEmail,
      customerName,
      seatNumber,
      price,
      purchaseDate: new Date().toISOString(),
      eventDate,
      eventTime,
      venue,
      isActive: false,
      activationTime: activationTime.toISOString(),
      expirationTime: expirationTime.toISOString(),
    }
  }

  static isTicketActive(ticket: TicketData): boolean {
    const now = new Date()
    const activationTime = new Date(ticket.activationTime!)
    const expirationTime = new Date(ticket.expirationTime!)

    return now >= activationTime && now <= expirationTime
  }

  static getTicketStatus(ticket: TicketData): "pending" | "active" | "expired" {
    const now = new Date()
    const activationTime = new Date(ticket.activationTime!)
    const expirationTime = new Date(ticket.expirationTime!)

    if (now < activationTime) return "pending"
    if (now > expirationTime) return "expired"
    return "active"
  }
}
