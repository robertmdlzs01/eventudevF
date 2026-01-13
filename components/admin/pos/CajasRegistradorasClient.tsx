"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { 
  CreditCard, 
  Plus, 
  Users, 
  Clock, 
  DollarSign, 
  Settings, 
  Trash2, 
  Play, 
  Square,
  UserPlus,
  RefreshCw
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface POSRegister {
  id: string
  name: string
  location: string
  status: 'active' | 'inactive' | 'not_configured'
  lastSession?: string
  todaySales: number
  assignedUsers: number
  isOpen: boolean
}

interface POSSession {
  id: string
  registerId: string
  userId: string
  userName: string
  startTime: string
  endTime?: string
  status: 'open' | 'closed'
  totalSales: number
}

export function CajasRegistradorasClient() {
  const [registers, setRegisters] = useState<POSRegister[]>([])
  const [sessions, setSessions] = useState<POSSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSessionDialog, setShowSessionDialog] = useState(false)
  const [selectedRegister, setSelectedRegister] = useState<string | null>(null)
  const [newRegister, setNewRegister] = useState({
    name: '',
    location: '',
    description: ''
  })
  const { toast } = useToast()

  // Cargar datos iniciales
  useEffect(() => {
    loadRegisters()
    loadSessions()
  }, [])

  const loadRegisters = async () => {
    setIsLoading(true)
    try {
      const response = await apiClient.getPOSRegisters() as any
      if (response.success && response.registers) {
        // Transformar datos del backend al formato del frontend
        const transformedRegisters: POSRegister[] = response.registers.map((reg: any) => ({
          id: reg.id.toString(),
          name: reg.name,
          location: reg.location || '',
          status: reg.is_active ? (reg.active_sessions > 0 ? 'active' : 'inactive') : 'inactive',
          todaySales: 0, // Se puede calcular desde las ventas del día
          assignedUsers: parseInt(reg.user_count) || 0,
          isOpen: (reg.active_sessions || 0) > 0
        }))
        setRegisters(transformedRegisters)
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudieron cargar las cajas registradoras",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error loading registers:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las cajas registradoras",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadSessions = async () => {
    try {
      const response = await apiClient.getActivePOSSessions() as any
      if (response.success && response.sessions) {
        // Transformar datos del backend al formato del frontend
        const transformedSessions: POSSession[] = response.sessions.map((session: any) => ({
          id: session.id.toString(),
          registerId: session.register_id.toString(),
          userId: session.user_id.toString(),
          userName: session.user_name || 'Usuario',
          startTime: session.opened_at,
          endTime: session.closed_at,
          status: session.is_active ? 'open' : 'closed',
          totalSales: parseFloat(session.total_sales) || 0
        }))
        setSessions(transformedSessions)
      }
    } catch (error) {
      console.error('Error loading sessions:', error)
    }
  }

  const createRegister = async () => {
    if (!newRegister.name) {
      toast({
        title: "Error",
        description: "El nombre de la caja es requerido",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await apiClient.createPOSRegister({
        name: newRegister.name,
        location: newRegister.location || undefined
      })

      if (response.success && response.register) {
        // Recargar la lista de cajas
        await loadRegisters()
        setNewRegister({ name: '', location: '', description: '' })
        setShowCreateDialog(false)
        
        toast({
          title: "Éxito",
          description: "Caja registradora creada exitosamente"
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo crear la caja registradora",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error creating register:', error)
      toast({
        title: "Error",
        description: "No se pudo crear la caja registradora",
        variant: "destructive"
      })
    }
  }

  const openSession = async (registerId: string) => {
    try {
      const response = await apiClient.openPOSSession(parseInt(registerId), 0)

      if (response.success && response.session) {
        // Recargar cajas y sesiones
        await loadRegisters()
        await loadSessions()
        
        toast({
          title: "Sesión Abierta",
          description: "La sesión de caja se ha abierto correctamente"
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo abrir la sesión",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error opening session:', error)
      toast({
        title: "Error",
        description: "No se pudo abrir la sesión",
        variant: "destructive"
      })
    }
  }

  const closeSession = async (registerId: string) => {
    try {
      // Buscar la sesión activa de esta caja
      const activeSession = sessions.find(s => s.registerId === registerId && s.status === 'open')
      
      if (!activeSession) {
        toast({
          title: "Error",
          description: "No hay una sesión activa para cerrar",
          variant: "destructive"
        })
        return
      }

      // Solicitar el monto de cierre (por ahora usamos 0, se puede mejorar con un diálogo)
      const closingAmount = 0
      const response = await apiClient.closePOSSession(parseInt(activeSession.id), closingAmount)

      if (response.success && response.session) {
        // Recargar cajas y sesiones
        await loadRegisters()
        await loadSessions()
        
        toast({
          title: "Sesión Cerrada",
          description: "La sesión de caja se ha cerrado correctamente"
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo cerrar la sesión",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error closing session:', error)
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión",
        variant: "destructive"
      })
    }
  }

  const deleteRegister = async (registerId: string) => {
    try {
      const response = await apiClient.deletePOSRegister(parseInt(registerId))

      if (response.success) {
        // Recargar la lista de cajas
        await loadRegisters()
        
        toast({
          title: "Caja Eliminada",
          description: "La caja registradora ha sido eliminada exitosamente"
        })
      } else {
        toast({
          title: "Error",
          description: response.error || "No se pudo eliminar la caja",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error deleting register:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la caja",
        variant: "destructive"
      })
    }
  }

  const getStatusBadge = (status: string, isOpen: boolean) => {
    if (isOpen) return <Badge variant="default">Abierta</Badge>
    if (status === 'not_configured') return <Badge variant="destructive">No Configurada</Badge>
    return <Badge variant="secondary">Inactiva</Badge>
  }

  const getStatusColor = (status: string, isOpen: boolean) => {
    if (isOpen) return 'text-green-600'
    if (status === 'not_configured') return 'text-red-600'
    return 'text-gray-600'
  }

  const totalRegisters = registers.length
  const activeRegisters = registers.filter(reg => reg.isOpen).length
  const totalUsers = registers.reduce((sum, reg) => sum + reg.assignedUsers, 0)
  const todaySales = registers.reduce((sum, reg) => sum + reg.todaySales, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Cargando cajas registradoras...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cajas Registradoras</h1>
          <p className="text-gray-600">Gestionar cajas y sesiones de venta</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Caja
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Caja</DialogTitle>
              <DialogDescription>
                Configura una nueva caja registradora en el sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre de la Caja</Label>
                <Input
                  id="name"
                  value={newRegister.name}
                  onChange={(e) => setNewRegister({ ...newRegister, name: e.target.value })}
                  placeholder="Ej: Caja Principal"
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={newRegister.location}
                  onChange={(e) => setNewRegister({ ...newRegister, location: e.target.value })}
                  placeholder="Ej: Sede Principal"
                />
              </div>
              <div>
                <Label htmlFor="description">Descripción (Opcional)</Label>
                <Textarea
                  id="description"
                  value={newRegister.description}
                  onChange={(e) => setNewRegister({ ...newRegister, description: e.target.value })}
                  placeholder="Información adicional sobre la caja..."
                />
              </div>
              <div className="flex gap-3">
                <Button onClick={createRegister} className="flex-1">
                  Crear Caja
                </Button>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cajas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegisters}</div>
            <p className="text-xs text-muted-foreground">
              Cajas registradas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cajas Activas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRegisters}</div>
            <p className="text-xs text-muted-foreground">
              Sesiones abiertas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuarios Asignados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Usuarios con acceso
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${todaySales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Total vendido
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Cajas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {registers.map((register) => (
          <Card key={register.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{register.name}</CardTitle>
                  <CardDescription>{register.location}</CardDescription>
                </div>
                {getStatusBadge(register.status, register.isOpen)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <p className={`font-medium ${getStatusColor(register.status, register.isOpen)}`}>
                    {register.isOpen ? 'Abierta' : register.status === 'not_configured' ? 'No Configurada' : 'Inactiva'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Última Sesión:</span>
                  <p className="font-medium">
                    {register.isOpen ? 'En curso' : 'Nunca'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Ventas Hoy:</span>
                  <p className="font-medium">${register.todaySales.toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Usuarios:</span>
                  <p className="font-medium">{register.assignedUsers} asignados</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                {register.isOpen ? (
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => closeSession(register.id)}
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => openSession(register.id)}
                    disabled={register.status === 'not_configured'}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Abrir Sesión
                  </Button>
                )}
                <Button size="sm" variant="outline" className="flex-1">
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm('¿Estás seguro de que deseas eliminar esta caja registradora?')) {
                      deleteRegister(register.id)
                    }
                  }}
                  disabled={register.isOpen}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Gestionar cajas y sesiones</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button asChild className="h-20 flex-col">
              <Link href="/admin/pos/venta">
                <CreditCard className="w-6 h-6 mb-2" />
                Nueva Venta
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => setShowSessionDialog(true)}
            >
              <Clock className="w-6 h-6 mb-2" />
              Ver Sesiones
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <UserPlus className="w-6 h-6 mb-2" />
              Asignar Usuarios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Sesiones */}
      <Dialog open={showSessionDialog} onOpenChange={(open) => {
        setShowSessionDialog(open)
        if (open) {
          loadSessions()
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Sesiones de Caja</DialogTitle>
            <DialogDescription>
              Gestionar sesiones activas y cerradas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No hay sesiones activas</p>
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => {
                  const register = registers.find(r => r.id === session.registerId)
                  return (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{session.userName}</p>
                        <p className="text-sm text-gray-500">
                          Caja: {register?.name || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                          Iniciada: {new Date(session.startTime).toLocaleString()}
                        </p>
                        {session.endTime && (
                          <p className="text-sm text-gray-500">
                            Cerrada: {new Date(session.endTime).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={session.status === 'open' ? 'default' : 'secondary'}>
                          {session.status === 'open' ? 'Abierta' : 'Cerrada'}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-2">
                          Ventas: ${session.totalSales.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
