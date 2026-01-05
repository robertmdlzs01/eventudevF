"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CreditCard, Smartphone, Building2 } from "lucide-react"

interface PaymentLogosProps {
  className?: string
}

export function PaymentLogos({ className = "" }: PaymentLogosProps) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Métodos de Pago Disponibles</h4>
          <p className="text-sm text-gray-600">Selecciona tu método de pago preferido</p>
        </div>
        
        {/* Métodos de Pago Principales */}
        <div className="space-y-4">
          
          {/* PSE - Pagos Seguros en Línea */}
          <div className="flex items-center p-4 bg-blue-50 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <div className="w-16 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-800">PSE - Pagos Seguros en Línea</h5>
              <p className="text-sm text-gray-600">Transferencia bancaria directa desde tu cuenta</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Recomendado</span>
            </div>
          </div>

          {/* Tarjetas de Crédito */}
          <div className="flex items-center p-4 bg-green-50 rounded-xl border-2 border-green-200 hover:border-green-300 transition-colors">
            <div className="w-16 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-800">Tarjetas de Crédito</h5>
              <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
            </div>
            <div className="flex space-x-1">
              <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
              <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
              <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">D</div>
            </div>
          </div>

          {/* Tarjetas de Débito */}
          <div className="flex items-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-colors">
            <div className="w-16 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-800">Tarjetas de Débito</h5>
              <p className="text-sm text-gray-600">Visa, Mastercard, Diners Club</p>
            </div>
            <div className="flex space-x-1">
              <div className="w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">V</div>
              <div className="w-8 h-5 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">M</div>
              <div className="w-8 h-5 bg-green-600 rounded text-white text-xs flex items-center justify-center font-bold">D</div>
            </div>
          </div>

          {/* Daviplata */}
          <div className="flex items-center p-4 bg-purple-50 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-colors">
            <div className="w-16 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
              <Smartphone className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-800">Daviplata</h5>
              <p className="text-sm text-gray-600">Billetera digital de Davivienda</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Digital</span>
            </div>
          </div>

          {/* TC Serfinanza */}
          <div className="flex items-center p-4 bg-red-50 rounded-xl border-2 border-red-200 hover:border-red-300 transition-colors">
            <div className="w-16 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h5 className="font-semibold text-gray-800">TC Serfinanza</h5>
              <p className="text-sm text-gray-600">Tarjeta de crédito Serfinanza</p>
            </div>
            <div className="text-right">
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Especial</span>
            </div>
          </div>

        </div>

        {/* Información de Seguridad */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">✓</span>
            </div>
            <span>Pagos 100% seguros con encriptación SSL</span>
          </div>
        </div>

        {/* Información Adicional */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Todos los métodos de pago están disponibles 24/7 • Sin comisiones adicionales
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
