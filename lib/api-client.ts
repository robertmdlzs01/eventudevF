// Configuración de API para diferentes entornos
const getApiBaseUrl = () => {
  // En producción usar la URL del backend en Railway
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_API_URL || "https://tu-backend-url.railway.app/api"
  }
  // En desarrollo usar localhost
  return "http://localhost:3002/api"
}

const API_BASE_URL = getApiBaseUrl()

export interface ApiResponse<T> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: any
}

export interface User {
  id: number
  name: string
  email: string
  phone?: string
  role: string
  is_verified: boolean
  created_at: string
}

export interface LoginResponse {
  success: boolean
  user: User
  token: string
  error?: string
  redirectUrl?: string
  welcomeMessage?: string
  role?: string
}

export class ApiClient {
  private baseUrl: string
  private token: string | null = null
  private currentUser: User | null = null

  constructor() {
    this.baseUrl = API_BASE_URL
    // Load token from localStorage if available (only on client side)
    if (typeof window !== "undefined") {
      this.loadTokenFromStorage()
    }
  }

  private loadTokenFromStorage(): void {
    try {
      this.token = localStorage.getItem("auth_token")
      const userData = localStorage.getItem("current_user")
      if (userData) {
        this.currentUser = JSON.parse(userData)
      }
    } catch (error) {
      console.error("Failed to load auth data from storage:", error)
      this.clearToken()
    }
  }

  // Method to refresh token from storage (useful for client-side calls)
  public refreshToken(): void {
    if (typeof window !== "undefined") {
      this.loadTokenFromStorage()
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    // Try to get token from localStorage if not set in instance
    let token = this.token
    if (!token && typeof window !== "undefined") {
      token = localStorage.getItem("auth_token")
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    return headers
  }

  private clearToken(): void {
    this.token = null
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("current_user")
      localStorage.removeItem("eventu_authenticated")
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)

      // Verificar si hay un nuevo token en la respuesta
      const newToken = response.headers.get('X-New-Token')
      if (newToken && typeof window !== "undefined") {
        localStorage.setItem("auth_token", newToken)
        this.token = newToken
      }
      
      // Verificar advertencia de sesión
      const sessionWarning = response.headers.get('X-Session-Warning')
      const sessionRemaining = response.headers.get('X-Session-Remaining')
      
      if (sessionWarning && sessionRemaining && typeof window !== "undefined") {
        // Disparar evento personalizado para mostrar advertencia
        window.dispatchEvent(new CustomEvent('sessionWarning', {
          detail: {
            message: sessionWarning,
            remainingMinutes: parseInt(sessionRemaining)
          }
        }))
      }

      if (!response.ok) {
        if (response.status === 401) {
          this.clearToken()
        }

        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error(`API request failed (${url}):`, error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  }

  // Password Reset API
  async forgotPassword(email: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/password-reset/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al solicitar recuperación de contraseña",
      }
    }
  }

  async verifyResetToken(token: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/password-reset/verify-reset-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al verificar token",
      }
    }
  }

  async resetPassword(token: string, password: string): Promise<ApiResponse<any>> {
    try {
      const response = await fetch(`${this.baseUrl}/password-reset/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al restablecer contraseña",
      }
    }
  }

  // Authentication API
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await this.request<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (response.success && response.data) {
        const { user, token } = response.data
        this.token = token
        this.currentUser = user

        if (typeof window !== "undefined") {
          localStorage.setItem("auth_token", token)
          localStorage.setItem("current_user", JSON.stringify(user))
          localStorage.setItem("eventu_authenticated", "true")
          
          // Store redirect information
          if (response.data.redirectUrl) {
            localStorage.setItem("redirectUrl", response.data.redirectUrl)
          }
          if (response.data.welcomeMessage) {
            localStorage.setItem("welcomeMessage", response.data.welcomeMessage)
          }
          if (response.data.role) {
            localStorage.setItem("userRole", response.data.role)
          }
          
          // Disparar evento para notificar otros componentes
          window.dispatchEvent(new Event("authStateChanged"))
        }
        return { success: true, user, token }
      }

      return {
        success: false,
        user: {} as User,
        token: "",
        error: response.error || "Login failed",
      }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        user: {} as User,
        token: "",
        error: error instanceof Error ? error.message : "Network error",
      }
    }
  }

  async logout(): Promise<void> {
    this.clearToken()
    window.dispatchEvent(new Event("authStateChanged"))
  }

  // Events API
  async getEvents(params?: any): Promise<ApiResponse<any[]>> {
    return this.request("/events", {
      method: "GET",
    })
  }

  async getFeaturedEvents(): Promise<ApiResponse<any[]>> {
    return this.request("/events/featured", {
      method: "GET",
    })
  }

  async getEvent(id: number): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}`, {
      method: "GET",
    })
  }

  async getEventSeats(eventId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/events/${eventId}/seats`, {
      method: "GET",
    })
  }

  // Categories API
  async getCategories(): Promise<ApiResponse<any[]>> {
    return this.request("/categories", {
      method: "GET",
    })
  }

  // User Profile API
  async updateProfile(userData: any): Promise<ApiResponse<any>> {
    return this.request("/users/profile", {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // Change Password API
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<any>> {
    return this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  // Admin API
  async getAdminDashboardStats(): Promise<ApiResponse<any>> {
    return this.request("/admin/dashboard/stats", {
      method: "GET",
    })
  }

  async getAdminUsers(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/users${queryParams}`, {
      method: "GET",
    })
  }

  async getAdminAuditLogs(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/audit-logs${queryParams}`, {
      method: "GET",
    })
  }

  // ePayco Payment Methods
  async getEPaycoConfig(): Promise<ApiResponse<any>> {
    return this.request("/payments/epayco/config", {
      method: "GET",
    })
  }

  async createEPaycoTransaction(paymentData: {
    amount: number
    currency?: string
    description: string
    eventId: string
    ticketIds: string[]
    customerInfo: {
      name: string
      email: string
      phone: string
      address: string
    }
  }): Promise<ApiResponse<any>> {
    return this.request("/payments/epayco/create", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }

  async getEPaycoTransactionStatus(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/epayco/status/${transactionId}`, {
      method: "GET",
    })
  }

  // Cobru Payment Methods
  async getCobruConfig(): Promise<ApiResponse<any>> {
    return this.request("/payments/cobru/config", {
      method: "GET",
    })
  }

  async createCobruTransaction(paymentData: {
    amount: number
    currency?: string
    description: string
    reference: string
    customerEmail?: string
    customerName?: string
    customerPhone?: string
    eventId?: string
    ticketTypeId?: string
    quantity?: number
  }): Promise<ApiResponse<any>> {
    return this.request("/payments/cobru/create", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }

  async getCobruTransactionStatus(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/cobru/status/${transactionId}`, {
      method: "GET",
    })
  }

  async processCobruRefund(transactionId: string, amount?: number, reason?: string): Promise<ApiResponse<any>> {
    return this.request("/payments/cobru/refund", {
      method: "POST",
      body: JSON.stringify({ transactionId, amount, reason }),
    })
  }

  async getAdminEvents(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/events${queryParams}`, {
      method: "GET",
    })
  }

  async getAdminSales(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/sales${queryParams}`, {
      method: "GET",
    })
  }

  async getAdminSale(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/sales/${id}`, {
      method: "GET",
    })
  }

  async updateAdminSaleStatus(id: number, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/sales/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    })
  }

  async performCheckIn(saleId: number, checkInData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/sales/${saleId}/checkin`, {
      method: "POST",
      body: JSON.stringify(checkInData),
    })
  }

  async getAdminPayments(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/payments${queryParams}`, {
      method: "GET",
    })
  }

  async getPayments(params?: any): Promise<ApiResponse<any[]>> {
    return this.request("/payments", {
      method: "GET",
    })
  }

  async getPaymentById(id: number): Promise<ApiResponse<any>> {
    return this.request(`/payments/${id}`, {
      method: "GET",
    })
  }

  async processPayment(paymentData: any): Promise<ApiResponse<any>> {
    return this.request("/payments/process", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }

  async cancelPayment(id: number): Promise<ApiResponse<any>> {
    return this.request(`/payments/${id}/cancel`, {
      method: "PUT",
    })
  }

  // 2FA API
  async enable2FA(): Promise<ApiResponse<any>> {
    return this.request("/auth/2fa/enable", {
      method: "POST",
    })
  }

  async verify2FA(code: string): Promise<ApiResponse<any>> {
    return this.request("/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  async disable2FA(code: string): Promise<ApiResponse<any>> {
    return this.request("/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    })
  }

  async get2FAStatus(): Promise<ApiResponse<any>> {
    return this.request("/auth/2fa/status", {
      method: "GET",
    })
  }

  // Saved Reports API
  async getSavedReports(userId?: number): Promise<ApiResponse<any[]>> {
    const queryParams = userId ? `?userId=${userId}` : ""
    return this.request(`/admin/reports/saved${queryParams}`, {
      method: "GET",
    })
  }

  async saveReport(reportData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/reports/saved", {
      method: "POST",
      body: JSON.stringify(reportData),
    })
  }

  async updateSavedReport(id: number, reportData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/saved/${id}`, {
      method: "PUT",
      body: JSON.stringify(reportData),
    })
  }

  async deleteSavedReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/saved/${id}`, {
      method: "DELETE",
    })
  }

  async runSavedReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/saved/${id}/run`, {
      method: "POST",
    })
  }

  async toggleScheduledReport(id: number, enabled: boolean): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/saved/${id}/schedule`, {
      method: "PUT",
      body: JSON.stringify({ enabled }),
    })
  }

  // Audit Logs API
  async getAuditLogs(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/audit-logs${queryParams}`, {
      method: "GET",
    })
  }

  async createAuditLog(logData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/audit-logs", {
      method: "POST",
      body: JSON.stringify(logData),
    })
  }

  async exportAuditLogs(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/audit-logs/export${queryParams}`, {
      method: "GET",
    })
  }

  // Backup API
  async getBackups(): Promise<ApiResponse<any[]>> {
    return this.request("/admin/backups", {
      method: "GET",
    })
  }

  async createBackup(backupData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/backups", {
      method: "POST",
      body: JSON.stringify(backupData),
    })
  }

  async downloadBackup(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/backups/${id}/download`, {
      method: "GET",
    })
  }

  async deleteBackup(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/backups/${id}`, {
      method: "DELETE",
    })
  }

  async scheduleBackup(scheduleData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/backups/schedule", {
      method: "POST",
      body: JSON.stringify(scheduleData),
    })
  }

  // Notifications API
  async getNotifications(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/notifications${queryParams}`, {
      method: "GET",
    })
  }

  // Settings API
  async getSettings(): Promise<ApiResponse<any>> {
    return this.request("/admin/settings", {
      method: "GET",
    })
  }

  async updateSettings(settingsData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settingsData),
    })
  }

  // Notifications Management API
  async createNotification(notificationData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/notifications", {
      method: "POST",
      body: JSON.stringify(notificationData),
    })
  }

  async markNotificationAsRead(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/notifications/${id}/read`, {
      method: "PUT",
    })
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<any>> {
    return this.request("/admin/notifications/read-all", {
      method: "PUT",
    })
  }

  // Tickets API
  async getTickets(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/tickets${queryParams}`, {
      method: "GET",
    })
  }

  async createTicket(ticketData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  }

  async updateTicket(id: number, ticketData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${id}`, {
      method: "PUT",
      body: JSON.stringify(ticketData),
    })
  }

  async deleteTicket(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${id}`, {
      method: "DELETE",
    })
  }

  async getTicket(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${id}`, {
      method: "GET",
    })
  }

  async validateTicket(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${id}/validate`, {
      method: "POST",
    })
  }

  async resendTicket(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${id}/resend`, {
      method: "POST",
    })
  }

  // Media API
  async createMedia(mediaData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/media", {
      method: "POST",
      body: JSON.stringify(mediaData),
    })
  }

  async getMediaItem(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/media/${id}`, {
      method: "GET",
    })
  }

  // Analytics API
  async getAnalytics(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/analytics${queryParams}`, {
      method: "GET",
    })
  }

  // Advanced Reports API
  async generateReport(reportData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/reports/generate", {
      method: "POST",
      body: JSON.stringify(reportData),
    })
  }

  async exportReport(reportId: number, format: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/${reportId}/export?format=${format}`, {
      method: "GET",
    })
  }

  async getDailySalesReport(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/reports/daily-sales${queryParams}`, {
      method: "GET",
    })
  }

  async getTopEventsReport(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/reports/top-events${queryParams}`, {
      method: "GET",
    })
  }

  async getTrendsReport(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/reports/trends${queryParams}`, {
      method: "GET",
    })
  }

  async getCompleteReport(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/reports/complete${queryParams}`, {
      method: "GET",
    })
  }

  // Individual Settings API
  async getSetting(key: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/settings/${key}`, {
      method: "GET",
    })
  }

  async updateSetting(key: string, value: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/settings/${key}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    })
  }

  async resetSettings(): Promise<ApiResponse<any>> {
    return this.request("/admin/settings/reset", {
      method: "POST",
    })
  }

  // Advanced Notifications API
  async deleteNotification(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/notifications/${id}`, {
      method: "DELETE",
    })
  }

  async broadcastNotification(notificationData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(notificationData),
    })
  }

  // Settings Export/Import API
  async exportSettings(): Promise<ApiResponse<any>> {
    return this.request("/admin/settings/export", {
      method: "GET",
    })
  }

  async importSettings(settingsData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/settings/import", {
      method: "POST",
      body: JSON.stringify(settingsData),
    })
  }

  // Advanced Analytics API
  async getPerformanceMetrics(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/analytics/performance${queryParams}`, {
      method: "GET",
    })
  }

  async getMarketTrends(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/analytics/market-trends${queryParams}`, {
      method: "GET",
    })
  }

  async getBehaviorAnalysis(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/analytics/behavior${queryParams}`, {
      method: "GET",
    })
  }

  async getSalesPredictions(params?: any): Promise<ApiResponse<any>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/analytics/sales-predictions${queryParams}`, {
      method: "GET",
    })
  }

  // Seat Maps API
  async getSeatMaps(): Promise<ApiResponse<any[]>> {
    return this.request("/seat-maps", {
      method: "GET",
    })
  }

  async getSeatMap(id: string): Promise<ApiResponse<any>> {
    return this.request(`/seat-maps/${id}`, {
      method: "GET",
    })
  }

  async createSeatMap(seatMapData: any): Promise<ApiResponse<any>> {
    return this.request("/seat-maps", {
      method: "POST",
      body: JSON.stringify(seatMapData),
    })
  }

  async updateSeatMap(id: string, seatMapData: any): Promise<ApiResponse<any>> {
    return this.request(`/seat-maps/${id}`, {
      method: "PUT",
      body: JSON.stringify(seatMapData),
    })
  }

  async deleteSeatMap(id: string): Promise<ApiResponse<any>> {
    return this.request(`/seat-maps/${id}`, {
      method: "DELETE",
    })
  }

  async getSeatMapTemplates(): Promise<ApiResponse<any[]>> {
    return this.request("/seat-maps/templates", {
      method: "GET",
    })
  }

  async createSeatMapTemplate(templateData: any): Promise<ApiResponse<any>> {
    return this.request("/seat-maps/templates", {
      method: "POST",
      body: JSON.stringify(templateData),
    })
  }

  // Admin User Management API
  async createAdminUser(userData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async getAdminUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}`, {
      method: "GET",
    })
  }

  async updateAdminUser(id: number, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  async deleteAdminUser(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/users/${id}`, {
      method: "DELETE",
    })
  }

  async updateUser(id: number, userData: any): Promise<ApiResponse<any>> {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    })
  }

  // Admin Role Management API
  async getAdminRoles(): Promise<ApiResponse<any[]>> {
    return this.request("/admin/roles", {
      method: "GET",
    })
  }

  async createAdminRole(roleData: any): Promise<ApiResponse<any>> {
    return this.request("/admin/roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    })
  }

  async updateAdminRole(id: string, roleData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(roleData),
    })
  }

  async deleteAdminRole(id: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/roles/${id}`, {
      method: "DELETE",
    })
  }

  // Event Management API
  async updateEvent(id: number, eventData: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${id}`, {
      method: "PUT",
      body: JSON.stringify(eventData),
    })
  }

  // Ticket Type Management API
  async getTicketTypes(): Promise<ApiResponse<any[]>> {
    return this.request("/ticket-types", {
      method: "GET",
    })
  }

  async getTicketType(id: number): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/${id}`, {
      method: "GET",
    })
  }

  async getEventTicketTypes(eventId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/events/${eventId}/ticket-types`)
  }

  async createTicketType(eventId: number, ticketTypeData: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/ticket-types`, {
      method: 'POST',
      body: JSON.stringify(ticketTypeData),
    })
  }

  async updateTicketType(id: number, ticketTypeData: any): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/${id}`, {
      method: "PUT",
      body: JSON.stringify(ticketTypeData),
    })
  }

  async deleteTicketType(ticketTypeId: number): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/${ticketTypeId}`, {
      method: 'DELETE',
    })
  }

  // Event Ticket Types API (specific routes)
  async getEventTicketTypesByEvent(eventId: number): Promise<ApiResponse<any[]>> {
    return this.request(`/ticket-types/event/${eventId}`)
  }

  async createEventTicketTypeByEvent(eventId: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/event/${eventId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateEventTicketTypeByEvent(ticketTypeId: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/event/${ticketTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteEventTicketTypeByEvent(ticketTypeId: number): Promise<ApiResponse<any>> {
    return this.request(`/ticket-types/event/${ticketTypeId}`, {
      method: 'DELETE',
    })
  }

  // Sales API
  async getSales(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/sales${queryParams}`, {
      method: "GET",
    })
  }

  async getUserSales(userId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/sales/user/${userId}`, {
      method: "GET",
    })
  }

  async createSale(saleData: any): Promise<ApiResponse<any>> {
    return this.request("/sales", {
      method: "POST",
      body: JSON.stringify(saleData),
    })
  }

  async getSaleDetails(saleId: string): Promise<ApiResponse<any>> {
    return this.request(`/sales/${saleId}`, {
      method: "GET",
    })
  }

  async cancelSale(saleId: string, reason?: string): Promise<ApiResponse<any>> {
    return this.request(`/sales/${saleId}/cancel`, {
      method: "PUT",
      body: JSON.stringify({ reason }),
    })
  }

  async getSalesStats(): Promise<ApiResponse<any>> {
    return this.request("/sales/stats/overview", {
      method: "GET",
    })
  }

  // Cart abandonment tracking
  async recordCartAbandonment(cartData: any): Promise<ApiResponse<any>> {
    return this.request("/sales/cart-abandonment", {
      method: "POST",
      body: JSON.stringify(cartData),
    })
  }

  // Payment attempt tracking
  async recordPaymentAttempt(paymentData: any): Promise<ApiResponse<any>> {
    return this.request("/sales/payment-attempt", {
      method: "POST",
      body: JSON.stringify(paymentData),
    })
  }

  // Update payment attempt status
  async updatePaymentAttempt(saleId: string, updateData: any): Promise<ApiResponse<any>> {
    return this.request(`/sales/payment-attempt/${saleId}`, {
      method: "PUT",
      body: JSON.stringify(updateData),
    })
  }

  // Users API
  async getUsers(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/users${queryParams}`, {
      method: "GET",
    })
  }

  // Obtener información del usuario actual
  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request("/auth/verify-token", {
      method: "GET",
    })
  }

  // Export APIs
  async exportToPDF(data: any): Promise<ApiResponse<any>> {
    return this.request("/admin/export/pdf", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async exportToExcel(data: any): Promise<ApiResponse<any>> {
    return this.request("/admin/export/excel", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async exportToCSV(data: any): Promise<ApiResponse<any>> {
    return this.request("/admin/export/csv", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Scheduled Reports API
  async getScheduledReports(): Promise<ApiResponse<any[]>> {
    return this.request("/admin/reports/scheduled", {
      method: "GET",
    })
  }

  async createScheduledReport(data: any): Promise<ApiResponse<any>> {
    return this.request("/admin/reports/scheduled", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateScheduledReport(id: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/scheduled/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteScheduledReport(id: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/reports/scheduled/${id}`, {
      method: "DELETE",
    })
  }



  // Export data
  async exportData(exportData: any): Promise<ApiResponse<any>> {
    return this.request('/admin/export', {
      method: 'POST',
      body: JSON.stringify(exportData),
    })
  }

  // Get ticket preview
  async getTicketPreview(ticketId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${ticketId}/preview`)
  }

  // Get QR code
  async getQRCode(ticketId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/tickets/${ticketId}/qr`)
  }

  // Physical tickets API
  async getPhysicalTickets(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/physical-tickets${queryParams}`)
  }

  async createPhysicalTicketBatch(ticketData: any): Promise<ApiResponse<any>> {
    return this.request('/admin/physical-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    })
  }

  async updatePhysicalTicketStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/physical-tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Sales points API - moved to dedicated section below

  // Virtual tickets API
  async getVirtualTickets(params?: any): Promise<ApiResponse<any[]>> {
    const queryParams = params ? `?${new URLSearchParams(params).toString()}` : ""
    return this.request(`/admin/virtual-tickets${queryParams}`)
  }

  async createVirtualTicket(ticketData: any): Promise<ApiResponse<any>> {
    return this.request('/admin/virtual-tickets', {
      method: 'POST',
      body: JSON.stringify(ticketData),
    })
  }

  async updateVirtualTicketStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/virtual-tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async resendVirtualTicket(id: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/virtual-tickets/${id}/resend`, {
      method: 'POST',
    })
  }

  // Media library API
  async uploadMedia(formData: FormData): Promise<ApiResponse<any>> {
    return this.request('/admin/media/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let the browser set the content-type for FormData
    })
  }

  async getMedia(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/media')
  }

  async getMediaFolders(): Promise<ApiResponse<any[]>> {
    return this.request('/admin/media/folders')
  }

  async createMediaFolder(folderData: any): Promise<ApiResponse<any>> {
    return this.request('/admin/media/folders', {
      method: 'POST',
      body: JSON.stringify(folderData),
    })
  }

  async deleteMediaFolder(folderId: number): Promise<ApiResponse<any>> {
    return this.request(`/admin/media/folders/${folderId}`, {
      method: 'DELETE',
    })
  }

  async updateMedia(mediaId: string, mediaData: any): Promise<ApiResponse<any>> {
    return this.request(`/admin/media/${mediaId}`, {
      method: 'PUT',
      body: JSON.stringify(mediaData),
    })
  }

  async deleteMedia(mediaId: string): Promise<ApiResponse<any>> {
    return this.request(`/admin/media/${mediaId}`, {
      method: 'DELETE',
    })
  }

  // Admin Events API
  async createAdminEvent(eventData: any): Promise<ApiResponse<any>> {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  }

  async updateAdminEvent(eventId: number, eventData: any): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    })
  }

  async updateAdminEventStatus(eventId: number, status: string): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  async deleteAdminEvent(eventId: number): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`, {
      method: 'DELETE',
    })
  }

  async getAdminEvent(eventId: number): Promise<ApiResponse<any>> {
    return this.request(`/events/${eventId}`)
  }

  // ===== REPORTES API =====

  async getSalesReport(params?: {
    startDate?: string
    endDate?: string
    eventId?: string
    categoryId?: string
    paymentMethod?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.eventId) queryParams.append('eventId', params.eventId)
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
    if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod)
    
    const queryString = queryParams.toString()
    const endpoint = `/reports/sales${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getEventsReport(params?: {
    startDate?: string
    endDate?: string
    categoryId?: string
    status?: string
    organizerId?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.categoryId) queryParams.append('categoryId', params.categoryId)
    if (params?.status) queryParams.append('status', params.status)
    if (params?.organizerId) queryParams.append('organizerId', params.organizerId)
    
    const queryString = queryParams.toString()
    const endpoint = `/reports/events${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getUsersReport(params?: {
    startDate?: string
    endDate?: string
    role?: string
    status?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.role) queryParams.append('role', params.role)
    if (params?.status) queryParams.append('status', params.status)
    
    const queryString = queryParams.toString()
    const endpoint = `/reports/users${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  async getFinancialReport(params?: {
    startDate?: string
    endDate?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const queryString = queryParams.toString()
    const endpoint = `/reports/financial${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  // ===== ANALYTICS API =====

  async getSalesPatterns(params?: {
    startDate?: string
    endDate?: string
    eventId?: string
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.eventId) queryParams.append('eventId', params.eventId)
    
    const queryString = queryParams.toString()
    const endpoint = `/analytics/sales-patterns${queryString ? `?${queryString}` : ''}`
    
    return this.request(endpoint)
  }

  // ===== ACTIVITY DATA API =====
  async getActivityData(days: number = 30): Promise<ApiResponse<any>> {
    const endpoint = `/admin/activity-data?days=${days}`
    return this.request(endpoint)
  }

  // ===== TRANSACTION DISTRIBUTION API =====
  async getTransactionDistribution(): Promise<ApiResponse<any>> {
    const endpoint = `/admin/transaction-distribution`
    return this.request(endpoint)
  }

  // ===== HOURLY ACTIVITY API =====
  async getHourlyActivity(): Promise<ApiResponse<any>> {
    const endpoint = `/admin/hourly-activity`
    return this.request(endpoint)
  }

  // ===== ORGANIZER/PROMOTER API =====
  // Dashboard del organizador/promotor
  async getOrganizerDashboard(): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/dashboard`
    return this.request(endpoint)
  }

  // Estadísticas rápidas para actualizaciones en tiempo real
  async getOrganizerQuickStats(): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/quick-stats`
    return this.request(endpoint)
  }

  // Lista de eventos del organizador/promotor
  async getOrganizerEvents(params?: { page?: number; limit?: number; status?: string; search?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = `/organizer/events${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Detalles de un evento específico
  async getOrganizerEvent(eventId: string): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events/${eventId}`
    return this.request(endpoint)
  }

  // Analytics de un evento específico
  async getOrganizerEventAnalytics(eventId: string): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events/${eventId}/analytics`
    return this.request(endpoint)
  }

  // Asistentes de un evento
  async getOrganizerEventAttendees(eventId: string, params?: { page?: number; limit?: number; search?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.search) queryParams.append('search', params.search)
    
    const endpoint = `/organizer/events/${eventId}/attendees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Ventas de un evento
  async getOrganizerEventSales(eventId: string, params?: { page?: number; limit?: number; status?: string; startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.status) queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const endpoint = `/organizer/events/${eventId}/sales${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Reportes del organizador/promotor
  async getOrganizerReports(params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const endpoint = `/organizer/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Actualizar evento del organizador/promotor
  async updateOrganizerEvent(eventId: string, eventData: any): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events/${eventId}`
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(eventData)
    })
  }

  // Eliminar evento del organizador/promotor
  async deleteOrganizerEvent(eventId: string): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events/${eventId}`
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  // Crear nuevo evento
  async createOrganizerEvent(eventData: any): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events`
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(eventData)
    })
  }

  // Cambiar estado del evento
  async updateOrganizerEventStatus(eventId: string, status: string): Promise<ApiResponse<any>> {
    const endpoint = `/organizer/events/${eventId}/status`
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  // Asignar evento a organizador
  async assignEventToOrganizer(eventId: number, organizerId: number): Promise<ApiResponse<any>> {
    const endpoint = `/admin/events/${eventId}/assign-organizer`
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify({ organizerId })
    })
  }

  // ===== MÉTODOS DE PAGO =====

  // Procesar pago con tarjeta de crédito/débito
  async processCardPayment(paymentData: {
    cardNumber: string
    expiryDate: string
    cvv: string
    holderName: string
    amount: number
    currency?: string
    description?: string
    customerId: number
    eventId: number
    ticketTypeId: number
    quantity: number
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/process-card', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
  }

  // Procesar pago PSE
  async processPSEPayment(paymentData: {
    bank: string
    accountType: string
    documentType: string
    documentNumber: string
    amount: number
    currency?: string
    description?: string
    customerId: number
    eventId: number
    ticketTypeId: number
    quantity: number
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/process-pse', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
  }

  // Procesar pago Daviplata
  async processDaviplataPayment(paymentData: {
    phone: string
    amount: number
    currency?: string
    description?: string
    customerId: number
    eventId: number
    ticketTypeId: number
    quantity: number
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/process-daviplata', {
      method: 'POST',
      body: JSON.stringify(paymentData)
    })
  }

  // Verificar estado de transacción
  async getPaymentStatus(transactionId: string): Promise<ApiResponse<any>> {
    return this.request(`/payments/status/${transactionId}`)
  }

  // Obtener historial de pagos del usuario
  async getPaymentHistory(params?: { page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const endpoint = `/payments/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    return this.request(endpoint)
  }

  // Verificar disponibilidad de boletos antes del pago
  async checkTicketAvailability(data: {
    eventId: number
    ticketTypeId: number
    quantity: number
  }): Promise<ApiResponse<any>> {
    return this.request('/payments/check-availability', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ===== MÉTODOS PARA USUARIOS =====

  // Obtener pagos del usuario
  async getUserPayments(userId: number): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}/payments`)
  }

  // Obtener boletos del usuario
  async getUserTickets(userId: number): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}/tickets`)
  }

  // ===== MÉTODOS DE PUNTOS DE VENTA =====

  // Obtener todos los puntos de venta
  async getSalesPoints(): Promise<ApiResponse<any>> {
    // Usar endpoint de prueba temporalmente
    return this.request('/test-auth-sales-points')
  }

  // Crear nuevo punto de venta
  async createSalesPoint(data: any): Promise<ApiResponse<any>> {
    // Usar endpoint de prueba temporalmente
    return this.request('/test-auth-sales-points', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Actualizar punto de venta
  async updateSalesPoint(id: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/sales-points/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Eliminar punto de venta
  async deleteSalesPoint(id: number): Promise<ApiResponse<any>> {
    return this.request(`/sales-points/${id}`, {
      method: 'DELETE'
    })
  }

  // Obtener ventas de un punto de venta
  async getSalesPointSales(salesPointId: number): Promise<ApiResponse<any>> {
    return this.request(`/sales-points/${salesPointId}/sales`)
  }

  // Crear venta directa
  async createDirectSale(data: any): Promise<ApiResponse<any>> {
    return this.request('/sales-points/direct-sale', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // ===== MÉTODOS DE PRODUCTOS =====

  // Obtener todos los productos
  async getProducts(): Promise<ApiResponse<any>> {
    return this.request('/products')
  }

  // Crear nuevo producto
  async createProduct(data: any): Promise<ApiResponse<any>> {
    return this.request('/products', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Actualizar producto
  async updateProduct(id: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Eliminar producto
  async deleteProduct(id: number): Promise<ApiResponse<any>> {
    return this.request(`/products/${id}`, {
      method: 'DELETE'
    })
  }

  // ===== MÉTODOS DE USUARIOS Y PRIVILEGIOS =====

  // Obtener usuarios con privilegios
  async getUsersWithPrivileges(): Promise<ApiResponse<any>> {
    return this.request('/users/with-privileges')
  }

  // Crear nuevo usuario
  async createUser(data: any): Promise<ApiResponse<any>> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Actualizar privilegio de usuario
  async updateUserPrivilege(userId: number, salesPointId: number, privilege: string, value: boolean): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}/privileges`, {
      method: 'PUT',
      body: JSON.stringify({
        sales_point_id: salesPointId,
        privilege,
        value
      })
    })
  }

  // Eliminar usuario
  async deleteUser(userId: number): Promise<ApiResponse<any>> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE'
    })
  }

  // ===== MÉTODOS PARA ORGANIZADORES =====

  // Obtener ventas del organizador
  async getOrganizerSales(organizerId: number): Promise<ApiResponse<any>> {
    return this.request(`/organizer/sales/${organizerId}`)
  }

  // Obtener asistentes del organizador
  async getOrganizerAttendees(organizerId: number): Promise<ApiResponse<any>> {
    return this.request(`/organizer/attendees/${organizerId}`)
  }

  // Organizer Dashboard Stats API
  async getOrganizerDashboardStats(organizerId: number): Promise<ApiResponse<any>> {
    return this.request(`/organizers/${organizerId}/dashboard/stats`, {
      method: "GET",
    })
  }

  async getOrganizerSalesRealtime(organizerId: number): Promise<ApiResponse<any>> {
    return this.request(`/organizers/${organizerId}/sales/realtime`, {
      method: "GET",
    })
  }

  // ===== MÉTODOS DEL SISTEMA POS =====

  // Obtener cajas registradoras
  async getPOSRegisters(): Promise<ApiResponse<any>> {
    return this.request('/pos/registers')
  }

  // Crear nueva caja registradora
  async createPOSRegister(data: any): Promise<ApiResponse<any>> {
    return this.request('/pos/registers', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Actualizar caja registradora
  async updatePOSRegister(id: number, data: any): Promise<ApiResponse<any>> {
    return this.request(`/pos/registers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // Abrir sesión de caja
  async openPOSSession(registerId: number, openingAmount: number = 0): Promise<ApiResponse<any>> {
    return this.request('/pos/sessions/open', {
      method: 'POST',
      body: JSON.stringify({
        register_id: registerId,
        opening_amount: openingAmount
      })
    })
  }

  // Cerrar sesión de caja
  async closePOSSession(sessionId: number, closingAmount: number): Promise<ApiResponse<any>> {
    return this.request(`/pos/sessions/${sessionId}/close`, {
      method: 'POST',
      body: JSON.stringify({
        closing_amount: closingAmount
      })
    })
  }

  // Obtener sesiones activas
  async getActivePOSessions(): Promise<ApiResponse<any>> {
    return this.request('/pos/sessions/active')
  }

  // Crear nueva orden POS
  async createPOSOrder(data: any): Promise<ApiResponse<any>> {
    return this.request('/pos/orders', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // Obtener órdenes por sesión
  async getPOSOrdersBySession(sessionId: number): Promise<ApiResponse<any>> {
    return this.request(`/pos/orders/session/${sessionId}`)
  }

  // Obtener detalles de orden
  async getPOSOrderDetails(orderId: number): Promise<ApiResponse<any>> {
    return this.request(`/pos/orders/${orderId}`)
  }

}

export const apiClient = new ApiClient()
