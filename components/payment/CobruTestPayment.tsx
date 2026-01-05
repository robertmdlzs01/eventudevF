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
  RefreshCw,
  Zap
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CobruTestPaymentProps {
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

interface TransactionData {
  transactionId: string;
  paymentUrl: string;
  qrCode?: string;
  expiresAt: string;
  status: string;
  reference: string;
}

const CobruTestPayment: React.FC<CobruTestPaymentProps> = ({
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
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');

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
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Datos de prueba simulados
      const mockTransaction: TransactionData = {
        transactionId: `cobru_test_${Date.now()}`,
        paymentUrl: `https://sandbox.cobru.co/pay/${Date.now()}`,
        qrCode: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSJ3aGl0ZSIvPgo8cmVjdCB4PSIxNiIgeT0iMTYiIHdpZHRoPSI5NiIgaGVpZ2h0PSI5NiIgZmlsbD0iYmxhY2siLz4KPHJlY3QgeD0iMjQiIHk9IjI0IiB3aWR0aD0iODAiIGhlaWdodD0iODAiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo=',
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutos
        status: 'pending',
        reference: reference
      };

      setTransaction(mockTransaction);
      toast({
        title: "Transacción de prueba creada",
        description: "Se ha generado el enlace de pago con Cobru (modo sandbox)",
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Error creando transacción de prueba';
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
      // Simular verificación de estado
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simular diferentes estados
      const statuses = ['pending', 'approved', 'completed', 'failed'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      
      if (randomStatus !== transaction.status) {
        setTransaction(prev => prev ? { ...prev, status: randomStatus } : null);
        
        if (randomStatus === 'approved' || randomStatus === 'completed') {
          onSuccess?.(transaction);
          toast({
            title: "Pago de prueba exitoso",
            description: "Tu pago de prueba ha sido procesado correctamente",
          });
        } else if (randomStatus === 'failed') {
          onError?.('El pago de prueba falló');
          toast({
            title: "Pago de prueba fallido",
            description: "El pago de prueba no se pudo procesar",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error('Error verificando estado:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const simulatePayment = async (method: string) => {
    setSelectedPaymentMethod(method);
    
    try {
      // Simular llamada a la API de Cobru
      const response = await fetch('/api/payments/cobru/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          description,
          customerEmail,
          customerName,
          customerPhone,
          orderId: reference,
          items: [{
            name: description,
            quantity: quantity || 1,
            price: amount
          }]
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Simular pago exitoso después de 3 segundos
        setTimeout(() => {
          setTransaction(prev => prev ? { ...prev, status: 'approved' } : null);
          onSuccess?.({
            transactionId: result.data.transactionId,
            paymentUrl: result.data.paymentUrl,
            status: 'approved'
          });
          toast({
            title: `Pago con ${method} exitoso`,
            description: "Pago de prueba completado correctamente",
          });
        }, 3000);
      } else {
        throw new Error(result.message || 'Error procesando pago');
      }
    } catch (error: any) {
      console.error('Error simulando pago:', error);
      toast({
        title: "Error en el pago",
        description: error.message,
        variant: "destructive",
      });
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

  const paymentMethods = [
    { id: 'nequi', name: 'Nequi', icon: <Smartphone className="h-4 w-4" />, color: 'bg-purple-100 text-purple-800' },
    { id: 'daviplata', name: 'Daviplata', icon: <Smartphone className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800' },
    { id: 'bancolombia', name: 'Bancolombia', icon: <Building2 className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
    { id: 'pse', name: 'PSE', icon: <CreditCard className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
    { id: 'efecty', name: 'Efecty', icon: <Building2 className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' }
  ];

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Cobru - Modo de Pruebas
        </CardTitle>
        <CardDescription>
          Simulación de pagos con Cobru para desarrollo y testing
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

        {/* Métodos de pago de prueba */}
        <div>
          <h4 className="font-medium mb-3">Métodos de pago disponibles (Prueba):</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {paymentMethods.map((method) => (
              <Button
                key={method.id}
                variant="outline"
                size="sm"
                onClick={() => simulatePayment(method.id)}
                disabled={loading || transaction?.status === 'approved'}
                className="flex items-center gap-2"
              >
                {method.icon}
                <span className="text-xs">{method.name}</span>
              </Button>
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

            {/* QR Code simulado */}
            {transaction.qrCode && (
              <div className="text-center">
                <div className="bg-white p-4 rounded-lg border inline-block">
                  <div className="h-32 w-32 bg-gray-200 rounded flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">QR Code simulado</p>
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
                Abrir página de pago (simulada)
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

        {/* Botón para crear transacción de prueba */}
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
                Creando transacción de prueba...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Crear Transacción de Prueba
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
          <p>• <strong>MODO DE PRUEBAS:</strong> Esta es una simulación de Cobru</p>
          <p>• Los pagos no procesan dinero real</p>
          <p>• Puedes probar todos los métodos de pago</p>
          <p>• Los estados se simulan aleatoriamente</p>
          <p className="text-yellow-600">• Para producción, configurar credenciales reales de Cobru</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CobruTestPayment;
