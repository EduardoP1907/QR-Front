'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Shield, Phone, Heart, AlertTriangle, Home, User } from 'lucide-react';
import { pulseraApi } from '../../../services/api';

interface PulseraData {
  id: string;
  name: string;
  nombre: string;
  contactInfo: string;
  medicalInfo: string;
  emergencyContact: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  medicamentos: string;
  alergias: string;
  tipoSangre: string;
}

export default function ScanPage() {
  const params = useParams();
  const qrCode = params.qrCode as string;
  const [pulsera, setPulsera] = useState<PulseraData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPulseraData = async () => {
      try {
        const response = await pulseraApi.scanQr(qrCode);
        setPulsera(response.data);
      } catch (error: any) {
        setError(error.response?.data?.error || 'Pulsera no encontrada');
      } finally {
        setLoading(false);
      }
    };

    if (qrCode) {
      fetchPulseraData();
    }
  }, [qrCode]);

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
            {(pulsera.emergencyContact || pulsera.contactoEmergencia || pulsera.telefonoEmergencia) && (
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
                    {pulsera.emergencyContact && (
                      <p className="text-green-800 text-base leading-relaxed">
                        {pulsera.emergencyContact}
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

            {/* Información General de Contacto */}
            {pulsera.contactInfo && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2">
                      Información de Contacto
                    </h3>
                    <p className="text-blue-800 text-base leading-relaxed">
                      {pulsera.contactInfo}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Fallback si no hay información */}
            {!pulsera.contactInfo && 
             !pulsera.medicalInfo && 
             !pulsera.emergencyContact && 
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