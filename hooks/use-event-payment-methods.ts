"use client"

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'

interface PaymentMethodConfig {
  enabled: boolean
  description: string
  processing_time: string
  fees: string
}

interface EventPaymentMethods {
  pse: boolean
  credit_card: boolean
  debit_card: boolean
  daviplata: boolean
  tc_serfinanza: boolean
}

interface EventPaymentMethodsConfig {
  pse: PaymentMethodConfig
  credit_card: PaymentMethodConfig
  debit_card: PaymentMethodConfig
  daviplata: PaymentMethodConfig
  tc_serfinanza: PaymentMethodConfig
}

export function useEventPaymentMethods(eventId?: string) {
  const [paymentMethods, setPaymentMethods] = useState<EventPaymentMethods>({
    pse: true,
    credit_card: true,
    debit_card: true,
    daviplata: true,
    tc_serfinanza: true,
  })
  const [paymentMethodsConfig, setPaymentMethodsConfig] = useState<EventPaymentMethodsConfig>({
    pse: {
      enabled: true,
      description: "Transferencia bancaria directa desde tu cuenta",
      processing_time: "Inmediato",
      fees: "Sin comisión adicional"
    },
    credit_card: {
      enabled: true,
      description: "Visa, Mastercard, Diners Club",
      processing_time: "Inmediato",
      fees: "Sin comisión adicional"
    },
    debit_card: {
      enabled: true,
      description: "Visa, Mastercard, Diners Club",
      processing_time: "Inmediato",
      fees: "Sin comisión adicional"
    },
    daviplata: {
      enabled: true,
      description: "Billetera digital de Davivienda",
      processing_time: "Inmediato",
      fees: "Sin comisión adicional"
    },
    tc_serfinanza: {
      enabled: true,
      description: "Tarjeta de crédito Serfinanza",
      processing_time: "Inmediato",
      fees: "Sin comisión adicional"
    }
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar métodos de pago del evento
  useEffect(() => {
    if (eventId) {
      loadEventPaymentMethods(eventId)
    }
  }, [eventId])

  const loadEventPaymentMethods = async (eventId: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await apiClient.getEvent(parseInt(eventId))
      if (response.success && response.data) {
        const event = response.data
        
        // Cargar métodos de pago si existen
        if (event.payment_methods) {
          setPaymentMethods(event.payment_methods)
        }
        
        // Cargar configuración detallada si existe
        if (event.payment_methods_config) {
          setPaymentMethodsConfig(event.payment_methods_config)
        }
      }
    } catch (err) {
      console.error('Error cargando métodos de pago del evento:', err)
      setError('Error cargando métodos de pago del evento')
    } finally {
      setIsLoading(false)
    }
  }

  // Obtener métodos de pago habilitados
  const getEnabledPaymentMethods = (): string[] => {
    return Object.entries(paymentMethods)
      .filter(([_, enabled]) => enabled)
      .map(([method, _]) => method)
  }

  // Verificar si un método está habilitado
  const isPaymentMethodEnabled = (method: string): boolean => {
    return paymentMethods[method as keyof EventPaymentMethods] || false
  }

  // Obtener configuración de un método específico
  const getPaymentMethodConfig = (method: string): PaymentMethodConfig | null => {
    return paymentMethodsConfig[method as keyof EventPaymentMethodsConfig] || null
  }

  // Obtener métodos de pago disponibles para el carrito
  const getAvailablePaymentMethodsForCart = () => {
    const enabledMethods = getEnabledPaymentMethods()
    
    return enabledMethods.map(method => {
      const config = getPaymentMethodConfig(method)
      return {
        id: method,
        name: getMethodDisplayName(method),
        description: config?.description || '',
        processingTime: config?.processing_time || 'Inmediato',
        fees: config?.fees || 'Sin comisión adicional',
        enabled: true
      }
    })
  }

  // Obtener nombre de display para un método
  const getMethodDisplayName = (method: string): string => {
    const names: { [key: string]: string } = {
      pse: 'PSE - Pagos Seguros en Línea',
      credit_card: 'Tarjetas de Crédito',
      debit_card: 'Tarjetas de Débito',
      daviplata: 'Daviplata',
      tc_serfinanza: 'TC Serfinanza'
    }
    return names[method] || method
  }

  // Obtener icono para un método
  const getMethodIcon = (method: string): string => {
    const icons: { [key: string]: string } = {
      pse: 'Building2',
      credit_card: 'CreditCard',
      debit_card: 'CreditCard',
      daviplata: 'Smartphone',
      tc_serfinanza: 'CreditCard'
    }
    return icons[method] || 'CreditCard'
  }

  // Obtener color para un método
  const getMethodColor = (method: string): string => {
    const colors: { [key: string]: string } = {
      pse: 'blue',
      credit_card: 'green',
      debit_card: 'orange',
      daviplata: 'purple',
      tc_serfinanza: 'red'
    }
    return colors[method] || 'gray'
  }

  return {
    paymentMethods,
    paymentMethodsConfig,
    isLoading,
    error,
    getEnabledPaymentMethods,
    isPaymentMethodEnabled,
    getPaymentMethodConfig,
    getAvailablePaymentMethodsForCart,
    getMethodDisplayName,
    getMethodIcon,
    getMethodColor,
    loadEventPaymentMethods
  }
}

