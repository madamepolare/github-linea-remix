import { ComponentShowcase } from "../ComponentShowcase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal, Building2, TrendingUp } from "lucide-react";

export function CardsSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Card Basic"
        description="Carte de base avec header, content et footer"
        filePath="src/components/ui/card.tsx"
        importStatement='import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"'
      >
        <Card className="max-w-sm">
          <CardHeader>
            <CardTitle>Titre de la carte</CardTitle>
            <CardDescription>Description courte de la carte</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Contenu principal de la carte avec des informations détaillées.
            </p>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm">Annuler</Button>
            <Button size="sm">Confirmer</Button>
          </CardFooter>
        </Card>
      </ComponentShowcase>

      <ComponentShowcase
        name="Card Programa (Custom)"
        description="Style de carte personnalisé avec hover effect"
        filePath="src/index.css"
        importStatement="className='card-programa'"
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
      </ComponentShowcase>

      <ComponentShowcase
        name="Stats Card"
        description="Carte pour afficher des statistiques"
        filePath="src/components/ui/card.tsx"
        importStatement='import { Card, CardContent } from "@/components/ui/card"'
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Chiffre d'affaires</p>
                  <p className="text-2xl font-bold">45 230 €</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
              <p className="text-xs text-success mt-2">+12% vs mois dernier</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Projets actifs</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-info" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">8 en phase conception</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taux conversion</p>
                  <p className="text-2xl font-bold">68%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
              </div>
              <p className="text-xs text-destructive mt-2">-3% vs mois dernier</p>
            </CardContent>
          </Card>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Avatar"
        description="Avatar utilisateur avec fallback"
        filePath="src/components/ui/avatar.tsx"
        importStatement='import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"'
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
              <AvatarFallback className="text-xs">C</AvatarFallback>
            </Avatar>
            <Avatar className="h-8 w-8 border-2 border-background">
              <AvatarFallback className="text-xs bg-muted">+3</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </ComponentShowcase>
    </div>
  );
}
