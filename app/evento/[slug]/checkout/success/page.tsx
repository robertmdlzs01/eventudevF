import { CheckCircle, Download, Mail, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import Link from "next/link"

export default function CheckoutSuccessPage() {
  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Compra Exitosa!
            </CardTitle>
            <p className="text-gray-600">
              Tu compra ha sido procesada correctamente. Recibirás un email de confirmación pronto.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del evento */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Detalles de tu compra</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha del evento: 15 de diciembre de 2024</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Lugar: Teatro Colón, Bogotá</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="space-y-3">
              <Button className="w-full" size="lg">
                <Download className="h-4 w-4 mr-2" />
                Descargar Boletas
              </Button>
              
              <Button variant="outline" className="w-full">
                <Mail className="h-4 w-4 mr-2" />
                Reenviar Confirmación
              </Button>
              
              <Link href="/" className="block">
                <Button variant="ghost" className="w-full">
                  Volver al Inicio
                </Button>
              </Link>
            </div>

            {/* Información adicional */}
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Llega 30 minutos antes del evento</p>
              <p>• Lleva tu documento de identidad</p>
              <p>• No se permiten alimentos ni bebidas</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </ProtectedRoute>
  )
}
