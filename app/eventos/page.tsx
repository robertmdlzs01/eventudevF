import { Metadata } from 'next'
import EventsPageClient from './EventsPageClient'

export const metadata: Metadata = {
  title: 'Eventos - Eventu',
  description: 'Explora todos los eventos disponibles en Eventu. Encuentra el evento perfecto para ti.',
  keywords: 'eventos, tickets, boletos, conciertos, festivales, deportes, cultura',
}

export default function EventsPage() {
  return <EventsPageClient />
}
