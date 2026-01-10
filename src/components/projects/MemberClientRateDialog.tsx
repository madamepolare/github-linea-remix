import { useState, useEffect } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MemberClientRateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  memberId: string;
  memberName: string;
  currentRate: number | null;
  memberDefaultRate: number | null;
  workspaceRate: number;
  projectId: string;
}

export function MemberClientRateDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentRate,
  memberDefaultRate,
  workspaceRate,
  projectId,
}: MemberClientRateDialogProps) {
  const [rate, setRate] = useState<string>("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setRate(currentRate?.toString() || "");
    }
  }, [open, currentRate]);

  const updateRate = useMutation({
    mutationFn: async (newRate: number | null) => {
      const { error } = await supabase
        .from("project_members")
        .update({ client_daily_rate: newRate })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast.success("Tarif client mis à jour");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour du tarif");
    },
  });

  const handleSave = () => {
    const numericRate = rate.trim() === "" ? null : parseFloat(rate);
    if (rate.trim() !== "" && (isNaN(numericRate!) || numericRate! < 0)) {
      toast.error("Veuillez entrer un tarif valide");
      return;
    }
    updateRate.mutate(numericRate);
  };

  // Calculate effective rate if left empty
  const effectiveRate = memberDefaultRate ?? workspaceRate;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Tarif client personnalisé</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Définir un tarif journalier client spécifique pour <strong>{memberName}</strong> sur ce projet.
          </p>
          <div className="space-y-2">
            <Label htmlFor="rate">Tarif journalier (€)</Label>
            <Input
              id="rate"
              type="number"
              min="0"
              step="0.01"
              placeholder={`Par défaut: ${effectiveRate}€`}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Laissez vide pour utiliser le tarif par défaut :</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                {memberDefaultRate !== null && (
                  <li className="text-blue-600">
                    Tarif membre : {memberDefaultRate}€/jour
                  </li>
                )}
                <li className={memberDefaultRate === null ? "" : "text-muted-foreground/70"}>
                  Tarif agence : {workspaceRate}€/jour
                  {memberDefaultRate === null && " (utilisé)"}
                </li>
              </ul>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={updateRate.isPending}>
            {updateRate.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
