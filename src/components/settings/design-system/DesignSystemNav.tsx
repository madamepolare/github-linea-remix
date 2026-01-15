import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";

export interface DesignSystemSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

export const DESIGN_SYSTEM_SECTIONS: DesignSystemSection[] = [
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
  {
    id: "business",
    label: "Composants Métier",
    icon: <Building2 className="h-4 w-4" />,
    description: "CRM, projets, modules",
  },
  {
    id: "layout",
    label: "Layout",
    icon: <Layers className="h-4 w-4" />,
    description: "Structure de page",
  },
];

interface DesignSystemNavProps {
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
}

export function DesignSystemNav({
  activeSection,
  onSectionChange,
}: DesignSystemNavProps) {
  return (
    <div className="w-56 border-r bg-muted/20 flex flex-col shrink-0">
      <div className="p-3 border-b">
        <h3 className="font-semibold text-sm">Catégories</h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {DESIGN_SYSTEM_SECTIONS.map((section) => (
            <Button
              key={section.id}
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
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
