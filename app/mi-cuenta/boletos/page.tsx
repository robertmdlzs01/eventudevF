"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  FileText, 
  Calendar, 
  MapPin, 
  Clock, 
  Download, 
  QrCode,
  Eye,
  Mail,
  ArrowLeft
} from "lucide-react"
import { useRouter } from "next/navigation"
import { TicketDetailsModal } from "@/components/ticket-details-modal"
import { TicketQRModal } from "@/components/ticket-qr-modal"
import { downloadTicketPDF, resendTicketEmail } from "@/lib/ticket-utils"

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

export default function MisBoletosPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showQRModal, setShowQRModal] = useState(false)
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
        const response = await fetch('http://localhost:3002/api/tickets/user/4', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          if (data.success && data.data) {
            // Transformar datos del backend al formato esperado
            const transformedTickets: Ticket[] = data.data.map((ticket: any) => ({
              id: ticket.ticket_id.toString(),
              ticketNumber: ticket.ticket_code,
              eventName: ticket.event_title,
              eventDate: ticket.event_date,
              eventTime: ticket.event_time,
              venue: ticket.event_venue,
              ticketType: ticket.ticket_type_name,
              price: parseFloat(ticket.ticket_price),
              status: ticket.ticket_status === 'valid' ? 'active' : 'used',
              purchaseDate: ticket.purchase_date,
              qrCode: ticket.qr_code || `qr-${ticket.ticket_code}`,
              usedAt: ticket.used_at
            }))
            setTickets(transformedTickets)
          }
        } else {
          // Fallback a datos mock si falla el backend
          const mockTickets: Ticket[] = [
            {
              id: "1",
              ticketNumber: "TKT-2024-001",
              eventName: "Concierto Rock Nacional",
              eventDate: "2024-12-15",
              eventTime: "20:00",
              venue: "Estadio El Campín",
              ticketType: "General",
              price: 50000,
              status: "active",
              purchaseDate: "2024-11-20",
              qrCode: "qr-code-1"
            }
          ]
          setTickets(mockTickets)
        }
      } catch (error) {
        console.error('Error fetching tickets:', error)
        // Fallback a datos mock en caso de error
        const mockTickets: Ticket[] = [
          {
            id: "1",
            ticketNumber: "TKT-2024-001",
            eventName: "Concierto Rock Nacional",
            eventDate: "2024-12-15",
            eventTime: "20:00",
            venue: "Estadio El Campín",
            ticketType: "General",
            price: 50000,
            status: "active",
            purchaseDate: "2024-11-20",
            qrCode: "qr-code-1"
          }
        ]
        setTickets(mockTickets)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

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

  // Funciones para manejar los botones
  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowDetailsModal(true)
  }

  const handleViewQR = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setShowQRModal(true)
  }

  const handleDownload = (ticket: Ticket) => {
    downloadTicketPDF(ticket)
  }

  const handleResend = (ticket: Ticket) => {
    resendTicketEmail(ticket)
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Boletos</h1>
        <p className="text-gray-600">Gestiona y visualiza todos tus boletos comprados</p>
      </div>

      {tickets.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes boletos</h3>
            <p className="text-gray-600 mb-6">Aún no has comprado ningún boleto para eventos.</p>
            <Button onClick={() => router.push("/eventos")}>
              Explorar Eventos
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{ticket.eventName}</CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(ticket.eventDate)} - {ticket.eventTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {ticket.venue}
                      </span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(ticket.status)}
                    <Badge variant="outline">{ticket.ticketType}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Número de Boleto</p>
                    <p className="text-sm text-gray-900 font-mono">{ticket.ticketNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Precio</p>
                    <p className="text-sm text-gray-900 font-semibold">{formatPrice(ticket.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Fecha de Compra</p>
                    <p className="text-sm text-gray-900">{formatDate(ticket.purchaseDate)}</p>
                  </div>
                </div>

                {ticket.usedAt && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Usado el {formatDate(ticket.usedAt)}
                    </p>
                  </div>
                )}

                <Separator className="my-4" />

                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewDetails(ticket)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalles
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewQR(ticket)}
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Ver QR
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleDownload(ticket)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Descargar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleResend(ticket)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Reenviar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}


      {/* Modales */}
      <TicketDetailsModal
        ticket={selectedTicket}
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedTicket(null)
        }}
      />

      <TicketQRModal
        ticket={selectedTicket}
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false)
          setSelectedTicket(null)
        }}
      />
    </div>
  )
}
