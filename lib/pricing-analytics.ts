import type { PriceHistoryEntry, MarketConditions } from "./dynamic-pricing-engine"

export interface PriceElasticity {
  sectionId: string
  priceRange: { min: number; max: number }
  elasticity: number
  confidence: number
  sampleSize: number
}

export interface RevenueOptimization {
  currentRevenue: number
  optimizedRevenue: number
  recommendedPrices: Map<string, number>
  improvementPercentage: number
  confidence: number
}

export interface CompetitorAnalysis {
  competitorId: string
  eventType: string
  averagePrice: number
  priceRange: { min: number; max: number }
  lastUpdated: Date
}

export interface PricingRecommendation {
  sectionId: string
  currentPrice: number
  recommendedPrice: number
  expectedImpact: {
    demandChange: number
    revenueChange: number
  }
  confidence: number
  reason: string
}

export class PricingAnalytics {
  private priceHistory: Map<string, PriceHistoryEntry[]> = new Map()
  private salesData: Map<string, number[]> = new Map()
  private competitorData: CompetitorAnalysis[] = []

  constructor() {
    // Initialize with mock competitor data
    this.competitorData = [
      {
        competitorId: "tuboleta",
        eventType: "concert",
        averagePrice: 85000,
        priceRange: { min: 45000, max: 150000 },
        lastUpdated: new Date(),
      },
      {
        competitorId: "ticketmaster",
        eventType: "concert",
        averagePrice: 92000,
        priceRange: { min: 50000, max: 180000 },
        lastUpdated: new Date(),
      },
    ]
  }

  calculatePriceElasticity(sectionId: string, pricePoints: number[], demandPoints: number[]): PriceElasticity {
    if (pricePoints.length !== demandPoints.length || pricePoints.length < 2) {
      return {
        sectionId,
        priceRange: { min: 0, max: 0 },
        elasticity: -1,
        confidence: 0,
        sampleSize: 0,
      }
    }

    // Calculate elasticity using linear regression
    const n = pricePoints.length
    const sumX = pricePoints.reduce((a, b) => a + b, 0)
    const sumY = demandPoints.reduce((a, b) => a + b, 0)
    const sumXY = pricePoints.reduce((sum, x, i) => sum + x * demandPoints[i], 0)
    const sumXX = pricePoints.reduce((sum, x) => sum + x * x, 0)

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const avgPrice = sumX / n
    const avgDemand = sumY / n

    // Price elasticity of demand
    const elasticity = (slope * avgPrice) / avgDemand

    // Calculate R-squared for confidence
    const yMean = avgDemand
    const ssRes = demandPoints.reduce((sum, y, i) => {
      const predicted = slope * pricePoints[i] + (yMean - slope * avgPrice)
      return sum + Math.pow(y - predicted, 2)
    }, 0)
    const ssTot = demandPoints.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0)
    const rSquared = 1 - ssRes / ssTot

    return {
      sectionId,
      priceRange: {
        min: Math.min(...pricePoints),
        max: Math.max(...pricePoints),
      },
      elasticity: Math.abs(elasticity),
      confidence: Math.max(0, Math.min(1, rSquared)),
      sampleSize: n,
    }
  }

  optimizeRevenue(
    sections: Array<{
      id: string
      currentPrice: number
      capacity: number
      currentDemand: number
    }>,
    marketConditions: MarketConditions,
  ): RevenueOptimization {
    const recommendedPrices = new Map<string, number>()
    let currentRevenue = 0
    let optimizedRevenue = 0

    for (const section of sections) {
      currentRevenue += section.currentPrice * section.capacity * section.currentDemand

      // Use elasticity to find optimal price
      const elasticity = this.getElasticityForSection(section.id)
      const competitorAvg = this.getCompetitorAveragePrice()

      // Optimal price calculation considering elasticity and competition
      let optimalPrice = section.currentPrice

      if (elasticity > 0) {
        // If demand is elastic (elasticity > 1), lower prices might increase revenue
        if (elasticity > 1) {
          optimalPrice = section.currentPrice * 0.9 // 10% reduction
        } else {
          // If demand is inelastic, we can increase prices
          optimalPrice = section.currentPrice * 1.15 // 15% increase
        }
      }

      // Adjust based on competitor pricing
      if (competitorAvg > 0) {
        const competitorFactor = competitorAvg / section.currentPrice
        if (competitorFactor > 1.2) {
          optimalPrice *= 1.1 // Increase if competitors are much higher
        } else if (competitorFactor < 0.8) {
          optimalPrice *= 0.95 // Decrease if competitors are much lower
        }
      }

      // Apply market conditions
      if (marketConditions.currentDemand > 0.8) {
        optimalPrice *= 1.2 // High demand premium
      } else if (marketConditions.currentDemand < 0.3) {
        optimalPrice *= 0.85 // Low demand discount
      }

      // Estimate new demand based on price change
      const priceChangeRatio = optimalPrice / section.currentPrice
      const demandChangeRatio = Math.pow(priceChangeRatio, -elasticity)
      const newDemand = Math.min(1, section.currentDemand * demandChangeRatio)

      recommendedPrices.set(section.id, Math.round(optimalPrice))
      optimizedRevenue += optimalPrice * section.capacity * newDemand
    }

    const improvementPercentage = currentRevenue > 0 ? ((optimizedRevenue - currentRevenue) / currentRevenue) * 100 : 0

    return {
      currentRevenue,
      optimizedRevenue,
      recommendedPrices,
      improvementPercentage,
      confidence: 0.75, // Base confidence level
    }
  }

  generatePricingRecommendations(
    sections: Array<{
      id: string
      name: string
      currentPrice: number
      capacity: number
      currentDemand: number
    }>,
    marketConditions: MarketConditions,
  ): PricingRecommendation[] {
    const recommendations: PricingRecommendation[] = []

    for (const section of sections) {
      const elasticity = this.getElasticityForSection(section.id)
      const competitorAvg = this.getCompetitorAveragePrice()

      let recommendedPrice = section.currentPrice
      let reason = "No changes recommended"
      let confidence = 0.5

      // High demand scenario
      if (marketConditions.currentDemand > 0.8) {
        recommendedPrice = section.currentPrice * 1.25
        reason = "High demand detected - increase prices to maximize revenue"
        confidence = 0.85
      }
      // Low demand scenario
      else if (marketConditions.currentDemand < 0.3) {
        recommendedPrice = section.currentPrice * 0.8
        reason = "Low demand - reduce prices to stimulate sales"
        confidence = 0.8
      }
      // Last minute scenario
      else if (marketConditions.timeToEvent < 7 && marketConditions.currentDemand > 0.5) {
        recommendedPrice = section.currentPrice * 1.4
        reason = "Last minute premium - high demand with limited time"
        confidence = 0.9
      }
      // Early bird scenario
      else if (marketConditions.timeToEvent > 60 && marketConditions.currentDemand < 0.4) {
        recommendedPrice = section.currentPrice * 0.85
        reason = "Early bird discount to boost initial sales"
        confidence = 0.75
      }
      // Competitor adjustment
      else if (competitorAvg > 0) {
        const competitorRatio = competitorAvg / section.currentPrice
        if (competitorRatio > 1.3) {
          recommendedPrice = section.currentPrice * 1.15
          reason = "Competitors pricing significantly higher - room for increase"
          confidence = 0.7
        } else if (competitorRatio < 0.7) {
          recommendedPrice = section.currentPrice * 0.9
          reason = "Competitors pricing lower - adjust to stay competitive"
          confidence = 0.8
        }
      }

      // Calculate expected impact
      const priceChange = (recommendedPrice - section.currentPrice) / section.currentPrice
      const demandChange = -priceChange * elasticity
      const revenueChange = (1 + priceChange) * (1 + demandChange) - 1

      recommendations.push({
        sectionId: section.id,
        currentPrice: section.currentPrice,
        recommendedPrice: Math.round(recommendedPrice),
        expectedImpact: {
          demandChange: demandChange * 100,
          revenueChange: revenueChange * 100,
        },
        confidence,
        reason,
      })
    }

    return recommendations.sort((a, b) => b.confidence - a.confidence)
  }

  analyzeCompetitorPricing(): CompetitorAnalysis[] {
    return this.competitorData.map((competitor) => ({
      ...competitor,
      lastUpdated: new Date(),
    }))
  }

  trackPricePerformance(sectionId: string, price: number, salesCount: number): void {
    if (!this.salesData.has(sectionId)) {
      this.salesData.set(sectionId, [])
    }

    const sales = this.salesData.get(sectionId)!
    sales.push(salesCount)

    // Keep only last 30 data points
    if (sales.length > 30) {
      sales.shift()
    }
  }

  private getElasticityForSection(sectionId: string): number {
    // Mock elasticity data - in real implementation, this would come from historical data
    const mockElasticities: Record<string, number> = {
      premium: 0.8, // Inelastic - luxury buyers less price sensitive
      vip: 1.2, // Slightly elastic
      standard: 1.5, // Elastic - price sensitive
      economy: 2.0, // Very elastic - highly price sensitive
    }

    return mockElasticities[sectionId] || 1.3 // Default elasticity
  }

  private getCompetitorAveragePrice(): number {
    if (this.competitorData.length === 0) return 0

    const total = this.competitorData.reduce((sum, comp) => sum + comp.averagePrice, 0)
    return total / this.competitorData.length
  }

  // Utility methods for market analysis
  calculateMarketShare(ourPrice: number, competitorPrices: number[]): number {
    if (competitorPrices.length === 0) return 1

    const allPrices = [ourPrice, ...competitorPrices]
    const avgPrice = allPrices.reduce((a, b) => a + b, 0) / allPrices.length

    // Simple market share model based on relative pricing
    const priceAdvantage = avgPrice / ourPrice
    return Math.min(1, Math.max(0.1, priceAdvantage * 0.5))
  }

  predictDemand(basePrice: number, newPrice: number, elasticity: number, marketConditions: MarketConditions): number {
    const priceRatio = newPrice / basePrice
    const baseDemandChange = Math.pow(priceRatio, -elasticity)

    // Adjust for market conditions
    let demandMultiplier = 1

    // Time factor
    if (marketConditions.timeToEvent < 7) {
      demandMultiplier *= 1.3 // Last minute urgency
    } else if (marketConditions.timeToEvent > 90) {
      demandMultiplier *= 0.8 // Early planning discount
    }

    // Seasonality factor
    demandMultiplier *= 1 + marketConditions.seasonality * 0.2

    // Event popularity factor
    demandMultiplier *= 1 + marketConditions.eventPopularity * 0.3

    return Math.min(1, baseDemandChange * demandMultiplier)
  }

  generatePriceOptimizationReport(
    sections: Array<{
      id: string
      name: string
      currentPrice: number
      capacity: number
      currentDemand: number
    }>,
    marketConditions: MarketConditions,
  ): {
    summary: {
      totalCurrentRevenue: number
      totalOptimizedRevenue: number
      improvementPercentage: number
    }
    sectionRecommendations: PricingRecommendation[]
    marketInsights: string[]
  } {
    const optimization = this.optimizeRevenue(sections, marketConditions)
    const recommendations = this.generatePricingRecommendations(sections, marketConditions)

    const insights: string[] = []

    if (marketConditions.currentDemand > 0.8) {
      insights.push("High demand detected - consider premium pricing strategy")
    }

    if (marketConditions.timeToEvent < 14) {
      insights.push("Event approaching - implement urgency-based pricing")
    }

    if (marketConditions.salesVelocity > 0.1) {
      insights.push("Strong sales velocity - prices may be too low")
    }

    const competitorAvg = this.getCompetitorAveragePrice()
    const ourAvg = sections.reduce((sum, s) => sum + s.currentPrice, 0) / sections.length

    if (competitorAvg > ourAvg * 1.2) {
      insights.push("Competitors pricing significantly higher - opportunity for price increases")
    } else if (competitorAvg < ourAvg * 0.8) {
      insights.push("Competitors pricing lower - consider competitive adjustments")
    }

    return {
      summary: {
        totalCurrentRevenue: optimization.currentRevenue,
        totalOptimizedRevenue: optimization.optimizedRevenue,
        improvementPercentage: optimization.improvementPercentage,
      },
      sectionRecommendations: recommendations,
      marketInsights: insights,
    }
  }
}
