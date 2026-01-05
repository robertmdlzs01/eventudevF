import { toast } from "sonner"

interface Ticket {
  id: string
  ticketNumber: string
  eventName: string
  eventDate: string
  eventTime: string
  venue: string
  ticketType: string
  price: number
  status: string
  purchaseDate: string
  qrCode: string
  usedAt?: string
}

export const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP'
  }).format(price)
}

export const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string, time: string) => {
  const eventDate = new Date(`${date}T${time}`)
  return eventDate.toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para generar el código QR
export const generateQRCode = (ticketNumber: string, size: number = 200) => {
  const qrData = encodeURIComponent(JSON.stringify({
    ticketNumber,
    timestamp: new Date().toISOString()
  }))
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrData}`
}

// Función para descargar el boleto como PDF
export const downloadTicketPDF = async (ticket: Ticket) => {
  try {
    // Crear un canvas para generar el PDF
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No se pudo crear el contexto del canvas')

    // Configurar el tamaño del canvas (A4: 595x842 puntos)
    canvas.width = 595
    canvas.height = 842

    // Fondo blanco
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Configurar fuentes
    ctx.fillStyle = '#000000'
    ctx.textAlign = 'left'

    // Título principal
    ctx.font = 'bold 24px Arial'
    ctx.fillText('BOLETO DE EVENTO', 50, 50)

    // Línea separadora
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, 70)
    ctx.lineTo(545, 70)
    ctx.stroke()

    // Información del evento
    ctx.font = 'bold 18px Arial'
    ctx.fillText(ticket.eventName, 50, 110)

    ctx.font = '14px Arial'
    ctx.fillText(`Fecha: ${formatDateTime(ticket.eventDate, ticket.eventTime)}`, 50, 140)
    ctx.fillText(`Lugar: ${ticket.venue}`, 50, 160)
    ctx.fillText(`Tipo: ${ticket.ticketType}`, 50, 180)

    // Información del boleto
    ctx.font = 'bold 16px Arial'
    ctx.fillText('INFORMACIÓN DEL BOLETO', 50, 220)

    ctx.font = '14px Arial'
    ctx.fillText(`Número: ${ticket.ticketNumber}`, 50, 250)
    ctx.fillText(`Precio: ${formatPrice(ticket.price)}`, 50, 270)
    ctx.fillText(`Estado: ${ticket.status.toUpperCase()}`, 50, 290)
    ctx.fillText(`Comprado: ${formatDate(ticket.purchaseDate)}`, 50, 310)

    // Código QR (simulado con un rectángulo)
    const qrSize = 150
    const qrX = canvas.width - qrSize - 50
    const qrY = 350

    // Fondo del QR
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(qrX, qrY, qrSize, qrSize)

    // Borde del QR
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 2
    ctx.strokeRect(qrX, qrY, qrSize, qrSize)

    // Texto "QR Code"
    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('QR CODE', qrX + qrSize/2, qrY + qrSize/2)

    // Términos y condiciones
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('TÉRMINOS Y CONDICIONES', 50, 550)

    ctx.font = '10px Arial'
    const terms = [
      '• Este boleto es personal e intransferible',
      '• Debe presentarse con identificación válida',
      '• No se permiten reembolsos después del evento',
      '• El organizador se reserva el derecho de admisión'
    ]

    terms.forEach((term, index) => {
      ctx.fillText(term, 50, 580 + (index * 15))
    })

    // Convertir canvas a imagen y descargar
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `boleto-${ticket.ticketNumber}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success("Boleto descargado", {
          description: "El boleto se ha descargado correctamente"
        })
      }
    }, 'image/png')

  } catch (error) {
    console.error('Error al descargar el boleto:', error)
    toast.error("Error al descargar", {
      description: "No se pudo descargar el boleto. Inténtalo de nuevo."
    })
  }
}

// Función para reenviar el boleto por email
export const resendTicketEmail = async (ticket: Ticket) => {
  try {
    const response = await fetch('http://localhost:3002/api/tickets/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        ticketId: ticket.id
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success("Email reenviado", {
        description: data.message || "El boleto se ha reenviado a tu correo electrónico"
      })
    } else {
      throw new Error(data.message || 'Error en la respuesta del servidor')
    }
  } catch (error) {
    console.error('Error al reenviar el email:', error)
    toast.error("Error al reenviar", {
      description: error instanceof Error ? error.message : "No se pudo reenviar el boleto. Inténtalo de nuevo."
    })
  }
}

// Función para compartir el boleto
export const shareTicket = async (ticket: Ticket) => {
  try {
    const shareData = {
      title: `Boleto para ${ticket.eventName}`,
      text: `Tengo un boleto para ${ticket.eventName} el ${formatDateTime(ticket.eventDate, ticket.eventTime)} en ${ticket.venue}`,
      url: `${window.location.origin}/mi-cuenta/boletos`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData)
      toast.success("Boleto compartido", {
        description: "El boleto se ha compartido correctamente"
      })
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(
        `Boleto para ${ticket.eventName}\n` +
        `Fecha: ${formatDateTime(ticket.eventDate, ticket.eventTime)}\n` +
        `Lugar: ${ticket.venue}\n` +
        `Número: ${ticket.ticketNumber}\n` +
        `Ver detalles: ${window.location.origin}/mi-cuenta/boletos`
      )
      
      toast.success("Enlace copiado", {
        description: "La información del boleto se ha copiado al portapapeles"
      })
    }
  } catch (error) {
    console.error('Error al compartir el boleto:', error)
    toast.error("Error al compartir", {
      description: "No se pudo compartir el boleto. Inténtalo de nuevo."
    })
  }
}
