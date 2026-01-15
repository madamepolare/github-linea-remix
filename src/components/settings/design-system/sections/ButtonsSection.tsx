import { ComponentShowcase } from "../ComponentShowcase";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Loader2, Download, Trash2 } from "lucide-react";

export function ButtonsSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Button"
        description="Composant bouton principal avec plusieurs variantes et tailles"
        filePath="src/components/ui/button.tsx"
        importStatement='import { Button } from "@/components/ui/button"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Button Sizes"
        description="Différentes tailles de boutons"
        filePath="src/components/ui/button.tsx"
        importStatement='import { Button } from "@/components/ui/button"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><Plus className="h-4 w-4" /></Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Button avec icônes"
        description="Boutons combinés avec des icônes Lucide"
        filePath="src/components/ui/button.tsx"
        importStatement='import { Button } from "@/components/ui/button"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
          <Button variant="outline">
            Continuer
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="secondary">
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button variant="destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Button États"
        description="États disabled et loading"
        filePath="src/components/ui/button.tsx"
        importStatement='import { Button } from "@/components/ui/button"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled>Disabled</Button>
          <Button disabled>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Chargement...
          </Button>
          <Button variant="outline" disabled>
            Outline Disabled
          </Button>
        </div>
      </ComponentShowcase>
    </div>
  );
}
