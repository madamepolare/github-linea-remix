import { useState } from "react";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { MultiAssigneePicker } from "./MultiAssigneePicker";
import { InlineDatePicker } from "./InlineDatePicker";
import { TagInput } from "./TagInput";
import { EntitySelector } from "./EntitySelector";
import { RelatedEntityType } from "@/lib/taskTypes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Plus, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface TaskCreateSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDueDate?: Date | null;
  defaultProjectId?: string | null;
}

const statusOptions = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "review", label: "En revue" },
  { value: "done", label: "Terminé" },
];

const priorityOptions = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

export function TaskCreateSheet({ 
  open, 
  onOpenChange, 
  defaultDueDate,
  defaultProjectId 
}: TaskCreateSheetProps) {
  const { activeWorkspace } = useAuth();
  const { createTask } = useTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"todo" | "in_progress" | "review" | "done">("todo");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [dueDate, setDueDate] = useState<Date | null>(defaultDueDate || null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [relatedType, setRelatedType] = useState<RelatedEntityType | null>(
    defaultProjectId ? "project" : null
  );
  const [relatedId, setRelatedId] = useState<string | null>(defaultProjectId || null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(defaultDueDate || null);
    setStartDate(null);
    setAssignedTo([]);
    setTags([]);
    setEstimatedHours("");
    setRelatedType(defaultProjectId ? "project" : null);
    setRelatedId(defaultProjectId || null);
  };

  const handleCreate = () => {
    if (!title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    // Map related type to specific field
    const entityFields: Record<string, string | null> = {
      project_id: null,
      lead_id: null,
      crm_company_id: null,
      contact_id: null,
    };

    if (relatedType && relatedId) {
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
      }
    }

    createTask.mutate({
      title: title.trim(),
      description: description.trim() || null,
      status,
      priority,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      assigned_to: assignedTo.length > 0 ? assignedTo : null,
      tags: tags.length > 0 ? tags : null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      related_type: relatedType,
      related_id: relatedId,
      ...entityFields,
    }, {
      onSuccess: () => {
        toast.success("Tâche créée");
        resetForm();
        onOpenChange(false);
      },
    });
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleClose();
      else onOpenChange(isOpen);
    }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nouvelle tâche
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Titre *</Label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Titre de la tâche"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              rows={3}
              placeholder="Description détaillée..."
            />
          </div>

          {/* Entity Linking */}
          <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
            <Label className="text-sm">Lier à une entité</Label>
            <EntitySelector
              entityType={relatedType}
              entityId={relatedId}
              onEntityTypeChange={setRelatedType}
              onEntityIdChange={setRelatedId}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priorité</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <InlineDatePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Début"
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Échéance</Label>
              <InlineDatePicker
                value={dueDate}
                onChange={setDueDate}
                placeholder="Échéance"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Assignés</Label>
            <MultiAssigneePicker
              value={assignedTo}
              onChange={setAssignedTo}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label>Estimation (heures)</Label>
            <Input
              type="number"
              step="0.5"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="4"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput value={tags} onChange={setTags} />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleCreate} className="flex-1" disabled={!title.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Créer la tâche
            </Button>
            <Button variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
