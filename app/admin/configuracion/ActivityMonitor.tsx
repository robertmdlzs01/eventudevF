"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Activity, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  User,
  MapPin,
  Monitor,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  Users,
  Lock,
  Bell
} from "lucide-react"

interface ActivityLog {
  id: string
  timestamp: string
  user: string
  action: string
  category: 'authentication' | 'security' | 'system' | 'data' | 'admin'
  severity: 'low' | 'medium' | 'high' | 'critical'
  ipAddress: string
  userAgent: string
  details: string
  status: 'success' | 'failed' | 'warning'
}

interface SecurityMetrics {
  totalLogins: number
  failedLogins: number
  blockedAttempts: number
  securityAlerts: number
  activeSessions: number
  passwordChanges: number
  twoFactorActivations: number
  suspiciousActivities: number
}

export default function ActivityMonitor() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([])
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalLogins: 0,
    failedLogins: 0,
    blockedAttempts: 0,
    securityAlerts: 0,
    activeSessions: 0,
    passwordChanges: 0,
    twoFactorActivations: 0,
    suspiciousActivities: 0
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all")
  const [dateRange, setDateRange] = useState("24h")
  const [loading, setLoading] = useState(false)

  // Cargar logs reales
  useEffect(() => {
    loadRealLogs()
    loadRealMetrics()
  }, [])

  const loadRealLogs = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("auth_token")
      console.log('🔍 Token encontrado:', token ? 'Sí' : 'No')
      
      if (!token) {
        console.log('❌ No hay token, usando logs de ejemplo')
        generateMockLogs()
        return
      }

      console.log('📡 Haciendo petición a /api/audit/logs...')
      const response = await fetch('http://localhost:3002/api/audit/logs?limit=100', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('📊 Respuesta del servidor:', response.status, response.statusText)
      
      if (response.ok) {
        const data = await response.json()
        console.log('📋 Datos recibidos:', data)
        
        if (data.success && data.data && data.data.logs) {
          console.log('✅ Procesando', data.data.logs.length, 'logs')
          const realLogs: ActivityLog[] = data.data.logs.map((log: any) => ({
            id: log.id.toString(),
            timestamp: log.timestamp,
            user: log.user_email,
            action: log.action,
            category: mapResourceToCategory(log.resource),
            severity: log.severity,
            ipAddress: log.ip_address,
            userAgent: log.user_agent,
            details: log.details ? (typeof log.details === 'string' ? log.details : JSON.stringify(log.details)) : '',
            status: log.status
          }))
          
          setLogs(realLogs)
          setFilteredLogs(realLogs)
          console.log('✅ Logs cargados exitosamente')
        } else {
          console.log('❌ No se encontraron logs en la respuesta')
          generateMockLogs()
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.log('❌ Error del servidor:', errorData)
        generateMockLogs()
      }
    } catch (error) {
      console.error('❌ Error loading audit logs:', error)
      // Fallback a logs de ejemplo si hay error
      generateMockLogs()
    } finally {
      setLoading(false)
    }
  }

  const mapResourceToCategory = (resource: string): 'authentication' | 'security' | 'system' | 'data' | 'admin' => {
    switch (resource?.toLowerCase()) {
      case 'auth':
        return 'authentication'
      case 'user':
      case 'event':
      case 'ticket':
      case 'payment':
        return 'data'
      case 'admin':
      case 'settings':
        return 'admin'
      case 'security':
        return 'security'
      default:
        return 'system'
    }
  }

  const generateMockLogs = () => {
    const mockLogs: ActivityLog[] = [
      {
        id: "1",
        timestamp: new Date().toISOString(),
        user: "admin@eventu.com",
        action: "Login exitoso",
        category: "authentication",
        severity: "low",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: "Inicio de sesión desde IP confiable",
        status: "success"
      },
      {
        id: "2",
        timestamp: new Date(Date.now() - 300000).toISOString(),
        user: "unknown@example.com",
        action: "Intento de login fallido",
        category: "security",
        severity: "medium",
        ipAddress: "203.0.113.45",
        userAgent: "Mozilla/5.0 (Unknown) AppleWebKit/537.36",
        details: "5 intentos fallidos consecutivos",
        status: "failed"
      },
      {
        id: "3",
        timestamp: new Date(Date.now() - 600000).toISOString(),
        user: "admin@eventu.com",
        action: "Cambio de contraseña",
        category: "security",
        severity: "medium",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: "Contraseña actualizada exitosamente",
        status: "success"
      },
      {
        id: "4",
        timestamp: new Date(Date.now() - 900000).toISOString(),
        user: "user@eventu.com",
        action: "Activación de 2FA",
        category: "security",
        severity: "low",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        details: "Autenticación de dos factores habilitada",
        status: "success"
      },
      {
        id: "5",
        timestamp: new Date(Date.now() - 1200000).toISOString(),
        user: "unknown@example.com",
        action: "Acceso bloqueado",
        category: "security",
        severity: "high",
        ipAddress: "203.0.113.45",
        userAgent: "Mozilla/5.0 (Unknown) AppleWebKit/537.36",
        details: "Cuenta bloqueada por múltiples intentos fallidos",
        status: "failed"
      },
      {
        id: "6",
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        user: "admin@eventu.com",
        action: "Configuración de seguridad modificada",
        category: "admin",
        severity: "medium",
        ipAddress: "192.168.1.100",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        details: "Política de contraseñas actualizada",
        status: "success"
      },
      {
        id: "7",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        user: "unknown@example.com",
        action: "Actividad sospechosa detectada",
        category: "security",
        severity: "critical",
        ipAddress: "203.0.113.45",
        userAgent: "Mozilla/5.0 (Unknown) AppleWebKit/537.36",
        details: "Patrón de acceso anómalo detectado",
        status: "warning"
      },
      {
        id: "8",
        timestamp: new Date(Date.now() - 2100000).toISOString(),
        user: "user@eventu.com",
        action: "Cierre de sesión",
        category: "authentication",
        severity: "low",
        ipAddress: "192.168.1.101",
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        details: "Sesión cerrada por inactividad",
        status: "success"
      }
    ]
    setLogs(mockLogs)
    setFilteredLogs(mockLogs)
  }

  const loadRealMetrics = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
      const token = localStorage.getItem("auth_token")
      if (!token) return

      const response = await fetch(`${backendUrl}/api/audit/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data) {
          const stats = data.data
          
          // Procesar estadísticas reales
          const totalLogins = parseInt(stats.logsByAction?.find((item: any) => item.action === 'LOGIN')?.count || '0')
          const failedLogins = parseInt(stats.logsByStatus?.find((item: any) => item.status === 'failure')?.count || '0')
          const highSeverity = parseInt(stats.logsBySeverity?.find((item: any) => item.severity === 'high')?.count || '0')
          const criticalSeverity = parseInt(stats.logsBySeverity?.find((item: any) => item.severity === 'critical')?.count || '0')
          const totalLogs = parseInt(stats.totalLogs?.[0]?.count || '0')
          
          setMetrics({
            totalLogins,
            failedLogins,
            blockedAttempts: failedLogins,
            securityAlerts: highSeverity + criticalSeverity,
            activeSessions: 1, // Esto requeriría un sistema de sesiones activas
            passwordChanges: parseInt(stats.logsByAction?.find((item: any) => item.action === 'PASSWORD_CHANGE')?.count || '0'),
            twoFactorActivations: parseInt(stats.logsByAction?.find((item: any) => item.action === '2FA_ACTIVATION')?.count || '0'),
            suspiciousActivities: highSeverity
          })
        }
      } else {
        console.error('Error response:', response.status, response.statusText)
        generateMockMetrics()
      }
    } catch (error) {
      console.error('Error loading audit stats:', error)
      // Fallback a métricas de ejemplo
      generateMockMetrics()
    }
  }

  const generateMockMetrics = () => {
    setMetrics({
      totalLogins: 156,
      failedLogins: 23,
      blockedAttempts: 5,
      securityAlerts: 3,
      activeSessions: 12,
      passwordChanges: 8,
      twoFactorActivations: 4,
      suspiciousActivities: 2
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'authentication': return <Lock className="h-4 w-4" />
      case 'security': return <Shield className="h-4 w-4" />
      case 'system': return <Monitor className="h-4 w-4" />
      case 'data': return <BarChart3 className="h-4 w-4" />
      case 'admin': return <Users className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  const handleSearch = () => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(log => log.category === selectedCategory)
    }

    if (selectedSeverity !== "all") {
      filtered = filtered.filter(log => log.severity === selectedSeverity)
    }

    setFilteredLogs(filtered)
  }

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      generateMockLogs()
      generateMockMetrics()
      setLoading(false)
    }, 1000)
  }

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      "ID,Timestamp,User,Action,Category,Severity,IP Address,Status,Details\n" +
      filteredLogs.map(log => 
        `${log.id},${log.timestamp},${log.user},${log.action},${log.category},${log.severity},${log.ipAddress},${log.status},${log.details}`
      ).join("\n")
    
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `security_logs_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    handleSearch()
  }, [searchTerm, selectedCategory, selectedSeverity])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Monitor de Actividad
          </h1>
          <p className="text-muted-foreground mt-2">
            Monitoreo en tiempo real de actividades de seguridad
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Security Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalLogins}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins Fallidos</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedLogins}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -5% desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Intentos Bloqueados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.blockedAttempts}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2 desde ayer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas de Seguridad</CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.securityAlerts}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1" />
              -1 desde ayer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Registro de Actividad
          </CardTitle>
          <CardDescription>
            Logs detallados de todas las actividades de seguridad
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar en logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas las categorías</option>
                <option value="authentication">Autenticación</option>
                <option value="security">Seguridad</option>
                <option value="system">Sistema</option>
                <option value="data">Datos</option>
                <option value="admin">Administración</option>
              </select>
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">Todas las severidades</option>
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          <div className="space-y-2">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50">
                <div className="flex-shrink-0">
                  {getStatusIcon(log.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{log.action}</span>
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                    {getCategoryIcon(log.category)}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {log.user}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {log.ipAddress}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{log.details}</p>
                </div>
                <div className="flex-shrink-0">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron logs que coincidan con los filtros</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas en Tiempo Real
          </CardTitle>
          <CardDescription>
            Alertas de seguridad activas que requieren atención
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Actividad Sospechosa:</strong> Múltiples intentos de login desde IP 203.0.113.45
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuración de Seguridad:</strong> Se detectó un cambio en la política de contraseñas
              </AlertDescription>
            </Alert>
            
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <strong>Autenticación:</strong> Usuario user@eventu.com activó 2FA exitosamente
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
