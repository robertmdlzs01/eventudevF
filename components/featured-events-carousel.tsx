"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Calendar, MapPin, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"
import type { EventData } from "@/lib/events-data"

interface FeaturedEventsCarouselProps {
  events?: EventData[]
}

export { FeaturedEventsCarousel }
export default FeaturedEventsCarousel

function FeaturedEventsCarousel({ events = [] }: FeaturedEventsCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (events.length === 0) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length)
    }, 5000)

    return () => clearInterval(timer)
  }, [events.length])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % events.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + events.length) % events.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  if (events.length === 0) {
    return null
  }

  const currentEvent = events[currentIndex]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl">
        <div className="grid md:grid-cols-2 gap-0 h-[600px]">
          {/* Imagen del evento */}
          <div className="relative overflow-hidden group h-full">
            <Image
              src={currentEvent.image || "/placeholder.svg"}
              alt={currentEvent.title}
              width={600}
              height={600}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/30" />

            {/* Badge de categoría */}
            <div className="absolute top-6 left-6">
              <Badge className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-md text-white border-white/20 shadow-lg px-4 py-2 text-sm font-medium">
                {currentEvent.categoryDisplay}
              </Badge>
            </div>

            {/* Indicadores de precio */}
            <div className="absolute bottom-6 left-6">
              <div className="bg-gradient-to-r from-white/25 to-white/15 backdrop-blur-md rounded-xl px-4 py-3 shadow-lg border border-white/20">
                <span className="text-white font-bold text-xl">Desde {formatPrice(currentEvent.price || 0)}</span>
              </div>
            </div>

            {/* Efecto de brillo sutil */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </div>

          {/* Información del evento */}
          <div className="p-10 flex flex-col justify-center bg-gradient-to-br from-white/5 to-white/10 h-full">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 leading-tight">{currentEvent.title}</h3>
                <p className="text-white/85 text-base leading-relaxed line-clamp-3">{currentEvent.description}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-white/90 group">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm mr-3 group-hover:bg-white/20 transition-colors duration-300">
                    <Calendar className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="font-medium text-base">{currentEvent.date}</span>
                </div>
                <div className="flex items-center text-white/90 group">
                  <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm mr-3 group-hover:bg-white/20 transition-colors duration-300">
                    <MapPin className="h-4 w-4 text-amber-400" />
                  </div>
                  <span className="font-medium text-base">{currentEvent.locationDisplay}</span>
                </div>
                {currentEvent.capacity && (
                  <div className="flex items-center text-white/90 group">
                    <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm mr-3 group-hover:bg-white/20 transition-colors duration-300">
                      <Users className="h-4 w-4 text-amber-400" />
                    </div>
                    <span className="font-medium text-base">
                      {currentEvent.soldTickets || 0} / {currentEvent.capacity} asistentes
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Link href={`/evento/${currentEvent.slug}`}>
                  <Button className="bg-gradient-to-r from-white to-white/90 text-neutral-900 hover:from-white/90 hover:to-white/80 font-bold px-6 py-2 text-sm shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                    Ver Detalles
                  </Button>
                </Link>
                <Link href={`/evento/${currentEvent.slug}/comprar`}>
                  <Button
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 font-bold px-6 py-2 text-sm bg-transparent backdrop-blur-sm hover:border-white/50 transition-all duration-300 transform hover:scale-105"
                  >
                    Comprar Ahora
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de navegación mejorados */}
        {events.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 w-12 h-12"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/15 backdrop-blur-md hover:bg-white/25 text-white border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 w-12 h-12"
              onClick={nextSlide}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}
      </div>

      {/* Indicadores de puntos mejorados */}
      {events.length > 1 && (
        <div className="flex justify-center mt-8 space-x-3">
          {events.map((_, index) => (
            <button
              key={index}
              className={`w-4 h-4 rounded-full transition-all duration-300 shadow-lg ${
                index === currentIndex 
                  ? "bg-white scale-125 shadow-white/50" 
                  : "bg-white/40 hover:bg-white/60 hover:scale-110"
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
