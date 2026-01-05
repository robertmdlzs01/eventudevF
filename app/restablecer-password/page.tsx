"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, CheckCircle, Lock, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

export default function RestablecerPasswordPage() {
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")
  const email = searchParams?.get("email")
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    if (!token || !email) {
      setError("Enlace inválido. Solicita un nuevo enlace de recuperación.")
    } else {
      // Verificar token al cargar la página
      verifyToken()
    }
  }, [token, email])

  const verifyToken = async () => {
    if (!token) return
    
    try {
      const response = await apiClient.verifyResetToken(token)
      if (!response.success) {
        setError(response.error || "Token inválido o expirado")
      }
    } catch (error) {
      setError("Error al verificar el token")
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    setError("") // Limpiar error cuando el usuario empiece a escribir
  }

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validaciones
    const passwordError = validatePassword(formData.password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      // Llamar al backend para restablecer contraseña
      const response = await apiClient.resetPassword(token!, formData.password)
      
      if (response.success) {
        setIsSuccess(true)
        toast({
          title: "Contraseña actualizada",
          description: response.message || "Tu contraseña ha sido actualizada exitosamente.",
          variant: "default",
        })
      } else {
        setError(response.error || "Error al actualizar la contraseña. Inténtalo de nuevo.")
        toast({
          title: "Error",
          description: response.error || "No se pudo actualizar la contraseña.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error al actualizar la contraseña. Inténtalo de nuevo.")
      toast({
        title: "Error",
        description: "No se pudo actualizar la contraseña.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Contraseña Actualizada!
            </CardTitle>
            <CardDescription>
              Tu contraseña ha sido actualizada exitosamente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="text-sm text-green-800">
                  <p className="font-medium mb-1">Inicia sesión con tu nueva contraseña</p>
                  <p>Ya puedes usar tu nueva contraseña para acceder a tu cuenta.</p>
                </div>
              </div>
            </div>
            
            <Link href="/login">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Enlace Inválido
            </CardTitle>
            <CardDescription>
              El enlace de recuperación no es válido o ha expirado
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  <p className="font-medium mb-1">Solicita un nuevo enlace</p>
                  <p>Los enlaces de recuperación expiran por seguridad.</p>
                </div>
              </div>
            </div>
            
            <Link href="/recuperar-password">
              <Button className="w-full">
                Solicitar Nuevo Enlace
              </Button>
            </Link>
            
            <Link href="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
            <img src="/images/eventu-logo.svg" alt="Eventu" className="w-10 h-10" />
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Restablecer Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu nueva contraseña para tu cuenta
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="pl-10 pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link 
              href="/login" 
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Login
            </Link>
          </div>

          <div className="mt-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Recomendaciones de seguridad:</p>
                <p>• Usa al menos 6 caracteres</p>
                <p>• Combina letras, números y símbolos</p>
                <p>• No uses información personal</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
