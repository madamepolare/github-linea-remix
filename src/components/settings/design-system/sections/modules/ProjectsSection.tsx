import { ComponentStyleEditor } from "../../ComponentStyleEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FolderKanban, MoreHorizontal, Calendar, Users, Clock, CheckCircle, AlertTriangle, MapPin } from "lucide-react";

export function ProjectsSection() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Badge variant="outline">37+ composants</Badge>
        <Badge variant="secondary">src/components/projects/</Badge>
      </div>
      
      <ComponentStyleEditor
        componentName="Project Card"
        description="Carte projet pour les listes et kanban"
        filePath="src/components/projects/ProjectCard.tsx"
        usedIn={["ProjectBoard", "ProjectListView", "Dashboard"]}
        properties={[
          { id: "accent", label: "Accent Color", type: "color", cssVariable: "--accent" },
        ]}
      >
        <Card className="max-w-sm">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-sm">Villa Méditerranée</p>
                  <p className="text-xs text-muted-foreground">Client: Dupont</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Progression</span>
                <span className="font-medium">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <Badge variant="secondary">Phase DCE</Badge>
              <div className="flex -space-x-2">
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">JD</AvatarFallback>
                </Avatar>
                <Avatar className="h-6 w-6 border-2 border-background">
                  <AvatarFallback className="text-xs">+2</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </CardContent>
        </Card>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Phase Timeline"
        description="Barre de timeline pour les phases projet"
        filePath="src/components/projects/PhaseGanttTimeline.tsx"
        usedIn={["ProjectPhasesTab", "ProjectPlanning"]}
        properties={[]}
      >
        <div className="space-y-2 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">ESQ</span>
            <div className="flex-1 h-6 rounded bg-success/20 relative">
              <div className="absolute inset-y-0 left-0 w-full bg-success/40 rounded flex items-center px-2">
                <CheckCircle className="h-3 w-3 text-success mr-1" />
                <span className="text-xs">Terminé</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">APS</span>
            <div className="flex-1 h-6 rounded bg-info/20 relative">
              <div className="absolute inset-y-0 left-0 w-3/4 bg-info/40 rounded flex items-center px-2">
                <Clock className="h-3 w-3 text-info mr-1" />
                <span className="text-xs">En cours</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs w-16 text-muted-foreground">APD</span>
            <div className="flex-1 h-6 rounded bg-muted relative">
              <span className="text-xs text-muted-foreground px-2 leading-6">À venir</span>
            </div>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Project Stats"
        description="Statistiques rapides du projet"
        filePath="src/components/projects/ProjectStatsGrid.tsx"
        usedIn={["ProjectDashboard", "ProjectHeader"]}
        properties={[]}
      >
        <div className="grid grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Calendar className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">12 mois</p>
              <p className="text-xs text-muted-foreground">Durée</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <Users className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">5</p>
              <p className="text-xs text-muted-foreground">Équipe</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <CheckCircle className="h-4 w-4 mx-auto text-success mb-1" />
              <p className="text-sm font-semibold">24/36</p>
              <p className="text-xs text-muted-foreground">Tâches</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-3 pb-3 text-center">
              <AlertTriangle className="h-4 w-4 mx-auto text-warning mb-1" />
              <p className="text-sm font-semibold">2</p>
              <p className="text-xs text-muted-foreground">Alertes</p>
            </CardContent>
          </Card>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Project Location"
        description="Affichage de l'adresse du projet"
        filePath="src/components/projects/ProjectLocation.tsx"
        usedIn={["ProjectHeader", "ProjectDetailSheet"]}
        properties={[]}
      >
        <div className="flex items-start gap-2 p-3 bg-muted/30 rounded-lg">
          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium">Villa Méditerranée</p>
            <p className="text-xs text-muted-foreground">123 Avenue de la Mer</p>
            <p className="text-xs text-muted-foreground">06400 Cannes, France</p>
          </div>
        </div>
      </ComponentStyleEditor>

      <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
        <p className="font-medium mb-2">Autres composants Projets:</p>
        <ul className="grid grid-cols-2 gap-1 text-xs">
          <li>• ProjectBoard</li>
          <li>• PhaseGanttTimeline</li>
          <li>• ChantierDashboard</li>
          <li>• ProjectPhasesTab</li>
          <li>• ProjectBudgetTab</li>
          <li>• MeetingReportBuilder</li>
          <li>• ProjectMOESection</li>
          <li>• ProjectDeliverablesTab</li>
          <li>• ProjectEventsTab</li>
          <li>• CreateProjectDialog</li>
        </ul>
      </div>
    </div>
  );
}
