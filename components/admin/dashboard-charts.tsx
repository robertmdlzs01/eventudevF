"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react"

interface ChartData {
  name: string
  value: number
  [key: string]: any
}

interface DashboardChartsProps {
  data?: {
    monthlyTrends?: ChartData[]
    userGrowth?: ChartData[]
    eventCategories?: ChartData[]
    salesByMonth?: ChartData[]
    revenueByMonth?: ChartData[]
    userActivity?: ChartData[]
  }
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Datos de ejemplo si no se proporcionan datos reales
  const defaultData = {
    monthlyTrends: [
      { name: 'Ene', usuarios: 120, eventos: 15, ventas: 45 },
      { name: 'Feb', usuarios: 190, eventos: 22, ventas: 67 },
      { name: 'Mar', usuarios: 300, eventos: 28, ventas: 89 },
      { name: 'Abr', usuarios: 280, eventos: 25, ventas: 78 },
      { name: 'May', usuarios: 189, eventos: 18, ventas: 56 },
      { name: 'Jun', usuarios: 239, eventos: 32, ventas: 98 }
    ],
    userGrowth: [
      { name: 'Sem 1', nuevos: 45, activos: 120 },
      { name: 'Sem 2', nuevos: 52, activos: 135 },
      { name: 'Sem 3', nuevos: 38, activos: 142 },
      { name: 'Sem 4', nuevos: 61, activos: 158 }
    ],
    eventCategories: [
      { name: 'Conciertos', value: 35, color: '#0088FE' },
      { name: 'Conferencias', value: 25, color: '#00C49F' },
      { name: 'Deportes', value: 20, color: '#FFBB28' },
      { name: 'Teatro', value: 15, color: '#FF8042' },
      { name: 'Otros', value: 5, color: '#8884D8' }
    ],
    salesByMonth: [
      { name: 'Ene', ventas: 45, ingresos: 1200000 },
      { name: 'Feb', ventas: 67, ingresos: 1800000 },
      { name: 'Mar', ventas: 89, ingresos: 2400000 },
      { name: 'Abr', ventas: 78, ingresos: 2100000 },
      { name: 'May', ventas: 56, ingresos: 1500000 },
      { name: 'Jun', ventas: 98, ingresos: 2800000 }
    ],
    userActivity: [
      { name: '00:00', usuarios: 12 },
      { name: '04:00', usuarios: 8 },
      { name: '08:00', usuarios: 45 },
      { name: '12:00', usuarios: 78 },
      { name: '16:00', usuarios: 65 },
      { name: '20:00', usuarios: 89 },
      { name: '24:00', usuarios: 34 }
    ]
  }

  const chartData = data || defaultData

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Gráfico de Tendencias Mensuales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Tendencias Mensuales
          </CardTitle>
          <CardDescription>
            Evolución de usuarios, eventos y ventas en los últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="usuarios" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Usuarios"
              />
              <Line 
                type="monotone" 
                dataKey="eventos" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Eventos"
              />
              <Line 
                type="monotone" 
                dataKey="ventas" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Ventas"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfico de Crecimiento de Usuarios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crecimiento de Usuarios
          </CardTitle>
          <CardDescription>
            Nuevos usuarios vs usuarios activos por semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="nuevos" 
                stackId="1" 
                stroke="#8884d8" 
                fill="#8884d8"
                name="Nuevos Usuarios"
              />
              <Area 
                type="monotone" 
                dataKey="activos" 
                stackId="2" 
                stroke="#82ca9d" 
                fill="#82ca9d"
                name="Usuarios Activos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráficos en fila */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Categorías de Eventos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Eventos por Categoría
            </CardTitle>
            <CardDescription>
              Distribución de eventos por tipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData.eventCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.eventCategories?.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Ventas e Ingresos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ventas e Ingresos
            </CardTitle>
            <CardDescription>
              Ventas y ingresos por mes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData.salesByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'ingresos' ? formatCurrency(Number(value)) : value,
                    name === 'ingresos' ? 'Ingresos' : 'Ventas'
                  ]}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="ventas" 
                  fill="#8884d8" 
                  name="Ventas"
                />
                <Bar 
                  yAxisId="right"
                  dataKey="ingresos" 
                  fill="#82ca9d" 
                  name="Ingresos"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Actividad de Usuarios por Hora */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Actividad de Usuarios por Hora
          </CardTitle>
          <CardDescription>
            Patrón de actividad de usuarios durante el día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData.userActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="usuarios" 
                stroke="#8884d8" 
                fill="#8884d8"
                fillOpacity={0.6}
                name="Usuarios Activos"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-gray-900">12.5%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Retención 30d</p>
                <p className="text-2xl font-bold text-gray-900">68%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ocupación Promedio</p>
                <p className="text-2xl font-bold text-gray-900">85%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900">$45K</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
