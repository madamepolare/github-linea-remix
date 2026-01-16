import { AlertTriangle, CheckCircle, Info, Zap, GitMerge, Layers, Code, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface AuditIssue {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "consistency" | "duplication" | "performance" | "accessibility";
  title: string;
  description: string;
  files: string[];
  recommendation: string;
  effort: "low" | "medium" | "high";
}

const AUDIT_ISSUES: AuditIssue[] = [
  {
    id: "kanban-dnd-lib",
    severity: "critical",
    category: "consistency",
    title: "2 bibliothèques Drag & Drop différentes",
    description: "Le CRM ContactPipeline utilise @hello-pangea/dnd tandis que les autres modules (Projects, Tasks, Commercial, Tenders) utilisent le KanbanBoard partagé avec HTML5 native DnD.",
    files: [
      "src/components/crm/ContactPipeline.tsx",
      "src/components/shared/KanbanBoard.tsx"
    ],
    recommendation: "Migrer ContactPipeline vers KanbanBoard.tsx pour unifier le comportement drag-and-drop et réduire le bundle size.",
    effort: "high"
  },
  {
    id: "list-views-duplicate",
    severity: "warning",
    category: "duplication",
    title: "Vues listes non harmonisées",
    description: "Chaque module implémente sa propre vue liste avec logique de tri, filtrage et colonnes dupliquée.",
    files: [
      "src/components/crm/ProspectionListView.tsx",
      "src/components/commercial/CommercialListView.tsx",
      "src/components/projects/ProjectListView.tsx",
      "src/components/tasks/TaskListView.tsx"
    ],
    recommendation: "Créer un composant DataTable générique avec colonnes configurables, tri et filtrage intégrés.",
    effort: "medium"
  },
  {
    id: "entry-card-internal",
    severity: "warning",
    category: "duplication",
    title: "EntryCard CRM non exporté",
    description: "Le composant EntryCard dans ContactPipeline est défini en interne et n'est pas réutilisable. Des patterns similaires existent dans TaskCard et ProjectCard.",
    files: [
      "src/components/crm/ContactPipeline.tsx (EntryCard interne)",
      "src/components/tasks/TaskCard.tsx",
      "src/components/projects/ProjectCard.tsx"
    ],
    recommendation: "Extraire EntryCard comme composant partagé ou utiliser un BaseCard avec variants.",
    effort: "medium"
  },
  {
    id: "health-status-duplicate",
    severity: "info",
    category: "duplication",
    title: "Logique de 'Health Status' dupliquée",
    description: "Les badges de retard, progression et alertes sont calculés indépendamment dans plusieurs composants de cartes.",
    files: [
      "src/components/projects/SubProjectCard.tsx",
      "src/components/projects/ProjectCard.tsx",
      "src/components/tasks/TaskCard.tsx"
    ],
    recommendation: "Créer un hook useHealthStatus() ou un utilitaire pour centraliser le calcul des indicateurs de santé.",
    effort: "low"
  },
  {
    id: "kanban-card-unused",
    severity: "info",
    category: "consistency",
    title: "KanbanCard sous-utilisé",
    description: "Le composant KanbanCard exporté par KanbanBoard.tsx avec gestion des célébrations n'est pas systématiquement utilisé.",
    files: [
      "src/components/shared/KanbanBoard.tsx"
    ],
    recommendation: "Standardiser l'utilisation de KanbanCard dans tous les modules utilisant KanbanBoard.",
    effort: "low"
  },
  {
    id: "table-components",
    severity: "info",
    category: "duplication",
    title: "Tables avec structures différentes",
    description: "Les tableaux utilisent différentes approches : certains avec Table de shadcn, d'autres avec des divs custom.",
    files: [
      "src/components/invoicing/InvoiceTable.tsx",
      "src/components/team/TeamMembersTable.tsx",
      "src/components/tenders/TendersList.tsx"
    ],
    recommendation: "Utiliser systématiquement le composant Table de shadcn avec un wrapper DataTable configurable.",
    effort: "medium"
  }
];

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", badge: "destructive" as const },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", badge: "warning" as const },
  info: { icon: Info, color: "text-blue-500", bg: "bg-blue-500/10", badge: "secondary" as const }
};

const effortConfig = {
  low: { label: "Faible", color: "bg-green-500" },
  medium: { label: "Moyen", color: "bg-yellow-500" },
  high: { label: "Élevé", color: "bg-red-500" }
};

const categoryConfig = {
  consistency: { label: "Cohérence", icon: GitMerge },
  duplication: { label: "Duplication", icon: Layers },
  performance: { label: "Performance", icon: Zap },
  accessibility: { label: "Accessibilité", icon: CheckCircle }
};

export function AuditSection() {
  const criticalCount = AUDIT_ISSUES.filter(i => i.severity === "critical").length;
  const warningCount = AUDIT_ISSUES.filter(i => i.severity === "warning").length;
  const infoCount = AUDIT_ISSUES.filter(i => i.severity === "info").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{criticalCount}</p>
                <p className="text-sm text-muted-foreground">Critiques</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-warning">{warningCount}</p>
                <p className="text-sm text-muted-foreground">Avertissements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-500">{infoCount}</p>
                <p className="text-sm text-muted-foreground">Suggestions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-500/50 bg-green-500/5">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-500">280+</p>
                <p className="text-sm text-muted-foreground">Composants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Issues List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Opportunités d'optimisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] pr-4">
            <Accordion type="multiple" className="space-y-3">
              {AUDIT_ISSUES.map((issue) => {
                const severity = severityConfig[issue.severity];
                const effort = effortConfig[issue.effort];
                const category = categoryConfig[issue.category];
                const SeverityIcon = severity.icon;
                const CategoryIcon = category.icon;

                return (
                  <AccordionItem 
                    key={issue.id} 
                    value={issue.id}
                    className={`border rounded-lg px-4 ${severity.bg}`}
                  >
                    <AccordionTrigger className="hover:no-underline py-3">
                      <div className="flex items-center gap-3 text-left">
                        <SeverityIcon className={`h-5 w-5 ${severity.color} flex-shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{issue.title}</span>
                            <Badge variant={severity.badge} className="text-xs">
                              {issue.severity === "critical" ? "Critique" : issue.severity === "warning" ? "Attention" : "Info"}
                            </Badge>
                            <Badge variant="outline" className="text-xs gap-1">
                              <CategoryIcon className="h-3 w-3" />
                              {category.label}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${effort.color}`} />
                          Effort {effort.label}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <div className="space-y-4 pt-2">
                        <p className="text-sm text-muted-foreground">
                          {issue.description}
                        </p>
                        
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">Fichiers concernés :</p>
                          <div className="space-y-1">
                            {issue.files.map((file, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs font-mono bg-muted/50 px-2 py-1 rounded">
                                <Code className="h-3 w-3 text-muted-foreground" />
                                {file}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                          <div className="flex items-start gap-2">
                            <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-primary mb-1">Recommandation</p>
                              <p className="text-sm">{issue.recommendation}</p>
                            </div>
                          </div>
                        </div>
                        
                        <Button size="sm" variant="outline" className="w-full">
                          Demander la correction à Lovable
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
