import { User, FolderKanban, Wallet, LayoutDashboard } from "lucide-react";

export type DashboardTemplate = "personal" | "projects" | "finance" | "custom";

export interface DashboardTemplateConfig {
  id: DashboardTemplate;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  widgets: string[];
}

export const DASHBOARD_TEMPLATES: DashboardTemplateConfig[] = [
  {
    id: "personal",
    name: "Mon Dashboard",
    description: "Vos tâches, notifications et activité personnelle",
    icon: User,
    widgets: [
      "welcome",
      "quick-actions",
      "projects-tasks",
      "activity-feed",
      "notifications",
    ],
  },
  {
    id: "projects",
    name: "Projets",
    description: "Vue d'ensemble des projets et leur avancement",
    icon: FolderKanban,
    widgets: [
      "projects-stats",
      "projects-pipeline",
      "projects-active",
      "projects-tasks",
      "projects-deadlines",
      "permits-upcoming",
    ],
  },
  {
    id: "finance",
    name: "Finance",
    description: "Facturation, devis et suivi financier",
    icon: Wallet,
    widgets: [
      "commercial-stats",
      "invoicing-stats",
      "commercial-pipeline",
      "invoicing-chart",
      "commercial-quotes",
      "invoicing-pending",
    ],
  },
  {
    id: "custom",
    name: "Personnalisé",
    description: "Votre configuration actuelle",
    icon: LayoutDashboard,
    widgets: [],
  },
];

export function getTemplateById(id: DashboardTemplate): DashboardTemplateConfig | undefined {
  return DASHBOARD_TEMPLATES.find((t) => t.id === id);
}
