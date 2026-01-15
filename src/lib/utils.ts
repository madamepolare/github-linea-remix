import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Currency Formatting
// ============================================

/**
 * Format a number as currency (EUR)
 * @param value - The number to format
 * @param options - Formatting options
 */
export function formatCurrency(
  value: number,
  options?: {
    compact?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  if (options?.compact) {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M€`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k€`;
    }
    return `${value}€`;
  }

  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  }).format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(value: number): string {
  return `${value}%`;
}
