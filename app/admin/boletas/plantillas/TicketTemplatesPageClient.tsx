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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, Search, Edit, Trash2, Copy, Eye, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { TicketTemplateEditor } from "@/components/admin/ticket-template-editor"
import type { TicketTemplate } from "@/lib/ticket-templates"
import { ticketTemplateService } from "@/lib/ticket-template-service"

export function TicketTemplatesPageClient() {
  const [templates, setTemplates] = useState<TicketTemplate[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [editingTemplate, setEditingTemplate] = useState<TicketTemplate | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

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

  const filteredTemplates = templates.filter((template) =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Plantillas de Boletos Físicos</h1>
          <p className="text-muted-foreground">
            Gestiona las plantillas para imprimir boletos físicos personalizados
          </p>
        </div>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Plantilla
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? "Editar Plantilla" : "Nueva Plantilla"}
              </DialogTitle>
              <DialogDescription>
                Diseña y personaliza una plantilla de boleto físico
              </DialogDescription>
            </DialogHeader>
            <TicketTemplateEditor
              templateId={editingTemplate?.id}
              onSave={handleSave}
              onCancel={() => setIsEditorOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar plantillas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Lista de Plantillas */}
      {isLoading ? (
        <div className="text-center py-8">Cargando plantillas...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {searchQuery
                ? "No se encontraron plantillas que coincidan con tu búsqueda"
                : "No hay plantillas creadas aún"}
            </p>
            {!searchQuery && (
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Primera Plantilla
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Plantillas ({filteredTemplates.length})</CardTitle>
            <CardDescription>
              Gestiona tus plantillas de boletos físicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>Tamaño</TableHead>
                  <TableHead>Campos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Última Actualización</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">
                      {template.name}
                      {template.isDefault && (
                        <Badge variant="default" className="ml-2">
                          Por Defecto
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{template.description || "-"}</TableCell>
                    <TableCell>
                      {template.measurements.width} × {template.measurements.height}{" "}
                      {template.measurements.unit}
                    </TableCell>
                    <TableCell>{template.fields.length} campos</TableCell>
                    <TableCell>
                      <Badge
                        variant={template.isActive ? "default" : "secondary"}
                      >
                        {template.isActive ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(template.updatedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(template)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDuplicate(template)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        {!template.isDefault && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(template.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


