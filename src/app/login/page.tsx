'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowLeft, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

interface LoginFormData {
  email: string;
  password: string;
}

interface OtpFormData {
  email: string;
  otp: string;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const [otpSent, setOtpSent] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');
  const { login, loginWithOtp } = useAuth();
  const router = useRouter();

  // Obtener returnUrl de los query params
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  const returnUrl = searchParams.get('returnUrl') || '/dashboard';

  const passwordForm = useForm<LoginFormData>();
  const otpForm = useForm<OtpFormData>();

  // Login con contraseña
  const onPasswordSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('¡Bienvenido de vuelta!');
      router.push(returnUrl);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Solicitar OTP para login
  const requestOtp = async (email: string) => {
    setLoading(true);
    try {
      await authApi.loginRequestOtp(email);
      setOtpSent(true);
      setOtpEmail(email);
      otpForm.setValue('email', email); // sincronizar con react-hook-form
      toast.success('Código de acceso enviado a tu email');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al enviar código';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Login con OTP
  const onOtpSubmit = async (data: OtpFormData) => {
    setLoading(true);
    try {
      await loginWithOtp(data.email, data.otp);
      toast.success('¡Acceso autorizado!');
      router.push(returnUrl);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Código inválido';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Manejar solicitud de OTP desde email del modo contraseña
  const handleRequestOtpFromPassword = async () => {
    const email = passwordForm.getValues('email');
    if (!email) {
      toast.error('Ingresa tu email primero');
      return;
    }
    setLoginMode('otp');
    await requestOtp(email);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Franja de identificación Bluko */}
      <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
        <div className="max-w-md mx-auto flex items-center justify-center">
          <Image
            src="/logo-bluko-horizontal.jpg"
            alt="Bluko Life"
            width={160}
            height={40}
            className="h-8 w-auto"
          />
        </div>
      </div>

      <div className="flex items-center justify-center p-4 pt-8">
        <div className="max-w-md w-full">
          {/* Back Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>

          {/* Form Container */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{backgroundColor: '#f8f4ff'}}>
              <Image
                src="/logo-bluko-icon.png"
                alt="Bluko Life"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Iniciar Sesión
            </h1>
            <p className="text-gray-600">
              Accede a tu cuenta de Bluko Life
            </p>
          </div>

          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setOtpSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                loginMode === 'password'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Lock className="w-4 h-4" />
              Contraseña
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setOtpSent(false);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md font-medium text-sm transition-colors ${
                loginMode === 'otp'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Key className="w-4 h-4" />
              Código de Acceso
            </button>
          </div>

          {/* Password Login Form */}
          {loginMode === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...passwordForm.register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-[#481468] transition-colors text-black"
                    placeholder="tu@email.com"
                  />
                </div>
                {passwordForm.formState.errors.email && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    {...passwordForm.register('password', { 
                      required: 'La contraseña es requerida',
                      minLength: { value: 6, message: 'Mínimo 6 caracteres' }
                    })}
                    type={showPassword ? 'text' : 'password'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-[#481468] transition-colors text-black"
                    placeholder="Tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-red-500 text-xs mt-1">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>

              {/* Remember & Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 border-gray-300 rounded focus:ring-2 focus:ring-opacity-75"
                    style={{color: '#82c341', accentColor: '#82c341'}}
                  />
                  <span className="ml-2 block text-sm text-gray-700">
                    Recordarme
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtpFromPassword}
                  className="text-sm hover:opacity-80 transition-all"
                  style={{color: '#481468'}}
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: '#82c341'}}
              >
                {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>
          )}

          {/* OTP Login Form */}
          {loginMode === 'otp' && (
            <div className="space-y-6">
              {!otpSent ? (
                <form onSubmit={otpForm.handleSubmit((data) => requestOtp(data.email))} className="space-y-6">
                  {/* Email for OTP */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...otpForm.register('email', { 
                          required: 'El email es requerido',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Email inválido'
                          }
                        })}
                        type="email"
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-[#481468] transition-colors text-black"
                        placeholder="tu@email.com"
                      />
                    </div>
                    {otpForm.formState.errors.email && (
                      <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  {/* Request OTP Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: '#82c341'}}
                  >
                    {loading ? 'Enviando código...' : 'Enviar Código de Acceso'}
                  </button>
                </form>
              ) : (
                <form onSubmit={otpForm.handleSubmit((data) => onOtpSubmit({ email: otpEmail, otp: data.otp }))} className="space-y-6">
                  {/* Success message */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-green-900">
                          Código enviado exitosamente
                        </p>
                        <p className="text-xs text-green-700 mt-1">
                          Se envió un código de acceso a {otpEmail}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* OTP Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Código de Acceso
                    </label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...otpForm.register('otp', { 
                          required: 'El código es requerido',
                          pattern: {
                            value: /^\d{6}$/,
                            message: 'El código debe tener 6 dígitos'
                          }
                        })}
                        type="text"
                        maxLength={6}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-[#481468] transition-colors text-black text-center text-2xl tracking-widest"
                        placeholder="000000"
                      />
                    </div>
                    {otpForm.formState.errors.otp && (
                      <p className="text-red-500 text-xs mt-1">{otpForm.formState.errors.otp.message}</p>
                    )}
                  </div>

                  {/* Verify OTP Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full text-white py-3 px-4 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{backgroundColor: '#82c341'}}
                  >
                    {loading ? 'Verificando...' : 'Acceder con Código'}
                  </button>

                  {/* Back to email button */}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpEmail('');
                      otpForm.reset();
                    }}
                    className="w-full text-gray-600 hover:text-gray-900 py-2 text-sm font-medium transition-colors"
                  >
                    ← Cambiar email
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Register Link */}
          <div className="mt-6 text-center space-y-2">
            <p className="text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link
                href="/register"
                className="font-semibold hover:opacity-80 transition-all"
                style={{color: '#481468'}}
              >
                Crear Cuenta
              </Link>
            </p>
            <p className="text-gray-600">
              ¿Eres usuario?{' '}
              <Link
                href="/portador/login"
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                style={{color: '#481468'}}
              >
                Acceder aquí
              </Link>
            </p>
          </div>

            {/* Demo Note */}
            <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-[#481468] mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-purple-900 mb-1">
                    Demo de la aplicación
                  </h4>
                  <p className="text-xs text-purple-700">
                    Esta es una demostración del sistema Bluko Life.
                    En producción se conectaría a un backend real.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}