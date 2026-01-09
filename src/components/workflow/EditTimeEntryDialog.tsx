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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useUpdateTimeEntry, useDeleteTimeEntry, TeamTimeEntry } from "@/hooks/useTeamTimeEntries";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, Trash2, Save } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface EditTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: TeamTimeEntry | null;
}

export function EditTimeEntryDialog({
  open,
  onOpenChange,
  entry,
}: EditTimeEntryDialogProps) {
  const updateEntry = useUpdateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [isBillable, setIsBillable] = useState(true);

  useEffect(() => {
    if (entry) {
      setDescription(entry.description || "");
      setDurationMinutes(entry.duration_minutes);
      setIsBillable(entry.is_billable);
    }
  }, [entry]);

  const handleSubmit = async () => {
    if (!entry) return;

    await updateEntry.mutateAsync({
      id: entry.id,
      description: description || null,
      duration_minutes: durationMinutes,
      is_billable: isBillable,
    });

    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!entry) return;
    await deleteEntry.mutateAsync(entry.id);
    onOpenChange(false);
  };

  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Modifier le temps
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {format(parseISO(entry.date), "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project info (read-only) */}
          {(entry.project?.name || entry.task?.title) && (
            <div className="space-y-1">
              <Label className="text-muted-foreground">Associé à</Label>
              <div className="text-sm font-medium">
                {entry.project?.name && <div>{entry.project.name}</div>}
                {entry.task?.title && (
                  <div className="text-muted-foreground">{entry.task.title}</div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label>Description du travail</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le travail effectué..."
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Durée (minutes)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              = {durationHours}h{durationMins > 0 ? ` ${durationMins}min` : ""}
            </p>
          </div>

          {/* Billable toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="billable" className="cursor-pointer">Temps facturable</Label>
            <Switch
              id="billable"
              checked={isBillable}
              onCheckedChange={setIsBillable}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer ce temps ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Le temps sera définitivement supprimé.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <div className="flex-1" />
          
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={updateEntry.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
