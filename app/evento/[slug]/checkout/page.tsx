import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import CheckoutClient from "./checkout-client"

interface CheckoutPageProps {
  params: { slug: string }
  searchParams: { 
    tickets?: string
    data?: string
  }
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const event = await getEventBySlugOriginal(params.slug)
  
  if (!event) {
    notFound()
  }

  // Parsear los datos de checkout
  let checkoutData = {}
  try {
    if (searchParams.data) {
      checkoutData = JSON.parse(decodeURIComponent(searchParams.data))
    } else if (searchParams.tickets) {
      checkoutData = {
        selectedTickets: JSON.parse(searchParams.tickets),
        selectedSeats: []
      }
    }
  } catch (error) {
    console.error('Error parsing checkout data:', error)
  }

  return (
    <CheckoutClient 
      event={event} 
      checkoutData={checkoutData}
    />
  )
}
