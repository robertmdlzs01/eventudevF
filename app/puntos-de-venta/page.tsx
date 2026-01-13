import { Metadata } from 'next'
import SalesPointsPublicPageClient from './SalesPointsPublicPageClient'

export const metadata: Metadata = {
  title: 'Puntos de Venta - Eventu',
  description: 'Encuentra nuestros puntos de venta físicos para comprar boletos de eventos',
}

export default function SalesPointsPage() {
  return <SalesPointsPublicPageClient />
}
