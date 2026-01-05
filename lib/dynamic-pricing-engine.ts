export interface PricingRule {
  id: string
  name: string
  type: "time-based" | "demand-based" | "hybrid"
  isActive: boolean
  conditions: {
    daysBeforeEvent?: number
    demandThreshold?: number
    salesPercentage?: number
    timeOfDay?: { start: string; end: string }
    dayOfWeek?: number[]
    minDemand?: number
    maxDemand?: number
  }
  priceAdjustment: {
    type: "percentage" | "fixed" | "curve"
    value: number
    maxIncrease?: number
    minPrice?: number
    curve?: "linear" | "exponential" | "logarithmic"
  }
  appliesTo: {
    sectionIds?: string[]
    seatTypes?: string[]
    priceRanges?: { min: number; max: number }[]
  }
  priority: number
  confidence: number
  createdAt: Date
  lastApplied?: Date
}

export interface MarketConditions {
  currentDemand: number
  timeToEvent: number
  salesVelocity: number
  competitorPrices?: number[]
  seasonality: number
  eventPopularity: number
}

export interface DynamicPriceResult {
  originalPrice: number
  adjustedPrice: number
  appliedRules: string[]
  adjustmentPercentage: number
  confidence: number
  reason: string
  priceHistory: PriceHistoryEntry[]
}

export interface PriceHistoryEntry {
  timestamp: Date
  price: number
  reason: string
  ruleId?: string
}

export class DynamicPricingEngine {
  private rules: PricingRule[] = []
  private priceHistory: Map<string, PriceHistoryEntry[]> = new Map()
  private marketConditions: MarketConditions

  constructor(marketConditions: MarketConditions) {
    this.marketConditions = marketConditions
  }

  addRule(rule: PricingRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => a.priority - b.priority)
  }

  updateRule(ruleId: string, updates: Partial<PricingRule>): void {
    const ruleIndex = this.rules.findIndex((rule) => rule.id === ruleId)
    if (ruleIndex !== -1) {
      this.rules[ruleIndex] = { ...this.rules[ruleIndex], ...updates }
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter((rule) => rule.id !== ruleId)
  }

  calculatePrice(originalPrice: number, sectionId: string, seatType: string, seatId?: string): DynamicPriceResult {
    let adjustedPrice = originalPrice
    const appliedRules: string[] = []
    let totalAdjustment = 0
    const reasons: string[] = []
    let totalConfidence = 0
    let ruleCount = 0

    // Get active rules sorted by priority
    const activeRules = this.rules.filter((rule) => rule.isActive)

    for (const rule of activeRules) {
      if (!this.ruleApplies(rule, sectionId, seatType, originalPrice)) {
        continue
      }

      const ruleResult = this.evaluateRule(rule, adjustedPrice)
      if (ruleResult.shouldApply) {
        adjustedPrice += ruleResult.adjustment
        totalAdjustment += ruleResult.adjustment
        appliedRules.push(rule.name)
        reasons.push(ruleResult.reason)
        totalConfidence += rule.confidence
        ruleCount++

        // Apply safety limits
        if (rule.priceAdjustment.maxIncrease && ruleResult.adjustment > rule.priceAdjustment.maxIncrease) {
          adjustedPrice = originalPrice + rule.priceAdjustment.maxIncrease
        }

        if (rule.priceAdjustment.minPrice && adjustedPrice < rule.priceAdjustment.minPrice) {
          adjustedPrice = rule.priceAdjustment.minPrice
        }
      }
    }

    // Apply global safety limits
    const maxPrice = originalPrice * 3 // Never more than 300% of original
    const minPrice = originalPrice * 0.5 // Never less than 50% of original
    adjustedPrice = Math.max(minPrice, Math.min(maxPrice, adjustedPrice))

    const adjustmentPercentage = originalPrice > 0 ? (totalAdjustment / originalPrice) * 100 : 0
    const confidence = ruleCount > 0 ? totalConfidence / ruleCount : 0

    // Record price history
    if (seatId) {
      this.recordPriceHistory(seatId, adjustedPrice, reasons.join(", "))
    }

    return {
      originalPrice,
      adjustedPrice: Math.round(adjustedPrice),
      appliedRules,
      adjustmentPercentage,
      confidence,
      reason: reasons.join(", ") || "No dynamic pricing applied",
      priceHistory: seatId ? this.priceHistory.get(seatId) || [] : [],
    }
  }

  private ruleApplies(rule: PricingRule, sectionId: string, seatType: string, price: number): boolean {
    // Check section applicability
    if (rule.appliesTo.sectionIds && !rule.appliesTo.sectionIds.includes(sectionId)) {
      return false
    }

    // Check seat type applicability
    if (rule.appliesTo.seatTypes && !rule.appliesTo.seatTypes.includes(seatType)) {
      return false
    }

    // Check price range applicability
    if (rule.appliesTo.priceRanges) {
      const inRange = rule.appliesTo.priceRanges.some((range) => price >= range.min && price <= range.max)
      if (!inRange) return false
    }

    return true
  }

  private evaluateRule(
    rule: PricingRule,
    currentPrice: number,
  ): {
    shouldApply: boolean
    adjustment: number
    reason: string
  } {
    let shouldApply = false
    let adjustment = 0
    const reasons: string[] = []

    // Time-based conditions
    if (rule.type === "time-based" || rule.type === "hybrid") {
      if (rule.conditions.daysBeforeEvent !== undefined) {
        if (this.marketConditions.timeToEvent <= rule.conditions.daysBeforeEvent) {
          shouldApply = true
          reasons.push(`${rule.conditions.daysBeforeEvent} days before event`)
        }
      }

      if (rule.conditions.timeOfDay) {
        const now = new Date()
        const currentHour = now.getHours()
        const startHour = Number.parseInt(rule.conditions.timeOfDay.start.split(":")[0])
        const endHour = Number.parseInt(rule.conditions.timeOfDay.end.split(":")[0])

        if (currentHour >= startHour && currentHour <= endHour) {
          shouldApply = true
          reasons.push(`Peak hours (${rule.conditions.timeOfDay.start}-${rule.conditions.timeOfDay.end})`)
        }
      }

      if (rule.conditions.dayOfWeek) {
        const dayOfWeek = new Date().getDay()
        if (rule.conditions.dayOfWeek.includes(dayOfWeek)) {
          shouldApply = true
          reasons.push("Peak day of week")
        }
      }
    }

    // Demand-based conditions
    if (rule.type === "demand-based" || rule.type === "hybrid") {
      if (rule.conditions.demandThreshold !== undefined) {
        if (this.marketConditions.currentDemand >= rule.conditions.demandThreshold) {
          shouldApply = true
          reasons.push(`High demand (${Math.round(this.marketConditions.currentDemand * 100)}%)`)
        }
      }

      if (rule.conditions.salesPercentage !== undefined) {
        if (this.marketConditions.currentDemand >= rule.conditions.salesPercentage) {
          shouldApply = true
          reasons.push(`Sales threshold reached (${Math.round(this.marketConditions.currentDemand * 100)}%)`)
        }
      }

      if (rule.conditions.minDemand !== undefined && rule.conditions.maxDemand !== undefined) {
        if (
          this.marketConditions.currentDemand >= rule.conditions.minDemand &&
          this.marketConditions.currentDemand <= rule.conditions.maxDemand
        ) {
          shouldApply = true
          reasons.push(`Demand in range (${Math.round(this.marketConditions.currentDemand * 100)}%)`)
        }
      }
    }

    if (shouldApply) {
      // Calculate adjustment based on type
      switch (rule.priceAdjustment.type) {
        case "percentage":
          adjustment = (currentPrice * rule.priceAdjustment.value) / 100
          break
        case "fixed":
          adjustment = rule.priceAdjustment.value
          break
        case "curve":
          adjustment = this.calculateCurveAdjustment(rule, currentPrice)
          break
      }
    }

    return {
      shouldApply,
      adjustment,
      reason: reasons.join(", "),
    }
  }

  private calculateCurveAdjustment(rule: PricingRule, currentPrice: number): number {
    const { curve = "linear", value } = rule.priceAdjustment
    const demandFactor = this.marketConditions.currentDemand
    const timeFactor = Math.max(0, 1 - this.marketConditions.timeToEvent / 365)

    let multiplier = 1
    switch (curve) {
      case "exponential":
        multiplier = Math.pow(demandFactor + timeFactor, 2)
        break
      case "logarithmic":
        multiplier = Math.log(1 + (demandFactor + timeFactor) * Math.E)
        break
      case "linear":
      default:
        multiplier = demandFactor + timeFactor
        break
    }

    return (currentPrice * value * multiplier) / 100
  }

  private recordPriceHistory(seatId: string, price: number, reason: string): void {
    if (!this.priceHistory.has(seatId)) {
      this.priceHistory.set(seatId, [])
    }

    const history = this.priceHistory.get(seatId)!
    history.push({
      timestamp: new Date(),
      price,
      reason,
    })

    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift()
    }
  }

  updateMarketConditions(conditions: Partial<MarketConditions>): void {
    this.marketConditions = { ...this.marketConditions, ...conditions }
  }

  getMarketConditions(): MarketConditions {
    return { ...this.marketConditions }
  }

  getActiveRules(): PricingRule[] {
    return this.rules.filter((rule) => rule.isActive)
  }

  getPriceHistory(seatId: string): PriceHistoryEntry[] {
    return this.priceHistory.get(seatId) || []
  }

  // Utility methods for creating common rules
  static createEarlyBirdRule(discountPercentage: number, daysBeforeEvent: number): PricingRule {
    return {
      id: `early-bird-${Date.now()}`,
      name: "Early Bird Discount",
      type: "time-based",
      isActive: true,
      conditions: { daysBeforeEvent },
      priceAdjustment: {
        type: "percentage",
        value: -Math.abs(discountPercentage),
        minPrice: 25000,
      },
      appliesTo: {},
      priority: 1,
      confidence: 0.9,
      createdAt: new Date(),
    }
  }

  static createSurgeRule(increasePercentage: number, demandThreshold: number): PricingRule {
    return {
      id: `surge-${Date.now()}`,
      name: "High Demand Surge",
      type: "demand-based",
      isActive: true,
      conditions: { demandThreshold },
      priceAdjustment: {
        type: "percentage",
        value: increasePercentage,
        maxIncrease: 50000,
      },
      appliesTo: {},
      priority: 2,
      confidence: 0.85,
      createdAt: new Date(),
    }
  }

  static createLastMinuteRule(increasePercentage: number, daysBeforeEvent: number, minDemand: number): PricingRule {
    return {
      id: `last-minute-${Date.now()}`,
      name: "Last Minute Premium",
      type: "hybrid",
      isActive: true,
      conditions: {
        daysBeforeEvent,
        minDemand,
      },
      priceAdjustment: {
        type: "curve",
        value: increasePercentage,
        curve: "exponential",
        maxIncrease: 75000,
      },
      appliesTo: {},
      priority: 3,
      confidence: 0.8,
      createdAt: new Date(),
    }
  }
}
