import { Suspense } from "react"
import EventCapacityPageClient from "./EventCapacityPageClient"

export default function EventCapacityPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <EventCapacityPageClient eventId={params.id} />
    </Suspense>
  )
}
