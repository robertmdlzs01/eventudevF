"use client"

import { useState, useEffect } from "react"
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  AreaChart
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Activity, TrendingUp, TrendingDown, Calendar, DollarSign, Users, Loader2 } from "lucide-react"
import { getActivityData } from "@/app/admin/actions"

export function ActivityChart() {
  const [chartType, setChartType] = useState<"line" | "area" | "composed">("composed")
  const [timeRange, setTimeRange] = useState<"7d" | "15d" | "30d">("30d")
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const days = timeRange === "7d" ? 7 : timeRange === "15d" ? 15 : 30
        const result = await getActivityData(days)
        setData(result.activityData || [])
        setSummary(result.summary || {})
      } catch (error) {
        console.error('Error loading activity data:', error)
        setData([])
        setSummary({})
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [timeRange])

  const totalSales = summary.totalSales || 0
  const totalEvents = summary.totalEvents || 0
  const totalRevenue = summary.totalRevenue || 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>Cargando datos de actividad...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-80">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <CardDescription>Ventas y eventos de los últimos {timeRange === "7d" ? "7" : timeRange === "15d" ? "15" : "30"} días</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: "7d" | "15d" | "30d") => setTimeRange(value)}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="15d">15 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chartType} onValueChange={(value: "line" | "area" | "composed") => setChartType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line">Línea</SelectItem>
                <SelectItem value="area">Área</SelectItem>
                <SelectItem value="composed">Combinado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Ventas</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">{totalSales}</div>
          </div>
          
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">Eventos</span>
            </div>
            <div className="text-2xl font-bold text-green-900">{totalEvents}</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Ingresos</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(totalRevenue)}</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">Promedio</span>
            </div>
            <div className="text-2xl font-bold text-orange-900">{data.length > 0 ? Math.round(totalSales / data.length) : 0}</div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                  labelFormatter={formatDate}
                  formatter={(value: any, name?: string) => {
                    if (name === "revenue") return [formatCurrency(value), "Ingresos"]
                    if (name === "sales") return [value, "Ventas"]
                    if (name === "events") return [value, "Eventos"]
                    return [value, name || ""]
                  }}
                />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Ventas"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="events" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Eventos"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  name="Ingresos"
                />
              </LineChart>
            ) : chartType === "area" ? (
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                  labelFormatter={formatDate}
                  formatter={(value: any, name?: string) => {
                    if (name === "revenue") return [formatCurrency(value), "Ingresos"]
                    if (name === "sales") return [value, "Ventas"]
                    if (name === "events") return [value, "Eventos"]
                    return [value, name || ""]
                  }}
                />
                <Legend />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#3b82f6" 
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Ventas"
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="events" 
                  stroke="#10b981" 
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Eventos"
                />
                <Area 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8b5cf6" 
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  name="Ingresos"
                />
              </AreaChart>
            ) : (
              <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
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
                  labelFormatter={formatDate}
                  formatter={(value: any, name?: string) => {
                    if (name === "revenue") return [formatCurrency(value), "Ingresos"]
                    if (name === "sales") return [value, "Ventas"]
                    if (name === "events") return [value, "Eventos"]
                    return [value, name || ""]
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="sales" fill="#3b82f6" name="Ventas" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="events" fill="#10b981" name="Eventos" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Ingresos"
                  dot={{ fill: "#f59e0b", strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
