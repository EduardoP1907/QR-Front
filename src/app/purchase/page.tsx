'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { PRICE_PER_BRACELET } from '@/constants';
import { formatPrice, calculateTotal } from '@/utils/currency';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Shield, 
  ArrowLeft, 
  ChevronRight,
  Check,
  Heart,
  QrCode,
  X
} from 'lucide-react';


export default function PurchasePage() {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const total = calculateTotal(quantity, PRICE_PER_BRACELET);

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(prev => Math.min(prev + 1, 10)); // Máximo 10 pulseras
    } else {
      setQuantity(prev => Math.max(prev - 1, 1)); // Mínimo 1 pulsera
    }
  };

  const handleProceedToPayment = () => {
    // Guardar información del pedido en localStorage para pasarla a la siguiente página
    const orderData = {
      quantity,
      pricePerUnit: PRICE_PER_BRACELET,
      total,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('pendingOrder', JSON.stringify(orderData));
    router.push('/checkout');
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Comprar Pulseras</h1>
                <p className="text-sm text-gray-600">Selecciona la cantidad que necesitas</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Información del Producto */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-16 h-16 text-blue-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Pulsera Inteligente QR
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Pulsera médica inteligente con código QR único que permite acceso inmediato 
                a información médica vital y contactos de emergencia.
              </p>
            </div>

            {/* Características */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Material resistente al agua</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Código QR único personalizado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Información médica segura</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-gray-700">Soporte técnico incluido</span>
              </div>
            </div>

            {/* Precio */}
            <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
              <div className="text-center">
                <p className="text-sm text-blue-600 font-medium mb-2">Precio por unidad</p>
                <p className="text-4xl font-bold text-blue-600">
                  {formatPrice(PRICE_PER_BRACELET)}
                </p>
                <p className="text-sm text-blue-500">Pesos Chilenos</p>
              </div>
            </div>
          </div>

          {/* Selector de Cantidad y Resumen */}
          <div className="space-y-6">
            {/* Selector de Cantidad */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Seleccionar Cantidad
              </h3>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <button
                  onClick={() => handleQuantityChange(false)}
                  disabled={quantity <= 1}
                  className="w-12 h-12 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <Minus className="w-5 h-5 text-blue-600" />
                </button>
                
                <div className="text-center">
                  <div className="text-5xl font-bold text-blue-600 mb-2">
                    {quantity}
                  </div>
                  <p className="text-sm text-gray-500">
                    {quantity === 1 ? 'pulsera' : 'pulseras'}
                  </p>
                </div>
                
                <button
                  onClick={() => handleQuantityChange(true)}
                  disabled={quantity >= 10}
                  className="w-12 h-12 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-50 disabled:text-gray-300 rounded-full flex items-center justify-center transition-colors"
                >
                  <Plus className="w-5 h-5 text-blue-600" />
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mb-6">
                Mínimo 1 pulsera, máximo 10 pulseras por pedido
              </p>
            </div>

            {/* Resumen del Pedido */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Resumen del Pedido
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cantidad:</span>
                  <span className="font-semibold">{quantity} {quantity === 1 ? 'pulsera' : 'pulseras'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Precio unitario:</span>
                  <span className="font-semibold">{formatPrice(PRICE_PER_BRACELET)}</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatPrice(total)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Términos y Condiciones */}
              <div className="mb-6">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">
                    Acepto los{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-blue-600 hover:text-blue-800 underline font-medium"
                    >
                      términos y condiciones
                    </button>{' '}
                    del servicio
                  </span>
                </label>
              </div>

              <button
                onClick={handleProceedToPayment}
                disabled={loading || !acceptedTerms}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? 'Procesando...' : 'Proceder al Pago'}
                <ChevronRight className="w-5 h-5" />
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                En el siguiente paso podrás revisar tu pedido y realizar el pago
              </p>
            </div>

            {/* Información Adicional */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h4 className="font-semibold text-green-900 mb-2">
                📦 Información de Entrega
              </h4>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Envío gratuito a todo Chile</li>
                <li>• Tiempo de entrega: 2-4 días hábiles en RM</li>
                <li>• Configuración y personalización incluida</li>
                <li>• Garantía de 2 años contra defectos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

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

                <h3 className="text-xl font-bold text-blue-600 mb-4">VERSIÓN PROMOCIONAL</h3>
                
                <p className="mb-4">
                  En Santiago de Chile, a la fecha de aceptación electrónica, comparecen:
                </p>

                <p className="mb-4">
                  <strong>Uno)</strong> El Usuario, persona natural que completa el formulario de compra en el sitio web oficial de ..., 
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
                  Las Partes acuerdan la celebración de un contrato de servicios relacionados con la comercialización del producto denominado ..., 
                  y que consta de las siguientes estipulaciones:
                </p>

                <h4 className="text-lg font-semibold mb-3">PRIMERO. Antecedentes</h4>
                <ul className="list-disc pl-6 mb-4 space-y-1">
                  <li>Bluko es una sociedad por acciones, legalmente constituida bajo la legislación chilena, cuyo giro incluye la innovación en administración de datos y networking.</li>
                  <li>El giro de Bluko se desarrolla exclusivamente dentro de la República de Chile.</li>
                  <li>Bluko ha desarrollado productos innovadores, entre ellos ..., protegido por propiedad intelectual e industrial.</li>
                  <li>El Usuario reconoce la necesidad de contratar los servicios referidos a ....</li>
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

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-2">ARTÍCULO TRANSITORIO – Versión Promocional</h4>
                  <p className="text-blue-700 text-sm">
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
                      className="text-blue-600 hover:text-blue-800 underline"
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
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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