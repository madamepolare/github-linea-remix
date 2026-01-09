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
  defaultRate: number;
  projectId: string;
}

export function MemberClientRateDialog({
  open,
  onOpenChange,
  memberId,
  memberName,
  currentRate,
  defaultRate,
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
              placeholder={`Par défaut: ${defaultRate}€`}
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour utiliser le tarif par défaut de l'agence ({defaultRate}€/jour)
            </p>
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
