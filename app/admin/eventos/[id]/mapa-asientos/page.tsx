import { Suspense } from "react"
import AdminSeatMapPageClient from "./AdminSeatMapPageClient"

interface AdminSeatMapPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminSeatMapPage({ params }: AdminSeatMapPageProps) {
  const { id } = await params
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<div className="text-center py-8">Cargando mapa de asientos...</div>}>
        <AdminSeatMapPageClient eventId={id} />
      </Suspense>
    </div>
  )
}
