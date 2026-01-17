/**
 * CRM Shared Constants
 * Minimal constants for CRM module - most values now come from useCRMSettings()
 */

// ============================================
// Gender Options (static, doesn't need to be dynamic)
// ============================================
export const GENDER_OPTIONS = [
  { value: "male", label: "Monsieur" },
  { value: "female", label: "Madame" },
  { value: "other", label: "Autre" },
] as const;

export type GenderValue = typeof GENDER_OPTIONS[number]["value"];

// ============================================
// Status Configuration (static UI styling)
// ============================================
export const ENTITY_STATUS_CONFIG = {
  lead: {
    label: "Lead",
    color: "hsl(var(--warning))",
    bgColor: "hsl(var(--warning) / 0.1)",
    borderColor: "hsl(var(--warning) / 0.3)",
    textColor: "hsl(var(--warning))",
  },
  confirmed: {
    label: "Confirmé",
    color: "hsl(var(--success))",
    bgColor: "hsl(var(--success) / 0.1)",
    borderColor: "hsl(var(--success) / 0.3)",
    textColor: "hsl(var(--success))",
  },
  prospect: {
    label: "Prospect",
    color: "hsl(var(--primary))",
    bgColor: "hsl(var(--primary) / 0.1)",
    borderColor: "hsl(var(--primary) / 0.3)",
    textColor: "hsl(var(--primary))",
  },
} as const;

export type EntityStatusType = keyof typeof ENTITY_STATUS_CONFIG;

// ============================================
// Location Parsing Helpers
// ============================================

/**
 * Parse a location string back to address parts
 * Format: "address, postal_code, city" or "address, city"
 */
export function parseLocationString(location: string | null | undefined): {
  address: string;
  postalCode: string;
  city: string;
} {
  if (!location) {
    return { address: "", postalCode: "", city: "" };
  }
  
  const parts = location.split(", ");
  
  if (parts.length >= 3) {
    return {
      address: parts[0] || "",
      postalCode: parts[1] || "",
      city: parts[2] || "",
    };
  } else if (parts.length === 2) {
    return {
      address: parts[0] || "",
      postalCode: "",
      city: parts[1] || "",
    };
  }
  
  return { address: location, postalCode: "", city: "" };
}

/**
 * Build a location string from address parts
 */
export function buildLocationString(
  address?: string,
  postalCode?: string,
  city?: string
): string | undefined {
  const parts = [address, postalCode, city].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}
