import { useState } from "react";
import { TrendingUp, Euro, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useProject } from "@/hooks/useProjects";
import { useProjectBudgetHistory } from "@/hooks/useProjectBudgetHistory";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface IncreaseBudgetDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IncreaseBudgetDialog({ 
  projectId, 
  open, 
  onOpenChange 
}: IncreaseBudgetDialogProps) {
  const { activeWorkspace } = useAuth();
  const { data: project } = useProject(projectId);
  const { addBudgetChange } = useProjectBudgetHistory(projectId);
  
  const [mode, setMode] = useState<'add' | 'set'>('add');
  const [amount, setAmount] = useState("");
  const [changeType, setChangeType] = useState<'amendment' | 'supplement' | 'adjustment'>('supplement');
  const [reason, setReason] = useState("");
  const [referenceDocId, setReferenceDocId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available commercial documents (avenants)
  const { data: documents = [] } = useQuery({
    queryKey: ["project-amendments", projectId],
    queryFn: async () => {
      if (!activeWorkspace) return [];
      const { data, error } = await supabase
        .from("commercial_documents")
        .select("id, document_number, title, total_amount")
        .eq("workspace_id", activeWorkspace.id)
        .eq("project_id", projectId)
        .in("status", ["accepted", "signed"])
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace && !!projectId && open,
  });

  const currentBudget = project?.budget || 0;
  const amountNum = parseFloat(amount) || 0;
  const newBudget = mode === 'add' ? currentBudget + amountNum : amountNum;
  const difference = newBudget - currentBudget;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNum <= 0 && mode === 'add') return;
    if (newBudget <= 0) return;

    setIsSubmitting(true);
    try {
      await addBudgetChange.mutateAsync({
        project_id: projectId,
        previous_budget: currentBudget,
        new_budget: newBudget,
        change_type: changeType,
        change_reason: reason || undefined,
        reference_document_id: referenceDocId || undefined,
      });
      onOpenChange(false);
      setAmount("");
      setReason("");
      setReferenceDocId("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Modifier le budget projet
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current budget display */}
          <div className="p-4 rounded-lg bg-muted">
            <p className="text-sm text-muted-foreground">Budget actuel</p>
            <p className="text-2xl font-bold">{formatCurrency(currentBudget)}</p>
          </div>

          {/* Mode selection */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={mode === 'add' ? 'default' : 'outline'}
              onClick={() => setMode('add')}
            >
              Ajouter un montant
            </Button>
            <Button
              type="button"
              variant={mode === 'set' ? 'default' : 'outline'}
              onClick={() => setMode('set')}
            >
              Définir le montant
            </Button>
          </div>

          {/* Amount input */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              {mode === 'add' ? 'Montant à ajouter' : 'Nouveau budget'}
            </Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="amount"
                type="number"
                min="0"
                step="100"
                placeholder={mode === 'add' ? "5000" : String(currentBudget)}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {/* Preview new budget */}
          {amountNum > 0 && (
            <Alert className={difference >= 0 ? "border-emerald-500 bg-emerald-50" : "border-red-500 bg-red-50"}>
              <TrendingUp className={`h-4 w-4 ${difference >= 0 ? "text-emerald-600" : "text-red-600"}`} />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>Nouveau budget :</span>
                  <span className="font-bold">{formatCurrency(newBudget)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Différence :</span>
                  <span className={difference >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {difference >= 0 ? "+" : ""}{formatCurrency(difference)}
                  </span>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Change type */}
          <div className="space-y-2">
            <Label htmlFor="changeType">Type de modification</Label>
            <Select value={changeType} onValueChange={(v: any) => setChangeType(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supplement">Complément de budget</SelectItem>
                <SelectItem value="amendment">Avenant contractuel</SelectItem>
                <SelectItem value="adjustment">Ajustement</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reference document */}
          {changeType === 'amendment' && documents.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="referenceDoc">Document de référence</Label>
              <Select value={referenceDocId} onValueChange={setReferenceDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un avenant..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun document</SelectItem>
                  {documents.map(doc => (
                    <SelectItem key={doc.id} value={doc.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {doc.document_number} - {doc.title}
                        {doc.total_amount && (
                          <span className="text-muted-foreground text-xs">
                            ({formatCurrency(doc.total_amount)})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Travaux supplémentaires demandés par le client..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || (amountNum <= 0 && mode === 'add') || newBudget <= 0}
            >
              {isSubmitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
