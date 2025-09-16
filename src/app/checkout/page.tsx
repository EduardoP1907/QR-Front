'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  CreditCard,
  Shield,
  ArrowLeft,
  ChevronRight,
  MapPin,
  User,
  Phone,
  Mail,
  Building,
  Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { contratanteApi } from '../../services/api';
import { formatPrice } from '@/utils/currency';

interface CheckoutFormData {
  // Datos de facturación
  fullName: string;
  email: string;
  phone: string;
  
  // Dirección de envío
  address: string;
  city: string;
  region: string;
  postalCode: string;
  
  // Datos de pago
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
}

interface OrderData {
  quantity: number;
  pricePerUnit: number;
  total: number;
  timestamp: string;
}

export default function CheckoutPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentStep, setPaymentStep] = useState(1); // 1: Info, 2: Pago, 3: Confirmación
  const { user } = useAuth();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<CheckoutFormData>();

  useEffect(() => {
    // Cargar datos del pedido desde localStorage
    const savedOrder = localStorage.getItem('pendingOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
    } else {
      // Si no hay pedido, redirigir a compra
      router.push('/purchase');
    }
  }, [router]);

  const onSubmit = async (data: CheckoutFormData) => {
    if (paymentStep === 1) {
      // Avanzar al paso de pago
      setPaymentStep(2);
      return;
    }

    setLoading(true);
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Para pruebas: siempre aprobar pagos
      const paymentSuccess = true; // Math.random() > 0.1;
      
      if (paymentSuccess) {
        // Procesar la compra en el backend
        try {
          await contratanteApi.processPurchase(orderData.quantity);
          
          // Guardar datos del pedido exitoso
          const successfulOrder = {
            ...orderData,
            customerData: data,
            orderId: `ORD-${Date.now()}`,
            status: 'paid',
            paymentDate: new Date().toISOString()
          };
          
          localStorage.setItem('lastOrder', JSON.stringify(successfulOrder));
          localStorage.removeItem('pendingOrder');
          
          router.push('/order-success');
        } catch (purchaseError) {
          console.error('Error procesando compra:', purchaseError);
          toast.error('Error procesando la compra. Intenta nuevamente.');
          setLoading(false);
          return;
        }
      } else {
        router.push('/payment-failed');
      }
    } catch (error) {
      toast.error('Error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/purchase"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver a Compra
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
                <p className="text-sm text-gray-600">Finalizar compra</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                paymentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`w-20 h-1 ${paymentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                paymentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`w-20 h-1 ${paymentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                paymentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <div className="flex space-x-16 text-sm text-gray-600">
              <span className={paymentStep >= 1 ? 'text-blue-600 font-medium' : ''}>Información</span>
              <span className={paymentStep >= 2 ? 'text-blue-600 font-medium' : ''}>Pago</span>
              <span className={paymentStep >= 3 ? 'text-blue-600 font-medium' : ''}>Confirmación</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {paymentStep === 1 && (
                <>
                  {/* Información Personal */}
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <User className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Información Personal</h3>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nombre Completo *
                        </label>
                        <input
                          {...register('fullName', { required: 'El nombre completo es requerido' })}
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="Tu nombre completo"
                        />
                        {errors.fullName && (
                          <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Teléfono *
                        </label>
                        <input
                          {...register('phone', { required: 'El teléfono es requerido' })}
                          type="tel"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="+569 1234 5678"
                        />
                        {errors.phone && (
                          <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
                        )}
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email de Confirmación *
                        </label>
                        <input
                          {...register('email', { 
                            required: 'El email es requerido',
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: 'Email inválido'
                            }
                          })}
                          type="email"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="tu@email.com"
                        />
                        {errors.email && (
                          <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dirección de Envío */}
                  <div className="bg-white rounded-2xl shadow-xl p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <MapPin className="w-6 h-6 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">Dirección de Envío</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dirección Completa *
                        </label>
                        <input
                          {...register('address', { required: 'La dirección es requerida' })}
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="Calle 123 #45-67, Apto 890"
                        />
                        {errors.address && (
                          <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                        )}
                      </div>
                      
                      <div className="grid md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Ciudad *
                          </label>
                          <input
                            {...register('city', { required: 'La ciudad es requerida' })}
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                            placeholder="Santiago"
                          />
                          {errors.city && (
                            <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Región *
                          </label>
                          <input
                            {...register('region', { required: 'La región es requerida' })}
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                            placeholder="Región Metropolitana"
                          />
                          {errors.region && (
                            <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Código Postal
                          </label>
                          <input
                            {...register('postalCode')}
                            type="text"
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                            placeholder="110111"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {paymentStep === 2 && (
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Lock className="w-6 h-6 text-blue-600" />
                    <h3 className="text-2xl font-bold text-gray-900">Información de Pago</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Número de Tarjeta *
                      </label>
                      <input
                        {...register('cardNumber', { 
                          required: 'El número de tarjeta es requerido',
                          pattern: {
                            value: /^[0-9\s]{13,19}$/,
                            message: 'Número de tarjeta inválido'
                          }
                        })}
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                      {errors.cardNumber && (
                        <p className="text-red-500 text-xs mt-1">{errors.cardNumber.message}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre en la Tarjeta *
                      </label>
                      <input
                        {...register('cardHolderName', { required: 'El nombre en la tarjeta es requerido' })}
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        placeholder="JUAN PEREZ"
                      />
                      {errors.cardHolderName && (
                        <p className="text-red-500 text-xs mt-1">{errors.cardHolderName.message}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Fecha de Vencimiento *
                        </label>
                        <input
                          {...register('expiryDate', { 
                            required: 'La fecha de vencimiento es requerida',
                            pattern: {
                              value: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
                              message: 'Formato: MM/YY'
                            }
                          })}
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                        {errors.expiryDate && (
                          <p className="text-red-500 text-xs mt-1">{errors.expiryDate.message}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          CVV *
                        </label>
                        <input
                          {...register('cvv', { 
                            required: 'El CVV es requerido',
                            pattern: {
                              value: /^[0-9]{3,4}$/,
                              message: 'CVV inválido'
                            }
                          })}
                          type="text"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                          placeholder="123"
                          maxLength={4}
                        />
                        {errors.cvv && (
                          <p className="text-red-500 text-xs mt-1">{errors.cvv.message}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        🔒 Tu información de pago está protegida con encriptación SSL de 256 bits
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Navegación */}
              <div className="flex justify-between">
                {paymentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setPaymentStep(1)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Volver
                  </button>
                )}
                {paymentStep === 1 && <div></div>}
                
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? 'Procesando...' : paymentStep === 1 ? 'Continuar' : 'Pagar Ahora'}
                  {!loading && <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>

          {/* Resumen del Pedido */}
          <div className="bg-white rounded-2xl shadow-xl p-8 h-fit">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Resumen del Pedido
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-600">Bluko Life QR</span>
                <span className="font-semibold text-black">x{orderData.quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Precio unitario:</span>
                <span className="font-semibold text-black">{formatPrice(orderData.pricePerUnit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-semibold text-black">{formatPrice(orderData.total)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Envío:</span>
                <span className="font-semibold">Gratis</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-xl font-bold text-gray-900">Total:</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {formatPrice(orderData.total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Compra Segura</span>
              </div>
              <p className="text-sm text-blue-700">
                Todos los pagos son procesados de forma segura. Tu información financiera 
                está protegida.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}