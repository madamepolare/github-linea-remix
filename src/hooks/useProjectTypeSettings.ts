import { useMemo } from "react";
import { useWorkspaceSettings } from "./useWorkspaceSettings";

export interface ProjectTypeSetting {
  key: string;
  label: string;
  color: string;
  description?: string;
  icon?: string;
}

// Default icon mapping based on common project type keys
const ICON_MAPPING: Record<string, string> = {
  // Architecture / Spatial
  architecture: "Building2",
  archi: "Building2",
  interior: "Sofa",
  interieur: "Sofa",
  scenography: "Theater",
  scenographie: "Theater",
  urbanisme: "Map",
  paysage: "TreePine",
  
  // Interior specific
  amenagement: "LayoutGrid",
  retail: "Store",
  residential: "Home",
  hospitality: "UtensilsCrossed",
  workspace: "Building",
  bureaux: "Building",
  
  // Scenography specific
  exposition: "Frame",
  musee: "Landmark",
  evenement: "PartyPopper",
  stand: "Box",
  spectacle: "Sparkles",
  
  // Communication / Design
  campagne: "Megaphone",
  branding: "Palette",
  supports: "FileImage",
  video: "Video",
  photo: "Camera",
  print: "Printer",
  motion: "Play",
  web: "Globe",
  digital: "Globe",
  social: "Share2",
  
  // Generic
  construction: "HardHat",
  renovation: "Hammer",
  extension: "Maximize2",
  permis: "FileCheck",
};

function getIconForKey(key: string): string {
  const normalized = key.toLowerCase().replace(/[_-]/g, "");
  
  // Direct match
  if (ICON_MAPPING[normalized]) {
    return ICON_MAPPING[normalized];
  }
  
  // Partial match
  for (const [pattern, icon] of Object.entries(ICON_MAPPING)) {
    if (normalized.includes(pattern) || pattern.includes(normalized)) {
      return icon;
    }
  }
  
  return "FolderKanban";
}

export function useProjectTypeSettings() {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting } = useWorkspaceSettings("project_types");

  const projectTypes = useMemo<ProjectTypeSetting[]>(() => {
    if (!settings || settings.length === 0) return [];

    return settings
      .filter(s => s.is_active)
      .map(setting => {
        const value = setting.setting_value;
        
        return {
          key: setting.setting_key,
          label: value.label || setting.setting_key,
          color: value.color || "#3B82F6",
          description: value.description,
          icon: value.icon || getIconForKey(setting.setting_key),
        };
      });
  }, [settings]);

  return {
    projectTypes,
    isLoading,
    createSetting,
    updateSetting,
    deleteSetting,
    rawSettings: settings,
  };
}

// Export the icon getter for use in components
export function getProjectTypeIcon(key: string): string {
  return getIconForKey(key);
}
