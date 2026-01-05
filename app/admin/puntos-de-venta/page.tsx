import { Metadata } from 'next'
import SalesPointsPageClient from './SalesPointsPageClient'

export const metadata: Metadata = {
  title: 'Puntos de Venta - Panel de Administración',
  description: 'Gestión de puntos de venta y ventas directas',
}

export default function SalesPointsPage() {
  return <SalesPointsPageClient />
}

