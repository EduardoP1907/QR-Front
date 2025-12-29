import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
import type { RegisterData, PulseraFormData, SubscriptionFormData } from '@/types';

// Usar variable de entorno o localhost como fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://localhost:8080/api';

console.log('🌐 API_BASE_URL configured as:', API_BASE_URL);
console.log('🌐 NEXT_PUBLIC_API_URL env var:', process.env.NEXT_PUBLIC_API_URL);

// Configuración base de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// APIs de autenticación (solo contratantes)
export const authApi = {
  // Registro en 3 fases
  registerPhase1: (email: string) => 
    api.post(API_ENDPOINTS.auth.registerPhase1, { email }),
    
  registerVerifyOtp: (email: string, otp: string) => 
    api.post(API_ENDPOINTS.auth.registerVerifyOtp, { email, otp }),
    
  registerPhase2: (email: string, password: string, confirmPassword: string) => 
    api.post(API_ENDPOINTS.auth.registerPhase2, { email, password, confirmPassword }),
    
  registerPhase3: (email: string, firstName: string, paternalSurname: string, maternalSurname: string, rut: string) => 
    api.post(API_ENDPOINTS.auth.registerPhase3, { email, firstName, paternalSurname, maternalSurname, rut }),
    
  // Login
  login: (email: string, password: string) => 
    api.post(API_ENDPOINTS.auth.login, { email, password }),
    
  // Login con OTP
  loginRequestOtp: (email: string) => 
    api.post(API_ENDPOINTS.auth.loginRequestOtp, { email }),
    
  loginVerifyOtp: (email: string, otp: string) => 
    api.post(API_ENDPOINTS.auth.loginVerifyOtp, { email, otp }),
    
  resendOtp: (email: string) => 
    api.post(API_ENDPOINTS.auth.resendOtp, { email }),
};


// APIs de pulseras
export const pulseraApi = {
  getAll: () =>
    api.get(API_ENDPOINTS.pulseras.getAll),

  create: (pulseraData: { name: string; description?: string }) =>
    api.post(API_ENDPOINTS.pulseras.create, pulseraData),

  update: (id: string | number, pulseraData: {
    name: string;
    description?: string;
    medicalInfo?: string;
  }) =>
    api.put(API_ENDPOINTS.pulseras.update(id), pulseraData),

  delete: (id: string | number) =>
    api.delete(API_ENDPOINTS.pulseras.delete(id)),

  generateQr: (id: string | number) =>
    api.get(API_ENDPOINTS.pulseras.generateQr(id)),

  scanQr: (qrCode: string) =>
    api.get(API_ENDPOINTS.pulseras.scanQr(qrCode)),

  assign: (id: string | number, assignData: {
    portadorEmail: string;
    portadorRut: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    medicalInfo?: string;
    medicamentos?: string;
    enfermedadIds?: number[];
    principiosActivos?: Array<{
      principioActivoId: number;
      concentracion: string;
      dosis: string;
      observaciones?: string;
    }>;
    contactosEmergencia?: Array<{
      nombre: string;
      telefono: string;
    }>;
  }) =>
    api.post(API_ENDPOINTS.pulseras.assign(id), assignData),

  unassign: (id: string | number) =>
    api.post(API_ENDPOINTS.pulseras.unassign(id)),

  // Suscripciones por pulsera
  activateSubscription: (id: string | number) =>
    api.post(API_ENDPOINTS.pulseras.subscription.activate(id)),

  renewSubscription: (id: string | number) =>
    api.post(API_ENDPOINTS.pulseras.subscription.renew(id)),

  getSubscriptionStatus: (id: string | number) =>
    api.get(API_ENDPOINTS.pulseras.subscription.status(id)),
};

// APIs de contratantes (suscripciones)
export const contratanteApi = {
  getAvailablePulseras: () =>
    api.get(API_ENDPOINTS.contratantes.purchases.available),

  // Protection Plan (compra de pulseras + suscripción incluida)
  processProtectionPlan: (quantity: number, cardData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
  }, saveCard: boolean = true) => {
    const payload = {
      quantity: quantity,
      tarjeta: {
        numeroTarjeta: cardData.cardNumber,
        nombreTitular: cardData.cardHolderName,
        fechaExpiracion: cardData.expiryDate,
        cvv: cardData.cvv,
        esPrincipal: true
      },
      saveCard: saveCard
    };
    return api.post('/contratantes/protection-plan/process', payload);
  },

  initiateProtectionPlan: (quantity: number) =>
    api.post('/contratantes/protection-plan/initiate', { quantity }),

  getPricing: () =>
    api.get('/contratantes/protection-plan/pricing'),

  verifyPaymentAndUpdate: (quantity?: number | null) => {
    const payload = quantity ? { quantity } : {};
    return api.post('/contratantes/payment-verification/verify-and-update', payload);
  },

  // Guardar QR escaneado temporalmente (30 minutos)
  saveScannedQr: (qrCode: string) => {
    return api.post('/contratantes/save-scanned-qr', { qrCode });
  },

  // Obtener QR escaneado guardado
  getScannedQr: () => {
    return api.get('/contratantes/scanned-qr');
  },

  // Claim QR code (ahora puede funcionar sin qrCode si hay uno guardado en el backend)
  claimQr: (qrCode?: string, portadorData?: {
    email?: string;
    rut?: string;
    firstName?: string;
    paternalSurname?: string;
    maternalSurname?: string;
  }) => {
    const payload: any = {
      portadorData: portadorData || {}
    };
    // Solo incluir qrCode si se proporciona
    if (qrCode) {
      payload.qrCode = qrCode;
    }
    return api.post('/contratantes/claim-qr', payload);
  },

  // Crear portador sin asignar pulsera
  createPortador: (portadorData: {
    email: string;
    rut: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    medicalInfo?: string;
    medicamentos?: string;
    enfermedadIds?: number[];
    principiosActivos?: Array<{
      principioActivoId: number;
      concentracion: string;
      dosis: string;
      observaciones?: string;
    }>;
    contactosEmergencia?: Array<{
      nombre: string;
      telefono: string;
    }>;
  }) => {
    return api.post('/contratantes/portadores/create', portadorData);
  },

  // Listar todos los portadores del contratante
  getPortadores: () => {
    return api.get('/contratantes/portadores');
  },

  // Actualizar portador
  updatePortador: (id: number, portadorData: {
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    medicalInfo?: string;
    medicamentos?: string;
    enfermedadIds?: number[];
    principiosActivos?: Array<{
      principioActivoId: number;
      concentracion: string;
      dosis: string;
      observaciones?: string;
    }>;
    contactosEmergencia?: Array<{
      nombre: string;
      telefono: string;
    }>;
  }) => {
    return api.put(`/contratantes/portadores/${id}`, portadorData);
  },

  // Eliminar portador
  deletePortador: (id: number) => {
    return api.delete(`/contratantes/portadores/${id}`);
  },
};

// APIs de portadores
export const portadorApi = {
  login: (email: string, password?: string) => 
    api.post(API_ENDPOINTS.portadores.login, { email, password }),
    
  loginRequestOtp: (email: string) => 
    api.post(API_ENDPOINTS.portadores.loginRequestOtp, { email }),
    
  loginVerifyOtp: (email: string, otp: string) => 
    api.post(API_ENDPOINTS.portadores.loginVerifyOtp, { email, otp }),
    
  setupPassword: (email: string, password: string, confirmPassword: string, otp: string) => 
    api.post(API_ENDPOINTS.portadores.setupPassword, { email, password, confirmPassword, otp }),
    
  getMyPulseras: () => 
    api.get(API_ENDPOINTS.portadores.myPulseras),
    
  updateMedicalInfo: (id: string | number, medicalInfo: string) => 
    api.put(API_ENDPOINTS.portadores.updateMedicalInfo(id), { medicalInfo }),
};

// APIs para datos médicos
export const medicalDataApi = {
  getEnfermedades: () => 
    api.get('/medical-data/enfermedades'),
    
  searchEnfermedades: (query: string) =>
    api.get(`/medical-data/enfermedades/buscar?q=${encodeURIComponent(query)}`),
    
  getPrincipiosActivos: () =>
    api.get('/medical-data/principios-activos'),
    
  searchPrincipiosActivos: (query: string) =>
    api.get(`/medical-data/principios-activos/buscar?q=${encodeURIComponent(query)}`),
};

// APIs de perfil
export const profileApi = {
  getProfile: () =>
    api.get(API_ENDPOINTS.contratantes.profile.get),

  getProfileSummary: () =>
    api.get(API_ENDPOINTS.contratantes.profile.summary),

  updateProfile: (profileData: {
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
  }) =>
    api.put(API_ENDPOINTS.contratantes.profile.update, profileData),

  updateDireccion: (direccionData: {
    region: string;
    calle: string;
    tipoVivienda: string;
    numero: string;
    numeroDepto?: string;
    comuna: string;
    referencia?: string;
    telefono: string;
  }) =>
    api.put('/contratantes/perfil/direccion', direccionData),
};

// APIs de administrador
export const adminApi = {
  login: (email: string, password: string) =>
    api.post('/admin/login', { email, password }),

  getStats: () =>
    api.get('/admin/stats'),

  getAllContratantes: () =>
    api.get('/admin/contratantes'),

  getContratanteDetail: (id: number) =>
    api.get(`/admin/contratantes/${id}`),

  deleteContratante: (id: number) =>
    api.delete(`/admin/contratantes/${id}`),

  deactivateContratanteSubscription: (id: number) =>
    api.post(`/admin/contratantes/${id}/deactivate-subscription`),

  getAllPortadores: () =>
    api.get('/admin/portadores'),

  deletePortador: (id: number) =>
    api.delete(`/admin/portadores/${id}`),

  getAllPulseras: () =>
    api.get('/admin/pulseras'),

  getSuscripcionesActivas: () =>
    api.get('/admin/pulseras/suscripciones-activas'),

  deactivatePulseraSubscription: (id: number) =>
    api.post(`/admin/pulseras/${id}/deactivate-subscription`),

  generatePulserasBatch: (quantity: number) =>
    api.post('/admin/pulseras/generate-batch', { quantity }),

  getUnassignedPulseras: () =>
    api.get('/admin/pulseras/unassigned'),

  getPulseraQrImage: (id: number) =>
    api.get(`/admin/pulseras/${id}/qr-image`),

  getPulseraQrImageByCustomId: (customId: string) =>
    api.get(`/admin/pulseras/custom/${customId}/qr-image`),

  bulkUpdatePulseraStatus: (pulseraIds: number[], newStatus: string) =>
    api.post('/admin/pulseras/bulk-update-status', { pulseraIds, newStatus }),

  getPulserasByStatus: (status: string) =>
    api.get(`/admin/pulseras/by-status/${status}`),

  getPedidosPorDespachar: () =>
    api.get('/admin/pedidos/por-despachar'),

  getPedidosDespachados: () =>
    api.get('/admin/pedidos/despachados'),

  cambiarEstadoPedido: (pedidoId: number, nuevoEstado: string) =>
    api.put(`/admin/pedidos/${pedidoId}/status`, { nuevoEstado }),
};

export default api;