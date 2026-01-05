import { Suspense } from "react"
import OrganizerReportsPageClient from "./OrganizerReportsPageClient"

export const metadata = {
  title: "Reportes | Organizador - Eventu",
  description: "Reportes detallados y exportables para organizadores",
}

export default function OrganizerReportsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<div className="p-8">Cargando reportes...</div>}>
        <OrganizerReportsPageClient />
      </Suspense>
    </div>
  )
}
