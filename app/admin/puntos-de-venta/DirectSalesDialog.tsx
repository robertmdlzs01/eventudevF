"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign, 
  User, 
  Mail, 
  Phone,
  CheckCircle,
  Package
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
}

interface Product {
  id: number
  name: string
  price: number
  stock: number
  category: string
}

interface SaleItem {
  product_id: number
  product_name: string
  quantity: number
  unit_price: number
  total_price: number
}

interface DirectSalesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  salesPoint: SalesPoint
  onSave: (data: any) => void
}

export default function DirectSalesDialog({
  open,
  onOpenChange,
  salesPoint,
  onSave
}: DirectSalesDialogProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [saleItems, setSaleItems] = useState<SaleItem[]>([])
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    document: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  const loadProducts = async () => {
    try {
      const response = await apiClient.getProducts()
      if (response.success && response.data) {
        setProducts(response.data)
      }
    } catch (error) {
      console.error('Error cargando productos:', error)
      toast.error('Error al cargar productos')
    }
  }

  const addProductToSale = (product: Product) => {
    const existingItem = saleItems.find(item => item.product_id === product.id)
    
    if (existingItem) {
      // Si el producto ya está en la venta, aumentar cantidad
      updateItemQuantity(product.id, existingItem.quantity + 1)
    } else {
      // Agregar nuevo producto a la venta
      const newItem: SaleItem = {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        total_price: product.price
      }
      setSaleItems([...saleItems, newItem])
    }
  }

  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromSale(productId)
      return
    }

    setSaleItems(items =>
      items.map(item =>
        item.product_id === productId
          ? {
              ...item,
              quantity: newQuantity,
              total_price: newQuantity * item.unit_price
            }
          : item
      )
    )
  }

  const removeItemFromSale = (productId: number) => {
    setSaleItems(items => items.filter(item => item.product_id !== productId))
  }

  const getTotalAmount = () => {
    return saleItems.reduce((total, item) => total + item.total_price, 0)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!customerData.name.trim()) {
      newErrors.name = 'El nombre del cliente es requerido'
    }

    if (!customerData.email.trim()) {
      newErrors.email = 'El email del cliente es requerido'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      newErrors.email = 'Formato de email inválido'
    }

    if (!customerData.phone.trim()) {
      newErrors.phone = 'El teléfono del cliente es requerido'
    }

    if (saleItems.length === 0) {
      newErrors.items = 'Debe agregar al menos un producto a la venta'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Por favor, corrige los errores en el formulario')
      return
    }

    setLoading(true)
    try {
      const saleData = {
        sales_point_id: salesPoint.id,
        customer: customerData,
        items: saleItems,
        total_amount: getTotalAmount(),
        payment_method: 'cash',
        status: 'completed'
      }

      await onSave(saleData)
      
      // Limpiar formulario
      setSaleItems([])
      setCustomerData({
        name: '',
        email: '',
        phone: '',
        document: ''
      })
      setErrors({})
    } catch (error) {
      console.error('Error registrando venta:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setCustomerData(prev => ({ ...prev, [field]: value }))
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Venta Directa - {salesPoint.name}
          </DialogTitle>
          <DialogDescription>
            Registra una nueva venta en este punto de venta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Información del Cliente */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="customer_name">Nombre Completo *</Label>
                  <Input
                    id="customer_name"
                    value={customerData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Nombre completo del cliente"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customer_email">Email *</Label>
                  <Input
                    id="customer_email"
                    type="email"
                    value={customerData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="cliente@email.com"
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customer_phone">Teléfono *</Label>
                  <Input
                    id="customer_phone"
                    value={customerData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+57 300 123 4567"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-500 mt-1">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="customer_document">Documento (Opcional)</Label>
                  <Input
                    id="customer_document"
                    value={customerData.document}
                    onChange={(e) => handleInputChange('document', e.target.value)}
                    placeholder="CC, CE, etc."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Productos Disponibles */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos Disponibles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 border rounded-md hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {product.category} • Stock: {product.stock}
                        </p>
                        <p className="text-sm font-semibold text-green-600">
                          ${product.price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => addProductToSale(product)}
                        disabled={product.stock === 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items de la Venta */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Items de la Venta
              </CardTitle>
            </CardHeader>
            <CardContent>
              {saleItems.length > 0 ? (
                <div className="space-y-2">
                  {saleItems.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ${item.unit_price.toLocaleString()} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => updateItemQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <span className="w-20 text-right font-semibold">
                          ${item.total_price.toLocaleString()}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          onClick={() => removeItemFromSale(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">
                        ${getTotalAmount().toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                  <p>No hay productos en la venta</p>
                  <p className="text-sm">Agrega productos desde la lista de productos disponibles</p>
                </div>
              )}
              
              {errors.items && (
                <p className="text-sm text-red-500 mt-2">{errors.items}</p>
              )}
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || saleItems.length === 0}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Registrando...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Registrar Venta
                </div>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


