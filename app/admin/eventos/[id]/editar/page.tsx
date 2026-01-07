import AdminEditEventPageClient from "./AdminEditEventPageClient"

export const metadata = {
  title: "Editar Evento | Eventu Admin",
  description: "Edita los detalles de un evento existente en la plataforma Eventu.",
}

interface AdminEditEventPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEditEventPage({ params }: AdminEditEventPageProps) {
  const { id } = await params
  return <AdminEditEventPageClient params={{ id }} />
}
