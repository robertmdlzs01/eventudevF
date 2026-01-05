"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Filter, RefreshCw } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { useState } from "react"

interface TimeFiltersProps {
  onFilterChange: (filters: {
    period: string
    startDate?: Date
    endDate?: Date
  }) => void
  loading?: boolean
}

const PRESET_PERIODS = [
  { value: 'today', label: 'Hoy' },
  { value: 'yesterday', label: 'Ayer' },
  { value: 'last7days', label: 'Últimos 7 días' },
  { value: 'last30days', label: 'Últimos 30 días' },
  { value: 'last90days', label: 'Últimos 90 días' },
  { value: 'last6months', label: 'Últimos 6 meses' },
  { value: 'lastyear', label: 'Último año' },
  { value: 'custom', label: 'Rango personalizado' }
]

export default function TimeFilters({ onFilterChange, loading = false }: TimeFiltersProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('last30days')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [isCustomRange, setIsCustomRange] = useState(false)

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    setIsCustomRange(period === 'custom')
    
    if (period !== 'custom') {
      const now = new Date()
      let start: Date
      let end: Date = now

      switch (period) {
        case 'today':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'yesterday':
          start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          end = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case 'last7days':
          start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last30days':
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last90days':
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'last6months':
          start = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
          break
        case 'lastyear':
          start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
          break
        default:
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      onFilterChange({
        period,
        startDate: start,
        endDate: end
      })
    }
  }

  const handleCustomDateChange = () => {
    if (startDate && endDate) {
      onFilterChange({
        period: 'custom',
        startDate,
        endDate
      })
    }
  }

  const handleRefresh = () => {
    onFilterChange({
      period: selectedPeriod,
      startDate,
      endDate
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filtros de Tiempo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selector de período */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Período</label>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar período" />
            </SelectTrigger>
            <SelectContent>
              {PRESET_PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selector de fechas personalizadas */}
        {isCustomRange && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de inicio</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha de fin</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Button 
              onClick={handleCustomDateChange}
              disabled={!startDate || !endDate || loading}
              className="w-full"
            >
              Aplicar Filtro Personalizado
            </Button>
          </div>
        )}

        {/* Botón de actualizar */}
        <div className="flex justify-between items-center pt-2 border-t">
          <div className="text-sm text-gray-600">
            {selectedPeriod !== 'custom' && (
              <span>
                Mostrando: {PRESET_PERIODS.find(p => p.value === selectedPeriod)?.label}
              </span>
            )}
            {selectedPeriod === 'custom' && startDate && endDate && (
              <span>
                Mostrando: {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
