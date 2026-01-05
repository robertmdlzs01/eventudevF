"use client"

import { useState, useEffect } from 'react'

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

function AdminAuditClientSimple() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [stats, setStats] = useState<AuditStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const fetchLogs = async (retryCount = 0) => {
    try {
      setLoading(true)
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3002'
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        console.error('No auth token found')
        setLoading(false)
        return
      }

      const response = await fetch(`${backendUrl}/api/audit/logs?limit=50&offset=0`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 429 && retryCount < 3) {
          // Retry después de un delay exponencial
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Rate limited, retrying in ${delay}ms...`)
          setTimeout(() => fetchLogs(retryCount + 1), delay)
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        setLogs(data.data.logs || [])
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async (retryCount = 0) => {
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
        if (response.status === 429 && retryCount < 3) {
          // Retry después de un delay exponencial
          const delay = Math.pow(2, retryCount) * 1000
          console.log(`Rate limited, retrying stats in ${delay}ms...`)
          setTimeout(() => fetchStats(retryCount + 1), delay)
          return
        }
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
    // Agregar un pequeño delay para evitar peticiones simultáneas
    const timer = setTimeout(() => {
      fetchLogs()
      fetchStats()
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

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
      case 'success': return '✅'
      case 'failure': return '❌'
      case 'warning': return '⚠️'
      default: return '⏰'
    }
  }

  return (
    <div className="space-y-6">
      {/* Estadísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Total de Logs</h3>
            <p className="text-2xl font-bold text-gray-900">{stats.totalLogs[0]?.count || 0}</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Acciones Críticas</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.logsBySeverity.find(s => s.severity === 'critical')?.count || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Fallos</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.logsByStatus.find(s => s.status === 'failure')?.count || 0}
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Actividad Hoy</h3>
            <p className="text-2xl font-bold text-gray-900">
              {stats.recentActivity[0]?.count || 0}
            </p>
          </div>
        </div>
      )}

      {/* Tabla de Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Registro de Actividad</h2>
          <p className="text-sm text-gray-500">
            {loading ? 'Cargando...' : `${logs.length} registros encontrados`}
          </p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recurso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Cargando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{log.user_name}</div>
                        <div className="text-sm text-gray-500">{log.user_email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{log.resource}</div>
                        {log.resource_id && (
                          <div className="text-sm text-gray-500">ID: {log.resource_id}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(log.severity)}`}>
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">{getStatusIcon(log.status)}</span>
                        <span className="text-sm text-gray-900 capitalize">{log.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detalles del Log Seleccionado */}
      {selectedLog && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detalles del Log</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Usuario</label>
              <p className="text-sm text-gray-900">
                {selectedLog.user_name} ({selectedLog.user_email})
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Acción</label>
              <p className="text-sm text-gray-900">{selectedLog.action}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Recurso</label>
              <p className="text-sm text-gray-900">
                {selectedLog.resource} {selectedLog.resource_id && `(ID: ${selectedLog.resource_id})`}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">IP</label>
              <p className="text-sm text-gray-900">{selectedLog.ip_address}</p>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">Detalles</label>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-auto">
              {JSON.stringify(selectedLog.details, null, 2)}
            </pre>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-500">User Agent</label>
            <p className="text-xs text-gray-600 break-all">
              {selectedLog.user_agent}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminAuditClientSimple
