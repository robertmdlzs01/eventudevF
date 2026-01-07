import { getEventBySlugOriginal } from "@/lib/events-data"
import { notFound } from "next/navigation"
import CheckoutClient from "./checkout-client"

interface CheckoutPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ 
    tickets?: string
    data?: string
  }>
}

export default async function CheckoutPage({ params, searchParams }: CheckoutPageProps) {
  const { slug } = await params
  const resolvedSearchParams = await searchParams
  const event = await getEventBySlugOriginal(slug)
  
  if (!event) {
    notFound()
  }

  // Parsear los datos de checkout
  let checkoutData = {}
  try {
    if (resolvedSearchParams.data) {
      checkoutData = JSON.parse(decodeURIComponent(resolvedSearchParams.data))
    } else if (resolvedSearchParams.tickets) {
      checkoutData = {
        selectedTickets: JSON.parse(resolvedSearchParams.tickets),
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
