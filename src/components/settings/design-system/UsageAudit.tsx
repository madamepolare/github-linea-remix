import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternUsage {
  name: string;
  importPath: string;
  usageCount: number;
  legacyCount: number;
  adoptionRate: number;
  status: "complete" | "partial" | "low";
}

// Static data - in a real implementation, this would come from a build-time analysis
const PATTERN_USAGE: PatternUsage[] = [
  { 
    name: "LoadingState", 
    importPath: "@/components/ui/patterns",
    usageCount: 23, 
    legacyCount: 0, 
    adoptionRate: 100, 
    status: "complete" 
  },
  { 
    name: "StandardCard", 
    importPath: "@/components/ui/patterns",
    usageCount: 45, 
    legacyCount: 3, 
    adoptionRate: 94, 
    status: "complete" 
  },
  { 
    name: "FormDialog", 
    importPath: "@/components/ui/patterns",
    usageCount: 12, 
    legacyCount: 8, 
    adoptionRate: 60, 
    status: "partial" 
  },
  { 
    name: "DetailSheet", 
    importPath: "@/components/ui/patterns",
    usageCount: 15, 
    legacyCount: 5, 
    adoptionRate: 75, 
    status: "partial" 
  },
  { 
    name: "ConfirmDialog", 
    importPath: "@/components/ui/patterns",
    usageCount: 8, 
    legacyCount: 12, 
    adoptionRate: 40, 
    status: "low" 
  },
  { 
    name: "ButtonLoader", 
    importPath: "@/components/ui/patterns",
    usageCount: 18, 
    legacyCount: 4, 
    adoptionRate: 82, 
    status: "partial" 
  },
  { 
    name: "TableSkeleton", 
    importPath: "@/components/ui/patterns",
    usageCount: 10, 
    legacyCount: 2, 
    adoptionRate: 83, 
    status: "partial" 
  },
];

const LEGACY_FILES = [
  { file: "src/components/crm/LeadForm.tsx", pattern: "Dialog", suggested: "FormDialog" },
  { file: "src/components/tasks/TaskEditSheet.tsx", pattern: "Sheet", suggested: "DetailSheet" },
  { file: "src/components/projects/ProjectDialog.tsx", pattern: "Dialog", suggested: "FormDialog" },
  { file: "src/components/team/MemberDialog.tsx", pattern: "Dialog", suggested: "CreateDialog" },
  { file: "src/components/documents/DeleteConfirm.tsx", pattern: "AlertDialog", suggested: "DeleteDialog" },
];

const GUIDELINES = [
  {
    title: "Importer depuis patterns",
    description: "Toujours utiliser @/components/ui/patterns au lieu des primitives brutes.",
    code: `// ✅ Correct
import { FormDialog, DetailSheet } from "@/components/ui/patterns";

// ❌ À éviter
import { Dialog } from "@/components/ui/dialog";
import { Sheet } from "@/components/ui/sheet";`,
  },
  {
    title: "Utiliser les variantes appropriées",
    description: "Choisir la bonne variante selon le cas d'usage.",
    code: `// Création → CreateDialog
// Édition → EditDialog  
// Suppression → DeleteDialog
// Détails → DetailSheet`,
  },
  {
    title: "Tokens de couleur",
    description: "Ne jamais utiliser de couleurs directes. Toujours utiliser les tokens sémantiques.",
    code: `// ✅ Correct
className="text-foreground bg-background"
className="text-destructive bg-destructive/10"

// ❌ À éviter
className="text-gray-900 bg-white"`,
  },
];

function StatusBadge({ status }: { status: PatternUsage["status"] }) {
  const config = {
    complete: { label: "Complet", variant: "default" as const, icon: CheckCircle2 },
    partial: { label: "Partiel", variant: "secondary" as const, icon: AlertCircle },
    low: { label: "Faible", variant: "destructive" as const, icon: AlertCircle },
  };

  const { label, variant, icon: Icon } = config[status];

  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export function UsageAudit() {
  const totalPatterns = PATTERN_USAGE.reduce((acc, p) => acc + p.usageCount, 0);
  const totalLegacy = PATTERN_USAGE.reduce((acc, p) => acc + p.legacyCount, 0);
  const overallAdoption = Math.round((totalPatterns / (totalPatterns + totalLegacy)) * 100);

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Adoption globale</CardDescription>
            <CardTitle className="text-3xl">{overallAdoption}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={overallAdoption} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Composants patterns</CardDescription>
            <CardTitle className="text-3xl text-success">{totalPatterns}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Utilisations des patterns standards</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Composants legacy</CardDescription>
            <CardTitle className="text-3xl text-warning">{totalLegacy}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">À migrer vers les patterns</p>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Adoption Table */}
      <Card>
        <CardHeader>
          <CardTitle>Adoption par pattern</CardTitle>
          <CardDescription>
            Taux d'adoption de chaque pattern standardisé.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {PATTERN_USAGE.map((pattern) => (
              <div
                key={pattern.name}
                className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{pattern.name}</span>
                    <StatusBadge status={pattern.status} />
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">
                    {pattern.importPath}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="text-success font-medium">{pattern.usageCount}</span>
                      {pattern.legacyCount > 0 && (
                        <span className="text-muted-foreground"> / {pattern.legacyCount} legacy</span>
                      )}
                    </p>
                  </div>
                  
                  <div className="w-24">
                    <Progress 
                      value={pattern.adoptionRate} 
                      className={cn(
                        "h-2",
                        pattern.status === "low" && "[&>div]:bg-warning"
                      )}
                    />
                  </div>
                  
                  <span className="text-sm font-medium w-12 text-right">
                    {pattern.adoptionRate}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legacy Files to Migrate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-warning" />
            Fichiers à migrer
          </CardTitle>
          <CardDescription>
            Composants utilisant encore des primitives brutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {LEGACY_FILES.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <code className="text-xs bg-muted px-2 py-1 rounded">{file.pattern}</code>
                  <span className="text-sm font-mono text-muted-foreground">{file.file}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">→</span>
                  <Badge variant="outline">{file.suggested}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-info" />
            Bonnes pratiques
          </CardTitle>
          <CardDescription>
            Règles à suivre pour maintenir la cohérence du design system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {GUIDELINES.map((guideline, idx) => (
            <div key={idx} className="space-y-2">
              <h4 className="font-medium">{guideline.title}</h4>
              <p className="text-sm text-muted-foreground">{guideline.description}</p>
              <pre className="p-3 rounded-lg bg-muted/50 border text-xs overflow-x-auto">
                <code>{guideline.code}</code>
              </pre>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
