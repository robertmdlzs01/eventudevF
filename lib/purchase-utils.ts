import { toast } from "sonner"

interface Purchase {
  id: string
  orderNumber: string
  eventName: string
  eventDate: string
  venue: string
  ticketType: string
  quantity: number
  unitPrice: number
  totalAmount: number
  paymentMethod: string
  status: string
  purchaseDate: string
  transactionId: string
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

export const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Función para descargar la factura como PDF
export const downloadInvoicePDF = async (purchase: Purchase) => {
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

    // Encabezado de la factura
    ctx.font = 'bold 24px Arial'
    ctx.fillText('FACTURA DE VENTA', 50, 50)

    // Información de la empresa
    ctx.font = '14px Arial'
    ctx.fillText('Eventu - Plataforma de Eventos', 50, 80)
    ctx.fillText('NIT: 900.123.456-7', 50, 100)
    ctx.fillText('Dirección: Calle 123 #45-67, Bogotá', 50, 120)
    ctx.fillText('Teléfono: +57 (1) 234-5678', 50, 140)

    // Línea separadora
    ctx.strokeStyle = '#e5e7eb'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(50, 160)
    ctx.lineTo(545, 160)
    ctx.stroke()

    // Información del cliente
    ctx.font = 'bold 16px Arial'
    ctx.fillText('INFORMACIÓN DEL CLIENTE', 50, 190)
    
    ctx.font = '14px Arial'
    ctx.fillText('Nombre: Usuario Eventu', 50, 220)
    ctx.fillText('Email: usuario@eventu.com', 50, 240)
    ctx.fillText('Documento: 12345678', 50, 260)

    // Información de la factura
    ctx.font = 'bold 16px Arial'
    ctx.fillText('INFORMACIÓN DE LA FACTURA', 300, 190)
    
    ctx.font = '14px Arial'
    ctx.fillText(`Número: ${purchase.orderNumber}`, 300, 220)
    ctx.fillText(`Fecha: ${formatDate(purchase.purchaseDate)}`, 300, 240)
    ctx.fillText(`Transacción: ${purchase.transactionId}`, 300, 260)

    // Información del evento
    ctx.font = 'bold 16px Arial'
    ctx.fillText('DETALLES DEL EVENTO', 50, 320)
    
    ctx.font = '14px Arial'
    ctx.fillText(`Evento: ${purchase.eventName}`, 50, 350)
    ctx.fillText(`Fecha: ${formatDate(purchase.eventDate)}`, 50, 370)
    ctx.fillText(`Lugar: ${purchase.venue}`, 50, 390)
    ctx.fillText(`Tipo: ${purchase.ticketType}`, 50, 410)

    // Tabla de productos
    ctx.font = 'bold 14px Arial'
    ctx.fillText('DESGLOSE DE PRODUCTOS', 50, 450)

    // Encabezados de la tabla
    const tableY = 480
    ctx.fillText('Descripción', 50, tableY)
    ctx.fillText('Cantidad', 200, tableY)
    ctx.fillText('Precio Unit.', 280, tableY)
    ctx.fillText('Total', 400, tableY)

    // Línea de la tabla
    ctx.strokeStyle = '#d1d5db'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(50, tableY + 10)
    ctx.lineTo(545, tableY + 10)
    ctx.stroke()

    // Fila del producto
    ctx.font = '12px Arial'
    ctx.fillText(`${purchase.ticketType} - ${purchase.eventName}`, 50, tableY + 30)
    ctx.fillText(purchase.quantity.toString(), 200, tableY + 30)
    ctx.fillText(formatPrice(purchase.unitPrice), 280, tableY + 30)
    ctx.fillText(formatPrice(purchase.unitPrice * purchase.quantity), 400, tableY + 30)

    // Totales
    const totalsY = tableY + 60
    ctx.font = '12px Arial'
    ctx.fillText('Subtotal:', 350, totalsY)
    ctx.fillText(formatPrice(purchase.unitPrice * purchase.quantity), 450, totalsY)
    
    ctx.fillText('IVA (19%):', 350, totalsY + 20)
    ctx.fillText(formatPrice(purchase.totalAmount * 0.19), 450, totalsY + 20)
    
    ctx.font = 'bold 14px Arial'
    ctx.fillText('TOTAL:', 350, totalsY + 50)
    ctx.fillText(formatPrice(purchase.totalAmount), 450, totalsY + 50)

    // Información de pago
    ctx.font = 'bold 14px Arial'
    ctx.fillText('INFORMACIÓN DE PAGO', 50, totalsY + 100)
    
    ctx.font = '12px Arial'
    ctx.fillText(`Método: ${purchase.paymentMethod}`, 50, totalsY + 120)
    ctx.fillText(`Estado: ${purchase.status.toUpperCase()}`, 50, totalsY + 140)

    // Pie de página
    ctx.font = '10px Arial'
    ctx.fillStyle = '#6b7280'
    ctx.fillText('Esta factura es válida para efectos tributarios', 50, 800)
    ctx.fillText('Eventu - Todos los derechos reservados', 50, 820)

    // Convertir canvas a imagen y descargar
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `factura-${purchase.orderNumber}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success("Factura descargada", {
          description: "La factura se ha descargado correctamente"
        })
      }
    }, 'image/png')

  } catch (error) {
    console.error('Error al descargar la factura:', error)
    toast.error("Error al descargar", {
      description: "No se pudo descargar la factura. Inténtalo de nuevo."
    })
  }
}

// Función para ver los boletos de una compra
export const viewPurchaseTickets = (purchase: Purchase) => {
  // Generar los números de boletos basados en la compra
  const tickets = []
  for (let i = 1; i <= purchase.quantity; i++) {
    tickets.push({
      id: `${purchase.id}-${i}`,
      ticketNumber: `${purchase.orderNumber}-${i.toString().padStart(3, '0')}`,
      eventName: purchase.eventName,
      eventDate: purchase.eventDate,
      venue: purchase.venue,
      ticketType: purchase.ticketType,
      price: purchase.unitPrice,
      status: purchase.status === "completed" ? "active" : "pending",
      purchaseDate: purchase.purchaseDate,
      qrCode: `qr-${purchase.orderNumber}-${i}`
    })
  }

  // Almacenar los boletos temporalmente para mostrarlos
  if (typeof window !== 'undefined') {
    localStorage.setItem('temp_tickets', JSON.stringify(tickets))
    localStorage.setItem('temp_purchase_info', JSON.stringify({
      orderNumber: purchase.orderNumber,
      eventName: purchase.eventName,
      totalAmount: purchase.totalAmount
    }))
  }

  toast.success("Boletos cargados", {
    description: `Se han cargado ${purchase.quantity} boletos para esta compra`
  })

  return tickets
}

// Función para compartir la compra
export const sharePurchase = async (purchase: Purchase) => {
  try {
    const shareData = {
      title: `Compra de boletos para ${purchase.eventName}`,
      text: `Compré ${purchase.quantity} boletos para ${purchase.eventName} el ${formatDate(purchase.eventDate)} en ${purchase.venue}`,
      url: `${window.location.origin}/mi-cuenta/historial-compras`
    }

    if (navigator.share && navigator.canShare(shareData)) {
      await navigator.share(shareData)
      toast.success("Compra compartida", {
        description: "La información de la compra se ha compartido correctamente"
      })
    } else {
      // Fallback: copiar al portapapeles
      await navigator.clipboard.writeText(
        `Compra de boletos para ${purchase.eventName}\n` +
        `Fecha del evento: ${formatDate(purchase.eventDate)}\n` +
        `Lugar: ${purchase.venue}\n` +
        `Cantidad: ${purchase.quantity} boletos\n` +
        `Total: ${formatPrice(purchase.totalAmount)}\n` +
        `Orden: ${purchase.orderNumber}\n` +
        `Ver detalles: ${window.location.origin}/mi-cuenta/historial-compras`
      )
      
      toast.success("Información copiada", {
        description: "La información de la compra se ha copiado al portapapeles"
      })
    }
  } catch (error) {
    console.error('Error al compartir la compra:', error)
    toast.error("Error al compartir", {
      description: "No se pudo compartir la información. Inténtalo de nuevo."
    })
  }
}

// Función para reenviar boletos de una compra por email
export const resendPurchaseTickets = async (purchase: Purchase) => {
  try {
    const response = await fetch('http://localhost:3002/api/tickets/resend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        saleId: purchase.id
      })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      toast.success("Boletos reenviados", {
        description: data.message || `Se han reenviado ${purchase.quantity} boletos a tu correo electrónico`
      })
    } else {
      throw new Error(data.message || 'Error en la respuesta del servidor')
    }
  } catch (error) {
    console.error('Error al reenviar los boletos:', error)
    toast.error("Error al reenviar", {
      description: error instanceof Error ? error.message : "No se pudieron reenviar los boletos. Inténtalo de nuevo."
    })
  }
}
