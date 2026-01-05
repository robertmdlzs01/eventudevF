"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: "admin" | "organizer" | "user"
  fallbackUrl?: string
}

export function AuthGuard({ children, requiredRole, fallbackUrl = "/login" }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthorized, setIsAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check if user is authenticated
        const isAuthenticated = localStorage.getItem("eventu_authenticated") === "true"
        const currentUser = localStorage.getItem("current_user")
        const userRole = localStorage.getItem("userRole")

        if (!isAuthenticated || !currentUser) {
          toast.error("Acceso denegado", {
            description: "Debes iniciar sesión para acceder a esta página.",
          })
          router.push(fallbackUrl)
          return
        }

        // If no specific role is required, just check authentication
        if (!requiredRole) {
          setIsAuthorized(true)
          setIsLoading(false)
          return
        }

        // Check role authorization
        if (userRole !== requiredRole) {
          toast.error("Acceso denegado", {
            description: `No tienes permisos para acceder a esta página. Se requiere rol: ${requiredRole}`,
          })
          
          // Redirect based on user's actual role
          const redirectUrl = getRedirectUrlByRole(userRole)
          router.push(redirectUrl)
          return
        }

        setIsAuthorized(true)
        setIsLoading(false)
      } catch (error) {
        console.error("Auth guard error:", error)
        toast.error("Error de autenticación", {
          description: "Hubo un problema al verificar tu sesión.",
        })
        router.push(fallbackUrl)
      }
    }

    checkAuth()
  }, [requiredRole, fallbackUrl, router, toast])

  const getRedirectUrlByRole = (role: string | null): string => {
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}

// Hook para verificar autenticación y rol
export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuthenticated = localStorage.getItem("eventu_authenticated") === "true"
        const currentUser = localStorage.getItem("current_user")
        const userRole = localStorage.getItem("userRole")
        const token = localStorage.getItem("auth_token")

        if (isAuthenticated && currentUser && token) {
          try {
            const userData = JSON.parse(currentUser)
            setUser(userData)
            setRole(userRole)
            
            // Verificar si el token es válido con el backend (en segundo plano)
            try {
              const response = await fetch('http://localhost:3002/api/auth/verify-token', {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(3000) // 3 segundos timeout
              })

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                if (errorData.code === 'SESSION_TIMEOUT') {
                  console.log('Sesión expirada por inactividad, redirigiendo al login')
                  // Solo cerrar sesión si es realmente por timeout
                  localStorage.removeItem("eventu_authenticated")
                  localStorage.removeItem("current_user")
                  localStorage.removeItem("userRole")
                  localStorage.removeItem("auth_token")
                  localStorage.removeItem("eventu_user_id")
                  localStorage.removeItem("redirectUrl")
                  localStorage.removeItem("welcomeMessage")
                  localStorage.removeItem("eventu_cart")
                  localStorage.removeItem("eventu_cart_user_id")
                  setUser(null)
                  setRole(null)
                  window.dispatchEvent(new Event("authStateChanged"))
                  // Usar window.location en lugar de router para evitar problemas de closure
                  window.location.href = "/login"
                  return
                }
                // Para otros errores, mantener la sesión local
                console.warn('Error verificando token, manteniendo sesión local')
              }
            } catch (error) {
              console.warn("Error de conectividad verificando token, manteniendo sesión local:", error)
              // En caso de error de red, mantener la sesión local
            }
          } catch (error) {
            console.error("Error parsing user data:", error)
            setUser(null)
            setRole(null)
          }
        } else {
          setUser(null)
          setRole(null)
        }
      } catch (error) {
        console.error("useAuth error:", error)
        setUser(null)
        setRole(null)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Listen for auth state changes
    const handleAuthChange = () => {
      checkAuth()
    }

    window.addEventListener("authStateChanged", handleAuthChange)
    return () => window.removeEventListener("authStateChanged", handleAuthChange)
  }, [])

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("redirectUrl")
    localStorage.removeItem("welcomeMessage")
    localStorage.removeItem("userRole")
    setUser(null)
    setRole(null)
    window.dispatchEvent(new Event("authStateChanged"))
  }

  return {
    user,
    role,
    isLoading,
    isAuthenticated: !!user,
    logout,
  }
}

// Componente para mostrar contenido basado en rol
interface RoleBasedContentProps {
  children: React.ReactNode
  roles: ("admin" | "organizer" | "user")[]
  fallback?: React.ReactNode
}

export function RoleBasedContent({ children, roles, fallback }: RoleBasedContentProps) {
  const { role } = useAuth()

  if (!role || !roles.includes(role as any)) {
    return fallback || null
  }

  return <>{children}</>
}

// Hook para verificar si el usuario tiene un rol específico
export function useHasRole(requiredRole: "admin" | "organizer" | "user") {
  const { role } = useAuth()
  return role === requiredRole
}

// Hook para verificar si el usuario tiene permisos de administrador
export function useIsAdmin() {
  return useHasRole("admin")
}

// Hook para verificar si el usuario tiene permisos de organizador
export function useIsOrganizer() {
  return useHasRole("organizer")
}

// Hook para verificar si el usuario es un cliente normal
export function useIsUser() {
  return useHasRole("user")
}
