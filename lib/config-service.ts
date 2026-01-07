// Sistema de Configuración basado en WordPress
// Gestión completa de configuraciones del sistema POS

interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
}

export interface SystemConfig {
  id: string
  category: 'general' | 'security' | 'business' | 'technical' | 'integrations' | 'notifications' | 'appearance'
  key: string
  value: any
  type: 'string' | 'number' | 'boolean' | 'json' | 'array' | 'object'
  description: string
  isRequired: boolean
  isPublic: boolean
  defaultValue: any
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: any[]
  }
  createdAt: Date
  updatedAt: Date
  updatedBy: string
}

export interface ConfigCategory {
  id: string
  name: string
  description: string
  icon: string
  color: string
  order: number
  isActive: boolean
}

export interface ConfigBackup {
  id: string
  name: string
  description: string
  configData: Record<string, any>
  createdAt: Date
  createdBy: string
  size: number
}

export interface ConfigValidation {
  isValid: boolean
  errors: Array<{
    key: string
    message: string
    severity: 'error' | 'warning' | 'info'
  }>
  warnings: Array<{
    key: string
    message: string
    suggestion?: string
  }>
}

export interface ConfigChange {
  id: string
  configKey: string
  oldValue: any
  newValue: any
  changedBy: string
  changedAt: Date
  reason?: string
  category: string
}

class ConfigService {
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

  // Obtener todas las configuraciones
  async getConfigs(category?: string): Promise<SystemConfig[]> {
    try {
      const queryParams = category ? `?category=${category}` : ''
      const response = await this.request<{ success: boolean; data: SystemConfig[] }>(`/api/config${queryParams}`)
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error)
      throw error
    }
  }

  // Obtener configuración por clave
  async getConfig(key: string): Promise<SystemConfig> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig }>(`/api/config/${key}`)
      return response.data!
    } catch (error) {
      console.error('Error obteniendo configuración:', error)
      throw error
    }
  }

  // Obtener configuraciones por categoría
  async getConfigsByCategory(category: string): Promise<SystemConfig[]> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig[] }>(`/api/config/category/${category}`)
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo configuraciones por categoría:', error)
      throw error
    }
  }

  // Actualizar configuración
  async updateConfig(key: string, value: any, updatedBy: string, reason?: string): Promise<SystemConfig> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig }>(`/api/config/${key}`, {
        method: 'PUT',
        body: JSON.stringify({
          value,
          updatedBy,
          reason
        }),
      })
      return response.data!
    } catch (error) {
      console.error('Error actualizando configuración:', error)
      throw error
    }
  }

  // Actualizar múltiples configuraciones
  async updateConfigs(configs: Array<{ key: string; value: any }>, updatedBy: string, reason?: string): Promise<SystemConfig[]> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig[] }>('/api/config/batch', {
        method: 'PUT',
        body: JSON.stringify({
          configs,
          updatedBy,
          reason
        }),
      })
      return response.data || []
    } catch (error) {
      console.error('Error actualizando configuraciones:', error)
      throw error
    }
  }

  // Crear nueva configuración
  async createConfig(config: Omit<SystemConfig, 'id' | 'createdAt' | 'updatedAt' | 'updatedBy'>): Promise<SystemConfig> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig }>('/api/config', {
        method: 'POST',
        body: JSON.stringify(config),
      })
      return response.data!
    } catch (error) {
      console.error('Error creando configuración:', error)
      throw error
    }
  }

  // Eliminar configuración
  async deleteConfig(key: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/config/${key}`, {
        method: 'DELETE',
      })
      return response.success
    } catch (error) {
      console.error('Error eliminando configuración:', error)
      throw error
    }
  }

  // Obtener categorías de configuración
  async getConfigCategories(): Promise<ConfigCategory[]> {
    try {
      const response = await this.request<{ success: boolean; data: ConfigCategory[] }>('/api/config/categories')
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo categorías:', error)
      throw error
    }
  }

  // Validar configuraciones
  async validateConfigs(configs: Record<string, any>): Promise<ConfigValidation> {
    try {
      const response = await this.request<{ success: boolean; data: ConfigValidation }>('/api/config/validate', {
        method: 'POST',
        body: JSON.stringify(configs),
      })
      return response.data!
    } catch (error) {
      console.error('Error validando configuraciones:', error)
      throw error
    }
  }

  // Obtener historial de cambios
  async getConfigHistory(key?: string, limit?: number): Promise<ConfigChange[]> {
    try {
      const queryParams = new URLSearchParams()
      if (key) queryParams.append('key', key)
      if (limit) queryParams.append('limit', String(limit))
      const queryString = queryParams.toString()
      const endpoint = `/api/config/history${queryString ? `?${queryString}` : ''}`
      const response = await this.request<{ success: boolean; data: ConfigChange[] }>(endpoint)
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo historial:', error)
      throw error
    }
  }

  // Crear backup de configuración
  async createConfigBackup(name: string, description: string, createdBy: string): Promise<ConfigBackup> {
    try {
      const response = await this.request<{ success: boolean; data: ConfigBackup }>('/api/config/backup', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          createdBy
        }),
      })
      return response.data!
    } catch (error) {
      console.error('Error creando backup:', error)
      throw error
    }
  }

  // Obtener backups
  async getConfigBackups(): Promise<ConfigBackup[]> {
    try {
      const response = await this.request<{ success: boolean; data: ConfigBackup[] }>('/api/config/backups')
      return response.data || []
    } catch (error) {
      console.error('Error obteniendo backups:', error)
      throw error
    }
  }

  // Restaurar backup
  async restoreConfigBackup(backupId: string, restoredBy: string): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>(`/api/config/backup/${backupId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ restoredBy }),
      })
      return response.success
    } catch (error) {
      console.error('Error restaurando backup:', error)
      throw error
    }
  }

  // Exportar configuración
  async exportConfig(format: 'json' | 'yaml' | 'env'): Promise<Blob> {
    try {
      let token: string | null = null
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token')
      }
      const response = await fetch(`${this.baseUrl}/api/config/export/${format}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.blob()
    } catch (error) {
      console.error('Error exportando configuración:', error)
      throw error
    }
  }

  // Importar configuración
  async importConfig(file: File, importedBy: string): Promise<{ success: boolean; imported: number; errors: string[] }> {
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('importedBy', importedBy)
      
      let token: string | null = null
      if (typeof window !== 'undefined') {
        token = localStorage.getItem('auth_token')
      }
      
      const response = await fetch(`${this.baseUrl}/api/config/import`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: formData,
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error importando configuración:', error)
      throw error
    }
  }

  // Resetear configuración a valores por defecto
  async resetConfigToDefault(key: string, resetBy: string): Promise<SystemConfig> {
    try {
      const response = await this.request<{ success: boolean; data: SystemConfig }>(`/api/config/${key}/reset`, {
        method: 'POST',
        body: JSON.stringify({ resetBy }),
      })
      return response.data!
    } catch (error) {
      console.error('Error reseteando configuración:', error)
      throw error
    }
  }

  // Obtener configuración pública (sin valores sensibles)
  async getPublicConfig(): Promise<Record<string, any>> {
    try {
      const response = await this.request<{ success: boolean; data: Record<string, any> }>('/api/config/public')
      return response.data || {}
    } catch (error) {
      console.error('Error obteniendo configuración pública:', error)
      throw error
    }
  }

  // Obtener configuración del sistema
  async getSystemInfo(): Promise<{
    version: string
    environment: string
    database: string
    server: string
    uptime: number
    lastUpdate: Date
    configCount: number
    lastBackup: Date
  }> {
    try {
      const response = await this.request<{ success: boolean; data: {
        version: string
        environment: string
        database: string
        server: string
        uptime: number
        lastUpdate: Date
        configCount: number
        lastBackup: Date
      } }>('/api/config/system-info')
      return response.data!
    } catch (error) {
      console.error('Error obteniendo información del sistema:', error)
      throw error
    }
  }

  // Obtener configuración de notificaciones
  async getNotificationConfig(): Promise<{
    email: {
      enabled: boolean
      smtp: {
        host: string
        port: number
        secure: boolean
        auth: {
          user: string
          pass: string
        }
      }
      templates: Record<string, any>
    }
    sms: {
      enabled: boolean
      provider: string
      apiKey: string
      templates: Record<string, any>
    }
    push: {
      enabled: boolean
      service: string
      apiKey: string
    }
  }> {
    try {
      const response = await this.request<{ success: boolean; data: {
        email: {
          enabled: boolean
          smtp: {
            host: string
            port: number
            secure: boolean
            auth: {
              user: string
              pass: string
            }
          }
          templates: Record<string, any>
        }
        sms: {
          enabled: boolean
          provider: string
          apiKey: string
          templates: Record<string, any>
        }
        push: {
          enabled: boolean
          service: string
          apiKey: string
        }
      } }>('/api/config/notifications')
      return response.data!
    } catch (error) {
      console.error('Error obteniendo configuración de notificaciones:', error)
      throw error
    }
  }

  // Actualizar configuración de notificaciones
  async updateNotificationConfig(config: any): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/api/config/notifications', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      return response.success
    } catch (error) {
      console.error('Error actualizando configuración de notificaciones:', error)
      throw error
    }
  }

  // Obtener configuración de seguridad
  async getSecurityConfig(): Promise<{
    passwordPolicy: {
      minLength: number
      requireUppercase: boolean
      requireLowercase: boolean
      requireNumbers: boolean
      requireSymbols: boolean
      maxAge: number
    }
    session: {
      timeout: number
      maxConcurrent: number
      require2FA: boolean
    }
    login: {
      maxAttempts: number
      lockoutDuration: number
      requireCaptcha: boolean
    }
    encryption: {
      algorithm: string
      keyLength: number
    }
  }> {
    try {
      const response = await this.request<{ success: boolean; data: {
        passwordPolicy: {
          minLength: number
          requireUppercase: boolean
          requireLowercase: boolean
          requireNumbers: boolean
          requireSymbols: boolean
          maxAge: number
        }
        session: {
          timeout: number
          maxConcurrent: number
          require2FA: boolean
        }
        login: {
          maxAttempts: number
          lockoutDuration: number
          requireCaptcha: boolean
        }
        encryption: {
          algorithm: string
          keyLength: number
        }
      } }>('/api/config/security')
      return response.data!
    } catch (error) {
      console.error('Error obteniendo configuración de seguridad:', error)
      throw error
    }
  }

  // Actualizar configuración de seguridad
  async updateSecurityConfig(config: any): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/api/config/security', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      return response.success
    } catch (error) {
      console.error('Error actualizando configuración de seguridad:', error)
      throw error
    }
  }

  // Obtener configuración de integraciones
  async getIntegrationsConfig(): Promise<{
    paymentGateways: Record<string, any>
    emailProviders: Record<string, any>
    analytics: Record<string, any>
    socialMedia: Record<string, any>
    apis: Record<string, any>
  }> {
    try {
      const response = await this.request<{ success: boolean; data: {
        paymentGateways: Record<string, any>
        emailProviders: Record<string, any>
        analytics: Record<string, any>
        socialMedia: Record<string, any>
        apis: Record<string, any>
      } }>('/api/config/integrations')
      return response.data!
    } catch (error) {
      console.error('Error obteniendo configuración de integraciones:', error)
      throw error
    }
  }

  // Actualizar configuración de integraciones
  async updateIntegrationsConfig(config: any): Promise<boolean> {
    try {
      const response = await this.request<{ success: boolean }>('/api/config/integrations', {
        method: 'PUT',
        body: JSON.stringify(config),
      })
      return response.success
    } catch (error) {
      console.error('Error actualizando configuración de integraciones:', error)
      throw error
    }
  }
}

export const configService = new ConfigService()
