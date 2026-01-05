// Sistema de Carrito de Compras basado en WordPress
// Gestión avanzada de carrito con funcionalidades del POS

export interface CartItem {
  id: string
  productId: number
  productName: string
  productType: 'ticket' | 'merchandise' | 'service'
  eventId?: number
  eventName?: string
  ticketType?: string
  seatNumber?: string
  price: number
  quantity: number
  subtotal: number
  tax: number
  total: number
  metadata: {
    eventDate?: string
    eventLocation?: string
    seatSection?: string
    gate?: string
    restrictions?: string[]
    imageUrl?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Cart {
  id: string
  userId?: number
  sessionId: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  discount: number
  discountCode?: string
  shipping?: number
  fees: {
    serviceFee: number
    processingFee: number
    convenienceFee: number
  }
  paymentMethod?: string
  status: 'active' | 'abandoned' | 'completed' | 'expired'
  expiresAt: Date
  createdAt: Date
  updatedAt: Date
}

export interface CartDiscount {
  code: string
  type: 'percentage' | 'fixed'
  value: number
  minAmount?: number
  maxDiscount?: number
  validUntil?: Date
  usageLimit?: number
  usedCount: number
  isActive: boolean
}

export interface CartSettings {
  maxItems: number
  expirationTime: number // en minutos
  allowMultipleEvents: boolean
  requireSeatSelection: boolean
  autoApplyDiscounts: boolean
  showTaxBreakdown: boolean
  enableWishlist: boolean
}

class CartService {
  private carts: Map<string, Cart> = new Map()
  private discounts: Map<string, CartDiscount> = new Map()
  private settings: CartSettings = {
    maxItems: 10,
    expirationTime: 30, // 30 minutos
    allowMultipleEvents: true,
    requireSeatSelection: true,
    autoApplyDiscounts: true,
    showTaxBreakdown: true,
    enableWishlist: true
  }

  constructor() {
    this.initializeDiscounts()
  }

  // Inicializar descuentos del sistema
  private initializeDiscounts(): void {
    const defaultDiscounts: CartDiscount[] = [
      {
        code: 'EARLYBIRD',
        type: 'percentage',
        value: 10,
        minAmount: 50000,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        usageLimit: 100,
        usedCount: 0,
        isActive: true
      },
      {
        code: 'STUDENT',
        type: 'percentage',
        value: 15,
        minAmount: 30000,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
        usageLimit: 50,
        usedCount: 0,
        isActive: true
      },
      {
        code: 'FIRSTTIME',
        type: 'fixed',
        value: 20000,
        minAmount: 100000,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        usageLimit: 20,
        usedCount: 0,
        isActive: true
      }
    ]

    defaultDiscounts.forEach(discount => {
      this.discounts.set(discount.code, discount)
    })
  }

  // Crear nuevo carrito
  createCart(userId?: number, sessionId?: string): Cart {
    const cartId = this.generateId()
    const cart: Cart = {
      id: cartId,
      userId,
      sessionId: sessionId || this.generateId(),
      items: [],
      subtotal: 0,
      tax: 0,
      total: 0,
      discount: 0,
      fees: {
        serviceFee: 0,
        processingFee: 0,
        convenienceFee: 0
      },
      status: 'active',
      expiresAt: new Date(Date.now() + this.settings.expirationTime * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.carts.set(cartId, cart)
    return cart
  }

  // Obtener carrito
  getCart(cartId: string): Cart | undefined {
    return this.carts.get(cartId)
  }

  // Obtener carrito por sesión
  getCartBySession(sessionId: string): Cart | undefined {
    for (const cart of this.carts.values()) {
      if (cart.sessionId === sessionId && cart.status === 'active') {
        return cart
      }
    }
    return undefined
  }

  // Agregar item al carrito
  addItem(cartId: string, item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    // Verificar límite de items
    if (cart.items.length >= this.settings.maxItems) {
      throw new Error('Límite de items en el carrito alcanzado')
    }

    // Verificar si ya existe el item
    const existingItem = cart.items.find(i => 
      i.productId === item.productId && 
      i.seatNumber === item.seatNumber &&
      i.eventId === item.eventId
    )

    if (existingItem) {
      // Actualizar cantidad
      existingItem.quantity += item.quantity
      existingItem.subtotal = existingItem.price * existingItem.quantity
      existingItem.total = existingItem.subtotal + existingItem.tax
    } else {
      // Agregar nuevo item
      const newItem: CartItem = {
        ...item,
        id: this.generateId(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
      cart.items.push(newItem)
    }

    this.recalculateCart(cart)
    return true
  }

  // Actualizar cantidad de item
  updateItemQuantity(cartId: string, itemId: string, quantity: number): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    const item = cart.items.find(i => i.id === itemId)
    if (!item) {
      return false
    }

    if (quantity <= 0) {
      return this.removeItem(cartId, itemId)
    }

    item.quantity = quantity
    item.subtotal = item.price * item.quantity
    item.total = item.subtotal + item.tax
    item.updatedAt = new Date()

    this.recalculateCart(cart)
    return true
  }

  // Remover item del carrito
  removeItem(cartId: string, itemId: string): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    const itemIndex = cart.items.findIndex(i => i.id === itemId)
    if (itemIndex === -1) {
      return false
    }

    cart.items.splice(itemIndex, 1)
    this.recalculateCart(cart)
    return true
  }

  // Limpiar carrito
  clearCart(cartId: string): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    cart.items = []
    this.recalculateCart(cart)
    return true
  }

  // Aplicar descuento
  applyDiscount(cartId: string, discountCode: string): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    const discount = this.discounts.get(discountCode)
    if (!discount || !discount.isActive) {
      return false
    }

    // Verificar fecha de expiración
    if (discount.validUntil && new Date() > discount.validUntil) {
      return false
    }

    // Verificar límite de uso
    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return false
    }

    // Verificar monto mínimo
    if (discount.minAmount && cart.subtotal < discount.minAmount) {
      return false
    }

    // Calcular descuento
    let discountAmount = 0
    if (discount.type === 'percentage') {
      discountAmount = (cart.subtotal * discount.value) / 100
    } else {
      discountAmount = discount.value
    }

    // Aplicar descuento máximo
    if (discount.maxDiscount && discountAmount > discount.maxDiscount) {
      discountAmount = discount.maxDiscount
    }

    cart.discount = discountAmount
    cart.discountCode = discountCode
    this.recalculateCart(cart)
    return true
  }

  // Remover descuento
  removeDiscount(cartId: string): boolean {
    const cart = this.carts.get(cartId)
    if (!cart || cart.status !== 'active') {
      return false
    }

    cart.discount = 0
    cart.discountCode = undefined
    this.recalculateCart(cart)
    return true
  }

  // Recalcular totales del carrito
  private recalculateCart(cart: Cart): void {
    // Calcular subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + item.subtotal, 0)

    // Calcular impuestos (19% en Colombia)
    cart.tax = cart.subtotal * 0.19

    // Calcular comisiones
    cart.fees.serviceFee = cart.subtotal * 0.03 // 3% comisión de servicio
    cart.fees.processingFee = cart.subtotal * 0.02 // 2% comisión de procesamiento
    cart.fees.convenienceFee = cart.subtotal * 0.01 // 1% comisión de conveniencia

    // Calcular total
    const feesTotal = cart.fees.serviceFee + cart.fees.processingFee + cart.fees.convenienceFee
    cart.total = cart.subtotal + cart.tax + feesTotal - cart.discount

    // Actualizar timestamp
    cart.updatedAt = new Date()
  }

  // Validar carrito
  validateCart(cartId: string): { isValid: boolean; errors: string[] } {
    const cart = this.carts.get(cartId)
    if (!cart) {
      return { isValid: false, errors: ['Carrito no encontrado'] }
    }

    const errors: string[] = []

    // Verificar si el carrito está vacío
    if (cart.items.length === 0) {
      errors.push('El carrito está vacío')
    }

    // Verificar si el carrito ha expirado
    if (new Date() > cart.expiresAt) {
      errors.push('El carrito ha expirado')
      cart.status = 'expired'
    }

    // Verificar disponibilidad de asientos
    for (const item of cart.items) {
      if (item.productType === 'ticket' && item.seatNumber) {
        // Aquí implementarías la verificación de disponibilidad de asientos
        // Por ahora simulamos que está disponible
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Completar compra
  completePurchase(cartId: string, paymentData: any): { success: boolean; orderId?: string; errors: string[] } {
    const cart = this.carts.get(cartId)
    if (!cart) {
      return { success: false, errors: ['Carrito no encontrado'] }
    }

    // Validar carrito
    const validation = this.validateCart(cartId)
    if (!validation.isValid) {
      return { success: false, errors: validation.errors }
    }

    // Procesar pago (simulado)
    try {
      // Aquí implementarías el procesamiento real del pago
      const orderId = this.generateId()
      
      // Marcar carrito como completado
      cart.status = 'completed'
      cart.paymentMethod = paymentData.method
      cart.updatedAt = new Date()

      // Incrementar contador de uso del descuento
      if (cart.discountCode) {
        const discount = this.discounts.get(cart.discountCode)
        if (discount) {
          discount.usedCount++
        }
      }

      return { success: true, orderId, errors: [] }
    } catch (error) {
      return { success: false, errors: ['Error procesando el pago'] }
    }
  }

  // Obtener estadísticas del carrito
  getCartStats(): {
    activeCarts: number
    abandonedCarts: number
    completedCarts: number
    totalRevenue: number
    averageCartValue: number
  } {
    const carts = Array.from(this.carts.values())
    
    const activeCarts = carts.filter(c => c.status === 'active').length
    const abandonedCarts = carts.filter(c => c.status === 'abandoned').length
    const completedCarts = carts.filter(c => c.status === 'completed').length
    const totalRevenue = carts
      .filter(c => c.status === 'completed')
      .reduce((sum, c) => sum + c.total, 0)
    const averageCartValue = completedCarts > 0 ? totalRevenue / completedCarts : 0

    return {
      activeCarts,
      abandonedCarts,
      completedCarts,
      totalRevenue,
      averageCartValue
    }
  }

  // Obtener descuentos disponibles
  getAvailableDiscounts(): CartDiscount[] {
    return Array.from(this.discounts.values()).filter(d => d.isActive)
  }

  // Verificar código de descuento
  validateDiscountCode(code: string): { isValid: boolean; discount?: CartDiscount; error?: string } {
    const discount = this.discounts.get(code)
    
    if (!discount) {
      return { isValid: false, error: 'Código de descuento no válido' }
    }

    if (!discount.isActive) {
      return { isValid: false, error: 'Código de descuento inactivo' }
    }

    if (discount.validUntil && new Date() > discount.validUntil) {
      return { isValid: false, error: 'Código de descuento expirado' }
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
      return { isValid: false, error: 'Código de descuento agotado' }
    }

    return { isValid: true, discount }
  }

  // Generar ID único
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  // Obtener configuración del carrito
  getSettings(): CartSettings {
    return { ...this.settings }
  }

  // Actualizar configuración del carrito
  updateSettings(newSettings: Partial<CartSettings>): void {
    this.settings = { ...this.settings, ...newSettings }
  }
}

export const cartService = new CartService()
