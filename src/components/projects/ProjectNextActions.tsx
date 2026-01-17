import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Euro,
  FileText,
  Layers,
  ListTodo,
  Package,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";

interface ProjectNextActionsProps {
  project: {
    id: string;
    name: string;
    budget: number | null;
    description: string | null;
    ai_summary: string | null;
    start_date: string | null;
    end_date: string | null;
    crm_company_id: string | null;
  };
  phases: any[];
  projectMembers: any[];
  tasksCount?: number;
  deliverablesCount?: number;
  onAction: (action: string) => void;
}

interface NextAction {
  id: string;
  priority: 'high' | 'medium' | 'low';
  icon: React.ElementType;
  title: string;
  description: string;
  action: string;
  actionLabel: string;
  completed: boolean;
}

export function ProjectNextActions({
  project,
  phases,
  projectMembers,
  tasksCount = 0,
  deliverablesCount = 0,
  onAction,
}: ProjectNextActionsProps) {
  // Calculate project setup progress and next actions
  const { actions, completedCount, totalCount, progressPercent } = useMemo(() => {
    const allActions: NextAction[] = [];

    // 1. Budget setup
    allActions.push({
      id: 'budget',
      priority: 'high',
      icon: Euro,
      title: 'Définir le budget',
      description: 'Configurer le budget du projet pour suivre la rentabilité',
      action: 'budget',
      actionLabel: 'Configurer',
      completed: !!project.budget,
    });

    // 2. Phases setup
    allActions.push({
      id: 'phases',
      priority: 'high',
      icon: Layers,
      title: 'Configurer les phases',
      description: 'Définir les phases du projet pour un suivi précis',
      action: 'phases',
      actionLabel: 'Gérer les phases',
      completed: phases.length > 0,
    });

    // 3. Team setup
    allActions.push({
      id: 'team',
      priority: 'high',
      icon: Users,
      title: 'Constituer l\'équipe',
      description: 'Ajouter les membres qui travaillent sur ce projet',
      action: 'team',
      actionLabel: 'Gérer l\'équipe',
      completed: projectMembers.length > 0,
    });

    // 4. Planning dates
    allActions.push({
      id: 'dates',
      priority: 'medium',
      icon: Calendar,
      title: 'Planifier les dates',
      description: 'Définir les dates de début et fin du projet',
      action: 'dates',
      actionLabel: 'Configurer',
      completed: !!(project.start_date && project.end_date),
    });

    // 5. Description / Brief
    allActions.push({
      id: 'description',
      priority: 'medium',
      icon: FileText,
      title: 'Ajouter une description',
      description: 'Documenter le contexte et les objectifs du projet',
      action: 'description',
      actionLabel: 'Ajouter',
      completed: !!project.description && project.description.length > 20,
    });

    // 6. Create tasks
    allActions.push({
      id: 'tasks',
      priority: 'medium',
      icon: ListTodo,
      title: 'Créer des tâches',
      description: 'Organiser le travail en tâches assignables',
      action: 'tasks',
      actionLabel: 'Voir les tâches',
      completed: tasksCount > 0,
    });

    // 7. Deliverables
    allActions.push({
      id: 'deliverables',
      priority: 'low',
      icon: Package,
      title: 'Définir les livrables',
      description: 'Lister les livrables attendus pour ce projet',
      action: 'deliverables',
      actionLabel: 'Gérer',
      completed: deliverablesCount > 0,
    });

    // 8. AI Summary
    allActions.push({
      id: 'ai_summary',
      priority: 'low',
      icon: Sparkles,
      title: 'Générer un résumé IA',
      description: 'Obtenir un résumé intelligent du projet',
      action: 'ai_summary',
      actionLabel: 'Générer',
      completed: !!project.ai_summary,
    });

    const completed = allActions.filter(a => a.completed).length;
    const total = allActions.length;
    const percent = Math.round((completed / total) * 100);

    return {
      actions: allActions,
      completedCount: completed,
      totalCount: total,
      progressPercent: percent,
    };
  }, [project, phases, projectMembers, tasksCount, deliverablesCount]);

  // Get pending actions sorted by priority
  const pendingActions = useMemo(() => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return actions
      .filter(a => !a.completed)
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }, [actions]);

  // If all done, show success state
  if (pendingActions.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-success/10 to-success/5 border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-success">Projet bien configuré !</h3>
              <p className="text-sm text-muted-foreground">
                Toutes les informations essentielles sont renseignées
              </p>
            </div>
            <Badge variant="secondary" className="bg-success/20 text-success border-0">
              {completedCount}/{totalCount}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top 3 pending actions to show
  const topActions = pendingActions.slice(0, 3);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Header with progress */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-b px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Prochaines actions</h3>
                <p className="text-sm text-muted-foreground">
                  {pendingActions.length} action{pendingActions.length > 1 ? 's' : ''} en attente
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
              <p className="text-xs text-muted-foreground">configuré</p>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        {/* Action items */}
        <div className="divide-y">
          {topActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <div 
                key={action.id}
                className={cn(
                  "flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50",
                  index === 0 && "bg-primary/5"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  action.priority === 'high' && "bg-primary/20 text-primary",
                  action.priority === 'medium' && "bg-amber-500/20 text-amber-600",
                  action.priority === 'low' && "bg-muted text-muted-foreground"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm">{action.title}</h4>
                    {action.priority === 'high' && index === 0 && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-primary/20 text-primary border-0">
                        Recommandé
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {action.description}
                  </p>
                </div>

                <Button 
                  size="sm" 
                  variant={index === 0 ? "default" : "outline"}
                  className="shrink-0 gap-1.5"
                  onClick={() => onAction(action.action)}
                >
                  {action.actionLabel}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>

        {/* Show more link if more actions */}
        {pendingActions.length > 3 && (
          <div className="px-6 py-3 bg-muted/30 border-t">
            <p className="text-xs text-muted-foreground text-center">
              +{pendingActions.length - 3} autre{pendingActions.length - 3 > 1 ? 's' : ''} action{pendingActions.length - 3 > 1 ? 's' : ''} à compléter
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
