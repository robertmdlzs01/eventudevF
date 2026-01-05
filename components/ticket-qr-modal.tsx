"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  QrCode, 
  Download, 
  Share2,
  X,
  Calendar,
  MapPin,
  Clock
} from "lucide-react"
import { useState } from "react"

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

interface TicketQRModalProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

export function TicketQRModal({ ticket, isOpen, onClose }: TicketQRModalProps) {
  const [qrSize, setQrSize] = useState(200)

  if (!ticket) return null

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(price)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`)
    return eventDate.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800">Activo</Badge>
      case "used":
        return <Badge className="bg-gray-100 text-gray-800">Usado</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  // Generar URL del QR Code usando un servicio online (en producción usar una librería como qrcode)
  const generateQRCode = (ticketNumber: string, size: number = 200) => {
    const qrData = encodeURIComponent(JSON.stringify({
      ticketNumber,
      eventName: ticket.eventName,
      eventDate: ticket.eventDate,
      venue: ticket.venue,
      timestamp: new Date().toISOString()
    }))
    
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${qrData}`
  }

  const handleDownloadQR = () => {
    const qrUrl = generateQRCode(ticket.ticketNumber, 300)
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qr-${ticket.ticketNumber}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleShareQR = async () => {
    if (navigator.share) {
      try {
        const qrUrl = generateQRCode(ticket.ticketNumber, 300)
        await navigator.share({
          title: `QR Code - ${ticket.eventName}`,
          text: `Código QR para el evento: ${ticket.eventName}`,
          url: qrUrl
        })
      } catch (error) {
        console.log('Error sharing:', error)
      }
    } else {
      // Fallback: copiar al portapapeles
      const qrUrl = generateQRCode(ticket.ticketNumber, 300)
      navigator.clipboard.writeText(qrUrl)
      // Aquí podrías mostrar un toast de confirmación
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-xl font-bold">Código QR del Boleto</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Evento */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{ticket.eventName}</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <Calendar className="h-4 w-4" />
                {formatDateTime(ticket.eventDate, ticket.eventTime)}
              </div>
              <div className="flex items-center justify-center gap-2">
                <MapPin className="h-4 w-4" />
                {ticket.venue}
              </div>
            </div>
          </div>

          {/* Código QR */}
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 shadow-sm">
              <img
                src={generateQRCode(ticket.ticketNumber, qrSize)}
                alt={`QR Code para ${ticket.ticketNumber}`}
                className="mx-auto"
                width={qrSize}
                height={qrSize}
              />
            </div>
            
            {/* Controles de tamaño */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Tamaño:</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrSize(150)}
                className={qrSize === 150 ? "bg-blue-100" : ""}
              >
                Pequeño
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrSize(200)}
                className={qrSize === 200 ? "bg-blue-100" : ""}
              >
                Mediano
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrSize(250)}
                className={qrSize === 250 ? "bg-blue-100" : ""}
              >
                Grande
              </Button>
            </div>
          </div>

          {/* Información del Boleto */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Número de Boleto</p>
                <p className="font-mono font-semibold">{ticket.ticketNumber}</p>
              </div>
              <div>
                <p className="text-gray-600">Tipo</p>
                <p className="font-semibold">{ticket.ticketType}</p>
              </div>
              <div>
                <p className="text-gray-600">Precio</p>
                <p className="font-semibold text-green-600">{formatPrice(ticket.price)}</p>
              </div>
              <div>
                <p className="text-gray-600">Estado</p>
                {getStatusBadge(ticket.status)}
              </div>
            </div>
          </div>

          <Separator />

          {/* Instrucciones */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Instrucciones de Uso</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Presenta este código QR en la entrada del evento</li>
              <li>• Asegúrate de que la pantalla esté bien iluminada</li>
              <li>• El código debe estar completo y legible</li>
              <li>• Lleva una identificación válida</li>
            </ul>
          </div>

          {/* Acciones */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleDownloadQR}>
              <Download className="h-4 w-4 mr-2" />
              Descargar QR
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleShareQR}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>

          <Button className="w-full" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

