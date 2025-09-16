import { STORAGE_KEYS } from '@/constants';
import type { OrderData } from '@/types';

// Format currency
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('es-CO');
};

// Format date
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-CO');
};

// Local storage utilities
export const storage = {
  get: <T>(key: string): T | null => {
    if (typeof window === 'undefined') return null;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },

  remove: (key: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(key);
  },

  clear: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.clear();
  },
};

// Order utilities
export const orderUtils = {
  savePendingOrder: (orderData: OrderData): void => {
    storage.set(STORAGE_KEYS.PENDING_ORDER, orderData);
  },

  getPendingOrder: (): OrderData | null => {
    return storage.get<OrderData>(STORAGE_KEYS.PENDING_ORDER);
  },

  clearPendingOrder: (): void => {
    storage.remove(STORAGE_KEYS.PENDING_ORDER);
  },

  saveLastOrder: (orderData: OrderData): void => {
    storage.set(STORAGE_KEYS.LAST_ORDER, orderData);
  },

  getLastOrder: (): OrderData | null => {
    return storage.get<OrderData>(STORAGE_KEYS.LAST_ORDER);
  },
};

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateCardNumber = (cardNumber: string): boolean => {
  const cleaned = cardNumber.replace(/\s/g, '');
  return /^[0-9]{13,19}$/.test(cleaned);
};

// Generate order ID
export const generateOrderId = (): string => {
  return `ORD-${Date.now()}`;
};

// Calculate total with quantity
export const calculateTotal = (pricePerUnit: number, quantity: number): number => {
  return pricePerUnit * quantity;
};

// Generate QR code URL
export const generateQrUrl = (qrCode: string): string => {
  return `${window.location.origin}/scan/${qrCode}`;
};

// Download file utility
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain'): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};

// Debounce utility
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Generate invoice content
export const generateInvoiceContent = (orderData: OrderData): string => {
  return `
FACTURA ELECTRÓNICA
==================

Bluko Life QR
Factura #: ${orderData.orderId}
Fecha: ${formatDate(orderData.paymentDate || new Date())}

Cliente: ${orderData.customerData?.fullName}
Email: ${orderData.customerData?.email}
Teléfono: ${orderData.customerData?.phone}

Dirección de Envío:
${orderData.customerData?.address}
${orderData.customerData?.city}, ${orderData.customerData?.department}

Productos:
- Pulsera Inteligente QR x${orderData.quantity}
  Precio unitario: $${formatCurrency(orderData.pricePerUnit)}
  Subtotal: $${formatCurrency(orderData.total)}

Envío: GRATIS
TOTAL: $${formatCurrency(orderData.total)}

Estado: PAGADO
Método de pago: Tarjeta de crédito

¡Gracias por tu compra!
  `;
};