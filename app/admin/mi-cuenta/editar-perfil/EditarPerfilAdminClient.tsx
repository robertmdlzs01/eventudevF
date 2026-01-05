"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  User, 
  Mail, 
  Phone, 
  Save, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

interface AdminUser {
  id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  role: string
  status: string
}

export default function EditarPerfilAdminClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Cargar datos del usuario desde localStorage
    const loadUserData = () => {
      try {
        const currentUser = localStorage.getItem('current_user')
        if (currentUser) {
          const userData = JSON.parse(currentUser)
          setUser(userData)
          setFormData({
            firstName: userData.first_name || "",
            lastName: userData.last_name || "",
            email: userData.email || "",
            phone: userData.phone || ""
          })
        } else {
          router.push('/login')
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        router.push('/login')
      }
    }

    loadUserData()
  }, [router])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "El correo electrónico es obligatorio."
    if (!emailRegex.test(email)) return "Por favor, ingresa un formato de correo electrónico válido."
    return ""
  }

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "firstName":
        if (!value) return "El nombre es obligatorio."
        if (value.length < 2) return "El nombre debe tener al menos 2 caracteres."
        return ""
      case "lastName":
        if (!value) return "El apellido es obligatorio."
        if (value.length < 2) return "El apellido debe tener al menos 2 caracteres."
        return ""
      case "email":
        return validateEmail(value)
      case "phone":
        if (!value) return "El teléfono es obligatorio."
        if (!/^[0-9+\-\s()]+$/.test(value)) return "Por favor, ingresa un formato de teléfono válido."
        if (value.replace(/[^0-9]/g, '').length < 7) return "El teléfono debe tener al menos 7 dígitos."
        return ""
      default:
        return ""
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    if (touched[name]) {
      const error = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone']
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field as keyof typeof formData]
      return value && value.trim().length > 0
    })

    const hasErrors = Object.keys(errors).some(key => errors[key] && errors[key].length > 0)

    return allFieldsFilled && !hasErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData])
      if (error) newErrors[key] = error
    })

    setErrors(newErrors)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    })

    if (Object.keys(newErrors).length === 0) {
      try {
        // Aquí iría la llamada al API para actualizar el perfil
        // const response = await apiClient.updateAdminProfile(formData)
        
        // Simulación de actualización exitosa
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        // Actualizar localStorage con los nuevos datos
        if (user) {
          const updatedUser = {
            ...user,
            first_name: formData.firstName,
            last_name: formData.lastName,
            email: formData.email,
            phone: formData.phone
          }
          localStorage.setItem('current_user', JSON.stringify(updatedUser))
        }
        
        toast({
          title: "Perfil actualizado exitosamente",
          description: "Tu información ha sido guardada correctamente.",
          variant: "default",
        })

        router.push("/admin/mi-cuenta")
      } catch (error) {
        toast({
          title: "Error al actualizar perfil",
          description: "No se pudo actualizar tu información. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Error de validación",
        description: "Por favor, corrige los errores en el formulario.",
        variant: "destructive",
      })
    }

    setIsLoading(false)
  }

  const getInputIcon = (hasError: boolean, hasValue: boolean) => {
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (hasValue && !hasError) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return null
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Perfil</h1>
          <p className="text-muted-foreground">
            Actualiza tu información personal de administrador
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/mi-cuenta">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mi Cuenta
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Actualiza tus datos personales y de contacto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="firstName"
                      name="firstName"
                      placeholder="Juan"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`pl-10 pr-10 ${
                        errors.firstName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : formData.firstName && !errors.firstName
                            ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getInputIcon(!!errors.firstName, !!formData.firstName)}
                    </div>
                  </div>
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    Apellido <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="lastName"
                      name="lastName"
                      placeholder="Pérez"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={`pl-10 pr-10 ${
                        errors.lastName
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : formData.lastName && !errors.lastName
                            ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                            : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                      }`}
                      disabled={isLoading}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {getInputIcon(!!errors.lastName, !!formData.lastName)}
                    </div>
                  </div>
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Correo Electrónico <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@eventu.co"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.email
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.email && !errors.email
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getInputIcon(!!errors.email, !!formData.email)}
                  </div>
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium">
                  Teléfono <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    placeholder="+57 300 123 4567"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.phone
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.phone && !errors.phone
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {getInputIcon(!!errors.phone, !!formData.phone)}
                  </div>
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              <Button
                type="submit"
                className={`w-full ${
                  isFormValid() 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={isLoading || !isFormValid()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando cambios...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Guardar Cambios
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información Adicional */}
        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
            <CardDescription>
              Datos de tu cuenta de administrador
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-muted-foreground">ID de Usuario</Label>
              <p className="text-lg font-semibold">{user.id}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Rol</Label>
              <p className="text-lg font-semibold capitalize">{user.role}</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
              <p className="text-lg font-semibold capitalize">{user.status}</p>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Los cambios se aplicarán inmediatamente</li>
                <li>• Tu email se usará para notificaciones importantes</li>
                <li>• El teléfono es para contacto de emergencia</li>
                <li>• Los datos son visibles solo para administradores</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
