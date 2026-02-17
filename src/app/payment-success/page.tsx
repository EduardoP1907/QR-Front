'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Loader2, ArrowRight, Package, AlertCircle, XCircle, RefreshCw } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';
import { contratanteApi } from '../../services/api';
import toast from 'react-hot-toast';

type PaymentStatus = 'verifying' | 'confirmed' | 'not_confirmed' | 'error';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('verifying');
  const [retryCount, setRetryCount] = useState(0);
  const hasVerified = useRef(false);
  const maxRetries = 3;

  useEffect(() => {
    if (hasVerified.current) {
      return;
    }

    hasVerified.current = true;

    const verifyPayment = async () => {
      try {
        // Obtener quantity del localStorage
        const pendingPurchaseStr = localStorage.getItem('pendingPurchase');
        let quantity = null;

        if (pendingPurchaseStr) {
          try {
            const pendingPurchase = JSON.parse(pendingPurchaseStr);
            quantity = pendingPurchase.quantity;
          } catch (e) {
            console.error('Error parseando pendingPurchase:', e);
          }
        }

        // Fallback al query param
        const quantityParam = searchParams.get('quantity');
        if (quantityParam && !quantity) {
          quantity = parseInt(quantityParam);
        }

        // Intentar verificar con reintentos (el callback puede tardar)
        let pagado = false;
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          setRetryCount(attempt + 1);

          // Esperar antes de verificar (dar tiempo al callback de VirtualPos)
          const waitTime = attempt === 0 ? 2000 : 3000;
          await new Promise(resolve => setTimeout(resolve, waitTime));

          const response = await contratanteApi.verifyPaymentAndUpdate(quantity);

          if (response.data.pagado === true) {
            pagado = true;

            // Limpiar localStorage
            localStorage.removeItem('pendingPurchase');

            setPaymentStatus('confirmed');

            if (response.data.pulserasAgregadas) {
              toast.success(`¡${response.data.pulserasAgregadas} dispositivos agregados! Total disponibles: ${response.data.availablePulseras}`);
            } else {
              toast.success(`Verificación completa. Dispositivos disponibles: ${response.data.availablePulseras}`);
            }
            break;
          }
        }

        if (!pagado) {
          // Después de todos los reintentos, el pago no fue confirmado
          setPaymentStatus('not_confirmed');
          localStorage.removeItem('pendingPurchase');
        }
      } catch (error: any) {
        console.error('Error verificando pago:', error);
        setPaymentStatus('error');
      }
    };

    verifyPayment();
  }, []);

  useEffect(() => {
    // Solo iniciar countdown cuando el pago esté confirmado
    if (paymentStatus === 'confirmed') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentStatus]);

  useEffect(() => {
    if (countdown === 0 && paymentStatus === 'confirmed') {
      router.push('/dashboard');
    }
  }, [countdown, paymentStatus, router]);

  // Pago NO confirmado - mostrar mensaje apropiado
  if (paymentStatus === 'not_confirmed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Pago No Confirmado
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              No pudimos confirmar tu pago. Si completaste el pago en VirtualPos,
              es posible que la confirmación esté tardando. Por favor verifica en tu dashboard
              en unos minutos.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
                <span className="text-yellow-900 font-semibold">¿Qué puedo hacer?</span>
              </div>
              <ul className="text-sm text-yellow-700 text-left space-y-2">
                <li>Si <strong>completaste</strong> el pago, espera unos minutos y revisa tu dashboard</li>
                <li>Si <strong>cancelaste</strong> el pago o hiciste click en volver, puedes intentar nuevamente</li>
                <li>Si tienes dudas, contacta a soporte</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all"
                style={{ backgroundColor: '#481468' }}
              >
                <ArrowRight className="w-5 h-5" />
                <span>Ir al Dashboard</span>
              </button>
              <button
                onClick={() => router.push('/subscription')}
                className="inline-flex items-center justify-center gap-2 border-2 px-6 py-3 rounded-xl hover:bg-gray-50 transition-all"
                style={{ borderColor: '#481468', color: '#481468' }}
              >
                <RefreshCw className="w-5 h-5" />
                <span>Intentar de Nuevo</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error de verificación
  if (paymentStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="mx-auto mb-6 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Error de Verificación
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Ocurrió un error al verificar tu pago. Por favor revisa tu dashboard
              o contacta a soporte.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl hover:opacity-90 transition-all"
                style={{ backgroundColor: '#481468' }}
              >
                <ArrowRight className="w-5 h-5" />
                <span>Ir al Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            {paymentStatus === 'verifying' ? (
              <Loader2 className="w-12 h-12 text-green-600 animate-spin" />
            ) : (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {paymentStatus === 'verifying' ? 'Verificando Pago...' : '¡Pago Exitoso!'}
          </h1>

          <p className="text-lg text-gray-600 mb-8">
            {paymentStatus === 'verifying'
              ? 'Estamos confirmando tu pago con el procesador. Esto solo tomará unos segundos.'
              : 'Tu pago ha sido procesado correctamente.'}
          </p>

          {/* Verifying Status */}
          {paymentStatus === 'verifying' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <span className="text-blue-900 font-semibold">
                  Verificando tu pago... (intento {retryCount}/{maxRetries})
                </span>
              </div>
              <p className="text-sm text-blue-700">
                Estamos confirmando tu compra con nuestro procesador de pagos.
              </p>
            </div>
          )}

          {/* Success Status */}
          {paymentStatus === 'confirmed' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <span className="text-green-900 font-semibold">¡Dispositivos agregados!</span>
                </div>
                <p className="text-sm text-green-700">
                  Tus dispositivos están disponibles en tu dashboard.
                  Recibirás un email de confirmación con los detalles de tu compra.
                </p>
              </div>

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
                    <span>Podrás asignar tus dispositivos a los portadores</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                      2
                    </span>
                    <span>Te enviaremos la boleta por correo cuando se termine de preparar el pedido</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-xs">
                      3
                    </span>
                    <span>Si necesitas ayuda contáctanos por WhatsApp o correo</span>
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
            </>
          )}

          {/* Manual redirect button */}
          {paymentStatus === 'confirmed' && (
            <button
              onClick={() => router.push('/dashboard')}
              className="inline-flex items-center gap-2 text-white px-8 py-3 rounded-xl hover:opacity-90 transition-all"
              style={{ backgroundColor: '#82c341' }}
            >
              <span>Ir al Dashboard Ahora</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
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
