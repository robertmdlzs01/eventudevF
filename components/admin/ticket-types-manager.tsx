"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Edit, Trash2, DollarSign, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface TicketType {
  id?: string
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  status: "active" | "inactive"
  maxPerOrder?: number
  saleStart?: string
  saleEnd?: string
}

interface TicketTypesManagerProps {
  eventId: string
  onTicketTypesChange?: (ticketTypes: TicketType[]) => void
}

export function TicketTypesManager({ eventId, onTicketTypesChange }: TicketTypesManagerProps) {
  const { toast } = useToast()
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [formData, setFormData] = useState<TicketType>({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    sold: 0,
    status: "active",
    maxPerOrder: 10
  })

  useEffect(() => {
    fetchTicketTypes()
  }, [eventId])

  const fetchTicketTypes = async () => {
    try {
      setIsLoading(true)
      const response = await apiClient.getEventTicketTypes(parseInt(eventId))
      if (response.success && response.data) {
        setTicketTypes(response.data)
      } else {
        setTicketTypes([])
      }
    } catch (error) {
      console.error('Error fetching ticket types:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los tipos de boletos",
        variant: "destructive",
      })
      setTicketTypes([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingTicket) {
        // Actualizar tipo de boleto existente
        const response = await apiClient.updateTicketType(parseInt(editingTicket.id!), formData)
        if (response.success) {
          await fetchTicketTypes() // Recargar datos
          toast({
            title: "Tipo de boleto actualizado",
            description: "El tipo de boleto se ha actualizado correctamente",
          })
        } else {
          throw new Error(response.error || 'Error al actualizar')
        }
      } else {
        // Crear nuevo tipo de boleto
        const response = await apiClient.createTicketType(parseInt(eventId), formData)
        if (response.success) {
          await fetchTicketTypes() // Recargar datos
          toast({
            title: "Tipo de boleto creado",
            description: "El nuevo tipo de boleto se ha creado correctamente",
          })
        } else {
          throw new Error(response.error || 'Error al crear')
        }
      }
      
      resetForm()
      setIsDialogOpen(false)
      onTicketTypesChange?.(ticketTypes)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al guardar el tipo de boleto",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setFormData(ticket)
    setIsDialogOpen(true)
  }

  const handleDelete = async (ticketId: string) => {
    try {
      const response = await apiClient.deleteTicketType(parseInt(ticketId))
      if (response.success) {
        await fetchTicketTypes() // Recargar datos
        toast({
          title: "Tipo de boleto eliminado",
          description: "El tipo de boleto se ha eliminado correctamente",
        })
        onTicketTypesChange?.(ticketTypes)
      } else {
        throw new Error(response.error || 'Error al eliminar')
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al eliminar el tipo de boleto",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      sold: 0,
      status: "active",
      maxPerOrder: 10
    })
    setEditingTicket(null)
  }

  const handleCancel = () => {
    resetForm()
    setIsDialogOpen(false)
  }

  const totalRevenue = ticketTypes.reduce((sum, ticket) => sum + (ticket.price * ticket.sold), 0)
  const totalSold = ticketTypes.reduce((sum, ticket) => sum + ticket.sold, 0)
  const totalQuantity = ticketTypes.reduce((sum, ticket) => sum + ticket.quantity, 0)

  if (isLoading) {
    return <div className="text-center py-4">Cargando tipos de boletos...</div>
  }

  return (
    <div className="space-y-4">
      {/* Estadísticas */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Ingresos Totales</p>
                <p className="text-lg font-bold">${totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Boletos Vendidos</p>
                <p className="text-lg font-bold">{totalSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-orange-600" />
              <div>
                <p className="text-sm font-medium">Capacidad Total</p>
                <p className="text-lg font-bold">{totalQuantity}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de tipos de boletos */}
      <div className="space-y-3">
        {ticketTypes.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{ticket.name}</h3>
                    <Badge variant={ticket.status === "active" ? "default" : "secondary"}>
                      {ticket.status === "active" ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.description}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm">
                    <span className="font-medium">${ticket.price.toLocaleString()}</span>
                    <span className="text-muted-foreground">
                      {ticket.sold} / {ticket.quantity} vendidos
                    </span>
                    <span className="text-muted-foreground">
                      {Math.round((ticket.sold / ticket.quantity) * 100)}% ocupado
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(ticket)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(ticket.id!)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Botón para agregar nuevo tipo de boleto */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full" variant="outline">
            <PlusCircle className="h-4 w-4 mr-2" />
            Añadir Tipo de Boleto
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingTicket ? "Editar Tipo de Boleto" : "Nuevo Tipo de Boleto"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: General, VIP, Premium"
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe los beneficios de este tipo de boleto"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="maxPerOrder">Máx. por Orden</Label>
                <Input
                  id="maxPerOrder"
                  type="number"
                  value={formData.maxPerOrder || 10}
                  onChange={(e) => setFormData({ ...formData, maxPerOrder: parseInt(e.target.value) || 10 })}
                  placeholder="10"
                  min="1"
                  max="100"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status">Estado</Label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
                className="w-full p-2 border rounded-md"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingTicket ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
