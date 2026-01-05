'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { User, LogIn, LogOut, Shield, CheckCircle, XCircle } from 'lucide-react'
import { useAuthSimple } from '@/hooks/use-auth-simple'

export function AuthDebug() {
  const { isAuthenticated, user, token, isLoading, login, logout } = useAuthSimple()
  const [localStorageData, setLocalStorageData] = useState<any>({})
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  useEffect(() => {
    checkLocalStorage()
  }, [])

  const checkLocalStorage = () => {
    const data = {
      authenticated: localStorage.getItem("eventu_authenticated"),
      token: localStorage.getItem("auth_token"),
      user: localStorage.getItem("current_user"),
      userRole: localStorage.getItem("userRole"),
      lastVerification: localStorage.getItem("last_token_verification")
    }
    setLocalStorageData(data)
    addLog('LocalStorage verificado')
  }

  const handleLogin = () => {
    const testUser = {
      id: 1,
      name: "Usuario de Prueba",
      email: "test@example.com",
      first_name: "Usuario",
      last_name: "Prueba",
      phone: "1234567890",
      role: "user",
      is_verified: true,
      created_at: new Date().toISOString()
    }
    
    const testToken = "test-token-" + Date.now()
    
    login(testUser, testToken)
    addLog('Sesión iniciada con usuario de prueba')
    checkLocalStorage()
  }

  const handleLogout = () => {
    logout()
    addLog('Sesión cerrada')
    checkLocalStorage()
  }

  const clearAllData = () => {
    localStorage.removeItem("eventu_authenticated")
    localStorage.removeItem("auth_token")
    localStorage.removeItem("current_user")
    localStorage.removeItem("userRole")
    localStorage.removeItem("last_token_verification")
    addLog('Todos los datos de localStorage limpiados')
    checkLocalStorage()
  }

  const simulateAuth = () => {
    localStorage.setItem("eventu_authenticated", "true")
    localStorage.setItem("auth_token", "simulated-token")
    localStorage.setItem("current_user", JSON.stringify({
      id: 2,
      name: "Usuario Simulado",
      email: "simulated@example.com",
      role: "user"
    }))
    localStorage.setItem("userRole", "user")
    addLog('Datos de autenticación simulados en localStorage')
    checkLocalStorage()
    
    // Forzar re-render del hook
    window.location.reload()
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Debug de Autenticación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Estado actual */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <strong>Estado:</strong>
              {isLoading ? (
                <Badge variant="secondary">Cargando...</Badge>
              ) : isAuthenticated ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Autenticado
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="w-3 h-3 mr-1" />
                  No Autenticado
                </Badge>
              )}
            </div>
            <div>
              <strong>Usuario:</strong> {user ? user.name : 'N/A'}
            </div>
            <div>
              <strong>Email:</strong> {user ? user.email : 'N/A'}
            </div>
            <div>
              <strong>Rol:</strong> {user ? user.role : 'N/A'}
            </div>
            <div>
              <strong>Token:</strong> {token ? 'Presente' : 'Ausente'}
            </div>
            <div>
              <strong>ID:</strong> {user ? user.id : 'N/A'}
            </div>
          </div>

          {/* Botones de prueba */}
          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleLogin} size="sm" disabled={isAuthenticated}>
              <LogIn className="w-4 h-4 mr-1" />
              Simular Login
            </Button>
            <Button onClick={handleLogout} size="sm" variant="outline" disabled={!isAuthenticated}>
              <LogOut className="w-4 h-4 mr-1" />
              Cerrar Sesión
            </Button>
            <Button onClick={simulateAuth} size="sm" variant="secondary">
              <User className="w-4 h-4 mr-1" />
              Simular Auth
            </Button>
            <Button onClick={clearAllData} size="sm" variant="destructive">
              Limpiar Todo
            </Button>
            <Button onClick={checkLocalStorage} size="sm" variant="outline">
              Verificar
            </Button>
          </div>

          {/* Información del usuario */}
          {user && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="font-semibold text-blue-900 mb-2">Usuario Actual:</h4>
              <div className="text-sm text-blue-700 space-y-1">
                <div><strong>ID:</strong> {user.id}</div>
                <div><strong>Nombre:</strong> {user.name}</div>
                <div><strong>Email:</strong> {user.email}</div>
                <div><strong>Rol:</strong> {user.role}</div>
                <div><strong>Verificado:</strong> {user.is_verified ? 'Sí' : 'No'}</div>
                <div><strong>Teléfono:</strong> {user.phone || 'N/A'}</div>
              </div>
            </div>
          )}

          {/* Datos de localStorage */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded">
            <h4 className="font-semibold text-gray-900 mb-2">LocalStorage:</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>Authenticated:</strong> {localStorageData.authenticated || 'null'}</div>
              <div><strong>Token:</strong> {localStorageData.token ? 'Presente' : 'Ausente'}</div>
              <div><strong>User:</strong> {localStorageData.user ? 'Presente' : 'Ausente'}</div>
              <div><strong>UserRole:</strong> {localStorageData.userRole || 'null'}</div>
              <div><strong>Last Verification:</strong> {localStorageData.lastVerification || 'null'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Log de Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono text-gray-600">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
