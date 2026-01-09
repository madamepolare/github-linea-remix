import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GenericSettingsManager } from "./GenericSettingsManager";
import { FolderKanban, FileText } from "lucide-react";
import { DISCIPLINE_CONFIGS, DisciplineSlug } from "@/lib/disciplinesConfig";

// Generate default project types from discipline configs
const DEFAULT_PROJECT_TYPES = Object.entries(DISCIPLINE_CONFIGS).map(([slug, config]) => ({
  key: slug,
  label: config.name,
  color: config.color.startsWith('hsl') 
    ? hslToHex(config.color) 
    : config.color,
  description: config.description,
  icon: config.icon.displayName || slug,
}));

// Helper to convert HSL string to hex
function hslToHex(hslString: string): string {
  // Parse hsl(220, 70%, 50%) format
  const match = hslString.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return "#3B82F6"; // fallback
  
  const h = parseInt(match[1]) / 360;
  const s = parseInt(match[2]) / 100;
  const l = parseInt(match[3]) / 100;
  
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

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
