import { Suspense } from "react"
import { AlertsDashboard } from "@/components/admin/alerts/AlertsDashboard"

export default function AlertsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Alertas</h1>
        <p className="text-gray-600">Gestión completa de alertas y notificaciones del sistema POS</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando sistema de alertas...</p>
          </div>
        </div>
      }>
        <AlertsDashboard />
      </Suspense>
    </div>
  )
}
