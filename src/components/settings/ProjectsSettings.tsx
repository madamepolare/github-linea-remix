import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { FolderKanban, FileText } from "lucide-react";

// Default project types
const DEFAULT_PROJECT_TYPES = [
  { key: "interior", label: "Intérieur", color: "#8B5CF6", description: "Aménagement intérieur, design d'espace" },
  { key: "architecture", label: "Architecture", color: "#3B82F6", description: "Construction, rénovation, extension" },
  { key: "scenography", label: "Scénographie", color: "#F59E0B", description: "Exposition, événementiel, muséographie" },
  { key: "urbanisme", label: "Urbanisme", color: "#10B981", description: "Aménagement urbain, master plan" },
  { key: "paysage", label: "Paysage", color: "#22C55E", description: "Aménagement paysager, espaces verts" },
];

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
            description="Catégories de projets disponibles dans l'application"
            icon={<FolderKanban className="h-5 w-5 text-primary" />}
            showColor
            showDescription
            defaultItems={DEFAULT_PROJECT_TYPES}
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
