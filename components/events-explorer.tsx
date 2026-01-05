"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Filter, Calendar, MapPin, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import EventCard from "@/components/event-card"
import { apiClient } from "@/lib/api-client"

interface EventsExplorerProps {
  events?: any[]
}

export function EventsExplorer({ events = [] }: EventsExplorerProps) {
  const [allEvents, setAllEvents] = useState<any[]>(events)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

         // Cargar eventos del backend si no se pasaron como props
         useEffect(() => {
           if (allEvents.length === 0) {
             setLoading(true)
             apiClient.getEvents()
               .then(response => {
                 if (response.success && response.data) {
                   setAllEvents(response.data)
                 }
               })
               .catch(error => {
                 console.error('Error fetching events:', error)
               })
               .finally(() => {
                 setLoading(false)
               })
           }
         }, [allEvents.length])

  // Obtener categorías y ubicaciones únicas
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allEvents.map((event) => 
      typeof event.category === 'object' && event.category && 'name' in event.category 
        ? (event.category as any).name 
        : event.category
    ).filter(Boolean)))
    return cats.sort()
  }, [allEvents])

  const locations = useMemo(() => {
    const locs = Array.from(new Set(allEvents.map((event) => event.location).filter(Boolean)))
    return locs.sort()
  }, [allEvents])

  // Filtrar y ordenar eventos
  const filteredEvents = useMemo(() => {
    const filtered = allEvents.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof event.organizer === 'object' && event.organizer && 'name' in event.organizer 
          ? (event.organizer as any).name 
          : event.organizer)?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = selectedCategory === "all" || 
        (typeof event.category === 'object' && event.category && 'name' in event.category 
          ? (event.category as any).name 
          : event.category) === selectedCategory
      const matchesLocation = selectedLocation === "all" || event.location === selectedLocation

      return matchesSearch && matchesCategory && matchesLocation
    })

    // Ordenar eventos
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          const dateA = new Date(a.startDate || a.date)
          const dateB = new Date(b.startDate || b.date)
          return dateA.getTime() - dateB.getTime()
        case "price":
          return (a.price || 0) - (b.price || 0)
        case "popularity":
          return (b.soldTickets || 0) - (a.soldTickets || 0)
        case "rating":
          return (b.rating || 0) - (a.rating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [allEvents, searchTerm, selectedCategory, selectedLocation, sortBy])

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedCategory("all")
    setSelectedLocation("all")
    setSortBy("date")
  }

  const handleClearSearch = () => setSearchTerm("")
  const handleClearCategory = () => setSelectedCategory("all")
  const handleClearLocation = () => setSelectedLocation("all")

  if (loading) {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Explora Eventos</h2>
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (allEvents.length === 0) {
    return (
      <section className="py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Explora Eventos</h2>
            <p className="text-neutral-600 mb-8">No hay eventos disponibles en este momento</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-800 mb-4">Explora Eventos</h2>
          <p className="text-neutral-600 mb-8">Encuentra el evento perfecto para ti</p>
        </div>

        {/* Filtros y búsqueda */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Búsqueda */}
            <div className="lg:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar eventos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoría */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ubicación */}
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <MapPin className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location.charAt(0).toUpperCase() + location.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Ordenar */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Fecha</SelectItem>
                <SelectItem value="price">Precio</SelectItem>
                <SelectItem value="popularity">Popularidad</SelectItem>
                <SelectItem value="rating">Calificación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtros activos */}
          <div className="flex flex-wrap gap-2 mt-4">
            {searchTerm && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Búsqueda: "{searchTerm}"
                <button onClick={handleClearSearch} className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            {selectedCategory !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Categoría: {selectedCategory}
                <button onClick={handleClearCategory} className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            {selectedLocation !== "all" && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Ubicación: {selectedLocation}
                <button onClick={handleClearLocation} className="ml-1 hover:text-red-500">
                  ×
                </button>
              </Badge>
            )}
            {(searchTerm || selectedCategory !== "all" || selectedLocation !== "all") && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-6">
          <p className="text-neutral-600">
            {filteredEvents.length} evento{filteredEvents.length !== 1 ? "s" : ""} encontrado
            {filteredEvents.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Grid de eventos */}
        {filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                title={event.title}
                image={event.image}
                date={event.date}
                location={event.locationDisplay}
                category={event.categoryDisplay}
                slug={event.slug}
                featured={event.featured}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No se encontraron eventos</h3>
            <p className="text-gray-500 mb-4">Intenta ajustar tus filtros de búsqueda</p>
            <Button onClick={clearFilters} variant="outline">
              Limpiar filtros
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
