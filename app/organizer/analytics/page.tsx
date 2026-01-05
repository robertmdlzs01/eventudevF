import { Suspense } from "react"
import OrganizerAnalyticsPageClient from "./OrganizerAnalyticsPageClient"

export const metadata = {
  title: "Analíticas | Organizador - Eventu",
  description: "Analíticas detalladas y métricas de rendimiento para organizadores",
}

export default function OrganizerAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-8">Cargando analíticas...</div>}>
        <OrganizerAnalyticsPageClient />
      </Suspense>
    </div>
  )
}
