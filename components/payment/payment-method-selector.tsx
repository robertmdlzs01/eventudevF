"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Building2, 
  Smartphone,
  CheckCircle,
  Clock,
  Shield
} from "lucide-react"

interface PaymentMethod {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  type: 'pse' | 'credit' | 'debit' | 'digital' | 'special'
  processingTime: string
  fees: string
  recommended?: boolean
  popular?: boolean
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'pse',
    name: 'PSE - Pagos Seguros en Línea',
    description: 'Transferencia bancaria directa desde tu cuenta',
    icon: <Building2 className="h-5 w-5" />,
    type: 'pse',
    processingTime: 'Inmediato',
    fees: 'Sin comisión',
    recommended: true
  },
  {
    id: 'credit_card',
    name: 'Tarjeta de Crédito',
    description: 'Visa, Mastercard, Diners Club',
    icon: <CreditCard className="h-5 w-5" />,
    type: 'credit',
    processingTime: 'Inmediato',
    fees: 'Sin comisión',
    popular: true
  },
  {
    id: 'debit_card',
    name: 'Tarjeta de Débito',
    description: 'Visa, Mastercard, Diners Club',
    icon: <CreditCard className="h-5 w-5" />,
    type: 'debit',
    processingTime: 'Inmediato',
    fees: 'Sin comisión'
  },
  {
    id: 'daviplata',
    name: 'Daviplata',
    description: 'Billetera digital de Davivienda',
    icon: <Smartphone className="h-5 w-5" />,
    type: 'digital',
    processingTime: 'Inmediato',
    fees: 'Sin comisión'
  },
  {
    id: 'tc_serfinanza',
    name: 'TC Serfinanza',
    description: 'Tarjeta de crédito Serfinanza',
    icon: <CreditCard className="h-5 w-5" />,
    type: 'special',
    processingTime: 'Inmediato',
    fees: 'Sin comisión'
  }
]

interface PaymentMethodSelectorProps {
  selectedMethod: string
  onMethodChange: (methodId: string) => void
  className?: string
}

export function PaymentMethodSelector({ 
  selectedMethod, 
  onMethodChange, 
  className = "" 
}: PaymentMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null)

  const getMethodStyles = (method: PaymentMethod, isSelected: boolean, isHovered: boolean) => {
    const baseStyles = "relative p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer"
    
    if (isSelected) {
      switch (method.type) {
        case 'pse':
          return `${baseStyles} bg-blue-50 border-blue-500 shadow-md`
        case 'credit':
          return `${baseStyles} bg-green-50 border-green-500 shadow-md`
        case 'debit':
          return `${baseStyles} bg-orange-50 border-orange-500 shadow-md`
        case 'digital':
          return `${baseStyles} bg-purple-50 border-purple-500 shadow-md`
        case 'special':
          return `${baseStyles} bg-red-50 border-red-500 shadow-md`
        default:
          return `${baseStyles} bg-gray-50 border-gray-500 shadow-md`
      }
    }
    
    if (isHovered) {
      switch (method.type) {
        case 'pse':
          return `${baseStyles} bg-blue-25 border-blue-300 shadow-sm`
        case 'credit':
          return `${baseStyles} bg-green-25 border-green-300 shadow-sm`
        case 'debit':
          return `${baseStyles} bg-orange-25 border-orange-300 shadow-sm`
        case 'digital':
          return `${baseStyles} bg-purple-25 border-purple-300 shadow-sm`
        case 'special':
          return `${baseStyles} bg-red-25 border-red-300 shadow-sm`
        default:
          return `${baseStyles} bg-gray-25 border-gray-300 shadow-sm`
      }
    }
    
    return `${baseStyles} bg-white border-gray-200 hover:border-gray-300`
  }

  const getIconColor = (method: PaymentMethod, isSelected: boolean) => {
    if (isSelected) {
      switch (method.type) {
        case 'pse': return 'text-blue-600'
        case 'credit': return 'text-green-600'
        case 'debit': return 'text-orange-600'
        case 'digital': return 'text-purple-600'
        case 'special': return 'text-red-600'
        default: return 'text-gray-600'
      }
    }
    return 'text-gray-500'
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Selecciona tu método de pago
          </h3>
          <p className="text-sm text-gray-600">
            Elige la forma más conveniente para realizar tu pago
          </p>
        </div>

        <RadioGroup 
          value={selectedMethod} 
          onValueChange={onMethodChange}
          className="space-y-3"
        >
          {paymentMethods.map((method) => {
            const isSelected = selectedMethod === method.id
            const isHovered = hoveredMethod === method.id
            
            return (
              <div key={method.id} className="relative">
                <Label
                  htmlFor={method.id}
                  className={getMethodStyles(method, isSelected, isHovered)}
                  onMouseEnter={() => setHoveredMethod(method.id)}
                  onMouseLeave={() => setHoveredMethod(null)}
                >
                  <div className="flex items-center space-x-4">
                    <RadioGroupItem 
                      value={method.id} 
                      id={method.id}
                      className="sr-only"
                    />
                    
                    {/* Icono del método */}
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      isSelected 
                        ? method.type === 'pse' ? 'bg-blue-100' :
                          method.type === 'credit' ? 'bg-green-100' :
                          method.type === 'debit' ? 'bg-orange-100' :
                          method.type === 'digital' ? 'bg-purple-100' :
                          method.type === 'special' ? 'bg-red-100' : 'bg-gray-100'
                        : 'bg-gray-100'
                    }`}>
                      <div className={getIconColor(method, isSelected)}>
                        {method.icon}
                      </div>
                    </div>

                    {/* Información del método */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-800">
                          {method.name}
                        </h4>
                        {method.recommended && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                            Recomendado
                          </Badge>
                        )}
                        {method.popular && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Popular
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {method.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{method.processingTime}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>{method.fees}</span>
                        </div>
                      </div>
                    </div>

                    {/* Indicador de selección */}
                    {isSelected && (
                      <div className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>

        {/* Información de seguridad */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <Shield className="h-4 w-4 text-green-500" />
            <span>Pagos 100% seguros con encriptación SSL</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

