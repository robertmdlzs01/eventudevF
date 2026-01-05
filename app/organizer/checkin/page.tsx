import { Suspense } from "react"
import OrganizerCheckInPageClient from "./OrganizerCheckInPageClient"

export default function OrganizerCheckInPage() {
  return (
    <Suspense fallback={<div>Cargando sistema de check-in...</div>}>
      <OrganizerCheckInPageClient />
    </Suspense>
  )
}
