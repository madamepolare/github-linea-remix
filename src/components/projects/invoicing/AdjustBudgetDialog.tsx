import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useProjectBudgetHistory } from "@/hooks/useProjectBudgetHistory";
import { Loader2 } from "lucide-react";

interface AdjustBudgetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  currentBudget: number;
}

const CHANGE_TYPES = [
  { value: "adjustment", label: "Ajustement" },
  { value: "amendment", label: "Avenant" },
  { value: "supplement", label: "Complément" },
];

export function AdjustBudgetDialog({
  open,
  onOpenChange,
  projectId,
  currentBudget,
}: AdjustBudgetDialogProps) {
  const [newBudget, setNewBudget] = useState(currentBudget.toString());
  const [changeType, setChangeType] = useState<"adjustment" | "amendment" | "supplement">("adjustment");
  const [reason, setReason] = useState("");

  const { addBudgetChange } = useProjectBudgetHistory(projectId);

  const handleSubmit = () => {
    const budgetValue = parseFloat(newBudget) || 0;
    
    addBudgetChange.mutate(
      {
        project_id: projectId,
        previous_budget: currentBudget,
        new_budget: budgetValue,
        change_type: changeType,
        change_reason: reason || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason("");
        },
      }
    );
  };

  const difference = (parseFloat(newBudget) || 0) - currentBudget;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajuster le budget projet</DialogTitle>
          <DialogDescription>
            Modifiez le budget et documentez la raison du changement
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Budget actuel</Label>
            <div className="text-lg font-semibold">{formatCurrency(currentBudget)}</div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newBudget">Nouveau budget (€ HT)</Label>
            <Input
              id="newBudget"
              type="number"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="0"
            />
            {difference !== 0 && (
              <p className={`text-sm ${difference > 0 ? "text-emerald-600" : "text-destructive"}`}>
                {difference > 0 ? "+" : ""}{formatCurrency(difference)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="changeType">Type de modification</Label>
            <Select value={changeType} onValueChange={(v) => setChangeType(v as typeof changeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANGE_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Raison (optionnel)</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Ajout de prestations complémentaires..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={addBudgetChange.isPending}>
            {addBudgetChange.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
