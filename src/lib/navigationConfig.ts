import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Settings,
  FileStack,
  UsersRound,
  HardHat,
  Receipt,
  Trophy,
  LucideIcon,
} from "lucide-react";

export interface SubNavItem {
  key: string;
  label: string;
  href: string;
}

export interface QuickAction {
  key: string;
  label: string;
  icon?: LucideIcon;
  event: string; // Custom event to dispatch
}

export interface ModuleNavConfig {
  slug: string;
  title: string;
  icon: LucideIcon;
  href: string;
  isExtension?: boolean;
  subNav: SubNavItem[];
  quickActions?: QuickAction[];
}

// Centralized navigation configuration
export const MODULE_CONFIG: Record<string, ModuleNavConfig> = {
  dashboard: {
    slug: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    subNav: [],
    quickActions: [],
  },
  projects: {
    slug: "projects",
    title: "Projets",
    icon: FolderKanban,
    href: "/projects",
    subNav: [
      { key: "timeline", label: "Timeline", href: "/projects/timeline" },
      { key: "board", label: "Board", href: "/projects/board" },
      { key: "list", label: "Liste", href: "/projects/list" },
      { key: "grid", label: "Grille", href: "/projects/grid" },
    ],
    quickActions: [
      { key: "create-project", label: "Nouveau projet", event: "open-create-project" },
    ],
  },
  tasks: {
    slug: "tasks",
    title: "Tâches",
    icon: CheckSquare,
    href: "/tasks",
    subNav: [
      { key: "board", label: "Board", href: "/tasks/board" },
      { key: "list", label: "Liste", href: "/tasks/list" },
      { key: "archive", label: "Archives", href: "/tasks/archive" },
    ],
    quickActions: [
      { key: "create-task", label: "Nouvelle tâche", event: "open-create-task" },
    ],
  },
  crm: {
    slug: "crm",
    title: "CRM",
    icon: Users,
    href: "/crm",
    subNav: [
      { key: "overview", label: "Vue d'ensemble", href: "/crm/overview" },
      { key: "leads", label: "Pipelines", href: "/crm/leads" },
      { key: "contacts", label: "Contacts", href: "/crm/contacts" },
      { key: "companies", label: "Entreprises", href: "/crm/companies" },
    ],
    quickActions: [
      { key: "create-lead", label: "Nouvelle opportunité", event: "open-create-lead" },
      { key: "create-contact", label: "Nouveau contact", event: "open-create-contact" },
    ],
  },
  commercial: {
    slug: "commercial",
    title: "Commercial",
    icon: FileText,
    href: "/commercial",
    subNav: [
      { key: "all", label: "Tous", href: "/commercial/all" },
      { key: "quotes", label: "Devis", href: "/commercial/quotes" },
      { key: "contracts", label: "Contrats", href: "/commercial/contracts" },
      { key: "proposals", label: "Propositions", href: "/commercial/proposals" },
    ],
    quickActions: [
      { key: "create-document", label: "Nouveau document", event: "open-create-commercial" },
    ],
  },
  documents: {
    slug: "documents",
    title: "Documents",
    icon: FileStack,
    href: "/documents",
    isExtension: true,
    subNav: [
      { key: "dashboard", label: "Tableau de bord", href: "/documents/dashboard" },
      { key: "all", label: "Tous", href: "/documents/all" },
      { key: "administrative", label: "Administratif", href: "/documents/administrative" },
      { key: "project", label: "Projets", href: "/documents/project" },
      { key: "hr", label: "RH", href: "/documents/hr" },
    ],
    quickActions: [
      { key: "create-document", label: "Nouveau document", event: "open-create-document" },
    ],
  },
  team: {
    slug: "team",
    title: "Équipe",
    icon: UsersRound,
    href: "/team",
    isExtension: true,
    subNav: [
      { key: "users", label: "Utilisateurs", href: "/team/users" },
      { key: "time-tracking", label: "Suivi temps", href: "/team/time-tracking" },
      { key: "time-validation", label: "Validation", href: "/team/time-validation" },
      { key: "recruitment", label: "Recrutement", href: "/team/recruitment" },
      { key: "absences", label: "Absences", href: "/team/absences" },
      { key: "requests", label: "Demandes", href: "/team/requests" },
      { key: "evaluations", label: "Évaluations", href: "/team/evaluations" },
      { key: "directory", label: "Annuaire", href: "/team/directory" },
    ],
    quickActions: [],
  },
  chantier: {
    slug: "chantier",
    title: "Chantier",
    icon: HardHat,
    href: "/chantier",
    isExtension: true,
    subNav: [],
    quickActions: [],
  },
  tenders: {
    slug: "tenders",
    title: "Concours",
    icon: Trophy,
    href: "/tenders",
    isExtension: true,
    subNav: [
      { key: "kanban", label: "Kanban", href: "/tenders/kanban" },
      { key: "list", label: "Liste", href: "/tenders/list" },
    ],
    quickActions: [
      { key: "create-tender", label: "Nouveau concours", event: "open-create-tender" },
    ],
  },
  invoicing: {
    slug: "invoicing",
    title: "Facturation",
    icon: Receipt,
    href: "/invoicing",
    isExtension: true,
    subNav: [
      { key: "dashboard", label: "Tableau de bord", href: "/invoicing" },
      { key: "all", label: "Toutes", href: "/invoicing/all" },
      { key: "pending", label: "En attente", href: "/invoicing/pending" },
      { key: "paid", label: "Payées", href: "/invoicing/paid" },
      { key: "overdue", label: "En retard", href: "/invoicing/overdue" },
    ],
    quickActions: [
      { key: "create-invoice", label: "Nouvelle facture", event: "open-create-invoice" },
    ],
  },
  settings: {
    slug: "settings",
    title: "Paramètres",
    icon: Settings,
    href: "/settings",
    subNav: [],
    quickActions: [],
  },
};

// Module display order
export const CORE_MODULES = ["projects", "tasks", "crm", "commercial"];
export const EXTENSION_MODULES = ["documents", "team", "chantier", "tenders", "invoicing"];

// Helper to get module config from current path
export function getModuleFromPath(pathname: string): ModuleNavConfig | null {
  // Handle root path
  if (pathname === "/" || pathname === "") {
    return MODULE_CONFIG.dashboard;
  }

  // Find matching module
  const pathSegments = pathname.split("/").filter(Boolean);
  const moduleSlug = pathSegments[0];
  
  return MODULE_CONFIG[moduleSlug] || null;
}

// Helper to get active sub-nav item
export function getActiveSubNav(pathname: string, module: ModuleNavConfig): SubNavItem | null {
  if (!module.subNav.length) return null;
  
  // Exact match first
  const exactMatch = module.subNav.find(item => item.href === pathname);
  if (exactMatch) return exactMatch;
  
  // Starts with match
  const startsWith = module.subNav.find(item => pathname.startsWith(item.href));
  if (startsWith) return startsWith;
  
  // Default to first item
  return module.subNav[0];
}
