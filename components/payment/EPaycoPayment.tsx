'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CreditCard, Shield, CheckCircle, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/api-client'

interface EPaycoPaymentProps {
  amount: number
  currency?: string
  description: string
  eventId: string
  ticketIds: string[]
  onSuccess: (transactionData: any) => void
  onError: (error: string) => void
  onCancel: () => void
}

interface CustomerInfo {
  name: string
  email: string
  phone: string
  address: string
}

interface EPaycoConfig {
  publicKey: string
  isSandbox: boolean
  confirmUrl: string
  responseUrl: string
  cancelUrl: string
  customerId: string
}

export default function EPaycoPayment({
  amount,
  currency = 'COP',
  description,
  eventId,
  ticketIds,
  onSuccess,
  onError,
  onCancel
}: EPaycoPaymentProps) {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: ''
  })
  const [epaycoConfig, setEpaycoConfig] = useState<EPaycoConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [configLoading, setConfigLoading] = useState(true)
  const [errors, setErrors] = useState<string[]>([])

  // Cargar configuración de ePayco
  useEffect(() => {
    const loadEPaycoConfig = async () => {
      try {
        const response = await apiClient.getEPaycoConfig()
        if (response.success) {
          setEpaycoConfig(response.data)
        } else {
          onError('Error cargando configuración de pago')
        }
      } catch (error) {
        console.error('Error cargando configuración ePayco:', error)
        onError('Error cargando configuración de pago')
      } finally {
        setConfigLoading(false)
      }
    }

    loadEPaycoConfig()
  }, [onError])

  // Validar información del cliente
  const validateCustomerInfo = (): string[] => {
    const newErrors: string[] = []

    if (!customerInfo.name.trim()) {
      newErrors.push('El nombre es requerido')
    }

    if (!customerInfo.email.trim()) {
      newErrors.push('El email es requerido')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.push('El email no es válido')
    }

    if (!customerInfo.phone.trim()) {
      newErrors.push('El teléfono es requerido')
    }

    if (!customerInfo.address.trim()) {
      newErrors.push('La dirección es requerida')
    }

    return newErrors
  }

  // Procesar pago
  const handlePayment = async () => {
    setLoading(true)
    setErrors([])

    // Validar información
    const validationErrors = validateCustomerInfo()
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      const response = await apiClient.createEPaycoTransaction({
        amount,
        currency,
        description,
        eventId,
        ticketIds,
        customerInfo
      })

      if (response.success) {
        const { data } = response
        
        if (data.sandbox) {
          // En modo sandbox, simular éxito
          setTimeout(() => {
            onSuccess({
              transactionId: data.transactionId,
              saleId: data.saleId,
              amount: data.amount,
              currency: data.currency,
              sandbox: true
            })
          }, 2000)
        } else {
          // En producción, redirigir a ePayco
          if (data.redirectUrl) {
            window.location.href = data.redirectUrl
          } else {
            onSuccess({
              transactionId: data.transactionId,
              saleId: data.saleId,
              amount: data.amount,
              currency: data.currency,
              sandbox: false
            })
          }
        }
      } else {
        onError(response.message || 'Error procesando el pago')
      }
    } catch (error: any) {
      console.error('Error procesando pago:', error)
      onError(error.message || 'Error procesando el pago')
    } finally {
      setLoading(false)
    }
  }

  if (configLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando configuración de pago...</span>
        </CardContent>
      </Card>
    )
  }

  if (!epaycoConfig) {
    return (
      <Alert>
        <XCircle className="h-4 w-4" />
        <AlertDescription>
          Error cargando la configuración de pago. Por favor, inténtalo de nuevo.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Información del pago */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Resumen del Pago
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Descripción:</span>
              <span className="font-medium">{description}</span>
            </div>
            <div className="flex justify-between">
              <span>Cantidad de tickets:</span>
              <span className="font-medium">{ticketIds.length}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: currency
                }).format(amount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información de Facturación</CardTitle>
          <CardDescription>
            Completa tus datos para procesar el pago
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nombre completo *</Label>
              <Input
                id="name"
                type="text"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                placeholder="Tu nombre completo"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={customerInfo.email}
                onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                placeholder="tu@email.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                type="tel"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                placeholder="+57 300 123 4567"
                required
              />
            </div>
            <div>
              <Label htmlFor="address">Dirección *</Label>
              <Input
                id="address"
                type="text"
                value={customerInfo.address}
                onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                placeholder="Tu dirección completa"
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Errores */}
      {errors.length > 0 && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Información de seguridad */}
      {epaycoConfig.isSandbox && (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo Sandbox:</strong> Este es un entorno de pruebas. 
            No se realizarán cargos reales a tu tarjeta.
          </AlertDescription>
        </Alert>
      )}

      {/* Botones de acción */}
      <div className="flex gap-4">
        <Button
          onClick={handlePayment}
          disabled={loading}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Procesando pago...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Pagar con ePayco
            </>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
      </div>

      {/* Información adicional */}
      <div className="text-sm text-muted-foreground text-center">
        <p>
          Al continuar, serás redirigido a ePayco para completar tu pago de forma segura.
        </p>
        <p className="mt-1">
          Aceptamos tarjetas de crédito y débito, PSE, y otros métodos de pago.
        </p>
      </div>
    </div>
  )
}
