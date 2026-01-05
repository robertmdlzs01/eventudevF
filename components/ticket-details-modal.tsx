"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  User,
  CreditCard,
  FileText,
  X
} from "lucide-react"

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

interface TicketDetailsModalProps {
  ticket: Ticket | null
  isOpen: boolean
  onClose: () => void
}

export function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold">Detalles del Boleto</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Evento */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{ticket.eventName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Fecha y Hora</p>
                  <p className="font-medium">{formatDateTime(ticket.eventDate, ticket.eventTime)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Lugar</p>
                  <p className="font-medium">{ticket.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información del Boleto */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Información del Boleto</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Número de Boleto</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">{ticket.ticketNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Boleto</p>
                  <Badge variant="outline" className="text-sm">{ticket.ticketType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Precio</p>
                  <p className="text-xl font-bold text-green-600">{formatPrice(ticket.price)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Compra</p>
                  <p className="font-medium">{formatDate(ticket.purchaseDate)}</p>
                </div>
                {ticket.usedAt && (
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Uso</p>
                    <p className="font-medium text-gray-900">{formatDate(ticket.usedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Información del Comprador */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Información del Comprador</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-medium">Usuario Eventu</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium">Tarjeta de Crédito</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Términos y Condiciones */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Términos y Condiciones</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Este boleto es personal e intransferible</li>
                <li>• Debe presentarse con identificación válida</li>
                <li>• No se permiten reembolsos después del evento</li>
                <li>• El organizador se reserva el derecho de admisión</li>
                <li>• En caso de cancelación, se notificará por email</li>
              </ul>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex gap-3 pt-4">
            <Button className="flex-1" onClick={onClose}>
              <FileText className="h-4 w-4 mr-2" />
              Cerrar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
