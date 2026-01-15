import { ComponentShowcase } from "../ComponentShowcase";
import { ModuleHeader } from "@/components/shared/ModuleHeader";
import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar";
import { ModuleEmptyState } from "@/components/shared/ModuleEmptyState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2,
  Users,
  FolderKanban,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
} from "lucide-react";

export function BusinessSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="ModuleHeader"
        description="En-tête de module avec icône, titre et actions"
        filePath="src/components/shared/ModuleHeader.tsx"
        importStatement='import { ModuleHeader } from "@/components/shared/ModuleHeader"'
      >
        <ModuleHeader
          icon={FolderKanban}
          title="Projets"
          description="Gérez vos projets et leur avancement"
          actions={
            <>
              <Button variant="outline" size="sm">Exporter</Button>
              <Button size="sm">Nouveau projet</Button>
            </>
          }
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="ModuleFiltersBar"
        description="Barre de filtres avec recherche et options"
        filePath="src/components/shared/ModuleFiltersBar.tsx"
        importStatement='import { ModuleFiltersBar } from "@/components/shared/ModuleFiltersBar"'
      >
        <ModuleFiltersBar
          search={{
            value: "",
            onChange: () => {},
            placeholder: "Rechercher un projet...",
          }}
          filters={
            <div className="flex gap-2">
              <Button variant="outline" size="sm">Statut</Button>
              <Button variant="outline" size="sm">Date</Button>
            </div>
          }
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="ModuleEmptyState"
        description="État vide avec icône et action"
        filePath="src/components/shared/ModuleEmptyState.tsx"
        importStatement='import { ModuleEmptyState } from "@/components/shared/ModuleEmptyState"'
      >
        <ModuleEmptyState
          icon={FileText}
          title="Aucun document"
          description="Vous n'avez pas encore créé de document. Commencez par en créer un."
          actionLabel="Créer un document"
          onAction={() => {}}
        />
      </ComponentShowcase>

      <ComponentShowcase
        name="Entity Contact Card"
        description="Carte contact pour CRM"
        filePath="src/components/crm/shared/EntityContactCard.tsx"
        importStatement='import { EntityContactCard } from "@/components/crm/shared/EntityContactCard"'
      >
        <Card className="max-w-sm">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <h4 className="font-medium">Jean Dupont</h4>
                <p className="text-sm text-muted-foreground">Directeur Commercial</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  <span>Entreprise ABC</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>jean.dupont@entreprise.com</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>+33 1 23 45 67 89</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>Paris, France</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </ComponentShowcase>

      <ComponentShowcase
        name="CRM Status Badge"
        description="Badges de statut pour le CRM"
        filePath="src/components/crm/shared/CRMStatusBadge.tsx"
        importStatement='import { CRMStatusBadge } from "@/components/crm/shared/CRMStatusBadge"'
      >
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Nouveau
          </Badge>
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            <Calendar className="h-3 w-3 mr-1" />
            En cours
          </Badge>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Gagné
          </Badge>
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Perdu
          </Badge>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Stats Grid"
        description="Grille de statistiques pour dashboards"
        filePath="src/components/shared/ModuleStatsGrid.tsx"
        importStatement='import { ModuleStatsGrid } from "@/components/shared/ModuleStatsGrid"'
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">156</p>
                  <p className="text-xs text-muted-foreground">Entreprises</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">423</p>
                  <p className="text-xs text-muted-foreground">Contacts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">68%</p>
                  <p className="text-xs text-muted-foreground">Conversion</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Projets actifs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Task Card"
        description="Carte de tâche style Kanban"
        filePath="src/index.css"
        importStatement="className='task-card'"
      >
        <div className="max-w-xs">
          <div className="task-card">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-medium text-sm">Préparer le devis client</h4>
              <Badge variant="outline" className="text-xs">Haute</Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Finaliser le devis pour le projet de rénovation
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Demain</span>
              </div>
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </ComponentShowcase>
    </div>
  );
}
