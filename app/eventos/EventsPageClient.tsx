"use client"

import { useState, useEffect, useCallback } from "react"
import SearchBar from "@/components/search-bar"
import { FilteredEventsExplorer } from "@/components/filtered-events-explorer"
import { getAllEvents } from "@/lib/events-data"
import { Event } from "@/lib/types"

interface SearchEvent {
  id: number
  title: string
  image_url?: string
  date: string
  location: string
  locationDisplay: string
  category: string
  categoryDisplay: string
  price: number
  slug: string
}

export default function EventsPageClient() {
  const [allEvents, setAllEvents] = useState<Event[]>([])
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)

  // Cargar eventos al montar el componente
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const events = await getAllEvents()
        setAllEvents(events)
        setFilteredEvents(events)
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Función para manejar cambios en los filtros
  const handleFilterChange = useCallback((searchEvents: SearchEvent[], totalEvents: number) => {
    // Convertir SearchEvent a Event para mantener compatibilidad
    const convertedEvents: Event[] = searchEvents.map(searchEvent => ({
      id: searchEvent.id.toString(),
      title: searchEvent.title,
      slug: searchEvent.slug,
      description: "",
      image_url: searchEvent.image_url,
      date: searchEvent.date,
      startDate: searchEvent.date,
      endDate: searchEvent.date,
      time: "",
      location: searchEvent.locationDisplay,
      price: searchEvent.price,
      category: { id: "1", name: searchEvent.categoryDisplay },
      featured: false,
      status: "active",
      capacity: 0,
      total_capacity: 0,
      sold: 0,
      youtubeUrl: "",
      video_url: "",
      gallery_images: [],
      tags: [],
      organizer_id: 0,
      organizer: {
        id: "0",
        name: "",
        email: "",
        phone: "",
        description: "",
        website: "",
        logo_url: "",
        created_at: "",
        updated_at: ""
      }
    }))
    
    setFilteredEvents(convertedEvents)
    setIsSearching(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <main className="flex-1">
          <section className="w-full py-12 md:py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
            <div className="container px-4 md:px-6 text-center">
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Eventos</h1>
              <p className="max-w-[700px] mx-auto text-lg md:text-xl mb-8">
                Encuentra el evento perfecto para ti
              </p>
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="animate-pulse">
                    <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section className="w-full py-8 md:py-12">
            <div className="container px-4 md:px-6">
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Cargando eventos...</p>
              </div>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        {/* Header con buscador */}
        <section className="w-full py-12 md:py-16 bg-gradient-to-r from-pink-500 to-purple-600 text-white">
          <div className="container px-4 md:px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">Eventos</h1>
            <p className="max-w-[700px] mx-auto text-lg md:text-xl mb-8">
              Encuentra el evento perfecto para ti
            </p>
            <div className="max-w-4xl mx-auto">
              <SearchBar onFilterChange={handleFilterChange} />
            </div>
          </div>
        </section>

        {/* Lista de eventos filtrados */}
        <section className="w-full py-8 md:py-12">
          <div className="container px-4 md:px-6">
            <FilteredEventsExplorer 
              events={filteredEvents} 
              totalEvents={allEvents.length}
              isSearching={isSearching}
            />
          </div>
        </section>
      </main>
    </div>
  )
}
