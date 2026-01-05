"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts"
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Star,
  Crown,
  Building
} from "lucide-react"
import type { SeatMapAnalytics } from "@/lib/seat-map-types"

interface SeatMapAnalyticsProps {
  analytics: SeatMapAnalytics
  eventTitle?: string
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function SeatMapAnalytics({ analytics, eventTitle }: SeatMapAnalyticsProps) {
  const occupancyRate = (analytics.occupiedSeats / analytics.totalSeats) * 100
  const revenuePerSeat = analytics.revenue / analytics.totalSeats

  // Datos para el gráfico de secciones populares
  const popularSectionsData = analytics.popularSections.map(section => ({
    name: section.sectionName,
    occupancy: section.occupancyRate,
    revenue: section.revenue
  }))

  // Datos para el gráfico de ventas por hora
  const salesByHourData = analytics.salesByHour.map(hour => ({
    hour: `${hour.hour}:00`,
    sales: hour.sales,
    revenue: hour.revenue
  }))

  // Datos para el gráfico de distribución de asientos
  const seatDistributionData = [
    { name: 'Ocupados', value: analytics.occupiedSeats, color: '#EF4444' },
    { name: 'Reservados', value: analytics.reservedSeats, color: '#F59E0B' },
    { name: 'Disponibles', value: analytics.availableSeats, color: '#10B981' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics del Mapa de Asientos</h2>
          {eventTitle && (
            <p className="text-gray-600 mt-1">{eventTitle}</p>
          )}
        </div>
        <Badge variant="outline" className="text-sm">
          <Clock className="w-4 h-4 mr-1" />
          Actualizado en tiempo real
        </Badge>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacidad Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalSeats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Asientos disponibles
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Ocupación</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate.toFixed(1)}%</div>
            <div className="mt-2">
              <Progress value={occupancyRate} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analytics.occupiedSeats} de {analytics.totalSeats} asientos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              ${revenuePerSeat.toFixed(0)} por asiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asientos Disponibles</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.availableSeats.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.reservedSeats} reservados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de asientos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Distribución de Asientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={seatDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {seatDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value?.toLocaleString() || '0', 'Asientos']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Secciones más populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Secciones Más Populares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularSectionsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'occupancy' ? `${value || 0}%` : `$${(value || 0).toLocaleString()}`,
                    name === 'occupancy' ? 'Ocupación' : 'Ingresos'
                  ]}
                />
                <Bar dataKey="occupancy" fill="#3B82F6" name="occupancy" />
                <Bar dataKey="revenue" fill="#10B981" name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Ventas por hora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ventas por Hora del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesByHourData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'sales' ? (value || 0) : `$${(value || 0).toLocaleString()}`,
                  name === 'sales' ? 'Ventas' : 'Ingresos'
                ]}
              />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="sales" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="sales"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="revenue" 
                stroke="#10B981" 
                strokeWidth={2}
                name="revenue"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Resumen de secciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Resumen por Sección
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.popularSections.map((section, index) => (
              <div key={section.sectionId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-medium">{section.sectionName}</h4>
                    <p className="text-sm text-gray-500">
                      {section.occupancyRate.toFixed(1)}% ocupación
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">${section.revenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Ingresos</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
