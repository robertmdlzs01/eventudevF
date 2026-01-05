import { useState, useEffect } from 'react'
import { cartPersistenceService } from '@/lib/cart-persistence'

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

export function useAuthSimple(): AuthState & AuthActions {
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

      console.log('🔍 [useAuthSimple] Verificando autenticación...')
      
      try {
        const isAuth = localStorage.getItem("eventu_authenticated") === "true"
        const token = localStorage.getItem("auth_token")
        const userStr = localStorage.getItem("current_user")
        
        console.log('🔍 [useAuthSimple] Estado localStorage:', { 
          isAuth, 
          hasToken: !!token, 
          hasUser: !!userStr 
        })

        if (isAuth && token && userStr) {
          const user = JSON.parse(userStr)
          console.log('✅ [useAuthSimple] Usuario autenticado encontrado:', user.email)
          
          setAuthState({
            isAuthenticated: true,
            user,
            token,
            isLoading: false
          })
        } else {
          console.log('❌ [useAuthSimple] No hay sesión activa')
          setAuthState({
            isAuthenticated: false,
            user: null,
            token: null,
            isLoading: false
          })
        }
      } catch (error) {
        console.error('❌ [useAuthSimple] Error verificando autenticación:', error)
        setAuthState({
          isAuthenticated: false,
          user: null,
          token: null,
          isLoading: false
        })
      }
    }

    checkAuth()
  }, [])

  const login = (user: User, token: string) => {
    console.log('🔐 [useAuthSimple] Iniciando sesión:', user.email)
    
    localStorage.setItem("eventu_authenticated", "true")
    localStorage.setItem("auth_token", token)
    localStorage.setItem("current_user", JSON.stringify(user))
    localStorage.setItem("userRole", user.role || "user")
    
    // TODOS los usuarios que hacen login deben pasar por confirmación
    localStorage.setItem("just_logged_in", "true")
    
    // Verificar si hay carrito persistido para recuperar
    const persistedCart = cartPersistenceService.getPersistedCart()
    if (persistedCart) {
      console.log('🛒 [useAuthSimple] Carrito persistido encontrado, marcando para recuperación')
      localStorage.setItem("cart_recovery_needed", "true")
    }
    
    setAuthState({
      isAuthenticated: true,
      user,
      token,
      isLoading: false
    })
  }

  const logout = () => {
    console.log('🚪 [useAuthSimple] Cerrando sesión')
    
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("userRole")
    localStorage.removeItem("last_token_verification")
    
    setAuthState({
      isAuthenticated: false,
      user: null,
      token: null,
      isLoading: false
    })
  }

  const updateToken = (token: string) => {
    console.log('🔄 [useAuthSimple] Actualizando token')
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
