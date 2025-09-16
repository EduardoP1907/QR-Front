'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Mail,
  Shield,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  User,
  CheckCircle,
  AlertCircle,
  Lock,
  IdCard
} from 'lucide-react';
import { authApi } from '../../services/api';
import { validateRut, formatRut } from '../../utils/rutValidator';

// Tipos para cada fase
interface Phase1Form {
  email: string;
}

interface Phase2Form {
  otp: string;
  password: string;
  confirmPassword: string;
}

interface Phase3Form {
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  rut: string;
}

export default function RegisterPage() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const router = useRouter();

  // Forms para cada fase
  const phase1Form = useForm<Phase1Form>();
  const phase2Form = useForm<Phase2Form>();
  const phase3Form = useForm<Phase3Form>();

  // FASE 1: Solicitar email y enviar OTP
  const handlePhase1Submit = async (data: Phase1Form) => {
    setLoading(true);
    try {
      await authApi.registerPhase1(data.email);
      setEmail(data.email);
      setCurrentPhase(2);
      toast.success('Código OTP enviado a tu email');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al enviar OTP');
    } finally {
      setLoading(false);
    }
  };

  // Verificar OTP
  const handleVerifyOtp = async (otp: string) => {
    setLoading(true);
    try {
      await authApi.registerVerifyOtp(email, otp);
      setOtpVerified(true);
      toast.success('OTP verificado correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'OTP inválido');
      setOtpVerified(false);
    } finally {
      setLoading(false);
    }
  };

  // FASE 2: Establecer contraseña
  const handlePhase2Submit = async (data: Phase2Form) => {
    if (!otpVerified) {
      toast.error('Debes verificar el código OTP primero');
      return;
    }

    setLoading(true);
    try {
      await authApi.registerPhase2(email, data.password, data.confirmPassword);
      setCurrentPhase(3);
      toast.success('Contraseña establecida correctamente');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al establecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  // FASE 3: Completar datos personales
  const handlePhase3Submit = async (data: Phase3Form) => {
    setLoading(true);
    try {
      await authApi.registerPhase3(
        email,
        data.firstName,
        data.paternalSurname,
        data.maternalSurname || '',
        data.rut
      );
      toast.success('¡Registro completado exitosamente!');
      router.push('/login?registered=true');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al completar registro');
    } finally {
      setLoading(false);
    }
  };

  // Validador de RUT en tiempo real
  const validateRutField = (value: string) => {
    if (!value) return 'RUT es requerido';
    if (!validateRut(value)) return 'RUT inválido';
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crear Cuenta</h1>
          <p className="text-gray-600">
            Fase {currentPhase} de 3 - {
              currentPhase === 1 ? 'Verificación de Email' :
              currentPhase === 2 ? 'Configurar Contraseña' :
              'Datos Personales'
            }
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-600">Progreso</span>
            <span className="text-sm text-gray-500">{currentPhase}/3</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentPhase / 3) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* FASE 1: Email */}
          {currentPhase === 1 && (
            <form onSubmit={phase1Form.handleSubmit(handlePhase1Submit)} className="space-y-6">
              <div className="text-center mb-6">
                <Mail className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Ingresa tu Email</h2>
                <p className="text-gray-600 mt-2">Te enviaremos un código de verificación</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  {...phase1Form.register('email', {
                    required: 'Email es requerido',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email inválido'
                    }
                  })}
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black "
                  placeholder="tu@email.com"
                />
                {phase1Form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">
                    {phase1Form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Enviando...' : 'Enviar Código OTP'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* FASE 2: OTP y Contraseña */}
          {currentPhase === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <Lock className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Verificación y Contraseña</h2>
                <p className="text-gray-600 mt-2">
                  Revisa tu email: <span className="font-semibold">{email}</span>
                </p>
              </div>

              {/* Verificación OTP */}
              <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Código de Verificación *
                  </label>
                  {otpVerified && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    {...phase2Form.register('otp', {
                      required: 'OTP es requerido',
                      pattern: {
                        value: /^\d{6}$/,
                        message: 'OTP debe ser de 6 dígitos'
                      }
                    })}
                    type="text"
                    maxLength={6}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="123456"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length === 6) {
                        handleVerifyOtp(value);
                      } else {
                        setOtpVerified(false);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const otpValue = phase2Form.getValues('otp');
                      if (otpValue?.length === 6) {
                        handleVerifyOtp(otpValue);
                      }
                    }}
                    disabled={loading}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Verificar
                  </button>
                </div>
                {phase2Form.formState.errors.otp && (
                  <p className="text-red-500 text-sm mt-1">
                    {phase2Form.formState.errors.otp.message}
                  </p>
                )}
              </div>

              {/* Contraseñas */}
              <form onSubmit={phase2Form.handleSubmit(handlePhase2Submit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      {...phase2Form.register('password', {
                        required: 'Contraseña es requerida',
                        minLength: {
                          value: 6,
                          message: 'Contraseña debe tener al menos 6 caracteres'
                        }
                      })}
                      type={showPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 text-black"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {phase2Form.formState.errors.password && (
                    <p className="text-red-500 text-sm mt-1">
                      {phase2Form.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Contraseña *
                  </label>
                  <div className="relative">
                    <input
                      {...phase2Form.register('confirmPassword', {
                        required: 'Confirmación de contraseña es requerida',
                        validate: (value) => {
                          const password = phase2Form.getValues('password');
                          return value === password || 'Las contraseñas no coinciden';
                        }
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10 text-black"
                      placeholder="Repetir contraseña"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {phase2Form.formState.errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">
                      {phase2Form.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setCurrentPhase(1)}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !otpVerified}
                    className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? 'Configurando...' : 'Continuar'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* FASE 3: Datos Personales */}
          {currentPhase === 3 && (
            <form onSubmit={phase3Form.handleSubmit(handlePhase3Submit)} className="space-y-6">
              <div className="text-center mb-6">
                <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Datos Personales</h2>
                <p className="text-gray-600 mt-2">Completa tu información personal</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    {...phase3Form.register('firstName', {
                      required: 'Nombres son requeridos'
                    })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="Juan Carlos"
                  />
                  {phase3Form.formState.errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">
                      {phase3Form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Paterno *
                  </label>
                  <input
                    {...phase3Form.register('paternalSurname', {
                      required: 'Apellido paterno es requerido'
                    })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="González"
                  />
                  {phase3Form.formState.errors.paternalSurname && (
                    <p className="text-red-500 text-sm mt-1">
                      {phase3Form.formState.errors.paternalSurname.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido Materno
                  </label>
                  <input
                    {...phase3Form.register('maternalSurname')}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="López (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RUT *
                  </label>
                  <input
                    {...phase3Form.register('rut', {
                      required: 'RUT es requerido',
                      validate: validateRutField,
                    })}
                    type="text"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                    placeholder="12.345.678-9"
                    onChange={(e) => {
                      let value = e.target.value;
                      // Auto-formatear mientras el usuario escribe
                      if (value.length >= 2) {
                        value = formatRut(value);
                        e.target.value = value;
                      }
                    }}
                  />
                  {phase3Form.formState.errors.rut && (
                    <p className="text-red-500 text-sm mt-1">
                      {phase3Form.formState.errors.rut.message}
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    Formato: 12.345.678-9
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setCurrentPhase(2)}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Atrás
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? 'Completando...' : 'Finalizar Registro'}
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              Iniciar Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}