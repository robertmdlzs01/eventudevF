// Hook de Carrito de Compras basado en WordPress
// Gestión de estado del carrito con funcionalidades del POS

'use client'

import { useState, useEffect, useCallback } from 'react'
import { cartService, Cart, CartItem, CartDiscount } from '@/lib/cart-service'
import { cartPersistenceService } from '@/lib/cart-persistence'

export interface UseCartReturn {
  // Estado del carrito
  cart: Cart | null
  items: CartItem[]
  itemCount: number
  subtotal: number
  tax: number
  total: number
  discount: number
  discountCode?: string
  fees: {
    serviceFee: number
    processingFee: number
    convenienceFee: number
  }
  
  // Acciones del carrito
  addItem: (item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>
  updateQuantity: (itemId: string, quantity: number) => Promise<boolean>
  removeItem: (itemId: string) => Promise<boolean>
  clearCart: () => Promise<boolean>
  restoreFromPersistence: (persistedData: any) => Promise<boolean>
  
  // Descuentos
  applyDiscount: (code: string) => Promise<boolean>
  removeDiscount: () => Promise<boolean>
  validateDiscountCode: (code: string) => { isValid: boolean; discount?: CartDiscount; error?: string }
  
  // Validación y compra
  validateCart: () => { isValid: boolean; errors: string[] }
  completePurchase: (paymentData: any) => Promise<{ success: boolean; orderId?: string; errors: string[] }>
  
  // Estado de carga
  isLoading: boolean
  error: string | null
  
  // Estadísticas
  stats: {
    activeCarts: number
    abandonedCarts: number
    completedCarts: number
    totalRevenue: number
    averageCartValue: number
  }
}

export function useCart(sessionId?: string): UseCartReturn {
  const [cart, setCart] = useState<Cart | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Obtener sessionId del sessionStorage si no se proporciona
  const getSessionId = () => {
    if (sessionId) return sessionId
    
    let currentSessionId = sessionStorage.getItem('cart-session-id')
    if (!currentSessionId) {
      currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('cart-session-id', currentSessionId)
    }
    return currentSessionId
  }

  // Inicializar carrito
  useEffect(() => {
    const initializeCart = async () => {
      setIsLoading(true)
      try {
        const currentSessionId = getSessionId()
        let currentCart: Cart | null = null

        // Buscar carrito existente por sesión
        currentCart = cartService.getCartBySession(currentSessionId) || null

        if (!currentCart) {
          // Verificar si hay carrito persistido
          const persistedData = cartPersistenceService.getPersistedCart()
          if (persistedData) {
            console.log('🛒 Restaurando carrito persistido...')
            // Crear carrito con datos persistidos
            currentCart = cartService.createCart(undefined, currentSessionId)
            
            // Restaurar items del carrito persistido
            if (persistedData.cartData.items && persistedData.cartData.items.length > 0) {
              console.log('🛒 Restaurando items:', persistedData.cartData.items.length)
              
              // Restaurar cada item
              for (const item of persistedData.cartData.items) {
                const success = cartService.addItem(currentCart!.id, item)
                console.log(`🛒 Item restaurado: ${item.productName} - ${success ? 'Exitoso' : 'Falló'}`)
              }
              
              // Obtener el carrito actualizado después de restaurar todos los items
              currentCart = cartService.getCart(currentCart!.id) || null
              console.log('🛒 Carrito actualizado después de restaurar:', currentCart?.items.length, 'items')
            }
            
            // Limpiar carrito persistido después de restaurar
            cartPersistenceService.clearPersistedCart()
          } else {
            // Crear nuevo carrito si no existe
            currentCart = cartService.createCart(undefined, currentSessionId)
          }
        }

        setCart(currentCart)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error inicializando carrito')
      } finally {
        setIsLoading(false)
      }
    }

    initializeCart()
  }, [sessionId])

  // Agregar item al carrito
  const addItem = useCallback(async (item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      let currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) {
        currentCart = cartService.createCart(undefined, currentSessionId)
      }

      const success = cartService.addItem(currentCart.id, item)
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        if (updatedCart) {
          setCart(updatedCart)
        }
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error agregando item al carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Actualizar cantidad de item
  const updateQuantity = useCallback(async (itemId: string, quantity: number): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      let currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) {
        console.log('No se encontró carrito, creando uno nuevo')
        currentCart = cartService.createCart(undefined, currentSessionId)
      }

      console.log('Actualizando cantidad:', { itemId, quantity, cartId: currentCart.id })
      const success = cartService.updateItemQuantity(currentCart.id, itemId, quantity)
      console.log('Resultado de actualización:', success)
      
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        console.log('Carrito actualizado:', updatedCart)
        if (updatedCart) {
          setCart(updatedCart)
          // Forzar re-render
          setTimeout(() => {
            const refreshedCart = cartService.getCart(currentCart.id)
            if (refreshedCart) {
              setCart(refreshedCart)
            }
          }, 100)
        }
      }
      return success
    } catch (err) {
      console.error('Error actualizando cantidad:', err)
      setError(err instanceof Error ? err.message : 'Error actualizando cantidad')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remover item del carrito
  const removeItem = useCallback(async (itemId: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      let currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) {
        console.log('No se encontró carrito para remover item')
        return false
      }

      console.log('Removiendo item:', { itemId, cartId: currentCart.id })
      const success = cartService.removeItem(currentCart.id, itemId)
      console.log('Resultado de remoción:', success)
      
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        console.log('Carrito después de remover:', updatedCart)
        if (updatedCart) {
          setCart(updatedCart)
          // Forzar re-render
          setTimeout(() => {
            const refreshedCart = cartService.getCart(currentCart.id)
            if (refreshedCart) {
              setCart(refreshedCart)
            }
          }, 100)
        }
      }
      return success
    } catch (err) {
      console.error('Error removiendo item:', err)
      setError(err instanceof Error ? err.message : 'Error removiendo item del carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Limpiar carrito
  const clearCart = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      let currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) {
        console.log('No se encontró carrito para limpiar')
        return false
      }

      console.log('Limpiando carrito:', { cartId: currentCart.id })
      const success = cartService.clearCart(currentCart.id)
      console.log('Resultado de limpieza:', success)
      
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        console.log('Carrito después de limpiar:', updatedCart)
        if (updatedCart) {
          setCart(updatedCart)
          // Forzar re-render
          setTimeout(() => {
            const refreshedCart = cartService.getCart(currentCart.id)
            if (refreshedCart) {
              setCart(refreshedCart)
            }
          }, 100)
        }
      }
      return success
    } catch (err) {
      console.error('Error limpiando carrito:', err)
      setError(err instanceof Error ? err.message : 'Error limpiando carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Restaurar carrito desde persistencia
  const restoreFromPersistence = useCallback(async (persistedData: any): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      
      // Crear nuevo carrito con los datos persistidos
      const restoredCart = cartService.createCart(
        persistedData.userId || 'anonymous',
        currentSessionId
      )

      if (!restoredCart) {
        setError('Error creando carrito restaurado')
        return false
      }

      // Restaurar items
      if (persistedData.items && persistedData.items.length > 0) {
        for (const item of persistedData.items) {
          const success = cartService.addItem(restoredCart.id, {
            productId: item.productId,
            productName: item.productName,
            productType: item.productType,
            eventName: item.eventName,
            ticketType: item.ticketType,
            price: item.price,
            quantity: item.quantity,
            seatNumber: item.seatNumber,
            eventId: item.eventId,
            subtotal: item.price * item.quantity,
            tax: 0,
            total: item.price * item.quantity,
            metadata: item.metadata || {}
          })
          
          if (!success) {
            console.warn('Error restaurando item:', item)
          }
        }
      }

      // Actualizar estado
      const updatedCart = cartService.getCart(restoredCart.id)
      if (updatedCart) {
        setCart(updatedCart)
        console.log('🛒 Carrito restaurado exitosamente:', updatedCart)
        return true
      }

      return false
    } catch (err) {
      console.error('Error restaurando carrito:', err)
      setError(err instanceof Error ? err.message : 'Error restaurando carrito')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Aplicar descuento
  const applyDiscount = useCallback(async (code: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      const currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) return false

      const success = cartService.applyDiscount(currentCart.id, code)
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        if (updatedCart) {
          setCart(updatedCart)
        }
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error aplicando descuento')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remover descuento
  const removeDiscount = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      const currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) return false

      const success = cartService.removeDiscount(currentCart.id)
      if (success) {
        const updatedCart = cartService.getCart(currentCart.id)
        if (updatedCart) {
          setCart(updatedCart)
        }
      }
      return success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removiendo descuento')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Validar código de descuento
  const validateDiscountCode = useCallback((code: string): { isValid: boolean; discount?: CartDiscount; error?: string } => {
    return cartService.validateDiscountCode(code)
  }, [])

  // Validar carrito
  const validateCart = useCallback((): { isValid: boolean; errors: string[] } => {
    const currentSessionId = getSessionId()
    const currentCart = cartService.getCartBySession(currentSessionId)
    
    if (!currentCart) return { isValid: false, errors: ['Carrito no encontrado'] }
    return cartService.validateCart(currentCart.id)
  }, [])

  // Completar compra
  const completePurchase = useCallback(async (paymentData: any): Promise<{ success: boolean; orderId?: string; errors: string[] }> => {
    setIsLoading(true)
    setError(null)

    try {
      const currentSessionId = getSessionId()
      const currentCart = cartService.getCartBySession(currentSessionId)
      
      if (!currentCart) return { success: false, errors: ['Carrito no encontrado'] }

      const result = cartService.completePurchase(currentCart.id, paymentData)
      if (result.success) {
        const updatedCart = cartService.getCart(currentCart.id)
        if (updatedCart) {
          setCart(updatedCart)
        }
      }
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error completando compra'
      setError(errorMessage)
      return { success: false, errors: [errorMessage] }
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Obtener estadísticas
  const stats = cartService.getCartStats()

  return {
    // Estado del carrito
    cart,
    items: cart?.items || [],
    itemCount: cart?.items.reduce((sum, item) => sum + item.quantity, 0) || 0,
    subtotal: cart?.subtotal || 0,
    tax: cart?.tax || 0,
    total: cart?.total || 0,
    discount: cart?.discount || 0,
    discountCode: cart?.discountCode,
    fees: cart?.fees || {
      serviceFee: 0,
      processingFee: 0,
      convenienceFee: 0
    },
    
    // Acciones del carrito
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    restoreFromPersistence,
    
    // Descuentos
    applyDiscount,
    removeDiscount,
    validateDiscountCode,
    
    // Validación y compra
    validateCart,
    completePurchase,
    
    // Estado de carga
    isLoading,
    error,
    
    // Estadísticas
    stats
  }
}

// Hook para gestión de descuentos
export function useDiscounts() {
  const [discounts, setDiscounts] = useState<CartDiscount[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadDiscounts = () => {
      setIsLoading(true)
      try {
        const availableDiscounts = cartService.getAvailableDiscounts()
        setDiscounts(availableDiscounts)
      } catch (err) {
        console.error('Error cargando descuentos:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadDiscounts()
  }, [])

  return {
    discounts,
    isLoading,
    validateCode: cartService.validateDiscountCode.bind(cartService)
  }
}

// Hook para configuración del carrito
export function useCartSettings() {
  const [settings, setSettings] = useState(cartService.getSettings())

  const updateSettings = useCallback((newSettings: Partial<typeof settings>) => {
    cartService.updateSettings(newSettings)
    setSettings(cartService.getSettings())
  }, [])

  return {
    settings,
    updateSettings
  }
}