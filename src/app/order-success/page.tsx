'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/utils/currency';
import {
  CheckCircle,
  Shield,
  Truck,
  Mail,
  Download,
  Home,
  Package,
  Clock,
  MapPin
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface OrderData {
  quantity: number;
  pricePerUnit: number;
  total: number;
  orderId: string;
  status: string;
  paymentDate: string;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    region: string;
  };
}

export default function OrderSuccessPage() {
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const savedOrder = localStorage.getItem('lastOrder');
    if (savedOrder) {
      setOrderData(JSON.parse(savedOrder));
      
      // Simular envío de email de confirmación
      setTimeout(() => {
        setEmailSent(true);
      }, 2000);
    } else {
      router.push('/dashboard');
    }
  }, [router]);

  const downloadInvoice = () => {
    // Simular descarga de factura
    const invoiceData = `
FACTURA ELECTRÓNICA
==================

Bluko Life QR
Factura #: ${orderData?.orderId}
Fecha: ${new Date(orderData?.paymentDate || '').toLocaleDateString('es-CO')}

Cliente: ${orderData?.customerData.fullName}
Email: ${orderData?.customerData.email}
Teléfono: ${orderData?.customerData.phone}

Dirección de Envío:
${orderData?.customerData.address}
${orderData?.customerData.city}, ${orderData?.customerData.department}

Productos:
- Pulsera Inteligente QR x${orderData?.quantity}
  Precio unitario: ${formatPrice(orderData?.pricePerUnit || 0)}
  Subtotal: ${formatPrice(orderData?.total || 0)}

Envío: GRATIS
TOTAL: ${formatPrice(orderData?.total || 0)}

Estado: PAGADO
Método de pago: Tarjeta de crédito

¡Gracias por tu compra!
    `;

    const blob = new Blob([invoiceData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${orderData?.orderId}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!user || !orderData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            ¡Compra Exitosa!
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Tu pedido ha sido procesado correctamente. Recibirás tu sistema Bluko Life 
            en los próximos días.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Detalles del Pedido</h2>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">
              PAGADO
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Order Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Información del Pedido</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Número de pedido:</span>
                  <span className="font-mono font-semibold">{orderData.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de compra:</span>
                  <span className="font-semibold">
                    {new Date(orderData.paymentDate).toLocaleDateString('es-CO')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-semibold">
                    {orderData.quantity} {orderData.quantity === 1 ? 'pulsera' : 'pulseras'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total pagado:</span>
                  <span className="font-bold text-green-600">
                    {formatPrice(orderData.total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Información de Envío</h3>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <div>
                    <p className="font-semibold">{orderData.customerData.fullName}</p>
                    <p className="text-gray-600">{orderData.customerData.address}</p>
                    <p className="text-gray-600">
                      {orderData.customerData.city}, {orderData.customerData.department}
                    </p>
                    <p className="text-gray-600">{orderData.customerData.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Email Confirmation */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                emailSent ? 'bg-green-100' : 'bg-blue-100'
              }`}>
                <Mail className={`w-5 h-5 ${emailSent ? 'text-green-600' : 'text-blue-600'}`} />
              </div>
              <h3 className="font-semibold text-gray-900">Confirmación por Email</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              {emailSent 
                ? '✅ Email de confirmación enviado'
                : '📧 Enviando confirmación...'
              }
            </p>
            <p className="text-xs text-gray-500">
              Revisa tu bandeja de entrada en {orderData.customerData.email}
            </p>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-yellow-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Preparación de Envío</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              📦 Preparando tu pedido
            </p>
            <p className="text-xs text-gray-500">
              Tiempo estimado: 3-5 días hábiles
            </p>
          </div>

          {/* Setup */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900">Configuración QR</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              ⚙️ Códigos QR en preparación
            </p>
            <p className="text-xs text-gray-500">
              Listos para configurar al recibir
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">¿Qué sigue?</h3>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                ✓
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Pago Confirmado</h4>
                <p className="text-gray-600 text-sm">Tu pago ha sido procesado exitosamente</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                2
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Preparación del Pedido</h4>
                <p className="text-gray-600 text-sm">Configuramos tus códigos QR únicos (1-2 días)</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">
                3
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Envío</h4>
                <p className="text-gray-600 text-sm">Enviamos tus pulseras con instrucciones de configuración</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-sm">
                4
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Configuración Final</h4>
                <p className="text-gray-600 text-sm">Activas tu cuenta y cargas la información médica</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={downloadInvoice}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Descargar Factura
          </button>
          
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            <Home className="w-4 h-4" />
            Ir al Dashboard
          </Link>
        </div>

        {/* Support Info */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <h4 className="font-semibold text-blue-900 mb-2">
            ¿Necesitas ayuda?
          </h4>
          <p className="text-blue-700 text-sm mb-4">
            Nuestro equipo de soporte está aquí para ayudarte con cualquier pregunta sobre tu pedido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
            <a href="mailto:soporte@pulserasqr.com" className="text-blue-600 hover:text-blue-800">
              📧 soporte@pulserasqr.com
            </a>
            <a href="tel:+573001234567" className="text-blue-600 hover:text-blue-800">
              📞 +57 300 123 4567
            </a>
            <a href="https://wa.me/573001234567" className="text-blue-600 hover:text-blue-800">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}