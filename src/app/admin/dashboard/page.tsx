'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Shield,
  Users,
  Heart,
  Activity,
  LogOut,
  Trash2,
  Ban,
  Eye,
  X,
  User,
  Mail,
  Calendar,
  CreditCard
} from 'lucide-react';
import { adminApi } from '@/services/api';

interface Stats {
  totalContratantes: number;
  totalPortadores: number;
  totalPulseras: number;
  pulserasActivas: number;
  contratantesActivos: number;
}

interface Contratante {
  id: number;
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  rut: string;
  availablePulseras: number;
  totalPurchasedPulseras: number;
  subscriptionActive: boolean;
  subscriptionExpiresAt?: string;
  verified: boolean;
  createdAt: string;
}

interface Portador {
  id: number;
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  rut: string;
  verified: boolean;
  createdAt: string;
}

interface ContratanteDetail {
  contratante: Contratante;
  portadores: Portador[];
  pulseras: any[];
  totalPortadores: number;
  totalPulseras: number;
  pulserasActivas: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contratantes, setContratantes] = useState<Contratante[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContratante, setSelectedContratante] = useState<ContratanteDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = (payload.groups && payload.groups[0]) || '';

      if (role !== 'admin') {
        toast.error('Acceso denegado');
        router.push('/admin/login');
      }
    } catch (error) {
      toast.error('Sesión inválida');
      router.push('/admin/login');
    }
  };

  const loadData = async () => {
    try {
      const [statsResponse, contratantesResponse] = await Promise.all([
        adminApi.getStats(),
        adminApi.getAllContratantes()
      ]);

      setStats(statsResponse.data);
      setContratantes(contratantesResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Sesión cerrada');
    router.push('/admin/login');
  };

  const handleViewContratante = async (id: number) => {
    try {
      const response = await adminApi.getContratanteDetail(id);

      let data = response.data;
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }

      setSelectedContratante(data);
      setShowDetailModal(true);
    } catch (error: any) {
      console.error('Error loading contratante detail:', error);
      toast.error('Error al cargar detalles');
    }
  };

  const handleDeleteContratante = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este contratante? Esta acción eliminará también todos sus portadores y pulseras.')) {
      return;
    }

    try {
      await adminApi.deleteContratante(id);
      toast.success('Contratante eliminado exitosamente');
      loadData();
      if (selectedContratante?.contratante.id === id) {
        setShowDetailModal(false);
      }
    } catch (error: any) {
      console.error('Error deleting contratante:', error);
      toast.error('Error al eliminar contratante');
    }
  };

  const handleDeactivateSubscription = async (id: number) => {
    if (!confirm('¿Estás seguro de desactivar la suscripción de este contratante?')) {
      return;
    }

    try {
      await adminApi.deactivateContratanteSubscription(id);
      toast.success('Suscripción desactivada exitosamente');
      loadData();
      if (selectedContratante?.contratante.id === id) {
        const response = await adminApi.getContratanteDetail(id);
        let data = response.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        setSelectedContratante(data);
      }
    } catch (error: any) {
      console.error('Error deactivating subscription:', error);
      toast.error('Error al desactivar suscripción');
    }
  };

  const handleDeletePortador = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este portador?')) {
      return;
    }

    try {
      await adminApi.deletePortador(id);
      toast.success('Portador eliminado exitosamente');
      if (selectedContratante) {
        const response = await adminApi.getContratanteDetail(selectedContratante.contratante.id);
        let data = response.data;
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
        setSelectedContratante(data);
      }
    } catch (error: any) {
      console.error('Error deleting portador:', error);
      toast.error('Error al eliminar portador');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-7 h-7 text-purple-800" />
              <h1 className="text-xl font-semibold text-gray-900">Panel de Administración</h1>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contratantes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalContratantes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Portadores</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPortadores}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pulseras</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPulseras}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pulseras Activas</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pulserasActivas}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Suscripciones</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.contratantesActivos}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contratantes List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Contratantes</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contratante
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    RUT
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suscripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pulseras
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contratantes.map((contratante) => (
                  <tr key={contratante.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {contratante.firstName} {contratante.paternalSurname}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {contratante.id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contratante.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{contratante.rut}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        contratante.subscriptionActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {contratante.subscriptionActive ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {contratante.totalPurchasedPulseras} total
                      </div>
                      <div className="text-sm text-gray-500">
                        {contratante.availablePulseras} disponibles
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewContratante(contratante.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          title="Ver detalles"
                        >
                          <Eye className="w-3 h-3" />
                          Ver
                        </button>
                        {contratante.subscriptionActive && (
                          <button
                            onClick={() => handleDeactivateSubscription(contratante.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700"
                            title="Desactivar suscripción"
                          >
                            <Ban className="w-3 h-3" />
                            Desactivar
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContratante(contratante.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {contratantes.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No hay contratantes registrados
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {showDetailModal && selectedContratante && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Detalles de {selectedContratante.contratante.firstName} {selectedContratante.contratante.paternalSurname}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Contratante Info */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Contratante</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedContratante.contratante.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{selectedContratante.contratante.rut}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Registrado: {formatDate(selectedContratante.contratante.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedContratante.contratante.subscriptionActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      Suscripción {selectedContratante.contratante.subscriptionActive ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Portadores</p>
                  <p className="text-2xl font-bold text-blue-900">{selectedContratante.totalPortadores}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <p className="text-sm text-purple-600">Pulseras</p>
                  <p className="text-2xl font-bold text-purple-900">{selectedContratante.totalPulseras}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-sm text-green-600">Pulseras Activas</p>
                  <p className="text-2xl font-bold text-green-900">{selectedContratante.pulserasActivas}</p>
                </div>
              </div>

              {/* Portadores */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">
                  Portadores ({selectedContratante.portadores.length})
                </h4>
                {selectedContratante.portadores.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Nombre</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">RUT</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedContratante.portadores.map((portador) => (
                          <tr key={portador.id}>
                            <td className="px-4 py-3 text-black">
                              {portador.firstName} {portador.paternalSurname}
                            </td>
                            <td className="px-4 py-3 text-black">{portador.email}</td>
                            <td className="px-4 py-3 text-black">{portador.rut}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleDeletePortador(portador.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                <Trash2 className="w-3 h-3" />
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No hay portadores registrados</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
