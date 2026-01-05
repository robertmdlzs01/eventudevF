"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, Calendar, MapPin, Shield, User, CreditCard } from "lucide-react"
import type { AdminUser } from "@/app/admin/actions"
import { apiClient } from "@/lib/api-client"
import { getEventsForOrganizers } from "@/app/admin/actions"
import { useSearchParams } from "next/navigation"

interface UserFormProps {
  initialData?: AdminUser
  onSubmit: (data: Omit<AdminUser, "id" | "createdAt"> | Partial<Omit<AdminUser, "id" | "createdAt">>) => void
  onCancel?: () => void
}

export function UserForm({ initialData, onSubmit, onCancel }: UserFormProps) {
  const searchParams = useSearchParams()
  const roleFromUrl = searchParams?.get('role')
  
  // Usar first_name y last_name directamente
  const firstName = initialData?.first_name || ''
  const lastName = initialData?.last_name || ''

  const [formData, setFormData] = useState({
    firstName: firstName,
    lastName: lastName,
    email: initialData?.email || "",
    password: "", // Campo de contraseña
    phone: initialData?.phone || "",
    role: initialData?.role || (roleFromUrl as "admin" | "organizer" | "user" | "administrator" | "pos_manager" | "cashier") || ("user" as const),
    status: initialData?.status || ("active" as const),
  })

  // Estado para eventos
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  // Cargar eventos cuando el rol es organizador
  useEffect(() => {
    if (formData.role === 'organizer') {
      loadEvents()
    }
  }, [formData.role])

  const loadEvents = async () => {
    setLoadingEvents(true)
    try {
      // Usar server action para obtener eventos (funciona desde el servidor con autenticación)
      const eventsData = await getEventsForOrganizers()
      setEvents(eventsData)
      console.log('✅ Eventos cargados:', eventsData.length)
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setLoadingEvents(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar que si es organizador, tenga al menos un evento asignado
    if (formData.role === 'organizer' && selectedEvents.length === 0) {
      alert('Los organizadores deben tener al menos un evento asignado.')
      return
    }
    
    // Preparar datos para enviar
    const submitData = {
      ...formData,
      // Solo incluir password si no está vacío (para edición)
      ...(formData.password && { password: formData.password }),
      // Incluir eventos seleccionados si es organizador
      ...(formData.role === 'organizer' && { assignedEvents: selectedEvents })
    }
    
    
    onSubmit(submitData)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? "Editar Usuario" : 
           formData.role === 'administrator' ? "Crear Administrador" :
           formData.role === 'pos_manager' ? "Crear Gerente POS" :
           formData.role === 'cashier' ? "Crear Cajero" :
           formData.role === 'organizer' ? "Crear Organizador" :
           "Crear Nuevo Usuario"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                {initialData ? "Nueva Contraseña (opcional)" : "Contraseña"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={!initialData} // Requerido solo para crear usuario
                placeholder={initialData ? "Dejar vacío para mantener la actual" : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value: "admin" | "organizer" | "user" | "administrator" | "pos_manager" | "cashier") => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="administrator">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span>Administrador</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="pos_manager">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-500" />
                      <span>Gerente POS</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="cashier">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-green-500" />
                      <span>Cajero</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="organizer">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-purple-500" />
                      <span>Organizador</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="user">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>Usuario</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sección de permisos para roles POS */}
          {(formData.role === 'administrator' || formData.role === 'pos_manager' || formData.role === 'cashier') && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <Label className="text-sm font-medium text-blue-700">
                  Permisos del Rol POS
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formData.role === 'administrator' && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-red-600">Administrador - Acceso Completo</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Gestionar Todo el Sistema</li>
                      <li>• Gestionar Usuarios y Roles</li>
                      <li>• Gestionar Eventos y Tickets</li>
                      <li>• Gestionar Puntos de Venta</li>
                      <li>• Ver Todos los Reportes</li>
                      <li>• Procesar Reembolsos</li>
                      <li>• Configuración del Sistema</li>
                    </ul>
                  </div>
                )}
                
                {formData.role === 'pos_manager' && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-600">Gerente POS - Gestión de Ventas</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Gestionar Puntos de Venta</li>
                      <li>• Abrir/Cerrar Cajas</li>
                      <li>• Vender Tickets</li>
                      <li>• Procesar Reembolsos</li>
                      <li>• Ver Reportes de Ventas</li>
                      <li>• Gestionar Eventos (Opcional)</li>
                      <li>• Gestionar Tickets (Opcional)</li>
                    </ul>
                  </div>
                )}
                
                {formData.role === 'cashier' && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-green-600">Cajero - Operaciones Básicas</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Abrir/Cerrar Cajas</li>
                      <li>• Vender Tickets</li>
                      <li>• Ver Órdenes de Venta</li>
                      <li>• Check-in de Tickets</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sección de eventos para organizadores */}
          {formData.role === 'organizer' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <Label className="text-sm font-medium text-amber-700">
                  Eventos Asignados (Obligatorio para organizadores)
                </Label>
              </div>
              
              {loadingEvents ? (
                <div className="text-sm text-gray-500">Cargando eventos...</div>
              ) : events.length === 0 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    No hay eventos disponibles. Debes crear eventos antes de asignar organizadores.
                  </AlertDescription>
                </Alert>
              ) : (
                <ScrollArea className="h-48 w-full border rounded-md p-4">
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div key={event.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`event-${event.id}`}
                          checked={selectedEvents.includes(event.id.toString())}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedEvents([...selectedEvents, event.id.toString()])
                            } else {
                              setSelectedEvents(selectedEvents.filter(id => id !== event.id.toString()))
                            }
                          }}
                        />
                        <Label htmlFor={`event-${event.id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{event.title}</span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(event.date).toLocaleDateString()}</span>
                              <MapPin className="h-3 w-3" />
                              <span>{event.venue}</span>
                            </div>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {selectedEvents.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-gray-600">Eventos seleccionados:</span>
                  {selectedEvents.map((eventId) => {
                    const event = events.find(e => e.id.toString() === eventId)
                    return event ? (
                      <Badge key={eventId} variant="secondary">
                        {event.title}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="submit">{initialData ? "Actualizar Usuario" : "Crear Usuario"}</Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
