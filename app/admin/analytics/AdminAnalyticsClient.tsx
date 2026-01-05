'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar,
  DollarSign,
  Activity,
  Brain,
  Target,
  Clock,
  Zap
} from 'lucide-react'

interface AdminAnalyticsClientProps {
  performanceData: any
  trendsData: any
  behaviorData: any
  predictionsData: any
  activeTab?: string
}

export default function AdminAnalyticsClient({
  performanceData,
  trendsData,
  behaviorData,
  predictionsData,
  activeTab = 'performance'
}: AdminAnalyticsClientProps) {
  const [period, setPeriod] = useState('30')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO')
  }

  const renderPerformanceMetrics = () => (
    <div className="space-y-6">
      {/* Métricas de Conversión */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Conversión</CardTitle>
          <CardDescription>
            Análisis de la efectividad de conversión de visitantes a compradores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Tasa de Conversión</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData.conversion?.conversionRate?.toFixed(1) || '0'}%
                </span>
              </div>
              <Progress value={performanceData.conversion?.conversionRate || 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Compradores Únicos</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData.conversion?.uniqueBuyers || '0'}
                </span>
              </div>
              <Progress value={(performanceData.conversion?.uniqueBuyers / (performanceData.conversion?.totalVisitors || 1)) * 100} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transacciones por Usuario</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData.conversion?.avgTransactionsPerUser?.toFixed(1) || '0'}
                </span>
              </div>
              <Progress value={Math.min(performanceData.conversion?.avgTransactionsPerUser * 20 || 0, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total Transacciones</span>
                <span className="text-sm text-muted-foreground">
                  {performanceData.conversion?.totalTransactions || '0'}
                </span>
              </div>
              <Progress value={Math.min(performanceData.conversion?.totalTransactions / 10 || 0, 100)} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Retención */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Retención</CardTitle>
          <CardDescription>
            Análisis de la retención de usuarios en diferentes períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.retention?.active7Days || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Últimos 7 días</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.retention?.active30Days || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Últimos 30 días</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceData.retention?.active90Days || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Últimos 90 días</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Eventos</CardTitle>
          <CardDescription>
            Rendimiento de eventos y ocupación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {performanceData.events?.totalEvents || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Total Eventos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {performanceData.events?.publishedEvents || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Publicados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceData.events?.avgOccupancyRate?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-muted-foreground">Ocupación Promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${performanceData.events?.avgTicketPrice?.toLocaleString() || '0'}
              </div>
              <div className="text-sm text-muted-foreground">Precio Promedio</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderMarketTrends = () => (
    <div className="space-y-6">
      {/* Tendencias de Ventas */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Ventas</CardTitle>
          <CardDescription>
            Evolución de ventas por mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead>Ventas</TableHead>
                <TableHead>Ingresos</TableHead>
                <TableHead>Clientes Únicos</TableHead>
                <TableHead>Tendencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trendsData.salesTrends?.slice(0, 6).map((trend: any) => (
                <TableRow key={trend.month}>
                  <TableCell className="font-medium">
                    {new Date(trend.month).toLocaleDateString('es-CO', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </TableCell>
                  <TableCell>{trend.sales_count}</TableCell>
                  <TableCell>{formatCurrency(trend.revenue)}</TableCell>
                  <TableCell>{trend.unique_customers}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +12%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tendencias por Categoría */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias por Categoría</CardTitle>
          <CardDescription>
            Rendimiento de eventos por categoría
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trendsData.categoryTrends?.map((category: any) => (
              <div key={category.category_name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="font-medium">{category.category_name}</span>
                </div>
                <div className="text-right">
                  <div className="font-medium">{category.events_count} eventos</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(category.revenue)} - ${category.avg_price?.toLocaleString() || '0'} promedio
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tendencias de Precios */}
      <Card>
        <CardHeader>
          <CardTitle>Tendencias de Precios</CardTitle>
          <CardDescription>
            Evolución de precios de boletos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Gráfico de tendencias de precios (implementar con librería de gráficos)
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderBehaviorAnalysis = () => (
    <div className="space-y-6">
      {/* Patrones de Compra */}
      <Card>
        <CardHeader>
          <CardTitle>Patrones de Compra por Hora</CardTitle>
          <CardDescription>
            Análisis de cuándo los usuarios realizan compras
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-6">
            {behaviorData.purchasePatterns?.map((pattern: any) => (
              <div key={pattern.hour} className="text-center">
                <div className="text-sm font-medium">{pattern.hour}:00</div>
                <div className="text-2xl font-bold">{pattern.purchases_count}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(pattern.revenue)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Patrones por Día */}
      <Card>
        <CardHeader>
          <CardTitle>Patrones de Compra por Día</CardTitle>
          <CardDescription>
            Análisis de ventas por día de la semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {behaviorData.dayPatterns?.map((pattern: any) => {
              const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
              return (
                <div key={pattern.day_of_week} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="font-medium">{dayNames[pattern.day_of_week]}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{pattern.purchases_count} compras</div>
                    <div className="text-sm text-muted-foreground">
                      {formatCurrency(pattern.revenue)}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Comportamiento por Rol */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamiento por Rol de Usuario</CardTitle>
          <CardDescription>
            Análisis de actividad por tipo de usuario
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rol</TableHead>
                <TableHead>Total Usuarios</TableHead>
                <TableHead>Compras</TableHead>
                <TableHead>Total Gastado</TableHead>
                <TableHead>Promedio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {behaviorData.userBehavior?.map((user: any) => (
                <TableRow key={user.role}>
                  <TableCell className="font-medium">
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell>{user.total_users}</TableCell>
                  <TableCell>{user.total_purchases}</TableCell>
                  <TableCell>{formatCurrency(user.total_spent)}</TableCell>
                  <TableCell>{formatCurrency(user.avg_purchase_value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderPredictions = () => (
    <div className="space-y-6">
      {/* Resumen de Predicciones */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendencia Actual</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictionsData.summary?.currentTrend === 'increasing' ? (
                <span className="text-green-600 flex items-center gap-1">
                  <TrendingUp className="h-5 w-5" />
                  Creciente
                </span>
              ) : predictionsData.summary?.currentTrend === 'decreasing' ? (
                <span className="text-red-600 flex items-center gap-1">
                  <TrendingDown className="h-5 w-5" />
                  Decreciente
                </span>
              ) : (
                <span className="text-gray-600 flex items-center gap-1">
                  <Activity className="h-5 w-5" />
                  Estable
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {predictionsData.summary?.growthRate?.toFixed(1) || '0'}% de crecimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicción Próximo Mes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(predictionsData.summary?.nextMonthPrediction || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Ingresos proyectados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confianza del Modelo</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictionsData.summary?.confidence || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Precisión de predicciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Datos Históricos</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictionsData.historicalData?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Días analizados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Predicciones Detalladas */}
      <Card>
        <CardHeader>
          <CardTitle>Predicciones de Ventas (Próximos 30 días)</CardTitle>
          <CardDescription>
            Proyecciones basadas en tendencias históricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Ingresos Proyectados</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predictionsData.predictions?.slice(0, 10).map((prediction: any) => (
                <TableRow key={prediction.date}>
                  <TableCell className="font-medium">
                    {formatDate(prediction.date)}
                  </TableCell>
                  <TableCell>{formatCurrency(prediction.predictedRevenue)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress value={prediction.confidence} className="w-20 h-2" />
                      <span className="text-sm">{prediction.confidence}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={prediction.confidence > 80 ? "default" : "secondary"}>
                      {prediction.confidence > 80 ? "Alta" : "Media"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Análisis de Estacionalidad */}
      <Card>
        <CardHeader>
          <CardTitle>Análisis de Estacionalidad</CardTitle>
          <CardDescription>
            Patrones estacionales de ventas por mes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Gráfico de estacionalidad (implementar con librería de gráficos)
          </div>
        </CardContent>
      </Card>
    </div>
  )

  const renderContent = () => {
    switch (activeTab) {
      case 'performance':
        return renderPerformanceMetrics()
      case 'trends':
        return renderMarketTrends()
      case 'behavior':
        return renderBehaviorAnalysis()
      case 'predictions':
        return renderPredictions()
      default:
        return renderPerformanceMetrics()
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros de Análisis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Período:</span>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 días</SelectItem>
                  <SelectItem value="30">30 días</SelectItem>
                  <SelectItem value="90">90 días</SelectItem>
                  <SelectItem value="365">1 año</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido del Analytics */}
      {renderContent()}
    </div>
  )
}
