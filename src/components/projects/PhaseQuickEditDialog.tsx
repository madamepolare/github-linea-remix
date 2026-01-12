import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, Trash2, GripVertical, Calendar, FileText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PHASES_BY_PROJECT_TYPE,
  PROJECT_TYPE_LABELS,
  PhaseTemplate,
  ProjectType,
} from "@/lib/commercialTypes";
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
  onCreateManyPhases?: (phases: { name: string; description?: string; status?: PhaseStatus; color?: string }[]) => void;
  onUpdatePhase: (id: string, updates: Partial<ProjectPhase>) => void;
  onDeletePhase: (id: string) => void;
  onReorderPhases: (orderedIds: string[]) => void;
}

export function PhaseQuickEditDialog({
  open,
  onOpenChange,
  phases,
  onCreatePhase,
  onCreateManyPhases,
  onUpdatePhase,
  onDeletePhase,
  onReorderPhases,
}: PhaseQuickEditDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPhaseName, setNewPhaseName] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [addMode, setAddMode] = useState<"custom" | "template">("custom");
  const [selectedProjectType, setSelectedProjectType] = useState<ProjectType>("architecture");
  const [selectedTemplates, setSelectedTemplates] = useState<Set<string>>(new Set());

  const templates = useMemo(() => {
    return PHASES_BY_PROJECT_TYPE[selectedProjectType] || [];
  }, [selectedProjectType]);

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

  const handleAddFromTemplates = () => {
    if (selectedTemplates.size === 0) return;
    
    const selectedPhases = templates
      .filter(t => selectedTemplates.has(t.code))
      .map((template, index) => ({
        name: template.name,
        description: template.description || undefined,
        status: "pending" as PhaseStatus,
        color: PHASE_COLORS[(phases.length + index) % PHASE_COLORS.length],
      }));

    if (onCreateManyPhases && selectedPhases.length > 0) {
      onCreateManyPhases(selectedPhases);
    } else {
      // Fallback: create one by one
      selectedPhases.forEach(phase => {
        onCreatePhase(phase);
      });
    }
    
    setSelectedTemplates(new Set());
    setAddMode("custom");
  };

  const toggleTemplate = (code: string) => {
    setSelectedTemplates(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
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
          <div className="border-t pt-4 space-y-3">
            <Tabs value={addMode} onValueChange={(v) => setAddMode(v as "custom" | "template")}>
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="custom" className="text-xs gap-1.5">
                  <Plus className="h-3 w-3" />
                  Personnalisée
                </TabsTrigger>
                <TabsTrigger value="template" className="text-xs gap-1.5">
                  <FileText className="h-3 w-3" />
                  Phases types
                </TabsTrigger>
              </TabsList>

              <TabsContent value="custom" className="mt-3">
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
              </TabsContent>

              <TabsContent value="template" className="mt-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Select value={selectedProjectType} onValueChange={(v) => {
                    setSelectedProjectType(v as ProjectType);
                    setSelectedTemplates(new Set());
                  }}>
                    <SelectTrigger className="w-[200px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value} className="text-xs">
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => {
                      const baseCodes = templates.filter(t => t.category === "base").map(t => t.code);
                      setSelectedTemplates(new Set(baseCodes));
                    }}
                  >
                    Base
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8"
                    onClick={() => setSelectedTemplates(new Set(templates.map(t => t.code)))}
                  >
                    Tout
                  </Button>
                </div>

                <ScrollArea className="h-[150px] border rounded-lg">
                  <div className="p-2 space-y-1">
                    {templates.map((template, index) => {
                      const isSelected = selectedTemplates.has(template.code);
                      const isFirstComplementary = template.category === "complementary" && 
                        (index === 0 || templates[index - 1].category === "base");
                      
                      return (
                        <div key={template.code}>
                          {isFirstComplementary && (
                            <div className="py-1.5 px-2 text-[10px] font-medium text-muted-foreground border-t mt-1 pt-2">
                              Complémentaires
                            </div>
                          )}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleTemplate(template.code);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                toggleTemplate(template.code);
                              }
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 p-1.5 rounded text-left transition-colors text-xs cursor-pointer select-none",
                              isSelected ? "bg-primary/10" : "hover:bg-muted/50"
                            )}
                          >
                            <Checkbox 
                              checked={isSelected} 
                              className="h-3.5 w-3.5 pointer-events-none"
                              tabIndex={-1}
                            />
                            <Badge variant="outline" className="text-[10px] font-mono px-1 py-0">
                              {template.code}
                            </Badge>
                            <span className="truncate">{template.name}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>

                <Button 
                  onClick={handleAddFromTemplates} 
                  disabled={selectedTemplates.size === 0}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter {selectedTemplates.size > 0 ? `${selectedTemplates.size} phase${selectedTemplates.size > 1 ? "s" : ""}` : ""}
                </Button>
              </TabsContent>
            </Tabs>
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
