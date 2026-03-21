'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import {Shield,LogOut,QrCode,Download,X,Check,TrendingUp,Package,Truck,CheckCircle,AlertCircle,ArrowLeft,ChevronDown,ChevronRight,User,Users,Mail,CreditCard,Search,RefreshCw,Pause,Play,Trash2,Eye,Tag,Plus,Edit,Calendar,Percent} from 'lucide-react';
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
  // Fechas de transición de estado
  sentToFabricationAt?: string;
  fabricatedAt?: string;
  inStockAt?: string;
  subscribedAt?: string;
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

interface Pedido {
  id: number;
  contratanteId: number;
  contratanteNombre: string;
  contratanteEmail: string;
  cantidadPulseras: number;
  region: string;
  calle: string;
  tipoVivienda: string;
  numero: string;
  numeroDepto: string | null;
  comuna: string;
  referencia: string | null;
  telefono: string;
  direccionCompleta: string;
  status: string;
  pulserasAsignadasCount: number;
  pulserasAsignadas: any[];
  createdAt: string;
  updatedAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'generar' | 'fabricar' | 'enFabricacion' | 'fabricados' | 'enStock' | 'asignados' | 'suscritos' | 'porDespachar' | 'despachados' | 'administrar' | 'cupones' | 'cuponesPlanes'>('dashboard');

  const [generateQuantity, setGenerateQuantity] = useState<number>(1);
  const [isGenerating, setIsGenerating] = useState(false);

  const [unassignedPulseras, setUnassignedPulseras] = useState<Pulsera[]>([]);
  const [inFabricationPulseras, setInFabricationPulseras] = useState<Pulsera[]>([]);
  const [fabricatedPulseras, setFabricatedPulseras] = useState<Pulsera[]>([]);
  const [inStockPulseras, setInStockPulseras] = useState<Pulsera[]>([]);
  const [asignadosPulseras, setAsignadosPulseras] = useState<Pulsera[]>([]);
  const [suscritosPulseras, setSuscritosPulseras] = useState<Pulsera[]>([]);
  const [porDespacharPedidos, setPorDespacharPedidos] = useState<Pedido[]>([]);
  const [despachadosPedidos, setDespachadosPedidos] = useState<Pedido[]>([]);
  const [loadingPulseras, setLoadingPulseras] = useState(false);
  const [selectedForFabrication, setSelectedForFabrication] = useState<Set<number>>(new Set());
  const [selectedForFabricated, setSelectedForFabricated] = useState<Set<number>>(new Set());
  const [selectedForStock, setSelectedForStock] = useState<Set<number>>(new Set());

  const [allContratantes, setAllContratantes] = useState<any[]>([]);
  const [loadingContratantes, setLoadingContratantes] = useState(false);
  const [selectedForDispatch, setSelectedForDispatch] = useState<Set<number>>(new Set());
  const [selectedPedidosParaDespachar, setSelectedPedidosParaDespachar] = useState<Set<number>>(new Set());
  const [expandedContratante, setExpandedContratante] = useState<number | null>(null);
  const [contratanteDetails, setContratanteDetails] = useState<Map<number, any>>(new Map());

  const [selectedQrImage, setSelectedQrImage] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCustomId, setQrCustomId] = useState<string>('');

  // Estado para buscador
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Estados para cupones
  const [cupones, setCupones] = useState<any[]>([]);
  const [loadingCupones, setLoadingCupones] = useState(false);
  const [showCuponModal, setShowCuponModal] = useState(false);
  const [editingCupon, setEditingCupon] = useState<any | null>(null);
  const [selectedCupones, setSelectedCupones] = useState<number[]>([]);
  const [deletingCupones, setDeletingCupones] = useState(false);
  const [cuponForm, setCuponForm] = useState({
    nombre: '',
    porcentajeDescuento: 10,
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  // Estados para cupones-plan
  const [cuponesPlanes, setCuponesPlanes] = useState<any[]>([]);
  const [loadingCuponesPlanes, setLoadingCuponesPlanes] = useState(false);
  const [showCuponPlanModal, setShowCuponPlanModal] = useState(false);
  const [editingCuponPlan, setEditingCuponPlan] = useState<any | null>(null);
  const [selectedCuponesPlanes, setSelectedCuponesPlanes] = useState<number[]>([]);
  const [deletingCuponesPlanes, setDeletingCuponesPlanes] = useState(false);
  const [cuponPlanForm, setCuponPlanForm] = useState({ nombre: '', porcentajeDescuento: 15 });

  // Función para formatear fecha
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '-';
    }
  };

  // Función para cambiar tab sin afectar el historial del navegador
  const handleTabChange = (newTab: typeof activeTab) => {
    setActiveTab(newTab);
    // Usar replaceState para no agregar al historial
    window.history.replaceState({ tab: newTab }, '', window.location.pathname);
  };

  // Función para refrescar datos del dashboard
  const refreshDashboard = async () => {
    await loadData();
    toast.success('Datos actualizados');
  };

  useEffect(() => {
    checkAuth();
    loadData();

    // Agregar entrada inicial al historial para prevenir navegación hacia atrás
    window.history.pushState({ admin: true, tab: 'dashboard' }, '', window.location.pathname);

    // Manejar el botón "atrás" del navegador
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault();
      // Siempre re-agregar al historial para prevenir navegación hacia atrás
      window.history.pushState({ admin: true, tab: activeTab }, '', window.location.pathname);

      // Si estamos en una pestaña diferente a dashboard, volver al dashboard
      if (activeTab !== 'dashboard') {
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeTab]);

  useEffect(() => {
    const loadTabData = async () => {
      if (activeTab === 'fabricar') {
        await loadUnassignedPulseras();
      } else if (activeTab === 'enFabricacion') {
        await loadInFabricationPulseras();
      } else if (activeTab === 'fabricados') {
        await loadFabricatedPulseras();
      } else if (activeTab === 'enStock') {
        await loadInStockPulseras();
      } else if (activeTab === 'asignados') {
        await loadAsignadosPulseras();
      } else if (activeTab === 'suscritos') {
        await loadSuscritosPulseras();
      } else if (activeTab === 'porDespachar') {
        await loadPorDespacharPulseras();
      } else if (activeTab === 'despachados') {
        await loadDespachadosPulseras();
      } else if (activeTab === 'administrar') {
        await loadAllContratantes();
      } else if (activeTab === 'cupones') {
        await loadCupones();
      } else if (activeTab === 'cuponesPlanes') {
        await loadCuponesPlanes();
      }
    };

    loadTabData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadInFabricationPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPulserasByStatus('IN_FABRICATION');
      setInFabricationPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading in fabrication pulseras:', error);
      toast.error('Error al cargar QRs en fabricación');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadFabricatedPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPulserasByStatus('FABRICATED');
      setFabricatedPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading fabricated pulseras:', error);
      toast.error('Error al cargar QRs fabricados');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadInStockPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPulserasByStatus('IN_STOCK');
      setInStockPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading in stock pulseras:', error);
      toast.error('Error al cargar QRs en stock');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadAsignadosPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPulserasByStatus('ASSIGNED');
      setAsignadosPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading assigned pulseras:', error);
      toast.error('Error al cargar QRs asignados');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadSuscritosPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getSuscripcionesActivas();
      setSuscritosPulseras(response.data.pulseras || []);
    } catch (error: any) {
      console.error('Error loading subscribed pulseras:', error);
      toast.error('Error al cargar QRs suscritos');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadPorDespacharPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPedidosPorDespachar();
      setPorDespacharPedidos(response.data.pedidos || []);
    } catch (error: any) {
      console.error('Error loading pending dispatch pedidos:', error);
      toast.error('Error al cargar pedidos por despachar');
    } finally {
      setLoadingPulseras(false);
    }
  };

  const loadDespachadosPulseras = async () => {
    setLoadingPulseras(true);
    try {
      const response = await adminApi.getPedidosDespachados();
      setDespachadosPedidos(response.data.pedidos || []);
    } catch (error: any) {
      console.error('Error loading dispatched pedidos:', error);
      toast.error('Error al cargar pedidos despachados');
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

  // Funciones para gestión de cupones
  const loadCupones = async () => {
    setLoadingCupones(true);
    try {
      const response = await adminApi.getCupones();
      setCupones(response.data || []);
    } catch (error: any) {
      console.error('Error loading cupones:', error);
      toast.error('Error al cargar cupones');
    } finally {
      setLoadingCupones(false);
    }
  };

  const handleCreateCupon = async () => {
    try {
      if (!cuponForm.nombre.trim()) {
        toast.error('El nombre del cupón es requerido');
        return;
      }
      if (cuponForm.porcentajeDescuento < 1 || cuponForm.porcentajeDescuento > 100) {
        toast.error('El porcentaje debe estar entre 1 y 100');
        return;
      }

      await adminApi.createCupon({
        nombre: cuponForm.nombre.toUpperCase().trim(),
        porcentajeDescuento: cuponForm.porcentajeDescuento,
        fechaInicio: cuponForm.fechaInicio,
        fechaFin: cuponForm.fechaFin
      });

      toast.success('Cupón creado exitosamente');
      setShowCuponModal(false);
      resetCuponForm();
      await loadCupones();
    } catch (error: any) {
      console.error('Error creating cupon:', error);
      const errorMsg = error.response?.data?.error || 'Error al crear el cupón';
      toast.error(errorMsg);
    }
  };

  const handleUpdateCupon = async () => {
    if (!editingCupon) return;

    try {
      if (cuponForm.porcentajeDescuento < 1 || cuponForm.porcentajeDescuento > 100) {
        toast.error('El porcentaje debe estar entre 1 y 100');
        return;
      }

      await adminApi.updateCupon(editingCupon.id, {
        porcentajeDescuento: cuponForm.porcentajeDescuento,
        fechaInicio: cuponForm.fechaInicio,
        fechaFin: cuponForm.fechaFin
      });

      toast.success('Cupón actualizado exitosamente');
      setShowCuponModal(false);
      setEditingCupon(null);
      resetCuponForm();
      await loadCupones();
    } catch (error: any) {
      console.error('Error updating cupon:', error);
      const errorMsg = error.response?.data?.error || 'Error al actualizar el cupón';
      toast.error(errorMsg);
    }
  };

  const handleToggleCuponActivo = async (id: number) => {
    try {
      await adminApi.toggleCuponActivo(id);
      toast.success('Estado del cupón actualizado');
      await loadCupones();
    } catch (error: any) {
      console.error('Error toggling cupon:', error);
      toast.error('Error al cambiar estado del cupón');
    }
  };

  const handleDeleteCupones = async () => {
    if (selectedCupones.length === 0) {
      toast.error('Selecciona al menos un cupón para eliminar');
      return;
    }

    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar ${selectedCupones.length} cupón(es)? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    setDeletingCupones(true);
    try {
      await adminApi.deleteCupones(selectedCupones);
      toast.success(`${selectedCupones.length} cupón(es) eliminado(s) exitosamente`);
      setSelectedCupones([]);
      await loadCupones();
    } catch (error: any) {
      console.error('Error deleting cupones:', error);
      const errorMsg = error.response?.data?.error || 'Error al eliminar cupones';
      toast.error(errorMsg);
    } finally {
      setDeletingCupones(false);
    }
  };

  const toggleCuponSelection = (id: number) => {
    setSelectedCupones(prev =>
      prev.includes(id)
        ? prev.filter(cuponId => cuponId !== id)
        : [...prev, id]
    );
  };

  const toggleAllCupones = () => {
    if (selectedCupones.length === cupones.length) {
      setSelectedCupones([]);
    } else {
      setSelectedCupones(cupones.map(c => c.id));
    }
  };

  const openEditCuponModal = (cupon: any) => {
    setEditingCupon(cupon);
    setCuponForm({
      nombre: cupon.nombre,
      porcentajeDescuento: cupon.porcentajeDescuento,
      fechaInicio: cupon.fechaInicio,
      fechaFin: cupon.fechaFin
    });
    setShowCuponModal(true);
  };

  const resetCuponForm = () => {
    setCuponForm({
      nombre: '',
      porcentajeDescuento: 10,
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  };

  // ── Funciones cupones-plan ──────────────────────────────────────
  const loadCuponesPlanes = async () => {
    setLoadingCuponesPlanes(true);
    try {
      const response = await adminApi.getCuponesPlanes();
      setCuponesPlanes(response.data || []);
    } catch (error: any) {
      toast.error('Error al cargar cupones-plan');
    } finally {
      setLoadingCuponesPlanes(false);
    }
  };

  const handleCreateCuponPlan = async () => {
    if (!cuponPlanForm.nombre.trim()) {
      toast.error('El nombre del cupón es requerido');
      return;
    }
    try {
      await adminApi.createCuponPlan({
        nombre: cuponPlanForm.nombre.trim(),
        porcentajeDescuento: cuponPlanForm.porcentajeDescuento
      });
      toast.success('Cupón-Plan creado exitosamente');
      setShowCuponPlanModal(false);
      setCuponPlanForm({ nombre: '', porcentajeDescuento: 15 });
      await loadCuponesPlanes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al crear el cupón-plan');
    }
  };

  const handleUpdateCuponPlan = async () => {
    if (!editingCuponPlan) return;
    if (!cuponPlanForm.nombre.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }
    try {
      await adminApi.updateCuponPlan(editingCuponPlan.id, { nombre: cuponPlanForm.nombre.trim() });
      toast.success('Nombre actualizado exitosamente');
      setShowCuponPlanModal(false);
      setEditingCuponPlan(null);
      setCuponPlanForm({ nombre: '', porcentajeDescuento: 15 });
      await loadCuponesPlanes();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Error al actualizar el cupón-plan');
    }
  };

  const handleToggleCuponPlanActivo = async (id: number) => {
    try {
      await adminApi.toggleCuponPlanActivo(id);
      toast.success('Estado actualizado');
      await loadCuponesPlanes();
    } catch {
      toast.error('Error al cambiar estado');
    }
  };

  const handleDeleteCuponesPlanes = async () => {
    if (selectedCuponesPlanes.length === 0) return;
    if (!window.confirm(`¿Eliminar ${selectedCuponesPlanes.length} cupón(es)-plan?`)) return;
    setDeletingCuponesPlanes(true);
    try {
      await adminApi.deleteCuponesPlanes(selectedCuponesPlanes);
      toast.success('Eliminados exitosamente');
      setSelectedCuponesPlanes([]);
      await loadCuponesPlanes();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setDeletingCuponesPlanes(false);
    }
  };

  const toggleCuponPlanSelection = (id: number) => {
    setSelectedCuponesPlanes(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleAllCuponesPlanes = () => {
    setSelectedCuponesPlanes(
      selectedCuponesPlanes.length === cuponesPlanes.length
        ? []
        : cuponesPlanes.map(c => c.id)
    );
  };
  // ────────────────────────────────────────────────────────────────

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'VIGENTE':
        return 'bg-green-100 text-green-800';
      case 'VENCIDO':
        return 'bg-red-100 text-red-800';
      case 'INACTIVO':
        return 'bg-gray-100 text-gray-800';
      case 'PENDIENTE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Funciones para gestionar pulseras (Pausar, Activar, Eliminar)
  const handlePausePulsera = async (pulseraId: number, customId: string) => {
    if (!confirm(`¿Estás seguro de pausar la pulsera ${customId}? La suscripción será desactivada.`)) {
      return;
    }
    try {
      await adminApi.pausePulsera(pulseraId);
      toast.success(`Pulsera ${customId} pausada exitosamente`);
      // Recargar los detalles del contratante
      if (expandedContratante) {
        const newDetails = new Map(contratanteDetails);
        newDetails.delete(expandedContratante);
        setContratanteDetails(newDetails);
        await loadContratanteDetail(expandedContratante);
      }
      // Recargar estadísticas
      loadData();
    } catch (error: any) {
      console.error('Error pausando pulsera:', error);
      toast.error('Error al pausar la pulsera');
    }
  };

  const handleActivatePulsera = async (pulseraId: number, customId: string) => {
    if (!confirm(`¿Estás seguro de activar la pulsera ${customId}? Se activará la suscripción por 30 días.`)) {
      return;
    }
    try {
      await adminApi.activatePulsera(pulseraId);
      toast.success(`Pulsera ${customId} activada exitosamente`);
      // Recargar los detalles del contratante
      if (expandedContratante) {
        const newDetails = new Map(contratanteDetails);
        newDetails.delete(expandedContratante);
        setContratanteDetails(newDetails);
        await loadContratanteDetail(expandedContratante);
      }
      // Recargar estadísticas
      loadData();
    } catch (error: any) {
      console.error('Error activando pulsera:', error);
      toast.error('Error al activar la pulsera');
    }
  };

  const handleDeletePulsera = async (pulseraId: number, customId: string) => {
    if (!confirm(`¿Estás seguro de ELIMINAR la pulsera ${customId}? Esta acción no se puede deshacer.`)) {
      return;
    }
    // Doble confirmación para eliminar
    if (!confirm(`CONFIRMACIÓN FINAL: ¿Realmente quieres eliminar ${customId} permanentemente?`)) {
      return;
    }
    try {
      await adminApi.deletePulsera(pulseraId);
      toast.success(`Pulsera ${customId} eliminada exitosamente`);
      // Recargar los detalles del contratante
      if (expandedContratante) {
        const newDetails = new Map(contratanteDetails);
        newDetails.delete(expandedContratante);
        setContratanteDetails(newDetails);
        await loadContratanteDetail(expandedContratante);
      }
      // Recargar estadísticas
      loadData();
    } catch (error: any) {
      console.error('Error eliminando pulsera:', error);
      toast.error('Error al eliminar la pulsera');
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

  // Función para solo descargar QRs sin cambiar estado
  const handleDownloadOnlyQrs = async () => {
    if (selectedForFabrication.size === 0) {
      toast.error('Selecciona al menos un Bluko Life');
      return;
    }

    const selectedPulseras = unassignedPulseras.filter(p => selectedForFabrication.has(p.id));

    try {
      toast.loading(`Descargando ${selectedPulseras.length} imágenes QR...`);

      // Descargar imágenes QR una por una
      for (const pulsera of selectedPulseras) {
        try {
          const response = await adminApi.getPulseraQrImageByCustomId(pulsera.customId);
          const qrImage = response.data.qrImage;

          // Descargar imagen
          const link = document.createElement('a');
          link.href = qrImage;
          link.download = `QR-${pulsera.customId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error descargando QR ${pulsera.customId}:`, error);
        }
      }

      toast.dismiss();
      toast.success(`${selectedPulseras.length} imágenes QR descargadas`);

      // Limpiar selección
      setSelectedForFabrication(new Set());
    } catch (error: any) {
      toast.dismiss();
      console.error('Error descargando QRs:', error);
      toast.error('Error al descargar imágenes QR');
    }
  };

  const handleDownloadAndFabricate = async () => {
    if (selectedForFabrication.size === 0) {
      toast.error('Selecciona al menos un Bluko Life');
      return;
    }

    const selectedPulseras = unassignedPulseras.filter(p => selectedForFabrication.has(p.id));

    try {
      toast.loading(`Descargando ${selectedPulseras.length} imágenes QR...`);

      // Descargar imágenes QR una por una
      for (const pulsera of selectedPulseras) {
        try {
          const response = await adminApi.getPulseraQrImageByCustomId(pulsera.customId);
          const qrImage = response.data.qrImage;

          // Descargar imagen
          const link = document.createElement('a');
          link.href = qrImage;
          link.download = `QR-${pulsera.customId}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Pequeña pausa entre descargas
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error(`Error descargando QR ${pulsera.customId}:`, error);
        }
      }

      // Cambiar estado a IN_FABRICATION
      const pulseraIds = Array.from(selectedForFabrication);
      await adminApi.bulkUpdatePulseraStatus(pulseraIds, 'IN_FABRICATION');

      toast.dismiss();
      toast.success(`${selectedPulseras.length} Bluko Life enviados a fabricación`);

      // Limpiar selección y recargar
      setSelectedForFabrication(new Set());
      await loadUnassignedPulseras();
      await loadData();
    } catch (error: any) {
      toast.dismiss();
      console.error('Error en proceso de fabricación:', error);
      toast.error('Error al procesar Bluko Life para fabricación');
    }
  };

  const toggleSelectForFabricated = (id: number) => {
    const newSet = new Set(selectedForFabricated);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForFabricated(newSet);
  };

  const toggleSelectAllForFabricated = () => {
    if (selectedForFabricated.size === inFabricationPulseras.length) {
      setSelectedForFabricated(new Set());
    } else {
      setSelectedForFabricated(new Set(inFabricationPulseras.map(p => p.id)));
    }
  };

  const handleMarkAsFabricated = async () => {
    if (selectedForFabricated.size === 0) {
      toast.error('Selecciona al menos un Bluko Life');
      return;
    }

    try {
      const pulseraIds = Array.from(selectedForFabricated);
      await adminApi.bulkUpdatePulseraStatus(pulseraIds, 'FABRICATED');

      toast.success(`${selectedForFabricated.size} Bluko Life marcados como fabricados`);

      setSelectedForFabricated(new Set());
      await loadInFabricationPulseras();
      await loadData();
    } catch (error: any) {
      console.error('Error marcando como fabricados:', error);
      toast.error('Error al marcar como fabricados');
    }
  };

  const toggleSelectForStock = (id: number) => {
    const newSet = new Set(selectedForStock);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForStock(newSet);
  };

  const toggleSelectAllForStock = () => {
    if (selectedForStock.size === fabricatedPulseras.length) {
      setSelectedForStock(new Set());
    } else {
      setSelectedForStock(new Set(fabricatedPulseras.map(p => p.id)));
    }
  };

  const handleMoveToStock = async () => {
    if (selectedForStock.size === 0) {
      toast.error('Selecciona al menos un Bluko Life');
      return;
    }

    try {
      const pulseraIds = Array.from(selectedForStock);
      await adminApi.bulkUpdatePulseraStatus(pulseraIds, 'IN_STOCK');

      toast.success(`${selectedForStock.size} Bluko Life movidos a Stock`);

      setSelectedForStock(new Set());
      await loadFabricatedPulseras();
      await loadData();
    } catch (error: any) {
      console.error('Error moviendo a stock:', error);
      toast.error('Error al mover a stock');
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

  const handleMarcarPedidosComoDespachados = async () => {
    if (selectedPedidosParaDespachar.size === 0) {
      toast.error('Selecciona al menos un pedido');
      return;
    }

    try {
      const pedidoIds = Array.from(selectedPedidosParaDespachar);

      for (const pedidoId of pedidoIds) {
        await adminApi.cambiarEstadoPedido(pedidoId, 'DESPACHADO');
      }

      toast.success(`${selectedPedidosParaDespachar.size} pedido(s) marcado(s) como despachado(s)`);
    } catch (error: any) {
      console.error('Error marcando pedidos como despachados:', error);
      toast.success('Pedidos actualizados (refrescando...)');
    } finally {
      setSelectedPedidosParaDespachar(new Set());
      await loadPorDespacharPulseras();
      await loadData();
    }
  };

  const togglePedidoSelection = (id: number) => {
    const newSet = new Set(selectedPedidosParaDespachar);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPedidosParaDespachar(newSet);
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
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#481468] mx-auto mb-4"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/logo-bluko-icon.png"
                alt="Bluko Life"
                width={32}
                height={32}
                className="animate-pulse"
              />
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
              <div className="p-2">
                <Image
                  src="/logo-bluko-icon.png"
                  alt="Bluko Life"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-[#481468] to-[#3d1158] bg-clip-text text-transparent">
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
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Panel Principal</h2>
                <p className="text-gray-600">Vista General de la plataforma Bluko Life</p>
              </div>
              <button
                onClick={refreshDashboard}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#481468] text-white rounded-lg hover:bg-[#3d1158] transition-colors font-semibold"
              >
                <RefreshCw className="w-4 h-4" />
                Actualizar
              </button>
            </div>

            {/* Stats Cards Grid - 8 cards morados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Generados */}
              <button onClick={() => handleTabChange('fabricar')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Generados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.generados.toLocaleString()}</p>
              </button>

              {/* Card 2: En Fabricación */}
              <button onClick={() => handleTabChange('enFabricacion')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life en Fabricación</p>
                <p className="text-4xl font-bold tracking-tight">{stats.enFabricacion.toLocaleString()}</p>
              </button>

              {/* Card 3: Fabricados */}
              <button onClick={() => handleTabChange('fabricados')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Fabricados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.fabricados.toLocaleString()}</p>
              </button>

              {/* Card 4: En Stock */}
              <button onClick={() => handleTabChange('enStock')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <Check className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life en Stock</p>
                <p className="text-4xl font-bold tracking-tight">{stats.enStock.toLocaleString()}</p>
              </button>

              {/* Card 5: Asignados */}
              <button onClick={() => handleTabChange('asignados')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Check className="w-6 h-6" />
                  </div>
                  <CheckCircle className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Asignados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.asignados.toLocaleString()}</p>
              </button>

              {/* Card 6: Suscritos */}
              <button onClick={() => handleTabChange('suscritos')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Suscritos</p>
                <p className="text-4xl font-bold tracking-tight">{stats.suscritos.toLocaleString()}</p>
              </button>

              {/* Card 7: Por Despachar */}
              <button onClick={() => handleTabChange('porDespachar')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life por Despachar</p>
                <p className="text-4xl font-bold tracking-tight">{stats.porDespachar.toLocaleString()}</p>
              </button>

              {/* Card 8: Despachados */}
              <button onClick={() => handleTabChange('despachados')} className="group bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 text-left cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Truck className="w-6 h-6" />
                  </div>
                  <CheckCircle className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm font-medium opacity-90 mb-1">Bluko Life Despachados</p>
                <p className="text-4xl font-bold tracking-tight">{stats.despachados.toLocaleString()}</p>
              </button>
            </div>

            {/* Menu Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
              <button
                onClick={() => handleTabChange('generar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#481468]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#481468]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#481468]/10 rounded-xl group-hover:bg-[#481468]/20 transition-colors">
                    <Package className="w-6 h-6 text-[#481468]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Generar Bluko Life</p>
                    <p className="text-sm text-gray-500">Crear nuevos códigos QR</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('fabricar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#481468]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#481468]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#481468]/10 rounded-xl group-hover:bg-[#481468]/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[#481468]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Fabricar Bluko Life</p>
                    <p className="text-sm text-gray-500">Preparar para fabricación</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('enFabricacion')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#481468]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#481468]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#481468]/10 rounded-xl group-hover:bg-[#481468]/20 transition-colors">
                    <TrendingUp className="w-6 h-6 text-[#481468]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">En Fabricación</p>
                    <p className="text-sm text-gray-500">Marcar como fabricados</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('administrar')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#481468]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#481468]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#481468]/10 rounded-xl group-hover:bg-[#481468]/20 transition-colors">
                    <Shield className="w-6 h-6 text-[#481468]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Administrar Bluko Life</p>
                    <p className="text-sm text-gray-500">Gestionar inventario completo</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('cupones')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#82c341]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#82c341]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#82c341]/10 rounded-xl group-hover:bg-[#82c341]/20 transition-colors">
                    <Tag className="w-6 h-6 text-[#82c341]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Cupones de Descuento</p>
                    <p className="text-sm text-gray-500">Gestionar códigos promocionales</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleTabChange('cuponesPlanes')}
                className="group relative overflow-hidden bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-transparent hover:border-[#82c341]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#82c341]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex items-center gap-4">
                  <div className="p-3 bg-[#82c341]/10 rounded-xl group-hover:bg-[#82c341]/20 transition-colors">
                    <CreditCard className="w-6 h-6 text-[#82c341]" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 text-lg">Cupones-Plan</p>
                    <p className="text-sm text-gray-500">Códigos con nombre editable → planes PAT</p>
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
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
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
              <div className="bg-gradient-to-br from-[#481468] to-[#3d1158] rounded-2xl p-6 text-white shadow-xl">
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
                    className="w-full max-w-md px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black text-lg font-medium transition-all"
                  />
                </div>

                <button
                  onClick={handleGenerateQrs}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#82c341] to-[#6ba832] text-black font-bold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
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
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Fabricar Bluko Life Generados</h2>
                <p className="text-gray-600">Seleccionar códigos QR para fabricación física</p>
              </div>
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o UUID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80 text-black"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
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
                            checked={selectedForFabrication.size === unassignedPulseras.filter(p =>
                              p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length && unassignedPulseras.length > 0}
                            onChange={toggleSelectAllForFabrication}
                            className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                          />
                          <div className="text-sm font-bold text-gray-900 mt-2">Todos</div>
                        </th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Código QR (UUID)</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Generado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unassignedPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedForFabrication.has(pulsera.id)}
                              onChange={() => toggleSelectForFabrication(pulsera.id)}
                              className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 inline-block">
                              <span className="text-gray-700 font-mono text-sm">{pulsera.qrCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.createdAt)}</span>
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
                  <div className="p-6 border-t-2 border-gray-100 bg-gray-50 flex flex-wrap gap-4">
                    <button
                      onClick={handleDownloadOnlyQrs}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-white border-2 border-[#481468] text-[#481468] font-bold rounded-xl hover:bg-[#481468]/5 transition-all duration-200"
                    >
                      <Download className="w-5 h-5" />
                      Solo Descargar ({selectedForFabrication.size})
                    </button>
                    <button
                      onClick={handleDownloadAndFabricate}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#82c341] to-[#6ba832] text-black font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Download className="w-5 h-5" />
                      Descargar y Enviar a Fabricación ({selectedForFabrication.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* En Fabricación Tab */}
        {activeTab === 'enFabricacion' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bluko Life en Fabricación</h2>
                <p className="text-gray-600">Marcar como fabricados los que llegaron físicamente</p>
              </div>
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o UUID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80 text-black"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
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
                            checked={selectedForFabricated.size === inFabricationPulseras.filter(p =>
                              p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                            ).length && inFabricationPulseras.length > 0}
                            onChange={toggleSelectAllForFabricated}
                            className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                          />
                          <div className="text-sm font-bold text-gray-900 mt-2">Todos</div>
                        </th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Código QR (UUID)</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha de Generación</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inFabricationPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedForFabricated.has(pulsera.id)}
                              onChange={() => toggleSelectForFabricated(pulsera.id)}
                              className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 inline-block">
                              <span className="text-gray-700 font-mono text-sm">{pulsera.qrCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pulsera.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {inFabricationPulseras.filter(p =>
                    p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-16">
                      <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life en fabricación</p>
                      <p className="text-gray-400 text-sm mt-2">Los códigos enviados a fabricar aparecerán aquí</p>
                    </div>
                  )}
                </div>

                {selectedForFabricated.size > 0 && (
                  <div className="p-6 border-t-2 border-gray-100 bg-gray-50">
                    <button
                      onClick={handleMarkAsFabricated}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#82c341] to-[#6ba832] text-black font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <CheckCircle className="w-5 h-5" />
                      Enviar a Fabricados ({selectedForFabricated.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Fabricados Tab */}
        {activeTab === 'fabricados' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bluko Life Fabricados</h2>
                <p className="text-gray-600">Verificar QR y mover a Stock</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o código QR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
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
                            checked={selectedForStock.size === fabricatedPulseras.length && fabricatedPulseras.length > 0}
                            onChange={toggleSelectAllForStock}
                            className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                          />
                          <div className="text-sm font-bold text-gray-900 mt-2">Todos</div>
                        </th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Código QR (UUID)</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha enviado a Fabricación</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {fabricatedPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedForStock.has(pulsera.id)}
                              onChange={() => toggleSelectForStock(pulsera.id)}
                              className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 inline-block">
                              <span className="text-gray-700 font-mono text-sm">{pulsera.qrCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.sentToFabricationAt || pulsera.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pulsera.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {fabricatedPulseras.length === 0 && (
                    <div className="text-center py-16">
                      <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life fabricados</p>
                      <p className="text-gray-400 text-sm mt-2">Los códigos fabricados físicamente aparecerán aquí para verificación</p>
                    </div>
                  )}
                </div>

                {selectedForStock.size > 0 && (
                  <div className="p-6 border-t-2 border-gray-100 bg-gray-50">
                    <button
                      onClick={handleMoveToStock}
                      className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#82c341] to-[#6ba832] text-black font-bold rounded-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                    >
                      <Package className="w-5 h-5" />
                      Mover a Stock ({selectedForStock.size})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* En Stock Tab */}
        {activeTab === 'enStock' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bluko Life en Stock</h2>
                <p className="text-gray-600">QRs verificados y listos para asignar</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID o código QR..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Código QR (UUID)</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Ingreso Stock</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Imagen QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {inStockPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 inline-block">
                              <span className="text-gray-700 font-mono text-sm">{pulsera.qrCode}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.inStockAt || pulsera.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pulsera.status)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewQrImage(pulsera.customId)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#481468] hover:bg-[#481468]/10 rounded-lg font-semibold transition-colors"
                            >
                              <QrCode className="w-5 h-5" />
                              Ver Imagen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {inStockPulseras.length === 0 && (
                    <div className="text-center py-16">
                      <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life en stock</p>
                      <p className="text-gray-400 text-sm mt-2">Los QRs verificados aparecerán aquí listos para asignar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Asignados Tab */}
        {activeTab === 'asignados' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bluko Life Asignados</h2>
                <p className="text-gray-600">QRs asignados a portadores</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Portador</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Asignación</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Imagen QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {asignadosPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.portador?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.portador?.paternalSurname?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.portador?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            {pulsera.portador ? (
                              <div>
                                <p className="font-semibold text-gray-900">{pulsera.portador.firstName} {pulsera.portador.paternalSurname}</p>
                                <p className="text-sm text-gray-500">{pulsera.portador.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin portador</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.subscribedAt || pulsera.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pulsera.status)}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleViewQrImage(pulsera.customId)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#481468] hover:bg-[#481468]/10 rounded-lg font-semibold transition-colors"
                            >
                              <QrCode className="w-5 h-5" />
                              Ver Imagen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {asignadosPulseras.length === 0 && (
                    <div className="text-center py-16">
                      <Check className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life asignados</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Suscritos Tab */}
        {activeTab === 'suscritos' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Bluko Life Suscritos</h2>
                <p className="text-gray-600">QRs con suscripción activa</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Portador</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Suscripción</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Suscripción</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Imagen QR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {suscritosPulseras
                        .filter(p =>
                          p.customId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.qrCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.portador?.firstName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.portador?.paternalSurname?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (p.portador?.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((pulsera) => (
                        <tr key={pulsera.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">{pulsera.customId}</span>
                          </td>
                          <td className="px-6 py-4">
                            {pulsera.portador ? (
                              <div>
                                <p className="font-semibold text-gray-900">{pulsera.portador.firstName} {pulsera.portador.paternalSurname}</p>
                                <p className="text-sm text-gray-500">{pulsera.portador.email}</p>
                              </div>
                            ) : (
                              <span className="text-gray-400">Sin portador</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pulsera.subscribedAt || pulsera.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            {pulsera.subscriptionActive ? (
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
                              onClick={() => handleViewQrImage(pulsera.customId)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-[#481468] hover:bg-[#481468]/10 rounded-lg font-semibold transition-colors"
                            >
                              <QrCode className="w-5 h-5" />
                              Ver Imagen
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {suscritosPulseras.length === 0 && (
                    <div className="text-center py-16">
                      <Image
                        src="/logo-bluko-icon.png"
                        alt="Bluko Life"
                        width={64}
                        height={64}
                        className="mx-auto mb-4 opacity-30"
                      />
                      <p className="text-gray-500 font-medium text-lg">No hay Bluko Life suscritos</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Por Despachar Tab */}
        {activeTab === 'porDespachar' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Pedidos por Despachar</h2>
                <p className="text-gray-600">Pedidos pendientes de envío a clientes</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, email, teléfono..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                  />
                </div>
                {selectedPedidosParaDespachar.size > 0 && (
                  <button
                    onClick={handleMarcarPedidosComoDespachados}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl"
                  >
                    <Truck className="w-5 h-5" />
                    Marcar como Despachado ({selectedPedidosParaDespachar.size})
                  </button>
                )}
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-center text-base font-bold text-gray-900 w-16">
                          <input
                            type="checkbox"
                            checked={porDespacharPedidos.length > 0 && selectedPedidosParaDespachar.size === porDespacharPedidos.length}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPedidosParaDespachar(new Set(porDespacharPedidos.map(p => p.id)));
                              } else {
                                setSelectedPedidosParaDespachar(new Set());
                              }
                            }}
                            className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID Pedido</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Cliente</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Dirección de Envío</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Pedido</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Cantidad</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {porDespacharPedidos
                        .filter(p =>
                          p.contratanteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.contratanteEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toString().includes(searchTerm)
                        )
                        .map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedPedidosParaDespachar.has(pedido.id)}
                              onChange={() => togglePedidoSelection(pedido.id)}
                              className="w-5 h-5 rounded border-gray-300 text-[#481468] focus:ring-[#481468] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">#{pedido.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{pedido.contratanteNombre}</p>
                              <p className="text-sm text-gray-500">{pedido.contratanteEmail}</p>
                              <p className="text-sm text-gray-500">{pedido.telefono}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{pedido.direccionCompleta}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-gray-600 text-sm">{formatDate(pedido.createdAt)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {pedido.cantidadPulseras} {pedido.cantidadPulseras === 1 ? 'dispositivo' : 'dispositivos'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pedido.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {porDespacharPedidos.length === 0 && (
                    <div className="text-center py-16">
                      <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay pedidos por despachar</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Despachados Tab */}
        {activeTab === 'despachados' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Pedidos Despachados</h2>
                <p className="text-gray-600">Pedidos enviados a clientes</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por cliente, email, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80"
                />
              </div>
            </div>

            {loadingPulseras ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">ID Pedido</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Cliente</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Dirección de Envío</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Cantidad</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Estado</th>
                        <th className="px-6 py-5 text-left text-base font-bold text-gray-900">Fecha Despacho</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {despachadosPedidos
                        .filter(p =>
                          p.contratanteNombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.contratanteEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.id.toString().includes(searchTerm)
                        )
                        .map((pedido) => (
                        <tr key={pedido.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-black font-bold text-lg">#{pedido.id}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-semibold text-gray-900">{pedido.contratanteNombre}</p>
                              <p className="text-sm text-gray-500">{pedido.contratanteEmail}</p>
                              <p className="text-sm text-gray-500">{pedido.telefono}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm">
                              <p className="font-medium text-gray-900">{pedido.direccionCompleta}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                              {pedido.cantidadPulseras} {pedido.cantidadPulseras === 1 ? 'dispositivo' : 'dispositivos'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(pedido.status)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-gray-600">
                              {formatDate(pedido.updatedAt)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {despachadosPedidos.length === 0 && (
                    <div className="text-center py-16">
                      <Truck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium text-lg">No hay pedidos despachados</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Administrar Bluko Life Tab */}
        {activeTab === 'administrar' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Administrar Bluko Life</h2>
                <p className="text-gray-600">Vista completa del inventario y estado de dispositivos</p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-black" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email, RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#481468] focus:border-transparent w-full md:w-80 text-black"
                />
              </div>
            </div>

            {loadingContratantes ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#481468]"></div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Contratante</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Email</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">RUT</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Fecha Registro</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Dispositivos</th>
                        <th className="px-6 py-4 text-left font-bold text-gray-900">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allContratantes
                        .filter(c =>
                          c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.paternalSurname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.rut?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((contratante) => (
                        <React.Fragment key={contratante.id}>
                          <tr className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
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
                              <span className="text-gray-600 text-sm">{formatDate(contratante.createdAt)}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm">
                                <p className="text-gray-900 font-semibold">{contratante.totalPurchasedPulseras} total</p>
                                <p className="text-gray-500">{contratante.availablePulseras} disponibles</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleExpand(contratante.id)}
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs bg-[#481468] text-white rounded-lg hover:bg-[#3d1158] font-semibold transition-colors"
                              >
                                <Users className="w-4 h-4" />
                                Ver Portadores
                              </button>
                            </td>
                          </tr>

                          {expandedContratante === contratante.id && contratanteDetails.has(contratante.id) && (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 bg-gray-50">
                                <div className="space-y-6">
                                  {/* Sección de Pulseras */}
                                  <div>
                                    <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
                                      <QrCode className="w-5 h-5" />
                                      Pulseras / QR ({contratanteDetails.get(contratante.id).pulseras?.length || 0})
                                    </h4>

                                    {contratanteDetails.get(contratante.id).pulseras?.length > 0 ? (
                                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        {contratanteDetails.get(contratante.id).pulseras.map((pulsera: any) => (
                                          <div key={pulsera.id} className={`bg-white rounded-xl p-4 shadow border-2 ${pulsera.active && pulsera.subscriptionActive ? 'border-green-200' : 'border-red-200'}`}>
                                            <div className="flex items-start justify-between">
                                              <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg ${pulsera.active && pulsera.subscriptionActive ? 'bg-green-100' : 'bg-red-100'}`}>
                                                  <QrCode className={`w-5 h-5 ${pulsera.active && pulsera.subscriptionActive ? 'text-green-600' : 'text-red-600'}`} />
                                                </div>
                                                <div>
                                                  <p className="font-bold text-gray-900">{pulsera.customId || pulsera.name}</p>
                                                  <div className="flex items-center gap-2 mt-1">
                                                    {pulsera.subscriptionActive ? (
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Suscripción Activa
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                                        <X className="w-3 h-3" />
                                                        Suscripción Inactiva
                                                      </span>
                                                    )}
                                                    {pulsera.active ? (
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                                        Activa
                                                      </span>
                                                    ) : (
                                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                        Pausada
                                                      </span>
                                                    )}
                                                  </div>
                                                  {pulsera.portador && (
                                                    <p className="text-sm text-gray-500 mt-1">
                                                      Portador: {pulsera.portador.firstName} {pulsera.portador.paternalSurname}
                                                    </p>
                                                  )}
                                                  <p className="text-xs text-gray-400 mt-1">Creado: {formatDate(pulsera.createdAt)}</p>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                                              <button
                                                onClick={() => handleViewQrImage(pulsera.customId || pulsera.qrCode)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors"
                                                title="Ver QR"
                                              >
                                                <Eye className="w-3.5 h-3.5" />
                                                Ver QR
                                              </button>

                                              {pulsera.active ? (
                                                <button
                                                  onClick={() => handlePausePulsera(pulsera.id, pulsera.customId || pulsera.name)}
                                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-semibold transition-colors"
                                                  title="Pausar pulsera"
                                                >
                                                  <Pause className="w-3.5 h-3.5" />
                                                  Pausar
                                                </button>
                                              ) : (
                                                <button
                                                  onClick={() => handleActivatePulsera(pulsera.id, pulsera.customId || pulsera.name)}
                                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold transition-colors"
                                                  title="Activar pulsera"
                                                >
                                                  <Play className="w-3.5 h-3.5" />
                                                  Activar
                                                </button>
                                              )}

                                              <button
                                                onClick={() => handleDeletePulsera(pulsera.id, pulsera.customId || pulsera.name)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold transition-colors"
                                                title="Eliminar pulsera"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Eliminar
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 text-gray-500 bg-white rounded-xl border border-gray-200">
                                        <QrCode className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                                        <p>No hay pulseras asignadas</p>
                                      </div>
                                    )}
                                  </div>
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
              </div>
            )}
          </div>
        )}

        {/* Cupones Tab */}
        {activeTab === 'cupones' && (
          <div className="space-y-6 animate-fadeIn">
            <button
              onClick={() => handleTabChange('dashboard')}
              className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              Volver al Dashboard
            </button>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Cupones de Descuento</h2>
                <p className="text-gray-600">Gestiona códigos promocionales para descuentos en habilitación</p>
              </div>
              <div className="flex items-center gap-3">
                {selectedCupones.length > 0 && (
                  <button
                    onClick={handleDeleteCupones}
                    disabled={deletingCupones}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deletingCupones ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-5 h-5" />
                        Eliminar ({selectedCupones.length})
                      </>
                    )}
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditingCupon(null);
                    resetCuponForm();
                    setShowCuponModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#82c341] text-white rounded-xl hover:bg-[#6fa832] font-semibold transition-colors shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  Crear Cupón
                </button>
              </div>
            </div>

            {/* Lista de cupones */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              {loadingCupones ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#481468] mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Cargando cupones...</p>
                </div>
              ) : cupones.length === 0 ? (
                <div className="p-12 text-center">
                  <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No hay cupones creados</p>
                  <p className="text-gray-400 mt-1">Crea tu primer cupón de descuento</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-4 text-center">
                          <input
                            type="checkbox"
                            checked={selectedCupones.length === cupones.length && cupones.length > 0}
                            onChange={toggleAllCupones}
                            className="w-4 h-4 text-[#481468] border-gray-300 rounded focus:ring-[#481468] cursor-pointer"
                          />
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Código</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Descuento</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Vigencia</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                        <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cupones.map((cupon) => (
                        <tr key={cupon.id} className={`hover:bg-gray-50 transition-colors ${selectedCupones.includes(cupon.id) ? 'bg-purple-50' : ''}`}>
                          <td className="px-4 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={selectedCupones.includes(cupon.id)}
                              onChange={() => toggleCuponSelection(cupon.id)}
                              className="w-4 h-4 text-[#481468] border-gray-300 rounded focus:ring-[#481468] cursor-pointer"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-[#82c341]/10 rounded-lg">
                                <Tag className="w-5 h-5 text-[#82c341]" />
                              </div>
                              <span className="font-bold text-gray-900 text-lg">{cupon.nombre}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Percent className="w-4 h-4 text-gray-400" />
                              <span className="font-bold text-[#481468] text-xl">{cupon.porcentajeDescuento}%</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>{cupon.fechaInicio} - {cupon.fechaFin}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${getEstadoBadge(cupon.estado)}`}>
                              {cupon.estado}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openEditCuponModal(cupon)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors"
                                title="Editar cupón"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleToggleCuponActivo(cupon.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                                  cupon.activo
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                                title={cupon.activo ? 'Desactivar' : 'Activar'}
                              >
                                {cupon.activo ? (
                                  <>
                                    <Pause className="w-3.5 h-3.5" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <Play className="w-3.5 h-3.5" />
                                    Activar
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Info de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="font-bold text-blue-900 mb-2">Información sobre cupones</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• El descuento se aplica <strong>sobre el precio de la pulsera</strong> ($9.900 CLP), no sobre la habilitación ($3.450 CLP)</li>
                <li>• El código del cupón no se puede cambiar después de creado</li>
                <li>• Los cupones vencidos o inactivos no podrán ser usados en el checkout</li>
                <li>• Los usuarios pueden ingresar el código en la página de suscripción</li>
              </ul>
            </div>
          </div>
        )}
      </main>

      {/* Modal Crear/Editar Cupón */}
      {showCuponModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl transform animate-scaleIn">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCupon ? 'Editar Cupón' : 'Crear Nuevo Cupón'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingCupon ? `Editando: ${editingCupon.nombre}` : 'Configura los detalles del cupón'}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowCuponModal(false);
                  setEditingCupon(null);
                  resetCuponForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Nombre del cupón */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Código del cupón
                </label>
                <input
                  type="text"
                  value={cuponForm.nombre}
                  onChange={(e) => setCuponForm({ ...cuponForm, nombre: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                  placeholder="Ej: MAMA20, PROMO50"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black font-medium uppercase"
                  disabled={!!editingCupon}
                  maxLength={50}
                />
                {editingCupon && (
                  <p className="mt-1 text-xs text-gray-500">El código no se puede modificar</p>
                )}
              </div>

              {/* Porcentaje de descuento */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Porcentaje de descuento
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={cuponForm.porcentajeDescuento}
                    onChange={(e) => setCuponForm({ ...cuponForm, porcentajeDescuento: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black font-medium pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">%</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Este descuento se aplicará sobre la habilitación ($3.450 CLP por pulsera)
                </p>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fecha inicio
                  </label>
                  <input
                    type="date"
                    value={cuponForm.fechaInicio}
                    onChange={(e) => setCuponForm({ ...cuponForm, fechaInicio: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Fecha fin
                  </label>
                  <input
                    type="date"
                    value={cuponForm.fechaFin}
                    onChange={(e) => setCuponForm({ ...cuponForm, fechaFin: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Preview del descuento */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-bold text-gray-700 mb-2">Vista previa del descuento</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Pulsera original: $9.900 CLP</p>
                  <p>Descuento ({cuponForm.porcentajeDescuento}%): -${Math.floor(9900 * cuponForm.porcentajeDescuento / 100).toLocaleString('es-CL')} CLP</p>
                  <p className="font-bold text-[#481468]">
                    Pulsera final: ${(9900 - Math.floor(9900 * cuponForm.porcentajeDescuento / 100)).toLocaleString('es-CL')} CLP
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => {
                  setShowCuponModal(false);
                  setEditingCupon(null);
                  resetCuponForm();
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingCupon ? handleUpdateCupon : handleCreateCupon}
                className="flex-1 px-6 py-3 bg-[#82c341] text-white rounded-xl hover:bg-[#6fa832] font-semibold transition-colors"
              >
                {editingCupon ? 'Guardar Cambios' : 'Crear Cupón'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cupones-Plan Tab */}
      {activeTab === 'cuponesPlanes' && (
        <div className="space-y-6 animate-fadeIn">
          <button
            onClick={() => handleTabChange('dashboard')}
            className="inline-flex items-center gap-2 text-[#481468] hover:text-[#3d1158] font-semibold group transition-colors"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Volver al Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Cupones-Plan</h2>
              <p className="text-gray-600">Códigos con nombre libre que apuntan a planes PAT pre-configurados</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedCuponesPlanes.length > 0 && (
                <button
                  onClick={handleDeleteCuponesPlanes}
                  disabled={deletingCuponesPlanes}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 font-semibold transition-colors shadow-lg disabled:opacity-50"
                >
                  {deletingCuponesPlanes ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  Eliminar ({selectedCuponesPlanes.length})
                </button>
              )}
              <button
                onClick={() => { setEditingCuponPlan(null); setCuponPlanForm({ nombre: '', porcentajeDescuento: 15 }); setShowCuponPlanModal(true); }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#82c341] text-white rounded-xl hover:bg-[#6fa832] font-semibold transition-colors shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Nuevo Cupón-Plan
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {loadingCuponesPlanes ? (
              <div className="p-12 text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-[#481468] mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Cargando...</p>
              </div>
            ) : cuponesPlanes.length === 0 ? (
              <div className="p-12 text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium text-lg">No hay cupones-plan creados</p>
                <p className="text-gray-400 mt-1">Crea el primero con el botón de arriba</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-4 text-center">
                        <input type="checkbox"
                          checked={selectedCuponesPlanes.length === cuponesPlanes.length && cuponesPlanes.length > 0}
                          onChange={toggleAllCuponesPlanes}
                          className="w-4 h-4 text-[#481468] border-gray-300 rounded cursor-pointer"
                        />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Código (nombre)</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Descuento</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Plan destino</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {cuponesPlanes.map((cp: any) => (
                      <tr key={cp.id} className={`hover:bg-gray-50 transition-colors ${selectedCuponesPlanes.includes(cp.id) ? 'bg-purple-50' : ''}`}>
                        <td className="px-4 py-4 text-center">
                          <input type="checkbox"
                            checked={selectedCuponesPlanes.includes(cp.id)}
                            onChange={() => toggleCuponPlanSelection(cp.id)}
                            className="w-4 h-4 text-[#481468] border-gray-300 rounded cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#82c341]/10 rounded-lg">
                              <Tag className="w-5 h-5 text-[#82c341]" />
                            </div>
                            <div>
                              <span className="font-bold text-gray-900 text-lg">{cp.nombre}</span>
                              <p className="text-xs text-gray-400">ID: {cp.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Percent className="w-4 h-4 text-gray-400" />
                            <span className="font-bold text-[#481468] text-xl">{cp.porcentajeDescuento}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                            Cualquier cantidad · {cp.porcentajeDescuento}% dto.
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${cp.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {cp.activo ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => { setEditingCuponPlan(cp); setCuponPlanForm({ nombre: cp.nombre, porcentajeDescuento: cp.porcentajeDescuento }); setShowCuponPlanModal(true); }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Renombrar
                            </button>
                            <button
                              onClick={() => handleToggleCuponPlanActivo(cp.id)}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg font-semibold transition-colors ${cp.activo ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              {cp.activo ? <><Pause className="w-3.5 h-3.5" />Desactivar</> : <><Play className="w-3.5 h-3.5" />Activar</>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <h3 className="font-bold text-blue-900 mb-2">¿Cómo funcionan los Cupones-Plan?</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• El <strong>nombre</strong> es lo que el usuario escribe en el checkout (ej: <code>mamá15</code>, <code>semana15</code>)</li>
              <li>• Puedes <strong>renombrarlo en cualquier momento</strong> sin cambiar el descuento ni la URL destino</li>
              <li>• El <strong>descuento</strong> (15/25/35/50%) determina qué URL de VirtualPos se usa, junto con la cantidad de pulseras seleccionada</li>
              <li>• Sin fechas de vencimiento — actívalo o desactívalo manualmente</li>
              <li>• Tienen prioridad sobre los cupones tradicionales con fechas</li>
            </ul>
          </div>
        </div>
      )}

      {/* Modal Crear/Renombrar Cupón-Plan */}
      {showCuponPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCuponPlan ? 'Renombrar Cupón-Plan' : 'Nuevo Cupón-Plan'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {editingCuponPlan
                    ? `Cambia el nombre visible. El descuento (${editingCuponPlan.porcentajeDescuento}%) no cambia.`
                    : 'El nombre es editable en cualquier momento'}
                </p>
              </div>
              <button onClick={() => { setShowCuponPlanModal(false); setEditingCuponPlan(null); }} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Nombre */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Nombre / Código del cupón
                </label>
                <input
                  type="text"
                  value={cuponPlanForm.nombre}
                  onChange={(e) => setCuponPlanForm({ ...cuponPlanForm, nombre: e.target.value })}
                  placeholder="Ej: mamá15, semana25, promo50"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#481468] focus:border-transparent text-black font-medium"
                  maxLength={100}
                />
                <p className="mt-1 text-xs text-gray-400">Puedes usar letras, números, acentos y espacios. Distingue mayúsculas/minúsculas en visualización pero no en validación.</p>
              </div>

              {/* Descuento (solo en creación) */}
              {!editingCuponPlan && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Porcentaje de descuento
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[15, 25, 35, 50].map(pct => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCuponPlanForm({ ...cuponPlanForm, porcentajeDescuento: pct })}
                        className={`py-3 rounded-xl font-bold text-sm border-2 transition-all ${cuponPlanForm.porcentajeDescuento === pct ? 'border-[#481468] bg-[#481468] text-white' : 'border-gray-200 text-gray-700 hover:border-[#481468]'}`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Solo se permiten estos valores porque son los planes existentes en VirtualPos.</p>
                </div>
              )}

              {/* Preview */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-600">
                  Cuando un usuario ingrese <strong>&ldquo;{cuponPlanForm.nombre || '...'}&rdquo;</strong>, se aplicará un{' '}
                  <strong>{editingCuponPlan ? editingCuponPlan.porcentajeDescuento : cuponPlanForm.porcentajeDescuento}% de descuento</strong>{' '}
                  y se usará la URL del plan correspondiente según la cantidad de pulseras elegida.
                </p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => { setShowCuponPlanModal(false); setEditingCuponPlan(null); }}
                className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingCuponPlan ? handleUpdateCuponPlan : handleCreateCuponPlan}
                className="flex-1 px-6 py-3 bg-[#82c341] text-white rounded-xl hover:bg-[#6fa832] font-semibold transition-colors"
              >
                {editingCuponPlan ? 'Guardar Nombre' : 'Crear Cupón-Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                className="w-full inline-flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-[#481468] to-[#3d1158] text-white rounded-xl hover:shadow-xl transition-all duration-200 transform hover:scale-105 font-semibold"
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
