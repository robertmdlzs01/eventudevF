import type { Metadata } from "next"
import { ArrowRight, Scan, Users, Ticket, BarChart, Map, CreditCard } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Nuestros Servicios | Eventu",
  description: "Descubre todos los servicios que ofrecemos para organizadores de eventos",
}

const services = [
  {
    icon: Scan,
    title: "Control de Acceso",
    description: (
      <ul className="list-disc pl-5 text-left space-y-1 text-gray-700">
        <li>Control online & offline</li>
        <li>Entrada principal y control intra-site</li>
        <li>Acreditaciones</li>
        <li>Escaneo de entradas digitales y físicas</li>
      </ul>
    ),
  },
  {
    icon: Ticket,
    title: "Ticketing & Registro",
    description: (
      <ul className="list-disc pl-5 text-left space-y-1 text-gray-700">
        <li>Fácil configuración y 100% personalizable</li>
        <li>Solución 360°</li>
        <li>Configuración de abonos</li>
      </ul>
    ),
  },
  {
    icon: Users,
    title: "Gestión de Usuarios y Staff",
    description: (
      <ul className="list-disc pl-5 text-left space-y-1 text-gray-700">
        <li>Acreditaciones y Staff</li>
        <li>Configuración de todos los escenarios</li>
        <li>Gestión de voluntarios y acreditados</li>
        <li>Herramientas de supervisión sencillas y completas</li>
      </ul>
    ),
  },
  {
    icon: BarChart,
    title: "Data Marketing & CRM",
    description: (
      <ul className="list-disc pl-5 text-left space-y-1 text-gray-700">
        <li>Segmentación y Bases de Datos</li>
        <li>Campañas de comunicación y gestión</li>
        <li>Análisis y monitoreo</li>
      </ul>
    ),
  },
  {
    icon: Map,
    title: "Seating Chart",
    description: (
      <ul className="list-disc pl-5 text-left space-y-1 text-gray-700">
        <li>Asientos 2D y 3D</li>
        <li>Tecnología propia</li>
        <li>Modelado 2D y 3D</li>
        <li>Simulación 3D con avatares</li>
        <li>Modelaje de venues/proyectos</li>
        <li>Vista panorámica</li>
      </ul>
    ),
  },
  {
    icon: CreditCard,
    title: "Cashless",
    description: "Próximamente",
  },
]

export default function NuestrosServiciosPage() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="relative w-full py-20 md:py-28 lg:py-36 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-6">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Servicios Disponibles</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              Nuestros Servicios
            </h1>
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-10 text-gray-300 leading-relaxed">
              Soluciones integrales para llevar tu evento al siguiente nivel. 
              <span className="text-white font-medium">Desde la planificación hasta la ejecución</span>, 
              estamos contigo en cada paso.
            </p>
            <div className="flex justify-center items-center">
              <Link href="/vende-tu-evento" passHref>
                <Button className="group bg-white text-slate-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-lg px-8 py-4 rounded-xl shadow-2xl hover:shadow-white/20">
                  <span className="font-semibold">Comenzar Ahora</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
        
        {/* Enhanced Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </section>

      {/* Services Grid Section */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {services.map((service, index) => (
              <div
                key={index}
                className="group relative"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <Card className="relative h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 ease-out rounded-2xl overflow-hidden group-hover:-translate-y-2 group-hover:scale-[1.02]">
                  {/* Gradient Border Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl blur-sm group-hover:blur-md transition-all duration-500 opacity-0 group-hover:opacity-100"></div>
                  
                  {/* Card Content */}
                  <div className="relative bg-white rounded-2xl p-8 h-full flex flex-col">
                    <CardHeader className="flex flex-col items-center p-0 mb-6">
                      <div className="relative mb-6">
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                        <div className="relative bg-gradient-to-br from-purple-50 to-pink-50 text-purple-600 p-5 rounded-2xl border border-purple-100 group-hover:shadow-lg transition-all duration-500">
                          <service.icon className="h-8 w-8 group-hover:scale-110 transition-transform duration-300" />
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-700 transition-colors duration-300">
                        {service.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-gray-600 text-sm w-full flex-1 flex flex-col justify-center">
                      {service.description}
                    </CardContent>
                    
                    {/* Subtle Hover Effect */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-20 right-10 w-32 h-32 bg-purple-200/30 rounded-full blur-2xl"></div>
          <div className="absolute bottom-20 left-10 w-40 h-40 bg-pink-200/30 rounded-full blur-2xl"></div>
        </div>
      </section>


      {/* Call to Action Section */}
      <section className="relative py-20 md:py-28 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">¿Listo para comenzar?</span>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
              ¿Listo para Crear un Evento Inolvidable?
            </h2>
            
            <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 text-gray-300 leading-relaxed">
              Contáctanos hoy mismo para discutir tus necesidades y cómo 
              <span className="text-white font-medium"> Eventu puede ser tu aliado estratégico</span>.
            </p>
            
            <div className="flex justify-center items-center">
              <Link href="/vende-tu-evento" passHref>
                <Button className="group bg-white text-slate-900 hover:bg-gray-100 hover:scale-105 transition-all duration-300 text-lg px-10 py-5 rounded-xl shadow-2xl hover:shadow-white/20">
                  <span className="font-semibold">Contáctanos</span>
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
            
          </div>
        </div>
        
        {/* Background Effects */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-10 left-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      </section>
    </main>
  )
}