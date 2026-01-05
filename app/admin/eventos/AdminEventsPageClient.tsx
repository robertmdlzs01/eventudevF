"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { deleteAdminEvent, changeEventStatus } from "@/app/admin/actions"
import { apiClient } from "@/lib/api-client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { MoreHorizontal, PlusCircle, Eye, Edit, Trash2, Globe, FileText, XCircle, Filter, RefreshCw } from "lucide-react"
import { EventPreviewCard } from "@/components/admin/event-preview-card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import type { AdminEvent, AdminCategory } from "@/app/admin/actions"

interface AdminEventsPageClientProps {
  events: AdminEvent[]
  categories: AdminCategory[]
}

/**
 * Pure Client Component – no async/await in render tree
 */
export default function AdminEventsPageClient({ events, categories }: AdminEventsPageClientProps) {
  const { toast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [filteredEvents, setFilteredEvents] = useState<AdminEvent[]>(events)
  const [currentEvents, setCurrentEvents] = useState<AdminEvent[]>(events)

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredEvents(currentEvents)
    } else {
      setFilteredEvents(currentEvents.filter(event => event.status === statusFilter))
    }
  }, [currentEvents, statusFilter])

  // Función para recargar eventos
  const reloadEvents = async () => {
    try {
      console.log('🔄 Recargando eventos...')
      const response = await apiClient.getAdminEvents()
      console.log('📡 Respuesta de API:', response)
      
      if (response.success && response.data) {
        console.log('✅ Datos recibidos:', response.data.events.length, 'eventos')
        setCurrentEvents(response.data.events)
      } else {
        console.log('❌ Error en respuesta:', response)
      }
    } catch (error) {
      console.error('❌ Error reloading events:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      console.log('🗑️ Iniciando eliminación del evento:', id)
      const formData = new FormData()
      formData.append("id", id)
      
      // Actualización optimista: eliminar del estado inmediatamente
      setCurrentEvents(prev => prev.filter(event => event.id !== id))
      
      await deleteAdminEvent(formData)
      console.log('✅ Evento eliminado exitosamente')
      
      toast({
        title: "Evento eliminado",
        description: "El evento se ha eliminado correctamente.",
      })
      
      // Recargar la lista de eventos para asegurar sincronización
      await reloadEvents()
    } catch (err: any) {
      console.error('❌ Error eliminando evento:', err)
      
      // Si hay error, restaurar el evento en la lista
      await reloadEvents()
      
      toast({
        title: "Error al eliminar",
        description: err?.message ?? "Ocurrió un problema al eliminar el evento.",
        variant: "destructive",
      })
    }
  }

  const handleStatusChange = async (eventId: string, newStatus: 'draft' | 'published' | 'cancelled') => {
    try {
      await changeEventStatus(eventId, newStatus)
      toast({
        title: "Estado actualizado",
        description: `El evento ha sido ${newStatus === 'published' ? 'publicado' : newStatus === 'draft' ? 'guardado como borrador' : 'cancelado'} exitosamente.`,
      })
      // Recargar la lista de eventos
      await reloadEvents()
    } catch (err: any) {
      toast({
        title: "Error al cambiar estado",
        description: err?.message ?? "Ocurrió un problema al cambiar el estado del evento.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Gestión de Eventos
        </h1>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={reloadEvents}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Recargar
          </Button>
          <Button asChild className="bg-gradient-to-r from-pink-500 to-purple-600">
            <Link href="/admin/eventos/crear">
              <PlusCircle className="mr-2 h-4 w-4" />
              Crear nuevo evento
            </Link>
          </Button>
        </div>
      </div>

      {/* Event list */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
        <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
          <CardTitle>Listado de eventos</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filtros */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrar por estado:</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Todos ({currentEvents.length})
              </Button>
              <Button
                variant={statusFilter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('published')}
              >
                Publicados ({currentEvents.filter(e => e.status === 'published').length})
              </Button>
              <Button
                variant={statusFilter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('draft')}
              >
                Borradores ({currentEvents.filter(e => e.status === 'draft').length})
              </Button>
              <Button
                variant={statusFilter === 'cancelled' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('cancelled')}
              >
                Cancelados ({currentEvents.filter(e => e.status === 'cancelled').length})
              </Button>
            </div>
          </div>
          
          <TableWrapper events={filteredEvents} onDelete={handleDelete} onStatusChange={handleStatusChange} />
        </CardContent>
      </Card>
    </main>
  )
}

interface TableWrapperProps {
  events: AdminEvent[]
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: 'draft' | 'published' | 'cancelled') => void
}

function TableWrapper({ events, onDelete, onStatusChange }: TableWrapperProps) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50 text-blue-800">
            <TableHead>Título</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                No hay eventos registrados.
              </TableCell>
            </TableRow>
          ) : (
            events.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.title}</TableCell>
                <TableCell>{format(new Date(event.date), "dd MMM yyyy", { locale: es })}</TableCell>
                <TableCell>{typeof event.category === 'object' ? (event.category as any).name : event.category}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      event.status === "published" && "bg-green-100 text-green-800",
                      event.status === "draft" && "bg-yellow-100 text-yellow-800",
                      event.status === "cancelled" && "bg-red-100 text-red-800",
                    )}
                  >
                    {event.status === "published" ? "Publicado" : event.status === "draft" ? "Borrador" : "Cancelado"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <RowActions event={event} onDelete={onDelete} onStatusChange={onStatusChange} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

function RowActions({
  event,
  onDelete,
  onStatusChange,
}: {
  event: AdminEvent
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: 'draft' | 'published' | 'cancelled') => void
}) {
  const handleDeleteClick = () => {
    onDelete(event.id)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
        {/* Vista previa */}
        <Dialog>
          <DialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Eye className="mr-2 h-4 w-4" />
              Vista previa
            </DropdownMenuItem>
          </DialogTrigger>
          <DialogContent className="max-w-4xl p-0">
            <EventPreviewCard event={event} />
          </DialogContent>
        </Dialog>
        {/* Editar */}
        <DropdownMenuItem asChild>
          <Link href={`/admin/eventos/${event.id}/editar`}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {/* Cambiar Estado */}
        <DropdownMenuLabel>Cambiar Estado</DropdownMenuLabel>
        {event.status !== 'published' && (
          <DropdownMenuItem onClick={() => onStatusChange(event.id, 'published')}>
            <Globe className="mr-2 h-4 w-4" />
            Publicar
          </DropdownMenuItem>
        )}
        {event.status !== 'draft' && (
          <DropdownMenuItem onClick={() => onStatusChange(event.id, 'draft')}>
            <FileText className="mr-2 h-4 w-4" />
            Guardar como Borrador
          </DropdownMenuItem>
        )}
        {event.status !== 'cancelled' && (
          <DropdownMenuItem onClick={() => onStatusChange(event.id, 'cancelled')}>
            <XCircle className="mr-2 h-4 w-4" />
            Cancelar Evento
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {/* Eliminar */}
        <DropdownMenuItem className="text-red-600" onClick={handleDeleteClick}>
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
