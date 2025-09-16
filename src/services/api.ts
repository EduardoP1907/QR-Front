import axios from 'axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '@/constants';
import type { RegisterData, PulseraFormData, SubscriptionFormData } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

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
    contactInfo?: string; 
    medicalInfo?: string; 
    emergencyContact?: string; 
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
    contactInfo?: string;
    medicalInfo?: string;
    emergencyContact?: string;
  }) => 
    api.post(API_ENDPOINTS.pulseras.assign(id), assignData),
    
  unassign: (id: string | number) => 
    api.post(API_ENDPOINTS.pulseras.unassign(id)),
};

// APIs de contratantes (compras y suscripciones)
export const contratanteApi = {
  processPurchase: (quantity: number) => 
    api.post(API_ENDPOINTS.contratantes.purchases.process, { quantity }),
    
  getAvailablePulseras: () => 
    api.get(API_ENDPOINTS.contratantes.purchases.available),
    
  // Suscripciones
  getSubscriptionStatus: () => 
    api.get(API_ENDPOINTS.contratantes.subscription.status),
    
  processSubscription: (subscriptionData: SubscriptionFormData) => {
    // Transformar los datos al formato esperado por el backend
    const payload = {
      planType: subscriptionData.planType,
      paymentData: {
        cardNumber: subscriptionData.paymentData.cardNumber,
        expiryDate: subscriptionData.paymentData.expiryDate,
        cvv: subscriptionData.paymentData.cvv,
        cardHolderName: subscriptionData.paymentData.cardHolderName
      },
      customerData: {
        fullName: subscriptionData.customerData.fullName,
        email: subscriptionData.customerData.email,
        phone: subscriptionData.customerData.phone
      }
    };
    return api.post(API_ENDPOINTS.contratantes.subscription.process, payload);
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

export default api;