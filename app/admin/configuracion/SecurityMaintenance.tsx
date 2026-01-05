"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { 
  Settings, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  RefreshCw,
  Download,
  Upload,
  RotateCcw,
  Save,
  Database,
  Lock,
  Bell,
  Calendar,
  TrendingUp,
  TrendingDown,
  Wrench,
  Zap,
  History,
  FileText
} from "lucide-react"

interface SecurityUpdate {
  id: string
  title: string
  description: string
  version: string
  releaseDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'available' | 'installed' | 'pending'
  type: 'security' | 'feature' | 'bugfix' | 'maintenance'
  changelog: string[]
}

interface MaintenanceTask {
  id: string
  title: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  lastRun: string
  nextRun: string
  status: 'completed' | 'pending' | 'failed' | 'running'
  duration: number // minutos
  category: 'backup' | 'cleanup' | 'optimization' | 'security'
}

interface SystemHealth {
  overall: number
  security: number
  performance: number
  storage: number
  database: number
  lastCheck: string
  issues: string[]
}

export default function SecurityMaintenance() {
  const [updates, setUpdates] = useState<SecurityUpdate[]>([])
  const [tasks, setTasks] = useState<MaintenanceTask[]>([])
  const [health, setHealth] = useState<SystemHealth>({
    overall: 85,
    security: 92,
    performance: 78,
    storage: 65,
    database: 88,
    lastCheck: new Date().toISOString(),
    issues: []
  })
  const [loading, setLoading] = useState(false)
  const [selectedUpdate, setSelectedUpdate] = useState<string | null>(null)

  useEffect(() => {
    generateMockData()
  }, [])

  const generateMockData = () => {
    // Generar actualizaciones de ejemplo
    const mockUpdates: SecurityUpdate[] = [
      {
        id: "1",
        title: "Parche de Seguridad Crítico",
        description: "Corrección de vulnerabilidad de autenticación",
        version: "2.1.4",
        releaseDate: "2024-01-15",
        priority: "critical",
        status: "available",
        type: "security",
        changelog: [
          "Corregida vulnerabilidad de bypass de autenticación",
          "Mejorada validación de tokens JWT",
          "Actualizada política de contraseñas"
        ]
      },
      {
        id: "2",
        title: "Mejoras en 2FA",
        description: "Nuevas opciones de autenticación de dos factores",
        version: "2.1.3",
        releaseDate: "2024-01-10",
        priority: "high",
        status: "installed",
        type: "feature",
        changelog: [
          "Soporte para aplicaciones de autenticación",
          "Códigos de respaldo mejorados",
          "Interfaz de configuración actualizada"
        ]
      },
      {
        id: "3",
        title: "Optimización de Rendimiento",
        description: "Mejoras en el rendimiento del sistema",
        version: "2.1.2",
        releaseDate: "2024-01-05",
        priority: "medium",
        status: "available",
        type: "maintenance",
        changelog: [
          "Optimizada consulta de logs de actividad",
          "Mejorado tiempo de respuesta de la API",
          "Reducido uso de memoria en sesiones"
        ]
      }
    ]

    // Generar tareas de mantenimiento
    const mockTasks: MaintenanceTask[] = [
      {
        id: "1",
        title: "Backup de Configuraciones",
        description: "Crear copia de seguridad de configuraciones de seguridad",
        frequency: "daily",
        lastRun: "2024-01-15T06:00:00Z",
        nextRun: "2024-01-16T06:00:00Z",
        status: "completed",
        duration: 5,
        category: "backup"
      },
      {
        id: "2",
        title: "Limpieza de Logs Antiguos",
        description: "Eliminar logs de actividad con más de 365 días",
        frequency: "weekly",
        lastRun: "2024-01-14T02:00:00Z",
        nextRun: "2024-01-21T02:00:00Z",
        status: "completed",
        duration: 15,
        category: "cleanup"
      },
      {
        id: "3",
        title: "Verificación de Integridad",
        description: "Verificar integridad de archivos de configuración",
        frequency: "weekly",
        lastRun: "2024-01-13T04:00:00Z",
        nextRun: "2024-01-20T04:00:00Z",
        status: "completed",
        duration: 10,
        category: "security"
      },
      {
        id: "4",
        title: "Optimización de Base de Datos",
        description: "Optimizar índices y limpiar datos temporales",
        frequency: "monthly",
        lastRun: "2024-01-01T03:00:00Z",
        nextRun: "2024-02-01T03:00:00Z",
        status: "pending",
        duration: 45,
        category: "optimization"
      }
    ]

    setUpdates(mockUpdates)
    setTasks(mockTasks)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleInstallUpdate = (updateId: string) => {
    setLoading(true)
    setTimeout(() => {
      setUpdates(updates.map(update => 
        update.id === updateId 
          ? { ...update, status: 'installed' }
          : update
      ))
      setLoading(false)
    }, 2000)
  }

  const handleRunTask = (taskId: string) => {
    setLoading(true)
    setTimeout(() => {
      setTasks(tasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed', lastRun: new Date().toISOString() }
          : task
      ))
      setLoading(false)
    }, 3000)
  }

  const handleBackupSettings = () => {
    setLoading(true)
    setTimeout(() => {
      const backupData = {
        timestamp: new Date().toISOString(),
        version: "2.1.4",
        settings: {
          // Configuraciones actuales
        }
      }
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `security_settings_backup_${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      setLoading(false)
    }, 1000)
  }

  const handleRestoreSettings = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setLoading(true)
        setTimeout(() => {
          setLoading(false)
          // Aquí se procesaría la restauración
        }, 2000)
      }
    }
    input.click()
  }

  const pendingUpdates = updates.filter(u => u.status === 'available')
  const criticalUpdates = pendingUpdates.filter(u => u.priority === 'critical')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Wrench className="h-8 w-8" />
            Mantenimiento de Seguridad
          </h1>
          <p className="text-muted-foreground mt-2">
            Gestión de actualizaciones y mantenimiento del sistema de seguridad
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleBackupSettings} disabled={loading}>
            <Database className="h-4 w-4 mr-2" />
            Backup
          </Button>
          <Button variant="outline" onClick={handleRestoreSettings} disabled={loading}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restaurar
          </Button>
        </div>
      </div>

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Estado del Sistema
          </CardTitle>
          <CardDescription>
            Evaluación general del estado de seguridad y rendimiento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(health.overall)}`}>
                {health.overall}%
              </div>
              <p className="text-sm text-muted-foreground">General</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(health.security)}`}>
                {health.security}%
              </div>
              <p className="text-sm text-muted-foreground">Seguridad</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(health.performance)}`}>
                {health.performance}%
              </div>
              <p className="text-sm text-muted-foreground">Rendimiento</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(health.storage)}`}>
                {health.storage}%
              </div>
              <p className="text-sm text-muted-foreground">Almacenamiento</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthColor(health.database)}`}>
                {health.database}%
              </div>
              <p className="text-sm text-muted-foreground">Base de Datos</p>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Salud General</span>
              <span className="text-sm text-muted-foreground">{health.overall}%</span>
            </div>
            <Progress value={health.overall} className="w-full" />
          </div>
        </CardContent>
      </Card>

      {/* Critical Updates Alert */}
      {criticalUpdates.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Atención!</strong> Hay {criticalUpdates.length} actualización(es) crítica(s) pendiente(s) de instalación.
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2"
              onClick={() => setSelectedUpdate(criticalUpdates[0].id)}
            >
              Ver Detalles
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Updates and Maintenance Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Security Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Actualizaciones de Seguridad
            </CardTitle>
            <CardDescription>
              Actualizaciones disponibles para el sistema de seguridad
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {updates.map((update) => (
                <div key={update.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{update.title}</h4>
                      <p className="text-sm text-muted-foreground">{update.description}</p>
                    </div>
                    <Badge className={getPriorityColor(update.priority)}>
                      {update.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span>v{update.version}</span>
                    <span>•</span>
                    <span>{new Date(update.releaseDate).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="capitalize">{update.type}</span>
                  </div>

                  {update.status === 'available' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleInstallUpdate(update.id)}
                        disabled={loading}
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        Instalar
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedUpdate(update.id)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Detalles
                      </Button>
                    </div>
                  )}

                  {update.status === 'installed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Instalado</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Tareas de Mantenimiento
            </CardTitle>
            <CardDescription>
              Tareas programadas para el mantenimiento del sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-medium">{task.title}</h4>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <Badge className={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="capitalize">{task.frequency}</span>
                    <span>•</span>
                    <span>{task.duration} min</span>
                    <span>•</span>
                    <span className="capitalize">{task.category}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <span>Última ejecución: {new Date(task.lastRun).toLocaleDateString()}</span>
                    <span>Próxima: {new Date(task.nextRun).toLocaleDateString()}</span>
                  </div>

                  {task.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleRunTask(task.id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Ejecutar Ahora
                    </Button>
                  )}

                  {task.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm">Completado</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Details Modal */}
      {selectedUpdate && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalles de Actualización
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const update = updates.find(u => u.id === selectedUpdate)
              if (!update) return null

              return (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{update.title}</h3>
                    <p className="text-muted-foreground">{update.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Versión:</span> {update.version}
                    </div>
                    <div>
                      <span className="font-medium">Fecha de Lanzamiento:</span> {new Date(update.releaseDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Prioridad:</span> 
                      <Badge className={`ml-2 ${getPriorityColor(update.priority)}`}>
                        {update.priority}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Tipo:</span> {update.type}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Cambios Incluidos:</h4>
                    <ul className="space-y-1 text-sm">
                      {update.changelog.map((change, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleInstallUpdate(update.id)}
                      disabled={loading || update.status === 'installed'}
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {update.status === 'installed' ? 'Instalado' : 'Instalar Actualización'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedUpdate(null)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}

      {/* Maintenance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Mantenimiento
          </CardTitle>
          <CardDescription>
            Registro de actividades de mantenimiento realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { date: "2024-01-15", action: "Backup de configuraciones completado", status: "success" },
              { date: "2024-01-14", action: "Limpieza de logs antiguos", status: "success" },
              { date: "2024-01-13", action: "Verificación de integridad", status: "success" },
              { date: "2024-01-12", action: "Actualización de seguridad v2.1.3", status: "success" },
              { date: "2024-01-11", action: "Optimización de base de datos", status: "success" }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.date}</p>
                </div>
                <Badge variant="outline" className="text-green-600">
                  Completado
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
