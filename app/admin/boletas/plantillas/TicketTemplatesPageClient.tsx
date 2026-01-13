"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  MoreVertical, 
  FileText, 
  Star, 
  Grid, 
  List, 
  Filter, 
  Download, 
  Upload, 
  Sparkles, 
  Layout, 
  Ruler,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Calendar,
  Layers
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { TicketTemplateEditor } from "@/components/admin/ticket-template-editor"
import type { TicketTemplate } from "@/lib/ticket-templates"
import { ticketTemplateService } from "@/lib/ticket-template-service"
import { cn } from "@/lib/utils"

export function TicketTemplatesPageClient() {
  const [templates, setTemplates] = useState<TicketTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const loaded = await ticketTemplateService.getTemplates()
      setTemplates(loaded)
    } catch (error) {
      console.error("Error cargando plantillas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las plantillas",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateNew = () => {
    setEditingTemplate(null)
    setIsEditorOpen(true)
  }

  const handleEdit = (template: TicketTemplate) => {
    setEditingTemplate(template)
    setIsEditorOpen(true)
  }

  const handleDuplicate = async (template: TicketTemplate) => {
    try {
      const duplicated: TicketTemplate = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (Copia)`,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      const success = await ticketTemplateService.saveTemplate(duplicated)
      if (success) {
        toast({
          title: "Éxito",
          description: "Plantilla duplicada correctamente",
        })
        loadTemplates()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar la plantilla",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (templateId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      return
    }

    try {
      const success = await ticketTemplateService.deleteTemplate(templateId)
      if (success) {
        toast({
          title: "Éxito",
          description: "Plantilla eliminada correctamente",
        })
        loadTemplates()
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      })
    }
  }

  const handleSave = (template: TicketTemplate) => {
    setIsEditorOpen(false)
    setEditingTemplate(null)
    loadTemplates()
  }

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && template.isActive) ||
      (statusFilter === "inactive" && !template.isActive)
    return matchesSearch && matchesStatus
  })

  const activeTemplates = templates.filter(t => t.isActive).length
  const defaultTemplates = templates.filter(t => t.isDefault).length
  const totalFields = templates.reduce((acc, t) => acc + t.fields.length, 0)

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-600 via-primary-700 to-purple-700 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,transparent)]" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Sparkles className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-4xl font-bold mb-2">Plantillas de Boletos</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4 mt-6">
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={handleCreateNew}
                  size="lg"
                  className="bg-white text-primary-700 hover:bg-primary-50 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] w-full max-h-[95vh] h-full p-0 gap-0 overflow-hidden">
                <DialogHeader className="sr-only">
                  <DialogTitle>
                    {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
                  </DialogTitle>
                  <DialogDescription>
                    Diseña y personaliza una plantilla de boleto físico profesional
                  </DialogDescription>
                </DialogHeader>
                <TicketTemplateEditor
                  templateId={editingTemplate?.id}
                  onSave={handleSave}
                  onCancel={() => setIsEditorOpen(false)}
                />
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="lg"
              className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
            >
              <Upload className="mr-2 h-5 w-5" />
              Importar
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Plantillas</p>
                <p className="text-3xl font-bold mt-2">{templates.length}</p>
              </div>
              <div className="p-3 bg-primary-100 rounded-xl">
                <FileText className="h-6 w-6 text-primary-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Plantillas Activas</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{activeTemplates}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Por Defecto</p>
                <p className="text-3xl font-bold mt-2 text-amber-600">{defaultTemplates}</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-xl">
                <Star className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Campos</p>
                <p className="text-3xl font-bold mt-2 text-purple-600">{totalFields}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Layers className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y Búsqueda */}
      <Card className="border-2 shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar plantillas por nombre o descripción..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 border-2"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-11 border-2">
                    <Filter className="mr-2 h-4 w-4" />
                    {statusFilter === "all" ? "Todos" : statusFilter === "active" ? "Activas" : "Inactivas"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuLabel>Filtrar por estado</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                    Todos
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                    Activas
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
                    <XCircle className="mr-2 h-4 w-4 text-red-600" />
                    Inactivas
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-11 border-2"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-11 border-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Plantillas */}
      {isLoading ? (
        <Card className="border-2">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              <p className="text-muted-foreground text-lg">Cargando plantillas...</p>
            </div>
          </CardContent>
        </Card>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-2">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 bg-muted rounded-full">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  {searchQuery ? "No se encontraron plantillas" : "No hay plantillas aún"}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery
                    ? "Intenta con otros términos de búsqueda"
                    : "Crea tu primera plantilla"}
                </p>
                {!searchQuery && (
                  <Button onClick={handleCreateNew} size="lg">
                    <Plus className="mr-2 h-5 w-5" />
                    Crear Primera Plantilla
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id} 
              className="group border-2 hover:shadow-2xl hover:border-primary-300 transition-all duration-300 overflow-hidden relative"
            >
              {/* Header con gradiente */}
              <div className={cn(
                "h-32 relative overflow-hidden",
                template.isActive 
                  ? "bg-gradient-to-br from-primary-500 to-primary-700" 
                  : "bg-gradient-to-br from-slate-300 to-slate-400"
              )}>
                <div className="absolute inset-0 bg-grid-white/10" />
                <div className="absolute top-4 right-4 flex gap-2">
                  {template.isDefault && (
                    <Badge className="bg-amber-500 hover:bg-amber-600">
                      <Star className="h-3 w-3 mr-1" />
                      Por Defecto
                    </Badge>
                  )}
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
                    <Layout className="h-8 w-8 text-white" />
                  </div>
                </div>
              </div>

              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-xl mb-1 truncate group-hover:text-primary-600 transition-colors">
                      {template.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {template.description || "Sin descripción"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Ruler className="h-4 w-4" />
                    <span className="truncate">
                      {template.measurements.width}×{template.measurements.height} {template.measurements.unit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Layers className="h-4 w-4" />
                    <span>{template.fields.length} campos</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Actualizado: {new Date(template.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(template)}
                    className="flex-1 border-2 hover:bg-primary-50 hover:border-primary-300"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                    className="border-2 hover:bg-primary-50 hover:border-primary-300"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-2 hover:bg-primary-50 hover:border-primary-300"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver detalles
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(template.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Plantillas ({filteredTemplates.length})</span>
            </CardTitle>
            <CardDescription>
              Vista de lista - Gestiona tus plantillas de boletos físicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-center justify-between p-4 border-2 rounded-lg hover:shadow-lg hover:border-primary-300 transition-all duration-200"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={cn(
                      "p-3 rounded-lg",
                      template.isActive 
                        ? "bg-primary-100 text-primary-600" 
                        : "bg-slate-100 text-slate-600"
                    )}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg truncate">{template.name}</h3>
                        {template.isDefault && (
                          <Badge variant="default" className="bg-amber-500">
                            <Star className="h-3 w-3 mr-1" />
                            Por Defecto
                          </Badge>
                        )}
                        <Badge variant={template.isActive ? "default" : "secondary"}>
                          {template.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {template.description || "Sin descripción"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {template.measurements.width}×{template.measurements.height} {template.measurements.unit}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {template.fields.length} campos
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(template.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                      className="border-2"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(template)}
                      className="border-2"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    {!template.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="border-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
