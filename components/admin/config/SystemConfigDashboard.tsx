// Dashboard de Configuración del Sistema basado en WordPress
// Gestión completa de configuraciones del sistema POS

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Settings, 
  Shield, 
  Bell, 
  Database, 
  Globe, 
  Lock, 
  Mail, 
  Smartphone,
  Monitor,
  Palette,
  Zap,
  Save,
  RefreshCw,
  Download,
  Upload,
  History,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { configService, SystemConfig, ConfigCategory, ConfigBackup, ConfigValidation } from '@/lib/config-service'

interface SystemConfigDashboardProps {
  className?: string
}

export function SystemConfigDashboard({ className }: SystemConfigDashboardProps) {
  const [activeTab, setActiveTab] = useState('general')
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [categories, setCategories] = useState<ConfigCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState<ConfigValidation | null>(null)
  const [systemInfo, setSystemInfo] = useState<any>(null)
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})

  // Cargar configuraciones
  const loadConfigs = async (category?: string) => {
    setLoading(true)
    try {
      const configsData = category 
        ? await configService.getConfigsByCategory(category)
        : await configService.getConfigs()
      setConfigs(configsData || [])
    } catch (error: any) {
      console.error('Error cargando configuraciones:', error)
      // Si la tabla no existe, usar array vacío
      setConfigs([])
    } finally {
      setLoading(false)
    }
  }

  // Cargar categorías
  const loadCategories = async () => {
    try {
      const categoriesData = await configService.getConfigCategories()
      // Filtrar duplicados y asegurar IDs únicos
      const uniqueCategories = (categoriesData || []).reduce((acc: ConfigCategory[], cat: ConfigCategory) => {
        if (!acc.find(c => c.id === cat.id)) {
          acc.push(cat)
        }
        return acc
      }, [])
      setCategories(uniqueCategories)
    } catch (error: any) {
      console.error('Error cargando categorías:', error)
      // Si falla, usar categorías por defecto
      setCategories([
        { id: 'general', name: 'General', description: 'Configuraciones generales', icon: 'Settings', color: 'blue', order: 1, isActive: true },
        { id: 'security', name: 'Seguridad', description: 'Configuraciones de seguridad', icon: 'Shield', color: 'red', order: 2, isActive: true },
        { id: 'business', name: 'Negocio', description: 'Configuraciones de negocio', icon: 'DollarSign', color: 'green', order: 3, isActive: true },
        { id: 'notifications', name: 'Notificaciones', description: 'Configuraciones de notificaciones', icon: 'Bell', color: 'yellow', order: 4, isActive: true },
      ])
    }
  }

  // Cargar información del sistema
  const loadSystemInfo = async () => {
    try {
      const info = await configService.getSystemInfo()
      setSystemInfo(info)
    } catch (error: any) {
      console.error('Error cargando información del sistema:', error)
      // Si falla, usar información por defecto
      setSystemInfo({
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        database: 'PostgreSQL',
        server: 'Node.js',
        uptime: 0,
        lastUpdate: new Date(),
        configCount: 0,
        lastBackup: new Date()
      })
    }
  }

  // Cargar datos iniciales
  useEffect(() => {
    // Cargar en paralelo pero manejar errores individualmente
    Promise.allSettled([
      loadConfigs(activeTab),
      loadCategories(),
      loadSystemInfo()
    ]).then(() => {
      // Todos los datos se cargaron (o fallaron silenciosamente)
    })
  }, [activeTab])

  // Actualizar configuración
  const updateConfig = async (key: string, value: any) => {
    try {
      await configService.updateConfig(key, value, 'current-user', 'Actualización desde panel')
      loadConfigs(activeTab)
    } catch (error) {
      console.error('Error actualizando configuración:', error)
    }
  }

  // Guardar todas las configuraciones
  const saveAllConfigs = async () => {
    setSaving(true)
    try {
      const configsToUpdate = configs.map(config => ({
        key: config.key,
        value: config.value
      }))
      
      await configService.updateConfigs(configsToUpdate, 'current-user', 'Actualización masiva')
      
      // Validar configuraciones
      const validationResult = await configService.validateConfigs(
        configs.reduce((acc, config) => {
          acc[config.key] = config.value
          return acc
        }, {} as Record<string, any>)
      )
      
      setValidation(validationResult)
      loadConfigs(activeTab)
    } catch (error) {
      console.error('Error guardando configuraciones:', error)
    } finally {
      setSaving(false)
    }
  }

  // Exportar configuración
  const exportConfig = async (format: 'json' | 'yaml' | 'env') => {
    try {
      const blob = await configService.exportConfig(format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `config.${format}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exportando configuración:', error)
    }
  }

  // Renderizar campo de configuración
  const renderConfigField = (config: SystemConfig) => {
    const isPassword = config.key.toLowerCase().includes('password') || config.key.toLowerCase().includes('secret')
    const showPassword = showPasswords[config.key] || false

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={config.value}
              onCheckedChange={(checked) => updateConfig(config.key, checked)}
            />
            <Label className="text-sm text-gray-600">
              {config.value ? 'Habilitado' : 'Deshabilitado'}
            </Label>
          </div>
        )
      
      case 'number':
        return (
          <Input
            type="number"
            value={config.value}
            onChange={(e) => updateConfig(config.key, parseFloat(e.target.value) || 0)}
            min={config.validation?.min}
            max={config.validation?.max}
            className="w-full"
          />
        )
      
      case 'string':
        return (
          <div className="relative">
            <Input
              type={isPassword && !showPassword ? 'password' : 'text'}
              value={config.value}
              onChange={(e) => updateConfig(config.key, e.target.value)}
              className="w-full pr-10"
            />
            {isPassword && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPasswords(prev => ({
                  ...prev,
                  [config.key]: !prev[config.key]
                }))}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        )
      
      case 'json':
        return (
          <textarea
            value={typeof config.value === 'string' ? config.value : JSON.stringify(config.value, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value)
                updateConfig(config.key, parsed)
              } catch {
                updateConfig(config.key, e.target.value)
              }
            }}
            className="w-full h-32 p-3 border rounded-md font-mono text-sm"
            placeholder="JSON válido..."
          />
        )
      
      case 'array':
        return (
          <div className="space-y-2">
            {Array.isArray(config.value) ? config.value.map((item, index) => (
              <div key={`${config.key}-item-${index}`} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newArray = [...config.value]
                    newArray[index] = e.target.value
                    updateConfig(config.key, newArray)
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newArray = config.value.filter((_: any, i: number) => i !== index)
                    updateConfig(config.key, newArray)
                  }}
                >
                  Eliminar
                </Button>
              </div>
            )) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const newArray = [...(config.value || []), '']
                updateConfig(config.key, newArray)
              }}
            >
              Agregar Item
            </Button>
          </div>
        )
      
      default:
        return (
          <Input
            value={config.value}
            onChange={(e) => updateConfig(config.key, e.target.value)}
            className="w-full"
          />
        )
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'general': return <Settings className="h-5 w-5" />
      case 'security': return <Shield className="h-5 w-5" />
      case 'business': return <Globe className="h-5 w-5" />
      case 'technical': return <Database className="h-5 w-5" />
      case 'integrations': return <Zap className="h-5 w-5" />
      case 'notifications': return <Bell className="h-5 w-5" />
      case 'appearance': return <Palette className="h-5 w-5" />
      default: return <Settings className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'general': return 'bg-blue-100 text-blue-800'
      case 'security': return 'bg-red-100 text-red-800'
      case 'business': return 'bg-green-100 text-green-800'
      case 'technical': return 'bg-purple-100 text-purple-800'
      case 'integrations': return 'bg-yellow-100 text-yellow-800'
      case 'notifications': return 'bg-orange-100 text-orange-800'
      case 'appearance': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header con información del sistema */}
      {systemInfo && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Versión</CardTitle>
              <Monitor className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.version}</div>
              <p className="text-xs text-muted-foreground">
                {systemInfo.environment}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Configuraciones</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.configCount}</div>
              <p className="text-xs text-muted-foreground">
                Total configuradas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Base de Datos</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemInfo.database}</div>
              <p className="text-xs text-muted-foreground">
                {systemInfo.server}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Actualización</CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDate(systemInfo.lastUpdate)}
              </div>
              <p className="text-xs text-muted-foreground">
                {systemInfo.uptime} días activo
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas de validación */}
      {validation && (
        <div className="space-y-2">
          {validation.errors.map((error, index) => (
            <Alert key={`error-${error.key || index}`} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{error.key}:</strong> {error.message}
              </AlertDescription>
            </Alert>
          ))}
          {validation.warnings.map((warning, index) => (
            <Alert key={`warning-${warning.key || index}`} variant="default">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>{warning.key}:</strong> {warning.message}
                {warning.suggestion && (
                  <span className="block mt-1 text-sm text-blue-600">
                    Sugerencia: {warning.suggestion}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Controles principales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Controles de Configuración
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <Button
              onClick={saveAllConfigs}
              disabled={saving}
              className="flex items-center gap-2"
            >
              <Save className={`h-4 w-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Guardando...' : 'Guardar Todo'}
            </Button>

            <Button
              onClick={() => loadConfigs(activeTab)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Button>

            <div className="flex gap-2">
              <Button
                onClick={() => exportConfig('json')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                JSON
              </Button>
              <Button
                onClick={() => exportConfig('yaml')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                YAML
              </Button>
              <Button
                onClick={() => exportConfig('env')}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                ENV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pestañas de configuración */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Seguridad
          </TabsTrigger>
          <TabsTrigger value="business" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Negocio
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Técnico
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Integraciones
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Apariencia
          </TabsTrigger>
        </TabsList>

        {/* Contenido de cada pestaña */}
        {categories.map((category, categoryIndex) => (
          <TabsContent key={`category-${category.id || categoryIndex}`} value={category.id}>
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-500">Cargando configuraciones...</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {configs
                    .filter(config => config.category === category.id)
                    .map((config, configIndex) => (
                      <Card key={`config-${config.key || configIndex}`}>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(config.category)}
                              <CardTitle className="text-lg">{config.key}</CardTitle>
                              {config.isRequired && (
                                <Badge variant="destructive">Requerido</Badge>
                              )}
                              {!config.isPublic && (
                                <Badge variant="outline">Privado</Badge>
                              )}
                            </div>
                            <Badge className={getCategoryColor(config.category)}>
                              {config.type}
                            </Badge>
                          </div>
                          <CardDescription>{config.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <Label htmlFor={config.key}>
                              Valor {config.isRequired && <span className="text-red-500">*</span>}
                            </Label>
                            {renderConfigField(config)}
                            {config.validation && (
                              <div className="text-sm text-gray-500">
                                {config.validation.min !== undefined && (
                                  <span>Mínimo: {config.validation.min}</span>
                                )}
                                {config.validation.max !== undefined && (
                                  <span> | Máximo: {config.validation.max}</span>
                                )}
                                {config.validation.options && (
                                  <span> | Opciones: {config.validation.options.join(', ')}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
