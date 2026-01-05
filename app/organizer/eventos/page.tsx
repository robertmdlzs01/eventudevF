import type { Metadata } from "next"
import OrganizerEventsPageClient from "./OrganizerEventsPageClient"

export const metadata: Metadata = {
  title: "Mis Eventos | Panel Organizador",
  description: "Gestiona los eventos asignados a tu organización",
}

export default function OrganizerEventsPage() {
  return <OrganizerEventsPageClient />
}
