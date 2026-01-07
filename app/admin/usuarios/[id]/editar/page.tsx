import AdminEditUserPageClient from "./AdminEditUserPageClient"

export const metadata = {
  title: "Editar Usuario | Eventu Admin",
  description: "Edita los detalles de un usuario existente en la plataforma Eventu.",
}

interface AdminEditUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminEditUserPage({ params }: AdminEditUserPageProps) {
  const { id } = await params
  return <AdminEditUserPageClient params={{ id }} />
}
