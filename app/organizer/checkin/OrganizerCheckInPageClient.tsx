"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import {
  Camera,
  CameraOff,
  QrCode,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Calendar,
  MapPin,
  Ticket,
  Search,
  History,
  RefreshCw,
} from "lucide-react"

interface TicketData {
  ticketId: string
  eventId: string
  eventTitle: string
  ticketType: string
  purchaseId: string
  customerEmail: string
  customerName: string
  price: number
  purchaseDate: string
  eventDate: string
  eventTime: string
  venue: string
  isActive: boolean
  activationTime: string
  expirationTime: string
}

interface CheckInResult {
  ticketId: string
  customerName: string
  eventTitle: string
  timestamp: string
  status: "success" | "error"
  message: string
}

export default function OrganizerCheckInPageClient() {
  const { toast } = useToast()
  const [isScanning, setIsScanning] = useState(false)
  const [hasPermission, setHasPermission] = useState(false)
  const [scanResult, setScanResult] = useState<string>("")
  const [checkInHistory, setCheckInHistory] = useState<CheckInResult[]>([])
  const [manualTicketId, setManualTicketId] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [validTickets, setValidTickets] = useState<TicketData[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadValidTickets()
    return () => {
      // Cleanup stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  const loadValidTickets = async () => {
    try {
      // Obtener el usuario actual del localStorage
      const currentUser = localStorage.getItem("current_user")
      if (!currentUser) {
        toast({
          title: "Error",
          description: "No se pudo obtener la información del usuario",
          variant: "destructive",
        })
        return
      }

      const user = JSON.parse(currentUser)
      const response = await apiClient.getUserTickets(user.id)
      
      if (response.success && response.data) {
        const ticketsData = response.data.map((ticket: any) => ({
          ticketId: ticket.ticket_code || `TKT-${ticket.id}`,
          eventId: ticket.event_slug || "evento",
          eventTitle: ticket.event_title || "Evento",
          ticketType: ticket.ticket_type_name || "General",
          purchaseId: ticket.sale_id?.toString() || "PUR-001",
          customerEmail: ticket.customer_email || "cliente@example.com",
          customerName: ticket.customer_name || "Cliente",
          price: ticket.price || 0,
          purchaseDate: ticket.purchase_date || new Date().toISOString(),
          eventDate: ticket.event_date || "2025-01-01",
          eventTime: ticket.event_time || "09:00",
          venue: ticket.event_venue || "Venue",
          isActive: true,
          activationTime: ticket.activation_time || new Date().toISOString(),
          expirationTime: ticket.expiration_time || new Date().toISOString(),
        }))
        
        setValidTickets(ticketsData)
      }
    } catch (error) {
      console.error("Error loading tickets:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los tickets válidos",
        variant: "destructive",
      })
    }
  }

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      })

      setHasPermission(true)
      return stream
    } catch (error) {
      console.error("Camera permission denied:", error)
      setHasPermission(false)
      toast({
        title: "Acceso a cámara denegado",
        description: "Necesitas permitir el acceso a la cámara para escanear códigos QR.",
        variant: "destructive",
      })
      return null
    }
  }

  const startScanning = async () => {
    if (!hasPermission) {
      const stream = await requestCameraPermission()
      if (!stream) return
      streamRef.current = stream
    }

    if (!streamRef.current) {
      const stream = await requestCameraPermission()
      if (!stream) return
      streamRef.current = stream
    }

    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current
      videoRef.current.play()
      setIsScanning(true)

      // Start QR detection loop
      detectQRCode()
    }
  }

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
  }

  const detectQRCode = () => {
    if (!isScanning || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data for QR detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height)

    // Simple QR code detection (in a real app, you'd use a QR library like jsQR)
    // For now, we'll simulate QR detection
    setTimeout(() => {
      if (isScanning) {
        detectQRCode()
      }
    }, 100)
  }

  const processTicket = async (ticketId: string) => {
    setIsProcessing(true)
    setScanResult("")

    try {
      // Find ticket in valid tickets
      const ticket = validTickets.find((t) => t.ticketId === ticketId)

      if (!ticket) {
        const result: CheckInResult = {
          ticketId,
          customerName: "Desconocido",
          eventTitle: "Evento no encontrado",
          timestamp: new Date().toISOString(),
          status: "error",
          message: "Ticket no válido o no encontrado",
        }
        setCheckInHistory([result, ...checkInHistory])
        setScanResult("Ticket no válido")
        toast({
          title: "Error",
          description: "Ticket no válido o no encontrado",
          variant: "destructive",
        })
        return
      }

      // Check if ticket is active
      const now = new Date()
      const activationTime = new Date(ticket.activationTime)
      const expirationTime = new Date(ticket.expirationTime)

      if (now < activationTime) {
        const result: CheckInResult = {
          ticketId,
          customerName: ticket.customerName,
          eventTitle: ticket.eventTitle,
          timestamp: new Date().toISOString(),
          status: "error",
          message: "Ticket aún no está activo",
        }
        setCheckInHistory([result, ...checkInHistory])
        setScanResult("Ticket no activo")
        toast({
          title: "Error",
          description: "Este ticket aún no está activo",
          variant: "destructive",
        })
        return
      }

      if (now > expirationTime) {
        const result: CheckInResult = {
          ticketId,
          customerName: ticket.customerName,
          eventTitle: ticket.eventTitle,
          timestamp: new Date().toISOString(),
          status: "error",
          message: "Ticket expirado",
        }
        setCheckInHistory([result, ...checkInHistory])
        setScanResult("Ticket expirado")
        toast({
          title: "Error",
          description: "Este ticket ha expirado",
          variant: "destructive",
        })
        return
      }

      // Check if already checked in
      const alreadyCheckedIn = checkInHistory.some(
        (check) => check.ticketId === ticketId && check.status === "success"
      )

      if (alreadyCheckedIn) {
        const result: CheckInResult = {
          ticketId,
          customerName: ticket.customerName,
          eventTitle: ticket.eventTitle,
          timestamp: new Date().toISOString(),
          status: "error",
          message: "Ya registrado anteriormente",
        }
        setCheckInHistory([result, ...checkInHistory])
        setScanResult("Ya registrado")
        toast({
          title: "Error",
          description: "Este ticket ya fue registrado anteriormente",
          variant: "destructive",
        })
        return
      }

      // Successful check-in
      const result: CheckInResult = {
        ticketId,
        customerName: ticket.customerName,
        eventTitle: ticket.eventTitle,
        timestamp: new Date().toISOString(),
        status: "success",
        message: "Registro exitoso",
      }
      setCheckInHistory([result, ...checkInHistory])
      setScanResult("Registro exitoso")
      toast({
        title: "¡Registro exitoso!",
        description: `${ticket.customerName} ha sido registrado correctamente`,
      })

      // Clear manual input
      setManualTicketId("")
    } catch (error) {
      console.error("Error processing ticket:", error)
      toast({
        title: "Error",
        description: "Error al procesar el ticket",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualTicketId.trim()) {
      processTicket(manualTicketId.trim())
    }
  }

  const handleQRScan = (qrData: string) => {
    // Parse QR data (assuming it contains the ticket ID)
    const ticketId = qrData
    processTicket(ticketId)
  }

  const clearHistory = () => {
    setCheckInHistory([])
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-100 text-green-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Check-in de Asistentes</h1>
        <p className="text-muted-foreground">
          Escanea códigos QR o ingresa manualmente los códigos de ticket para registrar asistentes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Scanner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Escáner QR
            </CardTitle>
            <CardDescription>
              Escanea códigos QR de los tickets para registro automático
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isScanning ? (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Cámara desactivada</p>
                </div>
              </div>
            ) : (
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full opacity-0"
                />
                <div className="absolute inset-0 border-2 border-white border-dashed m-4 pointer-events-none">
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {!isScanning ? (
                <Button onClick={startScanning} className="flex-1">
                  <Camera className="h-4 w-4 mr-2" />
                  Iniciar Escáner
                </Button>
              ) : (
                <Button onClick={stopScanning} variant="destructive" className="flex-1">
                  <CameraOff className="h-4 w-4 mr-2" />
                  Detener Escáner
                </Button>
              )}
            </div>

            {scanResult && (
              <div className="p-3 rounded-lg bg-gray-50">
                <p className="text-sm font-medium">Resultado: {scanResult}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manual Entry */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Entrada Manual
            </CardTitle>
            <CardDescription>
              Ingresa manualmente el código del ticket
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Código del Ticket</label>
                <Input
                  placeholder="Ej: TKT-1704067200000-ABC123"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value)}
                  disabled={isProcessing}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isProcessing || !manualTicketId.trim()}>
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Ticket className="h-4 w-4 mr-2" />
                    Validar Ticket
                  </>
                )}
              </Button>
            </form>

            {/* Ticket Info Display */}
            {scanResult && (
              <div className="p-4 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-2">Información del Ticket</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>Cliente: {scanResult}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>Fecha: {new Date().toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span>Venue: Evento</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historial de Registros
              </CardTitle>
              <CardDescription>
                Últimos registros realizados en esta sesión
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={clearHistory}>
              Limpiar Historial
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {checkInHistory.length === 0 ? (
            <div className="text-center py-8">
              <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay registros en esta sesión</p>
            </div>
          ) : (
            <div className="space-y-3">
              {checkInHistory.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium">{check.customerName}</p>
                      <p className="text-sm text-gray-500">{check.eventTitle}</p>
                      <p className="text-xs text-gray-400">Ticket: {check.ticketId}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getStatusColor(check.status)}>
                      {check.status === "success" ? "Registrado" : "Error"}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(check.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
