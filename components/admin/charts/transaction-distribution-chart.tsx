"use client"

import { useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PieChartIcon, TrendingUp, TrendingDown, Loader2 } from "lucide-react"
import { getTransactionDistribution } from "@/app/admin/actions"

export function TransactionDistributionChart() {
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const result = await getTransactionDistribution()
        setData(result.distribution || [])
        setSummary(result.summary || {})
      } catch (error) {
        console.error('Error loading transaction distribution:', error)
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

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium text-foreground">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            Cantidad: {data.value.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">
            Porcentaje: {data.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => (
    <div className="flex flex-wrap gap-4 justify-center mt-4">
      {payload?.map((entry: any, index: number) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">
            {entry.value} ({data[index]?.percentage || 0}%)
          </span>
        </div>
      ))}
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Distribución de Transacciones
          </CardTitle>
          <CardDescription>Cargando datos de transacciones...</CardDescription>
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
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5" />
          Distribución de Transacciones
        </CardTitle>
        <CardDescription>
          Análisis de tipos de transacciones en el sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Métricas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {summary.conversionRate || 0}%
            </div>
            <div className="text-sm text-green-600">Tasa de Conversión</div>
          </div>
          
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-900">
              {summary.abandonmentRate || 0}%
            </div>
            <div className="text-sm text-orange-600">Tasa de Abandono</div>
          </div>
          
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {summary.totalTransactions?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-blue-600">Total Transacciones</div>
          </div>
          
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">
              {summary.completedTransactions || 0}
            </div>
            <div className="text-sm text-purple-600">Completadas</div>
          </div>
        </div>

        {/* Gráfico */}
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.name} ${entry.percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={<CustomLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
