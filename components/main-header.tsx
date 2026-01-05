"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Phone, Mail, ShoppingCart, Menu, LogIn, UserPlus, User as UserIcon, LogOut, Calendar, Users, BarChart3, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { apiClient } from "@/lib/api-client"
import { SmartNavigation } from "./smart-navigation"
import { useCart } from "@/hooks/use-cart"

export default function MainHeader() {
  const router = useRouter()
  const { itemCount } = useCart()
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [displayName, setDisplayName] = useState<string>("")
  const [cartItemCount, setCartItemCount] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const syncAuthState = () => {
      const isAuth = typeof window !== "undefined" ? localStorage.getItem("eventu_authenticated") === "true" : false
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null
      const userStr = typeof window !== "undefined" ? localStorage.getItem("current_user") : null
      
      setIsAuthenticated(isAuth && !!token)
      
      if (userStr) {
        try {
          const user = JSON.parse(userStr)
          const name = user?.first_name || user?.name || user?.email || "Mi Cuenta"
          setDisplayName(name)
        } catch {
          setDisplayName("Mi Cuenta")
        }
      } else {
        setDisplayName("")
      }
    }

    const updateCartCount = () => {
      setCartItemCount(itemCount)
    }

    syncAuthState()
    updateCartCount()
    
    // Listen for storage changes (when user logs in/out from other tabs)
    window.addEventListener("storage", syncAuthState)
    
    // Listen for custom auth events (when user logs in/out from same tab)
    const handleAuthChange = () => syncAuthState()
    window.addEventListener("authStateChanged", handleAuthChange)
    
    // Listen for session expired events
    const handleSessionExpired = () => {
      console.log('🔄 [MainHeader] Sesión expirada, actualizando estado')
      syncAuthState()
    }
    window.addEventListener("sessionExpired", handleSessionExpired)
    
    // Listen for cart changes
    const handleCartChange = () => updateCartCount()
    window.addEventListener("cartUpdated", handleCartChange)
    
    return () => {
      window.removeEventListener("storage", syncAuthState)
      window.removeEventListener("authStateChanged", handleAuthChange)
      window.removeEventListener("sessionExpired", handleSessionExpired)
      window.removeEventListener("cartUpdated", handleCartChange)
    }
  }, [itemCount])

  const handleLogout = () => {
    // Limpiar localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("current_user")
      localStorage.removeItem("eventu_authenticated")
    }
    // Limpiar token del apiClient
    apiClient.logout()
    // Actualizar estado local
    setIsAuthenticated(false)
    setDisplayName("")
    // Disparar evento para notificar otros componentes
    window.dispatchEvent(new Event("authStateChanged"))
    // Redirigir a la página principal
    router.push("/")
  }

  return (
    <>
      {/* Enhanced Top Bar */}
      <div className="bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white py-3 px-4 border-b border-neutral-700">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center text-sm hover:text-primary-300 transition-colors cursor-pointer">
              <Phone className="h-4 w-4 mr-2 text-primary-400" />
              <span className="font-medium">(300) 285-0000</span>
            </div>
            <div className="flex items-center text-sm hover:text-primary-300 transition-colors cursor-pointer">
              <Mail className="h-4 w-4 mr-2 text-primary-400" />
              <span className="font-medium">info@eventu.co</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/carrito" className="flex items-center text-sm hover:text-primary-300 transition-colors group">
              <div className="relative">
                <ShoppingCart className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {isClient ? cartItemCount : 0}
                </span>
              </div>
              <span className="font-medium">Carrito</span>
            </Link>
            <div className="h-4 w-px bg-neutral-600"></div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4 text-sm">
                <span className="text-white">Hola, {displayName}</span>
                <span className="px-2 py-1 bg-primary-500 text-white rounded-full text-xs font-medium">
                  {localStorage.getItem("userRole") === "admin" && "Administrador"}
                  {localStorage.getItem("userRole") === "organizer" && "Organizador"}
                  {localStorage.getItem("userRole") === "user" && "Usuario"}
                </span>
              </div>
            ) : (
              <>
                <Link href="/login" className="flex items-center text-sm hover:text-primary-300 transition-colors">
                  <LogIn className="h-4 w-4 mr-2" />
                  <span className="font-medium">Iniciar Sesión</span>
                </Link>
                <div className="h-4 w-px bg-neutral-600"></div>
                <Link href="/registro" className="flex items-center text-sm hover:text-primary-300 transition-colors">
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="font-medium">Registrarse</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Main Navigation */}
      <header className="bg-white shadow-lg sticky top-0 z-50 border-b border-neutral-200">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center group">
              <img
                src="/images/eventu-logo.svg"
                alt="Eventu"
                className="h-8 md:h-10 w-auto group-hover:scale-105 transition-transform"
              />
            </Link>

            <nav className="hidden lg:flex items-center space-x-8">
              <Link
                href="/"
                className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
              >
                Inicio
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/eventos"
                className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
              >
                Eventos
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              {isAuthenticated && (
                <>
                  {localStorage.getItem("userRole") === "admin" && (
                    <Link
                      href="/admin"
                      className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
                    >
                      Panel Admin
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  )}
                  {localStorage.getItem("userRole") === "organizer" && (
                    <Link
                      href="/organizer"
                      className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
                    >
                      Panel Organizador
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                    </Link>
                  )}
                  <Link
                    href="/mi-cuenta"
                    className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
                  >
                    Mi Cuenta
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
                  </Link>
                </>
              )}
              <Link
                href="/vende-tu-evento"
                className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
              >
                Vende tu Evento
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/nuestros-servicios"
                className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
              >
                Nuestros servicios
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link
                href="/puntos-de-venta"
                className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors duration-200 relative group"
              >
                Puntos de venta
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-600 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/carrito" className="hidden md:flex">
                <Button
                  variant="outline"
                  className="rounded-xl border-2 hover:border-primary-500 transition-colors bg-transparent"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Carrito
                </Button>
              </Link>

              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/mi-cuenta">
                    <Button
                      variant="outline"
                      className="rounded-xl border-2 border-primary-500 text-primary-600 hover:bg-primary-50 transition-colors bg-transparent"
                    >
                      <UserIcon className="h-4 w-4 mr-2" />
                      {displayName || "Mi Cuenta"}
                    </Button>
                  </Link>
                  <div className="relative group">
                    <Button
                      variant="outline"
                      className="rounded-xl border-2 border-neutral-300 text-neutral-600 hover:bg-neutral-50 transition-colors bg-transparent"
                    >
                      Más opciones
                    </Button>
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                      <div className="p-2">
                        {localStorage.getItem("userRole") === "admin" && (
                          <>
                            <Link href="/admin/eventos">
                              <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                                <Calendar className="h-4 w-4 text-neutral-500" />
                                <div>
                                  <div className="font-medium text-sm">Gestionar Eventos</div>
                                  <div className="text-xs text-neutral-500">Administrar eventos</div>
                                </div>
                              </div>
                            </Link>
                            <Link href="/admin/usuarios">
                              <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                                <Users className="h-4 w-4 text-neutral-500" />
                                <div>
                                  <div className="font-medium text-sm">Gestionar Usuarios</div>
                                  <div className="text-xs text-neutral-500">Administrar usuarios</div>
                                </div>
                              </div>
                            </Link>
                            <Link href="/admin/reportes">
                              <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                                <BarChart3 className="h-4 w-4 text-neutral-500" />
                                <div>
                                  <div className="font-medium text-sm">Reportes</div>
                                  <div className="text-xs text-neutral-500">Ver reportes</div>
                                </div>
                              </div>
                            </Link>
                          </>
                        )}
                        {localStorage.getItem("userRole") === "organizer" && (
                          <>
                            <Link href="/organizer/eventos">
                              <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                                <Calendar className="h-4 w-4 text-neutral-500" />
                                <div>
                                  <div className="font-medium text-sm">Mis Eventos</div>
                                  <div className="text-xs text-neutral-500">Gestionar mis eventos</div>
                                </div>
                              </div>
                            </Link>
                            <Link href="/organizer/ventas">
                              <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                                <BarChart3 className="h-4 w-4 text-neutral-500" />
                                <div>
                                  <div className="font-medium text-sm">Ventas</div>
                                  <div className="text-xs text-neutral-500">Ver ventas</div>
                                </div>
                              </div>
                            </Link>
                          </>
                        )}
                        <Link href="/mi-cuenta/boletos">
                          <div className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors">
                            <FileText className="h-4 w-4 text-neutral-500" />
                            <div>
                              <div className="font-medium text-sm">Mis Boletos</div>
                              <div className="text-xs text-neutral-500">Ver mis boletos</div>
                            </div>
                          </div>
                        </Link>
                        <div className="border-t border-neutral-200 mt-2 pt-2">
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-3 p-2 hover:bg-neutral-50 rounded-md transition-colors w-full text-left"
                          >
                            <LogOut className="h-4 w-4 text-red-500" />
                            <div>
                              <div className="font-medium text-sm text-red-600">Cerrar Sesión</div>
                              <div className="text-xs text-neutral-500">Salir de la cuenta</div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="hidden md:flex">
                    <Button
                      variant="outline"
                      className="rounded-xl border-2 border-primary-500 text-primary-600 hover:bg-primary-50 transition-colors bg-transparent"
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Iniciar Sesión
                    </Button>
                  </Link>

                  <Link href="/registro" className="hidden md:flex">
                    <Button className="bg-gradient-to-r from-primary-600 to-secondary-600 hover:from-primary-700 hover:to-secondary-700 text-white rounded-xl px-6">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Registrarse
                    </Button>
                  </Link>
                </>
              )}

              <div className="lg:hidden">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-neutral-700 hover:text-primary-600">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[300px] sm:w-[400px] bg-white p-6">
                    <nav className="flex flex-col gap-4 pt-8">
                      <Link
                        href="/"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Inicio
                      </Link>
                      <Link
                        href="/eventos"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Eventos
                      </Link>
                      <Link
                        href="/vende-tu-evento"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Vende tu Evento
                      </Link>
                      <Link
                        href="/nuestros-servicios"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Nuestros servicios
                      </Link>
                      <Link
                        href="/puntos-de-venta"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Puntos de venta
                      </Link>
                      <Link
                        href="/carrito"
                        className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors"
                        onClick={() => setIsSheetOpen(false)}
                      >
                        Carrito
                      </Link>
                      <div className="border-t border-neutral-200 pt-4 mt-4">
                        {isAuthenticated ? (
                          <>
                            <Link
                              href="/mi-cuenta"
                              className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors flex items-center"
                              onClick={() => setIsSheetOpen(false)}
                            >
                              <UserIcon className="h-4 w-4 mr-2" />
                              {displayName || "Mi Cuenta"}
                            </Link>
                            <Button
                              variant="ghost"
                              className="text-red-500 hover:text-red-600 font-semibold transition-colors flex items-center w-full justify-start p-0 h-auto"
                              onClick={() => {
                                handleLogout()
                                setIsSheetOpen(false)
                              }}
                            >
                              <LogOut className="h-4 w-4 mr-2" />
                              Cerrar Sesión
                            </Button>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/login"
                              className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors flex items-center"
                              onClick={() => setIsSheetOpen(false)}
                            >
                              <LogIn className="h-4 w-4 mr-2" />
                              Iniciar Sesión
                            </Link>
                            <Link
                              href="/registro"
                              className="text-neutral-700 hover:text-primary-600 font-semibold transition-colors flex items-center mt-4"
                              onClick={() => setIsSheetOpen(false)}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Registrarse
                            </Link>
                          </>
                        )}
                      </div>
                    </nav>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}
