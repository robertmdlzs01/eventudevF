import type React from "react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AuthGuard } from "@/lib/auth-guard"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="admin" fallbackUrl="/login">
      <div className="flex h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </AuthGuard>
  )
}
