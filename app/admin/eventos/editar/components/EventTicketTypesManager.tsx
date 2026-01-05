"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, DollarSign, Users, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getEventTicketTypes, createEventTicketType, updateEventTicketType, deleteEventTicketType } from "@/app/admin/actions"

interface TicketType {
  id: number
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  max_per_order: number | null
  sale_start: string | null
  sale_end: string | null
  status: string
  created_at: string
  updated_at: string
}

interface EventTicketTypesManagerProps {
  eventId: string
}

export default function EventTicketTypesManager({ eventId }: EventTicketTypesManagerProps) {
  const { toast } = useToast()
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTicketType, setEditingTicketType] = useState<TicketType | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    quantity: "",
    max_per_order: "",
    sale_start: "",
    sale_end: "",
    status: "active"
  })

  // Cargar tipos de boletos del evento
  const loadTicketTypes = async () => {
    try {
      setLoading(true)
      const data = await getEventTicketTypes(eventId)
      setTicketTypes(data)
    } catch (error) {
      console.error('Error loading ticket types:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de boletos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (eventId) {
      loadTicketTypes()
    }
  }, [eventId])

  // Limpiar formulario
  const clearForm = () => {
    setFormData({
      name: "",
      description: "",
      price: "",
      quantity: "",
      max_per_order: "",
      sale_start: "",
      sale_end: "",
      status: "active"
    })
    setEditingTicketType(null)
  }

  // Manejar cambios en el formulario
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Crear o actualizar tipo de boleto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const ticketTypeData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        max_per_order: formData.max_per_order ? parseInt(formData.max_per_order) : null,
        sale_start: formData.sale_start || null,
        sale_end: formData.sale_end || null,
        status: formData.status
      }

      let success = false
      
      if (editingTicketType) {
        // Actualizar
        success = await updateEventTicketType(editingTicketType.id.toString(), ticketTypeData)
        if (success) {
          toast({
            title: "Tipo de boleto actualizado",
            description: "El tipo de boleto se ha actualizado correctamente.",
          })
        }
      } else {
        // Crear
        success = await createEventTicketType(eventId, ticketTypeData)
        if (success) {
          toast({
            title: "Tipo de boleto creado",
            description: "El tipo de boleto se ha creado correctamente.",
          })
        }
      }

      if (success) {
        setIsDialogOpen(false)
        clearForm()
        loadTicketTypes()
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el tipo de boleto.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error saving ticket type:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar el tipo de boleto.",
        variant: "destructive",
      })
    }
  }

  // Editar tipo de boleto
  const handleEdit = (ticketType: TicketType) => {
    setEditingTicketType(ticketType)
    setFormData({
      name: ticketType.name,
      description: ticketType.description || "",
      price: ticketType.price.toString(),
      quantity: ticketType.quantity.toString(),
      max_per_order: ticketType.max_per_order?.toString() || "",
      sale_start: ticketType.sale_start || "",
      sale_end: ticketType.sale_end || "",
      status: ticketType.status
    })
    setIsDialogOpen(true)
  }

  // Eliminar tipo de boleto
  const handleDelete = async (ticketTypeId: number) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este tipo de boleto?")) {
      return
    }

    try {
      const success = await deleteEventTicketType(ticketTypeId.toString())
      if (success) {
        toast({
          title: "Tipo de boleto eliminado",
          description: "El tipo de boleto se ha eliminado correctamente.",
        })
        loadTicketTypes()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el tipo de boleto.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting ticket type:', error)
      toast({
        title: "Error",
        description: "Ocurrió un error al eliminar el tipo de boleto.",
        variant: "destructive",
      })
    }
  }

  // Abrir diálogo para crear nuevo
  const handleCreateNew = () => {
    clearForm()
    setIsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Tipos de Boletos</h3>
          <p className="text-sm text-muted-foreground">
            Gestiona los diferentes tipos de boletos para este evento
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar Tipo de Boleto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingTicketType ? "Editar Tipo de Boleto" : "Crear Tipo de Boleto"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Ej: General, VIP, Premium"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Descripción del tipo de boleto"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0"
                    min="0"
                    step="1000"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleInputChange("quantity", e.target.value)}
                    placeholder="0"
                    min="1"
                    required
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="max_per_order">Máximo por orden</Label>
                <Input
                  id="max_per_order"
                  type="number"
                  value={formData.max_per_order}
                  onChange={(e) => handleInputChange("max_per_order", e.target.value)}
                  placeholder="Sin límite"
                  min="1"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="sale_start">Inicio de venta</Label>
                  <Input
                    id="sale_start"
                    type="datetime-local"
                    value={formData.sale_start}
                    onChange={(e) => handleInputChange("sale_start", e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sale_end">Fin de venta</Label>
                  <Input
                    id="sale_end"
                    type="datetime-local"
                    value={formData.sale_end}
                    onChange={(e) => handleInputChange("sale_end", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  {editingTicketType ? "Actualizar" : "Crear"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Cargando tipos de boletos...</p>
        </div>
      ) : ticketTypes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium mb-2">No hay tipos de boletos</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Crea el primer tipo de boleto para este evento
            </p>
            <Button onClick={handleCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Tipo de Boleto
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {ticketTypes.map((ticketType) => (
            <Card key={ticketType.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold">{ticketType.name}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        ticketType.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {ticketType.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    {ticketType.description && (
                      <p className="text-sm text-muted-foreground mb-3">
                        {ticketType.description}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-medium">
                          ${ticketType.price.toLocaleString()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span>
                          {ticketType.quantity - (ticketType.sold || 0)} disponibles
                        </span>
                      </div>
                      
                      {ticketType.max_per_order && (
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">Máx por orden:</span>
                          <span className="font-medium">{ticketType.max_per_order}</span>
                        </div>
                      )}
                      
                      {ticketType.sale_start && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-orange-600" />
                          <span className="text-xs">
                            {new Date(ticketType.sale_start).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ticketType)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(ticketType.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
