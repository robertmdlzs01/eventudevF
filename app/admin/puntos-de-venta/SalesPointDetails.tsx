"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  MapPin, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  DollarSign, 
  ShoppingCart,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

interface SalesPoint {
  id: number
  name: string
  location: string
  contact_person: string
  phone: string
  email: string
  is_active: boolean
  created_at: string
  updated_at: string
  total_sales?: number
  total_revenue?: number
  last_sale?: string
}

interface Sale {
  id: number
  customer_name: string
  customer_email: string
  total_amount: number
  status: string
  created_at: string
  items: SaleItem[]
}

interface SaleItem {
  id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface SalesPointDetailsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesPoint: SalesPoint
}

export default function SalesPointDetails({
  open,
  onOpenChange,
  salesPoint
}: SalesPointDetailsProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageSale: 0,
    lastSale: null as string | null
  })

  useEffect(() => {
    if (open) {
      loadSalesData()
    }
  }, [open, salesPoint.id])

  const loadSalesData = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSalesPointSales(salesPoint.id)
      
      if (response.success && response.data) {
        setSales(response.data.sales || [])
        setStats({
          totalSales: response.data.totalSales || 0,
          totalRevenue: response.data.totalRevenue || 0,
          averageSale: response.data.averageSale || 0,
          lastSale: response.data.lastSale
        })
      }
    } catch (error) {
      console.error('Error cargando datos de ventas:', error)
      toast.error('Error al cargar datos de ventas')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Completada</Badge>
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelada</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {salesPoint.name}
          </DialogTitle>
          <DialogDescription>
            Información detallada del punto de venta
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="stats">Estadísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información Básica */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Información Básica
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Estado:</span>
                    <Badge variant={salesPoint.is_active ? 'default' : 'secondary'}>
                      {salesPoint.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salesPoint.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Creado: {formatDate(salesPoint.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Actualizado: {formatDate(salesPoint.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Información de Contacto */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Información de Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salesPoint.contact_person}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salesPoint.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{salesPoint.email}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Historial de Ventas</h3>
              <Button size="sm" variant="outline">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Nueva Venta
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : sales.length > 0 ? (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <Card key={sale.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{sale.customer_name}</h4>
                          <p className="text-sm text-muted-foreground">{sale.customer_email}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(sale.total_amount)}</p>
                          {getStatusBadge(sale.status)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatDate(sale.created_at)}</span>
                        <span>{sale.items.length} producto(s)</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay ventas registradas</h3>
                  <p className="text-muted-foreground">
                    Este punto de venta no tiene ventas registradas aún.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Ventas</p>
                      <p className="text-2xl font-bold">{stats.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">Ingresos Totales</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">Venta Promedio</p>
                      <p className="text-2xl font-bold">{formatCurrency(stats.averageSale)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">Última Venta</p>
                      <p className="text-sm font-bold">
                        {stats.lastSale ? formatDate(stats.lastSale) : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {stats.totalSales > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Actividad</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total de ventas registradas:</span>
                      <span className="font-medium">{stats.totalSales}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ingresos generados:</span>
                      <span className="font-medium">{formatCurrency(stats.totalRevenue)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Valor promedio por venta:</span>
                      <span className="font-medium">{formatCurrency(stats.averageSale)}</span>
                    </div>
                    {stats.lastSale && (
                      <div className="flex justify-between">
                        <span>Última venta:</span>
                        <span className="font-medium">{formatDate(stats.lastSale)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}


