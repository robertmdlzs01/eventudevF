"use client";

import React, { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Building2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank_transfer' | 'digital_wallet' | 'cash';
  description: string;
  icon: string;
  enabled: boolean;
  fees?: {
    fixed?: number;
    percentage?: number;
  };
}

interface CobruPaymentMethodsProps {
  onMethodSelect?: (method: PaymentMethod) => void;
  selectedMethod?: string;
}

export default function CobruPaymentMethods({ onMethodSelect, selectedMethod }: CobruPaymentMethodsProps) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/payments/cobru/methods');
      const data = await response.json();

      if (data.success) {
        setPaymentMethods(data.data || []);
      } else {
        setError(data.error || 'Error cargando métodos de pago');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'bank_transfer':
        return <Building2 className="h-5 w-5" />;
      case 'digital_wallet':
        return <Smartphone className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodBadge = (type: string) => {
    switch (type) {
      case 'card':
        return <Badge variant="secondary">Tarjeta</Badge>;
      case 'bank_transfer':
        return <Badge variant="outline">Transferencia</Badge>;
      case 'digital_wallet':
        return <Badge variant="default">Digital</Badge>;
      default:
        return <Badge variant="secondary">Otro</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Cargando métodos de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <CreditCard className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-semibold">Error cargando métodos de pago</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <Button onClick={fetchPaymentMethods} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Métodos de Pago Disponibles</h3>
        <p className="text-sm text-gray-600">Selecciona tu método de pago preferido</p>
      </div>

      <div className="grid gap-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No hay métodos de pago disponibles</p>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card 
              key={method.id} 
              className={`cursor-pointer transition-all duration-200 ${
                selectedMethod === method.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md hover:border-gray-300'
              }`}
              onClick={() => onMethodSelect?.(method)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {getMethodIcon(method.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{method.name}</CardTitle>
                      <CardDescription className="text-sm">{method.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getMethodBadge(method.type)}
                    {selectedMethod === method.id && (
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {method.fees && (
                <CardContent className="pt-0">
                  <div className="text-xs text-gray-600">
                    {method.fees.percentage && (
                      <span>Comisión: {method.fees.percentage}%</span>
                    )}
                    {method.fees.fixed && (
                      <span className="ml-2">
                        + ${method.fees.fixed.toLocaleString()} COP
                      </span>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      <div className="text-center text-xs text-gray-500 mt-4">
        <p>💳 Pagos procesados de forma segura por Cobru</p>
        <p>🔒 Tus datos están protegidos con encriptación SSL</p>
      </div>
    </div>
  );
}
