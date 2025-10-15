'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Shield, Phone, Heart, AlertTriangle, Home, User, QrCode } from 'lucide-react';
import { pulseraApi } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

interface PulseraData {
  id: string;
  name: string;
  nombre: string;
  medicalInfo: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  medicamentos: string;
  alergias: string;
  tipoSangre: string;
  status?: string;
  customId?: string;
}

export default function ScanPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const qrCode = params.qrCode as string;
  const [pulsera, setPulsera] = useState<PulseraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    const fetchPulseraData = async () => {
      try {
        const response = await pulseraApi.scanQr(qrCode);
        setPulsera(response.data);

        // Detectar si es un QR generado por admin pero no reclamado
        if (response.data?.status === 'GENERATED') {
          setIsGenerated(true);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Pulsera no encontrada';

        // Si el error indica que el QR existe pero no está asignado, es GENERATED
        if (errorMsg.includes('no tiene información') || errorMsg.includes('no está asignada')) {
          setIsGenerated(true);
          setPulsera(error.response?.data || {
            id: qrCode,
            status: 'GENERATED',
            name: 'Pulsera sin asignar',
            customId: error.response?.data?.customId
          } as PulseraData);
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      fetchPulseraData();
    }
  }, [qrCode]);

  const handleClaimQr = () => {
    // Si no hay usuario, redirigir a login con returnUrl
    if (!user) {
      const currentUrl = `/scan/${qrCode}`;
      router.push(`/login?returnUrl=${encodeURIComponent(currentUrl)}`);
      return;
    }

    // Si hay usuario, redirigir al dashboard donde puede reclamar el QR
    router.push(`/dashboard?claimQr=${qrCode}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información de la pulsera...</p>
        </div>
      </div>
    );
  }

  // UI especial para QRs generados pero no reclamados
  if (isGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pulsera Disponible
            </h2>
            {pulsera?.customId && (
              <p className="text-sm text-gray-500 mb-4">
                Código: {pulsera.customId}
              </p>
            )}
            <p className="text-gray-600 mb-4">
              Esta pulsera está lista para ser reclamada. {!user ? 'Inicia sesión' : 'Ve a tu dashboard'} para activarla y asignarla a un usuario.
            </p>
            {!user && (
              <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> Debes iniciar sesión con una cuenta de contratante para reclamar esta pulsera. Si eres administrador, por favor usa una cuenta de contratante.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={handleClaimQr}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              >
                <Shield className="w-5 h-5" />
                {!user ? 'Iniciar sesión para reclamar' : 'Ir a mi dashboard'}
              </button>

              <Link
                href="/"
                className="w-full inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Home className="w-4 h-4" />
                Volver al inicio
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">
                ¿Aún no tienes una cuenta?
              </p>
              <Link
                href="/register"
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm"
              >
                Crear cuenta gratis
              </Link>
            </div>
          </div>

          {/* Info adicional */}
          <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              ¿Qué es Bluko Life?
            </h3>
            <p className="text-sm text-gray-600">
              Pulseras inteligentes con QR que almacenan información médica de emergencia accesible 24/7.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Pulsera no encontrada
            </h2>
            <p className="text-gray-600 mb-6">
              {error}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!pulsera) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Información de Pulsera</h1>
                <p className="text-sm text-gray-600">Datos de contacto y emergencia</p>
              </div>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-4 h-4" />
              Inicio
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{pulsera.name || pulsera.nombre}</h2>
                <p className="text-blue-100">Información de contacto disponible</p>
              </div>
            </div>
          </div>

          {/* Information Cards */}
          <div className="p-6 space-y-6">
            {/* Contacto de Emergencia */}
            {(pulsera.contactoEmergencia || pulsera.telefonoEmergencia) && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      Contacto de Emergencia
                    </h3>
                    {pulsera.contactoEmergencia && (
                      <p className="text-green-800 text-base leading-relaxed mb-2">
                        <strong>Nombre:</strong> {pulsera.contactoEmergencia}
                      </p>
                    )}
                    {pulsera.telefonoEmergencia && (
                      <p className="text-green-800 text-base leading-relaxed">
                        <strong>Teléfono:</strong> {pulsera.telefonoEmergencia}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Información Médica */}
            {(pulsera.medicalInfo || pulsera.condicionesMedicas || pulsera.medicamentos || pulsera.alergias || pulsera.tipoSangre) && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Heart className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-900 mb-2">
                      Información Médica Importante
                    </h3>
                    
                    {pulsera.tipoSangre && (
                      <p className="text-red-800 text-base leading-relaxed mb-2">
                        <strong>Tipo de Sangre:</strong> {pulsera.tipoSangre}
                      </p>
                    )}
                    
                    {pulsera.condicionesMedicas && (
                      <p className="text-red-800 text-base leading-relaxed mb-2">
                        <strong>Condiciones Médicas:</strong> {pulsera.condicionesMedicas}
                      </p>
                    )}
                    
                    {pulsera.medicamentos && (
                      <p className="text-red-800 text-base leading-relaxed mb-2">
                        <strong>Medicamentos:</strong> {pulsera.medicamentos}
                      </p>
                    )}
                    
                    {pulsera.alergias && (
                      <p className="text-red-800 text-base leading-relaxed mb-2">
                        <strong>Alergias:</strong> {pulsera.alergias}
                      </p>
                    )}
                    
                    {pulsera.medicalInfo && (
                      <p className="text-red-800 text-base leading-relaxed">
                        {pulsera.medicalInfo}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}


            {/* Fallback si no hay información */}
            {!pulsera.medicalInfo &&
             !pulsera.contactoEmergencia &&
             !pulsera.telefonoEmergencia &&
             !pulsera.condicionesMedicas &&
             !pulsera.medicamentos &&
             !pulsera.alergias &&
             !pulsera.tipoSangre && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Pulsera Registrada
                </h3>
                <p className="text-gray-600">
                  Esta pulsera está registrada en el sistema, pero no tiene información adicional configurada.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Esta información es privada y está protegida
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                Bluko Life
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">
            ¿Quieres crear tu propia pulsera inteligente?
          </h3>
          <p className="text-blue-100 mb-4">
            Protege a tus seres queridos con nuestra tecnología QR avanzada
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Crear mi cuenta
            <Shield className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}