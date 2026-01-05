"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Play, Edit, Trash2, Download, Calendar, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getSavedReports, saveReport, updateSavedReport, deleteSavedReport, runSavedReport } from "../../actions"

interface SavedReport {
  id: string
  name: string
  description?: string
  type: string
  filters: any
  schedule: any
  lastRun?: string
  createdAt: string
  updatedAt: string
  createdBy: number
}

const mockSavedReports: SavedReport[] = [
  {
    id: "1",
    name: "Reporte de Ventas Mensual",
    description: "Ventas del mes con análisis detallado",
    type: "sales",
    filters: { period: "30d" },
    schedule: {},
    lastRun: "2024-02-15T10:30:00",
    createdAt: "2024-02-01T09:00:00",
    updatedAt: "2024-02-15T10:30:00",
    createdBy: 1
  },
  {
    id: "2",
    name: "Eventos Activos",
    description: "Lista de eventos publicados y activos",
    type: "events",
    filters: { status: "published" },
    schedule: {},
    createdAt: "2024-02-10T14:20:00",
    updatedAt: "2024-02-10T14:20:00",
    createdBy: 1
  }
]

export default function AdminSavedReportsClient() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>(mockSavedReports)
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<SavedReport | null>(null)
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    type: "",
    filters: {}
  })
  const { toast } = useToast()

  useEffect(() => {
    loadSavedReports()
  }, [])

  const loadSavedReports = async () => {
    setLoading(true)
    try {
      const reports = await getSavedReports()
      if (reports.length > 0) {
        setSavedReports(reports)
      }
    } catch (error) {
      console.error('Error loading saved reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReport = async () => {
    if (!newReport.name || !newReport.type) {
      toast({
        title: "Error",
        description: "Nombre y tipo son requeridos",
        variant: "destructive"
      })
      return
    }

    try {
      const success = await saveReport(newReport)
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte guardado exitosamente"
        })
        setIsCreateDialogOpen(false)
        setNewReport({ name: "", description: "", type: "", filters: {} })
        loadSavedReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el reporte",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al guardar el reporte",
        variant: "destructive"
      })
    }
  }

  const handleUpdateReport = async () => {
    if (!editingReport) return

    try {
      const success = await updateSavedReport(editingReport.id, {
        name: editingReport.name,
        description: editingReport.description,
        filters: editingReport.filters,
        schedule: editingReport.schedule
      })
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte actualizado exitosamente"
        })
        setIsEditDialogOpen(false)
        setEditingReport(null)
        loadSavedReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el reporte",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el reporte",
        variant: "destructive"
      })
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este reporte?")) return

    try {
      const success = await deleteSavedReport(reportId)
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte eliminado exitosamente"
        })
        loadSavedReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el reporte",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el reporte",
        variant: "destructive"
      })
    }
  }

  const handleRunReport = async (reportId: string) => {
    try {
      const result = await runSavedReport(reportId)
      if (result) {
        toast({
          title: "Éxito",
          description: "Reporte ejecutado exitosamente"
        })
        // Aquí se podría abrir un modal con los resultados o descargar el archivo
        console.log("Resultados del reporte:", result)
      } else {
        toast({
          title: "Error",
          description: "No se pudo ejecutar el reporte",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al ejecutar el reporte",
        variant: "destructive"
      })
    }
  }



  const getTypeLabel = (type: string) => {
    const labels = {
      sales: "Ventas",
      events: "Eventos",
      users: "Usuarios",
      financial: "Financiero"
    }
    return labels[type as keyof typeof labels] || type
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'sales':
        return <Download className="h-4 w-4" />
      case 'events':
        return <Calendar className="h-4 w-4" />
      case 'users':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Reportes Guardados
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reporte
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Reporte</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Nombre del reporte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={newReport.description}
                  onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                  placeholder="Descripción del reporte"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={newReport.type} onValueChange={(value) => setNewReport({ ...newReport, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="events">Eventos</SelectItem>
                    <SelectItem value="users">Usuarios</SelectItem>
                    <SelectItem value="financial">Financiero</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReport}>
                Guardar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Guardados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Última Ejecución</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {savedReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {report.description || "Sin descripción"}
                  </TableCell>
                  <TableCell>
                    {report.lastRun ? (
                      <div className="text-sm">
                        {format(new Date(report.lastRun), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(report.createdAt), 'dd/MM/yyyy', { locale: es })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRunReport(report.id)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingReport(report)
                          setIsEditDialogOpen(true)
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para editar reporte */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Reporte</DialogTitle>
          </DialogHeader>
          {editingReport && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editingReport.name}
                  onChange={(e) => setEditingReport({ ...editingReport, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={editingReport.description || ""}
                  onChange={(e) => setEditingReport({ ...editingReport, description: e.target.value })}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateReport}>
              Actualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
