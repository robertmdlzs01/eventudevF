import AdminUsersPageClient from "./AdminUsersPageClient"

export const metadata = {
  title: "Gestión de Usuarios | Eventu Admin",
  description: "Administra todos los usuarios del sistema Eventu.",
}

/**
 * Server Component ─ passes empty data, client will fetch
 */
export default function AdminUsersPage() {
  return <AdminUsersPageClient usersData={{ users: [], pagination: null }} />
}
