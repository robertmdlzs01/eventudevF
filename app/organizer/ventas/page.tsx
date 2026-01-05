import { Suspense } from "react"
import OrganizerSalesPageClient from "./OrganizerSalesPageClient"

export default function OrganizerSalesPage() {
  return (
    <Suspense fallback={<div>Cargando datos de ventas...</div>}>
      <OrganizerSalesPageClient />
    </Suspense>
  )
}
