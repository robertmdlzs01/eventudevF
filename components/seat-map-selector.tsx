"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { MapPin, Users, Settings, Plus, Edit, Trash2, Eye } from "lucide-react"

interface SeatMap {
  id: number
  name: string
  venue_name: string
  total_capacity: number
  map_data: any
  template_id?: number
  event_id?: number
  event_title?: string
  total_seats: number
  available_seats: number
  reserved_seats: number
  occupied_seats: number
  created_at: string
  updated_at: string
}

interface SeatMapTemplate {
  id: number
  name: string
  description: string
  capacity: number
  layout_data: any
}

interface SeatMapSelectorProps {
  selectedSeatMapId?: number
  onSeatMapChange: (seatMapId: number | null) => void
  eventId?: number
  disabled?: boolean
}

export default function SeatMapSelector({
  selectedSeatMapId,
  onSeatMapChange,
  eventId,
  disabled = false,
}: SeatMapSelectorProps) {
  const { toast } = useToast()
  const [seatMaps, setSeatMaps] = useState<SeatMap[]>([])
  const [templates, setTemplates] = useState<SeatMapTemplate[]>([])
  const [selectedSeatMap, setSelectedSeatMap] = useState<SeatMap | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [createFormData, setCreateFormData] = useState({
    name: "",
    venue_name: "",
    total_capacity: 100,
    map_data: {},
    template_id: "",
  })

  // Cargar mapas de asientos y plantillas
  useEffect(() => {
    loadSeatMaps()
    loadTemplates()
  }, [])

  // Cargar mapa seleccionado
  useEffect(() => {
    if (selectedSeatMapId) {
      loadSelectedSeatMap()
    } else {
      setSelectedSeatMap(null)
    }
  }, [selectedSeatMapId])

  const loadSeatMaps = async () => {
    try {
      const response = await apiClient.getSeatMaps()
      if (response.success && response.data) {
        setSeatMaps(response.data)
      }
    } catch (error) {
      console.error("Error loading seat maps:", error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await apiClient.getSeatMapTemplates()
      if (response.success && response.data) {
        setTemplates(response.data)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadSelectedSeatMap = async () => {
    if (!selectedSeatMapId) return

    try {
      const response = await apiClient.getSeatMap(selectedSeatMapId.toString())
      if (response.success && response.data) {
        setSelectedSeatMap(response.data)
      }
    } catch (error) {
      console.error("Error loading selected seat map:", error)
    }
  }

  const handleCreateSeatMap = async () => {
    setIsLoading(true)
    try {
      const seatMapData = {
        ...createFormData,
        template_id: createFormData.template_id ? parseInt(createFormData.template_id) : undefined,
        event_id: eventId,
      }

      const response = await apiClient.createSeatMap(seatMapData)
      if (response.success) {
        toast({
          title: "Mapa de asientos creado",
          description: "El mapa de asientos se ha creado exitosamente",
        })
        setShowCreateDialog(false)
        setCreateFormData({
          name: "",
          venue_name: "",
          total_capacity: 100,
          map_data: {},
          template_id: "",
        })
        loadSeatMaps()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al crear el mapa de asientos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating seat map:", error)
      toast({
        title: "Error",
        description: "Error al crear el mapa de asientos",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteSeatMap = async (seatMapId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este mapa de asientos?")) {
      return
    }

    try {
      const response = await apiClient.deleteSeatMap(seatMapId.toString())
      if (response.success) {
        toast({
          title: "Mapa de asientos eliminado",
          description: "El mapa de asientos se ha eliminado exitosamente",
        })
        if (selectedSeatMapId === seatMapId) {
          onSeatMapChange(null)
        }
        loadSeatMaps()
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al eliminar el mapa de asientos",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting seat map:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el mapa de asientos",
        variant: "destructive",
      })
    }
  }

  const formatCapacity = (capacity: number) => {
    return new Intl.NumberFormat("es-CO").format(capacity)
  }

  const getSeatMapStatus = (seatMap: SeatMap) => {
    if (seatMap.occupied_seats > 0) return "Ocupado"
    if (seatMap.reserved_seats > 0) return "Reservado"
    return "Disponible"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Disponible":
        return "bg-green-100 text-green-800"
      case "Reservado":
        return "bg-yellow-100 text-yellow-800"
      case "Ocupado":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Mapa de Asientos</h3>
          <p className="text-sm text-gray-600">
            Selecciona un mapa de asientos para este evento o crea uno nuevo
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={disabled}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Mapa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Mapa de Asientos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nombre del Mapa</Label>
                  <Input
                    id="name"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    placeholder="Ej: Teatro Principal"
                  />
                </div>
                <div>
                  <Label htmlFor="venue_name">Nombre del Venue</Label>
                  <Input
                    id="venue_name"
                    value={createFormData.venue_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, venue_name: e.target.value })}
                    placeholder="Ej: Teatro Colón"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_capacity">Capacidad Total</Label>
                  <Input
                    id="total_capacity"
                    type="number"
                    value={createFormData.total_capacity}
                    onChange={(e) => setCreateFormData({ ...createFormData, total_capacity: parseInt(e.target.value) })}
                    min="1"
                  />
                </div>
                <div>
                  <Label htmlFor="template_id">Plantilla (Opcional)</Label>
                  <Select
                    value={createFormData.template_id}
                    onValueChange={(value) => setCreateFormData({ ...createFormData, template_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar plantilla" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id.toString()}>
                          {template.name} ({template.capacity} asientos)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateSeatMap} disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear Mapa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      {/* Mapa seleccionado */}
      {selectedSeatMap && (
        <Card className="border-2 border-primary-200 bg-primary-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {selectedSeatMap.name}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={getStatusColor(getSeatMapStatus(selectedSeatMap))}>
                  {getSeatMapStatus(selectedSeatMap)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSeatMapChange(null)}
                  disabled={disabled}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Venue:</span> {selectedSeatMap.venue_name}
              </div>
              <div>
                <span className="font-medium">Capacidad:</span> {formatCapacity(selectedSeatMap.total_capacity)}
              </div>
              <div>
                <span className="font-medium">Asientos disponibles:</span> {selectedSeatMap.available_seats}
              </div>
              <div>
                <span className="font-medium">Asientos reservados:</span> {selectedSeatMap.reserved_seats}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de mapas disponibles */}
      {!selectedSeatMap && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-700">Mapas de Asientos Disponibles</h4>
          <div className="grid gap-3">
            {seatMaps.map((seatMap) => (
              <Card key={seatMap.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h5 className="font-medium">{seatMap.name}</h5>
                        <Badge className={getStatusColor(getSeatMapStatus(seatMap))}>
                          {getSeatMapStatus(seatMap)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <MapPin className="w-3 h-3 inline mr-1" />
                          {seatMap.venue_name}
                        </div>
                        <div>
                          <Users className="w-3 h-3 inline mr-1" />
                          {formatCapacity(seatMap.total_capacity)} asientos
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onSeatMapChange(seatMap.id)}
                        disabled={disabled}
                      >
                        Seleccionar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSeatMap(seatMap.id)}
                        disabled={disabled}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {seatMaps.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay mapas de asientos disponibles</p>
              <p className="text-sm">Crea un nuevo mapa de asientos para comenzar</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
