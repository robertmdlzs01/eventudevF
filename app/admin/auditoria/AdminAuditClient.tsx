"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  Database,
  RefreshCw
} from 'lucide-react'
// import { format } from 'date-fns'
// import { es } from 'date-fns/locale'

interface AuditLog {
  id: number
  user_id: string
  user_name: string
  user_email: string
  action: string
  resource: string
  resource_id: string
  details: any
  ip_address: string
  user_agent: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'success' | 'failure' | 'warning'
  timestamp: string
}

interface AuditStats {
  totalLogs: Array<{ count: string }>
  logsByAction: Array<{ action: string; count: string }>
  logsByResource: Array<{ resource: string; count: string }>
  logsBySeverity: Array<{ severity: string; count: string }>
  logsByStatus: Array<{ status: string; count: string }>
  recentActivity: Array<{ date: string; count: string }>
}

function AdminAuditClient() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resource: '',
    severity: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    hasMore: false
  })

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        setLoading(false)
        return
      }

      const queryParams = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      })

      const response = await fetch(`${backendUrl}/api/audit/logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLogs(data.data.logs)
        setPagination(prev => ({
          ...prev,
          total: data.data.total,
          hasMore: data.data.hasMore
        }))
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      const response = await fetch(`${backendUrl}/api/audit/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setStats(data.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  useEffect(() => {
    fetchLogs()
    fetchStats()
  }, [filters, pagination.offset])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failure': return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'LOGIN': return <User className="h-4 w-4" />
      case 'LOGOUT': return <User className="h-4 w-4" />
      case 'CREATE': return <Database className="h-4 w-4" />
      case 'UPDATE': return <Database className="h-4 w-4" />
      case 'DELETE': return <Database className="h-4 w-4" />
      case 'READ': return <Eye className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const exportLogs = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        return
      }

      const queryParams = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''))
      )

      const response = await fetch(`${backendUrl}/api/audit/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting logs:', error)
    }
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalLogs[0]?.count || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Acciones Críticas</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.logsBySeverity.find(s => s.severity === 'critical')?.count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fallos</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.logsByStatus.find(s => s.status === 'failure')?.count || 0}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividad Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.recentActivity[0]?.count || 0}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por usuario, email..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-8"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Acción</label>
              <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las acciones" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las acciones</SelectItem>
                  <SelectItem value="LOGIN">Login</SelectItem>
                  <SelectItem value="LOGOUT">Logout</SelectItem>
                  <SelectItem value="CREATE">Crear</SelectItem>
                  <SelectItem value="UPDATE">Actualizar</SelectItem>
                  <SelectItem value="DELETE">Eliminar</SelectItem>
                  <SelectItem value="READ">Leer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Recurso</label>
              <Select value={filters.resource} onValueChange={(value) => setFilters(prev => ({ ...prev, resource: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los recursos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los recursos</SelectItem>
                  <SelectItem value="USER">Usuario</SelectItem>
                  <SelectItem value="EVENT">Evento</SelectItem>
                  <SelectItem value="TICKET">Ticket</SelectItem>
                  <SelectItem value="PAYMENT">Pago</SelectItem>
                  <SelectItem value="AUTH">Autenticación</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Severidad</label>
              <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas las severidades</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button onClick={fetchLogs} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
            <Button onClick={exportLogs} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Registro de Actividad</CardTitle>
          <CardDescription>
            {pagination.total} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Recurso</TableHead>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No se encontraron registros
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.user_name}</div>
                          <div className="text-sm text-muted-foreground">{log.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(log.action)}
                          <span>{log.action}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.resource}</div>
                          {log.resource_id && (
                            <div className="text-sm text-muted-foreground">ID: {log.resource_id}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getSeverityColor(log.severity)}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(log.status)}
                          <span className="capitalize">{log.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Detalles del Log</DialogTitle>
                              <DialogDescription>
                                Información completa de la actividad registrada
                              </DialogDescription>
                            </DialogHeader>
                            {selectedLog && (
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Usuario</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedLog.user_name} ({selectedLog.user_email})
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Acción</label>
                                    <p className="text-sm text-muted-foreground">{selectedLog.action}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Recurso</label>
                                    <p className="text-sm text-muted-foreground">
                                      {selectedLog.resource} {selectedLog.resource_id && `(ID: ${selectedLog.resource_id})`}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">IP</label>
                                    <p className="text-sm text-muted-foreground">{selectedLog.ip_address}</p>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Detalles</label>
                                  <ScrollArea className="h-32 w-full rounded border p-2">
                                    <pre className="text-xs">
                                      {JSON.stringify(selectedLog.details, null, 2)}
                                    </pre>
                                  </ScrollArea>
                                </div>

                                <div>
                                  <label className="text-sm font-medium">User Agent</label>
                                  <p className="text-xs text-muted-foreground break-all">
                                    {selectedLog.user_agent}
                                  </p>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} registros
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                disabled={pagination.offset === 0}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={!pagination.hasMore}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminAuditClient
