import { Suspense } from "react"
import EventCapacityPageClient from "./EventCapacityPageClient"

export default async function EventCapacityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <EventCapacityPageClient eventId={id} />
    </Suspense>
  )
}
