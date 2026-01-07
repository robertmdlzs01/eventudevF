"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
  Ruler
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { TicketTemplate, TicketField, TicketMeasurements, TicketData } from "@/lib/ticket-templates"
import { PREDEFINED_SIZES, AVAILABLE_DATA_FIELDS } from "@/lib/ticket-templates"
import { ticketTemplateService } from "@/lib/ticket-template-service"

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
        // Cargar plantilla por defecto
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

  if (isLoading || !template) {
    return <div className="p-8 text-center">Cargando plantilla...</div>
  }

  const selectedFieldData = template.fields.find(f => f.id === selectedField)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Editor de Plantillas de Boletos</h2>
          <p className="text-muted-foreground">Diseña y personaliza plantillas de boletos físicos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Guardar Plantilla
          </Button>
        </div>
      </div>

      <Tabs defaultValue="design" className="space-y-4">
        <TabsList>
          <TabsTrigger value="design">Diseño</TabsTrigger>
          <TabsTrigger value="measurements">Medidas</TabsTrigger>
          <TabsTrigger value="preview">Vista Previa</TabsTrigger>
        </TabsList>

        {/* Tab de Diseño */}
        <TabsContent value="design" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Campos */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Campos</span>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addField('text')}
                      title="Agregar Texto"
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addField('qr')}
                      title="Agregar QR"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addField('image')}
                      title="Agregar Imagen"
                    >
                      <ImageIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {template.fields.map((field) => (
                  <div
                    key={field.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedField === field.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedField(field.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{field.type}</Badge>
                        <span className="font-medium">{field.label}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteField(field.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {!field.visible && (
                      <Badge variant="secondary" className="mt-2">Oculto</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Editor de Campo Seleccionado */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Propiedades del Campo</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedFieldData ? (
                  <div className="space-y-4">
                    <div>
                      <Label>Etiqueta</Label>
                      <Input
                        value={selectedFieldData.label}
                        onChange={(e) =>
                          selectedField && updateField(selectedField, { label: e.target.value })
                        }
                      />
                    </div>

                    {selectedFieldData.type === 'text' && (
                      <>
                        <div>
                          <Label>Campo de Datos</Label>
                          <Select
                            value={selectedFieldData.dataField || ''}
                            onValueChange={(value) =>
                              selectedField && updateField(selectedField, { dataField: value })
                            }
                          >
                            <SelectTrigger>
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
                          <Label>Contenido Estático (opcional)</Label>
                          <Textarea
                            value={selectedFieldData.content || ''}
                            onChange={(e) =>
                              selectedField && updateField(selectedField, { content: e.target.value })
                            }
                            placeholder="O deja vacío para usar campo de datos"
                          />
                        </div>
                      </>
                    )}

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Posición X (mm)</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.position.x}
                          onChange={(e) =>
                            selectedField && updateField(selectedField, {
                              position: {
                                ...selectedFieldData.position,
                                x: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Posición Y (mm)</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.position.y}
                          onChange={(e) =>
                            selectedField && updateField(selectedField, {
                              position: {
                                ...selectedFieldData.position,
                                y: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Ancho (mm)</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.size.width}
                          onChange={(e) =>
                            selectedField && updateField(selectedField, {
                              size: {
                                ...selectedFieldData.size,
                                width: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label>Alto (mm)</Label>
                        <Input
                          type="number"
                          value={selectedFieldData.size.height}
                          onChange={(e) =>
                            selectedField && updateField(selectedField, {
                              size: {
                                ...selectedFieldData.size,
                                height: Number(e.target.value),
                              },
                            })
                          }
                        />
                      </div>
                    </div>

                    {selectedFieldData.type === 'text' && (
                      <>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tamaño de Fuente (pt)</Label>
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
                            />
                          </div>
                          <div>
                            <Label>Alineación</Label>
                            <Select
                              value={selectedFieldData.style.textAlign || 'left'}
                              onValueChange={(value: 'left' | 'center' | 'right') =>
                                selectedField && updateField(selectedField, {
                                  style: {
                                    ...selectedFieldData.style,
                                    textAlign: value,
                                  },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="left">Izquierda</SelectItem>
                                <SelectItem value="center">Centro</SelectItem>
                                <SelectItem value="right">Derecha</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Color</Label>
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
                            />
                          </div>
                          <div>
                            <Label>Peso de Fuente</Label>
                            <Select
                              value={selectedFieldData.style.fontWeight || 'normal'}
                              onValueChange={(value: 'normal' | 'bold' | 'italic') =>
                                selectedField && updateField(selectedField, {
                                  style: {
                                    ...selectedFieldData.style,
                                    fontWeight: value,
                                  },
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Negrita</SelectItem>
                                <SelectItem value="italic">Cursiva</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="visible"
                        checked={selectedFieldData.visible}
                        onChange={(e) =>
                          selectedField && updateField(selectedField, { visible: e.target.checked })
                        }
                        className="rounded"
                      />
                      <Label htmlFor="visible">Visible</Label>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Selecciona un campo para editarlo
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab de Medidas */}
        <TabsContent value="measurements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="h-5 w-5" />
                Configuración de Medidas
              </CardTitle>
              <CardDescription>
                Configura las dimensiones del boleto y los márgenes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Tamaños Predefinidos */}
              <div>
                <Label>Tamaños Predefinidos</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {Object.entries(PREDEFINED_SIZES).map(([key, size]) => (
                    <Button
                      key={key}
                      variant="outline"
                      onClick={() => applyPredefinedSize(key as keyof typeof PREDEFINED_SIZES)}
                      className="justify-start"
                    >
                      {size.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Dimensiones */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ancho ({template.measurements.unit})</Label>
                  <Input
                    type="number"
                    value={template.measurements.width}
                    onChange={(e) =>
                      updateMeasurements({ width: Number(e.target.value) })
                    }
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
                    <SelectTrigger>
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
                <Label className="mb-4 block">Márgenes ({template.measurements.unit})</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Superior</Label>
                    <Input
                      type="number"
                      value={template.measurements.marginTop}
                      onChange={(e) =>
                        updateMeasurements({ marginTop: Number(e.target.value) })
                      }
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
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Vista Previa */}
        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Vista Previa
              </CardTitle>
              <CardDescription>
                Previsualiza cómo se verá el boleto impreso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-white">
                <div
                  className="mx-auto"
                  style={{
                    width: `${(template.measurements.width / 25.4) * 96}px`,
                    height: `${(template.measurements.height / 25.4) * 96}px`,
                    border: '1px dashed #ccc',
                    position: 'relative',
                  }}
                  dangerouslySetInnerHTML={{ __html: generatePreview() }}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}


