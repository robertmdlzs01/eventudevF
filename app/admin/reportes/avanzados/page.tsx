import { Suspense } from "react"
import { AdvancedReportsDashboard } from "@/components/admin/reports/AdvancedReportsDashboard"

export default function AdvancedReportsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reportes Avanzados</h1>
        <p className="text-gray-600">Análisis completo del sistema POS con reportes del WordPress</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando reportes...</p>
          </div>
        </div>
      }>
        <AdvancedReportsDashboard />
      </Suspense>
    </div>
  )
}
