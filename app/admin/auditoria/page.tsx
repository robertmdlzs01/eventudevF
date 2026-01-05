import { Suspense } from 'react'
import AdminAuditClientSimple from './AdminAuditClientSimple'

export default function AdminAuditPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Registro de Actividad</h1>
        <p className="mt-2 text-gray-600">
          Monitorea todas las actividades del sistema, incluyendo accesos, cambios y transacciones.
        </p>
      </div>

      <Suspense fallback={<div>Cargando...</div>}>
        <AdminAuditClientSimple />
      </Suspense>
    </div>
  )
}