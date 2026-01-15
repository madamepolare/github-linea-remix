import { ComponentShowcase } from "../ComponentShowcase";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export function BadgesSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Badge"
        description="Labels et indicateurs visuels"
        filePath="src/components/ui/badge.tsx"
        importStatement='import { Badge } from "@/components/ui/badge"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Badge avec icônes"
        description="Badges combinés avec des icônes pour les statuts"
        filePath="src/components/ui/badge.tsx"
        importStatement='import { Badge } from "@/components/ui/badge"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="gap-1">
            <CheckCircle className="h-3 w-3" />
            Validé
          </Badge>
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            Rejeté
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            En attente
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Attention
          </Badge>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Badge Phases (Custom)"
        description="Style personnalisé pour les phases de projet"
        filePath="src/index.css"
        importStatement="className='badge-phase' ou className='badge-phase-active'"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="badge-phase">Phase inactive</span>
          <span className="badge-phase-active">Phase active</span>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Badges de priorité"
        description="Indicateurs de priorité colorés"
        filePath="src/components/ui/badge.tsx"
        importStatement='import { Badge } from "@/components/ui/badge"'
      >
        <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            Urgent
          </Badge>
          <Badge className="bg-warning/10 text-warning border-warning/20">
            Haute
          </Badge>
          <Badge className="bg-info/10 text-info border-info/20">
            Normale
          </Badge>
          <Badge className="bg-muted text-muted-foreground">
            Basse
          </Badge>
        </div>
      </ComponentShowcase>
    </div>
  );
}
