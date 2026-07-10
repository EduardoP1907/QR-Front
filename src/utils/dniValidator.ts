// Utilidad para validar DNI peruano en el frontend
// El DNI peruano son 8 dígitos numéricos, sin dígito verificador.

export const validateDni = (dni: string): boolean => {
  if (!dni || dni.trim() === '') return false;

  const cleaned = dni.trim();
  return /^\d{8}$/.test(cleaned);
};

export const formatDni = (dni: string): string => {
  return dni.replace(/[^0-9]/g, '').slice(0, 8);
};

export const validateDniWithMessage = (dni: string): { isValid: boolean; message?: string } => {
  if (!dni || dni.trim() === '') {
    return { isValid: false, message: 'DNI es requerido' };
  }

  const cleaned = dni.replace(/[^0-9]/g, '');

  if (cleaned.length < 8) {
    return { isValid: false, message: 'DNI debe tener 8 dígitos' };
  }

  if (!validateDni(dni)) {
    return { isValid: false, message: 'DNI inválido: debe tener 8 dígitos numéricos' };
  }

  return { isValid: true };
};
