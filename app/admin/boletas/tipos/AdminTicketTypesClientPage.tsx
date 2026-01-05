"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import {
  getAdminTicketTypes,
  createAdminTicketType,
  updateAdminTicketType,
  deleteAdminTicketType,
} from "@/app/admin/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { AdminTicketType } from "@/lib/types"

function AdminTicketTypesClientPage() {
  const [ticketTypes, setTicketTypes] = useState<AdminTicketType[]>([])
  const [filteredTicketTypes, setFilteredTicketTypes] = useState<AdminTicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [eventFilter, setEventFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchTicketTypes = async () => {
    setLoading(true)
    try {
      const fetchedTicketTypes = await getAdminTicketTypes()
      setTicketTypes(fetchedTicketTypes)
      setFilteredTicketTypes(fetchedTicketTypes)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los tipos de boleta.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para filtrar tipos de boletos
  const filterTicketTypes = () => {
    let filtered = ticketTypes

    // Filtro por búsqueda de texto
    if (searchTerm) {
      filtered = filtered.filter(type =>
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.eventName?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por evento
    if (eventFilter !== "all") {
      if (eventFilter === "assigned") {
        filtered = filtered.filter(type => type.eventName && type.eventName.trim() !== "")
      } else if (eventFilter === "unassigned") {
        filtered = filtered.filter(type => !type.eventName || type.eventName.trim() === "")
      } else {
        filtered = filtered.filter(type => type.eventName === eventFilter)
      }
    }

    // Filtro por estado
    if (statusFilter !== "all") {
      filtered = filtered.filter(type => type.status === statusFilter)
    }

    setFilteredTicketTypes(filtered)
  }

  useEffect(() => {
    fetchTicketTypes()
  }, [])

  useEffect(() => {
    filterTicketTypes()
  }, [ticketTypes, searchTerm, eventFilter, statusFilter])

  const handleCreate = async (data: Omit<AdminTicketType, "id" | "createdAt">) => {
    try {
      await createAdminTicketType(data)
      toast({
        title: "Tipo de Boleta Creado",
        description: `El tipo "${data.name}" ha sido creado exitosamente.`,
      })
      fetchTicketTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear el tipo de boleta.",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (id: string, data: Partial<Omit<AdminTicketType, "id" | "createdAt">>) => {
    try {
      await updateAdminTicketType(id, data)
      toast({
        title: "Tipo de Boleta Actualizado",
        description: `El tipo "${data.name}" ha sido actualizado exitosamente.`,
      })
      fetchTicketTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al actualizar el tipo de boleta.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminTicketType(id)
      toast({
        title: "Tipo de Boleta Eliminado",
        description: "El tipo de boleta ha sido eliminado exitosamente.",
      })
      fetchTicketTypes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al eliminar el tipo de boleta.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Tipos de Boleta
        </h1>
        <CreateTicketTypeDialog onCreate={handleCreate} />
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle>Listado de Tipos de Boleta</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros de búsqueda */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Búsqueda por texto */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar por nombre, descripción o evento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              {/* Filtro por evento */}
              <div className="w-full sm:w-48">
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por evento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los eventos</SelectItem>
                    <SelectItem value="assigned">Con evento asignado</SelectItem>
                    <SelectItem value="unassigned">Sin evento asignado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por estado */}
              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filtrar por estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="inactive">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Información de resultados */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>
                Mostrando {filteredTicketTypes.length} de {ticketTypes.length} tipos de boletos
              </span>
              {(searchTerm || eventFilter !== "all" || statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("")
                    setEventFilter("all")
                    setStatusFilter("all")
                  }}
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          <Suspense fallback={<div>Cargando tipos de boleta...</div>}>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando tipos de boleta...</div>
            ) : filteredTicketTypes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm || eventFilter !== "all" || statusFilter !== "all" 
                  ? "No se encontraron tipos de boletos con los filtros aplicados." 
                  : "No hay tipos de boleta registrados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 text-blue-800">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Evento</TableHead>
                      <TableHead>Precio</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Vendidos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTicketTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{type.description}</TableCell>
                        <TableCell>
                          {type.eventName ? (
                            <span className="text-sm font-medium text-blue-600">
                              {type.eventName}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-500 italic">
                              Sin evento asignado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {type.price ? (
                            <span className="font-medium text-green-600">
                              ${type.price.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {type.quantity ? (
                            <span className="font-medium">
                              {type.quantity.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {type.sold ? (
                            <span className="text-sm">
                              {type.sold.toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-500">0</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            type.status === 'active' 
                              ? 'bg-green-100 text-green-800' 
                              : type.status === 'inactive'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {type.status === 'active' ? 'Activo' : 
                             type.status === 'inactive' ? 'Inactivo' : 
                             type.status || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                              <EditTicketTypeDialog ticketType={type} onUpdate={handleUpdate} />
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(type.id)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}

interface TicketTypeFormValues {
  name: string
  description: string
  price: number
  quantity: number
  sold: number
  remaining: number
  status: string
  eventId: string
  eventName: string
  isDefault: boolean
}

interface CreateTicketTypeDialogProps {
  onCreate: (data: Omit<AdminTicketType, "id" | "createdAt">) => void
}

function CreateTicketTypeDialog({ onCreate }: CreateTicketTypeDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TicketTypeFormValues>({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    sold: 0,
    remaining: 0,
    status: "active",
    eventId: "",
    eventName: "",
    isDefault: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
    setOpen(false)
    setFormData({ name: "", description: "", price: 0, quantity: 0, sold: 0, remaining: 0, status: "active", eventId: "", eventName: "", isDefault: false }) // Reset form
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Tipo de Boleta
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Tipo de Boleta</DialogTitle>
          <DialogDescription>Define un nuevo tipo de boleta para tus eventos.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Crear Tipo de Boleta</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditTicketTypeDialogProps {
  ticketType: AdminTicketType
  onUpdate: (id: string, data: Partial<Omit<AdminTicketType, "id" | "createdAt">>) => void
}

function EditTicketTypeDialog({ ticketType, onUpdate }: EditTicketTypeDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<TicketTypeFormValues>({
    name: ticketType.name,
    description: ticketType.description,
    price: ticketType.price,
    quantity: ticketType.quantity,
    sold: ticketType.sold,
    remaining: ticketType.remaining,
    status: ticketType.status,
    eventId: ticketType.eventId,
    eventName: ticketType.eventName,
    isDefault: ticketType.isDefault,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(ticketType.id, formData)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Tipo de Boleta</DialogTitle>
          <DialogDescription>Modifica los detalles del tipo de boleta seleccionado.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AdminTicketTypesClientPage
