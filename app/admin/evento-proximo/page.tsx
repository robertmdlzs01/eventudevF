"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Calendar, MapPin, Image as ImageIcon, Link as LinkIcon, Eye, Save, RotateCcw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface FeaturedCountdownEvent {
  id?: number
  title: string
  date: string
  location: string
  image_url: string
  event_slug: string
  redirect_url: string
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export default function EventoProximoPage() {
  const [eventData, setEventData] = useState<FeaturedCountdownEvent>({
    title: "PANACA VIAJERO BARRANQUILLA",
    date: "20 DE JUNIO 2025",
    location: "PARQUE NORTE - BARRANQUILLA",
    image_url: "/placeholder.jpg",
    event_slug: "panaca-viajero-barranquilla",
    redirect_url: "",
    is_active: true
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Cargar datos del evento
  useEffect(() => {
    loadEventData()
  }, [])

  const loadEventData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/featured-countdown-event')
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          setEventData(data.data)
        }
      }
    } catch (error) {
      console.error('Error cargando evento próximo:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del evento próximo",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/admin/featured-countdown-event', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData)
      })

      const result = await response.json()
      
      if (result.success) {
        toast({
          title: "Éxito",
          description: "Evento próximo actualizado correctamente",
        })
        await loadEventData() // Recargar datos
      } else {
        throw new Error(result.message || 'Error al guardar')
      }
    } catch (error) {
      console.error('Error guardando evento próximo:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la información del evento próximo",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setEventData({
      title: "PANACA VIAJERO BARRANQUILLA",
      date: "20 DE JUNIO 2025",
      location: "PARQUE NORTE - BARRANQUILLA",
      image_url: "/placeholder.jpg",
      event_slug: "panaca-viajero-barranquilla",
      redirect_url: "",
      is_active: true
    })
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  const handleTitleChange = (value: string) => {
    setEventData(prev => ({
      ...prev,
      title: value,
      event_slug: generateSlug(value)
    }))
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Cargando información del evento próximo...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Evento Próximo con Cuenta Regresiva</h1>
          <p className="text-gray-600">
            Configura el evento destacado que aparece en la página principal con cuenta regresiva
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulario de edición */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Configuración del Evento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Estado del evento */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-gray-900">Estado del Evento</h3>
                    <p className="text-sm text-gray-600">Activar o desactivar el evento próximo</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={eventData.is_active}
                      onCheckedChange={(checked) => 
                        setEventData(prev => ({ ...prev, is_active: checked }))
                      }
                    />
                    <Badge variant={eventData.is_active ? "default" : "secondary"}>
                      {eventData.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Información básica */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Título del Evento</Label>
                    <Input
                      id="title"
                      value={eventData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Ej: PANACA VIAJERO BARRANQUILLA"
                    />
                  </div>

                  <div>
                    <Label htmlFor="date">Fecha del Evento</Label>
                    <Input
                      id="date"
                      value={eventData.date}
                      onChange={(e) => setEventData(prev => ({ ...prev, date: e.target.value }))}
                      placeholder="Ej: 20 DE JUNIO 2025"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Ubicación</Label>
                    <Input
                      id="location"
                      value={eventData.location}
                      onChange={(e) => setEventData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Ej: PARQUE NORTE - BARRANQUILLA"
                    />
                  </div>
                </div>

                <Separator />

                {/* Configuración de imagen */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="image_url">URL de la Imagen</Label>
                    <Input
                      id="image_url"
                      value={eventData.image_url}
                      onChange={(e) => setEventData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="/images/evento.jpg"
                    />
                  </div>
                </div>

                <Separator />

                {/* Configuración de redireccionamiento */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="event_slug">Slug del Evento</Label>
                    <Input
                      id="event_slug"
                      value={eventData.event_slug}
                      onChange={(e) => setEventData(prev => ({ ...prev, event_slug: e.target.value }))}
                      placeholder="panaca-viajero-barranquilla"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Se genera automáticamente del título. Usado para redireccionar a /evento/[slug]
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="redirect_url">URL de Redireccionamiento Personalizada (Opcional)</Label>
                    <Input
                      id="redirect_url"
                      value={eventData.redirect_url}
                      onChange={(e) => setEventData(prev => ({ ...prev, redirect_url: e.target.value }))}
                      placeholder="https://ejemplo.com/comprar"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Si se especifica, se usará esta URL en lugar del slug del evento
                    </p>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 pt-4">
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Guardando..." : "Guardar Cambios"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    disabled={isSaving}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restablecer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vista previa */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Estado */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estado:</span>
                    <Badge variant={eventData.is_active ? "default" : "secondary"}>
                      {eventData.is_active ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  {/* Información del evento */}
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500">Título:</span>
                      <p className="text-sm font-medium">{eventData.title}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Fecha:</span>
                      <p className="text-sm">{eventData.date}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Ubicación:</span>
                      <p className="text-sm">{eventData.location}</p>
                    </div>
                  </div>

                  {/* Redireccionamiento */}
                  <div className="pt-2 border-t">
                    <span className="text-xs text-gray-500">Redireccionamiento:</span>
                    <p className="text-xs text-blue-600 break-all">
                      {eventData.redirect_url || `/evento/${eventData.event_slug}`}
                    </p>
                  </div>

                  {/* Imagen */}
                  {eventData.image_url && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-500">Imagen:</span>
                      <div className="mt-2">
                        <img 
                          src={eventData.image_url} 
                          alt="Vista previa" 
                          className="w-full h-24 object-cover rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

