"use client"

import { SignupForm } from "@/components/signup-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function SignupClientPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-pink-200/30 to-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-200/30 to-pink-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-gradient-to-br from-pink-100/10 to-purple-100/10 rounded-full blur-3xl" />
      </div>

      {/* Estrellas decorativas (manteniendo algunos para el efecto) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-4 h-4 bg-pink-300 rounded-full animate-pulse" />
        <div className="absolute top-32 right-32 w-5 h-5 bg-purple-300 rounded-full animate-pulse" />
        <div className="absolute bottom-32 left-32 w-3 h-3 bg-pink-300 rounded-full animate-pulse" />
        <div className="absolute bottom-20 right-20 w-4 h-4 bg-purple-300 rounded-full animate-pulse" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* Panel izquierdo - Solo visible en desktop */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-pink-600 to-purple-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 flex flex-col justify-center items-center p-12 text-white">
            <div className="max-w-md text-center space-y-6">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm">
                <img src="/images/eventu-logo.svg" alt="Eventu Logo" className="w-10 h-10" />
              </div>
              <h1 className="text-4xl font-bold">¡Únete a la comunidad Eventu!</h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Crea tu cuenta y accede a un mundo lleno de eventos increíbles y experiencias únicas.
              </p>

              {/* Beneficios */}
              <div className="grid grid-cols-1 gap-4 mt-8">
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <img src="/images/eventu-logo.svg" alt="Icono Calendario" className="w-4 h-4" />
                  </div>
                  <span>Acceso a eventos exclusivos</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <img src="/images/eventu-logo.svg" alt="Icono Ticket" className="w-4 h-4" />
                  </div>
                  <span>Descuentos especiales</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <img src="/images/eventu-logo.svg" alt="Icono Usuarios" className="w-4 h-4" />
                  </div>
                  <span>Conecta con personas afines</span>
                </div>
                <div className="flex items-center gap-3 text-white/90">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <img src="/images/eventu-logo.svg" alt="Icono Corazón" className="w-4 h-4" />
                  </div>
                  <span>Experiencias personalizadas</span>
                </div>
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">50K+</div>
                  <div className="text-sm text-white/80">Usuarios</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">1K+</div>
                  <div className="text-sm text-white/80">Eventos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">100+</div>
                  <div className="text-sm text-white/80">Ciudades</div>
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
            <div className="mb-8">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Regresar al inicio
              </Link>
            </div>

            {/* Título móvil */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <img src="/images/eventu-logo.svg" alt="Eventu Logo" className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">¡Únete a Eventu!</h1>
              <p className="text-slate-600">Crea tu cuenta en segundos</p>
            </div>

            <SignupForm />
          </div>
        </div>
      </div>
    </div>
  )
}
