import { ComponentStyleEditor } from "../ComponentStyleEditor";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Building2, TrendingUp, FolderKanban, CheckSquare, ArrowUpRight, Users } from "lucide-react";

const cardProperties = [
  {
    id: "card-bg",
    label: "Card Background",
    type: "color" as const,
    cssVariable: "--card",
  },
  {
    id: "card-fg",
    label: "Card Foreground",
    type: "color" as const,
    cssVariable: "--card-foreground",
  },
  {
    id: "border",
    label: "Border Color",
    type: "color" as const,
    cssVariable: "--border",
  },
  {
    id: "radius",
    label: "Border Radius",
    type: "radius" as const,
    cssVariable: "--radius",
  },
];

export function CardsSection() {
  return (
    <div className="space-y-6">
      <ComponentStyleEditor
        componentName="Card"
        description="Conteneur de base pour grouper du contenu"
        filePath="src/components/ui/card.tsx"
        usedIn={["Dashboard", "Lists", "Forms", "Settings"]}
        properties={cardProperties}
        variants={[
          {
            name: "With Footer",
            render: (
              <Card className="max-w-sm">
                <CardHeader>
                  <CardTitle>Titre de la carte</CardTitle>
                  <CardDescription>Description courte ici</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Contenu de la carte avec des informations importantes.
                  </p>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="ghost">Annuler</Button>
                  <Button>Confirmer</Button>
                </CardFooter>
              </Card>
            )
          }
        ]}
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Titre de la carte</CardTitle>
            <CardDescription>Description courte de la carte</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contenu principal de la carte. Peut contenir du texte, des images, des formulaires, etc.
            </p>
          </CardContent>
        </Card>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Card Programa"
        description="Style de carte personnalisé avec hover effect"
        filePath="src/index.css"
        usedIn={["Projects", "CRM", "Dashboard"]}
        properties={[]}
      >
        <div className="card-programa max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Projet Exemple</h4>
                <p className="text-sm text-muted-foreground">Client ABC</p>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">En cours</Badge>
            <span className="text-xs text-muted-foreground">Mis à jour il y a 2h</span>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Stats Card"
        description="Carte pour afficher des statistiques"
        filePath="src/components/dashboard/StatsCard.tsx"
        usedIn={["Dashboard", "Reports"]}
        properties={[]}
      >
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projets actifs</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-accent" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-success">
                <ArrowUpRight className="h-3 w-3" />
                +12% ce mois
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tâches</p>
                  <p className="text-2xl font-bold">48</p>
                </div>
                <div className="h-10 w-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-info" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                8 en retard
              </div>
            </CardContent>
          </Card>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Project Card"
        description="Carte projet avec progression"
        filePath="src/components/projects/ProjectCard.tsx"
        usedIn={["Projects", "Dashboard"]}
        properties={[]}
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
                  <AvatarFallback className="text-xs">ML</AvatarFallback>
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
        componentName="Avatar"
        description="Avatar utilisateur avec fallback"
        filePath="src/components/ui/avatar.tsx"
        usedIn={["Headers", "Cards", "Comments", "Team"]}
        properties={[]}
      >
        <div className="flex items-center gap-4">
          <Avatar>
            <AvatarImage src="https://github.com/shadcn.png" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="text-lg">AB</AvatarFallback>
          </Avatar>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">CD</AvatarFallback>
          </Avatar>
          <div className="flex -space-x-2">
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs">A</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs">B</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs bg-muted">+3</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </ComponentStyleEditor>

      <ComponentStyleEditor
        componentName="Task Card"
        description="Carte tâche pour le kanban"
        filePath="src/components/tasks/TaskCard.tsx"
        usedIn={["Tasks", "Projects"]}
        properties={[]}
      >
        <div className="max-w-xs task-card">
          <div className="flex items-start gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm">Finaliser les plans</p>
              <p className="text-xs text-muted-foreground mt-1">Projet: Villa Dupont</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t">
            <Badge variant="destructive" className="text-xs">Urgent</Badge>
            <span className="text-xs text-muted-foreground">Demain</span>
          </div>
        </div>
      </ComponentStyleEditor>
    </div>
  );
}
