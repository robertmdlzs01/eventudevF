import AdminEditUserPageClient from "./AdminEditUserPageClient"

export const metadata = {
  title: "Editar Usuario | Eventu Admin",
  description: "Edita los detalles de un usuario existente en la plataforma Eventu.",
}

interface AdminEditUserPageProps {
  params: {
    id: string
  }
}

export default function AdminEditUserPage({ params }: AdminEditUserPageProps) {
  return <AdminEditUserPageClient params={params} />
}
