"use client"

import { LoginForm } from "@/components/login-form"
import { CartPersistenceBanner } from "@/components/cart/CartPersistenceBanner"
import Link from "next/link"
import { Sparkles, Star } from "lucide-react"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

export default function LoginPageClient() {
  const searchParams = useSearchParams()
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false)

  useEffect(() => {
    const reason = searchParams?.get('reason')
    const message = searchParams?.get('message')
    
    if (reason === 'timeout') {
      setShowTimeoutMessage(true)
      toast.error("Sesión expirada", {
        description: "Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente.",
      })
    } else if (reason === 'session_closed') {
      setShowTimeoutMessage(true)
      toast.error("Sesión cerrada", {
        description: "Tu sesión ha sido cerrada por seguridad. Por favor, inicia sesión nuevamente.",
      })
    } else if (message) {
      toast.info("Carrito guardado", {
        description: message,
        duration: 5000,
      })
    }
  }, [searchParams])
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary-200/30 to-primary-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-secondary-200/30 to-secondary-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-accent-orange/10 to-accent-emerald/10 rounded-full blur-3xl" />
      </div>

      {/* Estrellas decorativas */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <Star className="absolute top-20 left-20 w-4 h-4 text-primary-300 animate-pulse" />
        <Sparkles className="absolute top-32 right-32 w-5 h-5 text-secondary-300 animate-pulse" />
        <Star className="absolute bottom-32 left-32 w-3 h-3 text-accent-orange animate-pulse" />
        <Sparkles className="absolute bottom-20 right-20 w-4 h-4 text-primary-300 animate-pulse" />
      </div>


      <div className="relative z-10 flex min-h-screen">
        {/* Panel izquierdo - Solo visible en desktop */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-secondary-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
            <div className="max-w-md text-center space-y-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                <img src="/images/eventu-logo.svg" alt="Eventu Logo" className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold">¡Bienvenido de vuelta a Eventu!</h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Descubre eventos increíbles, conecta con personas afines y vive experiencias únicas.
              </p>
              <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Miles de eventos disponibles</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Compra segura y fácil</span>
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <div className="w-2 h-2 bg-white rounded-full" />
                  <span>Experiencias inolvidables</span>
                </div>
              </div>
            </div>
          </div>

          {/* Elementos decorativos del panel */}
          <div className="absolute top-10 right-10 w-32 h-32 border border-white/20 rounded-full" />
          <div className="absolute bottom-10 left-10 w-24 h-24 border border-white/20 rounded-full" />
          <div className="absolute top-1/2 right-20 w-16 h-16 border border-white/20 rounded-full" />
        </div>

        {/* Panel derecho - Formulario */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {/* Botón de regresar */}
            
            {/* Título móvil */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <img src="/images/eventu-logo.svg" alt="Eventu Logo" className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">¡Hola de nuevo!</h1>
              <p className="text-neutral-600">Inicia sesión para continuar</p>
            </div>

            <CartPersistenceBanner />
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}
