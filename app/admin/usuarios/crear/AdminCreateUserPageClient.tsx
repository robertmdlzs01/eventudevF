"use client"
import { useRouter } from "next/navigation"
import { createAdminUser } from "@/app/admin/actions"
import { UserForm } from "@/components/admin/user-form"
import { useToast } from "@/hooks/use-toast"
import { useState } from "react"
import type { AdminUser } from "@/lib/types"

export default function AdminCreateUserPageClient() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (userData: any) => {
    setIsLoading(true)
    try {
      // Los datos ya vienen en el formato correcto del formulario
      const apiUserData = {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        phone: userData.phone || ''
      }
      
      const newUser = await createAdminUser(apiUserData)
      toast({
        title: "Usuario Creado",
        description: `El usuario "${newUser.first_name} ${newUser.last_name}" ha sido creado exitosamente.`,
      })
      router.push("/admin/usuarios")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Hubo un problema al crear el usuario.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    router.push("/admin/usuarios")
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent mb-6">
        Gestión de Usuarios POS
      </h1>
      <div className="max-w-2xl mx-auto">
        <UserForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  )
}
