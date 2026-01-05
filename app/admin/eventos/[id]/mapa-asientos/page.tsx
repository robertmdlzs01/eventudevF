import { Suspense } from "react"
import AdminSeatMapPageClient from "./AdminSeatMapPageClient"

interface AdminSeatMapPageProps {
  params: {
    id: string
  }
}

export default function AdminSeatMapPage({ params }: AdminSeatMapPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div className="text-center py-8">Cargando mapa de asientos...</div>}>
        <AdminSeatMapPageClient eventId={params.id} />
      </Suspense>
    </div>
  )
}
