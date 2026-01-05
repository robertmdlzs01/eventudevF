import AdminEditEventPageClient from "./AdminEditEventPageClient"

export const metadata = {
  title: "Editar Evento | Eventu Admin",
  description: "Edita los detalles de un evento existente en la plataforma Eventu.",
}

interface AdminEditEventPageProps {
  params: {
    id: string
  }
}

export default function AdminEditEventPage({ params }: AdminEditEventPageProps) {
  return <AdminEditEventPageClient params={params} />
}
