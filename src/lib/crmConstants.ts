/**
 * CRM Shared Constants
 * Centralized constants for CRM module to avoid duplication
 */

import { COMPANY_CATEGORIES, CompanyCategory, CompanyType } from "./crmTypes";

// ============================================
// Gender Options
// ============================================
export const GENDER_OPTIONS = [
  { value: "male", label: "Monsieur" },
  { value: "female", label: "Madame" },
  { value: "other", label: "Autre" },
] as const;

export type GenderValue = typeof GENDER_OPTIONS[number]["value"];

// ============================================
// Industry Labels
// ============================================
const INDUSTRY_LABELS: Record<string, string> = {
  // Promoteurs
  "promoteur": "Promoteur",
  // BET
  "bet": "BET",
  "bet_structure": "BET Structure",
  "bet_fluides": "BET Fluides",
  "bet_environnement": "BET Environnement",
  "bet_acoustique": "BET Acoustique",
  "bet_vrd": "BET VRD",
  "bet_electricite": "BET Électricité",
  // Paysagiste & Agenceur
  "paysagiste": "Paysagiste",
  "agenceur": "Agenceur",
  // Public entities
  "epa_sem": "EPA/SEM",
  // Specialists
  "acousticien": "Acousticien",
  "economiste": "Économiste",
  "vrd": "VRD",
  "electricite": "Électricité",
  // Architecture & Construction
  "architecte": "Architecte",
  "constructeur": "Constructeur",
  "maitre_ouvrage": "Maître d'ouvrage",
  "entreprise_generale": "Entreprise Générale",
  // Control & Coordination
  "bureau_controle": "Bureau de Contrôle",
  "coordinateur_sps": "Coordinateur SPS",
  // Other professionals
  "geometre": "Géomètre",
  "notaire": "Notaire",
  "assureur": "Assureur",
  "banque": "Banque",
};

/**
 * Get a human-readable label for an industry type
 */
export function getIndustryLabel(industry: string | null): string | null {
  if (!industry) return null;
  return INDUSTRY_LABELS[industry] || industry.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

// ============================================
// Category Helpers
// ============================================

/**
 * Find the category from an industry type
 */
export function getCategoryFromIndustry(industry: string | null): CompanyCategory | "" {
  if (!industry) return "";
  for (const cat of COMPANY_CATEGORIES) {
    if (cat.types?.includes(industry as CompanyType)) {
      return cat.id;
    }
  }
  return "";
}

// ============================================
// Status Configuration
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
