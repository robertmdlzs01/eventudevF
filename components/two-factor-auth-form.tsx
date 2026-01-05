"use client"

import type React from "react"
import { useState, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, ShieldCheck, AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { simulate2FACodeVerification, toggle2FAStatus } from "@/app/admin/actions" // Importar Server Actions

interface TwoFactorAuthFormProps {
  mode: "setup" | "verify" // 'setup' for initial setup, 'verify' for login verification
  userId: string
  current2FAStatus?: boolean
  twoFactorSecret?: string // Only for setup mode, to display
  onVerificationSuccess?: () => void
  onSetupSuccess?: (newStatus: boolean) => void
  onBackToLogin?: () => void // Only for verify mode, if user wants to go back
}

export function TwoFactorAuthForm({
  mode,
  userId,
  current2FAStatus,
  twoFactorSecret,
  onVerificationSuccess,
  onSetupSuccess,
  onBackToLogin,
}: TwoFactorAuthFormProps) {
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const validateCode = (value: string) => {
    if (!value) return "El código es obligatorio."
    if (!/^\d{6}$/.test(value)) return "El código debe ser de 6 dígitos."
    return null
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(e.target.value)
    if (error) setError(null) // Clear error when typing
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validationError = validateCode(code)
    if (validationError) {
      setError(validationError)
      toast({
        title: "Error de validación",
        description: validationError,
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      const result = await simulate2FACodeVerification(code)

      if (result) {
        toast({
          title: "Verificación 2FA exitosa",
          description: "Has iniciado sesión de forma segura.",
          variant: "default",
        })
        if (onVerificationSuccess) onVerificationSuccess()
        if (mode === "setup" && onSetupSuccess) {
          // If in setup mode and verification is successful, enable 2FA officially
          const updatedUser = await toggle2FAStatus(userId, true)
          if (updatedUser) {
            toast({
              title: "2FA Habilitado",
              description: "La autenticación de dos factores ha sido configurada exitosamente.",
              variant: "default",
            })
            onSetupSuccess(true)
          } else {
            toast({
              title: "Error al habilitar 2FA",
              description: "No se pudo actualizar el estado 2FA del usuario.",
              variant: "destructive",
            })
          }
        }
      } else {
        setError("Código 2FA incorrecto. Inténtalo de nuevo.")
        toast({
          title: "Error 2FA",
          description: "Código de autenticación incorrecto.",
          variant: "destructive",
        })
      }
    })
  }

  const handleToggle2FA = async (enable: boolean) => {
    startTransition(async () => {
      const updatedUser = await toggle2FAStatus(userId, enable)
      if (updatedUser) {
        toast({
          title: enable ? "2FA Habilitado" : "2FA Deshabilitado",
          description: enable
            ? "La autenticación de dos factores ha sido configurada."
            : "La autenticación de dos factores ha sido deshabilitada.",
          variant: "default",
        })
        if (onSetupSuccess) onSetupSuccess(enable)
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar el estado 2FA.",
          variant: "destructive",
        })
      }
    })
  }

  if (mode === "setup") {
    if (current2FAStatus) {
      return (
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center pb-8">
            <ShieldCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
              2FA Habilitado
            </CardTitle>
            <CardDescription className="text-slate-600">
              La autenticación de dos factores está activa para tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-medium py-2.5 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleToggle2FA(false)}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deshabilitando...
                </>
              ) : (
                "Deshabilitar 2FA"
              )}
            </Button>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-8">
          <QrCode className="mx-auto h-16 w-16 text-primary-600 mb-4" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Configurar Autenticación de Dos Factores
          </CardTitle>
          <CardDescription className="text-slate-600">
            Escanea el código QR con tu aplicación de autenticación (ej. Google Authenticator) y luego ingresa el
            código.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            {/* Simulated QR Code - In a real app, this would be a generated QR code from a library like 'qrcode' */}
            <img
              src="/placeholder.svg"
              alt="Código QR simulado para 2FA"
              className="border p-2 rounded-lg"
            />
            <p className="text-sm text-slate-600 font-medium">
              Tu código secreto (simulado):{" "}
              <code className="font-bold text-lg text-primary-600">{twoFactorSecret || "N/A"}</code>
            </p>
            <p className="text-sm text-slate-500 text-center">
              *Para propósitos de demostración, usa el código: `123456`
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="2fa-code" className="text-sm font-medium text-slate-700">
                Código de 6 dígitos
              </Label>
              <div className="relative">
                <Input
                  id="2fa-code"
                  name="2fa-code"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="------"
                  value={code}
                  onChange={handleCodeChange}
                  className={`pl-4 pr-10 transition-all duration-200 ${
                    error
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                  }`}
                  disabled={isPending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {error && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {code.length === 6 && !error && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
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
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar y Habilitar 2FA"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  } else {
    // Mode: 'verify' (used during login)
    return (
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-8">
          <ShieldCheck className="mx-auto h-16 w-16 text-primary-600 mb-4" />
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
            Verificación de Dos Factores
          </CardTitle>
          <CardDescription className="text-slate-600">
            Ingresa el código de 6 dígitos de tu aplicación de autenticación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="2fa-code-verify" className="text-sm font-medium text-slate-700">
                Código de 6 dígitos
              </Label>
              <div className="relative">
                <Input
                  id="2fa-code-verify"
                  name="2fa-code-verify"
                  type="text"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d{6}"
                  placeholder="------"
                  value={code}
                  onChange={handleCodeChange}
                  className={`pl-4 pr-10 transition-all duration-200 ${
                    error
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                      : "border-slate-200 focus:border-pink-500 focus:ring-pink-500/20"
                  }`}
                  disabled={isPending}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {error && <AlertCircle className="h-4 w-4 text-red-500" />}
                  {code.length === 6 && !error && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                </div>
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
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>
            {onBackToLogin && (
              <Button
                variant="ghost"
                className="w-full text-slate-600 hover:text-pink-600"
                onClick={onBackToLogin}
                disabled={isPending}
              >
                Volver al inicio de sesión
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    )
  }
}
