"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar, MapPin, Users, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { AdminEvent } from "@/app/admin/actions"

interface EventPreviewCardProps {
  event: AdminEvent
}

export function EventPreviewCard({ event }: EventPreviewCardProps) {
  // Valores por defecto para evitar errores
  const safePrice = event.price || 0
  const safeCapacity = event.capacity || 0
  const safeTicketsSold = event.ticketsSold || 0
  const safeRevenue = event.revenue || 0
  const safeViews = event.views || 0
  const safeAttendees = event.attendees || 0
  const safeLocationDisplay = event.locationDisplay || 'Ubicación no especificada'
  const safeDescription = event.description || 'Sin descripción'
  const safeOrganizer = event.organizer || 'Sin organizador'

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{event.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Organizado por {safeOrganizer}</p>
          </div>
          <Badge
            variant={event.status === "published" ? "default" : event.status === "draft" ? "secondary" : "destructive"}
          >
            {event.status === "published" ? "Publicado" : event.status === "draft" ? "Borrador" : "Cancelado"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{safeDescription}</p>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {event.date ? format(new Date(event.date), "dd MMM yyyy", { locale: es }) : 'Fecha no especificada'}
              {event.time && `, ${event.time}`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{safeLocationDisplay}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {safeTicketsSold} / {safeCapacity} boletas
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">${safePrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="pt-2">
          <div className="text-sm font-medium mb-2">Estadísticas</div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold">{safeViews.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Visualizaciones</div>
            </div>
            <div>
              <div className="text-lg font-bold">{safeAttendees.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Asistentes</div>
            </div>
            <div>
              <div className="text-lg font-bold">${safeRevenue.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Ingresos</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
