import { ComponentStyleEditor } from "../ComponentStyleEditor";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Loader2, Download, Trash2, Save, Edit, Eye } from "lucide-react";

const buttonProperties = [
  {
    id: "primary-bg",
    label: "Primary Background",
    type: "color" as const,
    cssVariable: "--primary",
    description: "Couleur de fond du bouton principal"
  },
  {
    id: "primary-fg",
    label: "Primary Text",
    type: "color" as const,
    cssVariable: "--primary-foreground",
    description: "Couleur du texte du bouton principal"
  },
  {
    id: "secondary-bg",
    label: "Secondary Background",
    type: "color" as const,
    cssVariable: "--secondary",
  },
  {
    id: "destructive-bg",
    label: "Destructive Background",
    type: "color" as const,
    cssVariable: "--destructive",
  },
  {
    id: "radius",
    label: "Border Radius",
    type: "radius" as const,
    cssVariable: "--radius",
    description: "Arrondi des coins"
  },
];

export function ButtonsSection() {
  return (
    <div className="space-y-6">
      <ComponentStyleEditor
        componentName="Button"
        description="Composant bouton principal avec plusieurs variantes et tailles"
        filePath="src/components/ui/button.tsx"
        usedIn={["Forms", "Dialogs", "Cards", "Headers", "Toolbars"]}
        properties={buttonProperties}
        variants={[
          {
            name: "Sizes",
            render: (
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon"><Plus className="h-4 w-4" /></Button>
              </div>
            )
          },
          {
            name: "With Icons",
            render: (
              <div className="flex flex-wrap items-center gap-3">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
                <Button variant="outline">
                  Continuer
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button variant="destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            )
          },
          {
            name: "States",
            render: (
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled>Disabled</Button>
                <Button disabled>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Chargement...
                </Button>
              </div>
            )
          }
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Button Group"
        description="Groupement de boutons pour actions liées"
        filePath="src/components/ui/button.tsx"
        usedIn={["Toolbars", "Forms"]}
        properties={[]}
      >
        <div className="flex items-center">
          <Button variant="outline" className="rounded-r-none border-r-0">
            <Eye className="h-4 w-4 mr-2" />
            Voir
          </Button>
          <Button variant="outline" className="rounded-none border-r-0">
            <Edit className="h-4 w-4 mr-2" />
            Éditer
          </Button>
          <Button variant="outline" className="rounded-l-none">
            <Save className="h-4 w-4 mr-2" />
            Sauver
          </Button>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Icon Buttons"
        description="Boutons icône seule pour actions rapides"
        filePath="src/components/ui/button.tsx"
        usedIn={["Tables", "Cards", "Lists"]}
        properties={[]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Button size="icon" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="outline">
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="secondary">
            <Download className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </ComponentStyleEditor>
    </div>
  );
}
