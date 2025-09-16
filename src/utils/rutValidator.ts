// Utilidad para validar RUT chileno en el frontend

export const validateRut = (rut: string): boolean => {
  if (!rut || rut.trim() === '') return false;

  // Remover puntos y guiones, convertir a mayúsculas
  const cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase();
  
  if (cleanRut.length < 2) return false;

  // Separar número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);

  try {
    const number = parseInt(rutNumber);
    return calculateCheckDigit(number) === checkDigit;
  } catch {
    return false;
  }
};

const calculateCheckDigit = (rut: number): string => {
  let sum = 0;
  let multiplier = 2;

  while (rut > 0) {
    sum += (rut % 10) * multiplier;
    rut = Math.floor(rut / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const remainder = sum % 11;
  const checkDigit = 11 - remainder;

  if (checkDigit === 11) return '0';
  if (checkDigit === 10) return 'K';
  return checkDigit.toString();
};

export const formatRut = (rut: string): string => {
  if (!validateRut(rut)) return rut;

  // Limpiar RUT
  const cleanRut = rut.replace(/[^0-9Kk]/g, '').toUpperCase();
  
  // Separar número y dígito verificador
  const rutNumber = cleanRut.slice(0, -1);
  const checkDigit = cleanRut.slice(-1);

  // Formatear con puntos
  let formatted = '';
  let count = 0;
  
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      formatted = '.' + formatted;
    }
    formatted = rutNumber[i] + formatted;
    count++;
  }

  return formatted + '-' + checkDigit;
};

export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9Kk]/g, '').toUpperCase();
};

// Auto-completar dígito verificador si el usuario solo ingresa números
export const autoCompleteRut = (rut: string): string => {
  const cleanedRut = cleanRut(rut);
  
  // Si ya tiene dígito verificador (al menos 2 caracteres), retornar tal como está
  if (cleanedRut.length >= 2) {
    return cleanedRut;
  }
  
  // Si solo tiene números (7-8 dígitos típicamente), calcular dígito verificador
  if (cleanedRut.length >= 7 && /^\d+$/.test(cleanedRut)) {
    try {
      const number = parseInt(cleanedRut);
      const checkDigit = calculateCheckDigit(number);
      return cleanedRut + checkDigit;
    } catch {
      return cleanedRut;
    }
  }
  
  return cleanedRut;
};

// Formatear RUT simple sin auto-completado (solo formato visual)
export const formatRutSimple = (value: string): string => {
  if (!value) return '';
  
  // Remover todo excepto números y K/k
  let cleaned = value.replace(/[^0-9Kk]/g, '').toUpperCase();
  
  // Si está vacío, retornar vacío
  if (!cleaned) return '';
  
  // Si solo tiene 1 carácter, retornarlo tal cual
  if (cleaned.length <= 1) return cleaned;
  
  // Separar número y posible dígito verificador
  let rutNumber = '';
  let checkDigit = '';
  
  // Si el último carácter es K o es un dígito y tenemos más de 1 carácter
  const lastChar = cleaned.slice(-1);
  if (cleaned.length > 1) {
    rutNumber = cleaned.slice(0, -1);
    checkDigit = lastChar;
  } else {
    rutNumber = cleaned;
  }
  
  // Formatear la parte numérica con puntos
  let formatted = '';
  let count = 0;
  
  // Procesar de derecha a izquierda para agregar puntos cada 3 dígitos
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    if (count > 0 && count % 3 === 0) {
      formatted = '.' + formatted;
    }
    formatted = rutNumber[i] + formatted;
    count++;
  }
  
  // Agregar guión y dígito verificador si existe
  return checkDigit ? formatted + '-' + checkDigit : formatted;
};

// Validar RUT con mensaje de error descriptivo
export const validateRutWithMessage = (rut: string): { isValid: boolean; message?: string } => {
  if (!rut || rut.trim() === '') {
    return { isValid: false, message: 'RUT es requerido' };
  }
  
  const cleanedRut = cleanRut(rut);
  
  if (cleanedRut.length < 2) {
    return { isValid: false, message: 'RUT debe tener al menos 2 caracteres' };
  }
  
  if (cleanedRut.length < 7) {
    return { isValid: false, message: 'RUT parece muy corto' };
  }
  
  if (!validateRut(rut)) {
    return { isValid: false, message: 'RUT inválido o dígito verificador incorrecto' };
  }
  
  return { isValid: true };
};