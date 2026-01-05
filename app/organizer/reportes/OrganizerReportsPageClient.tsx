"use client"

import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DatePickerWithRange } from "@/components/ui/date-range-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileText,
  Download,
  Filter,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  BarChart3,
  Activity,
  Clock,
  Eye,
  RefreshCw,
  Zap,
} from "lucide-react"

// Report data interfaces
interface ReportData {
  salesReportData: Array<{
    fecha: string
    evento: string
    categoria: string
    boletos: number
    ingresos: number
    ocupacion: number
    canal: string
  }>
  attendeeReportData: Array<{
    nombre: string
    email: string
    evento: string
    boletos: number
    total: number
    estado: string
    checkin: string
  }>
  financialReportData: Array<{
    concepto: string
    enero: number
    febrero: number
    marzo: number
    total: number
  }>
}



const reportTemplates = [
  {
    id: "ventas-mensual",
    name: "Reporte de Ventas Mensual",
    description: "Resumen completo de ventas por mes",
    icon: DollarSign,
    category: "Ventas",
    lastGenerated: "2025-07-01",
  },
  {
    id: "asistentes-evento",
    name: "Lista de Asistentes por Evento",
    description: "Detalle de todos los asistentes registrados",
    icon: Users,
    category: "Asistentes",
    lastGenerated: "2025-07-15",
  },
  {
    id: "financiero-trimestral",
    name: "Reporte Financiero Trimestral",
    description: "Análisis financiero detallado por trimestre",
    icon: BarChart3,
    category: "Financiero",
    lastGenerated: "2025-06-30",
  },
  {
    id: "rendimiento-eventos",
    name: "Rendimiento de Eventos",
    description: "Métricas de ocupación y satisfacción",
    icon: TrendingUp,
    category: "Rendimiento",
    lastGenerated: "2025-07-20",
  },
  {
    id: "marketing-canales",
    name: "Efectividad de Canales",
    description: "Análisis de canales de marketing y ventas",
    icon: Activity,
    category: "Marketing",
    lastGenerated: "2025-07-18",
  },
  {
    id: "checkin-tiempo-real",
    name: "Check-in en Tiempo Real",
    description: "Estado actual de check-ins por evento",
    icon: Clock,
    category: "Operaciones",
    lastGenerated: "Tiempo real",
  },
]

export default function OrganizerReportsPageClient() {
  const [selectedTemplate, setSelectedTemplate] = useState("")
  const [selectedFormat, setSelectedFormat] = useState("pdf")
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [reportData, setReportData] = useState<ReportData>({
    salesReportData: [],
    attendeeReportData: [],
    financialReportData: [],
  })
  const [loading, setLoading] = useState(true)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(value)
  }

  const loadReportData = async () => {
    try {
      setLoading(true)
      
      // Load events for sales report
      const eventsResponse = await apiClient.getOrganizerEvents()
      
      if (eventsResponse.success && eventsResponse.data) {
        const events = eventsResponse.data.events || []
        
        // Generate sales report data from events
        const salesReportData = events.map((event: any) => ({
          fecha: event.date,
          evento: event.title,
          categoria: event.category?.name || event.category || 'General',
          boletos: event.tickets_sold || 0,
          ingresos: event.revenue || 0,
          ocupacion: event.total_capacity ? ((event.tickets_sold || 0) / event.total_capacity) * 100 : 0,
          canal: "Web",
        }))
        
        // Generate AI-powered financial insights
        const financialReportData = generateFinancialInsights(events)
        
        setReportData({
          salesReportData,
          attendeeReportData: [], // Empty for now
          financialReportData,
        })
      }
    } catch (error) {
      console.error("Error loading report data:", error)
    } finally {
      setLoading(false)
    }
  }

  // AI Business Intelligence - Generate financial insights
  const generateFinancialInsights = (events: any[]) => {
    if (events.length === 0) return []
    
    const insights = []
    
    // Calculate total revenue
    const totalRevenue = events.reduce((sum, event) => sum + (event.revenue || 0), 0)
    
    // Calculate average revenue per event
    const avgRevenuePerEvent = totalRevenue / events.length
    
    // Calculate occupancy rates
    const occupancyRates = events.map(event => 
      event.total_capacity ? ((event.tickets_sold || 0) / event.total_capacity) * 100 : 0
    )
    const avgOccupancy = occupancyRates.reduce((sum, rate) => sum + rate, 0) / occupancyRates.length
    
    // Revenue Analysis
    insights.push({
      concepto: "Ventas Brutas",
      enero: totalRevenue * 0.3, // Simulated monthly distribution
      febrero: totalRevenue * 0.35,
      marzo: totalRevenue * 0.35,
      total: totalRevenue,
    })
    
    // Commission Analysis (estimated 5-10% of revenue)
    const commissionRate = 0.075
    const totalCommission = totalRevenue * commissionRate
    insights.push({
      concepto: "Comisiones Plataforma",
      enero: -totalCommission * 0.3,
      febrero: -totalCommission * 0.35,
      marzo: -totalCommission * 0.35,
      total: -totalCommission,
    })
    
    // Operational Costs (estimated 15-25% of revenue)
    const operationalCostRate = 0.2
    const totalOperationalCosts = totalRevenue * operationalCostRate
    insights.push({
      concepto: "Gastos Operativos",
      enero: -totalOperationalCosts * 0.3,
      febrero: -totalOperationalCosts * 0.35,
      marzo: -totalOperationalCosts * 0.35,
      total: -totalOperationalCosts,
    })
    
    // Net Income
    const netIncome = totalRevenue - totalCommission - totalOperationalCosts
    insights.push({
      concepto: "Ingresos Netos",
      enero: netIncome * 0.3,
      febrero: netIncome * 0.35,
      marzo: netIncome * 0.35,
      total: netIncome,
    })
    
    return insights
  }

  // AI Business Intelligence - Generate intelligent recommendations
  const generateAIRecommendations = () => {
    const recommendations: any[] = []
    
    if (reportData.salesReportData.length === 0) {
      return recommendations
    }

    const { salesReportData, financialReportData } = reportData
    
    // 1. Revenue Performance Recommendations
    const totalRevenue = financialReportData[0]?.total || 0
    if (totalRevenue > 50000000) {
      recommendations.push({
        title: 'Escala tu Negocio',
        description: 'Con estos ingresos, considera expandir a múltiples ciudades o crear eventos premium'
      })
    } else if (totalRevenue < 10000000) {
      recommendations.push({
        title: 'Enfoque en Crecimiento',
        description: 'Implementa estrategias de marketing agresivas para aumentar tu base de clientes'
      })
    }

    // 2. Occupancy Rate Recommendations
    const avgOccupancy = salesReportData.reduce((sum, event) => sum + event.ocupacion, 0) / salesReportData.length
    if (avgOccupancy < 50) {
      recommendations.push({
        title: 'Optimiza Precios',
        description: 'Tu ocupación promedio es baja. Considera ajustar precios o implementar descuentos'
      })
    } else if (avgOccupancy > 80) {
      recommendations.push({
        title: 'Aumenta Capacidad',
        description: 'Excelente ocupación. Considera expandir capacidad o aumentar precios'
      })
    }

    // 3. Category Performance Recommendations
    const categoryPerformance = salesReportData.reduce((acc, event) => {
      if (!acc[event.categoria]) acc[event.categoria] = { count: 0, totalRevenue: 0, avgOccupancy: 0 }
      acc[event.categoria].count++
      acc[event.categoria].totalRevenue += event.ingresos
      acc[event.categoria].avgOccupancy += event.ocupacion
      return acc
    }, {} as Record<string, any>)

    Object.entries(categoryPerformance).forEach(([category, data]) => {
      const avgOcc = data.avgOccupancy / data.count
      if (avgOcc < 40) {
        recommendations.push({
          title: `Revisa Estrategia de ${category}`,
          description: `Los eventos de ${category} tienen bajo rendimiento. Analiza precios y marketing`
        })
      }
    })

    // 4. Seasonal Recommendations
    const currentMonth = new Date().getMonth()
    if (currentMonth >= 11 || currentMonth <= 2) {
      recommendations.push({
        title: 'Temporada Alta',
        description: 'Estás en temporada alta. Aprovecha para crear eventos especiales y aumentar precios'
      })
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      recommendations.push({
        title: 'Temporada Media',
        description: 'Considera eventos indoor o temáticos para mantener el flujo de ingresos'
      })
    }

    // 5. Financial Health Recommendations
    if (financialReportData.length > 0) {
      const netIncome = financialReportData[3]?.total || 0
      const grossRevenue = financialReportData[0]?.total || 1
      const profitMargin = (netIncome / grossRevenue) * 100
      
      if (profitMargin < 20) {
        recommendations.push({
          title: 'Optimiza Costos',
          description: 'Tu margen de ganancia es bajo. Revisa gastos operativos y comisiones'
        })
      } else if (profitMargin > 40) {
        recommendations.push({
          title: 'Excelente Rentabilidad',
          description: 'Tu negocio es muy rentable. Considera reinvertir en marketing y expansión'
        })
      }
    }

    return recommendations.slice(0, 6) // Limit to top 6 recommendations
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    // Simular generación de reporte
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsGenerating(false)
    // Aquí iría la lógica real de generación
  }

  // Load data on component mount
  useEffect(() => {
    loadReportData()
  }, [])

  const getStatusBadge = (status: string) => {
    const variants = {
      Confirmado: { variant: "default" as const, color: "bg-green-500" },
      Pendiente: { variant: "secondary" as const, color: "bg-yellow-500" },
      Cancelado: { variant: "destructive" as const, color: "bg-red-500" },
    }
    return variants[status as keyof typeof variants] || variants.Pendiente
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Centro de Reportes
          </h1>
          <p className="text-gray-600 mt-1">Genera y exporta reportes detallados de tus eventos</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar Datos
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
            <FileText className="h-4 w-4 mr-2" />
            Nuevo Reporte
          </Button>
        </div>
      </div>

      <Tabs defaultValue="plantillas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="plantillas">Plantillas</TabsTrigger>
          <TabsTrigger value="personalizado">Personalizado</TabsTrigger>
          <TabsTrigger value="insights">🧠 Insights IA</TabsTrigger>
          <TabsTrigger value="programados">Programados</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="plantillas" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const Icon = template.icon
              return (
                <Card key={template.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {template.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">Última generación: {template.lastGenerated}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-3 w-3 mr-1" />
                          Vista Previa
                        </Button>
                        <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600">
                          <Download className="h-3 w-3 mr-1" />
                          Generar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="personalizado" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuración del Reporte */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Configuración
                </CardTitle>
                <CardDescription>Personaliza tu reporte</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="report-name">Nombre del Reporte</Label>
                  <Input id="report-name" placeholder="Mi reporte personalizado" />
                </div>

                <div>
                  <Label htmlFor="report-type">Tipo de Reporte</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ventas">Ventas</SelectItem>
                      <SelectItem value="asistentes">Asistentes</SelectItem>
                      <SelectItem value="financiero">Financiero</SelectItem>
                      <SelectItem value="rendimiento">Rendimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date-range">Rango de Fechas</Label>
                  <DatePickerWithRange />
                </div>

                <div>
                  <Label htmlFor="events">Eventos</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos los eventos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los eventos</SelectItem>
                      <SelectItem value="rock">Concierto Rock Sinfónico</SelectItem>
                      <SelectItem value="jazz">Festival de Jazz</SelectItem>
                      <SelectItem value="teatro">Obra Teatral Clásica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="format">Formato de Exportación</Label>
                  <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Generar Reporte
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Vista Previa */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Vista Previa
                </CardTitle>
                <CardDescription>Previsualización de los datos</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="ventas" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="ventas">Ventas</TabsTrigger>
                    <TabsTrigger value="asistentes">Asistentes</TabsTrigger>
                    <TabsTrigger value="financiero">Financiero</TabsTrigger>
                  </TabsList>

                  <TabsContent value="ventas">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Boletos</TableHead>
                          <TableHead>Ingresos</TableHead>
                          <TableHead>Ocupación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.salesReportData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(row.fecha).toLocaleDateString("es-ES")}</TableCell>
                            <TableCell>{row.evento}</TableCell>
                            <TableCell>{row.boletos}</TableCell>
                            <TableCell>{formatCurrency(row.ingresos)}</TableCell>
                            <TableCell>{row.ocupacion}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="asistentes">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Evento</TableHead>
                          <TableHead>Boletos</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Check-in</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.attendeeReportData.map((row, index) => {
                          const statusInfo = getStatusBadge(row.estado)
                          return (
                            <TableRow key={index}>
                              <TableCell>{row.nombre}</TableCell>
                              <TableCell>{row.email}</TableCell>
                              <TableCell>{row.evento}</TableCell>
                              <TableCell>{row.boletos}</TableCell>
                              <TableCell>
                                <Badge variant={statusInfo.variant}>{row.estado}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant={row.checkin === "Sí" ? "default" : "secondary"}>{row.checkin}</Badge>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TabsContent>

                  <TabsContent value="financiero">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Concepto</TableHead>
                          <TableHead>Enero</TableHead>
                          <TableHead>Febrero</TableHead>
                          <TableHead>Marzo</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.financialReportData.map((row, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{row.concepto}</TableCell>
                            <TableCell className={row.enero < 0 ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(row.enero)}
                            </TableCell>
                            <TableCell className={row.febrero < 0 ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(row.febrero)}
                            </TableCell>
                            <TableCell className={row.marzo < 0 ? "text-red-600" : "text-green-600"}>
                              {formatCurrency(row.marzo)}
                            </TableCell>
                            <TableCell className={`font-semibold ${row.total < 0 ? "text-red-600" : "text-green-600"}`}>
                              {formatCurrency(row.total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Insights de Inteligencia de Negocios
              </CardTitle>
              <CardDescription>
                Análisis automático y recomendaciones basadas en tus datos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Revenue Insights */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">📊 Análisis de Ingresos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Ingresos Totales</p>
                      <p className="text-xl font-bold text-blue-900">
                        ${reportData.financialReportData[0]?.total?.toLocaleString() || '0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Promedio por Evento</p>
                      <p className="text-xl font-bold text-blue-900">
                        ${reportData.salesReportData.length > 0 ? 
                          (reportData.financialReportData[0]?.total / reportData.salesReportData.length).toLocaleString() : '0'}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">Margen Neto</p>
                      <p className="text-xl font-bold text-blue-900">
                        {reportData.financialReportData.length > 0 ? 
                          ((reportData.financialReportData[3]?.total / reportData.financialReportData[0]?.total) * 100).toFixed(1) : '0'}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-semibold text-green-900 mb-2">🎯 Análisis de Rendimiento</h4>
                  <div className="space-y-3">
                    {reportData.salesReportData.length > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Evento con Mayor Ocupación:</span>
                          <span className="font-medium text-green-900">
                            {reportData.salesReportData.reduce((max, event) => 
                              event.ocupacion > max.ocupacion ? event : max
                            ).evento}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Evento con Mayor Ingreso:</span>
                          <span className="font-medium text-green-900">
                            {reportData.salesReportData.reduce((max, event) => 
                              event.ingresos > max.ingresos ? event : max
                            ).evento}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-green-700">Ocupación Promedio:</span>
                          <span className="font-medium text-green-900">
                            {(reportData.salesReportData.reduce((sum, event) => sum + event.ocupacion, 0) / reportData.salesReportData.length).toFixed(1)}%
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* AI Recommendations */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <h4 className="font-semibold text-purple-900 mb-2">🤖 Recomendaciones IA</h4>
                  <div className="space-y-3">
                    {generateAIRecommendations().map((rec, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                        <div>
                          <p className="font-medium text-purple-900">{rec.title}</p>
                          <p className="text-sm text-purple-700">{rec.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programados" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Reportes Programados
              </CardTitle>
              <CardDescription>Configura reportes automáticos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay reportes programados</h3>
                <p className="text-gray-600 mb-4">Configura reportes automáticos para recibir información periódica</p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Programar Reporte
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Historial de Reportes
              </CardTitle>
              <CardDescription>Reportes generados anteriormente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Historial vacío</h3>
                <p className="text-gray-600 mb-4">Los reportes que generes aparecerán aquí para fácil acceso</p>
                <Button variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
