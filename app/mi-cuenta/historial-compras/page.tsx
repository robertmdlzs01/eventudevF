"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ShoppingCart, 
  Calendar, 
  MapPin, 
  Clock, 
  Download, 
  Eye,
  CreditCard,
  Receipt,
  ArrowLeft,
  Mail
} from "lucide-react"
import { useRouter } from "next/navigation"
import { PurchaseDetailsModal } from "@/components/purchase-details-modal"
import { downloadInvoicePDF, viewPurchaseTickets, resendPurchaseTickets } from "@/lib/purchase-utils"

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

export default function HistorialComprasPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token")
      if (!token) {
        router.push("/login")
        return
      }
      
      try {
        // Obtener datos reales del backend
        const response = await fetch('http://localhost:3002/api/sales/user/4', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Transformar datos del backend al formato esperado
            const transformedPurchases: Purchase[] = data.data.map((sale: any) => ({
              id: sale.id.toString(),
              orderNumber: `ORD-${sale.id}`,
              eventName: sale.event_name,
              eventDate: sale.event_date,
              venue: sale.event_venue,
              ticketType: sale.ticket_type_name,
              quantity: sale.quantity,
              unitPrice: parseFloat(sale.unit_price),
              totalAmount: parseFloat(sale.total_amount),
              paymentMethod: sale.payment_method || "No especificado",
              status: sale.status,
              purchaseDate: sale.transaction_date,
              transactionId: `TXN-${sale.id}`
            }))
            setPurchases(transformedPurchases)
          }
        } else {
          // Fallback a datos mock si falla el backend
          const mockPurchases: Purchase[] = [
            {
              id: "1",
              orderNumber: "ORD-2024-001",
              eventName: "Concierto Rock Nacional",
              eventDate: "2024-12-15",
              venue: "Estadio El Campín",
              ticketType: "General",
              quantity: 2,
              unitPrice: 50000,
              totalAmount: 100000,
              paymentMethod: "Tarjeta de Crédito",
              status: "completed",
              purchaseDate: "2024-11-20",
              transactionId: "TXN-001-2024"
            }
          ]
          setPurchases(mockPurchases)
        }
      } catch (error) {
        console.error('Error fetching purchases:', error)
        // Fallback a datos mock en caso de error
        const mockPurchases: Purchase[] = [
          {
            id: "1",
            orderNumber: "ORD-2024-001",
            eventName: "Concierto Rock Nacional",
            eventDate: "2024-12-15",
            venue: "Estadio El Campín",
            ticketType: "General",
            quantity: 2,
            unitPrice: 50000,
            totalAmount: 100000,
            paymentMethod: "Tarjeta de Crédito",
            status: "completed",
            purchaseDate: "2024-11-20",
            transactionId: "TXN-001-2024"
          }
        ]
        setPurchases(mockPurchases)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'tarjeta de crédito':
      case 'tarjeta de débito':
        return <CreditCard className="h-4 w-4" />
      case 'transferencia bancaria':
        return <Receipt className="h-4 w-4" />
      case 'pse':
        return <Receipt className="h-4 w-4" />
      default:
        return <ShoppingCart className="h-4 w-4" />
    }
  }

  // Funciones para manejar los botones
  const handleViewDetails = (purchase: Purchase) => {
    setSelectedPurchase(purchase)
    setShowDetailsModal(true)
  }

  const handleDownloadInvoice = (purchase: Purchase) => {
    downloadInvoicePDF(purchase)
  }

  const handleViewTickets = (purchase: Purchase) => {
    const tickets = viewPurchaseTickets(purchase)
    // Redirigir a la página de boletos con los boletos de esta compra
    router.push('/mi-cuenta/boletos')
  }

  const handleResendTickets = (purchase: Purchase) => {
    resendPurchaseTickets(purchase)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Atrás
          </Button>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Historial de Compras</h1>
        <p className="text-gray-600">Revisa todas tus transacciones y compras realizadas</p>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay compras</h3>
            <p className="text-gray-600 mb-6">Aún no has realizado ninguna compra.</p>
            <Button onClick={() => router.push("/eventos")}>
              Explorar Eventos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {purchases.map((purchase) => (
            <Card key={purchase.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{purchase.eventName}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(purchase.eventDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {purchase.venue}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(purchase.status)}
                    <Badge variant="outline">{purchase.ticketType}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número de Orden</p>
                    <p className="text-sm text-gray-900 font-mono">{purchase.orderNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Cantidad</p>
                    <p className="text-sm text-gray-900">{purchase.quantity} boletos</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Precio Unitario</p>
                    <p className="text-sm text-gray-900">{formatPrice(purchase.unitPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total</p>
                    <p className="text-sm text-gray-900 font-semibold">{formatPrice(purchase.totalAmount)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Método de Pago</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPaymentMethodIcon(purchase.paymentMethod)}
                      <span className="text-sm text-gray-900">{purchase.paymentMethod}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de Compra</p>
                    <p className="text-sm text-gray-900">{formatDate(purchase.purchaseDate)}</p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">ID de Transacción:</span> {purchase.transactionId}
                  </p>
                </div>

                <Separator className="my-4" />

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(purchase)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownloadInvoice(purchase)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar Factura
                  </Button>
                  {purchase.status === "completed" && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewTickets(purchase)}
                      >
                        <Receipt className="h-4 w-4 mr-2" />
                        Ver Boletos
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResendTickets(purchase)}
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Reenviar Boletos
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Estadísticas */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Resumen de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{purchases.length}</p>
              <p className="text-sm text-gray-600">Total de Compras</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {purchases.filter(p => p.status === "completed").length}
              </p>
              <p className="text-sm text-gray-600">Completadas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {purchases.filter(p => p.status === "pending").length}
              </p>
              <p className="text-sm text-gray-600">Pendientes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {purchases.reduce((sum, p) => sum + p.quantity, 0)}
              </p>
              <p className="text-sm text-gray-600">Total Boletos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {formatPrice(purchases.reduce((sum, p) => sum + p.totalAmount, 0))}
              </p>
              <p className="text-sm text-gray-600">Total Gastado</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <PurchaseDetailsModal
        purchase={selectedPurchase}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedPurchase(null)
        }}
      />
    </div>
  )
}
