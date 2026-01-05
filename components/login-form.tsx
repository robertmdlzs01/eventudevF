"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, Lock, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { TwoFactorAuthForm } from "./two-factor-auth-form"
import { useRouter, useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { trackLogin, trackFormSubmission } from "@/lib/analytics"

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [authStep, setAuthStep] = useState<"login" | "2fa_verify">("login")
  const [userIdFor2FA, setUserIdFor2FA] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email) return "El correo electrónico es obligatorio."
    if (!emailRegex.test(email)) return "Por favor, ingresa un formato de correo electrónico válido."
    return ""
  }

  const validateField = (name: string, value: string) => {
    switch (name) {
      case "email":
        return validateEmail(value)
      case "password":
        if (!value) return "La contraseña es obligatoria."
        if (value.length < 6) return "La contraseña debe tener al menos 6 caracteres."
        return ""
      default:
        return ""
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    const newValue = type === "checkbox" ? checked : value

    setFormData((prev) => ({ ...prev, [name]: newValue }))

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const newErrors: Record<string, string> = {}
    Object.keys(formData).forEach((key) => {
      if (key !== "rememberMe") {
        const error = validateField(key, formData[key as keyof typeof formData] as string)
        if (error) newErrors[key] = error
      }
    })

    setErrors(newErrors)
    setTouched({ email: true, password: true })

    if (Object.keys(newErrors).length === 0) {
      try {
        const response = await apiClient.login(formData.email, formData.password)

        if (response.success && response.user && response.token) {
          // Track successful login
          trackLogin('email')
          trackFormSubmission('login', true)

          // Store user session
          localStorage.setItem("eventu_user_id", response.user.id.toString())
          localStorage.setItem("eventu_user_email", response.user.email)
          localStorage.setItem("eventu_authenticated", "true")
          localStorage.setItem("auth_token", response.token)
          localStorage.setItem("current_user", JSON.stringify(response.user))
          localStorage.setItem("userRole", response.user.role || "user")

          // Get redirect URL based on user role
          const redirectUrl = localStorage.getItem("redirectUrl") || "/mi-cuenta"
          const welcomeMessage = localStorage.getItem("welcomeMessage") || `Bienvenido de nuevo, ${response.user.name}.`
          const userRole = response.user.role || "user"

          toast.success("Inicio de sesión exitoso", {
            description: welcomeMessage,
          })

          // Redirect based on role or use search params
          const redirectTo = searchParams?.get("redirect") || getRedirectUrlByRole(userRole)
          router.push(redirectTo)
        } else {
          // Track failed login
          trackFormSubmission('login', false)
          
          toast.error("Error de inicio de sesión", {
            description: response.error || "Credenciales inválidas. Por favor, verifica tu correo y contraseña.",
          })
        }
      } catch (error) {
        console.error("Login error:", error)
        toast.error("Error de conexión", {
          description: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
        })
      }
    } else {
      toast.error("Error de validación", {
        description: "Por favor, corrige los errores en el formulario.",
      })
    }

    setIsLoading(false)
  }

  const handle2FAVerificationSuccess = () => {
    // Complete the authentication process
    toast.success("Autenticación completada", {
      description: "Bienvenido de nuevo a Eventu.",
    })

    // Get redirect URL from search params or default to /mi-cuenta
    const redirectTo = searchParams?.get("redirect") || "/mi-cuenta"
    router.push(redirectTo)
  }

  const handleBackToLogin = () => {
    setAuthStep("login")
    setUserIdFor2FA(null)
    setFormData({ email: "", password: "", rememberMe: false })
  }

  const getInputIcon = (hasError: boolean, hasValue: boolean) => {
    if (hasError) return <AlertCircle className="h-4 w-4 text-red-500" />
    if (hasValue && !hasError) return <CheckCircle2 className="h-4 w-4 text-green-500" />
    return null
  }

  const getRedirectUrlByRole = (role: string): string => {
    switch (role) {
      case "admin":
        return "/admin"
      case "organizer":
        return "/organizer"
      case "user":
      default:
        return "/mi-cuenta"
    }
  }

  if (authStep === "2fa_verify" && userIdFor2FA) {
    return (
      <TwoFactorAuthForm
        mode="verify"
        userId={userIdFor2FA}
        onVerificationSuccess={handle2FAVerificationSuccess}
        onBackToLogin={handleBackToLogin}
      />
    )
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <img src="/images/eventu-logo.svg" alt="Eventu" className="w-10 h-10" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          Bienvenido de vuelta
        </CardTitle>
        <CardDescription className="text-slate-600">Ingresa a tu cuenta para continuar</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Correo Electrónico
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

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Contraseña
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
            {errors.password && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.password}
              </p>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                name="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, rememberMe: checked as boolean }))}
                disabled={isLoading}
              />
              <Label htmlFor="rememberMe" className="text-sm text-slate-600 cursor-pointer">
                Recordarme
              </Label>
            </div>
            <Link
              href="/recuperar-password"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            ¿No tienes una cuenta?{" "}
            <Link href="/registro" className="text-pink-600 hover:text-pink-700 font-medium transition-colors">
              Regístrate aquí
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
