import { useWorkspaceSettings, type WorkspaceSetting } from "./useWorkspaceSettings";
import {
  DEFAULT_BET_SPECIALTIES,
  DEFAULT_CONTACT_TYPES,
  DEFAULT_LEAD_SOURCES,
  DEFAULT_ACTIVITY_TYPES,
  DEFAULT_COMPANY_CATEGORIES,
  DEFAULT_COMPANY_TYPES,
} from "@/lib/crmDefaults";

export interface CRMSettingItem {
  key: string;
  label: string;
  color: string;
  icon?: string;
}

export interface CompanyTypeItem extends CRMSettingItem {
  shortLabel: string;
  category: string;
}

// Company categories no longer have types array - types reference categories via category field
export interface CompanyCategoryItem extends CRMSettingItem {}

function transformSettings(
  settings: WorkspaceSetting[],
  defaults: { key: string; label: string; color: string; icon?: string }[]
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

function transformCompanyTypes(
  settings: WorkspaceSetting[],
  defaults: { key: string; label: string; shortLabel: string; category: string; color: string }[]
): CompanyTypeItem[] {
  if (settings.length === 0) {
    return defaults;
  }

  return settings
    .filter((s) => s.is_active)
    .map((s) => ({
      key: s.setting_key,
      label: s.setting_value.label,
      shortLabel: (s.setting_value.shortLabel as string) || s.setting_value.label,
      category: s.setting_value.category || "autre",
      color: s.setting_value.color || "#6B7280",
    }));
}

function transformCompanyCategories(
  settings: WorkspaceSetting[],
  defaults: { key: string; label: string; color: string }[]
): CompanyCategoryItem[] {
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
  const { settings: companyTypeSettings, isLoading: companyTypeLoading } = useWorkspaceSettings("company_types");
  const { settings: companyCategorySettings, isLoading: companyCategoryLoading } = useWorkspaceSettings("company_categories");

  const betSpecialties = transformSettings(betSettings, DEFAULT_BET_SPECIALTIES);
  const contactTypes = transformSettings(contactTypeSettings, DEFAULT_CONTACT_TYPES);
  const leadSources = transformSettings(leadSourceSettings, DEFAULT_LEAD_SOURCES);
  const activityTypes = transformSettings(activityTypeSettings, DEFAULT_ACTIVITY_TYPES);
  const companyTypes = transformCompanyTypes(companyTypeSettings, DEFAULT_COMPANY_TYPES);
  const companyCategories = transformCompanyCategories(companyCategorySettings, DEFAULT_COMPANY_CATEGORIES);

  const isLoading = betLoading || contactLoading || leadLoading || activityLoading || companyTypeLoading || companyCategoryLoading;

  // === BET Specialties helpers ===
  const getBetSpecialtyLabel = (key: string): string => {
    const item = betSpecialties.find((s) => s.key === key);
    return item?.label || key;
  };

  const getBetSpecialtyColor = (key: string): string => {
    const item = betSpecialties.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  // === Contact Types helpers ===
  const getContactTypeLabel = (key: string): string => {
    const item = contactTypes.find((s) => s.key === key);
    return item?.label || key;
  };

  const getContactTypeColor = (key: string): string => {
    const item = contactTypes.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  // === Lead Sources helpers ===
  const getLeadSourceLabel = (key: string): string => {
    const item = leadSources.find((s) => s.key === key);
    return item?.label || key;
  };

  const getLeadSourceColor = (key: string): string => {
    const item = leadSources.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  // === Activity Types helpers ===
  const getActivityTypeLabel = (key: string): string => {
    const item = activityTypes.find((s) => s.key === key);
    return item?.label || key;
  };

  const getActivityTypeColor = (key: string): string => {
    const item = activityTypes.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  // === Company Types helpers ===
  const getCompanyTypeLabel = (key: string): string => {
    const item = companyTypes.find((s) => s.key === key);
    return item?.label || key;
  };

  const getCompanyTypeShortLabel = (key: string): string => {
    const item = companyTypes.find((s) => s.key === key);
    return item?.shortLabel || key;
  };

  const getCompanyTypeColor = (key: string): string => {
    const item = companyTypes.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  const getCompanyTypeCategory = (key: string): string => {
    const item = companyTypes.find((s) => s.key === key);
    return item?.category || "autre";
  };

  // === Company Categories helpers ===
  const getCompanyCategoryLabel = (key: string): string => {
    const item = companyCategories.find((s) => s.key === key);
    return item?.label || key;
  };

  const getCompanyCategoryColor = (key: string): string => {
    const item = companyCategories.find((s) => s.key === key);
    return item?.color || "#6B7280";
  };

  // Get all types that belong to a category (via their category field)
  const getCompanyTypesForCategory = (categoryKey: string): CompanyTypeItem[] => {
    return companyTypes.filter((t) => t.category === categoryKey);
  };

  const getCategoryFromType = (typeKey: string): string | null => {
    const type = companyTypes.find((t) => t.key === typeKey);
    return type?.category || null;
  };

  return {
    // Raw lists for selects/dropdowns
    betSpecialties,
    contactTypes,
    leadSources,
    activityTypes,
    companyTypes,
    companyCategories,
    
    // Loading state
    isLoading,
    
    // BET Specialty helpers
    getBetSpecialtyLabel,
    getBetSpecialtyColor,
    
    // Contact Type helpers
    getContactTypeLabel,
    getContactTypeColor,
    
    // Lead Source helpers
    getLeadSourceLabel,
    getLeadSourceColor,
    
    // Activity Type helpers
    getActivityTypeLabel,
    getActivityTypeColor,
    
    // Company Type helpers
    getCompanyTypeLabel,
    getCompanyTypeShortLabel,
    getCompanyTypeColor,
    getCompanyTypeCategory,
    
    // Company Category helpers
    getCompanyCategoryLabel,
    getCompanyCategoryColor,
    getCompanyTypesForCategory,
    getCategoryFromType,
  };
}
