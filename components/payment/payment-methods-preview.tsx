"use client"

import { Card, CardContent } from "@/components/ui/card"
import { 
  CreditCard, 
  Building2, 
  Smartphone,
  Shield,
  Clock
} from "lucide-react"

export function PaymentMethodsPreview({ className = "" }: { className?: string }) {
  const methods = [
    {
      name: "PSE",
      description: "Pagos Seguros",
      icon: <Building2 className="h-4 w-4" />,
      color: "bg-blue-600"
    },
    {
      name: "Visa",
      description: "Crédito/Débito",
      icon: <CreditCard className="h-4 w-4" />,
      color: "bg-blue-700"
    },
    {
      name: "MC",
      description: "Mastercard",
      icon: <CreditCard className="h-4 w-4" />,
      color: "bg-red-500"
    },
    {
      name: "DC",
      description: "Diners Club",
      icon: <CreditCard className="h-4 w-4" />,
      color: "bg-green-600"
    },
    {
      name: "DV",
      description: "Daviplata",
      icon: <Smartphone className="h-4 w-4" />,
      color: "bg-purple-600"
    },
    {
      name: "TC",
      description: "Serfinanza",
      icon: <CreditCard className="h-4 w-4" />,
      color: "bg-red-600"
    }
  ]

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="text-center mb-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Métodos de Pago Aceptados
          </h4>
        </div>
        
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {methods.map((method, index) => (
            <div 
              key={index}
              className="flex flex-col items-center p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className={`w-10 h-7 ${method.color} rounded flex items-center justify-center mb-1`}>
                <div className="text-white">
                  {method.icon}
                </div>
              </div>
              <span className="text-xs text-gray-600 text-center font-medium">
                {method.name}
              </span>
              <span className="text-xs text-gray-500 text-center">
                {method.description}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-gray-500">
          <Shield className="h-3 w-3 text-green-500" />
          <span>Pagos seguros</span>
          <Clock className="h-3 w-3 text-blue-500" />
          <span>Procesamiento inmediato</span>
        </div>
      </CardContent>
    </Card>
  )
}

