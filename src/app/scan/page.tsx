'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Shield, Phone, Heart, AlertTriangle, Home, User, QrCode } from 'lucide-react';
import { pulseraApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

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

function ScanPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const qrCode = searchParams.get('code') || '';
  const [pulsera, setPulsera] = useState<PulseraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    if (!qrCode) {
      setError('Código QR no proporcionado');
      setLoading(false);
      return;
    }

    const fetchPulseraData = async () => {
      try {
        const response = await pulseraApi.scanQr(qrCode);
        setPulsera(response.data);

        if (response.data?.status === 'GENERATED') {
          setIsGenerated(true);
        }
      } catch (error: any) {
        const errorMsg = error.response?.data?.error || 'Pulsera no encontrada';

        if (errorMsg.includes('no tiene información') || errorMsg.includes('no está asignada')) {
          setIsGenerated(true);
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPulseraData();
  }, [qrCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (isGenerated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <QrCode className="w-12 h-12 text-amber-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pulsera Disponible para Reclamar
            </h1>

            <p className="text-lg text-gray-600 mb-8">
              Esta pulsera ha sido generada pero aún no ha sido reclamada por un contratante.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="font-semibold text-blue-900 mb-3">¿Eres el dueño de esta pulsera?</h2>
              <p className="text-blue-700 mb-4">
                Si compraste esta pulsera, debes reclamarla desde tu cuenta de contratante para activarla y asignarla.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {user ? (
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    Ir al Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                    >
                      Iniciar Sesión
                    </Link>
                    <Link
                      href="/register"
                      className="inline-flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                    >
                      Registrarse
                    </Link>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-12 h-12 text-red-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Pulsera No Encontrada
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-pink-600 text-white p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Información de Emergencia</h1>
                <p className="text-red-100">Pulsera Médica Inteligente</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Nombre */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {pulsera.nombre || pulsera.name || 'Portador de Pulsera'}
              </h2>
              {pulsera.customId && (
                <p className="text-gray-500">ID: {pulsera.customId}</p>
              )}
            </div>

            {/* Tipo de Sangre */}
            {pulsera.tipoSangre && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center gap-3">
                  <Heart className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-sm text-red-600 font-semibold">TIPO DE SANGRE</p>
                    <p className="text-3xl font-bold text-red-700">{pulsera.tipoSangre}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Contacto de Emergencia */}
            {(pulsera.contactoEmergencia || pulsera.telefonoEmergencia) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <Phone className="w-6 h-6 text-blue-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Contacto de Emergencia</h3>
                    {pulsera.contactoEmergencia && (
                      <p className="text-gray-700 mb-1">{pulsera.contactoEmergencia}</p>
                    )}
                    {pulsera.telefonoEmergencia && (
                      <a
                        href={`tel:${pulsera.telefonoEmergencia}`}
                        className="text-blue-600 font-semibold hover:text-blue-700 text-lg"
                      >
                        {pulsera.telefonoEmergencia}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Condiciones Médicas */}
            {pulsera.condicionesMedicas && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  Condiciones Médicas
                </h3>
                <p className="text-gray-700 bg-orange-50 p-4 rounded-lg border border-orange-200">
                  {pulsera.condicionesMedicas}
                </p>
              </div>
            )}

            {/* Alergias */}
            {pulsera.alergias && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Alergias
                </h3>
                <p className="text-gray-700 bg-red-50 p-4 rounded-lg border border-red-200">
                  {pulsera.alergias}
                </p>
              </div>
            )}

            {/* Medicamentos */}
            {pulsera.medicamentos && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Medicamentos</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {pulsera.medicamentos}
                </p>
              </div>
            )}

            {/* Información Adicional */}
            {pulsera.medicalInfo && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Información Adicional</h3>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {pulsera.medicalInfo}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-6 border-t">
            <p className="text-center text-sm text-gray-600">
              En caso de emergencia, por favor contacte al número indicado arriba
            </p>
          </div>
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
