import type React from "react"
import type { Metadata } from "next"
import OrganizerSidebar from "../../components/organizer/organizer-sidebar"
import { AuthGuard } from "../../lib/auth-guard"

export const metadata: Metadata = {
  title: "Panel Organizador | Eventu",
  description: "Panel de control para organizadores de eventos",
}

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard requiredRole="organizer" fallbackUrl="/login">
      <div className="min-h-screen bg-gray-50">
        <div className="flex h-screen">
          <OrganizerSidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
