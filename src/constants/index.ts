// Pricing constants
export const SUBSCRIPTION_PRICE = 2900; // $2.990 CLP monthly per pulsera
export const PULSERA_PRICE = 9900; // $9.990 CLP per pulsera
export const TOTAL_PER_PULSERA = PULSERA_PRICE + SUBSCRIPTION_PRICE; // $12.980 CLP per pulsera (pulsera + first month subscription)

// Currency formatting
export const CURRENCY = {
  code: 'CLP',
  symbol: '$',
  locale: 'es-CL',
};

// Blood types
export const BLOOD_TYPES = [
  { value: '', label: 'Seleccionar' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
];

// Purchase limits
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

// Contact information
export const CONTACT_INFO = {
  email: 'soporte@pulserasqr.cl',
  phone: '+56 9 8765 4321',
  whatsapp: 'https://wa.me/56987654321',
  businessHours: 'Lunes a Viernes 9:00 AM - 6:00 PM',
  responseTime: 'Menos de 2 horas',
};

// Company information
export const COMPANY_INFO = {
  name: 'Bluko Life',
  description: 'Protegiendo vidas con tecnología en Chile',
  year: 2024,
  website: 'https://pulserasqr.cl',
};

// API endpoints
export const API_ENDPOINTS = {
  // Registro y autenticación (solo contratantes)
  auth: {
    registerPhase1: '/contratantes/register/phase1',
    registerPhase2: '/contratantes/register/phase2',
    registerPhase3: '/contratantes/register/phase3',
    registerVerifyOtp: '/contratantes/register/verify-otp',
    resendOtp: '/contratantes/register/resend-otp',
    login: '/contratantes/login',
    loginRequestOtp: '/contratantes/login/request-otp',
    loginVerifyOtp: '/contratantes/login/verify-otp',
  },
  contratantes: {
    purchases: {
      process: '/contratantes/purchases/process',
      available: '/contratantes/purchases/available',
    },
    subscription: {
      status: '/contratantes/subscription/status',
      process: '/contratantes/subscription/process',
    },
    profile: {
      get: '/contratantes/perfil',
      update: '/contratantes/perfil',
      summary: '/contratantes/perfil/resumen',
    },
  },
  portadores: {
    login: '/portadores/login',
    loginRequestOtp: '/portadores/login/request-otp',
    loginVerifyOtp: '/portadores/login/verify-otp',
    setupPassword: '/portadores/setup-password',
    myPulseras: '/portadores/my-pulseras',
    updateMedicalInfo: (id: string | number) => `/portadores/pulseras/${id}/medical-info`,
  },
  pulseras: {
    getAll: '/new-pulseras',
    create: '/new-pulseras',
    update: (id: string | number) => `/new-pulseras/${id}`,
    delete: (id: string | number) => `/new-pulseras/${id}`,
    generateQr: (id: string | number) => `/new-pulseras/${id}/qr`,
    scanQr: (qrCode: string) => `/new-pulseras/scan/${qrCode}`,
    assign: (id: string | number) => `/new-pulseras/${id}/assign`,
    unassign: (id: string | number) => `/new-pulseras/${id}/unassign`,
    subscription: {
      activate: (id: string | number) => `/new-pulseras/${id}/subscription/activate`,
      renew: (id: string | number) => `/new-pulseras/${id}/subscription/renew`,
      status: (id: string | number) => `/new-pulseras/${id}/subscription/status`,
    },
  },
};

// Form validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  cardNumber: /^[0-9\s]{13,19}$/,
  expiryDate: /^(0[1-9]|1[0-2])\/([0-9]{2})$/,
  cvv: /^[0-9]{3,4}$/,
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
} as const;

// Storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  PENDING_ORDER: 'pendingOrder',
  LAST_ORDER: 'lastOrder',
  RETRY_ATTEMPTS: 'retryAttempts',
} as const;