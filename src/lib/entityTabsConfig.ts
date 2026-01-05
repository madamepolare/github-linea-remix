import { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  FileText,
  Receipt,
  Briefcase,
  Users,
  Target,
  MessageSquare,
  Clock,
  Brain,
  FolderOpen,
  PenTool,
  Layers,
  ClipboardList,
  AlertTriangle,
  Building2,
  BarChart3,
  ListTodo,
  Settings,
} from "lucide-react";

export interface EntityTab {
  key: string;
  label: string;
  icon?: LucideIcon;
  badge?: number;
}

// Project detail tabs
export const PROJECT_TABS: EntityTab[] = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "calendar", label: "Calendrier", icon: Calendar },
  { key: "tasks", label: "Tâches", icon: CheckSquare },
  { key: "phases", label: "Phases", icon: Layers },
  { key: "deliverables", label: "Livrables", icon: FolderOpen },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "invoicing", label: "Facturation", icon: Receipt },
  { key: "commercial", label: "Commercial", icon: Briefcase },
];

// Lead detail tabs
export const LEAD_TABS: EntityTab[] = [
  { key: "overview", label: "Aperçu", icon: LayoutDashboard },
  { key: "activities", label: "Activités", icon: MessageSquare },
  { key: "tasks", label: "Tâches", icon: CheckSquare },
  { key: "details", label: "Détails", icon: Settings },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "invoicing", label: "Facturation", icon: Receipt },
  { key: "commercial", label: "Commercial", icon: Briefcase },
];

// Tender detail tabs
export const TENDER_TABS: EntityTab[] = [
  { key: "synthese", label: "Synthèse", icon: LayoutDashboard },
  { key: "analyse", label: "Analyse IA", icon: Brain },
  { key: "documents", label: "Documents", icon: FolderOpen },
  { key: "livrables", label: "Livrables", icon: CheckSquare },
  { key: "equipe", label: "Équipe", icon: Users },
  { key: "memoire", label: "Mémoire", icon: PenTool },
];

// Contact detail tabs
export const CONTACT_TABS: EntityTab[] = [
  { key: "info", label: "Informations", icon: LayoutDashboard },
  { key: "tasks", label: "Tâches", icon: CheckSquare },
  { key: "leads", label: "Opportunités", icon: Target },
];

// Company detail tabs  
export const COMPANY_TABS: EntityTab[] = [
  { key: "overview", label: "Informations", icon: LayoutDashboard },
  { key: "contacts", label: "Contacts", icon: Users },
  { key: "leads", label: "Opportunités", icon: Target },
  { key: "tasks", label: "Tâches", icon: CheckSquare },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "invoicing", label: "Facturation", icon: Receipt },
  { key: "commercial", label: "Commercial", icon: Briefcase },
];

// Chantier detail tabs
export const CHANTIER_TABS: EntityTab[] = [
  { key: "overview", label: "Vue d'ensemble", icon: LayoutDashboard },
  { key: "planning", label: "Planning", icon: Calendar },
  { key: "lots", label: "Lots", icon: Layers },
  { key: "meetings", label: "Réunions", icon: Users },
  { key: "reports", label: "Comptes-rendus", icon: ClipboardList },
  { key: "observations", label: "Observations", icon: AlertTriangle },
];

// Commercial document tabs
export const COMMERCIAL_DOC_TABS: EntityTab[] = [
  { key: "editor", label: "Éditeur", icon: PenTool },
  { key: "preview", label: "Aperçu", icon: LayoutDashboard },
];

// Entity type to tabs mapping
export const ENTITY_TABS_MAP: Record<string, EntityTab[]> = {
  project: PROJECT_TABS,
  lead: LEAD_TABS,
  tender: TENDER_TABS,
  contact: CONTACT_TABS,
  company: COMPANY_TABS,
  chantier: CHANTIER_TABS,
  commercial: COMMERCIAL_DOC_TABS,
};

// Helper to get tabs for entity type
export function getEntityTabs(entityType: string): EntityTab[] {
  return ENTITY_TABS_MAP[entityType] || [];
}

// Helper to get default tab for entity type
export function getDefaultTab(entityType: string): string {
  const tabs = getEntityTabs(entityType);
  return tabs[0]?.key || "overview";
}
