import { type TicketData, QRTicketGenerator } from "./qr-generator"

export interface EmailTicket extends TicketData {
  qrCode: string
}

export class EmailService {
  static async sendTicketEmail(
    customerEmail: string,
    customerName: string,
    tickets: TicketData[],
    purchaseId: string,
  ): Promise<boolean> {
    try {
      // Generar códigos QR para todos los boletos
      const emailTickets: EmailTicket[] = await Promise.all(
        tickets.map(async (ticket) => ({
          ...ticket,
          qrCode: await QRTicketGenerator.generateTicketQR(ticket),
        })),
      )

      // En una implementación real, aquí enviarías el email
      // usando un servicio como SendGrid, Nodemailer, etc.
      console.log("Sending email to:", customerEmail)
      console.log("Tickets:", emailTickets.length)

      // Simular envío de email
      await this.simulateEmailSend(customerEmail, customerName, emailTickets, purchaseId)

      return true
    } catch (error) {
      console.error("Error sending ticket email:", error)
      return false
    }
  }

  private static async simulateEmailSend(
    email: string,
    name: string,
    tickets: EmailTicket[],
    purchaseId: string,
  ): Promise<void> {
    // Simular delay de envío
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Log del contenido del email para debugging
    console.log(`
      📧 EMAIL ENVIADO A: ${email}
      👤 NOMBRE: ${name}
      🎫 BOLETOS: ${tickets.length}
      🆔 COMPRA: ${purchaseId}
      
      BOLETOS INCLUIDOS:
      ${tickets
        .map(
          (ticket) => `
        - ${ticket.ticketType} (${ticket.ticketId})
        - Evento: ${ticket.eventTitle}
        - Fecha: ${ticket.eventDate} ${ticket.eventTime}
        - Lugar: ${ticket.venue}
        - Precio: $${ticket.price.toLocaleString()}
        ${ticket.seatNumber ? `- Asiento: ${ticket.seatNumber}` : ""}
      `,
        )
        .join("\n")}
    `)
  }

  static generateEmailHTML(customerName: string, tickets: EmailTicket[], purchaseId: string): string {
    const firstTicket = tickets[0]

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tus Boletos - Eventu</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; }
          .header { background: linear-gradient(135deg, #ec4899, #8b5cf6); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .ticket { border: 2px dashed #e5e7eb; border-radius: 10px; padding: 20px; margin: 20px 0; }
          .qr-code { text-align: center; margin: 20px 0; }
          .qr-code img { max-width: 200px; height: auto; }
          .ticket-info { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
          .info-item { padding: 5px 0; }
          .label { font-weight: bold; color: #6b7280; }
          .value { color: #111827; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; }
          .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 5px; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎫 Tus Boletos Digitales</h1>
            <p>¡Gracias por tu compra, ${customerName}!</p>
          </div>
          
          <div class="content">
            <h2>Detalles de tu Compra</h2>
            <p><strong>ID de Compra:</strong> ${purchaseId}</p>
            <p><strong>Evento:</strong> ${firstTicket.eventTitle}</p>
            <p><strong>Fecha:</strong> ${new Date(firstTicket.eventDate).toLocaleDateString("es-ES")} a las ${firstTicket.eventTime}</p>
            <p><strong>Lugar:</strong> ${firstTicket.venue}</p>
            <p><strong>Boletos:</strong> ${tickets.length}</p>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong> Los códigos QR se activarán 2 horas antes del evento y serán válidos hasta 4 horas después del evento.
            </div>
            
            ${tickets
              .map(
                (ticket, index) => `
              <div class="ticket">
                <h3>Boleto #${index + 1} - ${ticket.ticketType}</h3>
                
                <div class="ticket-info">
                  <div class="info-item">
                    <div class="label">ID del Boleto:</div>
                    <div class="value">${ticket.ticketId}</div>
                  </div>
                  <div class="info-item">
                    <div class="label">Tipo:</div>
                    <div class="value">${ticket.ticketType}</div>
                  </div>
                  ${
                    ticket.seatNumber
                      ? `
                    <div class="info-item">
                      <div class="label">Asiento:</div>
                      <div class="value">${ticket.seatNumber}</div>
                    </div>
                  `
                      : ""
                  }
                  <div class="info-item">
                    <div class="label">Precio:</div>
                    <div class="value">$${ticket.price.toLocaleString()}</div>
                  </div>
                </div>
                
                <div class="qr-code">
                  <img src="${ticket.qrCode}" alt="Código QR del Boleto ${ticket.ticketId}" />
                  <p><small>Código QR - ${ticket.ticketId}</small></p>
                </div>
              </div>
            `,
              )
              .join("")}
          </div>
          
          <div class="footer">
            <p>Guarda este email y presenta los códigos QR en el evento.</p>
            <p>También puedes acceder a tus boletos desde tu cuenta en Eventu.</p>
            <p>© 2024 Eventu - Todos los derechos reservados</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
