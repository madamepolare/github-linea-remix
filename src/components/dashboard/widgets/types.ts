import { LucideIcon } from "lucide-react";

export type WidgetSize = "small" | "medium" | "large" | "wide" | "tall";

export interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  module: WidgetModule;
  icon: LucideIcon;
  defaultSize: WidgetSize;
  minW: number;
  minH: number;
  maxW?: number;
  maxH?: number;
}

export type WidgetModule =
  | "general"
  | "projects"
  | "crm"
  | "commercial"
  | "campaigns"
  | "tenders"
  | "invoicing"
  | "documents"
  | "team"
  | "references"
  | "materials"
  | "objects";

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface DashboardLayout {
  widgets: WidgetLayout[];
  activeWidgets: string[];
}

export const MODULE_LABELS: Record<WidgetModule, string> = {
  general: "Général",
  projects: "Projets",
  crm: "CRM",
  commercial: "Commercial",
  campaigns: "Campagnes",
  tenders: "Appels d'offres",
  invoicing: "Facturation",
  documents: "Documents",
  team: "RH",
  references: "Références",
  materials: "Matériaux",
  objects: "Objets",
};

export const MODULE_COLORS: Record<WidgetModule, string> = {
  general: "bg-primary/10 text-primary",
  projects: "bg-info/10 text-info",
  crm: "bg-accent/10 text-accent",
  commercial: "bg-success/10 text-success",
  campaigns: "bg-warning/10 text-warning",
  tenders: "bg-destructive/10 text-destructive",
  invoicing: "bg-info/10 text-info",
  documents: "bg-muted text-muted-foreground",
  team: "bg-accent/10 text-accent",
  references: "bg-success/10 text-success",
  materials: "bg-warning/10 text-warning",
  objects: "bg-primary/10 text-primary",
};
