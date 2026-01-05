"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { MapPin, Users, Settings, Plus, Eye, Palette } from "lucide-react"

interface SeatMapTemplate {
  id: number
  name: string
  description: string
  capacity: number
  layout_data: {
    sections: Array<{
      id: string
      name: string
      color: string
      price: number
      rows: number
      seatsPerRow: number
      startRow: number
    }>
  }
}

interface SeatMapGeneratorProps {
  onMapGenerated?: (mapData: any) => void
  eventId?: number
}

export default function SeatMapGenerator({ onMapGenerated, eventId }: SeatMapGeneratorProps) {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<SeatMapTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<SeatMapTemplate | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [customConfig, setCustomConfig] = useState({
    name: "",
    venueName: "",
    totalCapacity: 100,
    basePrice: 50000,
    vipPrice: 100000,
    accessiblePrice: 40000,
  })

  // Cargar plantillas
  useEffect(() => {
    loadTemplates()
  }, [])

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

  const generateSeatMap = async () => {
    if (!selectedTemplate) {
      toast({
        title: "Error",
        description: "Selecciona una plantilla primero",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)
    try {
      // Generar asientos basado en la plantilla
      const sections = selectedTemplate.layout_data.sections.map(section => {
        const seats = []
        let seatId = 1

        for (let row = 1; row <= section.rows; row++) {
          for (let col = 1; col <= section.seatsPerRow; col++) {
            const seatNumber = col
            const rowNumber = section.startRow + row - 1

            // Determinar tipo de asiento y precio
            let type = "regular"
            let price = section.price

            // Asientos VIP (primera fila)
            if (row === 1) {
              type = "vip"
              price = customConfig.vipPrice
            }

            // Asientos accesibles (última fila, asientos 1 y último)
            if (row === section.rows && (col === 1 || col === section.seatsPerRow)) {
              type = "accessible"
              price = customConfig.accessiblePrice
            }

            seats.push({
              id: seatId++,
              row_number: rowNumber,
              seat_number: seatNumber,
              status: "available",
              price: price,
              section: section.name,
              type: type,
            })
          }
        }

        return {
          ...section,
          seats: seats,
        }
      })

      const mapData = {
        name: customConfig.name || selectedTemplate.name,
        venue_name: customConfig.venueName,
        total_capacity: customConfig.totalCapacity,
        map_data: {
          sections: sections,
        },
        event_id: eventId,
      }

      // Crear el mapa en el backend
      const response = await apiClient.createSeatMap(mapData)
      if (response.success) {
        toast({
          title: "Mapa generado exitosamente",
          description: "El mapa de asientos se ha creado y está listo para usar",
        })
        onMapGenerated?.(response.data)
      } else {
        toast({
          title: "Error",
          description: response.message || "Error al generar el mapa",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating seat map:", error)
      toast({
        title: "Error",
        description: "Error al generar el mapa de asientos",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id.toString() === templateId)
    setSelectedTemplate(template || null)
    if (template) {
      setCustomConfig(prev => ({
        ...prev,
        totalCapacity: template.capacity,
      }))
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Generador de Mapas de Asientos
        </h3>
        <p className="text-gray-600">
          Genera automáticamente un mapa de asientos basado en plantillas predefinidas
        </p>
      </div>

      <Separator />

      {/* Selección de plantilla */}
      <div>
        <Label htmlFor="template">Plantilla de Mapa</Label>
        <Select onValueChange={handleTemplateSelect}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una plantilla" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                <div className="flex items-center justify-between w-full">
                  <span>{template.name}</span>
                  <span className="text-gray-500 ml-2">
                    ({template.capacity} asientos)
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Información de la plantilla seleccionada */}
      {selectedTemplate && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              Vista previa: {selectedTemplate.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 mb-4">{selectedTemplate.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Capacidad:</span> {selectedTemplate.capacity} asientos
              </div>
              <div>
                <span className="font-medium">Secciones:</span> {selectedTemplate.layout_data.sections.length}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Configuración personalizada */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Palette className="w-5 h-5 mr-2" />
          Configuración Personalizada
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name">Nombre del Mapa</Label>
            <Input
              id="name"
              value={customConfig.name}
              onChange={(e) => setCustomConfig({ ...customConfig, name: e.target.value })}
              placeholder={selectedTemplate?.name || "Nombre del mapa"}
            />
          </div>
          <div>
            <Label htmlFor="venueName">Nombre del Venue</Label>
            <Input
              id="venueName"
              value={customConfig.venueName}
              onChange={(e) => setCustomConfig({ ...customConfig, venueName: e.target.value })}
              placeholder="Ej: Teatro Colón"
            />
          </div>
          <div>
            <Label htmlFor="totalCapacity">Capacidad Total</Label>
            <Input
              id="totalCapacity"
              type="number"
              value={customConfig.totalCapacity}
              onChange={(e) => setCustomConfig({ ...customConfig, totalCapacity: parseInt(e.target.value) })}
              min="1"
            />
          </div>
          <div>
            <Label htmlFor="basePrice">Precio Base (COP)</Label>
            <Input
              id="basePrice"
              type="number"
              value={customConfig.basePrice}
              onChange={(e) => setCustomConfig({ ...customConfig, basePrice: parseInt(e.target.value) })}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="vipPrice">Precio VIP (COP)</Label>
            <Input
              id="vipPrice"
              type="number"
              value={customConfig.vipPrice}
              onChange={(e) => setCustomConfig({ ...customConfig, vipPrice: parseInt(e.target.value) })}
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="accessiblePrice">Precio Accesible (COP)</Label>
            <Input
              id="accessiblePrice"
              type="number"
              value={customConfig.accessiblePrice}
              onChange={(e) => setCustomConfig({ ...customConfig, accessiblePrice: parseInt(e.target.value) })}
              min="0"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Información de secciones */}
      {selectedTemplate && (
        <div>
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Secciones del Mapa</h4>
          <div className="grid gap-4">
            {selectedTemplate.layout_data.sections.map((section, index) => (
              <Card key={section.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: section.color }}
                      ></div>
                      <div>
                        <h5 className="font-medium">{section.name}</h5>
                        <p className="text-sm text-gray-600">
                          {section.rows} filas × {section.seatsPerRow} asientos = {section.rows * section.seatsPerRow} asientos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${section.price?.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">Precio base</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Botón de generación */}
      <div className="flex justify-end">
        <Button
          onClick={generateSeatMap}
          disabled={!selectedTemplate || isGenerating}
          size="lg"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isGenerating ? "Generando..." : "Generar Mapa de Asientos"}
        </Button>
      </div>
    </div>
  )
}
