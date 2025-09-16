'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Shield,
  Check,
  CreditCard,
  Calendar,
  Star,
  Clock,
  ArrowLeft,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { contratanteApi } from '../../services/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import type { SubscriptionFormData } from '../../types';

interface LocalFormData {
  fullName: string;
  email: string;
  phone: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
}

const SUBSCRIPTION_PRICE = 2990; // $2.990 CLP mensual

function SubscriptionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const form = useForm<LocalFormData>({
    defaultValues: {
      email: user?.email || '',
      fullName: user?.firstName && user?.paternalSurname 
        ? `${user.firstName} ${user.paternalSurname}` 
        : '',
    }
  });

  const handleSubmit = async (data: LocalFormData) => {
    setProcessing(true);

    try {
      // Simular procesamiento de pago (siempre exitoso para pruebas)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Transformar los datos al formato esperado por el backend
      const subscriptionData: SubscriptionFormData = {
        planType: 'monthly',
        paymentData: {
          cardNumber: data.cardNumber,
          expiryDate: data.expiryDate,
          cvv: data.cvv,
          cardHolderName: data.cardHolderName,
        },
        customerData: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
        }
      };

      // Procesar suscripción en el backend
      const response = await contratanteApi.processSubscription(subscriptionData);

      toast.success('¡Suscripción activada exitosamente!');
      router.push('/subscription-success');
    } catch (err: any) {
      console.error('Error processing subscription:', err);
      console.error('Error response:', err.response?.data);
      
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Error al procesar la suscripción. Inténtalo de nuevo.';
      
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6" style={{color: '#551A8B'}} />
            <h1 className="text-xl font-semibold text-gray-900">Suscripción Premium</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="space-y-6">
            {/* Plan Card */}
            <div className="text-white rounded-2xl p-6" style={{background: 'linear-gradient(to right, #3C0B5A, #551A8B)'}}>
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6" />
                <h2 className="text-2xl font-bold">Plan Premium</h2>
              </div>
              
              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${SUBSCRIPTION_PRICE.toLocaleString('es-CL')}</span>
                  <span className="text-white opacity-80">CLP/mes</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Acceso ilimitado a todas las pulseras</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Generación de códigos QR personalizados</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Almacenamiento seguro de información médica</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Actualizaciones automáticas</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-300" />
                  <span>Soporte técnico prioritario</span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-2">¿Por qué necesito una suscripción?</h3>
                  <p className="text-yellow-700 text-sm">
                    La suscripción nos permite mantener los servidores activos, garantizar la seguridad 
                    de tus datos médicos y proporcionar actualizaciones continuas del sistema. 
                    Sin una suscripción activa, las pulseras no podrán mostrar la información de emergencia.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white border rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Información de pago</h3>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Customer Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Datos del titular</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre completo *
                    </label>
                    <input
                      {...form.register('fullName', { required: 'El nombre es requerido' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                      placeholder="Juan Pérez"
                    />
                    {form.formState.errors.fullName && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Teléfono *
                    </label>
                    <input
                      {...form.register('phone', { required: 'El teléfono es requerido' })}
                      type="tel"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                      placeholder="+56 9 1234 5678"
                    />
                    {form.formState.errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    {...form.register('email', { 
                      required: 'El email es requerido',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Email inválido'
                      }
                    })}
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                    placeholder="correo@ejemplo.com"
                  />
                  {form.formState.errors.email && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              {/* Payment Information */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-gray-900">Información de la tarjeta</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de tarjeta *
                  </label>
                  <input
                    {...form.register('cardNumber', { 
                      required: 'El número de tarjeta es requerido',
                      pattern: {
                        value: /^[0-9\s]{13,19}$/,
                        message: 'Número de tarjeta inválido'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    onChange={(e) => {
                      // Format card number with spaces
                      const value = e.target.value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
                      if (value.length <= 19) {
                        e.target.value = value;
                        form.setValue('cardNumber', value);
                      }
                    }}
                  />
                  {form.formState.errors.cardNumber && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.cardNumber.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de expiración *
                    </label>
                    <input
                      {...form.register('expiryDate', { 
                        required: 'La fecha de expiración es requerida',
                        pattern: {
                          value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                          message: 'Formato MM/AA'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                      placeholder="MM/AA"
                      maxLength={5}
                      onChange={(e) => {
                        // Format expiry date
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length >= 2) {
                          value = value.substring(0, 2) + '/' + value.substring(2, 4);
                        }
                        e.target.value = value;
                        form.setValue('expiryDate', value);
                      }}
                    />
                    {form.formState.errors.expiryDate && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.expiryDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVV *
                    </label>
                    <input
                      {...form.register('cvv', { 
                        required: 'El CVV es requerido',
                        pattern: {
                          value: /^[0-9]{3,4}$/,
                          message: 'CVV inválido (3-4 dígitos)'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black"
                      placeholder="123"
                      maxLength={4}
                      onChange={(e) => {
                        e.target.value = e.target.value.replace(/\D/g, '');
                      }}
                    />
                    {form.formState.errors.cvv && (
                      <p className="text-red-500 text-xs mt-1">{form.formState.errors.cvv.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre en la tarjeta *
                  </label>
                  <input
                    {...form.register('cardHolderName', { required: 'El nombre en la tarjeta es requerido' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-75 focus:border-opacity-75 text-black "
                    placeholder="JUAN PEREZ"
                    onChange={(e) => {
                      e.target.value = e.target.value.toUpperCase();
                    }}
                  />
                  {form.formState.errors.cardHolderName && (
                    <p className="text-red-500 text-xs mt-1">{form.formState.errors.cardHolderName.message}</p>
                  )}
                </div>
              </div>

              {/* Submit */}
              <div className="pt-6 border-t">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-semibold text-gray-900">Total a pagar:</span>
                  <span className="text-2xl font-bold" style={{color: '#551A8B'}}>
                    ${SUBSCRIPTION_PRICE.toLocaleString('es-CL')} CLP
                  </span>
                </div>

                {/* Términos y Condiciones */}
                <div className="mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-opacity-75"
                      style={{color: '#83C341', accentColor: '#83C341'}}
                    />
                    <span className="text-sm text-gray-600">
                      Acepto los{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="underline font-medium hover:opacity-80"
                        style={{color: '#551A8B'}}
                      >
                        términos y condiciones
                      </button>{' '}
                      del servicio
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={processing || !acceptedTerms}
                  className="w-full inline-flex items-center justify-center gap-2 text-white px-6 py-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  style={{backgroundColor: '#83C341'}}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{processing ? 'Procesando...' : 'Activar Suscripción'}</span>
                </button>

                <p className="text-xs text-gray-500 text-center mt-3">
                  Tu suscripción se renovará automáticamente cada mes. 
                  Puedes cancelar en cualquier momento desde tu panel de control.
                </p>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Modal de Términos y Condiciones */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Términos y Condiciones</h2>
              <button
                onClick={() => setShowTermsModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="prose prose-sm max-w-none text-gray-700">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-2">Aviso Importante:</h3>
                  <p className="text-yellow-700">
                    Este contrato es vinculante y será aceptado electrónicamente por el usuario antes de proceder al pago. 
                    No requiere firma física. Al marcar la casilla de aceptación y completar el formulario de compra, 
                    el usuario declara haber leído, comprendido y aceptado íntegramente este documento.
                  </p>
                </div>

                <h3 className="text-xl font-bold mb-4" style={{color: '#551A8B'}}>VERSIÓN PROMOCIONAL</h3>
                
                <p className="mb-4">
                  En Santiago de Chile, a la fecha de aceptación electrónica, comparecen:
                </p>

                <p className="mb-4">
                  <strong>Uno)</strong> El Usuario, persona natural que completa el formulario de compra en el sitio web oficial de Bluko Life, 
                  identificado con los datos entregados voluntariamente (nombre completo, RUT, correo electrónico y teléfono).
                </p>

                <p className="mb-6">
                  <strong>Dos)</strong> Don FRANCISCO JAVIER MONROY FERNÁNDEZ, chileno, divorciado, contador auditor, 
                  cédula de identidad número 6.345.154-1, y Don IAN ALEXANDER FODEN SALINAS, chileno, casado y separado totalmente de bienes, 
                  empresario, cédula de identidad número 8.481.837-2, ambos en representación de BLUKO SpA, sociedad del giro confección, 
                  elaboración y producción de todo tipo de tarjetas y pulseras de información, rol único tributario número 77.934.574-2, 
                  todos con domicilio en Felix de Amesti 121 Dpto. 131, comuna de Las Condes, Región Metropolitana, 
                  en adelante indistintamente como "Bluko".
                </p>

                <p className="mb-6">
                  En lo sucesivo, el Usuario y Bluko son referidos individualmente como "Parte" y colectivamente como las "Partes".
                </p>

                <p className="mb-6">
                  Las Partes acuerdan la celebración de un contrato de servicios relacionados con la comercialización del producto denominado Bluko Life, 
                  y que consta de las siguientes estipulaciones:
                </p>

                <h4 className="text-lg font-semibold mb-3">PRIMERO. Antecedentes</h4>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Bluko es una sociedad por acciones, legalmente constituida bajo la legislación chilena, cuyo giro incluye la innovación en administración de datos y networking.</li>
                  <li>El giro de Bluko se desarrolla exclusivamente dentro de la República de Chile.</li>
                  <li>Bluko ha desarrollado productos innovadores, entre ellos Bluko Life (el "Producto"), protegido por propiedad intelectual e industrial.</li>
                  <li>El Usuario reconoce la necesidad de contratar los servicios referidos a Bluko Life.</li>
                </ul>

                <h4 className="text-lg font-semibold mb-3">SEGUNDO. Contrato de Servicios</h4>
                <p className="mb-4">
                  El Usuario contrata y Bluko provee el Producto Bluko Life, mediante el pago de la suma acordada, según las condiciones de este contrato.
                </p>

                <h4 className="text-lg font-semibold mb-3">TERCERO. Condiciones Generales de Contratación</h4>
                <p className="mb-4">
                  Este contrato se rige también por el documento "Términos y Condiciones" disponible en www.blukolatam.com, 
                  que se entiende incorporado íntegramente y es obligatorio desde la aceptación electrónica.
                </p>

                <h4 className="text-lg font-semibold mb-3">CUARTO. Condiciones Especiales de Contratación</h4>
                <div className="space-y-2 mb-4">
                  <p><strong>A) Descripción del Producto:</strong> Bluko Life - Pulsera con código QR que permite acceder a información médica ingresada y administrada por el Usuario.</p>
                  <p><strong>B) Ingreso de información:</strong> El Usuario será el único responsable de la información ingresada, pudiendo modificarla en cualquier momento.</p>
                  <p><strong>C) Consentimiento:</strong> La aceptación electrónica del contrato equivale a la firma.</p>
                  <p><strong>D) Utilización y cuidado de la Pulsera:</strong> Debe usarse siguiendo las instrucciones de Bluko.</p>
                  <p><strong>E) Acceso a la información:</strong> Mediante escaneo del código QR. Requiere conexión a internet.</p>
                  <p><strong>F) Uso de la información:</strong> Solo para los fines indicados por el Usuario.</p>
                  <p><strong>G) Responsabilidad:</strong> El Usuario es el único responsable de la información ingresada.</p>
                  <p><strong>H) Confidencialidad:</strong> Bluko resguardará la información conforme a lo establecido en este contrato.</p>
                </div>

                <h4 className="text-lg font-semibold mb-3">QUINTO. Obligaciones de las Partes</h4>
                <p className="mb-2"><strong>Bluko:</strong> Mantener operatividad de la web y cumplir con la política de garantía.</p>
                <p className="mb-4"><strong>Usuario:</strong> Usar la pulsera conforme a este contrato, pagar el servicio, mantener actualizada la información.</p>

                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">SEXTO. Incumplimiento</h4>
                    <p className="text-sm">Bluko podrá dar término al contrato en caso de incumplimiento de las obligaciones aquí establecidas.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">SÉPTIMO. Prohibiciones</h4>
                    <p className="text-sm">Se prohíbe el uso indebido del nombre de usuario, modificación no autorizada de contenido, uso ofensivo o ilícito, y cualquier acción que infrinja los derechos de Bluko.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">OCTAVO. Propiedad Intelectual</h4>
                    <p className="text-sm">El sitio web, software y el Producto son propiedad exclusiva de Bluko.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">NOVENO. Política de Cookies</h4>
                    <p className="text-sm">El Usuario acepta el uso de cookies en el sitio.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO. Precio</h4>
                    <p className="text-sm">El valor de activación y la suscripción mensual se aplicarán según el plan vigente publicado en la web oficial.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">UNDÉCIMO. Seguridad</h4>
                    <p className="text-sm">Bluko adoptará medidas técnicas y administrativas para resguardar la seguridad de datos.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DUODÉCIMO. Garantía</h4>
                    <p className="text-sm">La garantía se aplicará conforme a lo establecido en los Términos y Condiciones.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO TERCERO. Vigencia</h4>
                    <p className="text-sm">Este contrato tendrá una duración de 1 año, con renovación automática salvo comunicación en contrario.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO CUARTO. Cesión</h4>
                    <p className="text-sm">No se podrán ceder derechos ni obligaciones sin autorización previa por escrito.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO QUINTO. Terminación</h4>
                    <p className="text-sm">El contrato podrá ser terminado anticipadamente por incumplimiento grave.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO SEXTO. Responsabilidad</h4>
                    <p className="text-sm">El Usuario es responsable de la veracidad y exactitud de la información entregada.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO SÉPTIMO. Notificaciones</h4>
                    <p className="text-sm">Las notificaciones se realizarán por escrito o vía correo electrónico.</p>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold mb-2">DÉCIMO OCTAVO. Ley aplicable y Arbitraje</h4>
                    <p className="text-sm">Este contrato se rige por la legislación de la República de Chile y cualquier controversia será sometida a arbitraje en Santiago.</p>
                  </div>
                </div>

                <div className="rounded-lg p-4 mb-6 border" style={{backgroundColor: '#f8f4ff', borderColor: '#d4c5f9'}}>
                  <h4 className="text-lg font-semibold mb-2" style={{color: '#3C0B5A'}}>ARTÍCULO TRANSITORIO – Versión Promocional</h4>
                  <p className="text-sm" style={{color: '#551A8B'}}>
                    Incluye condiciones especiales de periodo gratuito, carácter de agente promocional y condiciones de suscripción presencial.
                  </p>
                </div>

                <div className="bg-gray-50 border rounded-lg p-4">
                  <p className="text-sm text-gray-600">
                    También las puedes encontrar en la siguiente página:{' '}
                    <a 
                      href="https://www.blukolatam.com/términos-y-condiciones" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:opacity-80"
                      style={{color: '#551A8B'}}
                    >
                      https://www.blukolatam.com/términos-y-condiciones
                    </a>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-3">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setAcceptedTerms(true);
                  setShowTermsModal(false);
                }}
                className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-all"
                style={{backgroundColor: '#83C341'}}
              >
                Acepto los Términos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <ProtectedRoute>
      <SubscriptionContent />
    </ProtectedRoute>
  );
}