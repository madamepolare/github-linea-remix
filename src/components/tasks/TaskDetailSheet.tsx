import { useState, useEffect, useRef } from "react";
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
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import {
  Sheet,
  SheetContent,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  CheckSquare, 
  Clock, 
  MessageSquare, 
  Trash2, 
  Archive, 
  Link2,
  Calendar,
  Flag,
  Circle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Timer,
  Tag,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
}

const STATUS_CONFIG = {
  todo: { label: "À faire", icon: Circle, color: "text-muted-foreground", bg: "bg-muted" },
  in_progress: { label: "En cours", icon: Loader2, color: "text-blue-600", bg: "bg-blue-500/10" },
  review: { label: "En revue", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-500/10" },
  done: { label: "Terminé", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

const PRIORITY_CONFIG = {
  low: { label: "Basse", color: "text-muted-foreground", bg: "bg-muted", dot: "bg-slate-400" },
  medium: { label: "Moyenne", color: "text-blue-600", bg: "bg-blue-500/10", dot: "bg-blue-500" },
  high: { label: "Haute", color: "text-amber-600", bg: "bg-amber-500/10", dot: "bg-amber-500" },
  urgent: { label: "Urgente", color: "text-red-600", bg: "bg-red-500/10", dot: "bg-red-500" },
};

export function TaskDetailSheet({ task, open, onOpenChange, defaultTab = "details" }: TaskDetailSheetProps) {
  const { activeWorkspace } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const communicationsCount = useTaskCommunicationsCount(task?.id || null);
  const navigate = useNavigate();
  const { data: profiles = [] } = useWorkspaceProfiles();
  const titleRef = useRef<HTMLTextAreaElement>(null);

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Get assigned members details
  const assignedMembers = profiles.filter(p => assignedTo.includes(p.user_id));

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
      } else if (task.tender_id) {
        setRelatedType("tender");
        setRelatedId(task.tender_id);
      } else {
        setRelatedType(null);
        setRelatedId(null);
      }
    }
  }, [task]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && task) {
      const entityFields: Partial<Task> = {
        related_type: relatedType,
        related_id: relatedId,
        project_id: null,
        lead_id: null,
        crm_company_id: null,
        contact_id: null,
        tender_id: null,
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
          case "tender":
            entityFields.tender_id = relatedId;
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
      case "tender":
        path = `/tenders/${relatedId}`;
        break;
    }
    
    if (path) {
      onOpenChange(false);
      navigate(path);
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setIsEditingTitle(false);
    }
    if (e.key === "Escape") {
      setIsEditingTitle(false);
    }
  };

  const cycleStatus = () => {
    const statuses: Task["status"][] = ["todo", "in_progress", "review", "done"];
    const currentIndex = statuses.indexOf(status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    setStatus(statuses[nextIndex]);
  };

  const cyclePriority = () => {
    const priorities: Task["priority"][] = ["low", "medium", "high", "urgent"];
    const currentIndex = priorities.indexOf(priority);
    const nextIndex = (currentIndex + 1) % priorities.length;
    setPriority(priorities[nextIndex]);
  };

  if (!task) return null;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusConfig.icon;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto p-0">
        {/* Header with avatars - Monday.com style */}
        <div className="sticky top-0 bg-background z-10 border-b">
          <div className="p-4 pb-3">
            {/* Avatars row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  {assignedMembers.slice(0, 5).map((member) => (
                    <Tooltip key={member.user_id}>
                      <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8 border-2 border-background -ml-1 first:ml-0 ring-2 ring-primary/20 hover:ring-primary/50 transition-all cursor-pointer">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {member.full_name?.slice(0, 2).toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                      </TooltipTrigger>
                      <TooltipContent>{member.full_name || "Membre"}</TooltipContent>
                    </Tooltip>
                  ))}
                  {assignedMembers.length > 5 && (
                    <Avatar className="h-8 w-8 border-2 border-background -ml-1">
                      <AvatarFallback className="text-xs bg-muted">
                        +{assignedMembers.length - 5}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {assignedMembers.length === 0 && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-8 w-8 border-2 border-dashed border-muted-foreground/30">
                        <AvatarFallback className="bg-transparent">
                          <Plus className="h-4 w-4 text-muted-foreground/50" />
                        </AvatarFallback>
                      </Avatar>
                      <span>Non assigné</span>
                    </div>
                  )}
                </TooltipProvider>
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleArchive} className="h-8 w-8">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Editable Title */}
            {isEditingTitle ? (
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={handleTitleKeyDown}
                className="w-full text-xl font-semibold bg-transparent border-none outline-none resize-none focus:ring-2 focus:ring-primary/20 rounded px-1 -mx-1"
                rows={1}
              />
            ) : (
              <h2
                onClick={() => setIsEditingTitle(true)}
                className="text-xl font-semibold cursor-text hover:bg-muted/50 rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {title || "Sans titre"}
              </h2>
            )}

            {/* Status & Priority pills */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={cycleStatus}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105",
                  statusConfig.bg,
                  statusConfig.color
                )}
              >
                <StatusIcon className={cn("h-3.5 w-3.5", status === "in_progress" && "animate-spin")} />
                {statusConfig.label}
              </button>

              <button
                onClick={cyclePriority}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105",
                  priorityConfig.bg,
                  priorityConfig.color
                )}
              >
                <span className={cn("h-2 w-2 rounded-full", priorityConfig.dot)} />
                {priorityConfig.label}
              </button>

              {relatedType && relatedId && (
                <button
                  onClick={handleNavigateToEntity}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  <LinkedEntityBadge entityType={relatedType} entityId={relatedId} />
                  <ExternalLink className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent h-auto p-0 px-4">
              <TabsTrigger 
                value="details" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
              >
                Détails
              </TabsTrigger>
              <TabsTrigger 
                value="subtasks"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
              >
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Sous-tâches
              </TabsTrigger>
              <TabsTrigger 
                value="time"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
              >
                <Timer className="h-4 w-4 mr-1.5" />
                Temps
              </TabsTrigger>
              <TabsTrigger 
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
              >
                <MessageSquare className="h-4 w-4 mr-1.5" />
                <span>{communicationsCount || ""}</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content */}
            <div className="p-4">
              {/* Details Tab */}
              <TabsContent value="details" className="mt-0 space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3}
                    placeholder="Ajouter une description..."
                    className="resize-none"
                  />
                </div>

                {/* Quick Fields Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Dates */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Début
                    </label>
                    <InlineDatePicker
                      value={startDate}
                      onChange={setStartDate}
                      placeholder="Date de début"
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      <Flag className="h-3.5 w-3.5" />
                      Échéance
                    </label>
                    <InlineDatePicker
                      value={dueDate}
                      onChange={setDueDate}
                      placeholder="Date limite"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Assignees */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Assignés</label>
                  <MultiAssigneePicker
                    value={assignedTo}
                    onChange={setAssignedTo}
                    className="w-full"
                  />
                </div>

                {/* Entity Linking */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5" />
                    Entité liée
                  </label>
                  <EntitySelector
                    entityType={relatedType}
                    entityId={relatedId}
                    onEntityTypeChange={setRelatedType}
                    onEntityIdChange={setRelatedId}
                  />
                </div>

                {/* Estimation */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Estimation
                  </label>
                  <DurationInput
                    value={estimatedHours}
                    onChange={setEstimatedHours}
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Tags
                  </label>
                  <TagInput value={tags} onChange={setTags} />
                </div>
              </TabsContent>

              {/* Subtasks Tab */}
              <TabsContent value="subtasks" className="mt-0">
                {activeWorkspace && (
                  <SubtasksManager taskId={task.id} workspaceId={activeWorkspace.id} />
                )}
              </TabsContent>

              {/* Time Tab */}
              <TabsContent value="time" className="mt-0">
                <TaskTimeTracker taskId={task.id} />
              </TabsContent>

              {/* Communications Tab */}
              <TabsContent value="comments" className="mt-0 h-[calc(100vh-280px)]">
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
            </div>
          </Tabs>
        </div>
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
