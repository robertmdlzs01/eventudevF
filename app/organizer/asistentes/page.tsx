import { Suspense } from "react"
import OrganizerAttendeesPageClient from "./OrganizerAttendeesPageClient"

export default function OrganizerAttendeesPage() {
  return (
    <Suspense fallback={<div>Cargando asistentes...</div>}>
      <OrganizerAttendeesPageClient />
    </Suspense>
  )
}
