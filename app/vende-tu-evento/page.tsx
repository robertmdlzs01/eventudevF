import { Metadata } from 'next'
import VendeTuEventoClient from './VendeTuEventoClient'

export const metadata: Metadata = {
  title: 'Vende tu Evento - Eventu',
  description: 'Crea y vende tu evento en Eventu. Herramientas profesionales para organizadores de eventos.',
  keywords: 'vender evento, crear evento, organizador, tickets, boletos, gestión eventos',
}

export default function VendeTuEventoPage() {
  return <VendeTuEventoClient />
}