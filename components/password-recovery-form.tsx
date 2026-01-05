"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast" // Importar useToast

export function PasswordRecoveryForm() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [touched, setTouched] = useState(false)
  const { toast } = useToast() // Usar el hook useToast

  const validateEmail = (inputEmail: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!inputEmail) return "El correo electrónico es obligatorio."
    if (!emailRegex.test(inputEmail)) return "Por favor, ingresa un formato de correo electrónico válido."
    return ""
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (touched) {
      setError(validateEmail(e.target.value))
    }
    // No es necesario limpiar el mensaje general aquí, el toast se gestiona solo
  }

  const handleBlur = () => {
    setTouched(true)
    setError(validateEmail(email))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    const validationError = validateEmail(email)
    setError(validationError)

    if (validationError) {
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Simulate API call for password reset
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Simulate success or failure
    const simulatedSuccess = true // Change to false to simulate an error

    if (simulatedSuccess) {
      toast({
        title: "Solicitud enviada",
        description:
          "Si tu correo está registrado, recibirás un enlace para restablecer tu contraseña. Por favor, revisa tu bandeja de entrada.",
        variant: "default",
      })
      setEmail("") // Clear email field on success
      setTouched(false) // Reset touched state
    } else {
      toast({
        title: "Error al enviar solicitud",
        description: "Ocurrió un error al procesar tu solicitud. Por favor, inténtalo de nuevo más tarde.",
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
    <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center pb-8">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
          <img src="/images/eventu-logo.svg" alt="Eventu" className="w-10 h-10" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
          ¿Olvidaste tu contraseña?
        </CardTitle>
        <CardDescription className="text-slate-600">
          Ingresa tu correo electrónico y te enviaremos un enlace para restablecerla.
        </CardDescription>
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
                value={email}
                onChange={handleInputChange}
                onBlur={handleBlur}
                className={`pl-10 pr-10 transition-all duration-200 ${
                  error
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                    : email && !error
                      ? "border-green-300 focus:border-green-500 focus:ring-green-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                }`}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">{getInputIcon(!!error, !!email)}</div>
            </div>
            {error && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {error}
              </p>
            )}
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
                Enviando...
              </>
            ) : (
              "Enviar enlace de recuperación"
            )}
          </Button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center">
          <p className="text-sm text-slate-600">
            ¿Recordaste tu contraseña?{" "}
            <Link href="/login" className="text-pink-600 hover:text-pink-700 font-medium transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
