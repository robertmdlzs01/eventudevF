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
  X,
  Receipt,
  ShoppingCart
} from "lucide-react"

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

interface PurchaseDetailsModalProps {
  purchase: Purchase | null
  isOpen: boolean
  onClose: () => void
}

export function PurchaseDetailsModal({ purchase, isOpen, onClose }: PurchaseDetailsModalProps) {
  if (!purchase) return null

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

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800">Completada</Badge>
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendiente</Badge>
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Cancelada</Badge>
      case "refunded":
        return <Badge className="bg-blue-100 text-blue-800">Reembolsada</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'tarjeta de crédito':
      case 'tarjeta de débito':
        return <CreditCard className="h-5 w-5" />
      case 'transferencia bancaria':
        return <Receipt className="h-5 w-5" />
      case 'pse':
        return <Receipt className="h-5 w-5" />
      default:
        return <ShoppingCart className="h-5 w-5" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <DialogTitle className="text-2xl font-bold">Detalles de la Compra</DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Evento */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">{purchase.eventName}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Fecha del Evento</p>
                  <p className="font-medium">{formatDate(purchase.eventDate)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Lugar</p>
                  <p className="font-medium">{purchase.venue}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Información de la Compra */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Información de la Compra</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Número de Orden</p>
                  <p className="font-mono text-lg font-semibold text-gray-900">{purchase.orderNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID de Transacción</p>
                  <p className="font-mono text-sm text-gray-900">{purchase.transactionId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estado</p>
                  {getStatusBadge(purchase.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Compra</p>
                  <p className="font-medium">{formatDateTime(purchase.purchaseDate)}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Tipo de Boleto</p>
                  <Badge variant="outline" className="text-sm">{purchase.ticketType}</Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cantidad</p>
                  <p className="text-lg font-semibold text-gray-900">{purchase.quantity} boletos</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Precio Unitario</p>
                  <p className="text-lg font-semibold text-gray-900">{formatPrice(purchase.unitPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-2xl font-bold text-green-600">{formatPrice(purchase.totalAmount)}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Información de Pago */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Información de Pago</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                {getPaymentMethodIcon(purchase.paymentMethod)}
                <div>
                  <p className="text-sm text-gray-600">Método de Pago</p>
                  <p className="font-medium">{purchase.paymentMethod}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Comprador</p>
                  <p className="font-medium">Usuario Eventu</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Desglose de Precios */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Desglose de Precios</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal ({purchase.quantity} boletos)</span>
                  <span className="font-medium">{formatPrice(purchase.unitPrice * purchase.quantity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Servicio de gestión</span>
                  <span className="font-medium">{formatPrice(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA (19%)</span>
                  <span className="font-medium">{formatPrice(purchase.totalAmount * 0.19)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">{formatPrice(purchase.totalAmount)}</span>
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
                <li>• Esta compra está sujeta a los términos y condiciones del evento</li>
                <li>• Los boletos son personales e intransferibles</li>
                <li>• No se permiten reembolsos después del evento</li>
                <li>• En caso de cancelación, se notificará por email</li>
                <li>• El organizador se reserva el derecho de admisión</li>
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

