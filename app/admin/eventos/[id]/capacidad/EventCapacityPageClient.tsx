"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Users, Smartphone, Ticket, TrendingUp, Settings, Save, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { TicketManager, type EventCapacity } from "@/lib/ticket-management"
import { IntegratedEventMetrics } from "@/components/admin/integrated-event-metrics"

interface EventCapacityPageClientProps {
  eventId: string
}

export default function EventCapacityPageClient({ eventId }: EventCapacityPageClientProps) {
  const { toast } = useToast()
  const [capacity, setCapacity] = useState<EventCapacity | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    totalCapacity: 0,
    digitalPercentage: 70,
  })

  // Mock event data
  const eventData = {
    id: eventId,
    title: "PANACA VIAJERO BARRANQUILLA",
    date: "2025-06-20",
    time: "09:00",
    venue: "Base Naval, Barranquilla",
  }

  useEffect(() => {
    loadEventCapacity()
  }, [eventId])

  const loadEventCapacity = async () => {
    setIsLoading(true)
    try {
      // Simular carga de datos
      await new Promise((resolve) => setTimeout(resolve, 1000))

      let eventCapacity = TicketManager.getEventCapacity(eventId)

      if (!eventCapacity) {
        // Inicializar capacidad si no existe
        eventCapacity = TicketManager.initializeEventCapacity(eventId, 500, 0.7)
      }

      setCapacity(eventCapacity)
      setEditForm({
        totalCapacity: eventCapacity.totalCapacity,
        digitalPercentage: Math.round((eventCapacity.digitalCapacity / eventCapacity.totalCapacity) * 100),
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar la información de capacidad",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveCapacity = async () => {
    try {
      const digitalPercentage = editForm.digitalPercentage / 100
      const newCapacity = TicketManager.initializeEventCapacity(eventId, editForm.totalCapacity, digitalPercentage)

      setCapacity(newCapacity)
      setIsEditing(false)

      toast({
        title: "Capacidad actualizada",
        description: "La configuración de capacidad ha sido guardada exitosamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la capacidad",
        variant: "destructive",
      })
    }
  }

  const getStats = () => {
    if (!capacity) return null
    return TicketManager.getEventStats(eventId)
  }

  const stats = getStats()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!capacity) {
    return (
      <div className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo cargar la información de capacidad del evento.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/admin/eventos/${eventId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al evento
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Gestión de Capacidad</h1>
            <p className="text-muted-foreground">{eventData.title}</p>
          </div>
        </div>
        <Button
          onClick={() => (isEditing ? handleSaveCapacity() : setIsEditing(true))}
          variant={isEditing ? "default" : "outline"}
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar
            </>
          ) : (
            <>
              <Settings className="h-4 w-4 mr-2" />
              Editar
            </>
          )}
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacity.totalCapacity}</div>
            <p className="text-xs text-muted-foreground">Asistentes máximos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Digitales</CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {capacity.digitalSold}/{capacity.digitalCapacity}
            </div>
            <Progress value={(capacity.digitalSold / capacity.digitalCapacity) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Boletos Físicos</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {capacity.physicalSold}/{capacity.physicalCapacity}
            </div>
            <Progress value={(capacity.physicalSold / capacity.physicalCapacity) * 100} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats?.checkIns || 0}</div>
            <p className="text-xs text-muted-foreground">Asistentes confirmados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
          <TabsTrigger value="sales">Ventas</TabsTrigger>
          <TabsTrigger value="metrics">Métricas Integradas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Distribución de Capacidad */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Capacidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Boletos Digitales</span>
                    <Badge variant="outline">{capacity.digitalCapacity} asientos</Badge>
                  </div>
                  <Progress value={(capacity.digitalCapacity / capacity.totalCapacity) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Vendidos: {capacity.digitalSold}</span>
                    <span>Disponibles: {capacity.availableDigital}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Boletos Físicos</span>
                    <Badge variant="outline">{capacity.physicalCapacity} asientos</Badge>
                  </div>
                  <Progress value={(capacity.physicalCapacity / capacity.totalCapacity) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Vendidos: {capacity.physicalSold}</span>
                    <span>Disponibles: {capacity.availablePhysical}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado Actual */}
            <Card>
              <CardHeader>
                <CardTitle>Estado Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{capacity.digitalSold}</div>
                    <div className="text-sm text-muted-foreground">Digitales Vendidos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{capacity.physicalSold}</div>
                    <div className="text-sm text-muted-foreground">Físicos Vendidos</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{capacity.reservedSlots}</div>
                    <div className="text-sm text-muted-foreground">Reservados</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-gray-600">{capacity.totalAvailable}</div>
                    <div className="text-sm text-muted-foreground">Disponibles</div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">Ocupación Total</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(((capacity.digitalSold + capacity.physicalSold) / capacity.totalCapacity) * 100)}%
                    </span>
                  </div>
                  <Progress
                    value={((capacity.digitalSold + capacity.physicalSold) / capacity.totalCapacity) * 100}
                    className="h-3"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Capacidad</CardTitle>
              <p className="text-sm text-muted-foreground">Ajusta la distribución entre boletos digitales y físicos</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalCapacity">Capacidad Total</Label>
                      <Input
                        id="totalCapacity"
                        type="number"
                        value={editForm.totalCapacity}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, totalCapacity: Number.parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="digitalPercentage">Porcentaje Digital (%)</Label>
                      <Input
                        id="digitalPercentage"
                        type="number"
                        min="0"
                        max="100"
                        value={editForm.digitalPercentage}
                        onChange={(e) =>
                          setEditForm((prev) => ({ ...prev, digitalPercentage: Number.parseInt(e.target.value) || 0 }))
                        }
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Vista Previa</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Boletos Digitales:</span>
                        <span className="ml-2 font-medium">
                          {Math.floor((editForm.totalCapacity * editForm.digitalPercentage) / 100)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Boletos Físicos:</span>
                        <span className="ml-2 font-medium">
                          {editForm.totalCapacity -
                            Math.floor((editForm.totalCapacity * editForm.digitalPercentage) / 100)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Cambiar la capacidad puede afectar las ventas existentes. Asegúrate de que los nuevos límites sean
                      compatibles con los boletos ya vendidos.
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Configuración Actual</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Capacidad Total:</span>
                          <span className="font-medium">{capacity.totalCapacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Boletos Digitales:</span>
                          <span className="font-medium">{capacity.digitalCapacity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Boletos Físicos:</span>
                          <span className="font-medium">{capacity.physicalCapacity}</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">Distribución</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Digital:</span>
                          <span>{Math.round((capacity.digitalCapacity / capacity.totalCapacity) * 100)}%</span>
                        </div>
                        <Progress value={(capacity.digitalCapacity / capacity.totalCapacity) * 100} />
                        <div className="flex justify-between text-sm">
                          <span>Físico:</span>
                          <span>{Math.round((capacity.physicalCapacity / capacity.totalCapacity) * 100)}%</span>
                        </div>
                        <Progress value={(capacity.physicalCapacity / capacity.totalCapacity) * 100} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="metrics" className="space-y-4">
          <IntegratedEventMetrics eventId={eventId} />
        </TabsContent>
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumen de Ventas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold">{stats?.totalSales || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Vendidos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">${(stats?.revenue || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Ingresos</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{stats?.checkIns || 0}</div>
                  <div className="text-sm text-muted-foreground">Check-ins</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
