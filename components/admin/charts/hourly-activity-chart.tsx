"use client"

import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { getHourlyActivity } from "@/app/admin/actions"

export function HourlyActivityChart() {
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await getHourlyActivity()
        setData(result.hourlyData || [])
        setSummary(result.summary || {})
      } catch (error) {
        console.error('Error loading hourly activity:', error)
        setData([])
        setSummary({})
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actividad por Hora del Día
          </CardTitle>
          <CardDescription>Cargando datos de actividad por hora...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const peakHour = summary.peakHour || { hour: '00:00', sales: 0, revenue: 0 }
  const lowHour = summary.lowHour || { hour: '00:00', sales: 0, revenue: 0 }
  const averages = summary.averages || { salesPerHour: 0, revenuePerHour: 0, eventsPerHour: 0 }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Actividad por Hora del Día
        </CardTitle>
        <CardDescription>
          Análisis de patrones de ventas y actividad por hora
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {peakHour.hour}
            </div>
            <div className="text-sm text-blue-600">Hora Pico</div>
            <div className="text-xs text-blue-500">
              {peakHour.sales} ventas
            </div>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-900">
              {lowHour.hour}
            </div>
            <div className="text-sm text-red-600">Hora Baja</div>
            <div className="text-xs text-red-500">
              {lowHour.sales} ventas
            </div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {averages.salesPerHour}
            </div>
            <div className="text-sm text-green-600">Promedio Ventas</div>
            <div className="text-xs text-green-500">
              por hora
            </div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(averages.revenuePerHour)}
            </div>
            <div className="text-sm text-purple-600">Promedio Ingresos</div>
            <div className="text-xs text-purple-500">
              por hora
            </div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="hour" 
                className="text-muted-foreground text-xs" 
                axisLine={false} 
                tickLine={false} 
              />
              <YAxis yAxisId="left" className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" className="text-muted-foreground text-xs" axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: any, name?: string) => {
                  if (name === "revenue") return [formatCurrency(value), "Ingresos"]
                  if (name === "sales") return [value, "Ventas"]
                  if (name === "events") return [value, "Eventos"]
                  return [value, name || ""]
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="sales" 
                fill="#3b82f6" 
                name="Ventas"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="left"
                dataKey="events" 
                fill="#10b981" 
                name="Eventos"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
