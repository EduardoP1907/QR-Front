'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Image from 'next/image';
import {
  Shield,
  Check,
  CreditCard,
  Calendar,
  Star,
  Clock,
  ArrowLeft,
  X,
  Plus,
  Minus,
  Heart,
  QrCode,
  Phone,
  Users,
  Tag,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { contratanteApi } from '../../services/api';
import ProtectedRoute from '../../components/ProtectedRoute';
import { SUBSCRIPTION_PRICE, PULSERA_PRICE, TOTAL_PER_PULSERA } from '../../constants';
import type { SubscriptionFormData } from '../../types';

interface LocalFormData {
  quantity: number;
}

interface CuponValidation {
  valido: boolean;
  mensaje: string;
  codigo?: string;
  porcentajeDescuento?: number;
  precioOriginalPulsera?: number;
  descuento?: number;
  precioFinalPulsera?: number;
}

function SubscriptionContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Estados para cupón de descuento
  const [showCuponField, setShowCuponField] = useState(false);
  const [cuponCode, setCuponCode] = useState('');
  const [cuponValidation, setCuponValidation] = useState<CuponValidation | null>(null);
  const [validatingCupon, setValidatingCupon] = useState(false);

  const form = useForm<LocalFormData>({
    defaultValues: {
      quantity: 1,
    }
  });

  // Update form value when quantity changes
  React.useEffect(() => {
    form.setValue('quantity', quantity);
  }, [quantity, form]);

  const handleQuantityChange = (increment: boolean) => {
    if (increment) {
      setQuantity(Math.min(quantity + 1, 10)); // Máximo 10 dispositivos
    } else {
      setQuantity(Math.max(quantity - 1, 1)); // Mínimo 1 dispositivo
    }
  };

  // Validar cupón de descuento
  const handleValidateCupon = async () => {
    if (!cuponCode.trim()) {
      toast.error('Ingresa un código de cupón');
      return;
    }

    setValidatingCupon(true);
    try {
      const response = await contratanteApi.validateCupon(cuponCode.trim().toUpperCase());
      setCuponValidation(response.data);

      if (response.data.valido) {
        toast.success(`¡Cupón válido! ${response.data.porcentajeDescuento}% de descuento en la pulsera`);
      } else {
        toast.error(response.data.mensaje);
      }
    } catch (err: any) {
      console.error('Error validating cupon:', err);
      const errorMessage = err.response?.data?.error || 'Error al validar el cupón';
      toast.error(errorMessage);
      setCuponValidation({ valido: false, mensaje: errorMessage });
    } finally {
      setValidatingCupon(false);
    }
  };

  // Limpiar cupón
  const handleClearCupon = () => {
    setCuponCode('');
    setCuponValidation(null);
  };

  // Calcular totales con descuento (el descuento se aplica sobre las pulseras)
  const calcularTotales = () => {
    const totalPulserasSinDescuento = PULSERA_PRICE * quantity;
    const totalHabilitacion = SUBSCRIPTION_PRICE * quantity;
    let descuento = 0;

    if (cuponValidation?.valido && cuponValidation.porcentajeDescuento) {
      descuento = Math.floor((totalPulserasSinDescuento * cuponValidation.porcentajeDescuento) / 100);
    }

    const totalPulserasConDescuento = totalPulserasSinDescuento - descuento;
    const totalFinal = totalPulserasConDescuento + totalHabilitacion;

    return {
      totalPulserasSinDescuento,
      totalPulserasConDescuento,
      totalHabilitacion,
      descuento,
      totalFinal
    };
  };

  const totales = calcularTotales();

  const handleSubmit = async (data: LocalFormData) => {
    setProcessing(true);

    try {
      const descuento = cuponValidation?.valido ? cuponValidation.porcentajeDescuento : null;
      console.log('Buscando plan de pago:', { quantity, descuento });

      // Obtener la URL del plan pre-configurado en VirtualPos
      const response = await contratanteApi.buscarPlanPago(quantity, descuento);
      const planUrl: string = response.data.urlPago;

      if (!planUrl) {
        throw new Error('No se encontró un plan disponible para la selección');
      }

      // Guardar información del pedido en localStorage para verificación posterior
      localStorage.setItem('pendingPurchase', JSON.stringify({
        quantity,
        timestamp: Date.now()
      }));

      toast.success('Redirigiendo al pago seguro...');
      window.location.href = planUrl;

    } catch (err: any) {
      console.error('Error obteniendo plan de pago:', err);

      const errorMessage = err.response?.data?.error ||
                          err.response?.data?.message ||
                          err.message ||
                          'Error al iniciar el pago. Inténtalo de nuevo.';

      toast.error(errorMessage);
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
            <Image
              src="/logo-bluko-icon.png"
              alt="Bluko"
              width={28}
              height={28}
              className="object-contain"
            />
            <h1 className="text-xl font-semibold text-gray-900">Plan Bluko Life</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Plan Details */}
          <div className="space-y-6">
            {/* Quantity Selection */}
            <div className="bg-white border rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">¿Cuántos dispositivos necesitas?</h3>
              <div className="flex items-center justify-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleQuantityChange(false)}
                  disabled={quantity <= 1}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex flex-col items-center">
                  <span className="text-3xl font-bold text-gray-900">{quantity}</span>
                  <span className="text-sm text-gray-500">Bluko Life</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleQuantityChange(true)}
                  disabled={quantity >= 10}
                  className="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center text-gray-600 hover:border-gray-400 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Plan Card */}
            <div className="text-white rounded-2xl p-6" style={{background: 'linear-gradient(to right, #3C0B5A, #481468)'}}>
              <div className="flex items-center gap-3 mb-6">
                <Heart className="w-6 h-6" />
                <h2 className="text-2xl font-bold">SUSCRIPCIÓN</h2>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${SUBSCRIPTION_PRICE.toLocaleString('es-CL')}</span>
                  <span className="text-white opacity-80">/CLP</span>
                </div>
                <div className="text-sm text-white opacity-90 mt-1">Plan de protección Mensual</div>
              </div>

              <div className="mb-6 p-4 bg-white/10 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm">+ ${PULSERA_PRICE.toLocaleString('es-CL')} Bluko Life física</span>
                </div>
                <div className="text-xs text-white opacity-80 mt-1">
                  (pago unico al momento de contratación)
                </div>
              </div>

                          </div>
          </div>

          {/* Payment Form */}
          <div className="bg-white border rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Resumen de tu compra</h3>

            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* Hidden quantity field */}
              <input
                type="hidden"
                {...form.register('quantity')}
              />

              {/* Payment information notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-1">Pago Seguro con VirtualPos</h4>
                    <p className="text-sm text-blue-700">
                      Serás redirigido a nuestra plataforma de pago segura donde podrás ingresar
                      los datos de tu tarjeta de forma protegida.
                    </p>
                  </div>
                </div>
              </div>

              {/* Cupón de descuento */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowCuponField(!showCuponField)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {cuponValidation?.valido
                        ? `Cupón aplicado: ${cuponValidation.codigo} (-${cuponValidation.porcentajeDescuento}%)`
                        : '¿Tienes un cupón de descuento?'}
                    </span>
                  </div>
                  {showCuponField ? (
                    <ChevronUp className="w-5 h-5 text-black" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-black" />
                  )}
                </button>

                {showCuponField && (
                  <div className="p-4 border-t bg-gray-50">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={cuponCode}
                          onChange={(e) => {
                            setCuponCode(e.target.value.toUpperCase());
                            if (cuponValidation) setCuponValidation(null);
                          }}
                          placeholder="Ingresa tu código (ej: MAMA20)"
                          className="w-full px-4 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-opacity-50 uppercase text-black"
                          style={{ focusRing: '#481468' }}
                          disabled={validatingCupon || cuponValidation?.valido}
                        />
                        {cuponValidation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {cuponValidation.valido ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      {cuponValidation?.valido ? (
                        <button
                          type="button"
                          onClick={handleClearCupon}
                          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                        >
                          Quitar
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleValidateCupon}
                          disabled={validatingCupon || !cuponCode.trim()}
                          className="px-4 py-2 text-white rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          style={{ backgroundColor: '#481468' }}
                        >
                          {validatingCupon ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Validando...</span>
                            </>
                          ) : (
                            'Aplicar'
                          )}
                        </button>
                      )}
                    </div>
                    {cuponValidation && !cuponValidation.valido && (
                      <p className="mt-2 text-sm text-red-600">{cuponValidation.mensaje}</p>
                    )}
                    {cuponValidation?.valido && (
                      <p className="mt-2 text-sm text-green-600">
                        ¡{cuponValidation.porcentajeDescuento}% de descuento aplicado en tu Bluko Life!
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="pt-2">
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600 min-w-0">Pago único al momento de contratación:</span>
                    {totales.descuento > 0 ? (
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm text-gray-400 line-through mr-2 whitespace-nowrap">
                          ${totales.totalPulserasSinDescuento.toLocaleString('es-CL')}
                        </span>
                        <span className="font-semibold text-black whitespace-nowrap">
                          ${totales.totalPulserasConDescuento.toLocaleString('es-CL')} CLP
                        </span>
                      </div>
                    ) : (
                      <span className="font-semibold text-black whitespace-nowrap flex-shrink-0">
                        ${totales.totalPulserasSinDescuento.toLocaleString('es-CL')} CLP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600 min-w-0">Plan de protección Mensual:</span>
                    <span className="font-semibold text-black whitespace-nowrap flex-shrink-0">
                      ${totales.totalHabilitacion.toLocaleString('es-CL')} CLP
                    </span>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="flex items-center justify-between gap-2 text-green-600">
                      <span className="text-sm flex items-center gap-1 min-w-0">
                        <Tag className="w-4 h-4 flex-shrink-0" />
                        Descuento cupón ({cuponValidation?.porcentajeDescuento}%):
                      </span>
                      <span className="font-semibold whitespace-nowrap flex-shrink-0">-${totales.descuento.toLocaleString('es-CL')} CLP</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-600 min-w-0">Cantidad de Bluko Life:</span>
                    <span className="font-semibold text-black flex-shrink-0">{quantity}</span>
                  </div>
                  <hr />
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-lg font-semibold text-gray-900">Total primer pago:</span>
                    <div className="text-right flex-shrink-0">
                      {totales.descuento > 0 && (
                        <span className="text-sm text-gray-400 line-through block whitespace-nowrap">
                          ${(TOTAL_PER_PULSERA * quantity).toLocaleString('es-CL')} CLP
                        </span>
                      )}
                      <span className="text-2xl font-bold whitespace-nowrap" style={{color: '#481468'}}>
                        ${totales.totalFinal.toLocaleString('es-CL')} CLP
                      </span>
                    </div>
                  </div>
                  {totales.descuento > 0 && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <span className="text-green-700 font-medium">
                        ¡Estás ahorrando ${totales.descuento.toLocaleString('es-CL')} CLP con tu cupón!
                      </span>
                    </div>
                  )}
                </div>

                {/* Términos y Condiciones */}
                <div className="mb-6">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-opacity-75"
                      style={{color: '#82c341', accentColor: '#82c341'}}
                    />
                    <span className="text-sm text-gray-600">
                      Acepto los{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="underline font-medium hover:opacity-80"
                        style={{color: '#481468'}}
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
                  style={{backgroundColor: '#82c341'}}
                >
                  <CreditCard className="w-5 h-5" />
                  <span>{processing ? 'Redirigiendo...' : 'Proceder al Pago'}</span>
                </button>
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

                <h3 className="text-xl font-bold mb-4" style={{color: '#481468'}}>VERSIÓN PROMOCIONAL</h3>
                
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
                  elaboración y producción de todo tipo de tarjetas y dispositivos de información, rol único tributario número 77.934.574-2, 
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
                  <p><strong>A) Descripción del Producto:</strong> Bluko Life - Dispositivo con código QR que permite acceder a información médica ingresada y administrada por el Usuario.</p>
                  <p><strong>B) Ingreso de información:</strong> El Usuario será el único responsable de la información ingresada, pudiendo modificarla en cualquier momento.</p>
                  <p><strong>C) Consentimiento:</strong> La aceptación electrónica del contrato equivale a la firma.</p>
                  <p><strong>D) Utilización y cuidado del Dispositivo:</strong> Debe usarse siguiendo las instrucciones de Bluko.</p>
                  <p><strong>E) Acceso a la información:</strong> Mediante escaneo del código QR. Requiere conexión a internet.</p>
                  <p><strong>F) Uso de la información:</strong> Solo para los fines indicados por el Usuario.</p>
                  <p><strong>G) Responsabilidad:</strong> El Usuario es el único responsable de la información ingresada.</p>
                  <p><strong>H) Confidencialidad:</strong> Bluko resguardará la información conforme a lo establecido en este contrato.</p>
                </div>

                <h4 className="text-lg font-semibold mb-3">QUINTO. Obligaciones de las Partes</h4>
                <p className="mb-2"><strong>Bluko:</strong> Mantener operatividad de la web y cumplir con la política de garantía.</p>
                <p className="mb-4"><strong>Usuario:</strong> Usar el dispositivo conforme a este contrato, pagar el servicio, mantener actualizada la información.</p>

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
                  <p className="text-sm" style={{color: '#481468'}}>
                    Incluye condiciones especiales de periodo gratuito, carácter de agente promocional y condiciones de suscripción presencial.
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
                style={{backgroundColor: '#82c341'}}
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