import { Suspense } from "react"
import { SystemConfigDashboard } from "@/components/admin/config/SystemConfigDashboard"

export default function SystemConfigPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configuración del Sistema</h1>
        <p className="text-gray-600">Gestión completa de configuraciones del sistema POS basado en WordPress</p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Cargando configuración del sistema...</p>
          </div>
        </div>
      }>
        <SystemConfigDashboard />
      </Suspense>
    </div>
  )
}