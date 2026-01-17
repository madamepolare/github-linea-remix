import { useMemo } from "react";
import { useWorkspaceSettings } from "./useWorkspaceSettings";
import { ProjectCategory, ProjectCategoryFeatures, ProjectCategoryConfig } from "@/lib/projectCategories";

export interface WorkspaceProjectCategory {
  key: string;
  label: string;
  labelShort: string;
  description: string;
  icon: string;
  color: string;
  features: ProjectCategoryFeatures;
  isEnabled: boolean;
}

// Default features for fallback
const DEFAULT_FEATURES: ProjectCategoryFeatures = {
  hasBudget: true,
  hasEndDate: true,
  hasMonthlyBudget: false,
  hasAutoRenew: false,
  isBillable: true,
  hasPhases: true,
  hasDeliverables: true,
};

/**
 * Hook to manage project categories from workspace settings
 * Categories are now fully dynamic and stored in the database
 */
export function useProjectCategorySettings() {
  const { 
    settings, 
    isLoading, 
    createSetting, 
    updateSetting, 
    deleteSetting,
    reorderSettings,
  } = useWorkspaceSettings("project_categories");

  // Transform settings to categories
  const categories = useMemo<WorkspaceProjectCategory[]>(() => {
    return settings.map(setting => {
      const value = setting.setting_value;
      const features = (value.features as ProjectCategoryFeatures) || DEFAULT_FEATURES;
      
      return {
        key: setting.setting_key,
        label: value.label || setting.setting_key,
        labelShort: (value.labelShort as string) || value.label || setting.setting_key,
        description: value.description || "",
        icon: (value.icon as string) || "Briefcase",
        color: value.color || "#3B82F6",
        features: {
          hasBudget: features.hasBudget ?? true,
          hasEndDate: features.hasEndDate ?? true,
          hasMonthlyBudget: features.hasMonthlyBudget ?? false,
          hasAutoRenew: features.hasAutoRenew ?? false,
          isBillable: features.isBillable ?? true,
          hasPhases: features.hasPhases ?? true,
          hasDeliverables: features.hasDeliverables ?? true,
        },
        isEnabled: setting.is_active,
      };
    });
  }, [settings]);

  // Get only enabled categories
  const enabledCategories = useMemo(() => {
    return categories.filter(c => c.isEnabled);
  }, [categories]);

  // Check if a category is enabled
  const isCategoryEnabled = (key: string): boolean => {
    const category = categories.find(c => c.key === key);
    return category?.isEnabled ?? false;
  };

  // Get category config with all features
  const getCategoryConfig = (key: string): WorkspaceProjectCategory => {
    const found = categories.find(c => c.key === key);
    if (found) return found;
    
    // Return first enabled category as fallback, or a default
    if (enabledCategories.length > 0) {
      return enabledCategories[0];
    }
    
    // Ultimate fallback
    return {
      key: "standard",
      label: "Projet client",
      labelShort: "Client",
      description: "Projet facturable",
      icon: "Briefcase",
      color: "#3B82F6",
      features: DEFAULT_FEATURES,
      isEnabled: true,
    };
  };

  // Update category settings
  const updateCategory = async (
    settingId: string,
    updates: Partial<{
      key: string;
      label: string;
      labelShort: string;
      description: string;
      icon: string;
      color: string;
      features: Partial<ProjectCategoryFeatures>;
      isEnabled: boolean;
    }>
  ) => {
    const existing = settings.find(s => s.id === settingId);
    if (!existing) return;

    const currentFeatures = (existing.setting_value.features as ProjectCategoryFeatures) || DEFAULT_FEATURES;

    await updateSetting.mutateAsync({
      id: settingId,
      setting_key: updates.key ?? existing.setting_key,
      setting_value: {
        label: updates.label ?? existing.setting_value.label,
        labelShort: updates.labelShort ?? existing.setting_value.labelShort,
        description: updates.description ?? existing.setting_value.description,
        icon: updates.icon ?? existing.setting_value.icon,
        color: updates.color ?? existing.setting_value.color,
        features: {
          ...currentFeatures,
          ...updates.features,
        },
      },
      is_active: updates.isEnabled ?? existing.is_active,
    });
  };

  return {
    categories,
    enabledCategories,
    isLoading,
    isCategoryEnabled,
    getCategoryConfig,
    updateCategory,
    rawSettings: settings,
  };
}
