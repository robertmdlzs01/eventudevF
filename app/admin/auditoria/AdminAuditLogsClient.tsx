"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { FileText, Search, Filter, Download, Eye, Clock, User, Activity, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { getAdminAuditLogs } from "@/app/admin/actions"

interface AuditLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  action: string
  resource: string
  resourceId?: string
  details: any
  ipAddress: string
  userAgent: string
  timestamp: string
  severity: "low" | "medium" | "high" | "critical"
  status: "success" | "failure" | "warning"
}

const mockAuditLogs: AuditLog[] = [
  {
    id: "1",
    userId: "admin1",
    userName: "Admin Principal",
    userEmail: "admin@eventu.co",
    action: "LOGIN",
    resource: "auth",
    details: { method: "email", success: true },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-08-25T10:30:00Z",
    severity: "low",
    status: "success"
  },
  {
    id: "2",
    userId: "admin1",
    userName: "Admin Principal",
    userEmail: "admin@eventu.co",
    action: "CREATE_EVENT",
    resource: "events",
    resourceId: "event123",
    details: { eventTitle: "Conferencia Tech 2024", eventId: "event123" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-08-25T10:35:00Z",
    severity: "medium",
    status: "success"
  },
  {
    id: "3",
    userId: "user1",
    userName: "Usuario Test",
    userEmail: "user@test.com",
    action: "FAILED_LOGIN",
    resource: "auth",
    details: { method: "email", reason: "Invalid password" },
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    timestamp: "2024-08-25T10:40:00Z",
    severity: "high",
    status: "failure"
  },
  {
    id: "4",
    userId: "admin1",
    userName: "Admin Principal",
    userEmail: "admin@eventu.co",
    action: "DELETE_USER",
    resource: "users",
    resourceId: "user456",
    details: { deletedUserId: "user456", reason: "Violation of terms" },
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: "2024-08-25T10:45:00Z",
    severity: "critical",
    status: "success"
  }
]

export default function AdminAuditLogsClient() {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("all")
  const [showLogDetail, setShowLogDetail] = useState<AuditLog | null>(null)
  const { toast } = useToast()

  const fetchAuditLogs = async (searchParams?: { search?: string, severity?: string, status?: string, action?: string }) => {
    setLoading(true)
    try {
      const fetchedLogs = await getAdminAuditLogs(searchParams)
      if (fetchedLogs?.logs) {
        setAuditLogs(fetchedLogs.logs)
        setFilteredLogs(fetchedLogs.logs)
      }
    } catch (error: any) {
      console.error("Error fetching audit logs:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los logs de auditoría.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Función para buscar logs en el backend
  const searchLogs = async () => {
    const searchParams: { search?: string, severity?: string, status?: string, action?: string } = {}
    
    if (searchTerm) {
      searchParams.search = searchTerm
    }
    
    if (severityFilter !== "all") {
      searchParams.severity = severityFilter
    }
    
    if (statusFilter !== "all") {
      searchParams.status = statusFilter
    }
    
    if (actionFilter !== "all") {
      searchParams.action = actionFilter
    }
    
    await fetchAuditLogs(searchParams)
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [])

  // Debounce para evitar demasiadas búsquedas
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchLogs()
    }, 500) // Esperar 500ms después del último cambio

    return () => clearTimeout(timeoutId)
  }, [searchTerm, severityFilter, statusFilter, actionFilter])

  const handleExportLogs = () => {
    try {
      const csvContent = [
        "ID,Usuario,Email,Acción,Recurso,IP,Severidad,Estado,Fecha",
        ...filteredLogs.map(log => 
          `${log.id},${log.userName},${log.userEmail},${log.action},${log.resource},${log.ipAddress},${log.severity},${log.status},${log.timestamp}`
        )
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)

      toast({
        title: "Logs exportados",
        description: "Los logs de auditoría han sido exportados exitosamente",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al exportar los logs",
        variant: "destructive"
      })
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case "medium":
        return <Activity className="h-4 w-4 text-yellow-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants = {
      low: "default",
      medium: "secondary",
      high: "outline",
      critical: "destructive"
    } as const

    const labels = {
      low: "Baja",
      medium: "Media",
      high: "Alta",
      critical: "Crítica"
    }

    return <Badge variant={variants[severity as keyof typeof variants]}>{labels[severity as keyof typeof labels]}</Badge>
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      failure: "destructive",
      warning: "secondary"
    } as const

    const labels = {
      success: "Éxito",
      failure: "Fallido",
      warning: "Advertencia"
    }

    return <Badge variant={variants[status as keyof typeof variants]}>{labels[status as keyof typeof labels]}</Badge>
  }

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      LOGIN: "Inicio de sesión",
      LOGOUT: "Cierre de sesión",
      CREATE_EVENT: "Crear evento",
      UPDATE_EVENT: "Actualizar evento",
      DELETE_EVENT: "Eliminar evento",
      CREATE_USER: "Crear usuario",
      UPDATE_USER: "Actualizar usuario",
      DELETE_USER: "Eliminar usuario",
      FAILED_LOGIN: "Inicio de sesión fallido",
      ACCESS_DENIED: "Acceso denegado",
      EXPORT_DATA: "Exportar datos",
      BACKUP_CREATED: "Backup creado"
    }
    return labels[action] || action
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Auditoría de Logs</h1>
          <p className="text-gray-600">Registro completo de todas las actividades del sistema</p>
        </div>
        <Button variant="outline" onClick={handleExportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Exportar Logs
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Severidad</Label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                  <SelectItem value="failure">Fallido</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Acción</Label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="LOGIN">Inicio de sesión</SelectItem>
                  <SelectItem value="CREATE_EVENT">Crear evento</SelectItem>
                  <SelectItem value="DELETE_USER">Eliminar usuario</SelectItem>
                  <SelectItem value="FAILED_LOGIN">Login fallido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de logs */}
      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getSeverityIcon(log.severity)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{getActionLabel(log.action)}</span>
                      {getSeverityBadge(log.severity)}
                      {getStatusBadge(log.status)}
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {log.userName} ({log.userEmail})
                      </span>
                      <span className="flex items-center">
                        <FileText className="h-3 w-3 mr-1" />
                        {log.resource} {log.resourceId && `- ${log.resourceId}`}
                      </span>
                      <span className="flex items-center">
                        <Activity className="h-3 w-3 mr-1" />
                        {log.ipAddress}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(log.timestamp).toLocaleString()}
                  </Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowLogDetail(log)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Detalles del Log</DialogTitle>
                      </DialogHeader>
                      {showLogDetail && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium">Usuario</Label>
                              <p className="text-sm text-gray-600">{showLogDetail.userName}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Email</Label>
                              <p className="text-sm text-gray-600">{showLogDetail.userEmail}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Acción</Label>
                              <p className="text-sm text-gray-600">{getActionLabel(showLogDetail.action)}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Recurso</Label>
                              <p className="text-sm text-gray-600">{showLogDetail.resource}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">IP Address</Label>
                              <p className="text-sm text-gray-600">{showLogDetail.ipAddress}</p>
                            </div>
                            <div>
                              <Label className="text-sm font-medium">Fecha</Label>
                              <p className="text-sm text-gray-600">{new Date(showLogDetail.timestamp).toLocaleString()}</p>
                            </div>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">Detalles</Label>
                            <pre className="text-sm bg-gray-100 p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(showLogDetail.details, null, 2)}
                            </pre>
                          </div>
                          <div>
                            <Label className="text-sm font-medium">User Agent</Label>
                            <p className="text-sm text-gray-600 break-all">{showLogDetail.userAgent}</p>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLogs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron logs</h3>
            <p className="text-gray-600">Ajusta los filtros para ver más resultados</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
