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
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { useCreateSubProject } from "@/hooks/useSubProjects";
import { format } from "date-fns";
import { Loader2, FolderPlus } from "lucide-react";

interface CreateSubProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId: string;
  parentName: string;
}

export function CreateSubProjectDialog({
  open,
  onOpenChange,
  parentId,
  parentName,
}: CreateSubProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState<Date | null>(null);
  
  const createSubProject = useCreateSubProject();

  const handleCreate = () => {
    if (!name.trim()) return;
    
    createSubProject.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        parent_id: parentId,
        end_date: deadline ? format(deadline, "yyyy-MM-dd") : undefined,
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
  };

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
