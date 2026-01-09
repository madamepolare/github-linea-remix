import { useMemo } from "react";
import { useWorkspaceSettings, WorkspaceSetting } from "./useWorkspaceSettings";
import { 
  DisciplineSlug, 
  DisciplineProjectType, 
  getProjectTypes as getDisciplineProjectTypes,
  DISCIPLINE_CONFIGS 
} from "@/lib/disciplinesConfig";

export interface ProjectTypeSetting {
  key: string;
  label: string;
  color: string;
  description?: string;
  icon?: string;
  // The discipline this represents (architecture, interior, scenography, communication)
  disciplineSlug: DisciplineSlug | null;
  // Subtypes for this discipline from disciplinesConfig
  subTypes: DisciplineProjectType[];
}

export function useProjectTypeSettings() {
  const { settings, isLoading, createSetting, updateSetting, deleteSetting } = useWorkspaceSettings("project_types");

  const projectTypes = useMemo<ProjectTypeSetting[]>(() => {
    if (!settings || settings.length === 0) return [];

    return settings
      .filter(s => s.is_active)
      .map(setting => {
        const value = setting.setting_value;
        const disciplineSlug = mapKeyToDisciplineSlug(setting.setting_key);
        
        return {
          key: setting.setting_key,
          label: value.label || setting.setting_key,
          color: value.color || "#3B82F6",
          description: value.description,
          icon: value.icon,
          disciplineSlug,
          subTypes: disciplineSlug ? getDisciplineProjectTypes(disciplineSlug) : [],
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

// Map workspace setting keys to discipline slugs
function mapKeyToDisciplineSlug(key: string): DisciplineSlug | null {
  const mapping: Record<string, DisciplineSlug> = {
    architecture: "architecture",
    interior: "interior",
    scenography: "scenography",
    communication: "communication",
    // Common variations
    interieur: "interior",
    scenographie: "scenography",
    archi: "architecture",
  };
  
  const normalized = key.toLowerCase().replace(/[_-]/g, "");
  
  // Direct match
  if (mapping[normalized]) {
    return mapping[normalized];
  }
  
  // Check if key contains discipline name
  for (const [pattern, slug] of Object.entries(mapping)) {
    if (normalized.includes(pattern)) {
      return slug;
    }
  }
  
  return null;
}

// Get icon component name based on discipline
export function getDisciplineIcon(disciplineSlug: DisciplineSlug | null): string {
  if (!disciplineSlug) return "Building2";
  
  const config = DISCIPLINE_CONFIGS[disciplineSlug];
  return config ? config.icon.name || "Building2" : "Building2";
}
