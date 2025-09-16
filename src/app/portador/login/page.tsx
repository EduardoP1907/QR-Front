'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { Mail, Lock, KeyRound, ArrowLeft, Heart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { portadorApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface LoginFormData {
  email: string;
  password?: string;
}

interface OtpFormData {
  otp: string;
}

export default function PortadorLoginPage() {
  const [loginMode, setLoginMode] = useState<'password' | 'otp' | 'otp-verify'>('otp');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const loginForm = useForm<LoginFormData>();
  const otpForm = useForm<OtpFormData>();

  const handlePasswordLogin = async (data: LoginFormData) => {
    try {
      setLoading(true);
      const response = await portadorApi.login(data.email, data.password);
      
      // Guardar token
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
      }
      
      toast.success('¡Bienvenido de vuelta!');
      router.push('/portador/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOtp = async (data: LoginFormData) => {
    try {
      setLoading(true);
      await portadorApi.loginRequestOtp(data.email);
      setEmail(data.email);
      setLoginMode('otp-verify');
      toast.success('Código de acceso enviado a tu email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al solicitar código';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerify = async (data: OtpFormData) => {
    try {
      setLoading(true);
      const response = await portadorApi.loginVerifyOtp(email, data.otp);
      
      // Guardar token
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', response.data.token);
      }
      
      toast.success('¡Acceso exitoso!');
      router.push('/portador/dashboard');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Código inválido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al inicio
          </Link>
          
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-100 p-3 rounded-full">
              <Heart className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Acceso para Usuarios
          </h1>
          <p className="text-gray-600">
            Gestiona tu información médica y pulseras asignadas
          </p>
        </div>

        {/* Login Mode Selector */}
        {loginMode !== 'otp-verify' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
              <button
                onClick={() => setLoginMode('otp')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'otp'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <KeyRound className="w-4 h-4 inline-block mr-2" />
                Código de Acceso
              </button>
              <button
                onClick={() => setLoginMode('password')}
                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  loginMode === 'password'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Lock className="w-4 h-4 inline-block mr-2" />
                Contraseña
              </button>
            </div>

            {/* OTP Login Form */}
            {loginMode === 'otp' && (
              <form onSubmit={loginForm.handleSubmit(handleRequestOtp)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...loginForm.register('email', { required: 'Email es requerido' })}
                      type="email"
                      id="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Enviando...' : 'Solicitar Código de Acceso'}
                </button>

                <p className="text-sm text-gray-600 text-center mt-4">
                  Recibirás un código de 6 dígitos en tu email para acceder a tu cuenta
                </p>
              </form>
            )}

            {/* Password Login Form */}
            {loginMode === 'password' && (
              <form onSubmit={loginForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...loginForm.register('email', { required: 'Email es requerido' })}
                      type="email"
                      id="email"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="tu@email.com"
                    />
                  </div>
                  {loginForm.formState.errors.email && (
                    <p className="mt-2 text-sm text-red-600">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...loginForm.register('password', { required: 'Contraseña es requerida' })}
                      type="password"
                      id="password"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Tu contraseña"
                    />
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="mt-2 text-sm text-red-600">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <p className="text-sm text-gray-600 text-center mt-4">
                  ¿No tienes contraseña configurada?{' '}
                  <button
                    type="button"
                    onClick={() => setLoginMode('otp')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Usar código de acceso
                  </button>
                </p>
              </form>
            )}
          </div>
        )}

        {/* OTP Verification */}
        {loginMode === 'otp-verify' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Mail className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Código Enviado
              </h2>
              <p className="text-gray-600">
                Ingresa el código de 6 dígitos que enviamos a<br />
                <span className="font-medium text-gray-900">{email}</span>
              </p>
            </div>

            <form onSubmit={otpForm.handleSubmit(handleOtpVerify)} className="space-y-4">
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación
                </label>
                <input
                  {...otpForm.register('otp', { 
                    required: 'Código es requerido',
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: 'El código debe tener 6 dígitos'
                    }
                  })}
                  type="text"
                  id="otp"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123456"
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-2 text-sm text-red-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {loading ? 'Verificando...' : 'Verificar Código'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setLoginMode('otp')}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Volver a solicitar código
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            ¿Eres un contratante?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              Accede aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}