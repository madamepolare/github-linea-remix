import { useState, useEffect } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useProjectDeliverables } from "@/hooks/useProjectDeliverables";
import { RelatedEntityType } from "@/lib/taskTypes";
import { EntitySelector } from "./EntitySelector";
import { MultiAssigneePicker } from "./MultiAssigneePicker";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2, Package } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: Task["status"];
  defaultRelatedType?: RelatedEntityType;
  defaultRelatedId?: string;
  defaultProjectId?: string;
  defaultDeliverableId?: string;
}

const priorityOptions = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

const statusOptions = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "review", label: "En revue" },
  { value: "done", label: "Terminé" },
];

export function CreateTaskDialog({ 
  open, 
  onOpenChange, 
  defaultStatus = "todo",
  defaultRelatedType,
  defaultRelatedId,
  defaultProjectId,
  defaultDeliverableId,
}: CreateTaskDialogProps) {
  const { createTask } = useTasks();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [estimatedHours, setEstimatedHours] = useState("");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [relatedType, setRelatedType] = useState<RelatedEntityType | null>(
    defaultProjectId ? "project" : (defaultRelatedType || null)
  );
  const [relatedId, setRelatedId] = useState<string | null>(
    defaultProjectId || defaultRelatedId || null
  );
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(
    defaultDeliverableId || null
  );

  // Fetch deliverables when a project is selected
  const projectId = relatedType === "project" ? relatedId : null;
  const { deliverables } = useProjectDeliverables(projectId || "");

  // Reset form when dialog opens with new defaults
  useEffect(() => {
    if (open) {
      if (defaultProjectId) {
        setRelatedType("project");
        setRelatedId(defaultProjectId);
      } else {
        setRelatedType(defaultRelatedType || null);
        setRelatedId(defaultRelatedId || null);
      }
      setSelectedDeliverableId(defaultDeliverableId || null);
      setAssignees([]);
    }
  }, [open, defaultRelatedType, defaultRelatedId, defaultProjectId, defaultDeliverableId]);

  // Reset deliverable when project changes
  useEffect(() => {
    if (relatedType !== "project" || !relatedId) {
      setSelectedDeliverableId(null);
    }
  }, [relatedType, relatedId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Map related type to specific field
    const entityFields: Partial<Task> = {};
    if (relatedType && relatedId) {
      entityFields.related_type = relatedType;
      entityFields.related_id = relatedId;
      
      switch (relatedType) {
        case "project":
          entityFields.project_id = relatedId;
          break;
        case "lead":
          entityFields.lead_id = relatedId;
          break;
        case "company":
          entityFields.crm_company_id = relatedId;
          break;
        case "contact":
          entityFields.contact_id = relatedId;
          break;
        case "tender":
          entityFields.tender_id = relatedId;
          break;
      }
    }

    // Add deliverable if selected
    if (selectedDeliverableId) {
      entityFields.deliverable_id = selectedDeliverableId;
    }

    await createTask.mutateAsync({
      title,
      description: description || null,
      status,
      priority,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      assigned_to: assignees.length > 0 ? assignees : null,
      ...entityFields,
    });

    // Reset form
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(undefined);
    setEstimatedHours("");
    setAssignees([]);
    setRelatedType(null);
    setRelatedId(null);
    setSelectedDeliverableId(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle tâche</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de la tâche"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la tâche..."
              rows={3}
            />
          </div>

          {/* Entity Selector */}
          <EntitySelector
            entityType={relatedType}
            entityId={relatedId}
            onEntityTypeChange={setRelatedType}
            onEntityIdChange={setRelatedId}
          />

          {/* Deliverable Selector - shown when project is selected */}
          {relatedType === "project" && relatedId && deliverables && deliverables.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Livrable associé
              </Label>
              <Select 
                value={selectedDeliverableId || "none"} 
                onValueChange={(v) => setSelectedDeliverableId(v === "none" ? null : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un livrable (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun livrable</SelectItem>
                  {deliverables.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Si toutes les tâches du livrable sont terminées, il passera en "Prêt à envoyer"
              </p>
            </div>
          )}

          {/* Assignee Picker */}
          <div className="space-y-2">
            <Label>Assigner à</Label>
            <MultiAssigneePicker
              value={assignees}
              onChange={setAssignees}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Échéance</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "d MMM yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimatedHours">Estimation (heures)</Label>
              <Input
                id="estimatedHours"
                type="number"
                step="0.5"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={createTask.isPending || !title.trim()}>
              {createTask.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Créer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
