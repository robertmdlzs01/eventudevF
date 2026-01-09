"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Eye, Save, Download, Upload, RotateCcw, Plus } from "lucide-react"
import SeatMapDesigner from "@/components/admin/seat-map-designer"

interface AdminSeatMapPageClientProps {
  eventId: string
}

export default function AdminSeatMapPageClient({ eventId }: AdminSeatMapPageClientProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("creator")
  const [savedMaps, setSavedMaps] = useState<any[]>([])
  const [currentMap, setCurrentMap] = useState<any>(null)

  const handleSaveMap = (seatMapData: any) => {
    setCurrentMap(seatMapData)
    setSavedMaps(prev => [...prev, seatMapData])
    toast({
      title: "Mapa guardado",
      description: "El mapa de asientos ha sido guardado exitosamente",
    })
  }

  const handleLoadMap = (mapId: string) => {
    const map = savedMaps.find(m => m.id === mapId)
    if (map) {
      setCurrentMap(map)
      toast({
        title: "Mapa cargado",
        description: "El mapa de asientos ha sido cargado",
      })
    }
  }

  const handleDeleteMap = (mapId: string) => {
    setSavedMaps(prev => prev.filter(m => m.id !== mapId))
    if (currentMap?.id === mapId) {
      setCurrentMap(null)
    }
    toast({
      title: "Mapa eliminado",
      description: "El mapa de asientos ha sido eliminado",
    })
  }

  return (
    <div className="h-screen bg-gray-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mapa de Asientos</h1>
            <p className="text-gray-600">Crea y gestiona mapas de asientos para tus eventos</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Evento ID: {eventId}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="creator">Creador Visual</TabsTrigger>
            <TabsTrigger value="templates">Plantillas</TabsTrigger>
            <TabsTrigger value="saved">Mapas Guardados</TabsTrigger>
          </TabsList>

          <TabsContent value="creator" className="mt-6">
            <div className="h-[calc(100vh-200px)]">
              <SeatMapDesigner 
                eventId={eventId} 
                onSave={handleSaveMap}
              />
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Plantillas Predefinidas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <Eye className="h-8 w-8 text-blue-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Teatro Clásico</h3>
                        <p className="text-sm text-gray-600 mb-3">Diseño tradicional de teatro con platea y balcones</p>
                        <Button size="sm" className="w-full">
                          Usar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <Eye className="h-8 w-8 text-green-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Arena Deportiva</h3>
                        <p className="text-sm text-gray-600 mb-3">Diseño circular para eventos deportivos</p>
                        <Button size="sm" className="w-full">
                          Usar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-purple-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                          <Eye className="h-8 w-8 text-purple-600" />
                        </div>
                        <h3 className="font-semibold mb-2">Sala de Conferencias</h3>
                        <p className="text-sm text-gray-600 mb-3">Diseño para eventos corporativos y conferencias</p>
                        <Button size="sm" className="w-full">
                          Usar Plantilla
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="saved" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Mapas Guardados</CardTitle>
              </CardHeader>
              <CardContent>
                {savedMaps.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <Save className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay mapas guardados</h3>
                    <p className="text-gray-600 mb-4">Crea tu primer mapa de asientos usando el creador visual</p>
                    <Button onClick={() => setActiveTab("creator")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Mapa
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedMaps.map((map, index) => (
                      <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">Mapa {index + 1}</h3>
                            <Badge variant="outline">
                              {map.seats?.length || 0} asientos
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">
                            Creado: {new Date(map.metadata?.createdAt).toLocaleDateString()}
                          </p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleLoadMap(map.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Cargar
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteMap(map.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
