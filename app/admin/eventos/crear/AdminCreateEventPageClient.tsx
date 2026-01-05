"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Eye, Calendar, MapPin, DollarSign, Settings, ImageIcon, Plus, X, UserCheck, Building2, CreditCard, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { createAdminEvent } from "@/app/admin/actions"
import type { AdminCategory } from "@/app/admin/actions"

interface AdminCreateEventPageClientProps {
  categories: AdminCategory[]
}

interface TicketType {
  id: string
  name: string
  price: number
  quantity: number
  description: string
}

interface CustomField {
  id: string
  label: string
  type: "text" | "number" | "email" | "tel"
  required: boolean
}

export default function AdminCreateEventPageClient({ categories }: AdminCreateEventPageClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  


  const [formData, setFormData] = useState({
    title: "",
    description: "",
    shortDescription: "",
    date: "",
    time: "",
    endDate: "",
    endTime: "",
    location: "",
    address: "",
    city: "",
    category: "",
    organizerName: "",
    organizerEmail: "",
    organizerPhone: "",
    status: "draft" as "draft" | "published" | "cancelled",
    featured: false,
    allowRefunds: true,
    refundPolicy: "",
    ageRestriction: "",
    dresscode: "",
    tags: [] as string[],
    // Campos personalizados para información del evento
    organizerId: "",
    alcoholSales: false,
    pregnantWomen: false,
    disabledAccess: false,
    accommodationType: "MIXTA",
    pulepCode: "",
    externalFood: false,
    parking: false,
    // Campos de tarifa de servicio
    serviceFeeType: "percentage" as "percentage" | "fixed",
    serviceFeeValue: 5.00,
    serviceFeeDescription: "Tarifa de servicio",
    // Campos de métodos de pago
    paymentMethods: {
      pse: true,
      credit_card: true,
      debit_card: true,
      daviplata: true,
      tc_serfinanza: true,
    },
    // Campos multimedia
    mainImage: "",
    videoUrl: "",
    galleryImages: [] as string[],
    socialLinks: {
      website: "",
      facebook: "",
      instagram: "",
      twitter: "",
    },
    // Configuración de asientos
    maxSeatsPerPurchase: 4,
  })

  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      id: "1",
      name: "General",
      price: 0,
      quantity: 100,
      description: "Entrada general al evento",
    },
  ])

  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [newTag, setNewTag] = useState("")
  
  // Estados para multimedia
  const [selectedMainImage, setSelectedMainImage] = useState<File | null>(null)
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<File[]>([])
  const [mainImagePreview, setMainImagePreview] = useState<string>("")
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([])

  const handleInputChange = (field: string, value: any) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as Record<string, any> || {}),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }))
    }
  }

  const addTicketType = () => {
    const newTicket: TicketType = {
      id: Date.now().toString(),
      name: "",
      price: 0,
      quantity: 0,
      description: "",
    }
    setTicketTypes([...ticketTypes, newTicket])
  }

  const updateTicketType = (id: string, field: keyof TicketType, value: any) => {
    setTicketTypes((prev) => prev.map((ticket) => (ticket.id === id ? { ...ticket, [field]: value } : ticket)))
  }

  const removeTicketType = (id: string) => {
    setTicketTypes((prev) => prev.filter((ticket) => ticket.id !== id))
  }

  const addCustomField = () => {
    const newField: CustomField = {
      id: Date.now().toString(),
      label: "",
      type: "text",
      required: false,
    }
    setCustomFields([...customFields, newField])
  }

  const updateCustomField = (id: string, field: keyof CustomField, value: any) => {
    setCustomFields((prev) =>
      prev.map((customField) => (customField.id === id ? { ...customField, [field]: value } : customField)),
    )
  }

  const removeCustomField = (id: string) => {
    setCustomFields((prev) => prev.filter((field) => field.id !== id))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  // Funciones para manejar multimedia
  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedMainImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setMainImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setSelectedGalleryImages(prev => [...prev, ...files])
      
      files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setGalleryPreviews(prev => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const removeGalleryImage = (index: number) => {
    setSelectedGalleryImages(prev => prev.filter((_, i) => i !== index))
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (status: "draft" | "published") => {
    setIsLoading(true)
    try {
      const eventData = {
        ...formData,
        status,
        ticketTypes,
        customFields,
      }

      const formDataToSend = new FormData()
      Object.entries(eventData).forEach(([key, value]) => {
        if (typeof value === "object") {
          formDataToSend.append(key, JSON.stringify(value))
        } else {
          formDataToSend.append(key, value.toString())
        }
      })

      // Agregar archivos multimedia
      if (selectedMainImage) {
        formDataToSend.append('mainImage', selectedMainImage)
      }
      
      selectedGalleryImages.forEach((file, index) => {
        formDataToSend.append(`galleryImages`, file)
      })

      await createAdminEvent(formDataToSend)

      toast({
        title: "Evento creado",
        description: `El evento ha sido ${status === "published" ? "publicado" : "guardado como borrador"} exitosamente.`,
      })

      router.push("/admin/eventos")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear el evento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/eventos">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Crear Nuevo Evento</h1>
            <p className="text-muted-foreground">Completa la información para crear tu evento</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button onClick={() => handleSubmit("published")} disabled={isLoading}>
            <Eye className="h-4 w-4 mr-2" />
            Publicar Evento
          </Button>
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Básico
          </TabsTrigger>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Detalles
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Boletos
          </TabsTrigger>
          <TabsTrigger value="payments" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Pagos
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Personalizado
          </TabsTrigger>
          <TabsTrigger value="media" className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Multimedia
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Avanzado
          </TabsTrigger>
        </TabsList>

        {/* Información Básica */}
        <TabsContent value="basic">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Básica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Título del Evento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Ej: Concierto de Rock en Vivo"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Categoría <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.category || ""} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>
                          No hay categorías disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Descripción Corta</Label>
                <Input
                  id="shortDescription"
                  placeholder="Breve descripción que aparecerá en las tarjetas de evento"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange("shortDescription", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Descripción Completa <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe tu evento en detalle..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="organizerName">
                    Nombre del Organizador <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="organizerName"
                    placeholder="Nombre completo"
                    value={formData.organizerName}
                    onChange={(e) => handleInputChange("organizerName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizerEmail">Email del Organizador</Label>
                  <Input
                    id="organizerEmail"
                    type="email"
                    placeholder="organizador@ejemplo.com"
                    value={formData.organizerEmail}
                    onChange={(e) => handleInputChange("organizerEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="organizerPhone">Teléfono del Organizador</Label>
                  <Input
                    id="organizerPhone"
                    placeholder="+57 300 123 4567"
                    value={formData.organizerPhone}
                    onChange={(e) => handleInputChange("organizerPhone", e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange("featured", checked)}
                />
                <Label htmlFor="featured">Evento destacado</Label>
                <Badge variant="secondary">Aparecerá en la página principal</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Detalles del Evento */}
        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalles del Evento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">
                    Fecha de Inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange("date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">
                    Hora de Inicio <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => handleInputChange("time", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha de Finalización</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Hora de Finalización</Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange("endTime", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Ubicación</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="location">
                      Nombre del Lugar <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="location"
                      placeholder="Ej: Teatro Nacional"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">
                      Ciudad <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="Ej: Barranquilla"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Dirección Completa</Label>
                  <Input
                    id="address"
                    placeholder="Ej: Carrera 50 #80-120, Barranquilla, Atlántico"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Adicional</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="ageRestriction">Restricción de Edad</Label>
                    <Select
                      value={formData.ageRestriction}
                      onValueChange={(value) => handleInputChange("ageRestriction", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona restricción" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas las edades</SelectItem>
                        <SelectItem value="18+">Solo mayores de 18</SelectItem>
                        <SelectItem value="21+">Solo mayores de 21</SelectItem>
                        <SelectItem value="family">Evento familiar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dresscode">Código de Vestimenta</Label>
                    <Input
                      id="dresscode"
                      placeholder="Ej: Casual, Formal, Temático"
                      value={formData.dresscode}
                      onChange={(e) => handleInputChange("dresscode", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Boletos */}
        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuración de Boletos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Tipos de Boletos</h3>
                <Button onClick={addTicketType} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Tipo
                </Button>
              </div>

              <div className="space-y-4">
                {ticketTypes.map((ticket, index) => (
                  <Card key={ticket.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium">Tipo de Boleto #{index + 1}</h4>
                      {ticketTypes.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTicketType(ticket.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nombre del Boleto</Label>
                        <Input
                          placeholder="Ej: VIP, General, Estudiante"
                          value={ticket.name}
                          onChange={(e) => updateTicketType(ticket.id, "name", e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Precio (COP)</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={ticket.price}
                          onChange={(e) => updateTicketType(ticket.id, "price", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cantidad Disponible</Label>
                        <Input
                          type="number"
                          placeholder="100"
                          value={ticket.quantity}
                          onChange={(e) => updateTicketType(ticket.id, "quantity", Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                          placeholder="Descripción del boleto"
                          value={ticket.description}
                          onChange={(e) => updateTicketType(ticket.id, "description", e.target.value)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Políticas de Reembolso</h3>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="allowRefunds"
                    checked={formData.allowRefunds}
                    onCheckedChange={(checked) => handleInputChange("allowRefunds", checked)}
                  />
                  <Label htmlFor="allowRefunds">Permitir reembolsos</Label>
                </div>
                {formData.allowRefunds && (
                  <div className="space-y-2">
                    <Label htmlFor="refundPolicy">Política de Reembolso</Label>
                    <Textarea
                      id="refundPolicy"
                      placeholder="Describe las condiciones para reembolsos..."
                      rows={3}
                      value={formData.refundPolicy}
                      onChange={(e) => handleInputChange("refundPolicy", e.target.value)}
                    />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tarifa de Servicio</h3>
                <p className="text-sm text-gray-600">
                  Configura la tarifa de servicio que se aplicará a las compras de este evento
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="serviceFeeType">Tipo de Tarifa</Label>
                    <Select
                      value={formData.serviceFeeType}
                      onValueChange={(value) => handleInputChange("serviceFeeType", value)}
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
                      value={formData.serviceFeeValue}
                      onChange={(e) => handleInputChange("serviceFeeValue", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serviceFeeDescription">Descripción de la Tarifa</Label>
                  <Input
                    id="serviceFeeDescription"
                    placeholder="Ej: Tarifa de servicio, Comisión de procesamiento, etc."
                    value={formData.serviceFeeDescription}
                    onChange={(e) => handleInputChange("serviceFeeDescription", e.target.value)}
                  />
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600 mt-0.5">
                      <DollarSign className="h-4 w-4" />
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Vista previa de la tarifa:</p>
                      <p>
                        Si un usuario compra un boleto de $50,000, la tarifa de servicio será:{" "}
                        <span className="font-semibold">
                          {formData.serviceFeeType === "percentage" 
                            ? `$${(50000 * (formData.serviceFeeValue / 100)).toLocaleString()} (${formData.serviceFeeValue}%)`
                            : `$${formData.serviceFeeValue.toLocaleString()}`
                          }
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración de Métodos de Pago */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Configuración de Métodos de Pago
              </CardTitle>
              <p className="text-sm text-gray-600">
                Selecciona qué métodos de pago estarán disponibles para este evento
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* PSE - Pagos Seguros en Línea */}
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">PSE - Pagos Seguros en Línea</h4>
                    <p className="text-sm text-gray-600">Transferencia bancaria directa desde tu cuenta</p>
                  </div>
                </div>
                <Switch
                  checked={formData.paymentMethods.pse}
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
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Tarjetas de Crédito</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
                  </div>
                </div>
                <Switch
                  checked={formData.paymentMethods.credit_card}
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
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Tarjetas de Débito</h4>
                    <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
                  </div>
                </div>
                <Switch
                  checked={formData.paymentMethods.debit_card}
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
                    <Smartphone className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">Daviplata</h4>
                    <p className="text-sm text-gray-600">Billetera digital de Davivienda</p>
                  </div>
                </div>
                <Switch
                  checked={formData.paymentMethods.daviplata}
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
                    <CreditCard className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">TC Serfinanza</h4>
                    <p className="text-sm text-gray-600">Tarjeta de crédito Serfinanza</p>
                  </div>
                </div>
                <Switch
                  checked={formData.paymentMethods.tc_serfinanza}
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
                    <DollarSign className="h-4 w-4" />
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

            </CardContent>
          </Card>
        </TabsContent>

        {/* Campos Personalizados */}
        <TabsContent value="custom">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Información Personalizada del Evento
              </CardTitle>
              <p className="text-sm text-gray-600">
                Configura información específica que aparecerá en el detalle del evento
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Información del Responsable */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información del Responsable</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="organizerId">CC / NIT del Responsable</Label>
                    <Input
                      id="organizerId"
                      placeholder="Ej: 12345678-9"
                      value={formData.organizerId}
                      onChange={(e) => handleInputChange("organizerId", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pulepCode">Código PULEP</Label>
                    <Input
                      id="pulepCode"
                      placeholder="Ej: PULEP-2024-001"
                      value={formData.pulepCode}
                      onChange={(e) => handleInputChange("pulepCode", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Restricciones y Políticas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Restricciones y Políticas</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="alcoholSales"
                        checked={formData.alcoholSales}
                        onCheckedChange={(checked) => handleInputChange("alcoholSales", checked)}
                      />
                      <Label htmlFor="alcoholSales">Venta de Licor Habilitada</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="pregnantWomen"
                        checked={formData.pregnantWomen}
                        onCheckedChange={(checked) => handleInputChange("pregnantWomen", checked)}
                      />
                      <Label htmlFor="pregnantWomen">Permitir Mujeres Embarazadas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="disabledAccess"
                        checked={formData.disabledAccess}
                        onCheckedChange={(checked) => handleInputChange("disabledAccess", checked)}
                      />
                      <Label htmlFor="disabledAccess">Acceso para Discapacitados</Label>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="externalFood"
                        checked={formData.externalFood}
                        onCheckedChange={(checked) => handleInputChange("externalFood", checked)}
                      />
                      <Label htmlFor="externalFood">Prohibir Alimentos Externos</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="parking"
                        checked={formData.parking}
                        onCheckedChange={(checked) => handleInputChange("parking", checked)}
                      />
                      <Label htmlFor="parking">Zona de Parqueos Disponible</Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accommodationType">Tipo de Acomodación</Label>
                      <Select
                        value={formData.accommodationType}
                        onValueChange={(value) => handleInputChange("accommodationType", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo de acomodación" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MIXTA">Mixta</SelectItem>
                          <SelectItem value="GENERAL">General</SelectItem>
                          <SelectItem value="VIP">VIP</SelectItem>
                          <SelectItem value="ASIENTOS">Asientos Numerados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxSeatsPerPurchase">Máximo de Asientos por Compra</Label>
                      <Input
                        id="maxSeatsPerPurchase"
                        type="number"
                        min="1"
                        max="20"
                        placeholder="4"
                        value={formData.maxSeatsPerPurchase}
                        onChange={(e) => handleInputChange("maxSeatsPerPurchase", parseInt(e.target.value) || 4)}
                      />
                      <p className="text-sm text-gray-500">
                        Número máximo de asientos que un usuario puede seleccionar en una sola compra
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Información Adicional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Adicional</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Nota:</strong> La información configurada aquí aparecerá en el detalle público del evento 
                    y ayudará a los asistentes a conocer las políticas y restricciones específicas.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multimedia */}
        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Multimedia y Redes Sociales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Imagen Principal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imagen Principal del Evento</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    {mainImagePreview ? (
                      <div className="space-y-4">
                        <img 
                          src={mainImagePreview} 
                          alt="Vista previa" 
                          className="max-w-full h-48 object-cover rounded-lg mx-auto"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setSelectedMainImage(null)
                            setMainImagePreview("")
                          }}
                        >
                          Cambiar Imagen
                        </Button>
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-600 mb-2">Selecciona la imagen principal del evento</p>
                        <p className="text-sm text-gray-500">Recomendado: 1200x800px, máximo 5MB</p>
                        <Button variant="outline" className="mt-4 bg-transparent">
                          <label htmlFor="mainImage" className="cursor-pointer">
                            Seleccionar Imagen Principal
                          </label>
                        </Button>
                        <input
                          id="mainImage"
                          type="file"
                          accept="image/*"
                          onChange={handleMainImageChange}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Video Promocional */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Video Promocional</h3>
                <div className="space-y-2">
                  <Label htmlFor="videoUrl">URL del Video (YouTube, Vimeo, etc.)</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={formData.videoUrl}
                    onChange={(e) => handleInputChange("videoUrl", e.target.value)}
                  />
                  <p className="text-sm text-gray-500">
                    Puedes usar enlaces de YouTube, Vimeo u otras plataformas de video
                  </p>
                </div>
              </div>

              <Separator />

              {/* Galería de Imágenes */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Galería de Imágenes</h3>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-2">Agrega más imágenes para la galería</p>
                    <p className="text-sm text-gray-500">Máximo 10 imágenes, 5MB cada una</p>
                    <Button variant="outline" className="mt-4 bg-transparent">
                      <label htmlFor="galleryImages" className="cursor-pointer">
                        Seleccionar Imágenes
                      </label>
                    </Button>
                    <input
                      id="galleryImages"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleGalleryImagesChange}
                      className="hidden"
                    />
                  </div>
                  
                  {/* Vista previa de galería */}
                  {galleryPreviews.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Imágenes seleccionadas:</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {galleryPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img 
                              src={preview} 
                              alt={`Galería ${index + 1}`} 
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              onClick={() => removeGalleryImage(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Redes Sociales */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Redes Sociales</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="website">Sitio Web</Label>
                    <Input
                      id="website"
                      placeholder="https://ejemplo.com"
                      value={formData.socialLinks.website}
                      onChange={(e) => handleInputChange("socialLinks.website", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebook">Facebook</Label>
                    <Input
                      id="facebook"
                      placeholder="https://facebook.com/evento"
                      value={formData.socialLinks.facebook}
                      onChange={(e) => handleInputChange("socialLinks.facebook", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <Input
                      id="instagram"
                      placeholder="https://instagram.com/evento"
                      value={formData.socialLinks.instagram}
                      onChange={(e) => handleInputChange("socialLinks.instagram", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="twitter">Twitter</Label>
                    <Input
                      id="twitter"
                      placeholder="https://twitter.com/evento"
                      value={formData.socialLinks.twitter}
                      onChange={(e) => handleInputChange("socialLinks.twitter", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuración Avanzada */}
        <TabsContent value="advanced">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración Avanzada
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Etiquetas</h3>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Agregar etiqueta"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addTag()}
                  />
                  <Button onClick={addTag} size="sm">
                    Agregar
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Campos Personalizados</h3>
                  <Button onClick={addCustomField} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Campo
                  </Button>
                </div>
                <div className="space-y-4">
                  {customFields.map((field, index) => (
                    <Card key={field.id} className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium">Campo #{index + 1}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCustomField(field.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Etiqueta</Label>
                          <Input
                            placeholder="Nombre del campo"
                            value={field.label}
                            onChange={(e) => updateCustomField(field.id, "label", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tipo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) => updateCustomField(field.id, "type", value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="email">Email</SelectItem>
                              <SelectItem value="tel">Teléfono</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                          <Switch
                            checked={field.required}
                            onCheckedChange={(checked) => updateCustomField(field.id, "required", checked)}
                          />
                          <Label>Requerido</Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
