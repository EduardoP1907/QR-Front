'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Phone, Heart, AlertTriangle, Home, User, QrCode, Pill, Activity, Users, PhoneCall } from 'lucide-react';
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
    grupoSanguineo?: string;
    peso?: number;
    estatura?: number;
  };
}

// Función para parsear texto en lista de items (por salto de línea o coma)
function parseListItems(text: string): string[] {
  if (!text) return [];

  // Primero intentamos dividir por saltos de línea
  let items = text.split('\n').map(item => item.trim()).filter(item => item.length > 0);

  // Si solo hay un item y contiene comas, dividimos por comas
  if (items.length === 1 && items[0].includes(',')) {
    items = items[0].split(',').map(item => item.trim()).filter(item => item.length > 0);
  }

  return items;
}

// Función para extraer números de teléfono del texto y hacerlos clickeables
function makePhoneNumbersClickable(text: string): React.ReactNode[] {
  if (!text) return [];

  // Regex para detectar números de teléfono chilenos y genéricos
  const phoneRegex = /(\+?56\s?)?(\d{1,2}\s?)?\d{4}[\s-]?\d{4}|\d{9,}/g;
  let key = 0;

  // Usar parseListItems para obtener los elementos
  const items = parseListItems(text);

  return items.map((item, itemIndex) => {
    const lineParts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    // Resetear el regex para cada línea
    phoneRegex.lastIndex = 0;

    while ((match = phoneRegex.exec(item)) !== null) {
      // Agregar texto antes del número
      if (match.index > lastIndex) {
        lineParts.push(<span key={`text-${itemIndex}-${key++}`}>{item.slice(lastIndex, match.index)}</span>);
      }

      // Agregar el número como link clickeable
      const phoneNumber = match[0].replace(/\s/g, '');
      lineParts.push(
        <a
          key={`phone-${itemIndex}-${key++}`}
          href={`tel:${phoneNumber}`}
          className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-1"
        >
          <PhoneCall className="w-4 h-4" />
          {match[0]}
        </a>
      );

      lastIndex = match.index + match[0].length;
    }

    // Agregar el resto del texto
    if (lastIndex < item.length) {
      lineParts.push(<span key={`text-${itemIndex}-${key++}`}>{item.slice(lastIndex)}</span>);
    }

    return (
      <div key={`item-${itemIndex}`} className="mb-1 flex items-start gap-2">
        <span className="text-gray-400">•</span>
        <span>{lineParts.length > 0 ? lineParts : item}</span>
      </div>
    );
  });
}

// Interface para la ubicación
interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
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
  const [isSuspended, setIsSuspended] = useState(false);
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationSent, setLocationSent] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Capturar geolocalización al cargar
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const geoData: GeoLocation = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          };
          setLocation(geoData);
          console.log('📍 Ubicación capturada:', geoData);
        },
        (error) => {
          console.error('❌ Error obteniendo ubicación:', error.message);
          setLocationError(error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    } else {
      setLocationError('Geolocalización no soportada en este dispositivo');
    }
  }, []);

  // Obtener dirección mediante geocodificación inversa
  useEffect(() => {
    if (location && !address && !loadingAddress) {
      setLoadingAddress(true);
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`, {
        headers: {
          'Accept-Language': 'es'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.display_name) {
            setAddress(data.display_name);
            console.log('📍 Dirección obtenida:', data.display_name);
          }
        })
        .catch(err => {
          console.error('❌ Error obteniendo dirección:', err);
        })
        .finally(() => {
          setLoadingAddress(false);
        });
    }
  }, [location, address, loadingAddress]);

  // Función para enviar ubicación al backend
  const sendLocationToBackend = async (code: string, geoData: GeoLocation) => {
    try {
      console.log('📍 Enviando ubicación al backend...');
      await pulseraApi.registerScanLocation(code, {
        latitude: geoData.latitude,
        longitude: geoData.longitude,
        accuracy: geoData.accuracy,
        timestamp: new Date(geoData.timestamp).toISOString()
      });
      setLocationSent(true);
      console.log('✅ Ubicación enviada exitosamente');
    } catch (err) {
      console.error('❌ Error enviando ubicación:', err);
      // No mostramos error al usuario, la ubicación es opcional
    }
  };

  // Extract QR code from URL on client side
  useEffect(() => {
    console.log('🔍 DEBUG - Full URL:', window.location.href);
    console.log('🔍 DEBUG - Search params:', window.location.search);
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code') || '';
    console.log('🔍 DEBUG - Extracted code:', code);
    setQrCode(code);
  }, []);

  // Enviar ubicación cuando esté disponible y la pulsera esté activa
  useEffect(() => {
    if (location && pulsera && !locationSent) {
      const status = pulsera.status;
      if (status === 'ACTIVE' || status === 'ASSIGNED' || status === 'CLAIMED') {
        sendLocationToBackend(qrCode, location);
      }
    }
  }, [location, pulsera, qrCode, locationSent]);

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
    setIsSuspended(false);

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
        // ⏸️ Pulsera suspendida/pausada
        else if (status === 'SUSPENDED' || response.data?.isSuspended) {
          console.log('⏸️ DEBUG - Status is SUSPENDED, pulsera is paused');
          setIsSuspended(true);
        }
        // ⏳ Estados que NO están listos para ser reclamados
        else if (status === 'GENERATED' ||
                 status === 'IN_FABRICATION' ||
                 status === 'FABRICATED') {
          console.log('⏳ DEBUG - Status is ' + status + ', NOT ready to claim yet');
          setIsNotReady(true);
        }
        // 🏥 Estados que muestran información médica (o pendiente de configurar)
        else if (status === 'ACTIVE' || status === 'ASSIGNED' || status === 'CLAIMED') {
          console.log('🏥 DEBUG - Status is ' + status + ', showing emergency medical info');
          setIsReadyToClaim(false);
          setIsNotReady(false);
          // La vista de emergencia se mostrará por defecto (return al final)
          // Enviar ubicación al backend si está disponible
          if (location && !locationSent) {
            sendLocationToBackend(qrCode, location);
          }
        }
        // 🔒 Pulsera bloqueada/inactiva
        else if (status === 'INACTIVE') {
          setIsSuspended(true);
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
          setIsReadyToClaim(true);

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
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#481468]/20 border-t-[#481468] mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando información...</p>
          </div>
        </div>
      </div>
    );
  }

  // ⏸️ Pulsera SUSPENDIDA/PAUSADA
  if (isSuspended) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bluko Life Suspendido
            </h1>

            <p className="text-lg text-gray-600 mb-6">
              Esta pulsera se encuentra temporalmente suspendida
            </p>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8">
              <p className="text-orange-800 mb-4">
                {pulsera?.message || 'Esta pulsera ha sido suspendida temporalmente por el administrador.'}
              </p>
              <p className="text-orange-700 text-sm">
                Si crees que esto es un error o necesitas reactivar tu pulsera, por favor contacta al soporte.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-500">
                Código: <span className="font-mono font-semibold">{pulsera?.customId || qrCode}</span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:soporte@blukolatam.com"
                className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
              >
                <Phone className="w-5 h-5" />
                Contactar Soporte
              </a>
              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                <Home className="w-5 h-5" />
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    );
  }

  // ⏳ Pulsera NO está lista para ser reclamada (GENERATED, IN_FABRICATION, FABRICATED)
  if (isNotReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4" style={{backgroundColor: '#f8f4ff'}}>
                <QrCode className="w-10 h-10" style={{color: '#481468'}} />
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Bluko Life® en Proceso
              </h1>

              <p className="text-lg text-gray-600 mb-8">
                Este dispositivo se encuentra en proceso de fabricación/stock. Aún no ha sido asignado a un portador.
              </p>

              <div className="rounded-xl p-6 mb-6 text-left" style={{backgroundColor: '#f8f4ff', border: '1px solid #d4c5f9'}}>
                <h2 className="font-bold mb-3 text-lg" style={{color: '#481468'}}>
                  ¿Eres el dueño de este Bluko Life®?
                </h2>
                <p className="text-gray-700 mb-5">
                  Si compraste este Bluko Life®, debes activarlo desde tu cuenta de contratante y asignarlo al portador.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{backgroundColor: '#481468'}}>1</div>
                    <p className="text-gray-700 text-sm pt-1">Ingresar a tu cuenta de contratante desde tu celular</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{backgroundColor: '#481468'}}>2</div>
                    <p className="text-gray-700 text-sm pt-1">Escanear el QR del dispositivo</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{backgroundColor: '#481468'}}>3</div>
                    <p className="text-gray-700 text-sm pt-1">Asignar al portador</p>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
                style={{backgroundColor: '#481468'}}
              >
                <Home className="w-5 h-5" />
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isReadyToClaim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
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
      </div>
    );
  }

  if (error || !pulsera) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
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
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
                style={{backgroundColor: '#481468'}}
              >
                <Home className="w-5 h-5" />
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pulsera CLAIMED sin portador configurado → guiar al usuario al dashboard
  if (pulsera.status === 'CLAIMED' && !pulsera.portador) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f8f4ff] to-[#ede8f5]">
        <div className="w-full py-3 px-4" style={{background: 'linear-gradient(to right, #3d1158, #481468)'}}>
          <div className="max-w-md mx-auto flex items-center justify-center">
            <Image src="/logo-bluko-horizontal.jpg" alt="Bluko Life" width={160} height={40} className="h-8 w-auto" />
          </div>
        </div>
        <div className="py-12 px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-amber-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Bluko Life pendiente de configurar</h1>
              <p className="text-gray-600 mb-6">
                Este Bluko Life ya fue reclamado pero aún no tiene un portador asignado.<br/>
                Ingresa a tu cuenta para completar la configuración.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-colors"
                style={{backgroundColor: '#481468'}}
              >
                <User className="w-5 h-5" />
                Ir al Dashboard para asignar portador
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Detectar si hay alertas críticas (alergias o info médica adicional)
  const hasAlerts = pulsera.alergias || pulsera.medicalInfo;

  return (
    <div className="min-h-screen bg-gray-100 py-4 px-2 sm:px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          {/* Header con imagen completa */}
          <div className="w-full">
            <Image
              src="/header-ficha-medica.jpg"
              alt="Bluko Life - Ficha de Emergencia Médica"
              width={500}
              height={250}
              className="w-full h-auto"
              priority
            />
          </div>

          {/* Sección 1: Datos Personales */}
          <div className="border-b-4 border-gray-200">
            <div className="bg-gray-800 text-white px-4 py-2">
              <h2 className="font-bold text-sm">1. DATOS PERSONALES</h2>
            </div>
            <div className="p-4 flex">
              <div className="flex-grow">
                <p className="font-bold text-gray-900 text-lg uppercase">
                  {pulsera.portador?.fullName || pulsera.nombre || pulsera.name || 'Portador'}
                </p>
                {pulsera.portador?.rut && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-semibold">RUT:</span> {pulsera.portador.rut}
                  </p>
                )}
                {(pulsera.portador?.estatura || pulsera.portador?.peso) && (
                  <p className="text-gray-600 text-sm">
                    <span className="font-semibold">Estatura/Peso:</span>{' '}
                    {pulsera.portador?.estatura ? `${pulsera.portador.estatura} cm` : '-'} /{' '}
                    {pulsera.portador?.peso ? `${pulsera.portador.peso} kg` : '-'}
                  </p>
                )}
              </div>
              {/* Badge Grupo Sanguíneo con imagen */}
              {pulsera.portador?.grupoSanguineo && (
                <div className="flex-shrink-0 ml-4">
                  <Image
                    src={`/${pulsera.portador.grupoSanguineo.toLowerCase().replace('+', '%2B')}.png`}
                    alt={`Tipo de sangre ${pulsera.portador.grupoSanguineo}`}
                    width={80}
                    height={80}
                    className="rounded-lg"
                    onError={(e) => {
                      // Fallback si no existe la imagen
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección 2: Alertas Médicas (fondo rojo) */}
          {hasAlerts && (
            <div className="border-b-4 border-gray-200">
              <div className="bg-[#d80000] text-white px-4 py-2">
                <h2 className="font-bold text-sm">2. ALERTAS MÉDICAS</h2>
              </div>
              <div className="bg-[#d80000] p-4 flex items-start gap-3">
                <div className="flex-grow text-white">
                  {pulsera.alergias && (
                    <p className="mb-1">
                      <span className="font-semibold">• ALERGIAS:</span>{' '}
                      <span className="font-bold">{pulsera.alergias.toUpperCase()}</span>
                    </p>
                  )}
                  {pulsera.medicalInfo && (
                    <div className="text-sm">
                      <p className="mb-0.5">• {pulsera.medicalInfo}</p>
                    </div>
                  )}
                </div>
                {/* Logo de precaución */}
                <div className="flex-shrink-0">
                  <Image
                    src="/logo-precaucion.png"
                    alt="Precaución"
                    width={60}
                    height={60}
                    className="object-contain"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Sección 3: Condiciones Previas / Enfermedades */}
          {(pulsera.enfermedadesResumen || pulsera.condicionesMedicas) && (
            <div className="border-b-4 border-gray-200">
              <div className="bg-gray-700 text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold text-sm">3. CONDICIONES PREVIAS DE ALTO RIESGO</h2>
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-gray-800 text-sm">
                  {parseListItems(pulsera.enfermedadesResumen || pulsera.condicionesMedicas || '').map((item, idx) => (
                    <p key={idx} className="mb-1 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección 4: Medicación Actual */}
          {(pulsera.principiosActivosResumen || pulsera.medicamentos) && (
            <div className="border-b-4 border-gray-200">
              <div className="bg-gray-700 text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold text-sm">4. MEDICACIÓN ACTUAL</h2>
                <Pill className="w-5 h-5 text-blue-400" />
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-gray-800 text-sm">
                  {pulsera.principiosActivosResumen && parseListItems(pulsera.principiosActivosResumen).map((item, idx) => (
                    <p key={`pa-${idx}`} className="mb-1 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                  {pulsera.medicamentos && parseListItems(pulsera.medicamentos).map((item, idx) => (
                    <p key={`med-${idx}`} className="mb-1 flex items-start gap-2">
                      <span className="text-gray-400">•</span>
                      <span>{item}</span>
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sección 5: Contactos de Emergencia */}
          {(pulsera.contactosEmergenciaResumen || pulsera.contactoEmergencia || pulsera.telefonoEmergencia) && (
            <div className="border-b-4 border-gray-200">
              <div className="bg-gray-700 text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold text-sm">5. CONTACTOS DE EMERGENCIA</h2>
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div className="p-4 bg-gray-50">
                <div className="text-gray-800 text-sm">
                  {pulsera.contactosEmergenciaResumen ? (
                    makePhoneNumbersClickable(pulsera.contactosEmergenciaResumen)
                  ) : (
                    <>
                      {pulsera.contactoEmergencia && (
                        <p className="mb-2">{pulsera.contactoEmergencia}</p>
                      )}
                      {pulsera.telefonoEmergencia && (
                        <a
                          href={`tel:${pulsera.telefonoEmergencia}`}
                          className="inline-flex items-center gap-2 text-blue-600 font-bold underline"
                        >
                          <PhoneCall className="w-4 h-4" />
                          {pulsera.telefonoEmergencia}
                        </a>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sección de Ubicación del Escaneo */}
          {location && (
            <div className="border-b-4 border-gray-200">
              <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-between">
                <h2 className="font-bold text-sm">📍 UBICACIÓN DEL ESCANEO</h2>
                {locationSent && (
                  <span className="text-xs bg-green-800 px-2 py-1 rounded">✓ Enviada</span>
                )}
              </div>
              <div className="p-4 bg-green-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm text-gray-700 flex-grow pr-3">
                    <p><span className="font-semibold">Lat:</span> {location.latitude.toFixed(6)}</p>
                    <p><span className="font-semibold">Lng:</span> {location.longitude.toFixed(6)}</p>
                    {location.accuracy && (
                      <p className="text-xs text-gray-500">Precisión: ±{Math.round(location.accuracy)}m</p>
                    )}
                    {/* Dirección */}
                    {loadingAddress && (
                      <p className="text-xs text-gray-400 mt-2 italic">Obteniendo dirección...</p>
                    )}
                    {address && (
                      <div className="mt-2 pt-2 border-t border-green-200">
                        <p className="text-xs text-gray-500 font-semibold">Dirección:</p>
                        <p className="text-xs text-gray-700 leading-relaxed">{address}</p>
                      </div>
                    )}
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors flex-shrink-0"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Ver en Mapa
                  </a>
                </div>
                {/* Mapa embebido usando OpenStreetMap (gratuito, sin API key) */}
                <div className="w-full h-44 rounded-lg overflow-hidden border-2 border-green-300 shadow-inner">
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005},${location.latitude - 0.003},${location.longitude + 0.005},${location.latitude + 0.003}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
                  ></iframe>
                </div>
                <p className="text-xs text-green-700 mt-2">
                  Esta ubicación ha sido registrada para facilitar la asistencia en caso de emergencia.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="bg-gray-800 text-white p-4 text-center">
            <p className="text-xs text-gray-400">
              Esta información es confidencial y solo debe ser usada en emergencias médicas
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Bluko Life®
            </p>
          </div>
        </div>

        {/* Botón de emergencias - Ambulancias 131 */}
        <a
          href="tel:131"
          className="flex items-center justify-center gap-3 w-full bg-[#d80000] hover:bg-red-800 text-white py-4 px-6 rounded-xl mt-4 shadow-lg transition-all active:scale-95"
        >
          <Phone className="w-6 h-6" />
          <span className="font-bold text-lg">LLAMAR AMBULANCIA</span>
          <span className="text-2xl font-bold ml-auto">131</span>
        </a>

        {/* QR Code Info */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
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
