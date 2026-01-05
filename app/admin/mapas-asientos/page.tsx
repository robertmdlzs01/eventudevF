import { Suspense } from "react"
import { getSeatMaps } from "@/app/admin/actions"
import AdminSeatMapsPageClient from "./AdminSeatMapsPageClient"

export default async function AdminSeatMapsPage() {
  const seatMaps = await getSeatMaps()

  return (
    <Suspense fallback={<div>Cargando mapas de asientos...</div>}>
      <AdminSeatMapsPageClient initialSeatMaps={seatMaps} />
    </Suspense>
  )
}
