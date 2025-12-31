'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Phone, Heart, AlertTriangle, Home, User, QrCode } from 'lucide-react';
import { pulseraApi, contratanteApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface PulseraData {
  id?: string;
  name: string;
  nombre?: string;
  medicalInfo: string;
  contactoEmergencia?: string;
  telefonoEmergencia?: string;
  condicionesMedicas?: string;
  medicamentos: string;
  alergias?: string;
  tipoSangre?: string;
  status?: string;
  customId?: string;
  isEmergencyView?: boolean;
  // Nuevos campos del backend actualizado
  enfermedadesResumen?: string;
  principiosActivosResumen?: string;
  contactosEmergenciaResumen?: string;
  portador?: {
    fullName: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname: string;
    rut: string;
    email: string;
  };
}

function ScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [qrCode, setQrCode] = useState('');
  const [pulsera, setPulsera] = useState<PulseraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReadyToClaim, setIsReadyToClaim] = useState(false);
  const [isNotReady, setIsNotReady] = useState(false);

  // Extract QR code from URL on client side
  useEffect(() => {
    console.log('🔍 DEBUG - Full URL:', window.location.href);
    console.log('🔍 DEBUG - Search params:', window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || '';
    console.log('🔍 DEBUG - Extracted code:', code);
    setQrCode(code);
  }, []);

  useEffect(() => {
    if (!qrCode) {
      console.log('❌ DEBUG - No QR code provided');
      setError('Código QR no proporcionado');
      setLoading(false);
      return;
    }

    console.log('🚀 DEBUG - Starting fetch for QR code:', qrCode);

    // Reset error and start loading when we have a valid qrCode
    setError(null);
    setLoading(true);
    setIsReadyToClaim(false);
    setIsNotReady(false);

    const fetchPulseraData = async () => {
      try {
        console.log('📡 DEBUG - Calling API scanQr with:', qrCode);
        const response = await pulseraApi.scanQr(qrCode);
        console.log('✅ DEBUG - API response:', response.data);
        setPulsera(response.data);

        // Manejar estados de pulsera según el status
        const status = response.data?.status;
        console.log('📊 DEBUG - Pulsera status:', status);

        // ✅ SOLO IN_STOCK puede ser reclamado
        if (status === 'IN_STOCK') {
          console.log('✅ DEBUG - Status is IN_STOCK, ready to claim');
          setIsReadyToClaim(true);

          // Si el usuario está autenticado, guardar el QR en el backend también
          if (user) {
            console.log('💾 DEBUG - User is authenticated, saving QR to backend');
            try {
              await contratanteApi.saveScannedQr(qrCode);
              console.log('✅ DEBUG - QR saved to backend successfully');
            } catch (saveError) {
              console.error('❌ DEBUG - Error saving QR to backend:', saveError);
              // No mostramos error al usuario, el localStorage es el fallback
            }
          }
        }
        // ⏳ Estados que NO están listos para ser reclamados
        else if (status === 'GENERATED' || 
                 status === 'IN_FABRICATION' || 
                 status === 'FABRICATED') {
          console.log('⏳ DEBUG - Status is ' + status + ', NOT ready to claim yet');
          setIsNotReady(true);
        }
        // 🏥 Estados que muestran información médica
        else if (status === 'ACTIVE' || status === 'ASSIGNED' || status === 'CLAIMED') {
          console.log('🏥 DEBUG - Status is ' + status + ', showing emergency medical info');
          setIsReadyToClaim(false);
          setIsNotReady(false);
          // La vista de emergencia se mostrará por defecto (return al final)
        }
        // Cualquier otro estado
        else {
          console.log('⚠️ DEBUG - Unknown status: ' + status);
        }
      } catch (error: any) {
        console.log('❌ DEBUG - API error:', error);
        console.log('❌ DEBUG - Error response:', error.response);
        const errorMsg = error.response?.data?.error || 'Bluko Life no encontrado';

        if (errorMsg.includes('no tiene información') || errorMsg.includes('no está asignada')) {
          console.log('🟡 DEBUG - Error indicates GENERATED status');
          setIsGenerated(true);

          // Si el usuario está autenticado, guardar el QR en el backend también
          if (user) {
            console.log('💾 DEBUG - User is authenticated, saving QR to backend (from error)');
            try {
              await contratanteApi.saveScannedQr(qrCode);
              console.log('✅ DEBUG - QR saved to backend successfully');
            } catch (saveError) {
              console.error('❌ DEBUG - Error saving QR to backend:', saveError);
            }
          }
        } else {
          console.log('❌ DEBUG - Setting error:', errorMsg);
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPulseraData();
  }, [qrCode, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>

          {/* Debug info */}
          <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded-lg text-left text-xs font-mono max-w-md mx-auto">
            <p className="font-bold mb-2">🔍 DEBUG INFO:</p>
            <p>URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p>QR Code: {qrCode || 'empty'}</p>
          </div>
        </div>
      </div>
    );
  }


  // ⏳ Pulsera NO está lista para ser reclamada (GENERATED, IN_FABRICATION, FABRICATED)
  if (isNotReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-gray-600" />
            </div>

            <div className="text-6xl mb-4">⏳</div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bluko Life No Disponible
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Este Bluko Life aún no está listo para ser reclamado
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
              <p className="text-yellow-700 mb-4">
                Tu Bluko Life está siendo procesado. Recibirás una notificación cuando esté listo para ser reclamado y asignado.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                <span className="font-semibold">Estado actual: {pulsera?.status}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">¿Qué puedes hacer mientras tanto?</h3>
              <ul className="text-left text-blue-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Espera a que tu Bluko Life esté en stock (IN_STOCK)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Recibirás una notificación cuando esté listo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>✓</span>
                  <span>Una vez listo, podrás reclamarlo desde tu dashboard</span>
                </li>
              </ul>
            </div>

            <p className="text-sm text-gray-500 mb-6">
              Código QR: <span className="font-mono font-semibold">{qrCode}</span>
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isReadyToClaim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Debug banner - ALWAYS VISIBLE */}
          <div className="mb-4 bg-gray-900 text-green-400 p-4 rounded-lg text-left text-xs font-mono">
            <p className="font-bold mb-2">🔍 DEBUG INFO (GENERATED):</p>
            <p className="break-all">URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p>QR Code: {qrCode || 'empty'}</p>
            <p>Status: GENERATED (claim page)</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-12 h-12 text-amber-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {pulsera?.status === 'GENERATED' && 'Bluko Life Disponible para Reclamar'}
              {(pulsera?.status === 'IN_FABRICATION' || pulsera?.status === 'FABRICATED' || pulsera?.status === 'IN_STOCK') && 'Bluko Life en Proceso'}
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              {pulsera?.message || 'Este Bluko Life aún no ha sido asignado a un portador.'}
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-blue-900 mb-3">¿Eres el dueño de este Bluko Life?</h2>
              <p className="text-blue-700 mb-4">
                Si compraste este Bluko Life, debes reclamarlo desde tu cuenta de contratante para activarlo y asignarlo.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {user ? (
                  <Link
                    href={`/dashboard?claimQr=${qrCode}`}
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Ir al Dashboard
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        // Store QR code in localStorage before redirecting to login
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('pendingClaimQr', qrCode);
                        }
                        router.push('/login');
                      }}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Iniciar Sesión
                    </button>
                    <button
                      onClick={() => {
                        // Store QR code in localStorage before redirecting to register
                        if (typeof window !== 'undefined') {
                          localStorage.setItem('pendingClaimQr', qrCode);
                        }
                        router.push('/register');
                      }}
                      className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Registrarse
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-sm text-gray-500">
              Código QR: <span className="font-mono font-semibold">{qrCode}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !pulsera) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Debug banner - ALWAYS VISIBLE */}
          <div className="mb-4 bg-gray-900 text-red-400 p-4 rounded-lg text-left text-xs font-mono">
            <p className="font-bold mb-2">🔍 DEBUG INFO (ERROR):</p>
            <p className="break-all">URL: {typeof window !== 'undefined' ? window.location.href : 'N/A'}</p>
            <p>QR Code: {qrCode || 'empty'}</p>
            <p>Error: {error || 'No pulsera data'}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bluko Life No Encontrado
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              {error || 'No se encontró información para este código QR.'}
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Volver al Inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-4 border-red-500">
          {/* Emergency Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-10 h-10 text-red-600" />
              </div>
              <div className="flex-grow">
                <h1 className="text-2xl md:text-3xl font-bold">🚨 INFORMACIÓN DE EMERGENCIA</h1>
                <p className="text-red-100 text-sm md:text-base">Bluko Life - Ficha Médica</p>
              </div>
            </div>
          </div>

          {/* Portador Info */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 border-b-4 border-blue-800">
            <h2 className="text-3xl font-bold mb-2">
              {pulsera.portador?.fullName || pulsera.nombre || pulsera.name || 'Portador'}
            </h2>
            {pulsera.portador?.rut && (
              <p className="text-blue-100 text-lg">
                <span className="font-semibold">RUT:</span> {pulsera.portador.rut}
              </p>
            )}
            {pulsera.portador?.email && (
              <p className="text-blue-100 text-sm mt-1">
                <span className="font-semibold">Email:</span> {pulsera.portador.email}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 space-y-6">

            {/* Contactos de Emergencia */}
            {pulsera.contactosEmergenciaResumen && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <Phone className="w-7 h-7 text-blue-600 mt-1 flex-shrink-0" />
                  <div className="flex-grow">
                    <h3 className="font-bold text-blue-900 mb-3 text-xl">📞 CONTACTOS DE EMERGENCIA</h3>
                    <div className="text-gray-800 whitespace-pre-line text-lg leading-relaxed">
                      {pulsera.contactosEmergenciaResumen}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback: Contacto de Emergencia antiguo */}
            {!pulsera.contactosEmergenciaResumen && (pulsera.contactoEmergencia || pulsera.telefonoEmergencia) && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-start gap-3">
                  <Phone className="w-7 h-7 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-bold text-blue-900 mb-2 text-xl">Contacto de Emergencia</h3>
                    {pulsera.contactoEmergencia && (
                      <p className="text-gray-800 mb-1 text-lg">{pulsera.contactoEmergencia}</p>
                    )}
                    {pulsera.telefonoEmergencia && (
                      <a
                        href={`tel:${pulsera.telefonoEmergencia}`}
                        className="text-blue-600 font-bold hover:text-blue-700 text-xl inline-block mt-2 underline"
                      >
                        {pulsera.telefonoEmergencia}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Enfermedades */}
            {pulsera.enfermedadesResumen && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  ⚠️ ENFERMEDADES / CONDICIONES
                </h3>
                <div className="text-gray-800 whitespace-pre-line text-lg leading-relaxed bg-white p-4 rounded-lg">
                  {pulsera.enfermedadesResumen}
                </div>
              </div>
            )}

            {/* Fallback: Condiciones médicas antiguas */}
            {!pulsera.enfermedadesResumen && pulsera.condicionesMedicas && (
              <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2 text-xl">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  Condiciones Médicas
                </h3>
                <p className="text-gray-800 bg-white p-4 rounded-lg text-lg">
                  {pulsera.condicionesMedicas}
                </p>
              </div>
            )}

            {/* Principios Activos / Medicamentos */}
            {pulsera.principiosActivosResumen && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-purple-900 mb-3 text-xl">💊 MEDICAMENTOS / PRINCIPIOS ACTIVOS</h3>
                <div className="text-gray-800 whitespace-pre-line text-lg leading-relaxed bg-white p-4 rounded-lg">
                  {pulsera.principiosActivosResumen}
                </div>
              </div>
            )}

            {/* Medicamentos adicionales (texto libre) */}
            {pulsera.medicamentos && (
              <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-purple-900 mb-3 text-xl">💊 {pulsera.principiosActivosResumen ? 'OTROS MEDICAMENTOS' : 'MEDICAMENTOS'}</h3>
                <div className="text-gray-800 whitespace-pre-line text-lg leading-relaxed bg-white p-4 rounded-lg">
                  {pulsera.medicamentos}
                </div>
              </div>
            )}

            {/* Alergias */}
            {pulsera.alergias && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-red-900 mb-3 flex items-center gap-2 text-xl">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  ⛔ ALERGIAS
                </h3>
                <p className="text-gray-800 bg-white p-4 rounded-lg text-lg font-semibold">
                  {pulsera.alergias}
                </p>
              </div>
            )}

            {/* Tipo de Sangre */}
            {pulsera.tipoSangre && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
                <div className="flex items-center gap-4">
                  <Heart className="w-10 h-10 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-600 font-semibold">TIPO DE SANGRE</p>
                    <p className="text-4xl font-bold text-red-700">{pulsera.tipoSangre}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información Médica Adicional */}
            {pulsera.medicalInfo && (
              <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-6 shadow-lg">
                <h3 className="font-bold text-gray-900 mb-3 text-xl">📋 INFORMACIÓN ADICIONAL</h3>
                <div className="text-gray-800 whitespace-pre-line text-base leading-relaxed bg-white p-4 rounded-lg">
                  {pulsera.medicalInfo}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 text-center">
            <p className="text-lg font-semibold mb-2">
              ⚠️ EN CASO DE EMERGENCIA, CONTACTE AL NÚMERO INDICADO ARRIBA ⚠️
            </p>
            <p className="text-red-100 text-sm">
              Esta información es confidencial y solo debe ser usada en situaciones de emergencia médica
            </p>
          </div>
        </div>

        {/* QR Code Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Código QR: <span className="font-mono">{qrCode}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ScanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <ScanPageContent />
    </Suspense>
  );
}
