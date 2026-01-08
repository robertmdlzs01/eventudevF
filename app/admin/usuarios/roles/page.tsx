import { Suspense } from "react"
import RolesPageClient from "./RolesPageClient"

export const metadata = {
  title: "Gestión de Roles | Eventu Admin",
  description: "Administrar roles y permisos del sistema",
}

export default function RolesPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <RolesPageClient />
    </Suspense>
  )
}
