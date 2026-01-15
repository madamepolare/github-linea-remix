import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Palette,
  Type,
  Square,
  MousePointer,
  LayoutGrid,
  Table2,
  FormInput,
  MessageSquare,
  Navigation,
  Building2,
  Layers,
  Settings2,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Receipt,
  Gavel,
  Calendar,
  Globe,
  Sparkles,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export interface DesignSystemSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
  children?: DesignSystemSection[];
}

export const DESIGN_SYSTEM_SECTIONS: DesignSystemSection[] = [
  // Foundations
  {
    id: "foundations",
    label: "Fondations",
    icon: <Settings2 className="h-4 w-4" />,
    description: "Tokens et variables CSS",
    children: [
      {
        id: "tokens",
        label: "Éditeur de Tokens",
        icon: <Sparkles className="h-4 w-4" />,
        description: "Modifier les tokens en temps réel",
        badge: "NEW",
      },
      {
        id: "colors",
        label: "Couleurs",
        icon: <Palette className="h-4 w-4" />,
        description: "Tokens de couleur et palette",
      },
      {
        id: "typography",
        label: "Typographie",
        icon: <Type className="h-4 w-4" />,
        description: "Échelle typographique",
      },
    ],
  },
  // UI Primitives
  {
    id: "primitives",
    label: "Primitifs UI",
    icon: <Square className="h-4 w-4" />,
    description: "Composants de base",
    children: [
      {
        id: "buttons",
        label: "Boutons",
        icon: <MousePointer className="h-4 w-4" />,
        description: "Toutes les variantes de boutons",
      },
      {
        id: "badges",
        label: "Badges",
        icon: <Square className="h-4 w-4" />,
        description: "Labels et indicateurs",
      },
      {
        id: "inputs",
        label: "Formulaires",
        icon: <FormInput className="h-4 w-4" />,
        description: "Champs et contrôles",
      },
      {
        id: "cards",
        label: "Cartes",
        icon: <LayoutGrid className="h-4 w-4" />,
        description: "Conteneurs et cards",
      },
      {
        id: "tables",
        label: "Tables",
        icon: <Table2 className="h-4 w-4" />,
        description: "Affichage de données",
      },
      {
        id: "dialogs",
        label: "Modales",
        icon: <MessageSquare className="h-4 w-4" />,
        description: "Dialogs, Sheets, Drawers",
      },
      {
        id: "navigation",
        label: "Navigation",
        icon: <Navigation className="h-4 w-4" />,
        description: "Menus et navigation",
      },
    ],
  },
  // Layout
  {
    id: "layout-section",
    label: "Layout",
    icon: <Layers className="h-4 w-4" />,
    description: "Structure de page",
    children: [
      {
        id: "layout",
        label: "Page Layout",
        icon: <Layers className="h-4 w-4" />,
        description: "Structure de page",
      },
    ],
  },
  // Business Modules
  {
    id: "modules",
    label: "Modules Métier",
    icon: <Building2 className="h-4 w-4" />,
    description: "Composants métier spécifiques",
    children: [
      {
        id: "business",
        label: "Vue d'ensemble",
        icon: <Building2 className="h-4 w-4" />,
        description: "Composants partagés",
      },
      {
        id: "crm",
        label: "CRM",
        icon: <Users className="h-4 w-4" />,
        description: "Contacts & Entreprises",
        badge: "38+",
      },
      {
        id: "projects",
        label: "Projets",
        icon: <FolderKanban className="h-4 w-4" />,
        description: "Gestion de projets",
        badge: "37+",
      },
      {
        id: "tasks",
        label: "Tâches",
        icon: <CheckSquare className="h-4 w-4" />,
        description: "Gestion des tâches",
        badge: "23+",
      },
      {
        id: "commercial",
        label: "Commercial",
        icon: <FileText className="h-4 w-4" />,
        description: "Devis & Documents",
        badge: "21+",
      },
      {
        id: "invoicing",
        label: "Facturation",
        icon: <Receipt className="h-4 w-4" />,
        description: "Factures & Paiements",
      },
      {
        id: "tenders",
        label: "Appels d'offres",
        icon: <Gavel className="h-4 w-4" />,
        description: "Gestion des AO",
        badge: "30+",
      },
      {
        id: "team",
        label: "Équipe",
        icon: <Users className="h-4 w-4" />,
        description: "Gestion d'équipe",
      },
      {
        id: "workflow",
        label: "Workflow",
        icon: <Calendar className="h-4 w-4" />,
        description: "Planning & Calendrier",
      },
    ],
  },
  // Landing & Portal
  {
    id: "public",
    label: "Public",
    icon: <Globe className="h-4 w-4" />,
    description: "Pages publiques",
    children: [
      {
        id: "landing",
        label: "Landing Page",
        icon: <Globe className="h-4 w-4" />,
        description: "Composants marketing",
      },
      {
        id: "portal",
        label: "Portail Client",
        icon: <Users className="h-4 w-4" />,
        description: "Interface client",
      },
    ],
  },
];

// Flatten sections for easy lookup
export function flattenSections(sections: DesignSystemSection[]): DesignSystemSection[] {
  const result: DesignSystemSection[] = [];
  for (const section of sections) {
    if (section.children) {
      result.push(...flattenSections(section.children));
    } else {
      result.push(section);
    }
  }
  return result;
}

interface DesignSystemNavProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function DesignSystemNav({
  activeSection,
  onSectionChange,
}: DesignSystemNavProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    foundations: true,
    primitives: true,
    modules: false,
    public: false,
    "layout-section": false,
  });

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const isActive = (section: DesignSystemSection): boolean => {
    if (section.id === activeSection) return true;
    if (section.children) {
      return section.children.some((child) => child.id === activeSection);
    }
    return false;
  };

  return (
    <div className="w-64 border-r bg-muted/20 flex flex-col shrink-0">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Catégories</h3>
        <p className="text-xs text-muted-foreground mt-1">280+ composants</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {DESIGN_SYSTEM_SECTIONS.map((section) => (
            <div key={section.id}>
              {section.children ? (
                <Collapsible
                  open={openGroups[section.id]}
                  onOpenChange={() => toggleGroup(section.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-between gap-2 h-auto py-2",
                        isActive(section) && "bg-primary/5"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {section.icon}
                        </span>
                        <span className="text-sm font-medium">{section.label}</span>
                      </div>
                      {openGroups[section.id] ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-4 pl-2 border-l space-y-1 mt-1">
                      {section.children.map((child) => (
                        <Button
                          key={child.id}
                          variant={activeSection === child.id ? "secondary" : "ghost"}
                          className={cn(
                            "w-full justify-start gap-2 h-auto py-1.5 text-xs",
                            activeSection === child.id && "bg-primary/10 text-primary"
                          )}
                          onClick={() => onSectionChange(child.id)}
                        >
                          <span
                            className={cn(
                              activeSection === child.id
                                ? "text-primary"
                                : "text-muted-foreground"
                            )}
                          >
                            {child.icon}
                          </span>
                          <span className="flex-1 text-left">{child.label}</span>
                          {child.badge && (
                            <Badge
                              variant={child.badge === "NEW" ? "default" : "secondary"}
                              className="text-[10px] px-1.5 py-0"
                            >
                              {child.badge}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Button
                  variant={activeSection === section.id ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-2 h-auto py-2",
                    activeSection === section.id && "bg-primary/10 text-primary"
                  )}
                  onClick={() => onSectionChange(section.id)}
                >
                  <span
                    className={cn(
                      activeSection === section.id
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {section.icon}
                  </span>
                  <div className="text-left">
                    <div className="text-sm font-medium">{section.label}</div>
                  </div>
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
