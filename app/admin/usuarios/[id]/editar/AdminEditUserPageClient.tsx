"use client"

import { useRouter } from "next/navigation"
import { getAdminUsers, updateAdminUser } from "@/app/admin/actions"
import { UserForm } from "@/components/admin/user-form"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import type { AdminUser } from "@/app/admin/actions"

interface AdminEditUserPageProps {
  params: {
    id: string
  }
}

export default function AdminEditUserPageClient({ params }: AdminEditUserPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const fetchedUsersData = await getAdminUsers() // Fetch all users
        const foundUser = fetchedUsersData.users.find((u) => u.id === params.id)
        if (foundUser) {
          setUser(foundUser)
        } else {
          throw new Error("Usuario no encontrado")
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo cargar el usuario.",
          variant: "destructive",
        })
        router.push("/admin/usuarios") // Redirect if user not found
      } finally {
        setIsLoading(false)
      }
    }
    fetchUser()
  }, [params.id, router, toast])

  const handleSubmit = async (userData: any) => {
    try {
      // Preparar datos para la API
      const apiUserData: any = {}
      
      if (userData.firstName) apiUserData.firstName = userData.firstName
      if (userData.lastName) apiUserData.lastName = userData.lastName
      if (userData.email) apiUserData.email = userData.email
      if (userData.password) apiUserData.password = userData.password
      if (userData.role) apiUserData.role = userData.role
      if (userData.phone !== undefined) apiUserData.phone = userData.phone
      if (userData.status) apiUserData.status = userData.status

      await updateAdminUser(params.id, apiUserData)
      toast({
        title: "Usuario Actualizado",
        description: `El usuario "${user?.first_name} ${user?.last_name}" ha sido actualizado exitosamente.`,
      })
      router.push("/admin/usuarios")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al actualizar el usuario.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    router.push("/admin/usuarios")
  }

  if (isLoading) {
    return <div className="text-center py-8">Cargando usuario...</div>
  }

  if (!user) {
    return <div className="text-center py-8 text-red-500">Usuario no encontrado.</div>
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-6">
        Editar Usuario
      </h1>
      <div className="max-w-2xl mx-auto">
        <UserForm initialData={user} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
