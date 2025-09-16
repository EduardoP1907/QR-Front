'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Edit3, User, Mail, Phone, AlertTriangle, Pill, Droplet, LogOut, QrCode } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { portadorApi, newPulseraApi } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

interface Pulsera {
  id: number;
  name: string;
  description?: string;
  contactInfo?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  qrCode?: string;
  active: boolean;
}

interface EditMedicalFormData {
  medicalInfo: string;
}

export default function PortadorDashboard() {
  const [pulseras, setPulseras] = useState<Pulsera[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPulsera, setEditingPulsera] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditMedicalFormData>({ medicalInfo: '' });
  const [showQrModal, setShowQrModal] = useState<{ show: boolean; pulsera?: Pulsera; qrImage?: string }>({ show: false });
  const router = useRouter();
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchPulseras();
  }, []);

  const fetchPulseras = async () => {
    try {
      const response = await portadorApi.getMyPulseras();
      setPulseras(response.data);
    } catch (error: any) {
      console.error('Error fetching pulseras:', error);
      if (error.response?.status === 401) {
        toast.error('Sesión expirada');
        logout();
        router.push('/portador/login');
      } else {
        toast.error('Error al cargar pulseras');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditMedicalInfo = (pulsera: Pulsera) => {
    setEditingPulsera(pulsera.id);
    setEditFormData({ medicalInfo: pulsera.medicalInfo || '' });
  };

  const handleSaveMedicalInfo = async (pulseraId: number) => {
    try {
      await portadorApi.updateMedicalInfo(pulseraId, editFormData.medicalInfo);
      toast.success('Información médica actualizada');
      setEditingPulsera(null);
      fetchPulseras(); // Refrescar datos
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al actualizar información';
      toast.error(errorMessage);
    }
  };

  const handleShowQrCode = async (pulsera: Pulsera) => {
    try {
      const response = await newPulseraApi.generateQr(pulsera.id);
      setShowQrModal({ 
        show: true, 
        pulsera, 
        qrImage: response.data.qrImage 
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Error al generar código QR';
      toast.error(errorMessage);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Portal Usuario</h1>
              <p className="text-sm text-gray-600">
                Bienvenido, {user?.firstName} {user?.paternalSurname}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Mi Información
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre completo</p>
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.paternalSurname} {user?.maternalSurname}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="bg-gray-100 p-2 rounded-lg">
                <Mail className="w-4 h-4 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pulseras */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            Mis Pulseras ({pulseras.length})
          </h2>

          {pulseras.length === 0 ? (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pulseras asignadas</h3>
              <p className="text-gray-600">
                Cuando un contratante te asigne una pulsera, aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {pulseras.map((pulsera) => (
                <div key={pulsera.id} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {pulsera.name}
                      </h3>
                      {pulsera.description && (
                        <p className="text-gray-600 mb-2">{pulsera.description}</p>
                      )}
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        pulsera.active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pulsera.active ? 'Activa' : 'Inactiva'}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleShowQrCode(pulsera)}
                        className="flex items-center space-x-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <QrCode className="w-4 h-4" />
                        <span>Ver QR</span>
                      </button>
                      <button
                        onClick={() => handleEditMedicalInfo(pulsera)}
                        className="flex items-center space-x-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Editar Info Médica</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-start space-x-3">
                      <div className="bg-blue-100 p-2 rounded-lg mt-1">
                        <Phone className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Contacto</p>
                        <p className="text-sm text-gray-600">
                          {pulsera.contactInfo || 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-red-100 p-2 rounded-lg mt-1">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Emergencia</p>
                        <p className="text-sm text-gray-600">
                          {pulsera.emergencyContact || 'No especificado'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-green-100 p-2 rounded-lg mt-1">
                        <Pill className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Info. Médica</p>
                        <p className="text-sm text-gray-600">
                          {pulsera.medicalInfo || 'No especificada'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Edit Medical Info Form */}
                  {editingPulsera === pulsera.id && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Editar Información Médica
                      </h4>
                      <textarea
                        value={editFormData.medicalInfo}
                        onChange={(e) => setEditFormData({ medicalInfo: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        placeholder="Información médica relevante (alergias, medicamentos, condiciones médicas, etc.)"
                      />
                      <div className="flex space-x-3 mt-3">
                        <button
                          onClick={() => handleSaveMedicalInfo(pulsera.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditingPulsera(null)}
                          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      {showQrModal.show && showQrModal.pulsera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Código QR - {showQrModal.pulsera.name}
            </h3>
            
            {showQrModal.qrImage && (
              <div className="text-center mb-4">
                <img 
                  src={showQrModal.qrImage} 
                  alt="Código QR" 
                  className="mx-auto border border-gray-200 rounded-lg"
                />
              </div>
            )}
            
            <p className="text-sm text-gray-600 mb-4">
              Este código QR contiene la información médica de emergencia. 
              Los servicios médicos podrán escanearlo para acceder a tus datos.
            </p>
            
            <button
              onClick={() => setShowQrModal({ show: false })}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}