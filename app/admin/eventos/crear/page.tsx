import { getCategories } from "@/app/admin/actions"
import AdminCreateEventPageClient from "./AdminCreateEventPageClient"

export const metadata = {
  title: "Crear Evento | Eventu Admin",
  description: "Crea un nuevo evento en la plataforma Eventu.",
}

export default async function AdminCreateEventPage() {
  const categories = await getCategories()

  return <AdminCreateEventPageClient categories={categories} />
}
