"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MapPin, 
  Phone, 
  Mail, 
  User,
  Search,
  Loader2
} from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface SalesPoint {
  id: number
  name: string
  location: string
  contact_person: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
}

export default function SalesPointsPublicPageClient() {
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([])
  const [filteredSalesPoints, setFilteredSalesPoints] = useState<SalesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadSalesPoints()
  }, [])

  useEffect(() => {
    let filtered = salesPoints

    if (searchTerm) {
      filtered = filtered.filter(sp =>
        sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.contact_person.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredSalesPoints(filtered)
  }, [salesPoints, searchTerm])

  const loadSalesPoints = async () => {
    try {
      setLoading(true)
      // Llamar al endpoint público usando apiClient
      const response = await apiClient.getPublicSalesPoints()
      
      if (response.success && response.data) {
        setSalesPoints(response.data)
        setFilteredSalesPoints(response.data)
      } else {
        throw new Error(response.error || 'Error al cargar puntos de venta')
      }
    } catch (error) {
      console.error('Error cargando puntos de venta:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-muted-foreground">Cargando puntos de venta...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Puntos de Venta</h1>
        <p className="text-muted-foreground text-lg">
          Encuentra nuestros puntos de venta físicos para comprar boletos de eventos
        </p>
      </div>

      {/* Búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nombre, ubicación o contacto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary-600" />
              <span className="text-lg font-semibold">
                {filteredSalesPoints.length} {filteredSalesPoints.length === 1 ? 'punto de venta disponible' : 'puntos de venta disponibles'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de puntos de venta */}
      {filteredSalesPoints.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No se encontraron puntos de venta</p>
              <p className="text-muted-foreground">
                {searchTerm ? 'Intenta con otros términos de búsqueda' : 'No hay puntos de venta disponibles en este momento'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSalesPoints.map((salesPoint) => (
            <Card key={salesPoint.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{salesPoint.name}</CardTitle>
                  <Badge variant="default" className="bg-green-500">
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Ubicación</p>
                    <p className="text-sm text-muted-foreground">{salesPoint.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Contacto</p>
                    <p className="text-sm text-muted-foreground">{salesPoint.contact_person}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Teléfono</p>
                    <a 
                      href={`tel:${salesPoint.phone}`}
                      className="text-sm text-primary-600 hover:underline"
                    >
                      {salesPoint.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Email</p>
                    <a 
                      href={`mailto:${salesPoint.email}`}
                      className="text-sm text-primary-600 hover:underline break-all"
                    >
                      {salesPoint.email}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
