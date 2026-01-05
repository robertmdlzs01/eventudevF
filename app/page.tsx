"use client"

import { useState, useEffect } from 'react'
import { FeaturedEventsList } from '@/components/featured-events-list'
import { apiClient } from '@/lib/api-client'

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([])
  const [allEvents, setAllEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setIsLoading(true)
        const response = await apiClient.getEvents()
        
        if (response.success && response.data) {
          const events = response.data.map((event: any) => ({
            id: event.id,
            title: event.title,
            description: event.description || "",
            image: event.image_url || "/placeholder.jpg",
            date: event.date || event.startDate || "",
            location: event.location || "",
            locationDisplay: event.location || "Ubicación no especificada",
            categoryDisplay: typeof event.category === 'object' ? event.category?.name || 'General' : event.category || 'General',
            price: event.price || 0,
            capacity: event.capacity || event.total_capacity || 0,
            soldTickets: event.sold || event.soldTickets || 0,
            slug: event.slug || `evento-${event.id}`,
            featured: event.featured || false
          }))
          
          setAllEvents(events)
          
          // Filtrar eventos destacados
          const featured = events.filter(event => event.featured === true)
          setFeaturedEvents(featured)
        }
      } catch (error) {
        console.error('Error loading events:', error)
        // En caso de error, usar datos de ejemplo
        const fallbackEvents = [
          {
            id: 1,
            title: "PANACA VIAJERO BARRANQUILLA",
            description: "Una experiencia única con la naturaleza y los animales de la granja.",
            image: "/placeholder.jpg",
            date: "20 DE JUNIO 2025",
            location: "PARQUE NORTE - BARRANQUILLA",
            locationDisplay: "Parque Norte, Barranquilla",
            categoryDisplay: "Familiar",
            price: 45000,
            capacity: 500,
            soldTickets: 150,
            slug: "panaca-viajero-barranquilla",
            featured: true
          }
        ]
        setAllEvents(fallbackEvents)
        setFeaturedEvents(fallbackEvents)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])
  if (isLoading) {
    return (
      <div className="w-full">
        {/* Featured Events Loading */}
        <section className="py-12 md:py-20 bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-600 w-full">
          <div className="container mx-auto px-4">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Cargando eventos destacados...</p>
            </div>
          </div>
        </section>

        {/* Events Loading */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Explora Eventos</h2>
              <p className="text-neutral-600 mb-8">Encuentra el evento perfecto para ti</p>
            </div>
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando eventos...</p>
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Featured Events - Fondo extendido a toda la página */}
      <FeaturedEventsList events={featuredEvents} />

      {/* Events Explorer - Limitado a 6 eventos */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Explora Eventos</h2>
            <p className="text-neutral-600 mb-8">Encuentra el evento perfecto para ti</p>
          </div>

          {allEvents.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay eventos disponibles</h3>
              <p className="text-gray-500">
                Pronto tendremos eventos increíbles para ti.
              </p>
            </div>
          ) : (
            <>
              {/* Grid de eventos con diseño mejorado - Solo 6 eventos */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {allEvents.slice(0, 6).map((event) => (
              <div key={event.id} className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 hover:border-primary-200 transform hover:-translate-y-2">
                <a href={`/evento/${event.slug}`}>
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={event.image || "/placeholder.svg"}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                    
                    {/* Badge de categoría */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                        {event.categoryDisplay}
                      </span>
                    </div>
                    
                    {/* Badge destacado */}
                    {event.featured && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                          Destacado
                        </span>
                      </div>
                    )}
                  </div>
                </a>

                <div className="p-6">
                  <a href={`/evento/${event.slug}`}>
                    <h3 className="font-bold text-xl mb-4 group-hover:text-primary-600 transition-colors line-clamp-2 text-gray-800 leading-tight">
                      {event.title}
                    </h3>
                  </a>

                  <div className="space-y-3 text-sm text-gray-600 mb-6">
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-primary-50 mr-3 group-hover:bg-primary-100 transition-colors">
                        <svg className="h-4 w-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-700">{event.date}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="p-2 rounded-lg bg-secondary-50 mr-3 group-hover:bg-secondary-100 transition-colors">
                        <svg className="h-4 w-4 text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="font-medium text-gray-700">{event.locationDisplay}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100">
                    <a
                      href={`/evento/${event.slug}`}
                      className="inline-flex items-center justify-center w-full bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group/link"
                    >
                      Ver detalles
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 ml-2 group-hover/link:translate-x-1 transition-transform"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

              {/* Botón para ver más eventos */}
              <div className="text-center mt-12">
                <a
                  href="/eventos"
                  className="inline-flex items-center bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Ver Todos los Eventos
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 ml-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Métodos de Pago */}
      <section className="bg-wh-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              Métodos de Pago Aceptados
            </h4>
          </div>
          
          <div className="flex justify-center">
            <img 
              src="/images/medios-de-pago-cobru.png"
              width={800}
              height={200}
              alt="Métodos de pago aceptados"
              className="max-w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
      </section>
    </div>
  )
}