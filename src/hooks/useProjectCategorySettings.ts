import { useMemo } from "react";
import { useWorkspaceSettings } from "./useWorkspaceSettings";
import { 
  ProjectCategory, 
  ProjectCategoryConfig, 
  PROJECT_CATEGORIES,
  getProjectCategoryConfig 
} from "@/lib/projectCategories";

export interface WorkspaceProjectCategory extends ProjectCategoryConfig {
  isEnabled: boolean;
  customLabel?: string;
  customDescription?: string;
}

/**
 * Hook to manage project categories per workspace
 * Categories can be enabled/disabled and labels can be customized
 * Features (hasBudget, hasPhases, etc.) remain fixed as they define business logic
 */
export function useProjectCategorySettings() {
  const { 
    settings, 
    isLoading, 
    createSetting, 
    updateSetting, 
    deleteSetting 
  } = useWorkspaceSettings("project_categories");

  // Merge default categories with workspace overrides
  const categories = useMemo<WorkspaceProjectCategory[]>(() => {
    return PROJECT_CATEGORIES.map(defaultCategory => {
      // Find workspace override for this category
      const override = settings?.find(s => s.setting_key === defaultCategory.key);
      
      if (override) {
        return {
          ...defaultCategory,
          isEnabled: override.is_active,
          customLabel: override.setting_value?.label,
          customDescription: override.setting_value?.description,
          // Override label/description if customized
          label: override.setting_value?.label || defaultCategory.label,
          labelShort: (override.setting_value?.labelShort as string) || defaultCategory.labelShort,
          description: override.setting_value?.description || defaultCategory.description,
          color: override.setting_value?.color || defaultCategory.color,
          icon: override.setting_value?.icon || defaultCategory.icon,
        };
      }
      
      // No override = enabled by default
      return {
        ...defaultCategory,
        isEnabled: true,
      };
    });
  }, [settings]);

  // Get only enabled categories
  const enabledCategories = useMemo(() => {
    return categories.filter(c => c.isEnabled);
  }, [categories]);

  // Check if a category is enabled
  const isCategoryEnabled = (key: ProjectCategory): boolean => {
    const category = categories.find(c => c.key === key);
    return category?.isEnabled ?? true;
  };

  // Get category config with workspace overrides
  const getCategoryConfig = (key: ProjectCategory): WorkspaceProjectCategory => {
    return categories.find(c => c.key === key) || {
      ...getProjectCategoryConfig(key),
      isEnabled: true,
    };
  };

  // Update category settings (enable/disable, customize labels)
  const updateCategory = async (
    key: ProjectCategory,
    updates: {
      isEnabled?: boolean;
      label?: string;
      labelShort?: string;
      description?: string;
      color?: string;
      icon?: string;
    }
  ) => {
    const existingOverride = settings?.find(s => s.setting_key === key);
    const defaultConfig = getProjectCategoryConfig(key);

    const settingValue = {
      label: updates.label ?? existingOverride?.setting_value?.label ?? defaultConfig.label,
      labelShort: updates.labelShort ?? existingOverride?.setting_value?.labelShort ?? defaultConfig.labelShort,
      description: updates.description ?? existingOverride?.setting_value?.description ?? defaultConfig.description,
      color: updates.color ?? existingOverride?.setting_value?.color ?? defaultConfig.color,
      icon: updates.icon ?? existingOverride?.setting_value?.icon ?? defaultConfig.icon,
    };

    if (existingOverride) {
      await updateSetting.mutateAsync({
        id: existingOverride.id,
        setting_value: settingValue,
        is_active: updates.isEnabled ?? existingOverride.is_active,
      });
    } else {
      await createSetting.mutateAsync({
        setting_type: "project_categories",
        setting_key: key,
        setting_value: settingValue,
        is_active: updates.isEnabled ?? true,
        sort_order: PROJECT_CATEGORIES.findIndex(c => c.key === key),
      });
    }
  };

  // Reset a category to defaults
  const resetCategory = async (key: ProjectCategory) => {
    const existingOverride = settings?.find(s => s.setting_key === key);
    if (existingOverride) {
      await deleteSetting.mutateAsync(existingOverride.id);
    }
  };

  // Initialize all categories with default values
  const initializeDefaults = async () => {
    for (const category of PROJECT_CATEGORIES) {
      const exists = settings?.some(s => s.setting_key === category.key);
      if (!exists) {
        await createSetting.mutateAsync({
          setting_type: "project_categories",
          setting_key: category.key,
          setting_value: {
            label: category.label,
            labelShort: category.labelShort,
            description: category.description,
            color: category.color,
            icon: category.icon,
          },
          is_active: true,
          sort_order: PROJECT_CATEGORIES.findIndex(c => c.key === category.key),
        });
      }
    }
  };

  return {
    categories,
    enabledCategories,
    isLoading,
    isCategoryEnabled,
    getCategoryConfig,
    updateCategory,
    resetCategory,
    initializeDefaults,
    rawSettings: settings,
  };
}
