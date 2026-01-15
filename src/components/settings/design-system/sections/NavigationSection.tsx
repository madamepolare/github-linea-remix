import { ComponentShowcase } from "../ComponentShowcase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Progress } from "@/components/ui/progress";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Separator } from "@/components/ui/separator";
import { Home, Settings, Users } from "lucide-react";

export function NavigationSection() {
  return (
    <div className="space-y-6">
      <ComponentShowcase
        name="Tabs"
        description="Navigation par onglets"
        filePath="src/components/ui/tabs.tsx"
        importStatement='import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"'
      >
        <Tabs defaultValue="tab1" className="w-full">
          <TabsList>
            <TabsTrigger value="tab1">Général</TabsTrigger>
            <TabsTrigger value="tab2">Détails</TabsTrigger>
            <TabsTrigger value="tab3">Paramètres</TabsTrigger>
          </TabsList>
          <TabsContent value="tab1" className="p-4 border rounded-lg mt-2">
            <p className="text-sm text-muted-foreground">Contenu de l'onglet Général</p>
          </TabsContent>
          <TabsContent value="tab2" className="p-4 border rounded-lg mt-2">
            <p className="text-sm text-muted-foreground">Contenu de l'onglet Détails</p>
          </TabsContent>
          <TabsContent value="tab3" className="p-4 border rounded-lg mt-2">
            <p className="text-sm text-muted-foreground">Contenu de l'onglet Paramètres</p>
          </TabsContent>
        </Tabs>
      </ComponentShowcase>

      <ComponentShowcase
        name="Breadcrumb"
        description="Fil d'Ariane pour la navigation"
        filePath="src/components/ui/breadcrumb.tsx"
        importStatement='import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"'
      >
        <div className="space-y-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#">
                  <Home className="h-4 w-4" />
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#">Projets</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Projet Alpha</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="flex items-center gap-1">
                  <Settings className="h-3.5 w-3.5" />
                  Paramètres
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="#" className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Équipe
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Membres</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Progress"
        description="Barre de progression"
        filePath="src/components/ui/progress.tsx"
        importStatement='import { Progress } from "@/components/ui/progress"'
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progression</span>
              <span className="text-muted-foreground">25%</span>
            </div>
            <Progress value={25} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Téléchargement</span>
              <span className="text-muted-foreground">60%</span>
            </div>
            <Progress value={60} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Terminé</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <Progress value={100} />
          </div>
        </div>
      </ComponentShowcase>

      <ComponentShowcase
        name="Pagination"
        description="Navigation entre pages"
        filePath="src/components/ui/pagination.tsx"
        importStatement='import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"'
      >
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ComponentShowcase>

      <ComponentShowcase
        name="Separator"
        description="Séparateur horizontal ou vertical"
        filePath="src/components/ui/separator.tsx"
        importStatement='import { Separator } from "@/components/ui/separator"'
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm">Section 1</p>
            <Separator className="my-4" />
            <p className="text-sm">Section 2</p>
          </div>
          
          <div className="flex items-center h-10 gap-4">
            <span className="text-sm">Gauche</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Milieu</span>
            <Separator orientation="vertical" />
            <span className="text-sm">Droite</span>
          </div>
        </div>
      </ComponentShowcase>
    </div>
  );
}
