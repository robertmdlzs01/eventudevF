import Link from "next/link"
import { Facebook, Instagram, Youtube } from "lucide-react"

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800 text-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700/10 via-slate-800/20 to-slate-700/10"></div>
      
      {/* Main Content */}
      <div className="relative z-10 py-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Columna Izquierda - Enlaces de Servicios */}
            <div className="space-y-3">
              <Link href="/nuestros-servicios" className="block text-gray-300 text-sm hover:text-white transition-colors">
                Nuestros Servicios
              </Link>
              <Link href="/vende-tu-evento" className="block text-gray-300 text-sm hover:text-white transition-colors">
                Vende tu Evento
              </Link>
              <Link href="/eventos" className="block text-gray-300 text-sm hover:text-white transition-colors">
                Eventos
              </Link>
              <Link href="/puntos-de-venta" className="block text-gray-300 text-sm hover:text-white transition-colors">
                Puntos de Venta
              </Link>
            </div>

            {/* Columna Central - Logo y Redes Sociales */}
            <div className="text-center space-y-6">
              {/* Logo */}
              <div>
                <Link href="/" className="inline-block group">
                  <img
                    src="/images/eventu-logo.svg"
                    alt="Eventu"
                    className="h-16 w-auto mx-auto group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
              </div>

              {/* Redes Sociales */}
              <div className="flex justify-center space-x-4">
                <a 
                  href="https://www.facebook.com/p/Eventuco-100083277610290/" 
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Facebook"
                >
                  <Facebook className="h-5 w-5 text-gray-700" />
                </a>
                <a 
                  href="https://www.instagram.com/eventu_co/" 
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="h-5 w-5 text-gray-700" />
                </a>
                <a 
                  href="https://www.youtube.com/@EventuCo" 
                  className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="h-5 w-5 text-gray-700" />
                </a>
              </div>
            </div>

            {/* Columna Derecha - Información de Contacto */}
            <div className="space-y-4 text-right">  
              {/* Información de Contacto */}
              <div className="space-y-2">
                <h4 className="text-white font-semibold text-sm">Contacto</h4>
                <p className="text-gray-300 text-sm">info@eventu.co</p>
                <p className="text-gray-300 text-sm">+57 300 285-0000</p>
                <p className="text-gray-300 text-sm">Barranquilla, Colombia</p>
              </div>
              
              {/* Horarios */}
              <div className="space-y-2">
                <h4 className="text-white font-semibold text-sm">Horarios</h4>
                <p className="text-gray-300 text-sm">Lun - Vie: 8:00 AM - 6:00 PM</p>
                <p className="text-gray-300 text-sm">Sáb: 9:00 AM - 2:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Franja Inferior - Copyright */}
      <div className="relative z-10 border-t border-white/10 py-6">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center">
            <p className="text-gray-300 text-sm">
              © 2025 Eventu. Todos los derechos reservados. | Plataforma de gestión de eventos
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}