import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Building2,
  FileText,
  Receipt,
  Trophy,
  Megaphone,
  Calendar,
  Activity,
  Zap,
  TrendingUp,
  Clock,
  CheckSquare,
  AlertTriangle,
  Shield,
  Image,
  Palette,
  Box,
  UserCircle,
  PieChart,
  BarChart3,
  Target,
  Briefcase,
  Mail,
  Bell,
  Layers,
  Grid3X3,
} from "lucide-react";
import { WidgetConfig, WidgetModule } from "./types";

export const WIDGET_REGISTRY: WidgetConfig[] = [
  // ===== GENERAL =====
  {
    id: "welcome",
    type: "welcome",
    title: "Bienvenue",
    module: "general",
    icon: LayoutDashboard,
    defaultSize: "wide",
    minW: 2,
    minH: 1,
    maxH: 2,
  },
  {
    id: "quick-actions",
    type: "quick-actions",
    title: "Actions rapides",
    module: "general",
    icon: Zap,
    defaultSize: "wide",
    minW: 2,
    minH: 1,
    maxH: 2,
  },
  {
    id: "activity-feed",
    type: "activity-feed",
    title: "Activité récente",
    module: "general",
    icon: Activity,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "notifications",
    type: "notifications",
    title: "Notifications",
    module: "general",
    icon: Bell,
    defaultSize: "small",
    minW: 1,
    minH: 2,
  },

  // ===== PROJECTS =====
  {
    id: "projects-stats",
    type: "projects-stats",
    title: "Statistiques projets",
    module: "projects",
    icon: FolderKanban,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "projects-pipeline",
    type: "projects-pipeline",
    title: "Pipeline projets",
    module: "projects",
    icon: BarChart3,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },
  {
    id: "projects-active",
    type: "projects-active",
    title: "Projets actifs",
    module: "projects",
    icon: FolderKanban,
    defaultSize: "large",
    minW: 2,
    minH: 2,
  },
  {
    id: "projects-tasks",
    type: "projects-tasks",
    title: "Tâches à venir",
    module: "projects",
    icon: CheckSquare,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "projects-deadlines",
    type: "projects-deadlines",
    title: "Échéances proches",
    module: "projects",
    icon: Clock,
    defaultSize: "small",
    minW: 1,
    minH: 2,
  },

  // ===== CRM =====
  {
    id: "crm-stats",
    type: "crm-stats",
    title: "Statistiques CRM",
    module: "crm",
    icon: Users,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "crm-leads",
    type: "crm-leads",
    title: "Leads récents",
    module: "crm",
    icon: UserCircle,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "crm-companies",
    type: "crm-companies",
    title: "Entreprises",
    module: "crm",
    icon: Building2,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },

  // ===== COMMERCIAL =====
  {
    id: "commercial-stats",
    type: "commercial-stats",
    title: "Statistiques commerciales",
    module: "commercial",
    icon: Briefcase,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "commercial-pipeline",
    type: "commercial-pipeline",
    title: "Pipeline commercial",
    module: "commercial",
    icon: TrendingUp,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },
  {
    id: "commercial-quotes",
    type: "commercial-quotes",
    title: "Devis récents",
    module: "commercial",
    icon: FileText,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },

  // ===== CAMPAIGNS =====
  {
    id: "campaigns-stats",
    type: "campaigns-stats",
    title: "Statistiques campagnes",
    module: "campaigns",
    icon: Megaphone,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "campaigns-active",
    type: "campaigns-active",
    title: "Campagnes actives",
    module: "campaigns",
    icon: Target,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "campaigns-calendar",
    type: "campaigns-calendar",
    title: "Planning publications",
    module: "campaigns",
    icon: Calendar,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },

  // ===== TENDERS =====
  {
    id: "tenders-stats",
    type: "tenders-stats",
    title: "Statistiques appels d'offres",
    module: "tenders",
    icon: Trophy,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "tenders-active",
    type: "tenders-active",
    title: "Appels d'offres actifs",
    module: "tenders",
    icon: Trophy,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "tenders-deadlines",
    type: "tenders-deadlines",
    title: "Échéances AO",
    module: "tenders",
    icon: AlertTriangle,
    defaultSize: "small",
    minW: 1,
    minH: 2,
  },

  // ===== INVOICING =====
  {
    id: "invoicing-stats",
    type: "invoicing-stats",
    title: "Statistiques facturation",
    module: "invoicing",
    icon: Receipt,
    defaultSize: "medium",
    minW: 1,
    minH: 1,
  },
  {
    id: "invoicing-pending",
    type: "invoicing-pending",
    title: "Factures en attente",
    module: "invoicing",
    icon: Clock,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "invoicing-chart",
    type: "invoicing-chart",
    title: "Évolution CA",
    module: "invoicing",
    icon: PieChart,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },
  {
    id: "invoicing-by-category",
    type: "invoicing-by-category",
    title: "CA par catégorie",
    module: "invoicing",
    icon: Layers,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "invoicing-by-type",
    type: "invoicing-by-type",
    title: "CA par type de projet",
    module: "invoicing",
    icon: Grid3X3,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },

  // ===== DOCUMENTS =====
  {
    id: "documents-stats",
    type: "documents-stats",
    title: "Statistiques documents",
    module: "documents",
    icon: FileText,
    defaultSize: "small",
    minW: 1,
    minH: 1,
  },
  {
    id: "documents-expiring",
    type: "documents-expiring",
    title: "Documents à renouveler",
    module: "documents",
    icon: AlertTriangle,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "documents-recent",
    type: "documents-recent",
    title: "Documents récents",
    module: "documents",
    icon: FileText,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },

  // ===== TEAM =====
  {
    id: "team-stats",
    type: "team-stats",
    title: "Statistiques équipe",
    module: "team",
    icon: Users,
    defaultSize: "small",
    minW: 1,
    minH: 1,
  },
  {
    id: "team-members",
    type: "team-members",
    title: "Membres de l'équipe",
    module: "team",
    icon: Users,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "team-workload",
    type: "team-workload",
    title: "Charge de travail",
    module: "team",
    icon: BarChart3,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },

  // ===== REFERENCES =====
  {
    id: "references-recent",
    type: "references-recent",
    title: "Références récentes",
    module: "references",
    icon: Image,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "references-featured",
    type: "references-featured",
    title: "Références à la une",
    module: "references",
    icon: Image,
    defaultSize: "wide",
    minW: 2,
    minH: 2,
  },

  // ===== MATERIALS =====
  {
    id: "materials-recent",
    type: "materials-recent",
    title: "Matériaux récents",
    module: "materials",
    icon: Palette,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "materials-categories",
    type: "materials-categories",
    title: "Catégories matériaux",
    module: "materials",
    icon: Palette,
    defaultSize: "small",
    minW: 1,
    minH: 2,
  },

  // ===== OBJECTS =====
  {
    id: "objects-recent",
    type: "objects-recent",
    title: "Objets récents",
    module: "objects",
    icon: Box,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "objects-favorites",
    type: "objects-favorites",
    title: "Objets favoris",
    module: "objects",
    icon: Box,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },

  // ===== PERMITS & INSURANCES =====
  {
    id: "permits-upcoming",
    type: "permits-upcoming",
    title: "Permis à suivre",
    module: "projects",
    icon: Shield,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
  {
    id: "insurances-expiring",
    type: "insurances-expiring",
    title: "Assurances à renouveler",
    module: "projects",
    icon: Shield,
    defaultSize: "medium",
    minW: 1,
    minH: 2,
  },
];

export function getWidgetsByModule(): Record<WidgetModule, WidgetConfig[]> {
  const byModule: Record<WidgetModule, WidgetConfig[]> = {
    general: [],
    projects: [],
    crm: [],
    commercial: [],
    campaigns: [],
    tenders: [],
    invoicing: [],
    documents: [],
    team: [],
    references: [],
    materials: [],
    objects: [],
  };

  WIDGET_REGISTRY.forEach((widget) => {
    byModule[widget.module].push(widget);
  });

  return byModule;
}

export function getWidgetById(id: string): WidgetConfig | undefined {
  return WIDGET_REGISTRY.find((w) => w.id === id);
}

export function getSizeDefaults(size: string): { w: number; h: number } {
  switch (size) {
    case "small":
      return { w: 1, h: 2 };
    case "medium":
      return { w: 2, h: 2 };
    case "large":
      return { w: 2, h: 3 };
    case "wide":
      return { w: 4, h: 2 };
    case "tall":
      return { w: 1, h: 4 };
    default:
      return { w: 2, h: 2 };
  }
}
