"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Clock, MapPin } from "lucide-react"

interface CountdownBannerProps {
  title?: string
  date?: string
  location?: string
  daysLeft?: number
  imageUrl?: string
  eventSlug?: string
  redirectUrl?: string
  isActive?: boolean
}

interface FeaturedEventData {
  title: string
  date: string
  location: string
  image_url: string
  event_slug: string
  redirect_url: string
  is_active: boolean
  daysLeft: number
}

export function CountdownBanner({ 
  title, 
  date, 
  location, 
  daysLeft, 
  imageUrl, 
  eventSlug,
  redirectUrl,
  isActive = true
}: CountdownBannerProps) {
  const [eventData, setEventData] = useState<FeaturedEventData | null>(null)
  const [remainingDays, setRemainingDays] = useState(daysLeft || 15)
  const [isLoading, setIsLoading] = useState(true)

  // Cargar datos del evento próximo
  useEffect(() => {
    loadFeaturedEvent()
  }, [])

  // Actualizar cuenta regresiva
  useEffect(() => {
    const countdownInterval = setInterval(
      () => {
        setRemainingDays((prevDays) => Math.max(0, prevDays - 1))
      },
      24 * 60 * 60 * 1000,
    ) // Update every day

    return () => clearInterval(countdownInterval)
  }, [])

  const loadFeaturedEvent = async () => {
    try {
      const response = await fetch('/api/public/featured-countdown-event')
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data) {
          setEventData(result.data)
          setRemainingDays(result.data.daysLeft || 15)
        }
      }
    } catch (error) {
      console.error('Error cargando evento próximo:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Usar datos dinámicos si están disponibles, sino usar props
  const currentTitle = eventData?.title || title || "PANACA VIAJERO BARRANQUILLA"
  const currentDate = eventData?.date || date || "20 DE JUNIO 2025"
  const currentLocation = eventData?.location || location || "PARQUE NORTE - BARRANQUILLA"
  const currentImageUrl = eventData?.image_url || imageUrl || "/placeholder.jpg"
  const currentEventSlug = eventData?.event_slug || eventSlug || "panaca-viajero-barranquilla"
  const currentRedirectUrl = eventData?.redirect_url || redirectUrl
  const currentIsActive = eventData?.is_active !== undefined ? eventData.is_active : isActive

  // No mostrar si está inactivo
  if (!currentIsActive) {
    return null
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 py-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
          </div>
        </div>
      </div>
    )
  }

  // Determinar URL de redireccionamiento
  const getRedirectUrl = () => {
    if (currentRedirectUrl) {
      return currentRedirectUrl
    }
    return `/evento/${currentEventSlug}`
  }

  return (
    <div className="relative bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 overflow-hidden">
      <div
        className="absolute inset-0 opacity-30 bg-cover bg-center"
        style={{ backgroundImage: `url(${currentImageUrl})` }}
      ></div>

      {/* Overlay con gradiente mejorado */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-900/80 via-secondary-900/60 to-primary-900/80"></div>

      <div className="container mx-auto px-4 relative z-10 py-6">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="flex-1 text-center lg:text-left text-white">
            <div className="flex items-center justify-center lg:justify-start mb-2">
              <Clock className="h-5 w-5 mr-2 text-amber-400" />
              <span className="text-amber-400 font-semibold text-sm uppercase tracking-wide">Evento Próximo</span>
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-neutral-200 bg-clip-text text-transparent">
              {currentTitle}
            </h3>
            <div className="flex items-center justify-center lg:justify-start text-neutral-300">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="text-sm">
                {currentDate} | {currentLocation}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Contador mejorado */}
            <div className="bg-gradient-to-r from-amber-400 to-amber-500 text-neutral-900 font-bold px-6 py-4 rounded-xl shadow-glow flex items-center gap-3 border-2 border-amber-300">
              <div className="text-center">
                <div className="text-xs uppercase tracking-wide opacity-80">Faltan</div>
                <div className="text-3xl font-black">{remainingDays}</div>
                <div className="text-xs uppercase tracking-wide opacity-80">Días</div>
              </div>
              <div className="w-px h-12 bg-neutral-900/20"></div>
              <div className="text-lg font-bold">
                ¡No te lo
                <br />
                pierdas!
              </div>
            </div>

            {/* Botón mejorado */}
            <Link href={getRedirectUrl()}>
              <Button className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold px-8 py-4 rounded-xl shadow-glow transition-all duration-300 hover:scale-105 border-2 border-primary-400">
                <span className="flex items-center gap-2">🎫 COMPRAR ENTRADAS</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
