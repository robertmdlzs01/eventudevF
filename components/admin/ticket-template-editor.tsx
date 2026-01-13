"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Save, 
  Eye, 
  Printer, 
  Plus, 
  Trash2, 
  Move, 
  Type, 
  Image as ImageIcon, 
  QrCode,
  Settings,
  Ruler,
  Palette,
  Layers,
  Grid,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Sparkles,
  Layout,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Maximize2,
  Minimize2,
  Minus,
  GripVertical,
  ChevronRight,
  ChevronLeft
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { TicketTemplate, TicketField, TicketMeasurements, TicketData } from "@/lib/ticket-templates"
import { PREDEFINED_SIZES, AVAILABLE_DATA_FIELDS } from "@/lib/ticket-templates"
import { ticketTemplateService } from "@/lib/ticket-template-service"
import { cn } from "@/lib/utils"

interface TicketTemplateEditorProps {
  templateId?: string
  onSave?: (template: TicketTemplate) => void
  onCancel?: () => void
}

export function TicketTemplateEditor({ templateId, onSave, onCancel }: TicketTemplateEditorProps) {
  const [template, setTemplate] = useState<TicketTemplate | null>(null)
  const [previewData, setPreviewData] = useState<Partial<TicketData>>({})
  const [selectedField, setSelectedField] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [zoom, setZoom] = useState(1)
  const [showGrid, setShowGrid] = useState(true)
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("design")
  const previewRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    setIsLoading(true)
    try {
      if (templateId) {
        const loaded = await ticketTemplateService.getTemplate(templateId)
        if (loaded) {
          setTemplate(loaded)
        }
      } else {
        const defaultTemplate = await ticketTemplateService.getDefaultTemplate()
        setTemplate({
          ...defaultTemplate,
          id: `template_${Date.now()}`,
          name: 'Nueva Plantilla',
          isDefault: false,
        })
      }
    } catch (error) {
      console.error('Error cargando plantilla:', error)
      toast({
        title: "Error",
        description: "No se pudo cargar la plantilla",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateTemplate = (updates: Partial<TicketTemplate>) => {
    if (!template) return
    setTemplate({
      ...template,
      ...updates,
    })
  }

  const updateMeasurements = (updates: Partial<TicketMeasurements>) => {
    if (!template) return
    setTemplate({
      ...template,
      measurements: {
        ...template.measurements,
        ...updates,
      },
    })
  }

  const addField = (type: TicketField['type']) => {
    if (!template) return

    const newField: TicketField = {
      id: `field_${Date.now()}`,
      type,
      label: `Nuevo ${type}`,
      position: { x: 10, y: 10 },
      size: { width: 50, height: 10 },
      style: {
        fontSize: 12,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        color: '#000000',
        textAlign: 'left',
      },
      visible: true,
    }

    setTemplate({
      ...template,
      fields: [...template.fields, newField],
    })
    setSelectedField(newField.id)
  }

  const updateField = (fieldId: string, updates: Partial<TicketField>) => {
    if (!template) return

    setTemplate({
      ...template,
      fields: template.fields.map(f =>
        f.id === fieldId ? { ...f, ...updates } : f
      ),
    })
  }

  const deleteField = (fieldId: string) => {
    if (!template) return

    setTemplate({
      ...template,
      fields: template.fields.filter(f => f.id !== fieldId),
    })
    if (selectedField === fieldId) {
      setSelectedField(null)
    }
  }

  const applyPredefinedSize = (sizeKey: keyof typeof PREDEFINED_SIZES) => {
    if (!template) return

    const size = PREDEFINED_SIZES[sizeKey]
    updateMeasurements({
      width: size.width,
      height: size.height,
      unit: size.unit,
    })
  }

  const handleSave = async () => {
    if (!template) return

    const validation = ticketTemplateService.validateTemplate(template)
    if (!validation.valid) {
      toast({
        title: "Error de validación",
        description: validation.errors.join(', '),
        variant: "destructive",
      })
      return
    }

    try {
      const success = await ticketTemplateService.saveTemplate(template)
      if (success) {
        toast({
          title: "Éxito",
          description: "Plantilla guardada correctamente",
        })
        onSave?.(template)
      } else {
        throw new Error('Error al guardar')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar la plantilla",
        variant: "destructive",
      })
    }
  }

  const generatePreview = () => {
    if (!template) return ''

    const sampleData: TicketData = {
      eventName: previewData.eventName || 'Concierto de Rock 2025',
      eventDate: previewData.eventDate || '15 de Junio, 2025',
      eventTime: previewData.eventTime || '20:00',
      eventLocation: previewData.eventLocation || 'Estadio El Campín, Bogotá',
      ticketNumber: previewData.ticketNumber || 'TKT-2025-001234',
      ticketId: previewData.ticketId || 'TKT-2025-001234',
      ticketType: previewData.ticketType || 'General',
      price: previewData.price || 50000,
      customerName: previewData.customerName || 'Juan Pérez',
      customerEmail: previewData.customerEmail || 'juan@example.com',
      qrCode: previewData.qrCode || 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=TKT-2025-001234',
      purchaseDate: new Date().toISOString(),
      purchaseId: 'PUR-2025-001',
    }

    return ticketTemplateService.generateTicketHTML(template, sampleData)
  }

  // Conversión de mm a px para visualización
  const mmToPx = (mm: number) => (mm / 25.4) * 96 * zoom

  // Manejar drag and drop
  const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
    if (!template || !previewRef.current) return
    
    const field = template.fields.find(f => f.id === fieldId)
    if (!field) return

    const rect = previewRef.current.getBoundingClientRect()
    const startX = e.clientX - rect.left
    const startY = e.clientY - rect.top
    
    const fieldX = mmToPx(field.position.x)
    const fieldY = mmToPx(field.position.y)
    
    setIsDragging(true)
    setSelectedField(fieldId)
    setDragOffset({
      x: startX - fieldX,
      y: startY - fieldY,
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedField || !template || !previewRef.current) return

    const rect = previewRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left - dragOffset.x) / zoom) * (25.4 / 96)
    const y = ((e.clientY - rect.top - dragOffset.y) / zoom) * (25.4 / 96)

    updateField(selectedField, {
      position: { x: Math.max(0, x), y: Math.max(0, y) },
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  if (isLoading || !template) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="text-muted-foreground">Cargando plantilla...</p>
        </div>
      </div>
    )
  }

  const selectedFieldData = template.fields.find(f => f.id === selectedField)

  // Renderizar campos en el preview
  const renderPreviewFields = () => {
    if (!template) return null

    return template.fields
      .filter(field => field.visible)
      .map(field => {
        const x = mmToPx(field.position.x)
        const y = mmToPx(field.position.y)
        const w = mmToPx(field.size.width)
        const h = mmToPx(field.size.height)

        const isSelected = selectedField === field.id

        let content = ''
        const sampleData: Partial<TicketData> = {
          eventName: 'Concierto de Rock 2025',
          ticketNumber: 'TKT-2025-001234',
          customerName: 'Juan Pérez',
          price: 50000,
          qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=TKT-2025-001234',
        }

        if (field.type === 'text') {
          if (field.content) {
            content = field.content
          } else if (field.dataField && sampleData[field.dataField as keyof TicketData]) {
            const value = sampleData[field.dataField as keyof TicketData]
            if (field.dataField === 'price') {
              content = new Intl.NumberFormat('es-CO', {
                style: 'currency',
                currency: 'COP',
              }).format(Number(value))
            } else {
              content = String(value || '')
            }
          } else {
            content = field.label
          }
        }

        return (
          <div
            key={field.id}
            className={cn(
              "absolute border-2 cursor-move transition-all",
              isSelected 
                ? "border-primary-500 shadow-lg bg-primary-50/50 z-10 ring-2 ring-primary-300" 
                : "border-transparent hover:border-primary-300 hover:shadow-md z-0"
            )}
            style={{
              left: `${x}px`,
              top: `${y}px`,
              width: `${w}px`,
              minHeight: `${h}px`,
              fontSize: `${(field.style.fontSize || 12) * zoom}pt`,
              fontFamily: field.style.fontFamily || 'Arial, sans-serif',
              fontWeight: field.style.fontWeight || 'normal',
              color: field.style.color || '#000000',
              textAlign: field.style.textAlign || 'left',
              backgroundColor: field.style.backgroundColor || 'transparent',
              padding: `${2 * zoom}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: field.style.textAlign === 'right' ? 'flex-end' : 
                            field.style.textAlign === 'center' ? 'center' : 'flex-start',
            }}
            onMouseDown={(e) => handleMouseDown(e, field.id)}
            onClick={() => setSelectedField(field.id)}
          >
            {field.type === 'text' && (
              <span className="text-xs truncate w-full">{content || field.label}</span>
            )}
            {field.type === 'qr' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <QrCode className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {field.type === 'image' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <ImageIcon className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {field.type === 'barcode' && (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                <Move className="h-4 w-4 text-gray-400" />
              </div>
            )}
            {field.type === 'line' && (
              <div className="w-full h-full border-t-2 border-gray-400" />
            )}
            {field.type === 'rectangle' && (
              <div className="w-full h-full border-2 border-gray-400 bg-transparent" />
            )}
          </div>
        )
      })
  }

  return (
    <div className="flex flex-col h-[calc(95vh-2rem)] overflow-hidden flex-1">
      {/* Header Compacto */}
      <div className="flex items-center justify-between p-4 border-b-2 bg-gradient-to-r from-primary-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Editor de Plantillas</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={template.name}
            onChange={(e) => updateTemplate({ name: e.target.value })}
            placeholder="Nombre de la plantilla"
            className="w-64 border-2 h-9"
          />
          <Button variant="outline" onClick={onCancel} size="sm" className="border-2">
            Cancelar
          </Button>
          <Button onClick={handleSave} size="sm" className="shadow-md">
            <Save className="mr-2 h-4 w-4" />
            Guardar
          </Button>
        </div>
      </div>

      {/* Tabs Compactos */}
      <div className="border-b bg-white px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="design" className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Diseño
            </TabsTrigger>
            <TabsTrigger value="measurements" className="flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              Medidas
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Datos
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Contenido Principal - Diseño Visual */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <TabsContent value="design" className="flex-1 flex overflow-hidden m-0 p-0 mt-0">
          <div className="flex flex-1 overflow-hidden">
            {/* Panel Izquierdo - Campos (Colapsable) */}
            <div className={cn(
              "border-r-2 bg-white transition-all duration-300 flex flex-col",
              leftPanelOpen ? "w-64" : "w-12"
            )}>
              <div className="p-2 border-b flex items-center justify-between">
                {leftPanelOpen && (
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Campos
                  </h3>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                  className="ml-auto h-8 w-8 p-0"
                >
                  {leftPanelOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
              
              {leftPanelOpen && (
                <ScrollArea className="flex-1">
                  <div className="p-3 space-y-3">
                    {/* Botones de Agregar */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('text')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar Texto"
                      >
                        <Type className="h-5 w-5" />
                        <span className="text-xs">Texto</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('qr')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar QR"
                      >
                        <QrCode className="h-5 w-5" />
                        <span className="text-xs">QR</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('image')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar Imagen"
                      >
                        <ImageIcon className="h-5 w-5" />
                        <span className="text-xs">Imagen</span>
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('barcode')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar Código de Barras"
                      >
                        <Move className="h-5 w-5" />
                        <span className="text-xs">Código</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('line')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar Línea"
                      >
                        <Minus className="h-5 w-5" />
                        <span className="text-xs">Línea</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => addField('rectangle')}
                        className="border-2 h-20 flex flex-col gap-1"
                        title="Agregar Rectángulo"
                      >
                        <Layout className="h-5 w-5" />
                        <span className="text-xs">Cuadro</span>
                      </Button>
                    </div>

                    {/* Lista de Campos */}
                    <div className="space-y-2">
                      {template.fields.map((field) => (
                        <div
                          key={field.id}
                          className={cn(
                            "p-2 border-2 rounded-lg cursor-pointer transition-all group",
                            selectedField === field.id
                              ? 'border-primary-500 bg-primary-50 shadow-md'
                              : 'border-border hover:border-primary-300 hover:shadow-sm'
                          )}
                          onClick={() => setSelectedField(field.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {field.type === 'text' && <Type className="h-4 w-4 text-blue-600 flex-shrink-0" />}
                              {field.type === 'qr' && <QrCode className="h-4 w-4 text-green-600 flex-shrink-0" />}
                              {field.type === 'image' && <ImageIcon className="h-4 w-4 text-purple-600 flex-shrink-0" />}
                              {field.type === 'barcode' && <Move className="h-4 w-4 text-orange-600 flex-shrink-0" />}
                              {field.type === 'line' && <Minus className="h-4 w-4 text-gray-600 flex-shrink-0" />}
                              {field.type === 'rectangle' && <Layout className="h-4 w-4 text-indigo-600 flex-shrink-0" />}
                              <span className="font-medium text-xs truncate">{field.label}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteField(field.id)
                              }}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {!field.visible && (
                            <Badge variant="secondary" className="mt-1 text-xs">Oculto</Badge>
                          )}
                        </div>
                      ))}
                      {template.fields.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-xs">Agrega campos para comenzar</p>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Canvas Central - Área Principal */}
            <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
              {/* Barra de Herramientas del Canvas */}
              <div className="bg-white border-b-2 p-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    {template.measurements.width}×{template.measurements.height} {template.measurements.unit}
                  </Badge>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-1 border rounded-lg">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.max(0.25, zoom - 0.25))}
                      className="h-7 px-2"
                    >
                      <ZoomOut className="h-3 w-3" />
                    </Button>
                    <span className="px-2 text-xs font-medium min-w-[50px] text-center">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                      className="h-7 px-2"
                    >
                      <ZoomIn className="h-3 w-3" />
                    </Button>
                  </div>
                  <Separator orientation="vertical" className="h-6" />
                  <Button
                    size="sm"
                    variant={showGrid ? "default" : "outline"}
                    onClick={() => setShowGrid(!showGrid)}
                    className="h-7"
                  >
                    <Grid className="h-3 w-3 mr-1" />
                    Grilla
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {template.fields.length} {template.fields.length === 1 ? 'campo' : 'campos'}
                </div>
              </div>

              {/* Canvas de Diseño */}
              <ScrollArea className="flex-1">
                <div className="p-8 flex items-center justify-center min-h-full">
                  <div className="bg-white rounded-lg p-8 shadow-2xl border-4 border-gray-200">
                    <div
                      ref={previewRef}
                      className="relative bg-white shadow-inner border-2 border-dashed border-gray-300"
                      style={{
                        width: `${mmToPx(template.measurements.width)}px`,
                        height: `${mmToPx(template.measurements.height)}px`,
                        backgroundImage: showGrid ? `
                          linear-gradient(to right, #e5e7eb 1px, transparent 1px),
                          linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
                        ` : 'none',
                        backgroundSize: `${mmToPx(5)}px ${mmToPx(5)}px`,
                        minHeight: `${mmToPx(template.measurements.height)}px`,
                      }}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                    >
                      {renderPreviewFields()}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>

            {/* Panel Derecho - Propiedades (Colapsable) */}
            <div className={cn(
              "border-l-2 bg-white transition-all duration-300 flex flex-col",
              rightPanelOpen ? "w-80" : "w-12"
            )}>
              <div className="p-2 border-b flex items-center justify-between">
                {rightPanelOpen && (
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Propiedades
                  </h3>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setRightPanelOpen(!rightPanelOpen)}
                  className="ml-auto h-8 w-8 p-0"
                >
                  {rightPanelOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                </Button>
              </div>
              
              {rightPanelOpen && (
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    {selectedFieldData ? (
                      <>
                        {/* Información básica */}
                        <div>
                          <Label className="text-xs font-semibold mb-1 block">Etiqueta del Campo</Label>
                          <Input
                            value={selectedFieldData.label}
                            onChange={(e) =>
                              selectedField && updateField(selectedField, { label: e.target.value })
                            }
                            className="border-2 h-9"
                          />
                        </div>

                        {selectedFieldData.type === 'text' && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-xs font-semibold mb-1 block">Campo de Datos</Label>
                              <Select
                                value={selectedFieldData.dataField || ''}
                                onValueChange={(value) =>
                                  selectedField && updateField(selectedField, { dataField: value })
                                }
                              >
                                <SelectTrigger className="border-2 h-9 text-xs">
                                  <SelectValue placeholder="Seleccionar campo" />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(AVAILABLE_DATA_FIELDS).map(([key, label]) => (
                                    <SelectItem key={key} value={key}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold mb-1 block">Contenido Estático</Label>
                              <Textarea
                                value={selectedFieldData.content || ''}
                                onChange={(e) =>
                                  selectedField && updateField(selectedField, { content: e.target.value })
                                }
                                placeholder="O deja vacío para usar campo de datos"
                                className="border-2 text-xs"
                                rows={2}
                              />
                            </div>
                          </>
                        )}

                        <Separator />

                        {/* Posición y Tamaño */}
                        <div>
                          <Label className="text-xs font-semibold mb-2 block">Posición (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">X</Label>
                              <Input
                                type="number"
                                value={selectedFieldData.position.x.toFixed(1)}
                                onChange={(e) =>
                                  selectedField && updateField(selectedField, {
                                    position: {
                                      ...selectedFieldData.position,
                                      x: Number(e.target.value),
                                    },
                                  })
                                }
                                className="border-2 h-8 text-xs"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Y</Label>
                              <Input
                                type="number"
                                value={selectedFieldData.position.y.toFixed(1)}
                                onChange={(e) =>
                                  selectedField && updateField(selectedField, {
                                    position: {
                                      ...selectedFieldData.position,
                                      y: Number(e.target.value),
                                    },
                                  })
                                }
                                className="border-2 h-8 text-xs"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs font-semibold mb-2 block">Tamaño (mm)</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs text-muted-foreground">Ancho</Label>
                              <Input
                                type="number"
                                value={selectedFieldData.size.width.toFixed(1)}
                                onChange={(e) =>
                                  selectedField && updateField(selectedField, {
                                    size: {
                                      ...selectedFieldData.size,
                                      width: Number(e.target.value),
                                    },
                                  })
                                }
                                className="border-2 h-8 text-xs"
                                step="0.1"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Alto</Label>
                              <Input
                                type="number"
                                value={selectedFieldData.size.height.toFixed(1)}
                                onChange={(e) =>
                                  selectedField && updateField(selectedField, {
                                    size: {
                                      ...selectedFieldData.size,
                                      height: Number(e.target.value),
                                    },
                                  })
                                }
                                className="border-2 h-8 text-xs"
                                step="0.1"
                              />
                            </div>
                          </div>
                        </div>

                        {selectedFieldData.type === 'text' && (
                          <>
                            <Separator />
                            <div>
                              <Label className="text-xs font-semibold mb-2 block">Estilo de Texto</Label>
                              <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Tamaño (pt)</Label>
                                    <Input
                                      type="number"
                                      value={selectedFieldData.style.fontSize || 12}
                                      onChange={(e) =>
                                        selectedField && updateField(selectedField, {
                                          style: {
                                            ...selectedFieldData.style,
                                            fontSize: Number(e.target.value),
                                          },
                                        })
                                      }
                                      className="border-2 h-8 text-xs"
                                      min="6"
                                      max="72"
                                    />
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Color</Label>
                                    <div className="flex gap-1">
                                      <Input
                                        type="color"
                                        value={selectedFieldData.style.color || '#000000'}
                                        onChange={(e) =>
                                          selectedField && updateField(selectedField, {
                                            style: {
                                              ...selectedFieldData.style,
                                              color: e.target.value,
                                            },
                                          })
                                        }
                                        className="border-2 h-8 w-12 p-1"
                                      />
                                      <Input
                                        value={selectedFieldData.style.color || '#000000'}
                                        onChange={(e) =>
                                          selectedField && updateField(selectedField, {
                                            style: {
                                              ...selectedFieldData.style,
                                              color: e.target.value,
                                            },
                                          })
                                        }
                                        className="border-2 h-8 flex-1 text-xs"
                                        placeholder="#000000"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Alineación</Label>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={selectedFieldData.style.textAlign === 'left' ? 'default' : 'outline'}
                                      onClick={() =>
                                        selectedField && updateField(selectedField, {
                                          style: { ...selectedFieldData.style, textAlign: 'left' },
                                        })
                                      }
                                      className="flex-1 border-2 h-8"
                                    >
                                      <AlignLeft className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedFieldData.style.textAlign === 'center' ? 'default' : 'outline'}
                                      onClick={() =>
                                        selectedField && updateField(selectedField, {
                                          style: { ...selectedFieldData.style, textAlign: 'center' },
                                        })
                                      }
                                      className="flex-1 border-2 h-8"
                                    >
                                      <AlignCenter className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedFieldData.style.textAlign === 'right' ? 'default' : 'outline'}
                                      onClick={() =>
                                        selectedField && updateField(selectedField, {
                                          style: { ...selectedFieldData.style, textAlign: 'right' },
                                        })
                                      }
                                      className="flex-1 border-2 h-8"
                                    >
                                      <AlignRight className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-xs text-muted-foreground mb-1 block">Peso</Label>
                                  <div className="flex gap-1">
                                    <Button
                                      size="sm"
                                      variant={selectedFieldData.style.fontWeight === 'normal' ? 'default' : 'outline'}
                                      onClick={() =>
                                        selectedField && updateField(selectedField, {
                                          style: { ...selectedFieldData.style, fontWeight: 'normal' },
                                        })
                                      }
                                      className="flex-1 border-2 h-8 text-xs"
                                    >
                                      Normal
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={selectedFieldData.style.fontWeight === 'bold' ? 'default' : 'outline'}
                                      onClick={() =>
                                        selectedField && updateField(selectedField, {
                                          style: { ...selectedFieldData.style, fontWeight: 'bold' },
                                        })
                                      }
                                      className="flex-1 border-2 h-8 text-xs"
                                    >
                                      <Bold className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div className="flex items-center justify-between">
                          <Label htmlFor="visible" className="text-xs font-semibold cursor-pointer">Campo Visible</Label>
                          <Switch
                            id="visible"
                            checked={selectedFieldData.visible}
                            onCheckedChange={(checked) =>
                              selectedField && updateField(selectedField, { visible: checked })
                            }
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="text-sm">Selecciona un campo para editarlo</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Tab de Medidas */}
        <TabsContent value="measurements" className="mt-0 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Configuración de Medidas
              </CardTitle>
              <CardDescription>
                Configura las dimensiones del boleto con precisión milimétrica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tamaños Predefinidos */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Tamaños Predefinidos</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(PREDEFINED_SIZES).map(([key, size]) => (
                    <Button
                      key={key}
                      variant="outline"
                      onClick={() => applyPredefinedSize(key as keyof typeof PREDEFINED_SIZES)}
                      className="border-2 h-auto py-4 flex flex-col items-start hover:border-primary-500 hover:bg-primary-50"
                    >
                      <span className="font-semibold">{size.name}</span>
                      <span className="text-xs text-muted-foreground mt-1">
                        {size.width}×{size.height} {size.unit}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Dimensiones */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Ancho ({template.measurements.unit})</Label>
                  <Input
                    type="number"
                    value={template.measurements.width}
                    onChange={(e) =>
                      updateMeasurements({ width: Number(e.target.value) })
                    }
                    className="border-2 mt-1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Alto ({template.measurements.unit})</Label>
                  <Input
                    type="number"
                    value={template.measurements.height}
                    onChange={(e) =>
                      updateMeasurements({ height: Number(e.target.value) })
                    }
                    className="border-2 mt-1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Unidad de Medida</Label>
                  <Select
                    value={template.measurements.unit}
                    onValueChange={(value: 'mm' | 'cm' | 'inch') =>
                      updateMeasurements({ unit: value })
                    }
                  >
                    <SelectTrigger className="border-2 mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mm">Milímetros (mm)</SelectItem>
                      <SelectItem value="cm">Centímetros (cm)</SelectItem>
                      <SelectItem value="inch">Pulgadas (inch)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Márgenes */}
              <div>
                <Label className="text-base font-semibold mb-3 block">Márgenes ({template.measurements.unit})</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Superior</Label>
                    <Input
                      type="number"
                      value={template.measurements.marginTop}
                      onChange={(e) =>
                        updateMeasurements({ marginTop: Number(e.target.value) })
                      }
                      className="border-2 mt-1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Inferior</Label>
                    <Input
                      type="number"
                      value={template.measurements.marginBottom}
                      onChange={(e) =>
                        updateMeasurements({ marginBottom: Number(e.target.value) })
                      }
                      className="border-2 mt-1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Izquierdo</Label>
                    <Input
                      type="number"
                      value={template.measurements.marginLeft}
                      onChange={(e) =>
                        updateMeasurements({ marginLeft: Number(e.target.value) })
                      }
                      className="border-2 mt-1"
                      step="0.1"
                    />
                  </div>
                  <div>
                    <Label>Derecho</Label>
                    <Input
                      type="number"
                      value={template.measurements.marginRight}
                      onChange={(e) =>
                        updateMeasurements({ marginRight: Number(e.target.value) })
                      }
                      className="border-2 mt-1"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Espaciado */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Padding ({template.measurements.unit})</Label>
                  <Input
                    type="number"
                    value={template.measurements.padding}
                    onChange={(e) =>
                      updateMeasurements({ padding: Number(e.target.value) })
                    }
                    className="border-2 mt-1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Espaciado entre elementos ({template.measurements.unit})</Label>
                  <Input
                    type="number"
                    value={template.measurements.spacing}
                    onChange={(e) =>
                      updateMeasurements({ spacing: Number(e.target.value) })
                    }
                    className="border-2 mt-1"
                    step="0.1"
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Vista Previa */}
        <TabsContent value="preview" className="mt-0 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Vista Previa del Boleto
                  </CardTitle>
                  <CardDescription>
                    Visualiza cómo se verá el boleto impreso
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    const previewWindow = window.open('', '_blank')
                    if (previewWindow) {
                      previewWindow.document.write(generatePreview())
                    }
                  }}
                  className="border-2"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Abrir en Nueva Ventana
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 border-2 border-dashed">
                <div className="bg-white rounded-lg shadow-2xl mx-auto overflow-hidden" style={{ maxWidth: '600px' }}>
                  <div
                    className="relative mx-auto bg-white"
                    style={{
                      width: `${(template.measurements.width / 25.4) * 96}px`,
                      minHeight: `${(template.measurements.height / 25.4) * 96}px`,
                      boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    }}
                    dangerouslySetInnerHTML={{ __html: generatePreview() }}
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Datos de Prueba */}
        <TabsContent value="data" className="mt-0 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto">
            <Card className="border-2">
            <CardHeader>
              <CardTitle>Datos de Prueba para Vista Previa</CardTitle>
              <CardDescription>
                Personaliza los datos que se mostrarán en la vista previa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nombre del Evento</Label>
                  <Input
                    value={previewData.eventName || ''}
                    onChange={(e) => setPreviewData({ ...previewData, eventName: e.target.value })}
                    placeholder="Concierto de Rock 2025"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Fecha del Evento</Label>
                  <Input
                    value={previewData.eventDate || ''}
                    onChange={(e) => setPreviewData({ ...previewData, eventDate: e.target.value })}
                    placeholder="15 de Junio, 2025"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Hora del Evento</Label>
                  <Input
                    value={previewData.eventTime || ''}
                    onChange={(e) => setPreviewData({ ...previewData, eventTime: e.target.value })}
                    placeholder="20:00"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Ubicación</Label>
                  <Input
                    value={previewData.eventLocation || ''}
                    onChange={(e) => setPreviewData({ ...previewData, eventLocation: e.target.value })}
                    placeholder="Estadio El Campín, Bogotá"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Número de Boleto</Label>
                  <Input
                    value={previewData.ticketNumber || ''}
                    onChange={(e) => setPreviewData({ ...previewData, ticketNumber: e.target.value })}
                    placeholder="TKT-2025-001234"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Tipo de Boleto</Label>
                  <Input
                    value={previewData.ticketType || ''}
                    onChange={(e) => setPreviewData({ ...previewData, ticketType: e.target.value })}
                    placeholder="General"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    value={previewData.price || ''}
                    onChange={(e) => setPreviewData({ ...previewData, price: Number(e.target.value) })}
                    placeholder="50000"
                    className="border-2 mt-1"
                  />
                </div>
                <div>
                  <Label>Nombre del Cliente</Label>
                  <Input
                    value={previewData.customerName || ''}
                    onChange={(e) => setPreviewData({ ...previewData, customerName: e.target.value })}
                    placeholder="Juan Pérez"
                    className="border-2 mt-1"
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}