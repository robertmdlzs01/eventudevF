"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, PlusCircle, LinkIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { AdminEvent } from "@/app/admin/actions"
import { getAdminCategories } from "@/app/admin/actions"
import Link from "next/link"
import EventTicketTypesManager from "../../app/admin/eventos/editar/components/EventTicketTypesManager"

interface EventFormProps {
  event?: AdminEvent | null
  onSubmit: (eventData: Partial<AdminEvent>) => void
  onCancel: () => void
  isLoading: boolean
}

export function EventForm({ event, onSubmit, onCancel, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState<Partial<AdminEvent>>({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    category: "",
    organizer: "",
    totalCapacity: 0,
    status: "draft",
    seatMapId: "", // Nuevo campo para el ID del mapa de asientos
  })
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        venue: event.venue,
        category: event.category,
        organizer: event.organizer,
        totalCapacity: event.totalCapacity,
        status: event.status,
        seatMapId: event.seatMapId || "", // Cargar el seatMapId existente
      })
      if (event.date) {
        setSelectedDate(new Date(event.date))
      }
    }
  }, [event])

  useEffect(() => {
    const fetchCategories = async () => {
      const fetchedCategories = await getAdminCategories()
      setCategories(fetchedCategories.map((cat) => ({ id: cat.id, name: cat.name })))
    }
    fetchCategories()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }))
  }

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setFormData((prev) => ({ ...prev, date: date ? format(date, "yyyy-MM-dd") : "" }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{event ? "Editar Evento" : "Crear Nuevo Evento"}</CardTitle>
        <CardDescription>
          {event ? `Editando ${event.title}` : "Completa los detalles para crear un nuevo evento."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="details">Detalles</TabsTrigger>
              <TabsTrigger value="tickets">Boletos</TabsTrigger>
              <TabsTrigger value="payments">Pagos</TabsTrigger>
              <TabsTrigger value="seatmap">Mapa de Asientos</TabsTrigger>
              <TabsTrigger value="servicefee">Tarifa de Servicio</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="title">Título del Evento</Label>
                <Input id="title" value={formData.title || ""} onChange={handleChange} required />
              </div>
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea id="description" value={formData.description || ""} onChange={handleChange} rows={4} />
              </div>
              <div>
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={formData.category || ""}
                  onValueChange={(value) => handleSelectChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="organizer">Organizador</Label>
                <Input id="organizer" value={formData.organizer || ""} onChange={handleChange} />
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 pt-4">
              <div>
                <Label htmlFor="date">Fecha</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, "PPP") : <span>Selecciona una fecha</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="time">Hora</Label>
                <Input id="time" type="time" value={formData.time || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="venue">Lugar</Label>
                <Input id="venue" value={formData.venue || ""} onChange={handleChange} />
              </div>
              <div>
                <Label htmlFor="totalCapacity">Capacidad Total</Label>
                <Input
                  id="totalCapacity"
                  type="number"
                  value={formData.totalCapacity || 0}
                  onChange={handleChange}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="status">Estado</Label>
                <Select
                  value={formData.status || "draft"}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Borrador</SelectItem>
                    <SelectItem value="published">Publicado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="tickets" className="space-y-4 pt-4">
              {event?.id ? (
                <EventTicketTypesManager eventId={event.id} />
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-4">
                    Guarda el evento primero para poder gestionar los tipos de boletos.
                  </p>
                  <Button type="button" variant="outline" disabled>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Añadir Tipo de Boleto
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="space-y-4 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Métodos de Pago</h3>
                <p className="text-sm text-gray-600">
                  Selecciona qué métodos de pago estarán disponibles para este evento
                </p>
                
                {/* PSE */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">PSE - Pagos Seguros en Línea</h4>
                      <p className="text-sm text-gray-600">Transferencia bancaria directa desde tu cuenta</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.paymentMethods?.pse || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        paymentMethods: { ...prev.paymentMethods, pse: checked }
                      }))
                    }
                  />
                </div>

                {/* Tarjetas de Crédito */}
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Tarjetas de Crédito</h4>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.paymentMethods?.credit_card || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        paymentMethods: { ...prev.paymentMethods, credit_card: checked }
                      }))
                    }
                  />
                </div>

                {/* Tarjetas de Débito */}
                <div className="flex items-center justify-between p-4 bg-orange-50 rounded-xl border border-orange-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Tarjetas de Débito</h4>
                      <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.paymentMethods?.debit_card || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        paymentMethods: { ...prev.paymentMethods, debit_card: checked }
                      }))
                    }
                  />
                </div>

                {/* Daviplata */}
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Daviplata</h4>
                      <p className="text-sm text-gray-600">Billetera digital de Davivienda</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.paymentMethods?.daviplata || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        paymentMethods: { ...prev.paymentMethods, daviplata: checked }
                      }))
                    }
                  />
                </div>

                {/* TC Serfinanza */}
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                      <CalendarIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">TC Serfinanza</h4>
                      <p className="text-sm text-gray-600">Tarjeta de crédito Serfinanza</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.paymentMethods?.tc_serfinanza || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({
                        ...prev,
                        paymentMethods: { ...prev.paymentMethods, tc_serfinanza: checked }
                      }))
                    }
                  />
                </div>

                {/* Información adicional */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-gray-700">
                      <p className="font-medium mb-1">Información importante:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Los métodos de pago seleccionados aparecerán en el checkout del evento</li>
                        <li>• Puedes cambiar esta configuración en cualquier momento</li>
                        <li>• Al menos un método de pago debe estar habilitado</li>
                        <li>• Los usuarios solo verán los métodos que estén activos</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="seatmap" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Asocia un mapa de asientos a este evento o crea uno nuevo.
              </p>
              <div>
                <Label htmlFor="seatMapId">ID del Mapa de Asientos</Label>
                <Input
                  id="seatMapId"
                  value={formData.seatMapId || ""}
                  onChange={handleChange}
                  placeholder="Ej: mapa_concierto_123"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Este ID se usará para cargar el mapa de asientos en la vista pública.
                </p>
              </div>
              {event?.id && (
                <Link href={`/admin/eventos/${event.id}/mapa-asientos`} passHref>
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Ir al Editor de Mapa de Asientos
                  </Button>
                </Link>
              )}
              {!event?.id && (
                <p className="text-sm text-muted-foreground mt-2">
                  Guarda el evento primero para poder acceder al editor de mapas de asientos.
                </p>
              )}
            </TabsContent>

            <TabsContent value="servicefee" className="space-y-4 pt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Configuración de Tarifa de Servicio</h3>
                <p className="text-sm text-gray-600">
                  Configura la tarifa de servicio que se aplicará a las compras de este evento
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceFeeType">Tipo de Tarifa</Label>
                    <Select
                      value={formData.serviceFeeType || "percentage"}
                      onValueChange={(value) => handleSelectChange("serviceFeeType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo de tarifa" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                        <SelectItem value="fixed">Valor Fijo (COP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="serviceFeeValue">
                      {formData.serviceFeeType === "percentage" ? "Porcentaje (%)" : "Valor Fijo (COP)"}
                    </Label>
                    <Input
                      id="serviceFeeValue"
                      type="number"
                      step={formData.serviceFeeType === "percentage" ? "0.01" : "1"}
                      min="0"
                      placeholder={formData.serviceFeeType === "percentage" ? "5.00" : "5000"}
                      value={formData.serviceFeeValue || 5.00}
                      onChange={(e) => handleChange(e)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serviceFeeDescription">Descripción de la Tarifa</Label>
                  <Input
                    id="serviceFeeDescription"
                    placeholder="Ej: Tarifa de servicio, Comisión de procesamiento, etc."
                    value={formData.serviceFeeDescription || "Tarifa de servicio"}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Vista previa de la tarifa:</p>
                      <p>
                        Si un usuario compra un boleto de $50,000, la tarifa de servicio será:{" "}
                        <span className="font-semibold">
                          {formData.serviceFeeType === "percentage" 
                            ? `$${(50000 * ((formData.serviceFeeValue || 5) / 100)).toLocaleString()} (${formData.serviceFeeValue || 5}%)`
                            : `$${(formData.serviceFeeValue || 5000).toLocaleString()}`
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : event ? "Actualizar Evento" : "Crear Evento"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
