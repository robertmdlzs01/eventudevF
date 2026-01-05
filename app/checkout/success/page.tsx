"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Download, Mail, Calendar, MapPin, CreditCard } from "lucide-react"
import Link from "next/link"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [transactionData, setTransactionData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular obtención de datos de la transacción
    const transactionId = searchParams?.get('transactionId') || `TXN-${Date.now()}`
    
    // Simular datos de transacción exitosa
    setTimeout(() => {
      setTransactionData({
        transactionId,
        status: 'approved',
        amount: 150000,
        currency: 'COP',
        paymentMethod: 'Tarjeta de Crédito',
        eventTitle: 'Concierto Rock Nacional',
        eventDate: '2024-05-15',
        eventLocation: 'Estadio El Campín, Bogotá',
        ticketType: 'General',
        quantity: 2,
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com'
      })
      setLoading(false)
    }, 1000)
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-2">Procesando tu compra...</h1>
          <p className="text-gray-600">Verificando los detalles de tu transacción</p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header de éxito */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Pago Exitoso!</h1>
          <p className="text-lg text-gray-600">
            Tu compra ha sido procesada correctamente. Recibirás un email de confirmación pronto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Detalles de la transacción */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Detalles de la Transacción
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID de Transacción</label>
                    <p className="text-sm text-gray-900 font-mono">{transactionData?.transactionId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estado</label>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-600 font-medium">Aprobado</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Método de Pago</label>
                    <p className="text-sm text-gray-900">{transactionData?.paymentMethod}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Pagado</label>
                    <p className="text-lg font-bold text-gray-900">
                      ${transactionData?.amount?.toLocaleString()} {transactionData?.currency}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detalles del evento */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Detalles del Evento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {transactionData?.eventTitle}
                    </h3>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(transactionData?.eventDate).toLocaleDateString('es-CO', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        <span>{transactionData?.eventLocation}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{transactionData?.ticketType}</p>
                        <p className="text-sm text-gray-600">Cantidad: {transactionData?.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ${(transactionData?.amount / transactionData?.quantity).toLocaleString()} {transactionData?.currency}
                        </p>
                        <p className="text-sm text-gray-600">por boleto</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información importante */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">Información Importante</h4>
                  <ul className="space-y-1 text-sm text-blue-700">
                    <li>• Recibirás un email con los detalles de tu compra</li>
                    <li>• Los boletos estarán disponibles en tu cuenta</li>
                    <li>• Llega al evento 30 minutos antes</li>
                    <li>• Lleva un documento de identidad</li>
                    <li>• Los boletos no son reembolsables</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Acciones */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Acciones</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" asChild>
                  <Link href="/mi-cuenta/boletos">
                    <Download className="h-4 w-4 mr-2" />
                    Ver Mis Boletos
                  </Link>
                </Button>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/mi-cuenta/historial-compras">
                    Historial de Compras
                  </Link>
                </Button>

                <Button variant="outline" className="w-full" asChild>
                  <Link href="/eventos">
                    Explorar Más Eventos
                  </Link>
                </Button>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-2">¿Necesitas ayuda?</p>
                  <Button variant="ghost" className="w-full" asChild>
                    <Link href="/contacto">
                      Contactar Soporte
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información de contacto */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Mail className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Confirmación enviada a
                  </p>
                  <p className="font-medium text-gray-900">
                    {transactionData?.customerEmail}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
