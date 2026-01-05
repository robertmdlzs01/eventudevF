import { getAdminUsers } from "@/app/admin/actions"
import AdminAdministradoresPageClient from "./AdminAdministradoresPageClient"

export const metadata = {
  title: "Gestión de Administradores | Eventu Admin",
  description: "Administra las cuentas de administradores del sistema Eventu.",
}

export default async function AdminAdministradoresPage() {
  const adminsData = await getAdminUsers({ role: 'admin' })

  return <AdminAdministradoresPageClient adminsData={adminsData} />
}
