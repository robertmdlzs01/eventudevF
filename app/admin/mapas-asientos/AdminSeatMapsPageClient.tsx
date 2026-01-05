"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { AdminSeatMap, createSeatMap, updateSeatMap, deleteSeatMap } from "@/app/admin/actions"
import { MapPin, Users, Plus, Edit, Trash2, Search, Filter, Settings, Download } from "lucide-react"

interface AdminSeatMapsPageClientProps {
  initialSeatMaps: AdminSeatMap[]
}

export default function AdminSeatMapsPageClient({ initialSeatMaps }: AdminSeatMapsPageClientProps) {
  const { toast } = useToast()
  const [seatMaps, setSeatMaps] = useState<AdminSeatMap[]>(initialSeatMaps)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    venueName: "",
    totalCapacity: 100,
  })
  const [showGeneratorDialog, setShowGeneratorDialog] = useState(false)
  const [generatorConfig, setGeneratorConfig] = useState({
    rows: 10,
    seatsPerRow: 10,
    sectionType: "theater",
    hasAisles: true,
    aislePositions: [5, 15]
  })

  const handleCreateSeatMap = async () => {
    setIsLoading(true)
    try {
      const success = await createSeatMap({
        name: formData.name,
        venueName: formData.venueName,
        totalCapacity: formData.totalCapacity,
      })

      if (success) {
        toast({ title: "Mapa creado exitosamente" })
        setShowCreateDialog(false)
        setFormData({ name: "", venueName: "", totalCapacity: 100 })
        // Recargar lista
        const response = await apiClient.getSeatMaps()
        if (response.success && response.data) {
          setSeatMaps(response.data.map((seatMap: any) => ({
            id: seatMap.id.toString(),
            name: seatMap.name,
            venueName: seatMap.venue_name,
            totalCapacity: seatMap.total_capacity,
            mapData: seatMap.map_data,
            totalSeats: seatMap.total_seats || 0,
            availableSeats: seatMap.available_seats || 0,
            reservedSeats: seatMap.reserved_seats || 0,
            occupiedSeats: seatMap.occupied_seats || 0,
            createdAt: seatMap.created_at,
            updatedAt: seatMap.updated_at,
          })))
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al crear mapa", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSeatMap = async (seatMapId: string) => {
    if (!confirm("¿Eliminar este mapa de asientos?")) return

    try {
      const success = await deleteSeatMap(seatMapId)
      if (success) {
        toast({ title: "Mapa eliminado exitosamente" })
        setSeatMaps(seatMaps.filter((seatMap) => seatMap.id !== seatMapId))
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al eliminar mapa", variant: "destructive" })
    }
  }

  const handleOpenGenerator = () => {
    setShowGeneratorDialog(true)
  }

  const handleGenerateSeatMap = async () => {
    setIsLoading(true)
    try {
      const totalCapacity = generatorConfig.rows * generatorConfig.seatsPerRow
      const mapData = {
        rows: generatorConfig.rows,
        seatsPerRow: generatorConfig.seatsPerRow,
        sectionType: generatorConfig.sectionType,
        hasAisles: generatorConfig.hasAisles,
        aislePositions: generatorConfig.aislePositions,
        seats: [] as Array<{
          id: string
          row: number
          seat: number
          status: string
          price: number
        }>
      }

      // Generar datos de asientos
      for (let row = 1; row <= generatorConfig.rows; row++) {
        for (let seat = 1; seat <= generatorConfig.seatsPerRow; seat++) {
          mapData.seats.push({
            id: `${row}-${seat}`,
            row: row,
            seat: seat,
            status: "available",
            price: 0
          })
        }
      }

      const success = await createSeatMap({
        name: `Mapa Generado - ${generatorConfig.rows}x${generatorConfig.seatsPerRow}`,
        venueName: "Venue Generado",
        totalCapacity: totalCapacity,
        mapData: mapData
      })

      if (success) {
        toast({ title: "Mapa generado exitosamente" })
        setShowGeneratorDialog(false)
        // Recargar lista
        const response = await apiClient.getSeatMaps()
        if (response.success && response.data) {
          setSeatMaps(response.data.map((seatMap: any) => ({
            id: seatMap.id.toString(),
            name: seatMap.name,
            venueName: seatMap.venue_name,
            totalCapacity: seatMap.total_capacity,
            mapData: seatMap.map_data,
            totalSeats: seatMap.total_seats || 0,
            availableSeats: seatMap.available_seats || 0,
            reservedSeats: seatMap.reserved_seats || 0,
            occupiedSeats: seatMap.occupied_seats || 0,
            createdAt: seatMap.created_at,
            updatedAt: seatMap.updated_at,
          })))
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Error al generar mapa", variant: "destructive" })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditSeatMap = async (seatMap: AdminSeatMap) => {
    // Implementar edición de mapa
    toast({ title: "Función en desarrollo", description: "La edición de mapas estará disponible pronto" })
  }

  const handleExportSeatMap = async (seatMap: AdminSeatMap) => {
    try {
      const csvContent = [
        "ID Asiento,Fila,Asiento,Estado,Precio",
        ...(seatMap.mapData?.seats || []).map((seat: any) => 
          `${seat.id},${seat.row},${seat.seat},${seat.status},${seat.price}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `seat-map-${seatMap.name}-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({ title: "Mapa exportado", description: "El mapa ha sido exportado exitosamente" })
    } catch (error) {
      toast({ title: "Error", description: "Error al exportar el mapa", variant: "destructive" })
    }
  }

  const filteredSeatMaps = seatMaps.filter((seatMap) =>
    seatMap.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    seatMap.venueName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Mapas de Asientos</h1>
          <p className="text-gray-600">Gestiona los mapas de asientos para eventos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleOpenGenerator}>
            <Settings className="w-4 h-4 mr-2" />
            Generador
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Mapa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Mapa de Asientos</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Teatro Principal"
                  />
                </div>
                <div>
                  <Label>Venue</Label>
                  <Input
                    value={formData.venueName}
                    onChange={(e) => setFormData({ ...formData, venueName: e.target.value })}
                    placeholder="Teatro Colón"
                  />
                </div>
                <div>
                  <Label>Capacidad</Label>
                  <Input
                    type="number"
                    value={formData.totalCapacity}
                    onChange={(e) => setFormData({ ...formData, totalCapacity: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateSeatMap} disabled={isLoading}>
                    {isLoading ? "Creando..." : "Crear"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Buscar mapas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredSeatMaps.map((seatMap) => (
          <Card key={seatMap.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle>{seatMap.name}</CardTitle>
                    <p className="text-gray-600">{seatMap.venueName}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Users className="w-3 h-3 mr-1" />
                    {seatMap.totalCapacity} asientos
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditSeatMap(seatMap)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExportSeatMap(seatMap)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSeatMap(seatMap.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{seatMap.availableSeats}</div>
                  <div className="text-sm text-gray-600">Disponibles</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">{seatMap.reservedSeats}</div>
                  <div className="text-sm text-gray-600">Reservados</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{seatMap.occupiedSeats}</div>
                  <div className="text-sm text-gray-600">Ocupados</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSeatMaps.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No hay mapas de asientos</h3>
            <p className="text-gray-600 mb-4">Crea tu primer mapa de asientos</p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Mapa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Modal del Generador de Mapas */}
      <Dialog open={showGeneratorDialog} onOpenChange={setShowGeneratorDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generador de Mapas de Asientos</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número de Filas</Label>
                <Input
                  type="number"
                  value={generatorConfig.rows}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, rows: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                />
              </div>
              <div>
                <Label>Asientos por Fila</Label>
                <Input
                  type="number"
                  value={generatorConfig.seatsPerRow}
                  onChange={(e) => setGeneratorConfig({ ...generatorConfig, seatsPerRow: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                />
              </div>
            </div>
            <div>
              <Label>Tipo de Sección</Label>
              <select
                value={generatorConfig.sectionType}
                onChange={(e) => setGeneratorConfig({ ...generatorConfig, sectionType: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="theater">Teatro</option>
                <option value="stadium">Estadio</option>
                <option value="conference">Conferencia</option>
                <option value="cinema">Cine</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="hasAisles"
                checked={generatorConfig.hasAisles}
                onChange={(e) => setGeneratorConfig({ ...generatorConfig, hasAisles: e.target.checked })}
              />
              <Label htmlFor="hasAisles">Incluir pasillos</Label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowGeneratorDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleGenerateSeatMap} disabled={isLoading}>
                {isLoading ? "Generando..." : "Generar Mapa"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
