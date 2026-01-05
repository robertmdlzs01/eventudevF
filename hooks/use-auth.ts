import { useState, useEffect } from 'react'

interface User {
  id: number
  name: string
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  role: string
  is_verified: boolean
  created_at: string
}

interface AuthState {
  isAuthenticated: boolean
  user: User | null
  token: string | null
  isLoading: boolean
}

interface AuthActions {
  login: (user: User, token: string) => void
  logout: () => void
  updateToken: (token: string) => void
}

export function useAuth(): AuthState & AuthActions {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
    isLoading: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setAuthState(prev => ({ ...prev, isLoading: false }))
        return
      }

      console.log('🔍 [useAuth] Verificando autenticación...')
      const isAuth = localStorage.getItem("eventu_authenticated") === "true"
      let token = localStorage.getItem("auth_token")
      const userStr = localStorage.getItem("current_user")
      
      console.log('🔍 [useAuth] Estado localStorage:', { isAuth, hasToken: !!token, hasUser: !!userStr })

      if (isAuth && token && userStr) {
        try {
          const user = JSON.parse(userStr)
          
          // Verificar si el token es válido con el backend (con manejo de errores robusto)
          try {
            // Verificar si ya verificamos el token recientemente (evitar spam)
            const lastVerification = localStorage.getItem('last_token_verification')
            const now = Date.now()
            if (lastVerification && (now - parseInt(lastVerification)) < 30000) { // 30 segundos
              console.log('⏭️ [useAuth] Verificación reciente, usando sesión local')
              setAuthState({
                isAuthenticated: true,
                user,
                token,
                isLoading: false
              })
              return
            }
            
            console.log('📡 [useAuth] Verificando token con backend...')
            const response = await fetch('http://localhost:3002/api/auth/verify-token', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              // Agregar timeout para evitar que se cuelgue
              signal: AbortSignal.timeout(5000) // 5 segundos timeout
            })
            
            console.log('📊 [useAuth] Respuesta del servidor:', response.status, response.statusText)

            if (response.ok) {
              // Marcar que verificamos el token
              localStorage.setItem('last_token_verification', now.toString())
              
              // Token válido, mantener la sesión
              const newToken = response.headers.get('X-New-Token')
              if (newToken) {
                localStorage.setItem("auth_token", newToken)
                token = newToken
                console.log('🔄 [useAuth] Token actualizado')
              }
              
              // Verificar advertencia de sesión
              const sessionWarning = response.headers.get('X-Session-Warning')
              const sessionRemaining = response.headers.get('X-Session-Remaining')
              
              if (sessionWarning && sessionRemaining) {
                console.log('⚠️ [useAuth] Advertencia de sesión:', sessionWarning)
                // Disparar evento personalizado para mostrar advertencia
                window.dispatchEvent(new CustomEvent('sessionWarning', {
                  detail: {
                    message: sessionWarning,
                    remainingMinutes: parseInt(sessionRemaining)
                  }
                }))
              }
              
              console.log('✅ [useAuth] Sesión válida, manteniendo autenticación')
              setAuthState({
                isAuthenticated: true,
                user,
                token,
                isLoading: false
              })
            } else {
              // Token inválido, verificar si es por timeout de sesión
              const errorData = await response.json().catch(() => ({}))
              if (errorData.code === 'SESSION_TIMEOUT') {
                console.log('⏰ [useAuth] Sesión expirada por inactividad')
                // Limpiar localStorage y cerrar sesión
                localStorage.removeItem("eventu_authenticated")
                localStorage.removeItem("auth_token")
                localStorage.removeItem("current_user")
                localStorage.removeItem("userRole")
                localStorage.removeItem("eventu_user_id")
                localStorage.removeItem("redirectUrl")
                localStorage.removeItem("welcomeMessage")
                localStorage.removeItem("eventu_cart")
                localStorage.removeItem("eventu_cart_user_id")
                localStorage.removeItem('last_token_verification')
                
                setAuthState({
                  isAuthenticated: false,
                  user: null,
                  token: null,
                  isLoading: false
                })
              } else {
                // Otro error, mantener la sesión local por seguridad
                console.warn('⚠️ [useAuth] Error verificando token, manteniendo sesión local:', errorData.message)
                setAuthState({
                  isAuthenticated: true,
                  user,
                  token,
                  isLoading: false
                })
              }
            }
          } catch (error) {
            console.warn('Error de conectividad verificando token, manteniendo sesión local:', error)
            // En caso de error de red, mantener la sesión local
            setAuthState({
              isAuthenticated: true,
              user,
              token,
              isLoading: false
            })
          }
        } catch (error) {
          console.error('Error parsing user data:', error)
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false
          })
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false
        })
      }
    }

    checkAuth()

    // Listen for auth changes
    const handleAuthChange = () => checkAuth()
    const handleSessionExpired = () => {
      console.log('🔄 [useAuth] Sesión expirada, verificando estado')
      checkAuth()
    }
    
    window.addEventListener("authStateChanged", handleAuthChange)
    window.addEventListener("storage", handleAuthChange)
    window.addEventListener("sessionExpired", handleSessionExpired)

    return () => {
      window.removeEventListener("authStateChanged", handleAuthChange)
      window.removeEventListener("storage", handleAuthChange)
      window.removeEventListener("sessionExpired", handleSessionExpired)
    }
  }, [])

  const login = (user: User, token: string) => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem("eventu_authenticated", "true")
    localStorage.setItem("auth_token", token)
    localStorage.setItem("current_user", JSON.stringify(user))
    
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      isLoading: false
    })
    
    window.dispatchEvent(new Event("authStateChanged"))
  }

  const logout = () => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("eventu_user_id")
    localStorage.removeItem("userRole")
    localStorage.removeItem("redirectUrl")
    localStorage.removeItem("welcomeMessage")
    localStorage.removeItem('last_token_verification')
    // Limpiar carrito al hacer logout
    localStorage.removeItem("eventu_cart")
    localStorage.removeItem("eventu_cart_user_id")
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false
    })
    
    window.dispatchEvent(new Event("authStateChanged"))
  }

  const updateToken = (token: string) => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem("auth_token", token)
    
    setAuthState(prev => ({
      ...prev,
      token
    }))
  }

  return {
    ...authState,
    login,
    logout,
    updateToken
  }
}
