'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, ArrowRight, Calendar, Shield } from 'lucide-react';
import ProtectedRoute from '../../components/ProtectedRoute';

function SubscriptionSuccessContent() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto mb-6 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Suscripción Activada!
          </h1>

          <p className="text-gray-600 mb-8">
            Tu suscripción premium ha sido activada exitosamente. 
            Ahora puedes usar todas las funciones de tu sistema Bluko Life.
          </p>

          {/* Features */}
          <div className="bg-gray-50 rounded-lg p-4 mb-8 space-y-3">
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Shield className="w-4 h-4 text-green-600" />
              <span>Acceso completo activado</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <Calendar className="w-4 h-4 text-green-600" />
              <span>Renovación automática mensual</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <span>Ir al Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => router.push('/purchase')}
              className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <span>Comprar Pulseras</span>
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-6">
            Recibirás un email de confirmación con los detalles de tu suscripción.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SubscriptionSuccessPage() {
  return (
    <ProtectedRoute>
      <SubscriptionSuccessContent />
    </ProtectedRoute>
  );
}