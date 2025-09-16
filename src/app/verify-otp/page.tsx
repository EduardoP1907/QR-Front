'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Shield, Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OtpFormData {
  otp: string;
}

export default function VerifyOtpPage() {
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  
  const { verifyOtp, resendOtp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<OtpFormData>();

  const otpValue = watch('otp');

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  const onSubmit = async (data: OtpFormData) => {
    if (!email) {
      toast.error('Email no encontrado. Por favor regístrate nuevamente.');
      router.push('/register');
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, data.otp);
      toast.success('¡Email verificado exitosamente! Ahora puedes iniciar sesión.');
      router.push('/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Código OTP inválido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      toast.error('Email no encontrado. Por favor regístrate nuevamente.');
      router.push('/register');
      return;
    }

    setResendLoading(true);
    try {
      await resendOtp(email);
      toast.success('Código enviado nuevamente a tu email');
      setCountdown(60);
      setCanResend(false);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al reenviar código';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Auto-submit when OTP is complete
  useEffect(() => {
    if (otpValue && otpValue.length === 6) {
      handleSubmit(onSubmit)();
    }
  }, [otpValue]);

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Email no encontrado
            </h1>
            <p className="text-gray-600 mb-6">
              Por favor regístrate nuevamente para recibir el código de verificación.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Ir a Registro
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Back Button */}
        <Link
          href="/register"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al registro
        </Link>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Verifica tu Email
            </h1>
            <p className="text-gray-600 mb-4">
              Hemos enviado un código de 6 dígitos a:
            </p>
            <p className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">
              {email}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
                Código de Verificación
              </label>
              <input
                {...register('otp', { 
                  required: 'El código OTP es requerido',
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'El código debe tener 6 dígitos'
                  }
                })}
                type="text"
                maxLength={6}
                className="w-full text-center text-2xl font-mono py-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors tracking-widest text-black"
                placeholder="000000"
                autoComplete="one-time-code"
              />
              {errors.otp && (
                <p className="text-red-500 text-xs mt-1 text-center">{errors.otp.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !otpValue || otpValue.length !== 6}
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verificando...' : 'Verificar Código'}
            </button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm mb-3">
              ¿No recibiste el código?
            </p>
            
            {!canResend ? (
              <p className="text-sm text-gray-500">
                Reenviar código en {countdown} segundos
              </p>
            ) : (
              <button
                onClick={handleResendOtp}
                disabled={resendLoading}
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${resendLoading ? 'animate-spin' : ''}`} />
                {resendLoading ? 'Reenviando...' : 'Reenviar código'}
              </button>
            )}
          </div>

          {/* Help */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              💡 Consejos
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Revisa tu bandeja de entrada y spam</li>
              <li>• El código expira en 10 minutos</li>
              <li>• Asegúrate de tener conexión a internet</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}