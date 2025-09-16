'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Lock, Eye, EyeOff, ArrowLeft, Shield, Mail } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { portadorApi } from '@/services/api';

interface SetupPasswordFormData {
  password: string;
  confirmPassword: string;
  otp: string;
}

export default function SetupPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const email = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors }, watch } = useForm<SetupPasswordFormData>();
  const password = watch('password');

  useEffect(() => {
    if (!email) {
      toast.error('Email no encontrado');
      router.push('/portador/login');
    }
  }, [email, router]);

  const onSubmit = async (data: SetupPasswordFormData) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    try {
      setLoading(true);
      await portadorApi.setupPassword(email, data.password, data.confirmPassword, data.otp);
      toast.success('¡Contraseña configurada exitosamente!');
      router.push('/portador/login');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al configurar contraseña';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const requestNewOtp = async () => {
    try {
      await portadorApi.loginRequestOtp(email);
      toast.success('Nuevo código enviado a tu email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al solicitar código';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/portador/login" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al login
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configurar Contraseña
          </h1>
          <p className="text-gray-600">
            Configura una contraseña para acceder más fácilmente en el futuro
          </p>
          {email && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-sm text-blue-800">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
            </div>
          )}
        </div>

        {/* Setup Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* OTP Field */}
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                Código de verificación
              </label>
              <input
                {...register('otp', { 
                  required: 'Código es requerido',
                  pattern: {
                    value: /^[0-9]{6}$/,
                    message: 'El código debe tener 6 dígitos'
                  }
                })}
                type="text"
                id="otp"
                maxLength={6}
                className="w-full px-4 py-3 text-center text-lg tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="123456"
              />
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600">{errors.otp.message}</p>
              )}
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={requestNewOtp}
                  className="text-sm text-blue-600 hover:text-blue-700 underline"
                >
                  Solicitar nuevo código
                </button>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('password', { 
                    required: 'Contraseña es requerida',
                    minLength: {
                      value: 6,
                      message: 'La contraseña debe tener al menos 6 caracteres'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  {...register('confirmPassword', { 
                    required: 'Confirmar contraseña es requerido',
                    validate: value => 
                      value === password || 'Las contraseñas no coinciden'
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Repite la contraseña"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? 'Configurando...' : 'Configurar Contraseña'}
            </button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-2">¿Por qué configurar una contraseña?</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Acceso más rápido sin esperar códigos por email</li>
              <li>• Mayor seguridad para tu cuenta</li>
              <li>• Siempre podrás usar códigos de acceso si la olvidas</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Prefieres no configurar contraseña?{' '}
            <Link href="/portador/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Usar solo códigos de acceso
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}