"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2, Shield, Phone } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { trackSignUp, trackFormSubmission } from "@/lib/analytics"

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
    acceptMarketing: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const { toast } = useToast()
  const router = useRouter()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "El correo electrónico es obligatorio."
    if (!emailRegex.test(email)) return "Por favor, ingresa un formato de correo electrónico válido."
    return ""
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25
    return strength
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength < 25) return { text: "Muy débil", color: "text-red-600" }
    if (strength < 50) return { text: "Débil", color: "text-orange-600" }
    if (strength < 75) return { text: "Buena", color: "text-yellow-600" }
    return { text: "Excelente", color: "text-green-600" }
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
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    setFormData((prev) => ({ ...prev, [name]: newValue }))

    // Validar el campo actual
    if (touched[name]) {
      const error = validateField(name, value)
      setErrors((prev) => ({ ...prev, [name]: error }))
    }

    // Validar confirmación de contraseña cuando cambia la contraseña
    if (name === "password" && touched.confirmPassword) {
      const confirmError = newValue !== formData.confirmPassword ? "Las contraseñas no coinciden." : ""
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }))
    }

    // Validar contraseña cuando cambia la confirmación
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (!["acceptTerms", "acceptMarketing"].includes(key)) {
        const error = validateField(key, formData[key as keyof typeof formData] as string)
        if (error) newErrors[key] = error
      }
    })

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = "Debes aceptar los términos y condiciones para crear una cuenta."
    }

    setErrors(newErrors)
    setTouched({
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      acceptTerms: true,
    })

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            phone: formData.phone,
            password: formData.password,
          })
        })
        const data = await response.json()

        if (data.success && data.user && data.token) {
          // Track successful registration
          trackSignUp('email')
          trackFormSubmission('signup', true)

          localStorage.setItem("eventu_user_id", data.user.id.toString())
          localStorage.setItem("eventu_user_email", data.user.email)
          localStorage.setItem("eventu_authenticated", "true")

          toast({
            title: "¡Registro exitoso!",
            description: `Bienvenido a Eventu, ${data.user.name}. Tu cuenta ha sido creada.`,
            variant: "default",
          })

          router.push("/mi-cuenta")
        } else {
          // Track failed registration
          trackFormSubmission('signup', false)
          
          toast({
            title: "Error de registro",
            description: data.error || "Hubo un problema al crear tu cuenta. Por favor, inténtalo de nuevo.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Registration error:", error)
        toast({
          title: "Error de conexión",
          description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
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

  // Función para verificar si el formulario es válido
  const isFormValid = () => {
    // Verificar que todos los campos requeridos estén llenos
    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'password', 'confirmPassword']
    const allFieldsFilled = requiredFields.every(field => {
      const value = formData[field as keyof typeof formData] as string
      return value && value.trim().length > 0
    })

    // Verificar que no haya errores en los campos
    const hasErrors = Object.keys(errors).some(key => errors[key] && errors[key].length > 0)

    // Verificar que se acepten los términos y condiciones
    const termsAccepted = formData.acceptTerms

    // Verificar que las contraseñas coincidan
    const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0

    return allFieldsFilled && !hasErrors && termsAccepted && passwordsMatch
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const passwordStrengthInfo = getPasswordStrengthText(passwordStrength)

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        {/* Indicador de progreso del formulario */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-slate-600">Progreso del formulario</span>
            <span className="text-sm font-medium text-slate-700">
              {isFormValid() ? 'Completo' : 'Incompleto'}
            </span>
          </div>
          <Progress 
            value={isFormValid() ? 100 : 0} 
            className="h-2"
          />
        </div>
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <img src="/images/eventu-logo.svg" alt="Eventu" className="w-8 h-8" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Únete a Eventu
        </CardTitle>
        <CardDescription className="text-slate-600">Crea tu cuenta y descubre eventos increíbles</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`pl-10 pr-10 transition-all duration-200 ${
                    errors.firstName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : formData.firstName && !errors.firstName
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                        : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                  }`}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getInputIcon(!!errors.firstName, !!formData.firstName)}
                </div>
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
              Apellido <span className="text-red-500">*</span>
            </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  onBlur={handleBlur}
                  className={`pl-10 pr-10 transition-all duration-200 ${
                    errors.lastName
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : formData.lastName && !errors.lastName
                        ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                        : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                  }`}
                  disabled={isLoading}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {getInputIcon(!!errors.lastName, !!formData.lastName)}
                </div>
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.lastName}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
              Teléfono <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="phone"
                name="phone"
                type="tel"
                placeholder="300 123 4567"
                value={formData.phone}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  errors.phone
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.phone && !errors.phone
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getInputIcon(!!errors.phone, !!formData.phone)}
              </div>
            </div>
            {errors.phone && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Correo Electrónico <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  errors.email
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.email && !errors.email
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getInputIcon(!!errors.email, !!formData.email)}
              </div>
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  errors.password
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.password && !errors.password
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Seguridad de la contraseña:</span>
                  <span className={`font-medium ${passwordStrengthInfo.color}`}>{passwordStrengthInfo.text}</span>
                </div>
                <Progress
                  value={passwordStrength}
                  className={`h-2 ${
                    passwordStrength < 25
                      ? "[&>div]:bg-red-500"
                      : passwordStrength < 50
                        ? "[&>div]:bg-orange-500"
                        : passwordStrength < 75
                          ? "[&>div]:bg-yellow-500"
                          : "[&>div]:bg-green-500"
                  }`}
                />
              </div>
            )}
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  errors.confirmPassword
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : formData.confirmPassword && !errors.confirmPassword
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({ ...prev, acceptTerms: checked as boolean }))
                  // Limpiar error cuando se acepta
                  if (checked) {
                    setErrors((prev) => ({ ...prev, acceptTerms: "" }))
                  }
                }}
                disabled={isLoading}
                className={`mt-0.5 ${errors.acceptTerms ? 'border-red-500' : ''}`}
              />
              <Label htmlFor="acceptTerms" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                Acepto los{" "}
                <Link href="/terminos-condiciones" className="text-pink-600 hover:text-pink-700 font-medium">
                  términos y condiciones
                </Link>{" "}
                y la{" "}
                <Link href="/politica-privacidad" className="text-pink-600 hover:text-pink-700 font-medium">
                  política de privacidad
                </Link>
                <span className="text-red-500">*</span>
              </Label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.acceptTerms}
              </p>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="acceptMarketing"
                name="acceptMarketing"
                checked={formData.acceptMarketing}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, acceptMarketing: checked as boolean }))}
                disabled={isLoading}
                className="mt-0.5"
              />
              <Label htmlFor="acceptMarketing" className="text-sm text-slate-600 cursor-pointer leading-relaxed">
                Quiero recibir noticias y ofertas especiales por email (opcional)
              </Label>
            </div>
          </div>

          <Button
            type="submit"
            className={`w-full font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${
              isFormValid() 
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            disabled={isLoading || !isFormValid()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              "Crear Cuenta"
            )}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-slate-600">
            ¿Ya tienes una cuenta?{" "}
            <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium transition-colors">
              Inicia sesión aquí
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
