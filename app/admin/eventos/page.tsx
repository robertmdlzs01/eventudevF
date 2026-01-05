import { getAdminEvents, getAdminCategories } from "@/app/admin/actions"
import AdminEventsPageClient from "./AdminEventsPageClient"

export const metadata = {
  title: "Gestión de Eventos | Eventu Admin",
  description: "Administra todos los eventos de la plataforma Eventu.",
}

/**
 * Server Component ─ fetches data and passes plain JSON
 */
export default async function AdminEventsPage() {
  const allEvents = await getAdminEvents()
  const categories = await getAdminCategories()

  /**
   * ⬇️ Everything below this point runs on the client.
   * We only pass serialisable props (arrays / objects).
   */
  return <AdminEventsPageClient events={allEvents} categories={categories} />
}
