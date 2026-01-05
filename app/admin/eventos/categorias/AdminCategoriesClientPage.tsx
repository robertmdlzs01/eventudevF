"use client"

import type React from "react"

import { Suspense, useState, useEffect } from "react"
import { getAdminCategories, createAdminCategory, updateAdminCategory, deleteAdminCategory } from "@/app/admin/actions"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { AdminCategory } from "@/app/admin/actions"

interface CategoryFormValues {
  name: string
  slug: string
  description?: string
  icon?: string
  color?: string
  status?: "active" | "inactive"
}

interface CreateCategoryDialogProps {
  onCreate: (data: Omit<AdminCategory, "id" | "eventCount">) => void
}

function CreateCategoryDialog({ onCreate }: CreateCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CategoryFormValues>({
    name: "",
    slug: "",
    description: "",
    icon: "",
    color: "",
    status: "active",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Generar slug automáticamente si no se proporciona
    const categoryData = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: formData.description || "",
      icon: formData.icon || "",
      color: formData.color || "",
      status: formData.status || "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      eventCount: 0
    }
    onCreate(categoryData)
    setOpen(false)
    setFormData({ name: "", slug: "", description: "", icon: "", color: "", status: "active" }) // Reset form
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-600">
          <PlusCircle className="mr-2 h-4 w-4" />
          Nueva Categoría
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Categoría</DialogTitle>
          <DialogDescription>Define una nueva categoría para organizar tus eventos.</DialogDescription>
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
            <Label htmlFor="slug" className="text-right">
              Slug
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icono (Lucide)
            </Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="col-span-3"
              placeholder="Ej: Music, Calendar"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color (Tailwind)
            </Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="col-span-3"
              placeholder="Ej: bg-red-500"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
              className="col-span-3 border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit">Crear Categoría</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

interface EditCategoryDialogProps {
  category: AdminCategory
  onUpdate: (id: string, data: Partial<Omit<AdminCategory, "id" | "eventCount">>) => void
}

function EditCategoryDialog({ category, onUpdate }: EditCategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<CategoryFormValues>({
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon,
    color: category.color,
    status: category.status,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Generar slug automáticamente si no se proporciona
    const categoryData = {
      ...formData,
      slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    }
    onUpdate(category.id, categoryData)
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
          <DialogTitle>Editar Categoría</DialogTitle>
          <DialogDescription>Modifica los detalles de la categoría seleccionada.</DialogDescription>
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
            <Label htmlFor="slug" className="text-right">
              Slug
            </Label>
            <Input
              id="slug"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="icon" className="text-right">
              Icono (Lucide)
            </Label>
            <Input
              id="icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="col-span-3"
              placeholder="Ej: Music, Calendar"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="color" className="text-right">
              Color (Tailwind)
            </Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="col-span-3"
              placeholder="Ej: bg-red-500"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "inactive" })}
              className="col-span-3 border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="active">Activa</option>
              <option value="inactive">Inactiva</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit">Guardar Cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

type AdminCategoriesPageProps = {}

export default function AdminCategoriesPage(props: AdminCategoriesPageProps) {
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [filteredCategories, setFilteredCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const { toast } = useToast()

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const fetchedCategories = await getAdminCategories()
      setCategories(fetchedCategories)
      setFilteredCategories(fetchedCategories)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filtrar categorías
  useEffect(() => {
    let filtered = categories

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.slug.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(category => category.status === statusFilter)
    }

    setFilteredCategories(filtered)
  }, [categories, searchTerm, statusFilter])

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleCreate = async (data: Omit<AdminCategory, "id" | "eventCount">) => {
    try {
      await createAdminCategory(data)
      toast({
        title: "Categoría Creada",
        description: `La categoría "${data.name}" ha sido creada exitosamente.`,
      })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear la categoría.",
        variant: "destructive",
      })
    }
  }

  const handleUpdate = async (id: string, data: Partial<Omit<AdminCategory, "id" | "eventCount">>) => {
    try {
      await updateAdminCategory(id, data)
      toast({
        title: "Categoría Actualizada",
        description: `La categoría "${data.name}" ha sido actualizada exitosamente.`,
      })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al actualizar la categoría.",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteAdminCategory(id)
      toast({
        title: "Categoría Eliminada",
        description: "La categoría ha sido eliminada exitosamente.",
      })
      fetchCategories()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al eliminar la categoría.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Categorías
        </h1>
        <CreateCategoryDialog onCreate={handleCreate} />
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle>Listado de Categorías</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros y búsqueda */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar categorías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Estado:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="all">Todos</option>
                  <option value="active">Activas</option>
                  <option value="inactive">Inactivas</option>
                </select>
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Mostrando {filteredCategories.length} de {categories.length} categorías
            </div>
          </div>

          <Suspense fallback={<div>Cargando categorías...</div>}>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Cargando categorías...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {categories.length === 0 ? "No hay categorías registradas." : "No se encontraron categorías con los filtros aplicados."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-50 text-blue-800">
                      <TableHead>Nombre</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Eventos</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>{category.slug}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{category.description}</TableCell>
                        <TableCell>
                          <Badge
                            className={cn(
                              category.status === "active" && "bg-green-100 text-green-800",
                              category.status === "inactive" && "bg-red-100 text-red-800",
                            )}
                          >
                            {category.status === "active" ? "Activa" : "Inactiva"}
                          </Badge>
                        </TableCell>
                        <TableCell>{category.eventCount}</TableCell>
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
                              <EditCategoryDialog category={category} onUpdate={handleUpdate} />
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(category.id)}>
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
