import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import EventDetailClient from "./event-detail-client"

interface EventPageProps {
  params: { slug: string }
}

export default async function EventPage({ params }: EventPageProps) {
  const event = await getEventBySlugOriginal(params.slug)
  
  if (!event) {
    notFound()
  }

  return <EventDetailClient event={event} />
}
