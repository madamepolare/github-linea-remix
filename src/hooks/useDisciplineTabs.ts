import { useMemo } from "react";
import { 
  getDiscipline, 
  type DisciplineSlug,
  type TenderTabDef,
  type TenderSynthesisBlockDef,
  type TenderSectionDef,
} from "@/lib/disciplines";
import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  FolderOpen,
  Mail,
  ListTodo,
  PenTool,
  Euro,
  Lightbulb,
  FileText,
} from "lucide-react";

export interface EntityTab {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

// Map icon names to actual icons
const ICON_MAP: Record<string, LucideIcon> = {
  LayoutDashboard,
  Users,
  Calendar,
  CheckSquare,
  FolderOpen,
  Mail,
  ListTodo,
  PenTool,
  Euro,
  Lightbulb,
  FileText,
};

/**
 * Convert discipline tab config to entity tabs format
 */
function convertToEntityTabs(tabs: TenderTabDef[]): EntityTab[] {
  return tabs
    .filter(tab => tab.visible)
    .sort((a, b) => a.order - b.order)
    .map(tab => ({
      key: tab.key,
      label: tab.label,
      icon: ICON_MAP[tab.icon] || FileText,
    }));
}

/**
 * Get tender tabs for a specific discipline
 */
export function getTenderTabsForDiscipline(disciplineSlug: DisciplineSlug): EntityTab[] {
  const discipline = getDiscipline(disciplineSlug);
  return convertToEntityTabs(discipline.tenders.tabs);
}

/**
 * Get tender synthesis blocks for a specific discipline
 */
export function getTenderSynthesisBlocks(disciplineSlug: DisciplineSlug): TenderSynthesisBlockDef[] {
  const discipline = getDiscipline(disciplineSlug);
  return discipline.tenders.synthesisBlocks
    .filter(block => block.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get tender form sections for a specific discipline
 */
export function getTenderFormSections(disciplineSlug: DisciplineSlug): TenderSectionDef[] {
  const discipline = getDiscipline(disciplineSlug);
  return discipline.tenders.formSections
    .filter(section => section.visible)
    .sort((a, b) => a.order - b.order);
}

/**
 * Hook to get tabs for the current tender based on discipline
 */
export function useTenderTabs(disciplineSlug: DisciplineSlug | undefined) {
  return useMemo(() => {
    if (!disciplineSlug) {
      // Default to architecture
      return getTenderTabsForDiscipline('architecture');
    }
    return getTenderTabsForDiscipline(disciplineSlug);
  }, [disciplineSlug]);
}

/**
 * Hook to get synthesis blocks for the current tender
 */
export function useTenderSynthesisBlocks(disciplineSlug: DisciplineSlug | undefined) {
  return useMemo(() => {
    if (!disciplineSlug) {
      return getTenderSynthesisBlocks('architecture');
    }
    return getTenderSynthesisBlocks(disciplineSlug);
  }, [disciplineSlug]);
}

/**
 * Hook to get form sections for the current tender
 */
export function useTenderFormSections(disciplineSlug: DisciplineSlug | undefined) {
  return useMemo(() => {
    if (!disciplineSlug) {
      return getTenderFormSections('architecture');
    }
    return getTenderFormSections(disciplineSlug);
  }, [disciplineSlug]);
}

/**
 * Check if a specific tab is visible for a discipline
 */
export function isTabVisibleForDiscipline(
  tabKey: string, 
  disciplineSlug: DisciplineSlug
): boolean {
  const discipline = getDiscipline(disciplineSlug);
  const tab = discipline.tenders.tabs.find(t => t.key === tabKey);
  return tab?.visible ?? false;
}

/**
 * Get the component name to render for a specific tab
 */
export function getTabComponent(
  tabKey: string, 
  disciplineSlug: DisciplineSlug
): string | null {
  const discipline = getDiscipline(disciplineSlug);
  const tab = discipline.tenders.tabs.find(t => t.key === tabKey);
  return tab?.component ?? null;
}
