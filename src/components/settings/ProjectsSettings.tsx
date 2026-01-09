import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { FolderKanban, FileText } from "lucide-react";
import { useWorkspaceDiscipline } from "@/hooks/useDiscipline";
import { useMemo } from "react";

// Project types by discipline
const PROJECT_TYPES_BY_DISCIPLINE: Record<string, Array<{ key: string; label: string; color: string; description: string }>> = {
  // Architecture agency - spatial design disciplines
  architecture: [
    { key: "architecture", label: "Architecture", color: "#3B82F6", description: "Construction neuve, extension, permis de construire" },
    { key: "interior", label: "Intérieur", color: "#8B5CF6", description: "Aménagement intérieur, design d'espace" },
    { key: "scenography", label: "Scénographie", color: "#F59E0B", description: "Exposition, événementiel, muséographie" },
    { key: "urbanisme", label: "Urbanisme", color: "#10B981", description: "Aménagement urbain, master plan" },
    { key: "paysage", label: "Paysage", color: "#22C55E", description: "Aménagement paysager, espaces verts" },
  ],
  // Interior design agency
  interior: [
    { key: "amenagement", label: "Aménagement", color: "#8B5CF6", description: "Aménagement intérieur complet" },
    { key: "retail", label: "Retail", color: "#F59E0B", description: "Boutiques et espaces commerciaux" },
    { key: "residential", label: "Résidentiel", color: "#3B82F6", description: "Appartements et maisons" },
    { key: "hospitality", label: "Hospitality", color: "#EC4899", description: "Hôtels, restaurants, bars" },
    { key: "workspace", label: "Bureaux", color: "#10B981", description: "Espaces de travail" },
  ],
  // Scenography agency
  scenography: [
    { key: "exposition", label: "Exposition", color: "#8B5CF6", description: "Exposition temporaire ou permanente" },
    { key: "musee", label: "Muséographie", color: "#3B82F6", description: "Parcours muséographique" },
    { key: "evenement", label: "Événement", color: "#F59E0B", description: "Scénographie événementielle" },
    { key: "stand", label: "Stand", color: "#10B981", description: "Stand de salon professionnel" },
    { key: "spectacle", label: "Spectacle", color: "#EC4899", description: "Décor de spectacle" },
  ],
  // Communication & design agency
  communication: [
    { key: "campagne", label: "Campagne", color: "#3B82F6", description: "Campagne de communication 360°" },
    { key: "branding", label: "Branding", color: "#8B5CF6", description: "Identité visuelle et branding" },
    { key: "supports", label: "Supports de com.", color: "#F59E0B", description: "Supports print et digital" },
    { key: "video", label: "Vidéo", color: "#EF4444", description: "Production vidéo" },
    { key: "photo", label: "Photo", color: "#EC4899", description: "Shooting photo et retouche" },
    { key: "print", label: "Print", color: "#10B981", description: "Édition et impression" },
    { key: "motion", label: "Motion Design", color: "#06B6D4", description: "Animation et motion graphics" },
    { key: "web", label: "Web / Digital", color: "#6366F1", description: "Site web, UX/UI, applications" },
    { key: "social", label: "Social Media", color: "#F97316", description: "Réseaux sociaux et community" },
  ],
};

// Default fallback
const DEFAULT_PROJECT_TYPES = PROJECT_TYPES_BY_DISCIPLINE.architecture;

// Default deliverable types
const DEFAULT_DELIVERABLE_TYPES = [
  { key: "plan", label: "Plans", color: "#3B82F6", description: "Plans techniques (PDF, DWG)" },
  { key: "3d", label: "3D / Rendus", color: "#8B5CF6", description: "Images 3D, maquettes numériques" },
  { key: "document", label: "Documents", color: "#6B7280", description: "Rapports, études, notes" },
  { key: "presentation", label: "Présentation", color: "#EC4899", description: "Présentations client" },
  { key: "cctp", label: "CCTP", color: "#F59E0B", description: "Cahiers des clauses techniques" },
  { key: "estimatif", label: "Estimatif", color: "#10B981", description: "Estimations budgétaires" },
];

export function ProjectsSettings() {
  const { data: discipline } = useWorkspaceDiscipline();
  
  // Get project types based on current discipline
  const projectTypes = useMemo(() => {
    if (!discipline?.slug) return DEFAULT_PROJECT_TYPES;
    return PROJECT_TYPES_BY_DISCIPLINE[discipline.slug] || DEFAULT_PROJECT_TYPES;
  }, [discipline?.slug]);
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Configuration des projets</h3>
        <p className="text-sm text-muted-foreground">
          Gérez les types de projets et catégories de livrables
        </p>
      </div>

      <Tabs defaultValue="types">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="types" className="gap-1.5 text-xs">
            <FolderKanban className="h-4 w-4" />
            Types de projet
          </TabsTrigger>
          <TabsTrigger value="deliverables" className="gap-1.5 text-xs">
            <FileText className="h-4 w-4" />
            Livrables
          </TabsTrigger>
        </TabsList>

        <TabsContent value="types" className="mt-6">
          <GenericSettingsManager
            settingType="project_types"
            title="Types de projet"
            description={`Catégories de projets pour ${discipline?.name || 'votre discipline'}`}
            icon={<FolderKanban className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={projectTypes}
          />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-6">
          <GenericSettingsManager
            settingType="tags"
            title="Types de livrables"
            description="Catégories de documents et livrables"
            icon={<FileText className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={DEFAULT_DELIVERABLE_TYPES}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
