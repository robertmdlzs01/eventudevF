import { Suspense } from "react"
import { CajasRegistradorasClient } from "@/components/admin/pos/CajasRegistradorasClient"

export default function CajasRegistradorasPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Cargando cajas registradoras...</p>
        </div>
      </div>
    }>
      <CajasRegistradorasClient />
    </Suspense>
  )
}
