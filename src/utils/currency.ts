import { CURRENCY } from '@/constants';

/**
 * Formatea un precio en pesos chilenos
 * @param amount - Cantidad en CLP
 * @returns String formateado como "$15.000"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'currency',
    currency: CURRENCY.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un número con separadores de miles chilenos
 * @param amount - Número a formatear
 * @returns String formateado como "15.000"
 */
export function formatNumber(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale).format(amount);
}

/**
 * Calcula el total de una compra
 * @param quantity - Cantidad de pulseras
 * @param pricePerUnit - Precio por unidad
 * @returns Total calculado
 */
export function calculateTotal(quantity: number, pricePerUnit: number): number {
  return quantity * pricePerUnit;
}