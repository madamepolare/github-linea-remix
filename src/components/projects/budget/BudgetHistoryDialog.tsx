import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Plus,
  FileText,
  User,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useProjectBudgetHistory } from "@/hooks/useProjectBudgetHistory";
import { useProject } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";
import { IncreaseBudgetDialog } from "./IncreaseBudgetDialog";

interface BudgetHistoryDialogProps {
  projectId: string;
  trigger?: React.ReactNode;
}

const CHANGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  initial: { label: "Initial", color: "bg-blue-100 text-blue-700" },
  amendment: { label: "Avenant", color: "bg-purple-100 text-purple-700" },
  supplement: { label: "Complément", color: "bg-emerald-100 text-emerald-700" },
  adjustment: { label: "Ajustement", color: "bg-amber-100 text-amber-700" },
};

export function BudgetHistoryDialog({ projectId, trigger }: BudgetHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [increaseDialogOpen, setIncreaseDialogOpen] = useState(false);
  const { history, isLoading, totals } = useProjectBudgetHistory(projectId);
  const { data: project } = useProject(projectId);

  const formatCurrency = (value: number | null) => {
    if (value === null) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <History className="h-4 w-4 mr-2" />
              Historique
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Historique du budget
              </span>
              <Button 
                size="sm" 
                onClick={() => setIncreaseDialogOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Modifier le budget
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Current budget summary */}
          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Budget actuel</p>
              <p className="text-xl font-bold">{formatCurrency(project?.budget || 0)}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-50">
              <p className="text-sm text-emerald-600">Total augmentations</p>
              <p className="text-xl font-bold text-emerald-700">
                +{formatCurrency(totals.totalIncrease)}
              </p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-50">
              <p className="text-sm text-red-600">Total diminutions</p>
              <p className="text-xl font-bold text-red-700">
                -{formatCurrency(totals.totalDecrease)}
              </p>
            </div>
          </div>

          <Separator />

          {/* History timeline */}
          <ScrollArea className="h-[400px] pr-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-muted-foreground">Chargement...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">Aucun historique de modification</p>
                <p className="text-sm text-muted-foreground">
                  Les modifications de budget apparaîtront ici
                </p>
              </div>
            ) : (
              <div className="space-y-4 relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                {history.map((entry, index) => {
                  const isIncrease = (entry.new_budget || 0) > (entry.previous_budget || 0);
                  const change = (entry.new_budget || 0) - (entry.previous_budget || 0);
                  const typeInfo = CHANGE_TYPE_LABELS[entry.change_type] || CHANGE_TYPE_LABELS.adjustment;

                  return (
                    <div key={entry.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className={cn(
                        "absolute left-2 top-2 w-5 h-5 rounded-full border-2 border-background flex items-center justify-center",
                        isIncrease ? "bg-emerald-500" : "bg-red-500"
                      )}>
                        {isIncrease ? (
                          <TrendingUp className="h-3 w-3 text-white" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-white" />
                        )}
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(entry.created_at), "d MMMM yyyy à HH:mm", { locale: fr })}
                              </span>
                            </div>
                            {entry.change_reason && (
                              <p className="text-sm">{entry.change_reason}</p>
                            )}
                          </div>
                          <span className={cn(
                            "font-bold",
                            isIncrease ? "text-emerald-600" : "text-red-600"
                          )}>
                            {isIncrease ? "+" : ""}{formatCurrency(change)}
                          </span>
                        </div>

                        {/* Budget change details */}
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {formatCurrency(entry.previous_budget)}
                          </span>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {formatCurrency(entry.new_budget)}
                          </span>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm">
                          {entry.changed_by_user && (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={entry.changed_by_user.avatar_url || undefined} />
                                <AvatarFallback className="text-xs">
                                  {getInitials(entry.changed_by_user.full_name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-muted-foreground">
                                {entry.changed_by_user.full_name || "Utilisateur"}
                              </span>
                            </div>
                          )}
                          {entry.reference_document && (
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <FileText className="h-4 w-4" />
                              <span>{entry.reference_document.document_number}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <IncreaseBudgetDialog
        projectId={projectId}
        open={increaseDialogOpen}
        onOpenChange={setIncreaseDialogOpen}
      />
    </>
  );
}
