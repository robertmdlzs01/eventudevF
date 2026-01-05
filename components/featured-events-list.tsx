import EventCard from "@/components/event-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { FeaturedEventsCarousel } from "@/components/featured-events-carousel"

interface FeaturedEventsListProps {
  events?: any[]
}

export function FeaturedEventsList({ events = [] }: FeaturedEventsListProps) {
  // Filtrar solo eventos destacados
  const featuredEvents = events.filter(event => event.featured === true)

  if (featuredEvents.length === 0) {
    return null
  }

  return (
    <section className="py-12 md:py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 w-full">
      <div className="container mx-auto px-4">
        {/* Usar el carrusel para mostrar eventos destacados */}
        <FeaturedEventsCarousel events={featuredEvents} />
      </div>
    </section>
  )
}
