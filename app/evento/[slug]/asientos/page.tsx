import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import SeatSelectionClient from "./seat-selection-client"

interface SeatSelectionPageProps {
  params: { slug: string }
  searchParams: { tickets?: string }
}

export default async function SeatSelectionPage({ params, searchParams }: SeatSelectionPageProps) {
  console.log('SeatSelectionPage - slug:', params.slug)
  
  const event = await getEventBySlugOriginal(params.slug)
  
  console.log('SeatSelectionPage - event:', event)
  
  if (!event) {
    console.log('SeatSelectionPage - Event not found, redirecting to notFound')
    notFound()
  }

  // Parsear las boletas seleccionadas desde los query params
  let selectedTickets = {}
  try {
    if (searchParams.tickets) {
      selectedTickets = JSON.parse(searchParams.tickets)
    }
  } catch (error) {
    console.error('Error parsing tickets:', error)
  }

  console.log('SeatSelectionPage - selectedTickets:', selectedTickets)

  return (
    <SeatSelectionClient 
      event={event} 
      selectedTickets={selectedTickets}
    />
  )
}
