// Sistema de Reportes Avanzados basado en WordPress
// Generación de reportes completos para el sistema POS

export interface ReportFilters {
  dateRange: {
    start: Date
    end: Date
  }
  eventId?: number
  userId?: number
  status?: string
  paymentMethod?: string
  category?: string
  location?: string
}

export interface SalesReport {
  totalSales: number
  totalOrders: number
  averageOrderValue: number
  salesByDate: Array<{
    date: string
    sales: number
    orders: number
  }>
  salesByEvent: Array<{
    eventId: number
    eventName: string
    sales: number
    orders: number
    percentage: number
  }>
  salesByPaymentMethod: Array<{
    method: string
    sales: number
    orders: number
    percentage: number
  }>
  topCustomers: Array<{
    userId: number
    customerName: string
    totalSpent: number
    orders: number
  }>
  refunds: {
    totalRefunds: number
    refundedOrders: number
    refundRate: number
  }
}

export interface EventReport {
  eventId: number
  eventName: string
  eventDate: string
  totalTickets: number
  soldTickets: number
  availableTickets: number
  occupancyRate: number
  revenue: number
  averageTicketPrice: number
  salesByTicketType: Array<{
    ticketType: string
    sold: number
    revenue: number
    percentage: number
  }>
  salesByDate: Array<{
    date: string
    tickets: number
    revenue: number
  }>
  checkIns: {
    total: number
    percentage: number
  }
}

export interface CustomerReport {
  totalCustomers: number
  newCustomers: number
  returningCustomers: number
  customerRetentionRate: number
  averageCustomerValue: number
  customersByLocation: Array<{
    location: string
    count: number
    percentage: number
  }>
  customerSegments: Array<{
    segment: string
    count: number
    averageValue: number
  }>
  topCustomers: Array<{
    customerId: number
    name: string
    email: string
    totalSpent: number
    orders: number
    lastPurchase: string
  }>
}

export interface FinancialReport {
  totalRevenue: number
  totalCosts: number
  grossProfit: number
  netProfit: number
  profitMargin: number
  revenueByMonth: Array<{
    month: string
    revenue: number
    costs: number
    profit: number
  }>
  revenueByEvent: Array<{
    eventId: number
    eventName: string
    revenue: number
    costs: number
    profit: number
  }>
  paymentMethods: Array<{
    method: string
    revenue: number
    fees: number
    netRevenue: number
  }>
  refunds: {
    totalRefunds: number
    refundedRevenue: number
    refundRate: number
  }
}

export interface InventoryReport {
  totalProducts: number
  totalTickets: number
  soldTickets: number
  availableTickets: number
  lowStockItems: Array<{
    productId: number
    productName: string
    currentStock: number
    minStock: number
  }>
  bestSellingProducts: Array<{
    productId: number
    productName: string
    sold: number
    revenue: number
  }>
  slowMovingProducts: Array<{
    productId: number
    productName: string
    sold: number
    daysInStock: number
  }>
}

export interface PerformanceReport {
  totalSessions: number
  activeUsers: number
  averageSessionDuration: number
  bounceRate: number
  conversionRate: number
  topPages: Array<{
    page: string
    views: number
    uniqueViews: number
    conversionRate: number
  }>
  trafficSources: Array<{
    source: string
    visits: number
    conversions: number
    conversionRate: number
  }>
  deviceBreakdown: Array<{
    device: string
    visits: number
    percentage: number
  }>
}

class ReportsService {
  private apiClient: any

  constructor() {
    this.apiClient = require('./api-client').apiClient
  }

  // Generar reporte de ventas
  async generateSalesReport(filters: ReportFilters): Promise<SalesReport> {
    try {
      const response = await this.apiClient.get('/reports/sales', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte de ventas:', error)
      throw error
    }
  }

  // Generar reporte de eventos
  async generateEventReport(eventId: number, filters: ReportFilters): Promise<EventReport> {
    try {
      const response = await this.apiClient.get(`/reports/events/${eventId}`, { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte de evento:', error)
      throw error
    }
  }

  // Generar reporte de clientes
  async generateCustomerReport(filters: ReportFilters): Promise<CustomerReport> {
    try {
      const response = await this.apiClient.get('/reports/customers', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte de clientes:', error)
      throw error
    }
  }

  // Generar reporte financiero
  async generateFinancialReport(filters: ReportFilters): Promise<FinancialReport> {
    try {
      const response = await this.apiClient.get('/reports/financial', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte financiero:', error)
      throw error
    }
  }

  // Generar reporte de inventario
  async generateInventoryReport(filters: ReportFilters): Promise<InventoryReport> {
    try {
      const response = await this.apiClient.get('/reports/inventory', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte de inventario:', error)
      throw error
    }
  }

  // Generar reporte de rendimiento
  async generatePerformanceReport(filters: ReportFilters): Promise<PerformanceReport> {
    try {
      const response = await this.apiClient.get('/reports/performance', { params: filters })
      return response.data
    } catch (error) {
      console.error('Error generando reporte de rendimiento:', error)
      throw error
    }
  }

  // Exportar reporte a PDF
  async exportToPDF(reportType: string, data: any, filename: string): Promise<Blob> {
    try {
      const response = await this.apiClient.post('/reports/export/pdf', {
        reportType,
        data,
        filename
      }, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error exportando reporte a PDF:', error)
      throw error
    }
  }

  // Exportar reporte a Excel
  async exportToExcel(reportType: string, data: any, filename: string): Promise<Blob> {
    try {
      const response = await this.apiClient.post('/reports/export/excel', {
        reportType,
        data,
        filename
      }, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error exportando reporte a Excel:', error)
      throw error
    }
  }

  // Exportar reporte a CSV
  async exportToCSV(reportType: string, data: any, filename: string): Promise<Blob> {
    try {
      const response = await this.apiClient.post('/reports/export/csv', {
        reportType,
        data,
        filename
      }, {
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error exportando reporte a CSV:', error)
      throw error
    }
  }

  // Programar reporte automático
  async scheduleReport(
    reportType: string,
    filters: ReportFilters,
    schedule: {
      frequency: 'daily' | 'weekly' | 'monthly'
      time: string
      email: string
      format: 'pdf' | 'excel' | 'csv'
    }
  ): Promise<boolean> {
    try {
      const response = await this.apiClient.post('/reports/schedule', {
        reportType,
        filters,
        schedule
      })
      return response.data.success
    } catch (error) {
      console.error('Error programando reporte:', error)
      throw error
    }
  }

  // Obtener reportes programados
  async getScheduledReports(): Promise<Array<{
    id: string
    reportType: string
    schedule: any
    lastRun: string
    nextRun: string
    status: string
  }>> {
    try {
      const response = await this.apiClient.get('/reports/scheduled')
      return response.data
    } catch (error) {
      console.error('Error obteniendo reportes programados:', error)
      throw error
    }
  }

  // Eliminar reporte programado
  async deleteScheduledReport(reportId: string): Promise<boolean> {
    try {
      const response = await this.apiClient.delete(`/reports/scheduled/${reportId}`)
      return response.data.success
    } catch (error) {
      console.error('Error eliminando reporte programado:', error)
      throw error
    }
  }

  // Obtener estadísticas en tiempo real
  async getRealTimeStats(): Promise<{
    totalSales: number
    todaySales: number
    activeUsers: number
    pendingOrders: number
    lowStockItems: number
  }> {
    try {
      const response = await this.apiClient.get('/reports/realtime')
      return response.data
    } catch (error) {
      console.error('Error obteniendo estadísticas en tiempo real:', error)
      throw error
    }
  }

  // Obtener historial de reportes
  async getReportHistory(): Promise<Array<{
    id: string
    reportType: string
    generatedAt: string
    generatedBy: string
    filters: ReportFilters
    status: string
  }>> {
    try {
      const response = await this.apiClient.get('/reports/history')
      return response.data
    } catch (error) {
      console.error('Error obteniendo historial de reportes:', error)
      throw error
    }
  }
}

export const reportsService = new ReportsService()
