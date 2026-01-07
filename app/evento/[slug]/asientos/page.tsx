import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import SeatSelectionClient from "./seat-selection-client"

interface SeatSelectionPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ tickets?: string }>
}

export default async function SeatSelectionPage({ params, searchParams }: SeatSelectionPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  console.log('SeatSelectionPage - slug:', slug)
  
  const event = await getEventBySlugOriginal(slug)
  
  console.log('SeatSelectionPage - event:', event)
  
  if (!event) {
    console.log('SeatSelectionPage - Event not found, redirecting to notFound')
    notFound()
  }

  // Parsear las boletas seleccionadas desde los query params
  let selectedTickets = {}
  try {
    if (resolvedSearchParams.tickets) {
      selectedTickets = JSON.parse(resolvedSearchParams.tickets)
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
