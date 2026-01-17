// Project Types - Now fully dynamic from database
// This file only contains type definitions and shared constants

// ProjectType is now a string type since types are user-defined in workspace_settings
export type ProjectType = string;

export type PhaseStatus = "pending" | "in_progress" | "completed";

// Phase colors for visual differentiation
export const PHASE_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // violet
  "#EF4444", // red
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
  "#F97316", // orange
  "#6366F1", // indigo
  "#14B8A6", // teal
  "#A855F7"  // purple
];

export const PHASE_STATUS_CONFIG: Record<PhaseStatus, { label: string; color: string }> = {
  pending: { label: "À venir", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "En cours", color: "bg-primary text-primary-foreground" },
  completed: { label: "Terminée", color: "bg-emerald-500 text-white" }
};

// MOE Categories for simplified team management
export type MOECategory = "architecte" | "client" | "amo" | "bet" | "entreprise";

export interface MOECategoryConfig {
  value: MOECategory;
  label: string;
  labelPlural: string;
  icon: string;
  color: string;
}

export const MOE_CATEGORIES: MOECategoryConfig[] = [
  { value: "architecte", label: "Architecte", labelPlural: "Architectes", icon: "Compass", color: "#8B5CF6" },
  { value: "client", label: "Client", labelPlural: "Clients", icon: "Building2", color: "#3B82F6" },
  { value: "amo", label: "AMO", labelPlural: "AMO", icon: "Shield", color: "#F59E0B" },
  { value: "bet", label: "BET", labelPlural: "BET", icon: "Calculator", color: "#10B981" },
  { value: "entreprise", label: "Entreprise", labelPlural: "Entreprises", icon: "HardHat", color: "#EF4444" },
];

// BET Specialties - a single BET company can have multiple
export const BET_SPECIALTIES = [
  { value: "structure", label: "Structure" },
  { value: "fluides", label: "Fluides" },
  { value: "electricite", label: "Électricité" },
  { value: "thermique", label: "Thermique" },
  { value: "environnement", label: "Environnement" },
  { value: "acoustique", label: "Acoustique" },
  { value: "vrd", label: "VRD" },
  { value: "economie", label: "Économie" },
  { value: "eclairage", label: "Éclairage" },
  { value: "geotechnique", label: "Géotechnique" },
];

// Legacy MOE_ROLES for backward compatibility
export const MOE_ROLES = [
  { value: "architecte", label: "Architecte", category: "architecte" as MOECategory },
  { value: "architecte_interieur", label: "Architecte d'intérieur", category: "architecte" as MOECategory },
  { value: "paysagiste", label: "Paysagiste", category: "architecte" as MOECategory },
  { value: "scenographe", label: "Scénographe", category: "architecte" as MOECategory },
  { value: "graphiste", label: "Graphiste", category: "architecte" as MOECategory },
  { value: "client", label: "Maître d'ouvrage", category: "client" as MOECategory },
  { value: "client_representant", label: "Représentant MOA", category: "client" as MOECategory },
  { value: "amo", label: "Assistant MOA", category: "amo" as MOECategory },
  { value: "opc", label: "OPC", category: "amo" as MOECategory },
  { value: "csps", label: "CSPS", category: "amo" as MOECategory },
  { value: "controle_technique", label: "Bureau de contrôle", category: "amo" as MOECategory },
  { value: "bet", label: "BET", category: "bet" as MOECategory },
  { value: "geometre", label: "Géomètre", category: "bet" as MOECategory },
  { value: "entreprise_generale", label: "Entreprise générale", category: "entreprise" as MOECategory },
  { value: "entreprise_lot", label: "Entreprise de lot", category: "entreprise" as MOECategory },
  { value: "autre", label: "Autre", category: "entreprise" as MOECategory }
];

export function getRolesByCategory(category: MOECategory) {
  return MOE_ROLES.filter(r => r.category === category);
}

export function getBETSpecialtyLabel(value: string): string {
  const specialty = BET_SPECIALTIES.find(s => s.value === value);
  return specialty?.label || value;
}

export const LOT_STATUS = [
  { value: "pending", label: "En attente", color: "#6B7280" },
  { value: "in_progress", label: "En cours", color: "#3B82F6" },
  { value: "completed", label: "Terminé", color: "#10B981" },
  { value: "on_hold", label: "Suspendu", color: "#F59E0B" }
];

export const OBSERVATION_PRIORITY = [
  { value: "low", label: "Faible", color: "bg-slate-500" },
  { value: "normal", label: "Normal", color: "bg-blue-500" },
  { value: "high", label: "Important", color: "bg-amber-500" },
  { value: "critical", label: "Critique", color: "bg-red-500" }
];

export const OBSERVATION_STATUS = [
  { value: "open", label: "Ouverte" },
  { value: "in_progress", label: "En cours" },
  { value: "resolved", label: "Résolue" }
];

export const DELIVERABLE_STATUS = [
  { value: "pending", label: "En attente", color: "#6B7280" },
  { value: "in_progress", label: "En cours", color: "#F59E0B" },
  { value: "ready_to_send", label: "Prêt à envoyer", color: "#8B5CF6" },
  { value: "delivered", label: "Livré", color: "#3B82F6" },
  { value: "validated", label: "Validé", color: "#10B981" },
];

// Legacy PROJECT_TYPES for backward compatibility - use useProjectTypeSettings hook instead
export const PROJECT_TYPES = [
  { value: "interior", label: "Intérieur", icon: "Sofa", color: "#8B5CF6" },
  { value: "architecture", label: "Architecture", icon: "Building2", color: "#3B82F6" },
  { value: "scenography", label: "Scénographie", icon: "Theater", color: "#F59E0B" },
];
