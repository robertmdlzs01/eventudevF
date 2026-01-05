"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Calendar, MapPin, X, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiClient } from "@/lib/api-client"

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

interface SearchBarProps {
  onFilterChange?: (filteredEvents: SearchEvent[], totalEvents: number) => void
}

export default function SearchBar({ onFilterChange }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [location, setLocation] = useState("all")
  const [category, setCategory] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [priceRange, setPriceRange] = useState("all")
  const [filteredEvents, setFilteredEvents] = useState<SearchEvent[]>([])
  const [allEvents, setAllEvents] = useState<SearchEvent[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Load events from API
  useEffect(() => {
    const loadEvents = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.getEvents()
        if (response.success && response.data) {
          const events = response.data.map((event: any) => ({
            id: event.id,
            title: event.title,
            image_url: event.image_url,
            date: event.date,
            location: event.location?.toLowerCase() || "bogota",
            locationDisplay: event.location || "BOGOTÁ",
            category: (typeof event.category === 'object' ? event.category.name : event.category)?.toLowerCase() || "general",
            categoryDisplay: typeof event.category === 'object' ? event.category.name : event.category || "General",
            price: event.price,
            slug: event.slug,
          }))
          setAllEvents(events)
        }
      } catch (error) {
        console.error("Error loading events:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadEvents()
  }, [])

  // Filter events based on search criteria
  useEffect(() => {
    if (allEvents.length === 0) return

    setIsSearching(true)

    const filtered = allEvents.filter((event) => {
      const matchesSearch = searchQuery.trim() === "" || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.categoryDisplay.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = category === "all" || event.category === category
      const matchesLocation = location === "all" || event.location === location
      
      // Filtro por fecha
      let matchesDate = true
      if (dateFilter !== "all") {
        const eventDate = new Date(event.date)
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        
        switch (dateFilter) {
          case "today":
            matchesDate = eventDate >= today && eventDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
            break
          case "week":
            const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
            matchesDate = eventDate >= today && eventDate < weekEnd
            break
          case "month":
            const monthEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
            matchesDate = eventDate >= today && eventDate < monthEnd
            break
          case "upcoming":
            matchesDate = eventDate >= today
            break
        }
      }
      
      // Filtro por rango de precio
      let matchesPrice = true
      if (priceRange !== "all") {
        switch (priceRange) {
          case "free":
            matchesPrice = event.price === 0
            break
          case "low":
            matchesPrice = event.price > 0 && event.price <= 50000
            break
          case "medium":
            matchesPrice = event.price > 50000 && event.price <= 150000
            break
          case "high":
            matchesPrice = event.price > 150000
            break
        }
      }

      return matchesSearch && matchesCategory && matchesLocation && matchesDate && matchesPrice
    })

    setFilteredEvents(filtered)
    setIsSearching(false)
  }, [searchQuery, location, category, dateFilter, priceRange, allEvents])

  // Separate effect to notify parent component
  useEffect(() => {
    if (onFilterChange && allEvents.length > 0) {
      onFilterChange(filteredEvents, allEvents.length)
    }
  }, [filteredEvents, allEvents.length, onFilterChange])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/eventos?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  const handleEventClick = (event: SearchEvent) => {
    router.push(`/evento/${event.slug}`)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setLocation("all")
    setCategory("all")
    setDateFilter("all")
    setPriceRange("all")
  }

  const getUniqueLocations = () => {
    const locations = Array.from(new Set(allEvents.map((event) => event.location)))
    return locations.sort()
  }

  const getUniqueCategories = () => {
    const categories = Array.from(new Set(allEvents.map((event) => 
      typeof event.category === 'object' && event.category && 'name' in event.category 
        ? (event.category as any).name 
        : event.category
    )))
    return categories.sort()
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded-lg mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-gray-900 placeholder:text-gray-500"
            />
          </div>

          {/* Location Filter */}
          <Select value={location} onValueChange={setLocation}>
            <SelectTrigger className="text-gray-900">
              <MapPin className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Ubicación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las ubicaciones</SelectItem>
              {getUniqueLocations().map((loc) => (
                <SelectItem key={loc} value={loc}>
                  {loc.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Category Filter */}
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="text-gray-900">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {getUniqueCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Date Filter */}
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="text-gray-900">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Fecha" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier fecha</SelectItem>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="upcoming">Próximos eventos</SelectItem>
            </SelectContent>
          </Select>

          {/* Price Filter */}
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="text-gray-900">
              <DollarSign className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Precio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cualquier precio</SelectItem>
              <SelectItem value="free">Gratis</SelectItem>
              <SelectItem value="low">$0 - $50,000</SelectItem>
              <SelectItem value="medium">$50,000 - $150,000</SelectItem>
              <SelectItem value="high">$150,000+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Actions */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {(searchQuery || location !== "all" || category !== "all" || dateFilter !== "all" || priceRange !== "all") && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="text-gray-600"
              >
                <X className="h-4 w-4 mr-1" />
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

