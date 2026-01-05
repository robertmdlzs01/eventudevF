"use client"

import { useState, useEffect } from 'react'
import { useCart } from './use-cart'
import { apiClient } from '@/lib/api-client'

interface ServiceFeeConfig {
  type: 'percentage' | 'fixed'
  value: number
  description: string
}

interface EventServiceFee {
  [eventId: string]: ServiceFeeConfig
}

export function useServiceFee() {
  const { cart } = useCart()
  const [eventServiceFees, setEventServiceFees] = useState<EventServiceFee>({})
  const [isLoading, setIsLoading] = useState(false)

  // Función para obtener la configuración de tarifa de servicio de un evento
  const getEventServiceFee = async (eventId: string): Promise<ServiceFeeConfig> => {
    try {
      // Verificar si ya tenemos la configuración en caché
      if (eventServiceFees[eventId]) {
        return eventServiceFees[eventId]
      }

      // Obtener la información del evento desde el backend
      const response = await apiClient.getEvent(parseInt(eventId))
      if (response.success && response.data) {
        const event = response.data
        const serviceFeeConfig: ServiceFeeConfig = {
          type: event.service_fee_type || 'percentage',
          value: event.service_fee_value || 5.00,
          description: event.service_fee_description || 'Tarifa de servicio'
        }

        // Guardar en caché
        setEventServiceFees(prev => ({
          ...prev,
          [eventId]: serviceFeeConfig
        }))

        return serviceFeeConfig
      }
    } catch (error) {
      console.error('Error obteniendo configuración de tarifa de servicio:', error)
    }

    // Retornar configuración por defecto si hay error
    return {
      type: 'percentage',
      value: 5.00,
      description: 'Tarifa de servicio'
    }
  }

  // Función para calcular la tarifa de servicio para un monto específico
  const calculateServiceFee = (amount: number, serviceFeeConfig: ServiceFeeConfig): number => {
    if (serviceFeeConfig.type === 'percentage') {
      return amount * (serviceFeeConfig.value / 100)
    } else {
      return serviceFeeConfig.value
    }
  }

  // Función para obtener la tarifa de servicio total del carrito
  const getCartServiceFee = async (): Promise<{
    total: number
    breakdown: Array<{
      eventId: string
      eventTitle: string
      amount: number
      serviceFee: number
      config: ServiceFeeConfig
    }>
  }> => {
    setIsLoading(true)
    let totalServiceFee = 0
    const breakdown: Array<{
      eventId: string
      eventTitle: string
      amount: number
      serviceFee: number
      config: ServiceFeeConfig
    }> = []

    try {
      // Agrupar items por evento
      const eventGroups: { [eventId: string]: { items: any[], total: number } } = {}
      
      cart?.items.forEach(item => {
        if (item.eventId) {
          if (!eventGroups[item.eventId]) {
            eventGroups[item.eventId] = { items: [], total: 0 }
          }
          eventGroups[item.eventId].items.push(item)
          eventGroups[item.eventId].total += (item.price || 0) * (item.quantity || 1)
        }
      })

      // Calcular tarifa de servicio para cada evento
      for (const [eventId, group] of Object.entries(eventGroups)) {
        const serviceFeeConfig = await getEventServiceFee(eventId)
        const serviceFee = calculateServiceFee(group.total, serviceFeeConfig)
        
        totalServiceFee += serviceFee
        breakdown.push({
          eventId,
          eventTitle: group.items[0]?.eventTitle || 'Evento',
          amount: group.total,
          serviceFee,
          config: serviceFeeConfig
        })
      }
    } catch (error) {
      console.error('Error calculando tarifa de servicio del carrito:', error)
    } finally {
      setIsLoading(false)
    }

    return { total: totalServiceFee, breakdown }
  }

  // Función para obtener la descripción de la tarifa de servicio
  const getServiceFeeDescription = (serviceFeeConfig: ServiceFeeConfig): string => {
    if (serviceFeeConfig.type === 'percentage') {
      return `${serviceFeeConfig.description} (${serviceFeeConfig.value}%)`
    } else {
      return `${serviceFeeConfig.description} ($${serviceFeeConfig.value.toLocaleString()})`
    }
  }

  return {
    getEventServiceFee,
    calculateServiceFee,
    getCartServiceFee,
    getServiceFeeDescription,
    isLoading,
    eventServiceFees
  }
}

