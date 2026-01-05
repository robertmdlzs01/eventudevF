// Sistema de persistencia del carrito para usuarios no autenticados
// Mantiene el carrito durante el proceso de login/registro

export interface CartPersistenceData {
  sessionId: string
  cartData: any
  timestamp: number
  expiresAt: number
}

class CartPersistenceService {
  private readonly STORAGE_KEY = 'eventu_cart_persistence'
  private readonly EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24 horas

  // Guardar carrito antes de redirigir al login
  saveCartBeforeLogin(cart: any, sessionId: string): void {
    try {
      const persistenceData: CartPersistenceData = {
        sessionId,
        cartData: cart,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.EXPIRY_TIME
      }

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(persistenceData))
      
      // También guardar en sessionStorage como respaldo
      sessionStorage.setItem('cart_backup', JSON.stringify(persistenceData))
      
      console.log('🛒 Carrito guardado para persistencia:', cart)
    } catch (error) {
      console.error('Error guardando carrito para persistencia:', error)
    }
  }

  // Recuperar carrito después del login
  getPersistedCart(): CartPersistenceData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return null

      const data: CartPersistenceData = JSON.parse(stored)
      
      // Verificar si ha expirado
      if (Date.now() > data.expiresAt) {
        this.clearPersistedCart()
        return null
      }

      console.log('🛒 Carrito recuperado de persistencia:', data)
      return data
    } catch (error) {
      console.error('Error recuperando carrito persistido:', error)
      return null
    }
  }

  // Limpiar carrito persistido
  clearPersistedCart(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      console.log('🛒 Carrito persistido limpiado')
    } catch (error) {
      console.error('Error limpiando carrito persistido:', error)
    }
  }

  // Verificar si hay carrito persistido
  hasPersistedCart(): boolean {
    return this.getPersistedCart() !== null
  }

  // Restaurar carrito en el servicio
  restoreCart(cartService: any): boolean {
    try {
      const persistedData = this.getPersistedCart()
      if (!persistedData) return false

      // Crear carrito con los datos persistidos
      const restoredCart = cartService.createCart(
        persistedData.cartData.userId,
        persistedData.sessionId
      )

      // Restaurar items
      if (persistedData.cartData.items && persistedData.cartData.items.length > 0) {
        persistedData.cartData.items.forEach((item: any) => {
          cartService.addItem(restoredCart.id, item)
        })
      }

      console.log('🛒 Carrito restaurado exitosamente:', restoredCart)
      return true
    } catch (error) {
      console.error('Error restaurando carrito:', error)
      return false
    }
  }
}

export const cartPersistenceService = new CartPersistenceService()
