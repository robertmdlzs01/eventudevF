"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, Image, Table, Mail } from "lucide-react"
import { useState } from "react"

interface ExportToolsProps {
  onExport: (format: string, type: string) => void
  loading?: boolean
}

const EXPORT_FORMATS = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'png', label: 'PNG', icon: Image },
  { value: 'csv', label: 'CSV', icon: Table },
  { value: 'excel', label: 'Excel', icon: Table }
]

const EXPORT_TYPES = [
  { value: 'all', label: 'Todos los gráficos' },
  { value: 'charts', label: 'Solo gráficos' },
  { value: 'metrics', label: 'Solo métricas' },
  { value: 'summary', label: 'Resumen ejecutivo' }
]

export default function ExportTools({ onExport, loading = false }: ExportToolsProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [selectedType, setSelectedType] = useState('all')

  const handleExport = () => {
    onExport(selectedFormat, selectedType)
  }

  const handleEmailReport = () => {
    // Simular envío de reporte por email
    alert('Funcionalidad de email será implementada próximamente')
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5" />
          Exportar Datos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de formato */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Formato de exportación</label>
          <Select value={selectedFormat} onValueChange={setSelectedFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar formato" />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_FORMATS.map((format) => {
                const IconComponent = format.icon
                return (
                  <SelectItem key={format.value} value={format.value}>
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4" />
                      {format.label}
                    </div>
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de tipo de datos */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de datos</label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              {EXPORT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Botones de acción */}
        <div className="space-y-2">
          <Button
            onClick={handleExport}
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            {loading ? 'Exportando...' : 'Exportar'}
          </Button>

          <Button
            variant="outline"
            onClick={handleEmailReport}
            disabled={loading}
            className="w-full flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Enviar por Email
          </Button>
        </div>

        {/* Información adicional */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• PDF: Incluye gráficos y métricas en formato de reporte</p>
          <p>• PNG: Solo imágenes de los gráficos</p>
          <p>• CSV/Excel: Datos tabulares para análisis</p>
        </div>
      </CardContent>
    </Card>
  )
}
