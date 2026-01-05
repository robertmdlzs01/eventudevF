import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-[150px] md:text-[200px] font-bold text-gray-200 leading-none select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white rounded-full p-6 shadow-lg">
                <Search className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¡Oops! Página no encontrada
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            La página que buscas no existe o ha sido movida.
          </p>
          <p className="text-gray-500">
            Pero no te preocupes, tenemos muchos eventos increíbles esperándote.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-5 w-5" />
              Ir al inicio
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link href="/eventos" className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Ver eventos
            </Link>
          </Button>
          
          <Button asChild variant="ghost" size="lg" className="flex items-center gap-2">
            <Link href="/">
              <ArrowLeft className="h-5 w-5" />
              Volver atrás
            </Link>
          </Button>
        </div>

        {/* Popular Links */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Enlaces populares
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link 
              href="/eventos" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Todos los eventos
            </Link>
            <Link 
              href="/eventos?category=conciertos" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Conciertos
            </Link>
            <Link 
              href="/eventos?category=teatro" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Teatro
            </Link>
            <Link 
              href="/eventos?category=deportes" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Deportes
            </Link>
            <Link 
              href="/vende-tu-evento" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Vende tu evento
            </Link>
            <Link 
              href="/puntos-de-venta" 
              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              → Puntos de venta
            </Link>
          </div>
        </div>

        {/* Contact Info */}
        <div className="mt-8 text-sm text-gray-500">
          <p>
            ¿Necesitas ayuda? Contáctanos en{' '}
            <a 
              href="mailto:soporte@eventu.com" 
              className="text-blue-600 hover:underline"
            >
              soporte@eventu.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
