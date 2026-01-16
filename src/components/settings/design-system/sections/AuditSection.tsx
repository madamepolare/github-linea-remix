import { AlertTriangle, CheckCircle, Info, Zap, GitMerge, Layers, Code, ArrowRight, Copy, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { toast } from "sonner";

interface AuditIssue {
  id: string;
  severity: "critical" | "warning" | "info";
  category: "consistency" | "duplication" | "performance" | "accessibility";
  title: string;
  description: string;
  files: string[];
  recommendation: string;
  effort: "low" | "medium" | "high";
  prompt: string;
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
    effort: "high",
    prompt: `**REFACTORING - Unifier le Drag & Drop CRM (garder les spécificités)**

OBJECTIF : Migrer ContactPipeline.tsx pour utiliser le composant partagé KanbanBoard.tsx au lieu de @hello-pangea/dnd, TOUT EN CONSERVANT ses fonctionnalités uniques.

CONTEXTE TECHNIQUE :
- KanbanBoard.tsx expose une prop "renderCard" qui permet de passer un composant de carte personnalisé
- KanbanBoard.tsx expose "onDrop(itemId, fromColumnId, toColumnId)" qui peut être intercepté

SPÉCIFICITÉS À CONSERVER ABSOLUMENT dans ContactPipeline :
1. ✅ EntryCard avec ses badges d'alertes (actions en retard, réponses non lues, etc.)
2. ✅ Logique "requires_email_on_enter" qui ouvre un modal avant de déplacer vers certaines colonnes
3. ✅ Tous les modals : PipelineEmailModal, BulkAddToPipelineDialog, BulkEmailDialog, PipelineEntrySidebar
4. ✅ Le header spécifique avec boutons "Email groupé" et "Ajouter"

FICHIERS À MODIFIER :
1. src/components/crm/ContactPipeline.tsx :
   - Remplacer DragDropContext/Droppable/Draggable par <KanbanBoard />
   - Passer EntryCard via la prop "renderCard"
   - Gérer "requires_email_on_enter" dans le callback onDrop AVANT d'appeler moveEntry

2. src/components/shared/KanbanBoard.tsx :
   - SI NÉCESSAIRE, ajouter un prop "onBeforeDrop" qui retourne boolean/Promise pour annuler le drop
   - Ou gérer la logique modal dans le parent et ne pas appeler onDrop si modal affiché

ÉTAPES RECOMMANDÉES :
1. Lire KanbanBoard.tsx pour comprendre l'interface
2. Adapter ContactPipeline pour utiliser KanbanBoard avec renderCard={(entry, isDragging) => <EntryCard entry={entry} ... />}
3. Mapper pipeline.stages vers le format KanbanColumn[]
4. Le callback onDrop vérifie requires_email_on_enter et ouvre le modal si besoin
5. Tester le drag-and-drop et tous les modals

RÉSULTAT ATTENDU :
- ContactPipeline utilise KanbanBoard.tsx pour le DnD
- TOUTES les fonctionnalités métier restent identiques (modals, badges, actions)
- Possible désinstallation de @hello-pangea/dnd`
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
    effort: "medium",
    prompt: `**REFACTORING - Créer un DataTable générique**

OBJECTIF : Créer un composant DataTable réutilisable pour harmoniser toutes les vues listes.

CONTRAINTES CRITIQUES :
- ⚠️ NE PAS supprimer les vues existantes immédiatement
- ⚠️ Créer d'abord le composant générique, puis migrer une vue à la fois
- ⚠️ Chaque vue doit continuer à fonctionner exactement comme avant

À CRÉER :
1. src/components/shared/DataTable.tsx avec :
   - Props: columns (définition des colonnes avec header, accessor, render, sortable)
   - Props: data (tableau de données générique)
   - Props: onSort, onFilter, onRowClick
   - Intégration avec Table de shadcn/ui

2. Migrer EN PREMIER : TaskListView.tsx (le plus simple)

RÉSULTAT ATTENDU :
- Nouveau composant DataTable fonctionnel
- TaskListView migré et fonctionnel
- Les autres vues restent inchangées (migration ultérieure)`
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
    effort: "medium",
    prompt: `**REFACTORING - Extraire EntryCard comme composant partagé**

OBJECTIF : Extraire le composant EntryCard de ContactPipeline vers un fichier séparé réutilisable.

CONTRAINTES CRITIQUES :
- ⚠️ NE PAS modifier le rendu visuel de la carte actuelle
- ⚠️ Conserver toutes les props et le comportement existants
- ⚠️ Le ContactPipeline doit fonctionner exactement comme avant après le refactoring

ÉTAPES :
1. Créer src/components/crm/EntryCard.tsx
2. Copier la définition du composant EntryCard de ContactPipeline.tsx
3. Exporter le composant avec ses types/interfaces
4. Dans ContactPipeline.tsx, importer EntryCard depuis le nouveau fichier
5. Supprimer la définition interne

RÉSULTAT ATTENDU :
- EntryCard est dans son propre fichier
- ContactPipeline importe et utilise EntryCard
- Aucun changement visuel ou fonctionnel`
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
    effort: "low",
    prompt: `**REFACTORING - Centraliser le calcul du Health Status**

OBJECTIF : Créer un hook useHealthStatus() pour centraliser la logique de calcul des indicateurs de santé (retard, progression, alertes).

CONTRAINTES CRITIQUES :
- ⚠️ NE PAS modifier l'affichage visuel des badges existants
- ⚠️ Les calculs doivent retourner exactement les mêmes résultats qu'actuellement
- ⚠️ Migrer un composant à la fois pour tester

À CRÉER :
1. src/hooks/useHealthStatus.ts avec :
   - Input: { dueDate?, startDate?, endDate?, progress?, status? }
   - Output: { isLate: boolean, daysLate: number, healthLevel: 'good' | 'warning' | 'critical', progressPercent: number }

2. Migrer SubProjectCard.tsx en premier (plus simple)

RÉSULTAT ATTENDU :
- Hook useHealthStatus fonctionnel
- SubProjectCard utilise le hook
- Même rendu visuel qu'avant`
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
    effort: "low",
    prompt: `**AMÉLIORATION - Documenter et promouvoir KanbanCard**

OBJECTIF : S'assurer que tous les modules utilisant KanbanBoard passent par le composant KanbanCard pour bénéficier des fonctionnalités intégrées (célébrations, animations).

CONTRAINTES CRITIQUES :
- ⚠️ NE PAS modifier le comportement de KanbanCard
- ⚠️ Vérifier que chaque module utilisant KanbanBoard utilise bien renderCard avec KanbanCard

ÉTAPES :
1. Lister tous les usages de KanbanBoard dans le projet
2. Pour chaque usage, vérifier si renderCard utilise KanbanCard
3. Si non, proposer la migration vers KanbanCard

RÉSULTAT ATTENDU :
- Liste des modules à migrer (si applicable)
- Documentation sur l'utilisation de KanbanCard`
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
    effort: "medium",
    prompt: `**HARMONISATION - Utiliser Table shadcn partout**

OBJECTIF : Migrer les tableaux utilisant des divs custom vers le composant Table de shadcn/ui.

CONTRAINTES CRITIQUES :
- ⚠️ NE PAS modifier les données affichées
- ⚠️ Conserver toutes les fonctionnalités (tri, actions, etc.)
- ⚠️ Migrer UN tableau à la fois pour valider

ORDRE DE MIGRATION SUGGÉRÉ :
1. TeamMembersTable.tsx (probablement le plus simple)
2. TendersList.tsx
3. InvoiceTable.tsx (peut être plus complexe)

POUR CHAQUE MIGRATION :
- Identifier les colonnes actuelles
- Convertir vers <Table>, <TableHeader>, <TableBody>, <TableRow>, <TableCell>
- Tester que le rendu est identique

RÉSULTAT ATTENDU :
- Premier tableau migré et fonctionnel
- Pattern établi pour les suivants`
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const criticalCount = AUDIT_ISSUES.filter(i => i.severity === "critical").length;
  const warningCount = AUDIT_ISSUES.filter(i => i.severity === "warning").length;
  const infoCount = AUDIT_ISSUES.filter(i => i.severity === "info").length;

  const copyPromptToClipboard = async (issue: AuditIssue) => {
    try {
      await navigator.clipboard.writeText(issue.prompt);
      setCopiedId(issue.id);
      toast.success("Prompt copié !", {
        description: "Collez-le dans le chat Lovable pour demander la correction."
      });
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      toast.error("Erreur lors de la copie");
    }
  };

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
                const isCopied = copiedId === issue.id;

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

                        {/* Prompt Preview */}
                        <div className="bg-muted/30 border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-muted-foreground">Prompt pour Lovable :</p>
                          </div>
                          <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">
                            {issue.prompt}
                          </pre>
                        </div>
                        
                        <Button 
                          size="sm" 
                          variant={isCopied ? "default" : "outline"} 
                          className="w-full gap-2"
                          onClick={() => copyPromptToClipboard(issue)}
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-4 w-4" />
                              Copié ! Collez dans le chat Lovable
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4" />
                              Copier le prompt pour Lovable
                            </>
                          )}
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
