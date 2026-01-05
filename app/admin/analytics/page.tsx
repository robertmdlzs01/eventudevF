import { Suspense } from 'react'
import { 
  getPerformanceMetrics, 
  getMarketTrends, 
  getBehaviorAnalysis, 
  getSalesPredictions 
} from '../actions'
import AdminAnalyticsClient from './AdminAnalyticsClient'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar,
  DollarSign,
  Activity,
  Brain,
  Target
} from 'lucide-react'

export default async function AdminAnalyticsPage() {
  // Obtener datos de analytics
  const performanceData = await getPerformanceMetrics()
  const trendsData = await getMarketTrends()
  const behaviorData = await getBehaviorAnalysis()
  const predictionsData = await getSalesPredictions()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Avanzados</h1>
          <p className="text-muted-foreground">
            Análisis profundo del rendimiento y comportamiento de la plataforma
          </p>
        </div>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Rendimiento
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Tendencias
          </TabsTrigger>
          <TabsTrigger value="behavior" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Comportamiento
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Predicciones
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasa de Conversión</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.conversion?.conversionRate?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData.conversion?.uniqueBuyers || '0'} compradores únicos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retención 30 días</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.retention?.active30Days || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Usuarios activos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {performanceData.events?.avgOccupancyRate?.toFixed(1) || '0'}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {performanceData.events?.publishedEvents || '0'} eventos publicados
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valor Promedio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${performanceData.financial?.avgTransactionValue?.toLocaleString() || '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Por transacción
                </p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<div>Cargando métricas de rendimiento...</div>}>
            <AdminAnalyticsClient 
              performanceData={performanceData}
              trendsData={trendsData}
              behaviorData={behaviorData}
              predictionsData={predictionsData}
              activeTab="performance"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Suspense fallback={<div>Cargando tendencias de mercado...</div>}>
            <AdminAnalyticsClient 
              performanceData={performanceData}
              trendsData={trendsData}
              behaviorData={behaviorData}
              predictionsData={predictionsData}
              activeTab="trends"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Suspense fallback={<div>Cargando análisis de comportamiento...</div>}>
            <AdminAnalyticsClient 
              performanceData={performanceData}
              trendsData={trendsData}
              behaviorData={behaviorData}
              predictionsData={predictionsData}
              activeTab="behavior"
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Suspense fallback={<div>Cargando predicciones...</div>}>
            <AdminAnalyticsClient 
              performanceData={performanceData}
              trendsData={trendsData}
              behaviorData={behaviorData}
              predictionsData={predictionsData}
              activeTab="predictions"
            />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
}
