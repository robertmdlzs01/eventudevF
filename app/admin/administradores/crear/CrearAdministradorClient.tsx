"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  UserPlus, 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Shield,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  CheckCircle2
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

export default function CrearAdministradorClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "admin",
    status: "active",
    permissions: {
      manageUsers: true,
      manageEvents: true,
      manageAdmins: true,
      viewReports: true,
      manageSystem: true
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const router = useRouter()
  const { toast } = useToast()

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
      case "password":
        if (!value) return "La contraseña es obligatoria."
        if (value.length < 8) return "La contraseña debe tener al menos 8 caracteres."
        return ""
      case "confirmPassword":
        if (!value) return "Por favor, confirma tu contraseña."
        if (value !== formData.password) return "Las contraseñas no coinciden."
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

    if (name === "password" && touched.confirmPassword) {
      const confirmError = value !== formData.confirmPassword ? "Las contraseñas no coinciden." : ""
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }

    if (name === "confirmPassword" && touched.password) {
      const confirmError = value !== formData.password ? "Las contraseñas no coinciden." : ""
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const handlePermissionChange = (permission: string, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: checked
      }
    }))
  }

  const isFormValid = () => {
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword']
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field as keyof typeof formData] as string
      return value && value.trim().length > 0
    })

    const hasErrors = Object.keys(errors).some(key => errors[key] && errors[key].length > 0)
    const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

    return allFieldsFilled && !hasErrors && passwordsMatch
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (!["permissions", "role", "status"].includes(key)) {
        const error = validateField(key, formData[key as keyof typeof formData] as string)
        if (error) newErrors[key] = error
      }
    })

    setErrors(newErrors)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
    })

    if (Object.keys(newErrors).length === 0) {
      try {
        // Aquí iría la llamada al API para crear el administrador
        // const response = await apiClient.createAdmin(formData)
        
        // Simulación de creación exitosa
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast({
          title: "Administrador creado exitosamente",
          description: `${formData.firstName} ${formData.lastName} ha sido agregado como administrador.`,
          variant: "default",
        })

        router.push("/admin/administradores")
      } catch (error) {
        toast({
          title: "Error al crear administrador",
          description: "No se pudo crear la cuenta de administrador. Inténtalo de nuevo.",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Crear Administrador</h1>
          <p className="text-muted-foreground">
            Agregar una nueva cuenta de administrador al sistema
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/admin/administradores">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Administradores
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Formulario Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Información Personal
            </CardTitle>
            <CardDescription>
              Datos básicos del nuevo administrador
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

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.password
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.password && !errors.password
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.confirmPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.confirmPassword && !errors.confirmPassword
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-sm font-medium">
                    Rol
                  </Label>
                  <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="super_admin">Super Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Estado
                  </Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="inactive">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                    Creando administrador...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Administrador
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Permisos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Permisos del Administrador
            </CardTitle>
            <CardDescription>
              Configura los permisos específicos para este administrador
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manageUsers"
                  checked={formData.permissions.manageUsers}
                  onCheckedChange={(checked) => handlePermissionChange('manageUsers', checked as boolean)}
                />
                <Label htmlFor="manageUsers" className="text-sm font-medium cursor-pointer">
                  Gestionar Usuarios
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Crear, editar y eliminar usuarios del sistema
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manageEvents"
                  checked={formData.permissions.manageEvents}
                  onCheckedChange={(checked) => handlePermissionChange('manageEvents', checked as boolean)}
                />
                <Label htmlFor="manageEvents" className="text-sm font-medium cursor-pointer">
                  Gestionar Eventos
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Aprobar, editar y gestionar eventos del sistema
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manageAdmins"
                  checked={formData.permissions.manageAdmins}
                  onCheckedChange={(checked) => handlePermissionChange('manageAdmins', checked as boolean)}
                />
                <Label htmlFor="manageAdmins" className="text-sm font-medium cursor-pointer">
                  Gestionar Administradores
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Crear y gestionar otras cuentas de administrador
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="viewReports"
                  checked={formData.permissions.viewReports}
                  onCheckedChange={(checked) => handlePermissionChange('viewReports', checked as boolean)}
                />
                <Label htmlFor="viewReports" className="text-sm font-medium cursor-pointer">
                  Ver Reportes
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Acceder a reportes y estadísticas del sistema
              </p>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="manageSystem"
                  checked={formData.permissions.manageSystem}
                  onCheckedChange={(checked) => handlePermissionChange('manageSystem', checked as boolean)}
                />
                <Label htmlFor="manageSystem" className="text-sm font-medium cursor-pointer">
                  Gestionar Sistema
                </Label>
              </div>
              <p className="text-xs text-muted-foreground ml-6">
                Configuraciones avanzadas del sistema
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• El administrador recibirá un email de bienvenida</li>
                <li>• Se recomienda cambiar la contraseña en el primer acceso</li>
                <li>• Los permisos pueden ser modificados posteriormente</li>
                <li>• Se registrará la actividad del administrador</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
