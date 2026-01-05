"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Lock, 
  Eye, 
  EyeOff, 
  Save, 
  ArrowLeft, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  Key
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

export default function CambiarContrasenaAdminClient() {
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const router = useRouter()
  const { toast } = useToast()

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "currentPassword":
        if (!value) return "La contraseña actual es obligatoria."
        return ""
      case "newPassword":
        if (!value) return "La nueva contraseña es obligatoria."
        if (value.length < 8) return "La nueva contraseña debe tener al menos 8 caracteres."
        if (!/(?=.*[a-z])/.test(value)) return "La contraseña debe contener al menos una letra minúscula."
        if (!/(?=.*[A-Z])/.test(value)) return "La contraseña debe contener al menos una letra mayúscula."
        if (!/(?=.*\d)/.test(value)) return "La contraseña debe contener al menos un número."
        if (!/(?=.*[!@#$%^&*])/.test(value)) return "La contraseña debe contener al menos un carácter especial (!@#$%^&*)."
        return ""
      case "confirmPassword":
        if (!value) return "Por favor, confirma tu nueva contraseña."
        if (value !== formData.newPassword) return "Las contraseñas no coinciden."
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

    // Validación cruzada para confirmPassword
    if (name === "newPassword" && touched.confirmPassword) {
      const confirmError = value !== formData.confirmPassword ? "Las contraseñas no coinciden." : ""
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }

    if (name === "confirmPassword" && touched.newPassword) {
      const confirmError = value !== formData.newPassword ? "Las contraseñas no coinciden." : ""
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
    const error = validateField(name, value)
    setErrors((prev) => ({ ...prev, [name]: error }))
  }

  const isFormValid = () => {
    const requiredFields = ['currentPassword', 'newPassword', 'confirmPassword']
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field as keyof typeof formData]
      return value && value.trim().length > 0
    })

    const hasErrors = Object.keys(errors).some(key => errors[key] && errors[key].length > 0)
    const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.newPassword.length > 0

    return allFieldsFilled && !hasErrors && passwordsMatch
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
      currentPassword: true,
      newPassword: true,
      confirmPassword: true,
    })

    if (Object.keys(newErrors).length === 0) {
      try {
        // Aquí iría la llamada al API para cambiar la contraseña
        // const response = await apiClient.changePassword(formData.currentPassword, formData.newPassword)
        
        // Simulación de cambio exitoso
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        toast({
          title: "Contraseña cambiada exitosamente",
          description: "Tu contraseña ha sido actualizada. Por favor, inicia sesión nuevamente.",
          variant: "default",
        })

        // Limpiar formulario
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        })

        // Redirigir al login después de un momento
        setTimeout(() => {
          localStorage.removeItem('auth_token')
          localStorage.removeItem('current_user')
          localStorage.removeItem('eventu_authenticated')
          router.push('/login')
        }, 2000)

      } catch (error) {
        toast({
          title: "Error al cambiar contraseña",
          description: "No se pudo cambiar la contraseña. Verifica tu contraseña actual.",
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

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" }
    
    let strength = 0
    if (password.length >= 8) strength++
    if (/(?=.*[a-z])/.test(password)) strength++
    if (/(?=.*[A-Z])/.test(password)) strength++
    if (/(?=.*\d)/.test(password)) strength++
    if (/(?=.*[!@#$%^&*])/.test(password)) strength++

    switch (strength) {
      case 0:
      case 1:
        return { strength, label: "Muy débil", color: "bg-red-500" }
      case 2:
        return { strength, label: "Débil", color: "bg-orange-500" }
      case 3:
        return { strength, label: "Media", color: "bg-yellow-500" }
      case 4:
        return { strength, label: "Fuerte", color: "bg-blue-500" }
      case 5:
        return { strength, label: "Muy fuerte", color: "bg-green-500" }
      default:
        return { strength, label: "", color: "" }
    }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cambiar Contraseña</h1>
          <p className="text-muted-foreground">
            Actualiza la contraseña de tu cuenta de administrador
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
              <Lock className="h-5 w-5" />
              Cambiar Contraseña
            </CardTitle>
            <CardDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-sm font-medium">
                  Contraseña Actual <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="currentPassword"
                    name="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.currentPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.currentPassword && !errors.currentPassword
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-sm text-red-600">{errors.currentPassword}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  Nueva Contraseña <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    className={`pl-10 pr-10 ${
                      errors.newPassword
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                        : formData.newPassword && !errors.newPassword
                          ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                          : "border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-sm text-red-600">{errors.newPassword}</p>
                )}
                
                {/* Password Strength Indicator */}
                {formData.newPassword && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fortaleza de la contraseña:</span>
                      <span className="font-medium">{passwordStrength.label}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirmar Nueva Contraseña <span className="text-red-500">*</span>
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
                    Cambiando contraseña...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Cambiar Contraseña
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Información de Seguridad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Requisitos de Seguridad
            </CardTitle>
            <CardDescription>
              Tu nueva contraseña debe cumplir con estos requisitos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">La contraseña debe contener:</h4>
                <ul className="space-y-2 text-sm">
                  <li className={`flex items-center gap-2 ${formData.newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Al menos 8 caracteres
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[a-z])/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Al menos una letra minúscula
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[A-Z])/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Al menos una letra mayúscula
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*\d)/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Al menos un número
                  </li>
                  <li className={`flex items-center gap-2 ${/(?=.*[!@#$%^&*])/.test(formData.newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                    <CheckCircle2 className="h-4 w-4" />
                    Al menos un carácter especial (!@#$%^&*)
                  </li>
                </ul>
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Información Importante</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Después del cambio, serás desconectado automáticamente</li>
                  <li>• Deberás iniciar sesión con tu nueva contraseña</li>
                  <li>• La contraseña actual debe ser correcta</li>
                  <li>• Se recomienda usar una contraseña única</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
