import { useMemo } from "react";
import { SubNavItem } from "@/lib/navigationConfig";
import { useModules, useWorkspaceModules } from "@/hooks/useModules";

/**
 * Configuration for sub-nav items that require specific modules to be enabled
 */
const SUB_NAV_MODULE_REQUIREMENTS: Record<string, Record<string, string>> = {
  crm: {
    development: "ai-sales-agent", // "Dév. Commercial" tab requires AI Sales Agent module
  },
};

/**
 * Hook that filters sub-navigation items based on enabled modules
 */
export function useFilteredSubNav(moduleSlug: string, subNav: SubNavItem[]): SubNavItem[] {
  const { data: modules = [] } = useModules();
  const { data: workspaceModules = [] } = useWorkspaceModules();

  const isModuleEnabled = (slug: string): boolean => {
    const module = modules.find((m) => m.slug === slug);
    if (module?.is_core) return true;
    return workspaceModules.some((wm) => wm.module?.slug === slug);
  };

  return useMemo(() => {
    const requirements = SUB_NAV_MODULE_REQUIREMENTS[moduleSlug];
    if (!requirements) return subNav;

    return subNav.filter((item) => {
      const requiredModule = requirements[item.key];
      if (!requiredModule) return true;
      return isModuleEnabled(requiredModule);
    });
  }, [moduleSlug, subNav, modules, workspaceModules]);
}

/**
 * Hook to check if a specific sub-nav item should be visible
 */
export function useIsSubNavVisible(moduleSlug: string, subNavKey: string): boolean {
  const { data: modules = [] } = useModules();
  const { data: workspaceModules = [] } = useWorkspaceModules();

  const isModuleEnabled = (slug: string): boolean => {
    const module = modules.find((m) => m.slug === slug);
    if (module?.is_core) return true;
    return workspaceModules.some((wm) => wm.module?.slug === slug);
  };

  return useMemo(() => {
    const requirements = SUB_NAV_MODULE_REQUIREMENTS[moduleSlug];
    if (!requirements) return true;

    const requiredModule = requirements[subNavKey];
    if (!requiredModule) return true;

    return isModuleEnabled(requiredModule);
  }, [moduleSlug, subNavKey, modules, workspaceModules]);
}
