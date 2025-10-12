// User types
export interface User {
  email: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  userId: string;
  role: string;
}

// Authentication types
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<any>;
  loginWithOtp: (email: string, otp: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Pulsera types
export interface Pulsera {
  id: string;
  nombre: string;
  name?: string;
  description?: string;
  descripcion?: string;
  tipoSangre?: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas?: string;
  medicamentos?: string;
  alergias?: string;
  codigo?: string;
  qrCode?: string;
  active?: boolean;
  medicalInfo?: string;
  enfermedadesResumen?: string;
  principiosActivosResumen?: string;
  contactosEmergenciaResumen?: string;
  assigned?: boolean;
  portador?: {
    id: string;
    email: string;
    firstName: string;
    paternalSurname: string;
    maternalSurname?: string;
    rut: string;
  } | null;
  // Campos de suscripción por pulsera
  subscriptionActive?: boolean;
  subscriptionExpiresAt?: string | null;
  subscriptionPlanType?: string;
  daysRemaining?: number;
}

export interface PulseraFormData {
  nombre: string;
  descripcion: string;
  tipoSangre: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  medicamentos: string;
  alergias: string;
}

// Order types
export interface OrderData {
  quantity: number;
  pricePerUnit: number;
  total: number;
  timestamp: string;
  orderId?: string;
  status?: string;
  paymentDate?: string;
  customerData?: CustomerData;
}

export interface CustomerData {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  postalCode?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolderName?: string;
}

// Form types
export interface CheckoutFormData extends CustomerData {}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface OtpFormData {
  otp: string;
}

// Subscription types (por pulsera)
export interface PulseraSubscriptionStatus {
  subscriptionActive: boolean;
  subscriptionExpiresAt: string | null;
  subscriptionPlanType: string;
  daysRemaining: number;
}

// Deprecated - Las suscripciones ahora son por pulsera
export interface SubscriptionStatus {
  isActive: boolean;
  daysRemaining: number;
  expiresAt: string | null;
  planType?: string;
  nextBillingDate?: string;
}

export interface SubscriptionFormData {
  planType: string;
  paymentData: {
    cardNumber: string;
    expiryDate: string;
    cvv: string;
    cardHolderName: string;
  };
  customerData: {
    fullName: string;
    email: string;
    phone: string;
  };
  quantity?: number;
}

// Medical data types
export interface Enfermedad {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

export interface PrincipioActivo {
  id: number;
  nombre: string;
  descripcion?: string;
  nombreComercial?: string;
  concentracion?: string;
  activo: boolean;
}

// Assignment form data
export interface AssignPulseraFormData {
  portadorEmail: string;
  portadorRut: string;
  firstName: string;
  paternalSurname: string;
  maternalSurname?: string;
  medicalInfo?: string;
  medicamentos?: string;
  enfermedadIds?: number[];
  principioActivoIds?: number[];
}