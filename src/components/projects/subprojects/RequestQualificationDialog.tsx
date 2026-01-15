import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, DollarSign, XCircle, Loader2, Package, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface RequestQualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  parentId: string;
}

type QualificationType = "included" | "supplementary" | "rejected";

export function RequestQualificationDialog({
  open,
  onOpenChange,
  projectId,
  projectName,
  parentId,
}: RequestQualificationDialogProps) {
  const [qualification, setQualification] = useState<QualificationType>("included");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (qualification === "rejected") {
        // Archive the project
        const { error } = await supabase
          .from("projects")
          .update({ 
            status: "archived",
            description: notes ? `[Refusé] ${notes}` : "[Refusé par l'équipe]"
          })
          .eq("id", projectId);

        if (error) throw error;
        toast.success("Demande refusée et archivée");
      } else {
        // Update billing type and activate
        const { error } = await supabase
          .from("projects")
          .update({ 
            billing_type: qualification,
            status: "active",
          })
          .eq("id", projectId);

        if (error) throw error;
        
        if (qualification === "supplementary") {
          toast.success("Demande qualifiée comme supplémentaire - Pensez à créer le devis");
        } else {
          toast.success("Demande incluse au forfait et activée");
        }
      }

      queryClient.invalidateQueries({ queryKey: ["sub-projects", parentId] });
      queryClient.invalidateQueries({ queryKey: ["sub-projects-stats", parentId] });
      onOpenChange(false);
    } catch (error) {
      console.error("Error qualifying request:", error);
      toast.error("Erreur lors de la qualification");
    } finally {
      setIsSubmitting(false);
    }
  };

  const options = [
    {
      value: "included" as const,
      label: "Inclure au forfait",
      description: "Cette demande fait partie du contrat en cours",
      icon: Package,
      color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    },
    {
      value: "supplementary" as const,
      label: "Travail supplémentaire",
      description: "Nécessite un devis et une facturation à part",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    },
    {
      value: "rejected" as const,
      label: "Refuser la demande",
      description: "Cette demande ne peut pas être traitée",
      icon: XCircle,
      color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Qualifier la demande
          </DialogTitle>
          <DialogDescription>
            Comment souhaitez-vous traiter "{projectName}" ?
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <RadioGroup
            value={qualification}
            onValueChange={(v) => setQualification(v as QualificationType)}
            className="space-y-3"
          >
            {options.map((option) => (
              <label
                key={option.value}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                  qualification === option.value
                    ? option.color
                    : "border-border hover:bg-accent"
                )}
              >
                <RadioGroupItem value={option.value} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <option.icon className="h-4 w-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                </div>
              </label>
            ))}
          </RadioGroup>

          {qualification === "rejected" && (
            <div className="space-y-2">
              <Label htmlFor="notes">Raison du refus (optionnel)</Label>
              <Textarea
                id="notes"
                placeholder="Expliquez pourquoi cette demande est refusée..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="resize-none"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                En cours...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Confirmer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
