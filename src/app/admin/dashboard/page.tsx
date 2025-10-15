'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Shield,
  LogOut,
  QrCode,
  Download,
  X,
  Check,
  TrendingUp,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  User,
  Users,
  Mail,
  CreditCard
} from 'lucide-react';
import { adminApi } from '@/services/api';

interface Stats {
  totalContratantes: number;
  totalPortadores: number;
  totalPulseras: number;
  pulserasActivas: number;
  contratantesActivos: number;
  generados: number;
  enFabricacion: number;
  fabricados: number;
  enStock: number;
  asignados: number;
  porDespachar: number;
  despachados: number;
  suscritos: number;
  ultimoGenerado: string;
}

interface Pulsera {
  id: number;
  customId: string;
  qrCode: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  active: boolean;
  subscriptionActive: boolean;
  portador?: {
    id: number;
    firstName: string;
    paternalSurname: string;
    email: string;
  };
  contratante?: {
    id: number;
    firstName: string;
    paternalSurname: string;
    email: string;
  };
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'generar' | 'fabricar' | 'administrar'>('dashboard');

  const [generateQuantity, setGenerateQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [unassignedPulseras, setUnassignedPulseras] = useState<Pulsera[]>([]);
  const [loadingPulseras, setLoadingPulseras] = useState(false);
  const [selectedForFabrication, setSelectedForFabrication] = useState<Set<number>>(new Set());

  const [allContratantes, setAllContratantes] = useState<any[]>([]);
  const [loadingContratantes, setLoadingContratantes] = useState(false);
  const [selectedForDispatch, setSelectedForDispatch] = useState<Set<number>>(new Set());
  const [expandedContratante, setExpandedContratante] = useState<number | null>(null);
  const [contratanteDetails, setContratanteDetails] = useState<Map<number, any>>(new Map());

  const [selectedQrImage, setSelectedQrImage] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCustomId, setQrCustomId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'fabricar') {
      loadUnassignedPulseras();
    } else if (activeTab === 'administrar') {
      loadAllContratantes();
    }
  }, [activeTab]);

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
      const statsResponse = await adminApi.getStats();
      setStats(statsResponse.data);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadUnassignedPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getUnassignedPulseras();
      setUnassignedPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading unassigned pulseras:', error);
      toast.error('Error al cargar QRs no asignados');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadAllContratantes = async () => {
    setLoadingContratantes(true);
    try {
      const response = await adminApi.getAllContratantes();
      setAllContratantes(response.data || []);
    } catch (error: any) {
      console.error('Error loading contratantes:', error);
      toast.error('Error al cargar contratantes');
    } finally {
      setLoadingContratantes(false);
    }
  };

  const loadContratanteDetail = async (id: number) => {
    try {
      const response = await adminApi.getContratanteDetail(id);
      const newDetails = new Map(contratanteDetails);
      newDetails.set(id, response.data);
      setContratanteDetails(newDetails);
    } catch (error: any) {
      console.error('Error loading contratante detail:', error);
      toast.error('Error al cargar detalles del contratante');
    }
  };

  const handleToggleExpand = async (id: number) => {
    if (expandedContratante === id) {
      setExpandedContratante(null);
    } else {
      setExpandedContratante(id);
      if (!contratanteDetails.has(id)) {
        await loadContratanteDetail(id);
      }
    }
  };

  const handleGenerateQrs = async () => {
    if (generateQuantity < 1 || generateQuantity > 1000) {
      toast.error('La cantidad debe estar entre 1 y 1000');
      return;
    }

    setIsGenerating(true);
    try {
      await adminApi.generatePulserasBatch(generateQuantity);
      toast.success(`${generateQuantity} QRs generados exitosamente`);
      setGenerateQuantity(1);
      loadData();
    } catch (error: any) {
      console.error('Error generating QRs:', error);
      toast.error('Error al generar QRs');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleViewQrImage = async (customId: string) => {
    try {
      const response = await adminApi.getPulseraQrImageByCustomId(customId);
      setSelectedQrImage(response.data.qrImage);
      setQrCustomId(customId);
      setShowQrModal(true);
    } catch (error: any) {
      console.error('Error loading QR image:', error);
      toast.error('Error al cargar imagen QR');
    }
  };

  const handleDownloadQrImage = () => {
    if (!selectedQrImage) return;

    const link = document.createElement('a');
    link.href = selectedQrImage;
    link.download = `QR-${qrCustomId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Imagen QR descargada');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.success('Sesión cerrada');
    router.push('/admin/login');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const toggleSelectForFabrication = (id: number) => {
    const newSet = new Set(selectedForFabrication);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForFabrication(newSet);
  };

  const toggleSelectAllForFabrication = () => {
    if (selectedForFabrication.size === unassignedPulseras.length) {
      setSelectedForFabrication(new Set());
    } else {
      setSelectedForFabrication(new Set(unassignedPulseras.map(p => p.id)));
    }
  };

  const toggleSelectForDispatch = (id: number) => {
    const newSet = new Set(selectedForDispatch);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForDispatch(newSet);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'GENERATED': 'Generado',
      'IN_FABRICATION': 'En Fabricación',
      'FABRICATED': 'Fabricado',
      'IN_STOCK': 'En Stock',
      'ASSIGNED': 'Asignado',
      'PENDING_DISPATCH': 'Por Despachar',
      'DISPATCHED': 'Despachado',
      'CLAIMED': 'Reclamado',
      'ACTIVE': 'Activo',
      'INACTIVE': 'Inactivo'
    };
    return labels[status] || status;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: any }> = {
      'GENERATED': { bg: 'bg-blue-100', text: 'text-blue-800', icon: Package },
      'IN_FABRICATION': { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: TrendingUp },
      'FABRICATED': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'IN_STOCK': { bg: 'bg-purple-100', text: 'text-purple-800', icon: Package },
      'ASSIGNED': { bg: 'bg-indigo-100', text: 'text-indigo-800', icon: Check },
      'PENDING_DISPATCH': { bg: 'bg-orange-100', text: 'text-orange-800', icon: AlertCircle },
      'DISPATCHED': { bg: 'bg-teal-100', text: 'text-teal-800', icon: Truck },
      'CLAIMED': { bg: 'bg-cyan-100', text: 'text-cyan-800', icon: CheckCircle },
      'ACTIVE': { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      'INACTIVE': { bg: 'bg-gray-100', text: 'text-gray-800', icon: X }
    };

    const badge = badges[status] || { bg: 'bg-gray-100', text: 'text-gray-800', icon: AlertCircle };
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {getStatusLabel(status)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#7030A0] mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#7030A0] animate-pulse" />
            </div>
          </div>
          <p className="text-gray-600 font-medium">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-xl shadow-lg">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7030A0] to-[#5d2785] bg-clip-text text-transparent">
                  Administración Plataforma
                </h1>
                <p className="text-sm text-gray-500 font-medium">Bluko Life</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Panel Principal</h2>
              <p className="text-gray-600">Vista general del sistema Bluko Life</p>
            </div>

            {/* Stats Cards Grid - 8 cards morados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Generados */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Generados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.generados.toLocaleString()}</p>
              </div>

              {/* Card 2: Fabricados */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Fabricados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.fabricados.toLocaleString()}</p>
              </div>

              {/* Card 3: En Fabricación */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life En Fabricación</p>
                <p className="text-4xl font-bold tracking-tight">{stats.enFabricacion.toLocaleString()}</p>
              </div>

              {/* Card 4: En Stock */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <Check className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life En Stock</p>
                <p className="text-4xl font-bold tracking-tight">{stats.enStock.toLocaleString()}</p>
              </div>

              {/* Card 5: Asignados */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Check className="w-6 h-6" />
                  </div>
                  <CheckCircle className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Asignados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.asignados.toLocaleString()}</p>
              </div>

              {/* Card 6: Suscritos */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Suscritos</p>
                <p className="text-4xl font-bold tracking-tight">{stats.suscritos.toLocaleString()}</p>
              </div>

              {/* Card 7: Por Despachar */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Por Despachar</p>
                <p className="text-4xl font-bold tracking-tight">{stats.porDespachar.toLocaleString()}</p>
              </div>

              {/* Card 8: Despachados */}
              <div className="group bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Truck className="w-6 h-6" />
                  </div>
                  <CheckCircle className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Despachados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.despachados.toLocaleString()}</p>
              </div>
            </div>

            {/* Menu Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
              <button
                onClick={() => setActiveTab('generar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#7030A0]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7030A0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#7030A0]/10 rounded-xl group-hover:bg-[#7030A0]/20 transition-colors">
                    <Package className="w-6 h-6 text-[#7030A0]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Generar Bluko Life</p>
                    <p className="text-sm text-gray-500">Crear nuevos códigos QR</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('fabricar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#7030A0]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7030A0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#7030A0]/10 rounded-xl group-hover:bg-[#7030A0]/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[#7030A0]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Fabricar Bluko Life</p>
                    <p className="text-sm text-gray-500">Preparar para fabricación</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('administrar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#7030A0]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#7030A0]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#7030A0]/10 rounded-xl group-hover:bg-[#7030A0]/20 transition-colors">
                    <Shield className="w-6 h-6 text-[#7030A0]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Administrar Bluko Life</p>
                    <p className="text-sm text-gray-500">Gestionar inventario completo</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Generar Bluko Life Tab */}
        {activeTab === 'generar' && stats && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 text-[#7030A0] hover:text-[#5d2785] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Generar Bluko Life</h2>
              <p className="text-gray-600">Crear códigos QR para fabricación física</p>
            </div>

            {/* Último Generado Card */}
            <div className="inline-block">
              <div className="bg-gradient-to-br from-[#7030A0] to-[#5d2785] rounded-2xl p-6 text-white shadow-xl">
                <p className="text-sm font-medium opacity-90 mb-2">Último código generado</p>
                <p className="text-3xl font-bold tracking-tight">{stats.ultimoGenerado || 'N/A'}</p>
              </div>
            </div>

            {/* Generation Form */}
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Cantidad a generar
                  </label>
                  <p className="text-sm text-gray-500 mb-4">Ingrese la cantidad de códigos QR a crear (máximo 1000)</p>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={generateQuantity}
                    onChange={(e) => setGenerateQuantity(parseInt(e.target.value) || 1)}
                    placeholder="Ingrese cantidad"
                    className="w-full max-w-md px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#7030A0] focus:border-transparent text-black text-lg font-medium transition-all"
                  />
                </div>

                <button
                  onClick={handleGenerateQrs}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00FF00] to-[#00DD00] text-black font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent"></div>
                      Generando...
                    </>
                  ) : (
                    <>
                      <Package className="w-5 h-5" />
                      Generar Códigos QR
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fabricar Bluko Life Tab */}
        {activeTab === 'fabricar' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 text-[#7030A0] hover:text-[#5d2785] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Fabricar Bluko Life Generados</h2>
              <p className="text-gray-600">Seleccionar códigos QR para fabricación física</p>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7030A0]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-center">
                          <input
                            type="checkbox"
                            checked={selectedForFabrication.size === unassignedPulseras.length && unassignedPulseras.length > 0}
                            onChange={toggleSelectAllForFabrication}
                            className="w-5 h-5 rounded border-gray-300 text-[#7030A0] focus:ring-[#7030A0] cursor-pointer"
                          />
                          <div className="text-sm font-bold text-gray-900 mt-2">Todos</div>
                        </th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Código QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unassignedPulseras.map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedForFabrication.has(pulsera.id)}
                              onChange={() => toggleSelectForFabrication(pulsera.id)}
                              className="w-5 h-5 rounded border-gray-300 text-[#7030A0] focus:ring-[#7030A0] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewQrImage(pulsera.customId)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#7030A0] hover:bg-[#7030A0]/10 rounded-lg font-semibold transition-colors"
                            >
                              <QrCode className="w-5 h-5" />
                              Ver Código QR
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {unassignedPulseras.length === 0 && (
                    <div className="text-center py-16">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life generados disponibles para fabricación</p>
                      <p className="text-gray-400 text-sm mt-2">Genera nuevos códigos QR desde el menú principal</p>
                    </div>
                  )}
                </div>

                {selectedForFabrication.size > 0 && (
                  <div className="p-6 border-t-2 border-gray-100 bg-gray-50">
                    <button
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00FF00] to-[#00DD00] text-black font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      Descarga para Fabricar ({selectedForFabrication.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Administrar Bluko Life Tab */}
        {activeTab === 'administrar' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => setActiveTab('dashboard')}
              className="inline-flex items-center gap-2 text-[#7030A0] hover:text-[#5d2785] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Administrar Bluko Life</h2>
              <p className="text-gray-600">Vista completa del inventario y estado de pulseras</p>
            </div>

            {loadingContratantes ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#7030A0]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-4 py-4 text-left w-12">
                          <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#7030A0] focus:ring-[#7030A0] cursor-pointer" />
                        </th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Contratante</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">RUT</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Pulseras</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Suscripción</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allContratantes.map((contratante) => (
                        <React.Fragment key={contratante.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-4">
                              <input
                                type="checkbox"
                                checked={selectedForDispatch.has(contratante.id)}
                                onChange={() => toggleSelectForDispatch(contratante.id)}
                                className="w-4 h-4 rounded border-gray-300 text-[#7030A0] focus:ring-[#7030A0] cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleExpand(contratante.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                >
                                  {expandedContratante === contratante.id ? (
                                    <ChevronDown className="w-5 h-5 text-gray-600" />
                                  ) : (
                                    <ChevronRight className="w-5 h-5 text-gray-600" />
                                  )}
                                </button>
                                <div>
                                  <p className="text-black font-bold">{contratante.firstName} {contratante.paternalSurname}</p>
                                  <p className="text-xs text-gray-500">ID: {contratante.id}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{contratante.email}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <CreditCard className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-900">{contratante.rut}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-gray-900 font-semibold">{contratante.totalPurchasedPulseras} total</p>
                                <p className="text-gray-500">{contratante.availablePulseras} disponibles</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {contratante.subscriptionActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  Activa
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                  <X className="w-3.5 h-3.5" />
                                  Inactiva
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleExpand(contratante.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-[#7030A0] text-white rounded-lg hover:bg-[#5d2785] font-semibold transition-colors"
                              >
                                <Users className="w-4 h-4" />
                                Ver Portadores
                              </button>
                            </td>
                          </tr>

                          {expandedContratante === contratante.id && contratanteDetails.has(contratante.id) && (
                            <tr>
                              <td colSpan={7} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-4">
                                  <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5" />
                                    Portadores Asignados ({contratanteDetails.get(contratante.id).portadores?.length || 0})
                                  </h4>

                                  {contratanteDetails.get(contratante.id).portadores?.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                      {contratanteDetails.get(contratante.id).portadores.map((portador: any) => (
                                        <div key={portador.id} className="bg-white rounded-xl p-4 shadow border border-gray-200">
                                          <div className="flex items-start gap-3">
                                            <div className="p-2 bg-[#7030A0]/10 rounded-lg">
                                              <User className="w-5 h-5 text-[#7030A0]" />
                                            </div>
                                            <div className="flex-1">
                                              <p className="font-bold text-gray-900">{portador.firstName} {portador.paternalSurname}</p>
                                              <p className="text-sm text-gray-500">{portador.email}</p>
                                              <p className="text-xs text-gray-400 mt-1">RUT: {portador.rut}</p>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-center py-8 text-gray-500">
                                      <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                      <p>No hay portadores asignados</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>

                  {allContratantes.length === 0 && (
                    <div className="text-center py-16">
                      <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay contratantes registrados en el sistema</p>
                    </div>
                  )}
                </div>

                {selectedForDispatch.size > 0 && (
                  <div className="p-6 border-t-2 border-gray-100 bg-gray-50">
                    <p className="font-bold text-gray-900 mb-4 text-lg">Acciones</p>
                    <button
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#00FF00] to-[#00DD00] text-black font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Truck className="w-5 h-5" />
                      Despachar ({selectedForDispatch.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* QR Image Modal */}
      {showQrModal && selectedQrImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Código QR</h3>
                <p className="text-sm text-gray-500 mt-1">{qrCustomId}</p>
              </div>
              <button
                onClick={() => {
                  setShowQrModal(false);
                  setSelectedQrImage(null);
                  setQrCustomId('');
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-white border-4 border-gray-100 rounded-2xl shadow-lg">
                  <img
                    src={selectedQrImage}
                    alt={`QR Code ${qrCustomId}`}
                    className="w-64 h-64 rounded-lg"
                  />
                </div>
              </div>

              <button
                onClick={handleDownloadQrImage}
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#7030A0] to-[#5d2785] text-white rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
              >
                <Download className="w-5 h-5" />
                Descargar Imagen QR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
