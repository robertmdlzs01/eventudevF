"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Eye, MoreHorizontal, Copy } from "lucide-react"
import { SeatMapStorage, type SeatMapData } from "@/lib/seat-map-storage"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export default function AdminSeatMapsPageClient() {
  const { toast } = useToast()
  const router = useRouter()
  const [seatMaps, setSeatMaps] = useState<SeatMapData[]>([])
  const [newMapName, setNewMapName] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMapData, setEditingMapData] = useState<SeatMapData | null>(null)
  const [selectedEventId, setSelectedEventId] = useState<string>("")
  const [availableEvents, setAvailableEvents] = useState<Array<{ id: string; title: string }>>([])

  const seatMapStorage = new SeatMapStorage()

  useEffect(() => {
    loadSeatMaps()
    loadAvailableEvents()
  }, [])

  const loadSeatMaps = async () => {
    try {
      const response = await apiClient.getSeatMaps()
      if (response.success && response.data) {
        // Transformar los datos de la API para que coincidan con la estructura esperada
        const transformedMaps = response.data.map((map: any) => ({
          id: map.id.toString(),
          name: map.name || 'Mapa sin nombre',
          eventId: map.event_id || '',
          sections: map.sections || [],
          metadata: {
            capacity: map.total_seats || map.total_capacity || 0,
            createdAt: new Date(map.created_at || Date.now()),
            updatedAt: new Date(map.updated_at || Date.now()),
            isPublished: true
          }
        }))
        setSeatMaps(transformedMaps)
        console.log(`✅ Mapas cargados desde API: ${transformedMaps.length} mapas`)
      } else {
        console.warn("⚠️ API falló, usando fallback del localStorage")
        // Fallback to local storage if API fails
        const maps = seatMapStorage.getAllSeatMaps()
        setSeatMaps(maps)
      }
    } catch (error) {
      console.error("Error loading seat maps:", error)
      // Fallback to local storage
      const maps = seatMapStorage.getAllSeatMaps()
      setSeatMaps(maps)
    }
  }

  const loadAvailableEvents = async () => {
    try {
      const response = await apiClient.getEvents()
      if (response.success && response.data) {
        const events = response.data.map((event: any) => ({
          id: event.id.toString(),
          title: event.title
        }))
        setAvailableEvents(events)
      } else {
        setAvailableEvents([])
      }
    } catch (error) {
      console.error("Error loading events:", error)
      setAvailableEvents([])
    }
  }

  const handleCreateMap = async () => {
    if (!newMapName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del mapa es requerido.",
        variant: "destructive",
      })
      return
    }

    const eventId = selectedEventId || `default-event-${Date.now()}`

    const newMapData = {
      name: newMapName,
      eventId: selectedEventId,
      sections: [],
      metadata: {
        capacity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPublished: false
      },
      map_data: { sections: [] }
    }

    try {
      const response = await apiClient.createSeatMap(newMapData)
      if (response.success) {
        await loadSeatMaps()
        setNewMapName("")
        setSelectedEventId("")
        setIsCreateDialogOpen(false)
        toast({
          title: "Mapa creado",
          description: `El mapa "${newMapName}" ha sido creado exitosamente.`,
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al crear el mapa",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating seat map:", error)
      toast({
        title: "Error",
        description: "Error al crear el mapa",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMap = async () => {
    if (editingMapData) {
      try {
        const updateData = {
          name: editingMapData.name,
          total_capacity: editingMapData.metadata?.capacity || 0,
        }

        const response = await apiClient.updateSeatMap(editingMapData.id, updateData)
        if (response.success) {
          await loadSeatMaps()
          setIsEditDialogOpen(false)
          toast({
            title: "Mapa actualizado",
            description: `El mapa "${editingMapData.name}" ha sido actualizado.`,
          })
        } else {
          toast({
            title: "Error",
            description: response.message || "Error al actualizar el mapa",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error updating seat map:", error)
        toast({
          title: "Error",
          description: "Error al actualizar el mapa",
          variant: "destructive",
        })
      }
    }
  }

  const handleDeleteMap = async (id: string) => {
    try {
      const response = await apiClient.deleteSeatMap(id)
      if (response.success) {
        await loadSeatMaps()
        toast({
          title: "Mapa eliminado",
          description: "El mapa de asientos ha sido eliminado.",
        })
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al eliminar el mapa",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting seat map:", error)
      toast({
        title: "Error",
        description: "Error al eliminar el mapa",
        variant: "destructive",
      })
    }
  }

  const handleDuplicateMap = (map: any) => {
    // Por ahora, solo mostrar un mensaje ya que la duplicación requiere backend
    toast({
      title: "Función no disponible",
      description: "La duplicación de mapas se implementará próximamente.",
      variant: "default",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Mapas de Asientos</h1>
          <p className="text-muted-foreground">Crea y administra los mapas de asientos para tus eventos.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Nuevo Mapa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Mapa de Asientos</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="newMapName">Nombre del Mapa</Label>
                <Input
                  id="newMapName"
                  value={newMapName}
                  onChange={(e) => setNewMapName(e.target.value)}
                  placeholder="Ej: Mapa Principal Auditorio"
                />
              </div>
              <div>
                <Label htmlFor="eventSelect">Evento (Opcional)</Label>
                <select
                  id="eventSelect"
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Seleccionar evento...</option>
                  {availableEvents.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.title}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCreateMap} className="w-full">
                Crear Mapa
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mensaje informativo sobre autenticación */}
      {seatMaps.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <p className="text-sm text-blue-700">
              <strong>Nota:</strong> Para ver todos los mapas de asientos, asegúrate de estar autenticado. 
              Si solo ves un mapa o ninguno, intenta recargar la página después de iniciar sesión.
            </p>
          </div>
          <div className="mt-3 flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                const token = localStorage.getItem('auth_token');
                const user = localStorage.getItem('current_user');
                console.log('🔍 Debug - Token:', token ? 'Presente' : 'Ausente');
                console.log('🔍 Debug - User:', user ? 'Presente' : 'Ausente');
                console.log('🔍 Debug - Auth Status:', localStorage.getItem('eventu_authenticated'));
              }}
            >
              Debug Auth
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/login'}
            >
              Ir al Login
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seatMaps.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground py-8">No hay mapas de asientos creados.</p>
        ) : (
          seatMaps.map((map) => (
            <Card key={map.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{map.name}</CardTitle>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Abrir menú</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingMapData(map)
                        setIsEditDialogOpen(true)
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Nombre
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push(`/admin/eventos/${map.id}/mapa-asientos`)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Detalles / Editar Diseño
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicateMap(map)}>
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteMap(map.id)} className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  <p>Capacidad Total: {map.metadata?.capacity || 0}</p>
                  <p>Secciones: {map.sections?.length || 0}</p>
                  <p>Evento: {map.eventId || 'Sin evento asignado'}</p>
                  <p>Venue: {'No especificado'}</p>
                  <p>Última Actualización: {map.metadata?.updatedAt ? new Date(map.metadata.updatedAt).toLocaleDateString() : 'No disponible'}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/eventos/${map.id}/mapa-asientos`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Editar Diseño
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Mapa de Asientos</DialogTitle>
          </DialogHeader>
          {editingMapData && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="editMapName">Nombre del Mapa</Label>
                <Input
                  id="editMapName"
                  value={editingMapData.name}
                  onChange={(e) => setEditingMapData({ ...editingMapData, name: e.target.value })}
                  placeholder="Ej: Configuración Principal"
                />
              </div>
              <Button onClick={handleUpdateMap} className="w-full">
                Guardar Cambios
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
