import { useState } from "react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { useCreateSubProject } from "@/hooks/useSubProjects";
import { format } from "date-fns";
import { Loader2, FolderPlus, Package, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateSubProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  parentName: string;
  defaultBillingType?: "included" | "supplementary";
}

export function CreateSubProjectDialog({
  open,
  onOpenChange,
  parentId,
  parentName,
  defaultBillingType = "included",
}: CreateSubProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [billingType, setBillingType] = useState<"included" | "supplementary">(defaultBillingType);
  
  const createSubProject = useCreateSubProject();

  const handleCreate = () => {
    if (!name.trim()) return;
    
    createSubProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        parent_id: parentId,
        end_date: deadline ? format(deadline, "yyyy-MM-dd") : undefined,
        billing_type: billingType,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          resetForm();
        },
      }
    );
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setDeadline(null);
    setBillingType(defaultBillingType);
  };

  const billingOptions = [
    {
      value: "included" as const,
      label: "Forfait",
      description: "Inclus dans le contrat",
      icon: Package,
      color: "text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800",
    },
    {
      value: "supplementary" as const,
      label: "Supplémentaire",
      description: "Facturation à part",
      icon: DollarSign,
      color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) resetForm(); onOpenChange(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-primary" />
            Nouvelle demande
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Ajouter une demande au projet <span className="font-medium">{parentName}</span>
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Billing Type */}
          <div className="space-y-2">
            <Label>Type de facturation</Label>
            <RadioGroup
              value={billingType}
              onValueChange={(v) => setBillingType(v as "included" | "supplementary")}
              className="grid grid-cols-2 gap-3"
            >
              {billingOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all hover:bg-accent",
                    billingType === option.value
                      ? option.color
                      : "border-muted"
                  )}
                >
                  <RadioGroupItem value={option.value} className="sr-only" />
                  <option.icon className="h-5 w-5 mb-1" />
                  <span className="text-sm font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground text-center">
                    {option.description}
                  </span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Nom de la demande *</Label>
            <Input
              id="name"
              placeholder="Ex: Rapport d'activité 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Détails de la demande..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Deadline */}
          <div className="space-y-2">
            <Label>Date limite</Label>
            <InlineDatePicker
              value={deadline}
              onChange={setDeadline}
              placeholder="Sélectionner une date"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || createSubProject.isPending}
          >
            {createSubProject.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Créer la demande
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
