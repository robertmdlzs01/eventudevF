import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import EventDetailClient from "./event-detail-client"

interface EventPageProps {
  params: Promise<{ slug: string }>
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params
  const event = await getEventBySlugOriginal(slug)
  
  if (!event) {
    notFound()
  }

  return <EventDetailClient event={event} />
}
