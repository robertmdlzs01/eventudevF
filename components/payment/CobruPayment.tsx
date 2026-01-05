'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Smartphone, 
  Building2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  QrCode,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/hooks/use-toast';

interface CobruPaymentProps {
  amount: number;
  currency?: string;
  description: string;
  reference: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  eventId?: string;
  ticketTypeId?: string;
  quantity?: number;
  onSuccess?: (transactionData: any) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

interface CobruConfig {
  apiUrl: string;
  environment: string;
  merchantId: string;
  supportedCurrencies: string[];
  supportedPaymentMethods: string[];
  features: {
    qrCode: boolean;
    webhooks: boolean;
    refunds: boolean;
    partialRefunds: boolean;
  };
}

interface TransactionData {
  transactionId: string;
  paymentUrl: string;
  qrCode?: string;
  expiresAt: string;
  status: string;
  reference: string;
}

const CobruPayment: React.FC<CobruPaymentProps> = ({
  amount,
  currency = 'COP',
  description,
  reference,
  customerEmail,
  customerName,
  customerPhone,
  eventId,
  ticketTypeId,
  quantity,
  onSuccess,
  onError,
  onCancel
}) => {
  const [config, setConfig] = useState<CobruConfig | null>(null);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Cargar configuración de Cobru
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await apiClient.getCobruConfig();
        if (response.success) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error('Error cargando configuración Cobru:', error);
      }
    };

    loadConfig();
  }, []);

  // Timer para expiración
  useEffect(() => {
    if (transaction?.expiresAt) {
      const expiresAt = new Date(transaction.expiresAt).getTime();
      const now = new Date().getTime();
      const timeLeft = Math.max(0, Math.floor((expiresAt - now) / 1000));
      
      setTimeLeft(timeLeft);

      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [transaction?.expiresAt]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createTransaction = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.createCobruTransaction({
        amount,
        currency,
        description,
        reference,
        customerEmail,
        customerName,
        customerPhone,
        eventId,
        ticketTypeId,
        quantity
      });

      if (response.success) {
        setTransaction(response.data);
        toast({
          title: "Transacción creada",
          description: "Se ha generado el enlace de pago con Cobru",
        });
      } else {
        throw new Error(response.error || 'Error creando transacción');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Error creando transacción con Cobru';
      setError(errorMessage);
      onError?.(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkTransactionStatus = async () => {
    if (!transaction?.transactionId) return;

    setStatusLoading(true);
    try {
      const response = await apiClient.getCobruTransactionStatus(transaction.transactionId);
      
      if (response.success) {
        const newStatus = response.data.status;
        
        if (newStatus !== transaction.status) {
          setTransaction(prev => prev ? { ...prev, status: newStatus } : null);
          
          if (newStatus === 'approved' || newStatus === 'completed') {
            onSuccess?.(response.data);
            toast({
              title: "Pago exitoso",
              description: "Tu pago ha sido procesado correctamente",
            });
          } else if (newStatus === 'failed' || newStatus === 'cancelled') {
            onError?.('El pago fue cancelado o falló');
            toast({
              title: "Pago fallido",
              description: "El pago fue cancelado o no se pudo procesar",
              variant: "destructive",
            });
          }
        }
      }
    } catch (error: any) {
      console.error('Error verificando estado:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const openPaymentPage = () => {
    if (transaction?.paymentUrl) {
      window.open(transaction.paymentUrl, '_blank');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approved':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'completed':
        return 'Completado';
      case 'failed':
        return 'Fallido';
      case 'cancelled':
        return 'Cancelado';
      default:
        return 'Desconocido';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Cargando configuración de Cobru...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Pago con Cobru
        </CardTitle>
        <CardDescription>
          Pagos seguros en Colombia con múltiples métodos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Información del pago */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Monto:</span>
            <span className="text-lg font-bold">
              ${amount.toLocaleString()} {currency}
            </span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Referencia:</span>
            <span className="font-mono text-sm">{reference}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">Descripción:</span>
            <span className="text-sm">{description}</span>
          </div>
        </div>

        {/* Métodos de pago soportados */}
        <div>
          <h4 className="font-medium mb-3">Métodos de pago disponibles:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {config.supportedPaymentMethods.map((method) => (
              <div key={method} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                {method === 'nequi' && <Smartphone className="h-4 w-4" />}
                {method === 'daviplata' && <Smartphone className="h-4 w-4" />}
                {method.includes('bancolombia') && <Building2 className="h-4 w-4" />}
                {method === 'pse' && <CreditCard className="h-4 w-4" />}
                {!['nequi', 'daviplata', 'bancolombia', 'bancolombia_transfer', 'pse'].includes(method) && 
                  <CreditCard className="h-4 w-4" />}
                <span className="text-xs capitalize">
                  {method.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Estado de la transacción */}
        {transaction && (
          <div className="space-y-4">
            <Separator />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(transaction.status)}
                <span className="font-medium">Estado del pago:</span>
              </div>
              <Badge className={getStatusColor(transaction.status)}>
                {getStatusText(transaction.status)}
              </Badge>
            </div>

            {timeLeft > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Expira en: {formatTime(timeLeft)}</span>
              </div>
            )}

            {/* QR Code */}
            {transaction.qrCode && (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <QrCode className="h-32 w-32 mx-auto" />
                  <p className="text-xs text-gray-500 mt-2">Escanea con tu app bancaria</p>
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3">
              <Button 
                onClick={openPaymentPage}
                className="flex-1"
                disabled={transaction.status === 'completed' || transaction.status === 'approved'}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir página de pago
              </Button>
              
              <Button 
                variant="outline"
                onClick={checkTransactionStatus}
                disabled={statusLoading}
              >
                {statusLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Botón para crear transacción */}
        {!transaction && (
          <Button 
            onClick={createTransaction}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creando transacción...
              </>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Pagar con Cobru
              </>
            )}
          </Button>
        )}

        {/* Botón de cancelar */}
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
          >
            Cancelar
          </Button>
        )}

        {/* Información adicional */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Cobru es una pasarela de pagos segura para Colombia</p>
          <p>• Acepta múltiples métodos de pago locales</p>
          <p>• Transacciones procesadas de forma segura</p>
          {config.environment === 'sandbox' && (
            <p className="text-yellow-600">• Modo de pruebas activo</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CobruPayment;
