import { Suspense } from 'react'
import AdminDashboardClient from './AdminDashboardClient'

// Deshabilitar prerenderizado para esta página
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function AdminPage() {
  // Datos por defecto para el dashboard POS
  const defaultDashboardData = {
    stats: {
      totalUsers: 0,
      adminUsers: 0,
      organizerUsers: 0,
      regularUsers: 0,
      totalEvents: 0,
      publishedEvents: 0,
      draftEvents: 0,
      cancelledEvents: 0,
      totalSales: 0,
      totalRevenue: 0,
      salesLast30Days: 0,
      revenueLast30Days: 0,
      // Métricas POS
      activeRegisters: 0,
      activeSessions: 0,
      todaySales: 0,
      todayOrders: 0
    },
    growth: {
      newUsers30Days: 0,
      newEvents30Days: 0,
      newSales30Days: 0,
      newRevenue30Days: 0
    },
    recentEvents: [],
    recentUsers: [],
    recentSales: [],
    topEvents: [],
    salesByMonth: []
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    }>
      <AdminDashboardClient dashboardData={defaultDashboardData} />
    </Suspense>
  )
}