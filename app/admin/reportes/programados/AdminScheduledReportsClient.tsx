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
import { Switch } from "@/components/ui/switch"
import { Plus, Clock, Edit, Trash2, Play, Pause, Calendar, FileText, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getScheduledReports, createScheduledReport, updateScheduledReport, deleteScheduledReport, toggleScheduledReport } from "../../actions"

interface ScheduledReport {
  id: string
  name: string
  description?: string
  type: string
  schedule: any
  recipients: any[]
  status: string
  lastRun?: string
  nextRun?: string
  createdAt: string
  updatedAt: string
  createdBy: number
}

const mockScheduledReports: ScheduledReport[] = [
  {
    id: "1",
    name: "Reporte Semanal de Ventas",
    description: "Reporte automático de ventas semanales",
    type: "sales",
    schedule: { frequency: "weekly", day: "monday", time: "09:00" },
    recipients: ["admin@eventu.co", "manager@eventu.co"],
    status: "active",
    lastRun: "2024-02-12T09:00:00",
    nextRun: "2024-02-19T09:00:00",
    createdAt: "2024-02-01T09:00:00",
    updatedAt: "2024-02-12T09:00:00",
    createdBy: 1
  },
  {
    id: "2",
    name: "Reporte Mensual de Eventos",
    description: "Resumen mensual de eventos y estadísticas",
    type: "events",
    schedule: { frequency: "monthly", day: 1, time: "08:00" },
    recipients: ["admin@eventu.co"],
    status: "inactive",
    lastRun: "2024-02-01T08:00:00",
    nextRun: "2024-03-01T08:00:00",
    createdAt: "2024-01-15T10:00:00",
    updatedAt: "2024-02-01T08:00:00",
    createdBy: 1
  }
]

export default function AdminScheduledReportsClient() {
  const [scheduledReports, setScheduledReports] = useState<ScheduledReport[]>(mockScheduledReports)
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null)
  const [newReport, setNewReport] = useState({
    name: "",
    description: "",
    type: "",
    format: "pdf",
    frequency: "daily",
    recipients: [] as string[]
  })
  const { toast } = useToast()

  useEffect(() => {
    loadScheduledReports()
  }, [])

  const loadScheduledReports = async () => {
    setLoading(true)
    try {
      const reports = await getScheduledReports()
      if (reports.length > 0) {
        setScheduledReports(reports)
      }
    } catch (error) {
      console.error('Error loading scheduled reports:', error)
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
      const success = await createScheduledReport(newReport)
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte programado creado exitosamente"
        })
        setIsCreateDialogOpen(false)
        setNewReport({
          name: "",
          description: "",
          type: "",
          format: "pdf",
          frequency: "daily",
          recipients: []
        })
        loadScheduledReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo crear el reporte programado",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al crear el reporte programado",
        variant: "destructive"
      })
    }
  }

  const handleUpdateReport = async () => {
    if (!editingReport) return

    try {
      const success = await updateScheduledReport(parseInt(editingReport.id), {
        name: editingReport.name,
        description: editingReport.description,
        schedule: editingReport.schedule,
        recipients: editingReport.recipients,
        status: editingReport.status
      })
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte programado actualizado exitosamente"
        })
        setIsEditDialogOpen(false)
        setEditingReport(null)
        loadScheduledReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el reporte programado",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el reporte programado",
        variant: "destructive"
      })
    }
  }

  const handleDeleteReport = async (id: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este reporte programado?")) return

    try {
      const success = await deleteScheduledReport(parseInt(id))
      if (success) {
        toast({
          title: "Éxito",
          description: "Reporte programado eliminado exitosamente"
        })
        loadScheduledReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el reporte programado",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el reporte programado",
        variant: "destructive"
      })
    }
  }

  const handleToggleStatus = async (id: string) => {
    try {
      const report = scheduledReports.find(r => r.id === id)
      if (!report) return
      const success = await toggleScheduledReport(id, report.status !== "active")
      if (success) {
        toast({
          title: "Éxito",
          description: "Estado del reporte actualizado exitosamente"
        })
        loadScheduledReports()
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado del reporte",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al actualizar el estado del reporte",
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
        return <FileText className="h-4 w-4" />
      case 'events':
        return <Calendar className="h-4 w-4" />
      case 'users':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    return status === 'active' ? (
      <Badge className="bg-green-100 text-green-800">Activo</Badge>
    ) : (
      <Badge variant="secondary">Inactivo</Badge>
    )
  }

  const getScheduleLabel = (schedule: any) => {
    const frequency = schedule.frequency || 'daily'
    const time = schedule.time || '09:00'
    
    switch (frequency) {
      case 'daily':
        return `Diario a las ${time}`
      case 'weekly':
        const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        const day = days[schedule.day || 1]
        return `${day}s a las ${time}`
      case 'monthly':
        return `Día ${schedule.day || 1} de cada mes a las ${time}`
      default:
        return `A las ${time}`
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Reportes Programados
        </h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Reporte Programado
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Reporte Programado</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newReport.name}
                  onChange={(e) => setNewReport({ ...newReport, name: e.target.value })}
                  placeholder="Nombre del reporte programado"
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
              <div className="grid gap-2">
                <Label htmlFor="frequency">Frecuencia</Label>
                <Select 
                  value={newReport.frequency} 
                  onValueChange={(value) => setNewReport({ 
                    ...newReport, 
                    frequency: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar frecuencia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diario</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="monthly">Mensual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value="09:00"
                  onChange={(e) => setNewReport({ 
                    ...newReport
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateReport}>
                Crear
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reportes Programados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Programación</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Próxima Ejecución</TableHead>
                <TableHead>Última Ejecución</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {scheduledReports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <div className="font-medium">{report.name}</div>
                    {report.description && (
                      <div className="text-sm text-muted-foreground">{report.description}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(report.type)}
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{getScheduleLabel(report.schedule)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(report.status)}
                  </TableCell>
                  <TableCell>
                    {report.nextRun ? (
                      <div className="text-sm">
                        {format(new Date(report.nextRun), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No programado</span>
                    )}
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
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(report.id)}
                      >
                        {report.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
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

      {/* Dialog para editar reporte programado */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Reporte Programado</DialogTitle>
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
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-status"
                  checked={editingReport.status === 'active'}
                  onCheckedChange={(checked) => setEditingReport({ 
                    ...editingReport, 
                    status: checked ? 'active' : 'inactive'
                  })}
                />
                <Label htmlFor="edit-status">Activo</Label>
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
