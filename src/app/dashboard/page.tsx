'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus,
  QrCode,
  Edit,
  Trash2,
  Download,
  Shield,
  LogOut,
  User,
  Heart,
  Phone,
  AlertTriangle,
  X,
  ShoppingCart,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pulseraApi, contratanteApi, medicalDataApi } from '../../services/api';
import type { Enfermedad, PrincipioActivo, AssignPulseraFormData } from '../../types';
import ProtectedRoute from '../../components/ProtectedRoute';
import { formatRutSimple, validateRutWithMessage, cleanRut } from '../../utils/rutValidator';

interface PulseraFormData {
  // Datos de la pulsera
  name: string;
  description: string;
  
  // Datos del portador
  portadorEmail: string;
  portadorRut: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  
  // Información médica y contacto
  tipoSangre: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  medicamentos: string;
  alergias: string;
}

interface Pulsera {
  id: string;
  name: string;
  description?: string;
  qrCode?: string;
  medicalInfo?: string;
  active?: boolean;
  owner?: any;
  portador?: any;
}

interface AssignFormData {
  portadorEmail: string;
  portadorRut: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname: string;
  medicalInfo: string;
  medicamentos: string;
  patologias: Array<{
    enfermedadId: number;
  }>;
  principiosActivos: Array<{
    principioActivoId: number;
    concentracion: string;
    dosis: string;
    observaciones?: string;
  }>;
  contactosEmergencia: Array<{
    nombre: string;
    telefono: string;
  }>;
}

function DashboardContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  
  const [pulseras, setPulseras] = useState<Pulsera[]>([]);
  const [loading, setLoading] = useState(true);
  const [availablePulseras, setAvailablePulseras] = useState(0);
  const [subscriptionStatus, setSubscriptionStatus] = useState<{
    isActive: boolean;
    daysRemaining: number;
    expiresAt: string | null;
  }>({ isActive: false, daysRemaining: 0, expiresAt: null });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPulsera, setEditingPulsera] = useState<Pulsera | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigningPulsera, setAssigningPulsera] = useState<Pulsera | null>(null);
  
  // Medical data for dropdowns
  const [enfermedades, setEnfermedades] = useState<Enfermedad[]>([]);
  const [principiosActivos, setPrincipiosActivos] = useState<PrincipioActivo[]>([]);

  // New structure for pathologies (enfermedades)
  const [patologiasDetalle, setPatologiasDetalle] = useState<Array<{
    enfermedadId: number;
  }>>([]);

  // New structure for active principles with concentration and dosage
  const [principiosActivosDetalle, setPrinciosActivosDetalle] = useState<Array<{
    principioActivoId: number;
    concentracion: string;
    dosis: string;
    observaciones?: string;
    searchTerm?: string;
  }>>([]);

  // Search states for each row (active principles)
  const [searchStates, setSearchStates] = useState<Record<number, string>>({});
  // Focus states for each row (active principles)
  const [focusStates, setFocusStates] = useState<Record<number, boolean>>({});

  // Search and focus states for pathologies
  const [searchStatesPatologias, setSearchStatesPatologias] = useState<Record<number, string>>({});
  const [focusStatesPatologias, setFocusStatesPatologias] = useState<Record<number, boolean>>({});

  // Emergency contacts data
  const [contactosEmergenciaDetalle, setContactosEmergenciaDetalle] = useState<Array<{
    nombre: string;
    telefono: string;
  }>>([]);

  // Forms
  const createForm = useForm<PulseraFormData>();
  const editForm = useForm<PulseraFormData>();
  const assignForm = useForm<AssignFormData>();

  // Cargar pulseras, pulseras disponibles y estado de suscripción
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [pulserasResponse, availableResponse, subscriptionResponse] = await Promise.all([
          pulseraApi.getAll(),
          contratanteApi.getAvailablePulseras(),
          contratanteApi.getSubscriptionStatus().catch(() => ({ data: { isActive: false, daysRemaining: 0, expiresAt: null } }))
        ]);
        
        setPulseras(Array.isArray(pulserasResponse.data) ? pulserasResponse.data : pulserasResponse.data?.items ?? []);
        setAvailablePulseras(availableResponse.data.availablePulseras || 0);
        setSubscriptionStatus(subscriptionResponse.data);
      } catch (err) {
        console.error(err);
        toast.error('No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load medical data for dropdowns
  useEffect(() => {
    const loadMedicalData = async () => {
      try {
        const [enfermedadesResponse, principiosResponse] = await Promise.all([
          medicalDataApi.getEnfermedades(),
          medicalDataApi.getPrincipiosActivos()
        ]);

        setEnfermedades(enfermedadesResponse.data || []);
        setPrincipiosActivos(principiosResponse.data || []);
      } catch (error) {
        console.error('Error loading medical data:', error);
        toast.error('Error al cargar datos médicos');
      }
    };

    loadMedicalData();
  }, []);

  // Cargar QR codes para todas las pulseras
  useEffect(() => {
    const loadQrCodes = async () => {
      const codes: Record<string, string> = {};
      
      for (const pulsera of pulseras) {
        try {
          const { data } = await pulseraApi.generateQr(pulsera.id);
          if (data?.qrImage) {
            codes[pulsera.id] = data.qrImage;
          }
        } catch (err) {
          console.error(`Error loading QR for pulsera ${pulsera.id}:`, err);
        }
      }
      
      setQrCodes(codes);
    };

    if (pulseras.length > 0) {
      loadQrCodes();
    }
  }, [pulseras]);

  // Handlers
  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cerrar sesión.');
    }
  };

  const handleCreate = () => {
    if (!subscriptionStatus.isActive) {
      toast.error('Necesitas una suscripción activa para usar las pulseras.');
      return;
    }
    if (availablePulseras <= 0) {
      toast.error('No tienes pulseras disponibles. Compra más pulseras primero.');
      return;
    }
    // For assignment, we need a placeholder pulsera
    setAssigningPulsera({ id: 'new', name: 'Nueva Pulsera' } as Pulsera);
    assignForm.reset();
    setPatologiasDetalle([]);
    setPrinciosActivosDetalle([]);
    setContactosEmergenciaDetalle([]);
    setSearchStates({});
    setFocusStates({});
    setSearchStatesPatologias({});
    setFocusStatesPatologias({});
    setShowAssignModal(true);
  };

  const handleEdit = (pulsera: Pulsera) => {
    setEditingPulsera(pulsera);
    editForm.reset({
      nombre: pulsera.nombre || '',
      descripcion: pulsera.descripcion || '',
      contactoEmergencia: pulsera.contactoEmergencia || '',
      telefonoEmergencia: pulsera.telefonoEmergencia || '',
      condicionesMedicas: pulsera.condicionesMedicas || '',
      medicamentos: pulsera.medicamentos || '',
      alergias: pulsera.alergias || '',
      tipoSangre: pulsera.tipoSangre || ''
    });
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    const ok = confirm('¿Eliminar esta pulsera? Esta acción no se puede deshacer.');
    if (!ok) return;

    try {
      await pulseraApi.delete(id);
      setPulseras((prev) => prev.filter((p) => p.id !== id));
      toast.success('Pulsera eliminada.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo eliminar.');
    }
  };

  const handleShowQr = async (pulsera: Pulsera) => {
    try {
      const { data } = await pulseraApi.generateQr(pulsera.id);
      // Si la API devuelve un blob o base64, ajustar según necesidad
      if (typeof data === 'string' && data.startsWith('data:image')) {
        setQrImage(data);
      } else if (data instanceof Blob) {
        const url = URL.createObjectURL(data);
        setQrImage(url);
      } else {
        // Asumir que es una URL
        setQrImage(data.qrCode || data.url || data);
      }
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo obtener el QR.');
    }
  };

  const handleDownloadQr = () => {
    try {
      const a = document.createElement('a');
      a.href = qrImage;
      a.download = 'pulsera-qr.png';
      a.click();
    } catch (err) {
      console.error(err);
      toast.error('No se pudo descargar el QR.');
    }
  };

  const handleCreateSubmit = async (data: PulseraFormData) => {
    try {
      // Create the pulsera first, then assign it
      const createData = {
        name: data.name,
        description: data.description
      };
      const response = await pulseraApi.create(createData);
      
      // Now assign it to the portador
      const assignData = {
        portadorEmail: data.portadorEmail,
        portadorRut: data.portadorRut,
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        medicalInfo: `Tipo de sangre: ${data.tipoSangre}\nCondiciones: ${data.condicionesMedicas}\nMedicamentos: ${data.medicamentos}\nAlergias: ${data.alergias}`
      };
      
      await pulseraApi.assign(response.data.id, assignData);
      
      setPulseras((prev) => [...prev, { ...response.data, assigned: true }]);
      setAvailablePulseras((prev) => prev - 1);
      setShowCreateModal(false);
      createForm.reset();
      toast.success('Pulsera asignada exitosamente al usuario.');
    } catch (err) {
      console.error(err);
      if (err.response?.data?.error?.includes('disponibles')) {
        toast.error('No tienes pulseras disponibles. Compra más pulseras primero.');
      } else {
        toast.error('Error al asignar la pulsera.');
      }
    }
  };

  const handleEditSubmit = async (data: PulseraFormData) => {
    if (!editingPulsera) return;
    
    try {
      const response = await pulseraApi.update(editingPulsera.id, data);
      setPulseras((prev) => 
        prev.map((p) => p.id === editingPulsera.id ? response.data : p)
      );
      setShowEditModal(false);
      setEditingPulsera(null);
      editForm.reset();
      toast.success('Pulsera actualizada exitosamente.');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar la pulsera.');
    }
  };

  const handleAssign = (pulsera: Pulsera) => {
    setAssigningPulsera(pulsera);
    setShowAssignModal(true);
    assignForm.reset();
    setPrinciosActivosDetalle([]);
    setSearchStates({});
  };

  const handleEditAssignment = (pulsera: Pulsera) => {
    setAssigningPulsera(pulsera);
    setShowAssignModal(true);
    
    // Cargar datos existentes de la pulsera y portador
    assignForm.reset({
      portadorEmail: pulsera.portador?.email || '',
      portadorRut: pulsera.portador?.rut || '',
      firstName: pulsera.portador?.firstName || '',
      paternalSurname: pulsera.portador?.paternalSurname || '',
      maternalSurname: pulsera.portador?.maternalSurname || '',
      medicalInfo: pulsera.medicalInfo || ''
    });
  };

  const handleAssignSubmit = async (data: AssignFormData) => {
    if (!assigningPulsera) return;
    
    try {
      // Preparar datos de asignación
      const assignData = {
        portadorEmail: data.portadorEmail,
        portadorRut: data.portadorRut,
        firstName: data.firstName,
        paternalSurname: data.paternalSurname,
        maternalSurname: data.maternalSurname,
        medicalInfo: data.medicalInfo,
        medicamentos: data.medicamentos || '',
        enfermedadIds: patologiasDetalle.map(p => p.enfermedadId).filter(id => id > 0),
        principiosActivos: principiosActivosDetalle,
        contactosEmergencia: contactosEmergenciaDetalle.filter(c => c.nombre && c.telefono)
      };

      if (assigningPulsera.id === 'new') {
        // Para nueva pulsera: crear una pulsera básica primero
        const createData = {
          name: `Pulsera de ${data.firstName}`,
          description: 'Pulsera personalizada'
        };
        const createResponse = await pulseraApi.create(createData);
        
        // Luego asignar la pulsera recién creada
        const assignResponse = await pulseraApi.assign(createResponse.data.pulsera.id, assignData);
        
        // Actualizar el estado con la pulsera asignada
        setPulseras((prev) => [...prev, assignResponse.data.pulsera]);
        setAvailablePulseras((prev) => prev - 1);
      } else {
        // Para pulsera existente: solo asignar
        const assignResponse = await pulseraApi.assign(assigningPulsera.id, assignData);
        
        setPulseras((prev) => 
          prev.map((p) => p.id === assigningPulsera.id ? assignResponse.data.pulsera : p)
        );
      }
      
      setShowAssignModal(false);
      setAssigningPulsera(null);
      assignForm.reset();
      setPatologiasDetalle([]);
      setPrinciosActivosDetalle([]);
      setSearchStates({});
      toast.success('Pulsera asignada exitosamente al usuario.');
    } catch (err) {
      console.error(err);
      toast.error('Error al asignar la pulsera.');
    }
  };


  // Functions for managing emergency contacts table
  const addContactoEmergencia = () => {
    setContactosEmergenciaDetalle([...contactosEmergenciaDetalle, {
      nombre: '',
      telefono: ''
    }]);
  };

  const removeContactoEmergencia = (index: number) => {
    const nuevosContactos = contactosEmergenciaDetalle.filter((_, i) => i !== index);
    setContactosEmergenciaDetalle(nuevosContactos);
  };

  const updateContactoEmergencia = (index: number, field: string, value: string) => {
    const nuevosContactos = [...contactosEmergenciaDetalle];
    nuevosContactos[index] = { ...nuevosContactos[index], [field]: value };
    setContactosEmergenciaDetalle(nuevosContactos);
  };

  // Validation for contact name (only letters, spaces, accents)
  const isValidName = (name: string) => {
    return /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name);
  };

  // Validation for phone number (only numbers, +, -, spaces, parentheses)
  const isValidPhone = (phone: string) => {
    return /^[0-9+\-\s()]+$/.test(phone);
  };

  // Functions for managing pathologies table
  const addPatologia = () => {
    const newIndex = patologiasDetalle.length;
    setPatologiasDetalle([...patologiasDetalle, {
      enfermedadId: 0
    }]);
    setSearchStatesPatologias({ ...searchStatesPatologias, [newIndex]: '' });
    setFocusStatesPatologias({ ...focusStatesPatologias, [newIndex]: false });
  };

  const removePatologia = (index: number) => {
    const nuevosDetalles = patologiasDetalle.filter((_, i) => i !== index);
    setPatologiasDetalle(nuevosDetalles);

    // Remove search and focus states for this index and reindex
    const newSearchStates: Record<number, string> = {};
    const newFocusStates: Record<number, boolean> = {};

    Object.keys(searchStatesPatologias).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newSearchStates[keyNum] = searchStatesPatologias[keyNum];
        newFocusStates[keyNum] = focusStatesPatologias[keyNum] || false;
      } else if (keyNum > index) {
        newSearchStates[keyNum - 1] = searchStatesPatologias[keyNum];
        newFocusStates[keyNum - 1] = focusStatesPatologias[keyNum] || false;
      }
    });

    setSearchStatesPatologias(newSearchStates);
    setFocusStatesPatologias(newFocusStates);
  };

  const updatePatologia = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...patologiasDetalle];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
    setPatologiasDetalle(nuevosDetalles);
  };

  const updateSearchStatePatologia = (index: number, searchTerm: string) => {
    setSearchStatesPatologias({ ...searchStatesPatologias, [index]: searchTerm });
  };

  const setFocusStatePatologia = (index: number, focused: boolean) => {
    setFocusStatesPatologias({ ...focusStatesPatologias, [index]: focused });
  };

  // Filter pathologies based on search term for specific row
  const getFilteredPatologias = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length === 0) {
      // Show first 15 pathologies when no search term
      return enfermedades.slice(0, 15);
    }
    // Filter based on search term (minimum 1 character)
    return enfermedades.filter(enfermedad =>
      enfermedad.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Functions for managing active principles table
  const addPrincipioActivo = () => {
    const newIndex = principiosActivosDetalle.length;
    setPrinciosActivosDetalle([...principiosActivosDetalle, {
      principioActivoId: 0,
      concentracion: '',
      dosis: '',
      observaciones: ''
    }]);
    setSearchStates({ ...searchStates, [newIndex]: '' });
    setFocusStates({ ...focusStates, [newIndex]: false });
  };

  const removePrincipioActivo = (index: number) => {
    const nuevosDetalles = principiosActivosDetalle.filter((_, i) => i !== index);
    setPrinciosActivosDetalle(nuevosDetalles);

    // Remove search and focus states for this index and reindex
    const newSearchStates: Record<number, string> = {};
    const newFocusStates: Record<number, boolean> = {};

    Object.keys(searchStates).forEach((key) => {
      const keyNum = parseInt(key);
      if (keyNum < index) {
        newSearchStates[keyNum] = searchStates[keyNum];
        newFocusStates[keyNum] = focusStates[keyNum] || false;
      } else if (keyNum > index) {
        newSearchStates[keyNum - 1] = searchStates[keyNum];
        newFocusStates[keyNum - 1] = focusStates[keyNum] || false;
      }
    });

    setSearchStates(newSearchStates);
    setFocusStates(newFocusStates);
  };

  const updatePrincipioActivo = (index: number, field: string, value: any) => {
    const nuevosDetalles = [...principiosActivosDetalle];
    nuevosDetalles[index] = { ...nuevosDetalles[index], [field]: value };
    setPrinciosActivosDetalle(nuevosDetalles);
  };

  const updateSearchState = (index: number, searchTerm: string) => {
    setSearchStates({ ...searchStates, [index]: searchTerm });
  };

  const setFocusState = (index: number, focused: boolean) => {
    setFocusStates({ ...focusStates, [index]: focused });
  };

  // Filter active principles based on search term for specific row
  const getFilteredPrincipiosActivos = (searchTerm: string) => {
    if (!searchTerm || searchTerm.length === 0) {
      // Show first 15 principles when no search term
      return principiosActivos.slice(0, 15);
    }
    // Filter based on search term (minimum 1 character)
    return principiosActivos.filter(principio =>
      principio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (principio.nombreComercial && principio.nombreComercial.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };

  const FormFields = ({ form }: { form: any }) => (
    <>
      {/* Datos del Usuario */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">Datos del Usuario</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email del Usuario *
            </label>
            <input
              {...form.register('portadorEmail', { 
                required: 'El email es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Email inválido'
                }
              })}
              type="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="usuario@email.com"
            />
            {form.formState.errors.portadorEmail && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.portadorEmail.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              RUT del Usuario *
            </label>
            <input
              {...form.register('portadorRut', { 
                required: 'El RUT es requerido'
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="12.345.678-9"
            />
            {form.formState.errors.portadorRut && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.portadorRut.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              {...form.register('firstName', { 
                required: 'El nombre es requerido'
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Nombre"
            />
            {form.formState.errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Paterno *
            </label>
            <input
              {...form.register('paternalSurname', { 
                required: 'El apellido paterno es requerido'
              })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Apellido Paterno"
            />
            {form.formState.errors.paternalSurname && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.paternalSurname.message}</p>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido Materno
            </label>
            <input
              {...form.register('maternalSurname')}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Apellido Materno (opcional)"
            />
          </div>
        </div>
      </div>

      {/* Información básica de la pulsera */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">Información de la Pulsera</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la pulsera *
            </label>
            <input
              {...form.register('name', { required: 'El nombre es requerido' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Ej: Pulsera de Juan"
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de sangre
            </label>
            <select
              {...form.register('tipoSangre')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
            >
              <option value="">Seleccionar</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <textarea
            {...form.register('description')}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
            placeholder="Información adicional sobre la pulsera"
          />
        </div>
      </div>

      {/* Contacto de emergencia */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">Contacto de emergencia</h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del contacto *
            </label>
            <input
              {...form.register('contactoEmergencia', { required: 'El contacto de emergencia es requerido' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Nombre completo"
            />
            {form.formState.errors.contactoEmergencia && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.contactoEmergencia.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de emergencia *
            </label>
            <input
              {...form.register('telefonoEmergencia', { required: 'El teléfono es requerido' })}
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="+569 1234 5678"
            />
            {form.formState.errors.telefonoEmergencia && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.telefonoEmergencia.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información médica */}
      <div>
        <h5 className="text-sm font-medium text-gray-900 mb-3">Información médica</h5>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condiciones médicas
            </label>
            <textarea
              {...form.register('condicionesMedicas')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Diabetes, hipertensión, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Medicamentos
            </label>
            <textarea
              {...form.register('medicamentos')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Medicamentos que toma regularmente"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alergias
            </label>
            <textarea
              {...form.register('alergias')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
              placeholder="Alergias conocidas (medicamentos, alimentos, etc.)"
            />
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-7 h-7" style={{color: '#551A8B'}} />
            <h1 className="text-xl font-semibold text-gray-900">Mi Panel</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-gray-600">
              <User className="w-5 h-5" />
              <span>{user?.email ?? 'Usuario'}</span>
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
        {/* Hero */}
        <div className="mb-6 rounded-2xl p-6 text-white flex items-center justify-between" style={{background: 'linear-gradient(to right, #3C0B5A, #551A8B)'}}>
          <div>
            <h2 className="text-2xl font-bold mb-1">Bluko Life</h2>
            <p className="text-white opacity-90">
              Gestiona la información médica y contactos de emergencia.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-4 opacity-90">
            <Heart className="w-6 h-6" />
            <Phone className="w-6 h-6" />
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Status Cards */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Subscription Status */}
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${subscriptionStatus.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">
                  {subscriptionStatus.isActive ? 'Suscripción Activa' : 'Sin Suscripción'}
                </h4>
                <p className="text-sm text-gray-600">
                  {subscriptionStatus.isActive 
                    ? `${subscriptionStatus.daysRemaining} días restantes`
                    : 'Necesitas una suscripción para usar las pulseras'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Available Bracelets */}
          <div className="bg-white border rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${availablePulseras > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">Pulseras Disponibles</h4>
                <p className="text-sm text-gray-600">
                  {availablePulseras} pulseras {subscriptionStatus.isActive ? 'activas' : 'inactivas'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mis pulseras</h3>
            <p className="text-sm text-gray-600">
              Administra tu sistema Bluko Life
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/subscription')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-colors text-white hover:opacity-90"
              style={{backgroundColor: '#551A8B'}}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{'Contratar Plan'}</span>
            </button>
            <button
              onClick={handleCreate}
              disabled={availablePulseras <= 0 || !subscriptionStatus.isActive}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                availablePulseras > 0 && subscriptionStatus.isActive
                  ? 'text-white hover:opacity-90' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={availablePulseras > 0 && subscriptionStatus.isActive ? {backgroundColor: '#83C341'} : {}}
              title={
                !subscriptionStatus.isActive 
                  ? 'Necesitas una suscripción activa' 
                  : availablePulseras <= 0 
                    ? 'Compra pulseras primero' 
                    : 'Asignar pulsera a usuario'
              }
            >
              <Plus className="w-4 h-4" />
              <span>Asignar Pulsera</span>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-500">Cargando…</div>
          ) : pulseras.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Aún no tienes pulseras registradas.
            </div>
          ) : (
            <ul role="list" className="divide-y divide-gray-100">
              {pulseras.map((p) => (
                <li key={p.id} className="p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="flex gap-4 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {qrCodes[p.id] ? (
                        <img 
                          src={qrCodes[p.id]} 
                          alt={`QR Code para ${p.name}`}
                          className="w-16 h-16 border rounded-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 border rounded-lg bg-gray-100 flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.name ?? `Pulsera #${p.id}`}</p>
                      <p className="text-sm text-gray-500 truncate">
                        Código: {p.qrCode ?? p.id}
                      </p>
                      {p.portador && (
                        <p className="text-sm text-blue-600 truncate">
                          Asignada a: {p.portador.firstName} {p.portador.paternalSurname}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleShowQr(p)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
                      title="Ver QR Grande"
                    >
                      <QrCode className="w-4 h-4" />
                      <span className="hidden sm:inline">Ver QR</span>
                    </button>

                    <button
                      onClick={() => handleEdit(p)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-gray-50"
                      title="Editar Pulsera"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>

                    {p.portador ? (
                      <button
                        onClick={() => handleEditAssignment(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50"
                        title="Editar Asignación"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Editar Asignación</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAssign(p)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 text-green-600 hover:bg-green-50"
                        title="Asignar a Usuario"
                      >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">Asignar</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(p.id)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal QR */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-4">Código QR</h4>
            {qrImage ? (
              <img
                src={qrImage}
                alt="QR Pulsera"
                className="mx-auto w-64 h-64 object-contain border rounded-xl"
              />
            ) : (
              <div className="text-center text-gray-500 py-10">Cargando QR…</div>
            )}

            <div className="mt-6 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowQrModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-gray-50"
              >
                Cerrar
              </button>
              <button
                onClick={handleDownloadQr}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white hover:opacity-90 transition-all"
                style={{backgroundColor: '#83C341'}}
              >
                <Download className="w-4 h-4" />
                Descargar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Crear */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-gray-900">Asignar Pulsera Inteligente</h4>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-6">
              <FormFields form={createForm} />

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                  style={{backgroundColor: '#83C341'}}
                >
                  {createForm.formState.isSubmitting ? 'Asignando...' : 'Asignar Pulsera'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar */}
      {showEditModal && editingPulsera && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                Editar: {editingPulsera.name || `Pulsera #${editingPulsera.id}`}
              </h4>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingPulsera(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-6">
              <FormFields form={editForm} />

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPulsera(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                  className="px-6 py-2 text-white rounded-lg hover:opacity-90 transition-all disabled:opacity-50"
                  style={{backgroundColor: '#83C341'}}
                >
                  {editForm.formState.isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Asignar Pulsera */}
      {showAssignModal && assigningPulsera && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="overflow-visible">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-semibold text-gray-900">
                {assigningPulsera.portador ? 'Editar Asignación de Usuario' : 'Asignar Pulsera a Usuario'}: {assigningPulsera.name || `Pulsera #${assigningPulsera.id}`}
              </h4>
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setAssigningPulsera(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={assignForm.handleSubmit(handleAssignSubmit)} className="space-y-6">
              {/* Datos del Usuario */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Datos del Usuario</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del Usuario *
                    </label>
                    <input
                      {...assignForm.register('portadorEmail', { 
                        required: 'El email es requerido',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Email inválido'
                        }
                      })}
                      type="email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      placeholder="usuario@email.com"
                    />
                    {assignForm.formState.errors.portadorEmail && (
                      <p className="text-red-500 text-xs mt-1">{assignForm.formState.errors.portadorEmail.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      RUT del Usuario *
                    </label>
                    <input
                      {...assignForm.register('portadorRut', { 
                        required: 'El RUT es requerido',
                        validate: (value) => {
                          const validation = validateRutWithMessage(value);
                          return validation.isValid || validation.message;
                        }
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      placeholder="20.283.752-3"
                      maxLength={12}
                      onChange={(e) => {
                        const formatted = formatRutSimple(e.target.value);
                        e.target.value = formatted;
                        assignForm.setValue('portadorRut', formatted);
                        assignForm.trigger('portadorRut');
                      }}
                    />
                    {assignForm.formState.errors.portadorRut && (
                      <p className="text-red-500 text-xs mt-1">{assignForm.formState.errors.portadorRut.message}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Ingresa números y dígito verificador (ej: 202837523). Se formateará automáticamente.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      {...assignForm.register('firstName', { 
                        required: 'El nombre es requerido'
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      placeholder="Nombre"
                    />
                    {assignForm.formState.errors.firstName && (
                      <p className="text-red-500 text-xs mt-1">{assignForm.formState.errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Paterno *
                    </label>
                    <input
                      {...assignForm.register('paternalSurname', { 
                        required: 'El apellido paterno es requerido'
                      })}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      placeholder="Apellido Paterno"
                    />
                    {assignForm.formState.errors.paternalSurname && (
                      <p className="text-red-500 text-xs mt-1">{assignForm.formState.errors.paternalSurname.message}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido Materno
                    </label>
                    <input
                      {...assignForm.register('maternalSurname')}
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                      placeholder="Apellido Materno (opcional)"
                    />
                  </div>
                </div>
              </div>

              {/* Información de la Pulsera */}
              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-3">Información de la Pulsera</h5>
                <div className="space-y-4">
                  {/* Contactos de emergencia - Nueva tabla */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Contactos de emergencia
                      </label>
                      <button
                        type="button"
                        onClick={addContactoEmergencia}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        <Plus className="w-3 h-3" />
                        Agregar
                      </button>
                    </div>

                    <div className="border border-gray-300 rounded-lg overflow-visible">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Nombre
                            </th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Teléfono
                            </th>
                            <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {contactosEmergenciaDetalle.length > 0 ? (
                            contactosEmergenciaDetalle.map((contacto, index) => (
                              <tr key={index}>
                                <td className="px-3 py-2 relative">
                                  <input
                                    type="text"
                                    value={contacto.nombre}
                                    onChange={(e) => updateContactoEmergencia(index, 'nombre', e.target.value)}
                                    onBlur={(e) => {
                                      if (!isValidName(e.target.value)) {
                                        alert('El nombre debe contener solo letras y espacios');
                                        e.target.focus();
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Nombre completo"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={contacto.telefono}
                                    onChange={(e) => updateContactoEmergencia(index, 'telefono', e.target.value)}
                                    onBlur={(e) => {
                                      if (!isValidPhone(e.target.value)) {
                                        alert('El teléfono debe contener solo números y caracteres válidos (+, -, espacios, paréntesis)');
                                        e.target.focus();
                                      }
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Teléfono"
                                  />
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => removeContactoEmergencia(index)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-3 py-4 text-center text-gray-500 text-sm">
                                No hay contactos de emergencia agregados
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Información Médica Estructurada */}
                  <div>
                    <h6 className="text-sm font-medium text-gray-900 mb-3">Información Médica</h6>
                    <div className="space-y-4">
                      
                      {/* Patologías - Nueva tabla */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Patologías
                          </label>
                          <button
                            type="button"
                            onClick={addPatologia}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        </div>

                        {patologiasDetalle.length > 0 && (
                          <div className="border border-gray-300 rounded-lg overflow-visible">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Patología
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                    Acción
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {patologiasDetalle.map((detalle, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 relative">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={detalle.enfermedadId ?
                                            enfermedades.find(e => e.id === detalle.enfermedadId)?.nombre || searchStatesPatologias[index] || ''
                                            : searchStatesPatologias[index] || ''
                                          }
                                          onChange={(e) => updateSearchStatePatologia(index, e.target.value)}
                                          onFocus={() => {
                                            setFocusStatePatologia(index, true);
                                            if (detalle.enfermedadId) {
                                              updatePatologia(index, 'enfermedadId', 0);
                                              updateSearchStatePatologia(index, '');
                                            }
                                          }}
                                          onBlur={() => {
                                            // Delay hiding dropdown to allow selection
                                            setTimeout(() => setFocusStatePatologia(index, false), 200);
                                          }}
                                          className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          placeholder="Haz clic para ver lista o escribe para buscar..."
                                        />

                                        {/* Dropdown de búsqueda */}
                                        {(focusStatesPatologias[index] || (searchStatesPatologias[index] && searchStatesPatologias[index].length > 0)) && (
                                          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredPatologias(searchStatesPatologias[index] || '').length > 0 ? (
                                              getFilteredPatologias(searchStatesPatologias[index] || '').slice(0, 15).map((patologia) => (
                                                <button
                                                  key={patologia.id}
                                                  type="button"
                                                  onClick={() => {
                                                    updatePatologia(index, 'enfermedadId', patologia.id);
                                                    updateSearchStatePatologia(index, '');
                                                    setFocusStatePatologia(index, false);
                                                  }}
                                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                >
                                                  <div className="text-sm font-medium text-gray-900">{patologia.nombre}</div>
                                                </button>
                                              ))
                                            ) : searchStatesPatologias[index] ? (
                                              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                <div>No se encontraron patologías</div>
                                                <div className="text-xs mt-1">que coincidan con "{searchStatesPatologias[index]}"</div>
                                              </div>
                                            ) : (
                                              enfermedades.length === 0 && (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                  Cargando patologías...
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removePatologia(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {patologiasDetalle.length === 0 && (
                          <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-sm">No hay patologías agregadas</p>
                            <p className="text-xs mt-1">Haz clic en "Agregar" para añadir patologías</p>
                          </div>
                        )}
                      </div>

                      {/* Principios Activos - Nueva tabla */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Principios Activos (Medicamentos)
                          </label>
                          <button
                            type="button"
                            onClick={addPrincipioActivo}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar
                          </button>
                        </div>

                        {principiosActivosDetalle.length > 0 && (
                          <div className="border border-gray-300 rounded-lg overflow-visible">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Principio Activo
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Concentración
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Dosis
                                  </th>
                                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                                    Acción
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {principiosActivosDetalle.map((detalle, index) => (
                                  <tr key={index}>
                                    <td className="px-3 py-2 relative">
                                      <div className="relative">
                                        <input
                                          type="text"
                                          value={detalle.principioActivoId ?
                                            principiosActivos.find(p => p.id === detalle.principioActivoId)?.nombre || searchStates[index] || ''
                                            : searchStates[index] || ''
                                          }
                                          onChange={(e) => updateSearchState(index, e.target.value)}
                                          onFocus={() => {
                                            setFocusState(index, true);
                                            if (detalle.principioActivoId) {
                                              updatePrincipioActivo(index, 'principioActivoId', 0);
                                              updateSearchState(index, '');
                                            }
                                          }}
                                          onBlur={() => {
                                            // Delay hiding dropdown to allow selection
                                            setTimeout(() => setFocusState(index, false), 200);
                                          }}
                                          className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                          placeholder="Haz clic para ver lista o escribe para buscar..."
                                        />

                                        {/* Dropdown de búsqueda */}
                                        {(focusStates[index] || (searchStates[index] && searchStates[index].length > 0)) && (
                                          <div className="absolute z-[9999] w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            {getFilteredPrincipiosActivos(searchStates[index] || '').length > 0 ? (
                                              getFilteredPrincipiosActivos(searchStates[index] || '').slice(0, 15).map((principio) => (
                                                <button
                                                  key={principio.id}
                                                  type="button"
                                                  onClick={() => {
                                                    updatePrincipioActivo(index, 'principioActivoId', principio.id);
                                                    updateSearchState(index, '');
                                                    setFocusState(index, false);
                                                  }}
                                                  className="w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                >
                                                  <div className="text-sm font-medium text-gray-900">{principio.nombre}</div>
                                                  <div className="flex flex-col mt-1">
                                                    {principio.nombreComercial && (
                                                      <span className="text-xs text-blue-600">
                                                        Comercial: {principio.nombreComercial}
                                                      </span>
                                                    )}
                                                    {principio.descripcion && (
                                                      <span className="text-xs text-gray-500 truncate">
                                                        {principio.descripcion}
                                                      </span>
                                                    )}
                                                  </div>
                                                </button>
                                              ))
                                            ) : searchStates[index] ? (
                                              <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                <div>No se encontraron principios activos</div>
                                                <div className="text-xs mt-1">que coincidan con "{searchStates[index]}"</div>
                                              </div>
                                            ) : (
                                              principiosActivos.length === 0 && (
                                                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                                                  Cargando principios activos...
                                                </div>
                                              )
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={detalle.concentracion}
                                        onChange={(e) => updatePrincipioActivo(index, 'concentracion', e.target.value)}
                                        className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="ej: 500mg"
                                      />
                                    </td>
                                    <td className="px-3 py-2">
                                      <input
                                        type="text"
                                        value={detalle.dosis}
                                        onChange={(e) => updatePrincipioActivo(index, 'dosis', e.target.value)}
                                        className="w-full px-2 py-1 text-sm text-black border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        placeholder="ej: 1 cada 8h"
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => removePrincipioActivo(index)}
                                        className="text-red-600 hover:text-red-800"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {principiosActivosDetalle.length === 0 && (
                          <div className="text-center py-8 text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                            <p className="text-sm">No hay principios activos agregados</p>
                            <p className="text-xs mt-1">Haz clic en "Agregar" para añadir medicamentos</p>
                          </div>
                        )}
                      </div>

                      {/* Medicamentos (texto libre) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Otros Medicamentos
                        </label>
                        <textarea
                          {...assignForm.register('medicamentos')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                          placeholder="Otros medicamentos no listados arriba..."
                        />
                      </div>

                      {/* Información médica adicional */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Información Médica Adicional
                        </label>
                        <textarea
                          {...assignForm.register('medicalInfo')}
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-opacity-75 text-black"
                          placeholder="Alergias, observaciones médicas adicionales, etc."
                        />
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false);
                    setAssigningPulsera(null);
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={assignForm.formState.isSubmitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {assignForm.formState.isSubmitting ? 
                    (assigningPulsera?.portador ? 'Actualizando...' : 'Asignando...') : 
                    (assigningPulsera?.portador ? 'Actualizar Asignación' : 'Asignar a Usuario')
                  }
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}