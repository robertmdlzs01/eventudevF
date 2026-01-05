"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Plus, 
  Search, 
  MapPin, 
  Users, 
  ShoppingCart, 
  Settings,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  Download,
  Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'
import CreateSalesPointDialog from './CreateSalesPointDialog'
import EditSalesPointDialog from './EditSalesPointDialog'
import SalesPointDetails from './SalesPointDetails'
import DirectSalesDialog from './DirectSalesDialog'
import UserPrivilegesDialog from './UserPrivilegesDialog'

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

interface SalesPointStats {
  total: number
  active: number
  inactive: number
  totalSales: number
  totalRevenue: number
}

export default function SalesPointsPageClient() {
  const [salesPoints, setSalesPoints] = useState<SalesPoint[]>([])
  const [filteredSalesPoints, setFilteredSalesPoints] = useState<SalesPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_sales'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedSalesPoint, setSelectedSalesPoint] = useState<SalesPoint | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [showDirectSales, setShowDirectSales] = useState(false)
  const [showUserPrivileges, setShowUserPrivileges] = useState(false)
  const [stats, setStats] = useState<SalesPointStats>({
    total: 0,
    active: 0,
    inactive: 0,
    totalSales: 0,
    totalRevenue: 0
  })

  // Cargar datos iniciales
  useEffect(() => {
    loadSalesPoints()
  }, [])

  // Filtrar y ordenar datos
  useEffect(() => {
    let filtered = salesPoints

    // Filtrar por término de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(sp =>
        sp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sp.phone.includes(searchTerm) ||
        sp.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtrar por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sp => 
        statusFilter === 'active' ? sp.is_active : !sp.is_active
      )
    }

    // Ordenar
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'created_at':
          aValue = new Date(a.created_at)
          bValue = new Date(b.created_at)
          break
        case 'total_sales':
          aValue = a.total_sales || 0
          bValue = b.total_sales || 0
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredSalesPoints(filtered)
  }, [salesPoints, searchTerm, statusFilter, sortBy, sortOrder])

  const loadSalesPoints = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getSalesPoints()
      
      if (response.success && response.data) {
        setSalesPoints(response.data)
        
        // Calcular estadísticas
        const total = response.data.length
        const active = response.data.filter((sp: any) => sp.is_active).length
        const inactive = total - active
        const totalSales = response.data.reduce((sum: number, sp: any) => sum + (sp.total_sales || 0), 0)
        const totalRevenue = response.data.reduce((sum: number, sp: any) => sum + (sp.total_revenue || 0), 0)
        
        setStats({ total, active, inactive, totalSales, totalRevenue })
      }
    } catch (error) {
      console.error('Error cargando puntos de venta:', error)
      toast.error('Error al cargar puntos de venta')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateSalesPoint = async (data: any) => {
    try {
      const response = await apiClient.createSalesPoint(data)
      
      if (response.success) {
        toast.success('Punto de venta creado exitosamente')
        setShowCreateDialog(false)
        loadSalesPoints()
      } else {
        toast.error(response.error || 'Error al crear punto de venta')
      }
    } catch (error) {
      console.error('Error creando punto de venta:', error)
      toast.error('Error al crear punto de venta')
    }
  }

  const handleEditSalesPoint = async (id: number, data: any) => {
    try {
      const response = await apiClient.updateSalesPoint(id, data)
      
      if (response.success) {
        toast.success('Punto de venta actualizado exitosamente')
        setShowEditDialog(false)
        setSelectedSalesPoint(null)
        loadSalesPoints()
      } else {
        toast.error(response.error || 'Error al actualizar punto de venta')
      }
    } catch (error) {
      console.error('Error actualizando punto de venta:', error)
      toast.error('Error al actualizar punto de venta')
    }
  }

  const handleDeleteSalesPoint = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este punto de venta?')) {
      return
    }

    try {
      const response = await apiClient.deleteSalesPoint(id)
      
      if (response.success) {
        toast.success('Punto de venta eliminado exitosamente')
        loadSalesPoints()
      } else {
        toast.error(response.error || 'Error al eliminar punto de venta')
      }
    } catch (error) {
      console.error('Error eliminando punto de venta:', error)
      toast.error('Error al eliminar punto de venta')
    }
  }

  const handleDirectSale = async (data: any) => {
    try {
      const response = await apiClient.createDirectSale(data)
      
      if (response.success) {
        toast.success('Venta registrada exitosamente')
        setShowDirectSales(false)
        loadSalesPoints()
      } else {
        toast.error(response.error || 'Error al registrar venta')
      }
    } catch (error) {
      console.error('Error registrando venta:', error)
      toast.error('Error al registrar venta')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Puntos de Venta</h1>
          <p className="text-muted-foreground">
            Gestiona los puntos de venta y realiza ventas directas
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowUserPrivileges(true)} variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Privilegios
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Punto de Venta
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Activos</p>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Settings className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Inactivos</p>
                <p className="text-2xl font-bold">{stats.inactive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Ventas</p>
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
                <p className="text-sm font-medium">Ingresos</p>
                <p className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar puntos de venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="name">Nombre</option>
                <option value="created_at">Fecha</option>
                <option value="total_sales">Ventas</option>
              </select>
              <Button
                variant="outline"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de puntos de venta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSalesPoints.map((salesPoint) => (
          <Card key={salesPoint.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{salesPoint.name}</CardTitle>
                <Badge variant={salesPoint.is_active ? 'default' : 'secondary'}>
                  {salesPoint.is_active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{salesPoint.location}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{salesPoint.phone}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{salesPoint.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{new Date(salesPoint.created_at).toLocaleDateString()}</span>
              </div>
              
              {salesPoint.total_sales && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm font-medium">Ventas: {salesPoint.total_sales}</span>
                  <span className="text-sm font-medium text-green-600">
                    ${(salesPoint.total_revenue || 0).toLocaleString()}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSalesPoint(salesPoint)
                    setShowDetails(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSalesPoint(salesPoint)
                    setShowEditDialog(true)
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedSalesPoint(salesPoint)
                    setShowDirectSales(true)
                  }}
                >
                  <ShoppingCart className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteSalesPoint(salesPoint.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSalesPoints.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay puntos de venta</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No se encontraron puntos de venta con los filtros aplicados.' : 'Crea tu primer punto de venta para comenzar.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Crear Punto de Venta
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Diálogos */}
      {showCreateDialog && (
        <CreateSalesPointDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSave={handleCreateSalesPoint}
        />
      )}

      {showEditDialog && selectedSalesPoint && (
        <EditSalesPointDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          salesPoint={selectedSalesPoint}
          onSave={(data) => handleEditSalesPoint(selectedSalesPoint.id, data)}
        />
      )}

      {showDetails && selectedSalesPoint && (
        <SalesPointDetails
          open={showDetails}
          onOpenChange={setShowDetails}
          salesPoint={selectedSalesPoint}
        />
      )}

      {showDirectSales && selectedSalesPoint && (
        <DirectSalesDialog
          open={showDirectSales}
          onOpenChange={setShowDirectSales}
          salesPoint={selectedSalesPoint}
          onSave={handleDirectSale}
        />
      )}

      {showUserPrivileges && (
        <UserPrivilegesDialog
          open={showUserPrivileges}
          onOpenChange={setShowUserPrivileges}
        />
      )}
    </div>
  )
}

