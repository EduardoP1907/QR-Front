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
  register: (userData: RegisterData) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<any>;
  resendOtp: (email: string) => Promise<any>;
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

// Subscription types
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
  contactInfo?: string;
  medicalInfo?: string;
  emergencyContact?: string;
  medicamentos?: string;
  enfermedadIds?: number[];
  principioActivoIds?: number[];
}