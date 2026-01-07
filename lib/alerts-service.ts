// Sistema de Alertas basado en WordPress
// Gestión completa de alertas y notificaciones del sistema POS

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface Alert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success' | 'critical'
  title: string
  message: string
  category: 'system' | 'security' | 'business' | 'technical' | 'financial'
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed'
  source: string
  createdAt: Date
  updatedAt: Date
  acknowledgedAt?: Date
  acknowledgedBy?: string
  resolvedAt?: Date
  resolvedBy?: string
  metadata?: Record<string, any>
  actions?: AlertAction[]
}

export interface AlertAction {
  id: string
  label: string
  type: 'button' | 'link' | 'form'
  action: string
  style: 'primary' | 'secondary' | 'danger' | 'success'
  requiresConfirmation?: boolean
  confirmationMessage?: string
}

export interface AlertRule {
  id: string
  name: string
  description: string
  category: string
  conditions: AlertCondition[]
  actions: AlertAction[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface AlertCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'starts_with' | 'ends_with'
  value: any
  logicalOperator?: 'AND' | 'OR'
}

export interface AlertStats {
  total: number
  active: number
  acknowledged: number
  resolved: number
  dismissed: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  recent: Alert[]
}

export interface AlertFilter {
  type?: string
  category?: string
  priority?: string
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
  source?: string
}

class AlertsService {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    // Obtener token de localStorage
    let token: string | null = null
    if (typeof window !== 'undefined') {
      token = localStorage.getItem('auth_token')
    }

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error en request:', error)
      throw error
    }
  }

  // Obtener todas las alertas
  async getAlerts(filter?: AlertFilter): Promise<Alert[]> {
    try {
      const queryParams = new URLSearchParams()
      if (filter) {
        Object.entries(filter).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            if (key === 'dateRange' && typeof value === 'object') {
              queryParams.append('startDate', value.start.toISOString())
              queryParams.append('endDate', value.end.toISOString())
            } else {
              queryParams.append(key, String(value))
            }
          }
        })
      }
      const queryString = queryParams.toString()
      const endpoint = `/api/alerts${queryString ? `?${queryString}` : ''}`
      const response = await this.request<Alert[]>(endpoint)
      if (response && 'data' in response && Array.isArray(response.data)) {
        return response.data
      }
      return []
    } catch (error) {
      console.error('Error obteniendo alertas:', error)
      throw error
    }
  }

  // Obtener alerta por ID
  async getAlertById(id: string): Promise<Alert> {
    try {
      const response = await this.request<Alert>(`/api/alerts/${id}`)
      if (!response.data) {
        throw new Error('Alerta no encontrada')
      }
      return response.data
    } catch (error) {
      console.error('Error obteniendo alerta:', error)
      throw error
    }
  }

  // Crear nueva alerta
  async createAlert(alert: Omit<Alert, 'id' | 'createdAt' | 'updatedAt'>): Promise<Alert> {
    try {
      const response = await this.request<Alert>('/api/alerts', {
        method: 'POST',
        body: JSON.stringify(alert),
      })
      if (!response.data) {
        throw new Error('Error al crear alerta')
      }
      return response.data
    } catch (error) {
      console.error('Error creando alerta:', error)
      throw error
    }
  }

  // Actualizar alerta
  async updateAlert(id: string, updates: Partial<Alert>): Promise<Alert> {
    try {
      const response = await this.request<Alert>(`/api/alerts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      if (!response.data) {
        throw new Error('Error al actualizar alerta')
      }
      return response.data
    } catch (error) {
      console.error('Error actualizando alerta:', error)
      throw error
    }
  }

  // Reconocer alerta
  async acknowledgeAlert(id: string, acknowledgedBy: string): Promise<Alert> {
    try {
      const response = await this.request<Alert>(`/api/alerts/${id}/acknowledge`, {
        method: 'POST',
        body: JSON.stringify({
          acknowledgedBy,
          acknowledgedAt: new Date()
        }),
      })
      if (!response.data) {
        throw new Error('Error al reconocer alerta')
      }
      return response.data
    } catch (error) {
      console.error('Error reconociendo alerta:', error)
      throw error
    }
  }

  // Resolver alerta
  async resolveAlert(id: string, resolvedBy: string, resolution?: string): Promise<Alert> {
    try {
      const response = await this.request<Alert>(`/api/alerts/${id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          resolvedBy,
          resolvedAt: new Date(),
          resolution
        }),
      })
      if (!response.data) {
        throw new Error('Error al resolver alerta')
      }
      return response.data
    } catch (error) {
      console.error('Error resolviendo alerta:', error)
      throw error
    }
  }

  // Descartar alerta
  async dismissAlert(id: string, dismissedBy: string): Promise<Alert> {
    try {
      const response = await this.request<Alert>(`/api/alerts/${id}/dismiss`, {
        method: 'POST',
        body: JSON.stringify({
          dismissedBy,
          dismissedAt: new Date()
        }),
      })
      if (!response.data) {
        throw new Error('Error al descartar alerta')
      }
      return response.data
    } catch (error) {
      console.error('Error descartando alerta:', error)
      throw error
    }
  }

  // Eliminar alerta
  async deleteAlert(id: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/alerts/${id}`, {
        method: 'DELETE',
      })
      return response.success
    } catch (error) {
      console.error('Error eliminando alerta:', error)
      throw error
    }
  }

  // Obtener estadísticas de alertas
  async getAlertStats(): Promise<AlertStats> {
    try {
      const response = await this.request<AlertStats>('/api/alerts/stats')
      if (!response.data) {
        throw new Error('Error al obtener estadísticas')
      }
      return response.data
    } catch (error) {
      console.error('Error obteniendo estadísticas de alertas:', error)
      throw error
    }
  }

  // Obtener reglas de alertas
  async getAlertRules(): Promise<AlertRule[]> {
    try {
      const response = await this.request<AlertRule[]>('/api/alerts/rules')
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo reglas de alertas:', error)
      throw error
    }
  }

  // Crear regla de alerta
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule> {
    try {
      const response = await this.request<AlertRule>('/api/alerts/rules', {
        method: 'POST',
        body: JSON.stringify(rule),
      })
      return response.data!
    } catch (error) {
      console.error('Error creando regla de alerta:', error)
      throw error
    }
  }

  // Actualizar regla de alerta
  async updateAlertRule(id: string, updates: Partial<AlertRule>): Promise<AlertRule> {
    try {
      const response = await this.request<AlertRule>(`/api/alerts/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      return response.data!
    } catch (error) {
      console.error('Error actualizando regla de alerta:', error)
      throw error
    }
  }

  // Eliminar regla de alerta
  async deleteAlertRule(id: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/alerts/rules/${id}`, {
        method: 'DELETE',
      })
      return response.success
    } catch (error) {
      console.error('Error eliminando regla de alerta:', error)
      throw error
    }
  }

  // Activar/desactivar regla
  async toggleAlertRule(id: string, isActive: boolean): Promise<AlertRule> {
    try {
      const response = await this.request<AlertRule>(`/api/alerts/rules/${id}/toggle`, {
        method: 'PUT',
        body: JSON.stringify({ isActive }),
      })
      return response.data!
    } catch (error) {
      console.error('Error cambiando estado de regla:', error)
      throw error
    }
  }

  // Ejecutar acción de alerta
  async executeAlertAction(alertId: string, actionId: string, data?: any): Promise<any> {
    try {
      const response = await this.request<any>(`/api/alerts/${alertId}/actions/${actionId}`, {
        method: 'POST',
        body: JSON.stringify(data),
      })
      return response.data
    } catch (error) {
      console.error('Error ejecutando acción de alerta:', error)
      throw error
    }
  }

  // Obtener alertas en tiempo real
  async getRealTimeAlerts(): Promise<Alert[]> {
    try {
      const response = await this.request<Alert[]>('/api/alerts/realtime')
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo alertas en tiempo real:', error)
      throw error
    }
  }

  // Suscribirse a alertas en tiempo real
  subscribeToAlerts(callback: (alert: Alert) => void): () => void {
    // Implementar WebSocket o Server-Sent Events
    const eventSource = new EventSource('/api/alerts/stream')
    
    eventSource.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data)
        callback(alert)
      } catch (error) {
        console.error('Error parseando alerta en tiempo real:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('Error en conexión de alertas en tiempo real:', error)
    }
    
    return () => eventSource.close()
  }

  // Obtener historial de alertas
  async getAlertHistory(alertId: string): Promise<Array<{
    id: string
    action: string
    performedBy: string
    performedAt: Date
    details: any
  }>> {
    try {
      type AlertHistoryItem = {
        id: string
        action: string
        performedBy: string
        performedAt: Date
        details: any
      }
      const response = await this.request<AlertHistoryItem[]>(`/api/alerts/${alertId}/history`)
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo historial de alerta:', error)
      throw error
    }
  }

  // Exportar alertas
  async exportAlerts(format: 'csv' | 'excel' | 'pdf', filter?: AlertFilter): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/api/alerts/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(typeof window !== 'undefined' && localStorage.getItem('auth_token') && {
            Authorization: `Bearer ${localStorage.getItem('auth_token')}`
          }),
        },
        body: JSON.stringify({ format, filter }),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Error exportando alertas:', error)
      throw error
    }
  }

  // Limpiar alertas antiguas
  async cleanupOldAlerts(daysOld: number): Promise<number> {
    try {
      const response = await this.request<{ success: boolean; cleanedCount: number }>('/api/alerts/cleanup', {
        method: 'POST',
        body: JSON.stringify({ daysOld }),
      })
      return (response.data as any)?.cleanedCount || 0
    } catch (error) {
      console.error('Error limpiando alertas antiguas:', error)
      throw error
    }
  }

  // Obtener configuración de alertas
  async getAlertConfig(): Promise<{
    emailNotifications: boolean
    smsNotifications: boolean
    pushNotifications: boolean
    webhookUrl?: string
    escalationRules: any[]
  }> {
    try {
      type AlertConfig = {
        emailNotifications: boolean
        smsNotifications: boolean
        pushNotifications: boolean
        webhookUrl?: string
        escalationRules: any[]
      }
      const response = await this.request<AlertConfig>('/api/alerts/config')
      return response.data!
    } catch (error) {
      console.error('Error obteniendo configuración de alertas:', error)
      throw error
    }
  }

  // Actualizar configuración de alertas
  async updateAlertConfig(config: any): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/api/alerts/config', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      return response.success
    } catch (error) {
      console.error('Error actualizando configuración de alertas:', error)
      throw error
    }
  }
}

export const alertsService = new AlertsService()
