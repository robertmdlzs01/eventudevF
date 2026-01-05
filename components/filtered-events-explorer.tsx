"use client"

import { useState } from "react"
import EventCard from "@/components/event-card"
import { Event } from "@/lib/types"

interface FilteredEventsExplorerProps {
  events: Event[]
  totalEvents: number
  isSearching?: boolean
}

export function FilteredEventsExplorer({ events, totalEvents, isSearching = false }: FilteredEventsExplorerProps) {
  const [sortBy, setSortBy] = useState<"date" | "price" | "name">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const sortedEvents = [...events].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case "date":
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        comparison = dateA.getTime() - dateB.getTime()
        break
      case "price":
        comparison = (a.price || 0) - (b.price || 0)
        break
      case "name":
        comparison = a.title.localeCompare(b.title)
        break
    }
    
    return sortOrder === "asc" ? comparison : -comparison
  })

  if (isSearching) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Buscando eventos...</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron eventos</h3>
        <p className="text-gray-500">
          Intenta ajustar los filtros o buscar con términos diferentes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grid de eventos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        {sortedEvents.map((event) => (
          <EventCard 
            key={event.id} 
            title={event.title}
            image={event.image_url || "/placeholder.svg"}
            date={event.date}
            location={event.location}
            category={typeof event.category === 'object' ? event.category?.name || 'Sin categoría' : event.category || 'Sin categoría'}
            slug={event.slug}
            featured={event.featured}
          />
        ))}
      </div>

    </div>
  )
}
