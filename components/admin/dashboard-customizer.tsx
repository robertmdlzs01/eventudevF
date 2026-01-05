"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Settings, Eye, EyeOff, Save, RotateCcw } from "lucide-react"
import { useState, useEffect } from "react"

interface DashboardWidget {
  id: string
  name: string
  description: string
  category: 'metrics' | 'charts' | 'realtime' | 'alerts'
  enabled: boolean
  order: number
}

interface DashboardCustomizerProps {
  onCustomizationChange: (widgets: DashboardWidget[]) => void
  onSave: (customization: any) => void
}

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'realtime-metrics',
    name: 'Métricas en Tiempo Real',
    description: 'Usuarios activos, ventas del día, ingresos',
    category: 'realtime',
    enabled: true,
    order: 1
  },
  {
    id: 'monthly-trends',
    name: 'Tendencias Mensuales',
    description: 'Evolución de usuarios, eventos y ventas',
    category: 'charts',
    enabled: true,
    order: 2
  },
  {
    id: 'user-growth',
    name: 'Crecimiento de Usuarios',
    description: 'Nuevos usuarios vs usuarios activos',
    category: 'charts',
    enabled: true,
    order: 3
  },
  {
    id: 'event-categories',
    name: 'Categorías de Eventos',
    description: 'Distribución de eventos por tipo',
    category: 'charts',
    enabled: true,
    order: 4
  },
  {
    id: 'sales-revenue',
    name: 'Ventas e Ingresos',
    description: 'Ventas y ingresos por mes',
    category: 'charts',
    enabled: true,
    order: 5
  },
  {
    id: 'user-activity',
    name: 'Actividad de Usuarios',
    description: 'Patrón de actividad por hora',
    category: 'charts',
    enabled: true,
    order: 6
  },
  {
    id: 'alert-system',
    name: 'Sistema de Alertas',
    description: 'Notificaciones de métricas críticas',
    category: 'alerts',
    enabled: true,
    order: 7
  },
  {
    id: 'quick-metrics',
    name: 'Métricas Rápidas',
    description: 'Tasa de conversión, retención, ocupación',
    category: 'metrics',
    enabled: true,
    order: 8
  }
]

const CATEGORY_COLORS = {
  metrics: 'bg-blue-100 text-blue-800',
  charts: 'bg-green-100 text-green-800',
  realtime: 'bg-purple-100 text-purple-800',
  alerts: 'bg-orange-100 text-orange-800'
}

const CATEGORY_LABELS = {
  metrics: 'Métricas',
  charts: 'Gráficos',
  realtime: 'Tiempo Real',
  alerts: 'Alertas'
}

export default function DashboardCustomizer({ onCustomizationChange, onSave }: DashboardCustomizerProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)
  const [hasChanges, setHasChanges] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  // Cargar personalización guardada
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-customization')
    if (saved) {
      try {
        const savedWidgets = JSON.parse(saved)
        setWidgets(savedWidgets)
      } catch (error) {
        console.error('Error loading saved customization:', error)
      }
    }
  }, [])

  // Detectar cambios
  useEffect(() => {
    const saved = localStorage.getItem('dashboard-customization')
    const current = JSON.stringify(widgets)
    setHasChanges(saved !== current)
  }, [widgets])

  const toggleWidget = (widgetId: string) => {
    setWidgets(prevWidgets =>
      prevWidgets.map(widget =>
        widget.id === widgetId
          ? { ...widget, enabled: !widget.enabled }
          : widget
      )
    )
  }

  const moveWidget = (widgetId: string, direction: 'up' | 'down') => {
    setWidgets(prevWidgets => {
      const newWidgets = [...prevWidgets]
      const index = newWidgets.findIndex(w => w.id === widgetId)
      
      if (direction === 'up' && index > 0) {
        [newWidgets[index], newWidgets[index - 1]] = [newWidgets[index - 1], newWidgets[index]]
      } else if (direction === 'down' && index < newWidgets.length - 1) {
        [newWidgets[index], newWidgets[index + 1]] = [newWidgets[index + 1], newWidgets[index]]
      }
      
      // Actualizar orden
      return newWidgets.map((widget, idx) => ({ ...widget, order: idx + 1 }))
    })
  }

  const saveCustomization = () => {
    localStorage.setItem('dashboard-customization', JSON.stringify(widgets))
    onSave(widgets)
    setHasChanges(false)
  }

  const resetCustomization = () => {
    setWidgets(DEFAULT_WIDGETS)
    localStorage.removeItem('dashboard-customization')
    setHasChanges(false)
  }

  const enabledWidgets = widgets.filter(w => w.enabled)
  const disabledWidgets = widgets.filter(w => !w.enabled)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Personalizar Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {showPreview ? 'Ocultar' : 'Vista Previa'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vista previa */}
        {showPreview && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-3">Vista Previa del Dashboard</h4>
            <div className="space-y-2">
              {enabledWidgets.map((widget, index) => (
                <div key={widget.id} className="flex items-center gap-2 p-2 bg-white rounded border">
                  <span className="text-sm font-mono text-gray-500 w-6">{index + 1}</span>
                  <Badge className={CATEGORY_COLORS[widget.category]}>
                    {CATEGORY_LABELS[widget.category]}
                  </Badge>
                  <span className="text-sm font-medium">{widget.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Widgets habilitados */}
        <div className="space-y-2">
          <h4 className="font-medium">Widgets Habilitados ({enabledWidgets.length})</h4>
          {enabledWidgets.map((widget, index) => (
            <div key={widget.id} className="flex items-center gap-3 p-3 border rounded-lg">
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveWidget(widget.id, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => moveWidget(widget.id, 'down')}
                  disabled={index === enabledWidgets.length - 1}
                >
                  ↓
                </Button>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge className={CATEGORY_COLORS[widget.category]}>
                    {CATEGORY_LABELS[widget.category]}
                  </Badge>
                  <span className="font-medium">{widget.name}</span>
                </div>
                <p className="text-sm text-gray-600">{widget.description}</p>
              </div>
              
              <Switch
                checked={widget.enabled}
                onCheckedChange={() => toggleWidget(widget.id)}
              />
            </div>
          ))}
        </div>

        {/* Widgets deshabilitados */}
        {disabledWidgets.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-600">Widgets Deshabilitados ({disabledWidgets.length})</h4>
            {disabledWidgets.map((widget) => (
              <div key={widget.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg opacity-75">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge className={CATEGORY_COLORS[widget.category]}>
                      {CATEGORY_LABELS[widget.category]}
                    </Badge>
                    <span className="font-medium">{widget.name}</span>
                  </div>
                  <p className="text-sm text-gray-600">{widget.description}</p>
                </div>
                
                <Switch
                  checked={widget.enabled}
                  onCheckedChange={() => toggleWidget(widget.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Botones de acción */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={resetCustomization}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </Button>
          
          <Button
            onClick={saveCustomization}
            disabled={!hasChanges}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Guardar Cambios
          </Button>
        </div>

        {/* Información */}
        <div className="text-xs text-gray-500">
          <p>• Arrastra los widgets para cambiar su orden</p>
          <p>• Los cambios se guardan automáticamente en tu navegador</p>
          <p>• Puedes habilitar/deshabilitar widgets según tus necesidades</p>
        </div>
      </CardContent>
    </Card>
  )
}
