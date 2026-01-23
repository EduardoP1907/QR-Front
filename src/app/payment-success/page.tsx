'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Package, AlertCircle } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { contratanteApi } from '../../services/api';
import toast from 'react-hot-toast';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    // Evitar verificaciones duplicadas (React Strict Mode ejecuta efectos 2 veces en dev)
    if (hasVerified.current) {
      console.log('⏭️ Verificación ya realizada, saltando...');
      return;
    }

    hasVerified.current = true;

    // Verificar el estado del pago con el backend
    const verifyPayment = async () => {
      try {
        console.log('🔍 Verificando estado de pulseras después del pago...');

        // Obtener quantity del localStorage (guardado antes de redirigir a VirtualPos)
        const pendingPurchaseStr = localStorage.getItem('pendingPurchase');
        let quantity = null;

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            quantity = pendingPurchase.quantity;
            console.log('📦 Cantidad de pulseras del pedido pendiente:', quantity);
          } catch (e) {
            console.error('Error parseando pendingPurchase:', e);
          }
        }

        // También intentar obtener del query param como fallback
        const quantityParam = searchParams.get('quantity');
        if (quantityParam && !quantity) {
          quantity = parseInt(quantityParam);
          console.log('📦 Cantidad de pulseras del query param:', quantity);
        }

        // Esperar un poco para dar tiempo al callback de VirtualPos
        await new Promise(resolve => setTimeout(resolve, 2000));

        const response = await contratanteApi.verifyPaymentAndUpdate(quantity);

        console.log('✅ Verificación completada:', response.data);
        setVerifying(false);

        // Limpiar el localStorage
        localStorage.removeItem('pendingPurchase');

        if (response.data.pulserasAgregadas) {
          toast.success(`¡${response.data.pulserasAgregadas} pulseras agregadas! Total disponibles: ${response.data.availablePulseras}`);
        } else {
          toast.success(`Verificación completa. Pulseras disponibles: ${response.data.availablePulseras}`);
        }
      } catch (error: any) {
        console.error('❌ Error verificando pago:', error);
        setVerifying(false);
        setVerificationError(error.response?.data?.error || 'Error al verificar el pago');
      }
    };

    verifyPayment();
  }, []);

  useEffect(() => {
    // Solo iniciar countdown cuando la verificación esté completa
    if (!verifying && !verificationError) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verificationError]);

  useEffect(() => {
    // Redirigir cuando el countdown llegue a 0
    if (countdown === 0 && !verifying && !verificationError) {
      router.push('/dashboard');
    }
  }, [countdown, verifying, verificationError, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¡Pago Exitoso!
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            Tu pago ha sido procesado correctamente. Estamos agregando tus pulseras a tu cuenta.
          </p>

          {/* Processing Status */}
          {verifying && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-blue-900 font-semibold">Verificando tu pago...</span>
              </div>
              <p className="text-sm text-blue-700">
                Estamos confirmando tu compra con nuestro procesador de pagos.
                Esto solo tomará unos segundos.
              </p>
            </div>
          )}

          {/* Error Status */}
          {verificationError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <span className="text-yellow-900 font-semibold">Verificación Pendiente</span>
              </div>
              <p className="text-sm text-yellow-700">
                Tu pago fue recibido, pero necesitamos un momento más para actualizar tu cuenta.
                Por favor, recarga tu dashboard en unos minutos.
              </p>
            </div>
          )}

          {/* Success Status */}
          {!verifying && !verificationError && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="text-green-900 font-semibold">¡Pulseras agregadas!</span>
              </div>
              <p className="text-sm text-green-700">
                Tus pulseras están disponibles en tu dashboard.
                Recibirás un email de confirmación con los detalles de tu compra.
              </p>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              ¿Qué sigue?
            </h3>
            <ol className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  1
                </span>
                <span>Tus pulseras se han agregado a tu cuenta</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  2
                </span>
                <span>Podrás crear y activar tus pulseras desde el dashboard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                  3
                </span>
                <span>Recibirás tu pulsera física en 3-5 días hábiles</span>
              </li>
            </ol>
          </div>

          {/* Auto-redirect notice */}
          <div className="mb-6">
            <p className="text-sm text-gray-500">
              Serás redirigido al dashboard en{' '}
              <span className="font-bold text-gray-900">{countdown}</span>{' '}
              segundos...
            </p>
          </div>

          {/* Manual redirect button */}
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all"
            style={{ backgroundColor: '#82c341' }}
          >
            <span>Ir al Dashboard Ahora</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <ProtectedRoute>
      <PaymentSuccessContent />
    </ProtectedRoute>
  );
}
