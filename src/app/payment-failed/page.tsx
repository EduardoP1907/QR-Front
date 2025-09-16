'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/currency';
import {
  XCircle,
  CreditCard,
  RefreshCw,
  Home,
  AlertTriangle,
  Phone,
  Mail,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OrderData {
  quantity: number;
  pricePerUnit: number;
  total: number;
  timestamp: string;
}

export default function PaymentFailedPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedOrder = localStorage.getItem('pendingOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
    }
    
    // Incrementar contador de intentos fallidos
    const attempts = parseInt(localStorage.getItem('retryAttempts') || '0');
    setRetryAttempts(attempts + 1);
    localStorage.setItem('retryAttempts', (attempts + 1).toString());
  }, []);

  const handleRetryPayment = () => {
    // Limpiar contador de intentos y volver al checkout
    localStorage.removeItem('retryAttempts');
    router.push('/checkout');
  };

  const handleNewOrder = () => {
    // Limpiar orden pendiente y empezar de nuevo
    localStorage.removeItem('pendingOrder');
    localStorage.removeItem('retryAttempts');
    router.push('/purchase');
  };

  const getFailureReason = () => {
    const reasons = [
      {
        title: 'Fondos Insuficientes',
        description: 'Tu tarjeta no tiene fondos suficientes para completar la transacción.',
        icon: '💳',
        solution: 'Verifica el saldo de tu tarjeta o usa un método de pago diferente.'
      },
      {
        title: 'Tarjeta Vencida',
        description: 'La fecha de vencimiento de tu tarjeta ha pasado.',
        icon: '📅',
        solution: 'Usa una tarjeta vigente o actualiza los datos de tu tarjeta.'
      },
      {
        title: 'Datos Incorrectos',
        description: 'Los datos de la tarjeta no coinciden con los registros del banco.',
        icon: '❌',
        solution: 'Verifica que el número, fecha y CVV sean correctos.'
      },
      {
        title: 'Transacción Rechazada',
        description: 'Tu banco ha rechazado la transacción por seguridad.',
        icon: '🛡️',
        solution: 'Contacta a tu banco para autorizar la transacción.'
      },
      {
        title: 'Error de Red',
        description: 'Hubo un problema de conexión durante el procesamiento.',
        icon: '🌐',
        solution: 'Intenta nuevamente en unos minutos.'
      }
    ];

    // Simular diferentes razones basadas en el número de intentos
    return reasons[retryAttempts % reasons.length];
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  const failureReason = getFailureReason();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Error Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 rounded-full mb-6">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Error en el Pago
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Lo sentimos, no pudimos procesar tu pago. Por favor revisa la información 
            e intenta nuevamente.
          </p>
        </div>

        {/* Error Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">{failureReason.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {failureReason.title}
              </h2>
              <p className="text-gray-600 mb-4">
                {failureReason.description}
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 Solución:</strong> {failureReason.solution}
                </p>
              </div>
            </div>
          </div>

          {/* Retry Information */}
          {retryAttempts > 1 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-semibold text-orange-900">
                  Múltiples Intentos Detectados
                </span>
              </div>
              <p className="text-sm text-orange-800">
                Has intentado realizar el pago {retryAttempts} veces. Si el problema persiste, 
                te recomendamos contactar a tu banco o usar un método de pago diferente.
              </p>
            </div>
          )}

          {/* Order Summary */}
          {orderData && (
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Resumen del Pedido Pendiente</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cantidad:</span>
                    <span className="font-semibold">
                      {orderData.quantity} {orderData.quantity === 1 ? 'pulsera' : 'pulseras'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Precio unitario:</span>
                    <span className="font-semibold">{formatPrice(orderData.pricePerUnit)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total:</span>
                    <span className="font-bold text-red-600">
                      {formatPrice(orderData.total)}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  <p>Tu pedido se mantendrá reservado por 30 minutos para que puedas completar el pago.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Common Solutions */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Soluciones Comunes</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Verifica los Datos</h4>
                  <p className="text-sm text-gray-600">
                    Asegúrate de que el número de tarjeta, fecha de vencimiento y CVV sean correctos.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Contacta tu Banco</h4>
                  <p className="text-sm text-gray-600">
                    Algunas transacciones pueden ser bloqueadas por seguridad. Autoriza compras en línea.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 font-bold text-sm">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Usa Otra Tarjeta</h4>
                  <p className="text-sm text-gray-600">
                    Intenta con una tarjeta diferente si tienes problemas persistentes.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">4</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Verifica el Saldo</h4>
                  <p className="text-sm text-gray-600">
                    Confirma que tienes fondos suficientes en tu cuenta.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">5</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Intenta Más Tarde</h4>
                  <p className="text-sm text-gray-600">
                    Si hay problemas técnicos, espera unos minutos e intenta nuevamente.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-green-600 font-bold text-sm">6</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Contacta Soporte</h4>
                  <p className="text-sm text-gray-600">
                    Si nada funciona, nuestro equipo te ayudará a completar la compra.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <button
            onClick={handleRetryPayment}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Intentar Pago Nuevamente
          </button>
          
          <button
            onClick={handleNewOrder}
            className="inline-flex items-center gap-2 bg-gray-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            <CreditCard className="w-5 h-5" />
            Modificar Pedido
          </button>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Ir al Dashboard
          </Link>
        </div>

        {/* Support Contact */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 text-center">
          <h4 className="text-2xl font-bold text-blue-900 mb-4">
            ¿Necesitas Ayuda Inmediata?
          </h4>
          <p className="text-blue-700 mb-6 max-w-2xl mx-auto">
            Nuestro equipo de soporte está disponible para ayudarte a resolver cualquier 
            problema con tu pago y completar tu compra exitosamente.
          </p>
          
          <div className="grid md:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <a
              href="tel:+573001234567"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              Llamar
            </a>
            
            <a
              href="mailto:soporte@pulserasqr.com"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Mail className="w-4 h-4" />
              Email
            </a>
            
            <a
              href="https://wa.me/573001234567"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          </div>

          <div className="mt-6 text-sm text-blue-600">
            <p><strong>Horarios:</strong> Lunes a Viernes 8:00 AM - 6:00 PM</p>
            <p><strong>Respuesta promedio:</strong> Menos de 30 minutos</p>
          </div>
        </div>
      </div>
    </div>
  );
}