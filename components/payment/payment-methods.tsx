"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CreditCard, 
  Building2, 
  Smartphone, 
  CheckCircle,
  AlertCircle,
  Info,
  Zap
} from "lucide-react"

export interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'pse' | 'digital_wallet' | 'gateway'
  description: string
  icon: React.ReactNode
  requiresCardInfo: boolean
  requiresBankInfo: boolean
  requiresPhoneInfo: boolean
  processingTime: string
  fees: string
  gateway?: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'pse',
    name: 'PSE - Pagos Seguros en Línea',
    type: 'gateway',
    description: 'Transferencia bancaria directa desde tu cuenta',
    icon: <Building2 className="h-5 w-5" />,
    requiresCardInfo: false,
    requiresBankInfo: true,
    requiresPhoneInfo: false,
    processingTime: 'Inmediato',
    fees: 'Sin comisión adicional',
    gateway: 'pse'
  },
  {
    id: 'credit_card',
    name: 'Tarjeta de Crédito',
    type: 'card',
    description: 'Visa, Mastercard, Diners Club',
    icon: <CreditCard className="h-5 w-5" />,
    requiresCardInfo: true,
    requiresBankInfo: false,
    requiresPhoneInfo: false,
    processingTime: 'Inmediato',
    fees: 'Sin comisión adicional',
    gateway: 'stripe'
  },
  {
    id: 'debit_card',
    name: 'Tarjeta de Débito',
    type: 'card',
    description: 'Visa, Mastercard, Diners Club',
    icon: <CreditCard className="h-5 w-5" />,
    requiresCardInfo: true,
    requiresBankInfo: false,
    requiresPhoneInfo: false,
    processingTime: 'Inmediato',
    fees: 'Sin comisión adicional',
    gateway: 'stripe'
  },
  {
    id: 'daviplata',
    name: 'Daviplata',
    type: 'digital_wallet',
    description: 'Billetera digital de Davivienda',
    icon: <Smartphone className="h-5 w-5" />,
    requiresCardInfo: false,
    requiresBankInfo: false,
    requiresPhoneInfo: true,
    processingTime: 'Inmediato',
    fees: 'Sin comisión adicional',
    gateway: 'daviplata'
  },
  {
    id: 'tc_serfinanza',
    name: 'TC Serfinanza',
    type: 'card',
    description: 'Tarjeta de crédito Serfinanza',
    icon: <CreditCard className="h-5 w-5" />,
    requiresCardInfo: true,
    requiresBankInfo: false,
    requiresPhoneInfo: false,
    processingTime: 'Inmediato',
    fees: 'Sin comisión adicional',
    gateway: 'serfinanza'
  }
]

interface PaymentMethodsProps {
  selectedMethod: string
  onMethodChange: (methodId: string) => void
  cardData: {
    number: string
    expiry: string
    cvv: string
    holderName: string
  }
  onCardDataChange: (field: string, value: string) => void
  bankData: {
    bank: string
    accountType: string
    documentType: string
    documentNumber: string
  }
  onBankDataChange: (field: string, value: string) => void
  phoneData: {
    phone: string
  }
  onPhoneDataChange: (field: string, value: string) => void
}

const banks = [
  { id: 'bancolombia', name: 'Bancolombia' },
  { id: 'davivienda', name: 'Davivienda' },
  { id: 'banco_bogota', name: 'Banco de Bogotá' },
  { id: 'bbva', name: 'BBVA Colombia' },
  { id: 'banco_popular', name: 'Banco Popular' },
  { id: 'banco_occidente', name: 'Banco de Occidente' },
  { id: 'banco_av_villas', name: 'Banco AV Villas' },
  { id: 'banco_colpatria', name: 'Banco Colpatria' },
  { id: 'banco_caja_social', name: 'Banco Caja Social' },
  { id: 'banco_coltejer', name: 'Banco Coltejer' },
  { id: 'banco_agrario', name: 'Banco Agrario' },
  { id: 'banco_bancoomeva', name: 'Bancoomeva' },
  { id: 'banco_cooperativo', name: 'Banco Cooperativo Coopcentral' },
  { id: 'banco_finandina', name: 'Banco Finandina' },
  { id: 'banco_gnb_sudameris', name: 'GNB Sudameris' },
  { id: 'banco_helm', name: 'Helm Bank' },
  { id: 'banco_ituango', name: 'Banco de la Unión' },
  { id: 'banco_multibank', name: 'Multibank' },
  { id: 'banco_pichincha', name: 'Banco Pichincha' },
  { id: 'banco_procredit', name: 'Banco ProCredit' },
  { id: 'banco_serfinanza', name: 'Serfinanza' },
  { id: 'banco_tecnologico', name: 'Banco Tecnológico' },
  { id: 'banco_w', name: 'Banco W' }
]

export function PaymentMethods({
  selectedMethod,
  onMethodChange,
  cardData,
  onCardDataChange,
  bankData,
  onBankDataChange,
  phoneData,
  onPhoneDataChange
}: PaymentMethodsProps) {
  const selectedPaymentMethod = paymentMethods.find(method => method.id === selectedMethod)

  return (
    <div className="space-y-6">
      {/* Selección de método de pago */}
      <div>
        <Label className="text-lg font-semibold mb-4 block">Método de Pago</Label>
        <RadioGroup value={selectedMethod} onValueChange={onMethodChange} className="space-y-3">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center space-x-3">
              <RadioGroupItem value={method.id} id={method.id} />
              <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                <Card className={`p-4 transition-all ${
                  selectedMethod === method.id 
                    ? 'border-primary-500 bg-primary-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <CardContent className="p-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${
                          selectedMethod === method.id 
                            ? 'bg-primary-100 text-primary-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {method.icon}
                        </div>
                        <div>
                          <h4 className="font-semibold">{method.name}</h4>
                          <p className="text-sm text-gray-600">{method.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {method.processingTime}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {method.fees}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {selectedMethod === method.id && (
                        <CheckCircle className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Información específica del método seleccionado */}
      {selectedPaymentMethod && (
        <div className="space-y-6">

          {/* Formulario de tarjeta */}
          {selectedPaymentMethod.requiresCardInfo && (
            <div className="space-y-4">
              <h4 className="font-semibold">Información de la Tarjeta</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="cardNumber">Número de Tarjeta</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardData.number}
                    onChange={(e) => onCardDataChange('number', e.target.value)}
                    maxLength={19}
                  />
                </div>
                <div>
                  <Label htmlFor="cardHolder">Nombre del Titular</Label>
                  <Input
                    id="cardHolder"
                    placeholder="Como aparece en la tarjeta"
                    value={cardData.holderName}
                    onChange={(e) => onCardDataChange('holderName', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiry">Fecha de Vencimiento</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/AA"
                      value={cardData.expiry}
                      onChange={(e) => onCardDataChange('expiry', e.target.value)}
                      maxLength={5}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      value={cardData.cvv}
                      onChange={(e) => onCardDataChange('cvv', e.target.value)}
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulario PSE */}
          {selectedPaymentMethod.requiresBankInfo && (
            <div className="space-y-4">
              <h4 className="font-semibold">Información Bancaria</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bank">Banco</Label>
                  <Select value={bankData.bank} onValueChange={(value) => onBankDataChange('bank', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona tu banco" />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.id} value={bank.id}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="accountType">Tipo de Cuenta</Label>
                  <Select value={bankData.accountType} onValueChange={(value) => onBankDataChange('accountType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de cuenta" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="savings">Cuenta de Ahorros</SelectItem>
                      <SelectItem value="checking">Cuenta Corriente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentType">Tipo de Documento</Label>
                  <Select value={bankData.documentType} onValueChange={(value) => onBankDataChange('documentType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo de documento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cc">Cédula de Ciudadanía</SelectItem>
                      <SelectItem value="ce">Cédula de Extranjería</SelectItem>
                      <SelectItem value="passport">Pasaporte</SelectItem>
                      <SelectItem value="nit">NIT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="documentNumber">Número de Documento</Label>
                  <Input
                    id="documentNumber"
                    placeholder="Número de documento"
                    value={bankData.documentNumber}
                    onChange={(e) => onBankDataChange('documentNumber', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formulario Daviplata */}
          {selectedPaymentMethod.requiresPhoneInfo && (
            <div className="space-y-4">
              <h4 className="font-semibold">Información de Daviplata</h4>
              <div>
                <Label htmlFor="phone">Número de Teléfono</Label>
                <Input
                  id="phone"
                  placeholder="+57 300 123 4567"
                  value={phoneData.phone}
                  onChange={(e) => onPhoneDataChange('phone', e.target.value)}
                />
                <p className="text-sm text-gray-600 mt-1">
                  Debe ser el número registrado en tu cuenta de Daviplata
                </p>
              </div>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Información Importante</h4>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>• Tus datos personales se utilizarán para procesar tu pedido</li>
                  <li>• Mejoraremos tu experiencia en esta web</li>
                  <li>• Otros propósitos descritos en nuestra política de privacidad</li>
                  <li>• Todos los pagos son procesados de forma segura</li>
                  <li>• Recibirás confirmación por email después del pago</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
