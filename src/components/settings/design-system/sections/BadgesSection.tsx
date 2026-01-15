import { ComponentStyleEditor } from "../ComponentStyleEditor";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertTriangle, Info, Star, Zap, Users } from "lucide-react";

const badgeProperties = [
  {
    id: "secondary-bg",
    label: "Secondary Background",
    type: "color" as const,
    cssVariable: "--secondary",
  },
  {
    id: "destructive-bg",
    label: "Destructive",
    type: "color" as const,
    cssVariable: "--destructive",
  },
  {
    id: "success",
    label: "Success",
    type: "color" as const,
    cssVariable: "--success",
  },
  {
    id: "warning",
    label: "Warning",
    type: "color" as const,
    cssVariable: "--warning",
  },
  {
    id: "info",
    label: "Info",
    type: "color" as const,
    cssVariable: "--info",
  },
];

export function BadgesSection() {
  return (
    <div className="space-y-6">
      <ComponentStyleEditor
        componentName="Badge"
        description="Labels et indicateurs pour statuts et catégories"
        filePath="src/components/ui/badge.tsx"
        usedIn={["Tables", "Cards", "Lists", "Headers", "Forms"]}
        properties={badgeProperties}
        variants={[
          {
            name: "With Icons",
            render: (
              <div className="flex flex-wrap gap-2">
                <Badge className="gap-1">
                  <Check className="h-3 w-3" />
                  Validé
                </Badge>
                <Badge variant="destructive" className="gap-1">
                  <X className="h-3 w-3" />
                  Rejeté
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  En attente
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Info className="h-3 w-3" />
                  Info
                </Badge>
              </div>
            )
          },
          {
            name: "Status Colors",
            render: (
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-success/10 text-success border-success/20">Actif</Badge>
                <Badge className="bg-warning/10 text-warning border-warning/20">En cours</Badge>
                <Badge className="bg-info/10 text-info border-info/20">Nouveau</Badge>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">Urgent</Badge>
                <Badge className="bg-accent/10 text-accent border-accent/20">Premium</Badge>
              </div>
            )
          }
        ]}
      >
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Status Badges"
        description="Badges de statut métier avec couleurs sémantiques"
        filePath="src/components/ui/badge.tsx"
        usedIn={["CRM", "Projects", "Tasks", "Invoicing"]}
        properties={[]}
      >
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success text-success-foreground">Client</Badge>
            <Badge className="bg-warning text-warning-foreground">Prospect</Badge>
            <Badge className="bg-info text-info-foreground">Lead</Badge>
            <Badge className="bg-muted text-muted-foreground">Inactif</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-success/10 text-success">Payée</Badge>
            <Badge className="bg-warning/10 text-warning">En attente</Badge>
            <Badge className="bg-destructive/10 text-destructive">En retard</Badge>
            <Badge className="bg-info/10 text-info">Brouillon</Badge>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Phase Badges"
        description="Badges de phases de projet (style personnalisé)"
        filePath="src/index.css"
        usedIn={["Projects", "Commercial"]}
        properties={[]}
      >
        <div className="flex flex-wrap gap-2">
          <span className="badge-phase">ESQ</span>
          <span className="badge-phase">APS</span>
          <span className="badge-phase-active">APD</span>
          <span className="badge-phase">PRO</span>
          <span className="badge-phase">DCE</span>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Priority Badges"
        description="Indicateurs de priorité pour les tâches"
        filePath="src/components/ui/badge.tsx"
        usedIn={["Tasks", "Tenders"]}
        properties={[]}
      >
        <div className="flex flex-wrap gap-2">
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Urgent
          </Badge>
          <Badge className="bg-warning/10 text-warning gap-1">
            <Zap className="h-3 w-3" />
            Haute
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Star className="h-3 w-3" />
            Normale
          </Badge>
          <Badge variant="outline" className="gap-1">
            Basse
          </Badge>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Count Badges"
        description="Badges numériques pour compteurs"
        filePath="src/components/ui/badge.tsx"
        usedIn={["Sidebar", "Tabs", "Navigation"]}
        properties={[]}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Messages</span>
            <Badge className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">3</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <Badge variant="secondary" className="text-xs">12 membres</Badge>
          </div>
          <Badge className="bg-accent text-accent-foreground gap-1">
            <Star className="h-3 w-3" />
            PRO
          </Badge>
        </div>
      </ComponentStyleEditor>
    </div>
  );
}
