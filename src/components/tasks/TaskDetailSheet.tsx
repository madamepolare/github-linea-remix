import { useState, useEffect } from "react";
import { Task, useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { SubtasksManager } from "./SubtasksManager";
import { TaskTimeTracker } from "./TaskTimeTracker";
import { TaskCommunications, useTaskCommunicationsCount } from "./TaskCommunications";
import { MultiAssigneePicker } from "./MultiAssigneePicker";
import { InlineDatePicker } from "./InlineDatePicker";
import { TagInput } from "./TagInput";
import { DurationInput } from "./DurationInput";
import { EntitySelector, LinkedEntityBadge } from "./EntitySelector";
import { RelatedEntityType } from "@/lib/taskTypes";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Clock, MessageSquare, Trash2, Archive, Link2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
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

export function TaskDetailSheet({ task, open, onOpenChange, defaultTab = "details" }: TaskDetailSheetProps) {
  const { activeWorkspace } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const communicationsCount = useTaskCommunicationsCount(task?.id || null);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [relatedType, setRelatedType] = useState<RelatedEntityType | null>(null);
  const [relatedId, setRelatedId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setStartDate(task.start_date ? new Date(task.start_date) : null);
      setAssignedTo(task.assigned_to || []);
      setTags(task.tags || []);
      setEstimatedHours(task.estimated_hours?.toString() || "");
      
      // Initialize related entity from task data
      // Priority: related_type/related_id, then fallback to specific IDs
      if (task.related_type && task.related_id) {
        setRelatedType(task.related_type as RelatedEntityType);
        setRelatedId(task.related_id);
      } else if (task.project_id) {
        setRelatedType("project");
        setRelatedId(task.project_id);
      } else if (task.lead_id) {
        setRelatedType("lead");
        setRelatedId(task.lead_id);
      } else if (task.crm_company_id) {
        setRelatedType("company");
        setRelatedId(task.crm_company_id);
      } else if (task.contact_id) {
        setRelatedType("contact");
        setRelatedId(task.contact_id);
      } else {
        setRelatedType(null);
        setRelatedId(null);
      }
    }
  }, [task]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && task) {
      // Auto-save on close
      const entityFields: Partial<Task> = {
        related_type: relatedType,
        related_id: relatedId,
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

      updateTask.mutate({
        id: task.id,
        title,
        description,
        status,
        priority,
        due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
        start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
        assigned_to: assignedTo.length > 0 ? assignedTo : null,
        tags: tags.length > 0 ? tags : null,
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
        ...entityFields,
      });
    }
    onOpenChange(isOpen);
  };

  const handleArchive = () => {
    if (!task) return;
    updateTask.mutate({ id: task.id, status: "archived" as Task["status"] });
    toast.success("Tâche archivée");
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id);
    setShowDeleteConfirm(false);
    onOpenChange(false);
    toast.success("Tâche supprimée");
  };

  const handleNavigateToEntity = () => {
    if (!relatedType || !relatedId) return;
    
    let path = "";
    switch (relatedType) {
      case "project":
        path = `/projects/${relatedId}`;
        break;
      case "lead":
        path = `/crm/leads/${relatedId}`;
        break;
      case "company":
        path = `/crm/companies/${relatedId}`;
        break;
      case "contact":
        path = `/crm/contacts/${relatedId}`;
        break;
    }
    
    if (path) {
      onOpenChange(false);
      navigate(path);
    }
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Détails de la tâche</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="subtasks">
              <CheckSquare className="h-3 w-3 mr-1" />
              Sous-tâches
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-3 w-3 mr-1" />
              Temps
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-3 w-3 mr-1" />
              {communicationsCount}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>

            {/* Entity Linking */}
            <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
              <div className="flex items-center gap-2 mb-2">
                <Link2 className="h-4 w-4 text-muted-foreground" />
                <Label className="text-sm">Entité liée</Label>
              </div>
              
              {relatedType && relatedId && (
                <div className="flex items-center gap-2 mb-2">
                  <LinkedEntityBadge entityType={relatedType} entityId={relatedId} />
                  <Button variant="ghost" size="sm" onClick={handleNavigateToEntity} className="h-6 text-xs">
                    Voir
                  </Button>
                </div>
              )}
              
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
                <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
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
                <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
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
              <Label>Estimation</Label>
              <DurationInput
                value={estimatedHours}
                onChange={setEstimatedHours}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>

            <div className="flex gap-2 pt-4 border-t justify-end">
              <Button variant="outline" size="icon" onClick={handleArchive} title="Archiver">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={() => setShowDeleteConfirm(true)} title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="space-y-4">
            {activeWorkspace && (
              <SubtasksManager taskId={task.id} workspaceId={activeWorkspace.id} />
            )}
          </TabsContent>

          {/* Time Tab */}
          <TabsContent value="time" className="space-y-4">
            <TaskTimeTracker taskId={task.id} />
          </TabsContent>

          {/* Communications Tab */}
          <TabsContent value="comments" className="h-[calc(100vh-200px)]">
            <TaskCommunications 
              taskId={task.id}
              contextEntityType={
                task.project_id ? "project" : 
                relatedType === "lead" ? "lead" :
                relatedType === "company" ? "company" :
                relatedType === "contact" ? "contact" :
                undefined
              }
              contextEntityId={
                task.project_id ? task.project_id :
                relatedId || undefined
              }
            />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette tâche ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La tâche "{task.title}" sera définitivement supprimée ainsi que toutes ses sous-tâches et entrées de temps associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
}
