import { useWorkspaceSettings, type WorkspaceSetting } from "./useWorkspaceSettings";

// Default values - used when no settings are configured
const DEFAULT_BET_SPECIALTIES = [
  { key: "structure", label: "Structure", color: "#F97316" },
  { key: "fluides", label: "Fluides (CVC)", color: "#06B6D4" },
  { key: "electricite", label: "Électricité", color: "#EAB308" },
  { key: "acoustique", label: "Acoustique", color: "#8B5CF6" },
  { key: "thermique", label: "Thermique / RE2020", color: "#EF4444" },
  { key: "vrd", label: "VRD", color: "#D97706" },
  { key: "facade", label: "Façades", color: "#64748B" },
  { key: "environnement", label: "Environnement / HQE", color: "#16A34A" },
  { key: "economie", label: "Économie", color: "#3B82F6" },
  { key: "securite", label: "Sécurité incendie", color: "#F43F5E" },
  { key: "geotechnique", label: "Géotechnique", color: "#78716C" },
];

const DEFAULT_CONTACT_TYPES = [
  { key: "client", label: "Client", color: "#10B981" },
  { key: "partner", label: "Partenaire", color: "#8B5CF6" },
  { key: "supplier", label: "Fournisseur", color: "#3B82F6" },
  { key: "amo", label: "AMO", color: "#F59E0B" },
  { key: "bet", label: "BET", color: "#06B6D4" },
  { key: "entreprise", label: "Entreprise", color: "#EF4444" },
];

const DEFAULT_LEAD_SOURCES = [
  { key: "referral", label: "Recommandation", color: "#10B981" },
  { key: "website", label: "Site web", color: "#3B82F6" },
  { key: "linkedin", label: "LinkedIn", color: "#0077B5" },
  { key: "cold_call", label: "Prospection téléphonique", color: "#F59E0B" },
  { key: "event", label: "Événement / Salon", color: "#8B5CF6" },
  { key: "tender", label: "Appel d'offres", color: "#EC4899" },
  { key: "partner", label: "Partenaire", color: "#06B6D4" },
  { key: "press", label: "Presse / Publication", color: "#84CC16" },
  { key: "other", label: "Autre", color: "#6B7280" },
];

const DEFAULT_ACTIVITY_TYPES = [
  { key: "call", label: "Appel", color: "#10B981" },
  { key: "email", label: "Email", color: "#3B82F6" },
  { key: "meeting", label: "Réunion", color: "#8B5CF6" },
  { key: "note", label: "Note", color: "#EAB308" },
  { key: "task", label: "Tâche", color: "#F97316" },
  { key: "proposal", label: "Proposition", color: "#EC4899" },
  { key: "site_visit", label: "Visite site", color: "#14B8A6" },
  { key: "document", label: "Document", color: "#64748B" },
];

export interface CRMSettingItem {
  key: string;
  label: string;
  color: string;
  icon?: string;
}

function transformSettings(
  settings: WorkspaceSetting[],
  defaults: { key: string; label: string; color: string }[]
): CRMSettingItem[] {
  if (settings.length === 0) {
    return defaults;
  }

  return settings
    .filter((s) => s.is_active)
    .map((s) => ({
      key: s.setting_key,
      label: s.setting_value.label,
      color: s.setting_value.color || "#6B7280",
      icon: s.setting_value.icon,
    }));
}

export function useCRMSettings() {
  const { settings: betSettings, isLoading: betLoading } = useWorkspaceSettings("bet_specialties");
  const { settings: contactTypeSettings, isLoading: contactLoading } = useWorkspaceSettings("contact_types");
  const { settings: leadSourceSettings, isLoading: leadLoading } = useWorkspaceSettings("lead_sources");
  const { settings: activityTypeSettings, isLoading: activityLoading } = useWorkspaceSettings("activity_types");

  const betSpecialties = transformSettings(betSettings, DEFAULT_BET_SPECIALTIES);
  const contactTypes = transformSettings(contactTypeSettings, DEFAULT_CONTACT_TYPES);
  const leadSources = transformSettings(leadSourceSettings, DEFAULT_LEAD_SOURCES);
  const activityTypes = transformSettings(activityTypeSettings, DEFAULT_ACTIVITY_TYPES);

  const isLoading = betLoading || contactLoading || leadLoading || activityLoading;

  // Helper to get label by key
  const getBetSpecialtyLabel = (key: string): string => {
    const item = betSpecialties.find((s) => s.key === key);
    return item?.label || key;
  };

  const getBetSpecialtyColor = (key: string): string => {
    const item = betSpecialties.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  const getContactTypeLabel = (key: string): string => {
    const item = contactTypes.find((s) => s.key === key);
    return item?.label || key;
  };

  const getContactTypeColor = (key: string): string => {
    const item = contactTypes.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  const getLeadSourceLabel = (key: string): string => {
    const item = leadSources.find((s) => s.key === key);
    return item?.label || key;
  };

  const getLeadSourceColor = (key: string): string => {
    const item = leadSources.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  const getActivityTypeLabel = (key: string): string => {
    const item = activityTypes.find((s) => s.key === key);
    return item?.label || key;
  };

  const getActivityTypeColor = (key: string): string => {
    const item = activityTypes.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  return {
    // Raw lists for selects/dropdowns
    betSpecialties,
    contactTypes,
    leadSources,
    activityTypes,
    
    // Loading state
    isLoading,
    
    // Helper functions
    getBetSpecialtyLabel,
    getBetSpecialtyColor,
    getContactTypeLabel,
    getContactTypeColor,
    getLeadSourceLabel,
    getLeadSourceColor,
    getActivityTypeLabel,
    getActivityTypeColor,
  };
}
