"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"

export default function RecuperarPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      // Validar email
      if (!email || !email.includes("@")) {
        setError("Por favor ingresa un email válido")
        return
      }

      // Llamar al backend para enviar email de recuperación
      const response = await apiClient.forgotPassword(email)
      
      if (response.success) {
        setIsSubmitted(true)
        toast({
          title: "Email enviado",
          description: response.message || "Hemos enviado las instrucciones de recuperación a tu email.",
          variant: "default",
        })
      } else {
        setError(response.error || "Error al enviar el email. Inténtalo de nuevo.")
        toast({
          title: "Error",
          description: response.error || "No se pudo enviar el email de recuperación.",
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("Error al enviar el email. Inténtalo de nuevo.")
      toast({
        title: "Error",
        description: "No se pudo enviar el email de recuperación.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Email Enviado!
            </CardTitle>
            <CardDescription>
              Hemos enviado las instrucciones de recuperación a tu email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Revisa tu bandeja de entrada</p>
                  <p>Si no encuentras el email, revisa tu carpeta de spam.</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <Link href="/login">
                <Button className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Login
                </Button>
              </Link>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
              >
                Enviar otro email
              </Button>
            </div>
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
            Recuperar Contraseña
          </CardTitle>
          <CardDescription>
            Ingresa tu email y te enviaremos las instrucciones para restablecer tu contraseña
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Instrucciones"
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
                <p className="font-medium mb-1">¿No recibiste el email?</p>
                <p>Verifica que el email esté correcto y revisa tu carpeta de spam.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
