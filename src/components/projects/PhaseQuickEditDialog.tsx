import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, Trash2, GripVertical, Calendar } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ProjectPhase } from "@/hooks/useProjectPhases";
import { PHASE_STATUS_CONFIG, PhaseStatus, PHASE_COLORS } from "@/lib/projectTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PhaseQuickEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phases: ProjectPhase[];
  onCreatePhase: (phase: { name: string; status?: PhaseStatus; start_date?: string | null; end_date?: string | null; color?: string }) => void;
  onUpdatePhase: (id: string, updates: Partial<ProjectPhase>) => void;
  onDeletePhase: (id: string) => void;
  onReorderPhases: (orderedIds: string[]) => void;
}

export function PhaseQuickEditDialog({
  open,
  onOpenChange,
  phases,
  onCreatePhase,
  onUpdatePhase,
  onDeletePhase,
  onReorderPhases,
}: PhaseQuickEditDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleAddPhase = () => {
    if (!newPhaseName.trim()) return;
    
    const nextOrder = phases.length;
    const color = PHASE_COLORS[nextOrder % PHASE_COLORS.length];
    
    onCreatePhase({
      name: newPhaseName.trim(),
      status: "pending",
      color,
    });
    setNewPhaseName("");
  };

  const handleDragStart = (e: React.DragEvent, phaseId: string) => {
    setDraggedId(phaseId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetId) return;

    const newOrder = [...phases];
    const draggedIndex = newOrder.findIndex((p) => p.id === draggedId);
    const targetIndex = newOrder.findIndex((p) => p.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const [draggedPhase] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedPhase);

    onReorderPhases(newOrder.map((p) => p.id));
    setDraggedId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Gérer les phases</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-4">
            {phases.map((phase) => (
              <PhaseEditRow
                key={phase.id}
                phase={phase}
                isEditing={editingId === phase.id}
                isDragging={draggedId === phase.id}
                onStartEdit={() => setEditingId(phase.id)}
                onCancelEdit={() => setEditingId(null)}
                onUpdate={(updates) => {
                  onUpdatePhase(phase.id, updates);
                  setEditingId(null);
                }}
                onDelete={() => setDeleteConfirmId(phase.id)}
                onDragStart={(e) => handleDragStart(e, phase.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, phase.id)}
                onDragEnd={handleDragEnd}
              />
            ))}

            {phases.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Aucune phase. Ajoutez votre première phase ci-dessous.
              </div>
            )}
          </div>

          {/* Add new phase */}
          <div className="border-t pt-4">
            <div className="flex gap-2">
              <Input
                placeholder="Nom de la nouvelle phase..."
                value={newPhaseName}
                onChange={(e) => setNewPhaseName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPhase()}
                className="flex-1"
              />
              <Button onClick={handleAddPhase} disabled={!newPhaseName.trim()}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la phase ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La phase et ses dépendances seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirmId) {
                  onDeletePhase(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface PhaseEditRowProps {
  phase: ProjectPhase;
  isEditing: boolean;
  isDragging: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onUpdate: (updates: Partial<ProjectPhase>) => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

function PhaseEditRow({
  phase,
  isEditing,
  isDragging,
  onStartEdit,
  onCancelEdit,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: PhaseEditRowProps) {
  const [name, setName] = useState(phase.name);
  const [status, setStatus] = useState(phase.status);
  const [startDate, setStartDate] = useState<Date | undefined>(
    phase.start_date ? parseISO(phase.start_date) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    phase.end_date ? parseISO(phase.end_date) : undefined
  );
  const [color, setColor] = useState(phase.color || "#3B82F6");

  const handleSave = () => {
    onUpdate({
      name,
      status,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      end_date: endDate ? format(endDate, "yyyy-MM-dd") : null,
      color,
    });
  };

  const statusConfig = PHASE_STATUS_CONFIG[phase.status as PhaseStatus] || PHASE_STATUS_CONFIG.pending;

  if (isEditing) {
    return (
      <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as PhaseStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PHASE_STATUS_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Date de début</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "dd MMM yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="space-y-2">
            <Label>Date de fin</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, "dd MMM yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Couleur</Label>
          <div className="flex gap-2 flex-wrap">
            {PHASE_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={cn(
                  "w-8 h-8 rounded-full border-2 transition-all",
                  color === c ? "border-foreground scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onCancelEdit}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave}>
            Enregistrer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-center gap-3 border rounded-lg p-3 bg-card transition-all",
        isDragging && "opacity-50"
      )}
    >
      <div className="cursor-grab text-muted-foreground hover:text-foreground">
        <GripVertical className="h-4 w-4" />
      </div>

      <div
        className="w-4 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: phase.color || "#3B82F6" }}
      />

      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{phase.name}</div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <span
            className="px-1.5 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: `${statusConfig.color}20`,
              color: statusConfig.color,
            }}
          >
            {statusConfig.label}
          </span>
          {(phase.start_date || phase.end_date) && (
            <span>
              {phase.start_date && format(parseISO(phase.start_date), "dd/MM/yy")}
              {phase.start_date && phase.end_date && " → "}
              {phase.end_date && format(parseISO(phase.end_date), "dd/MM/yy")}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onStartEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
