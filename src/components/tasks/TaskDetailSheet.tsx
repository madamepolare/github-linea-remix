import { useState, useEffect, useRef } from "react";
import { Task, useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SubtasksManager } from "./SubtasksManager";
import { TaskTimeTracker } from "./TaskTimeTracker";
import { TaskCommunications, useTaskCommunicationsCount } from "./TaskCommunications";
import { MultiAssigneePicker, Profile } from "./MultiAssigneePicker";
import { InlineDatePicker } from "./InlineDatePicker";
import { TagInput } from "./TagInput";
import { DurationInput } from "./DurationInput";
import { EntitySelector, LinkedEntityBadge } from "./EntitySelector";
import { RelatedEntityType } from "@/lib/taskTypes";
import { AIRewriteButton } from "@/components/projects/meeting-report/AIRewriteButton";
import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
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
  CalendarIcon,
  Flag,
  Circle,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Plus,
  Timer,
  Tag,
  ExternalLink,
  ListTodo,
  FileCheck,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

// Component to display linked deliverable badge
function DeliverableBadge({ deliverableId }: { deliverableId: string }) {
  const { data: deliverable } = useQuery({
    queryKey: ["deliverable", deliverableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_deliverables")
        .select("id, name")
        .eq("id", deliverableId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!deliverableId,
  });

  if (!deliverable) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
      <FileCheck className="h-3 w-3" />
      {deliverable.name}
    </span>
  );
}
interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: string;
  // Creation mode props
  isCreateMode?: boolean;
  defaultProjectId?: string | null;
  defaultDeliverableId?: string | null;
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

export function TaskDetailSheet({ 
  task, 
  open, 
  onOpenChange, 
  defaultTab = "details",
  isCreateMode = false,
  defaultProjectId = null,
  defaultDeliverableId = null,
}: TaskDetailSheetProps) {
  const { activeWorkspace, user } = useAuth();
  const { updateTask, deleteTask, createTask } = useTasks();
  const communicationsCount = useTaskCommunicationsCount(task?.id || null);
  const navigate = useNavigate();
  const titleRef = useRef<HTMLTextAreaElement>(null);

  // Fetch pending subtasks count
  const { data: pendingSubtasksCount } = useQuery({
    queryKey: ["subtasks-count", task?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("tasks")
        .select("*", { count: "exact", head: true })
        .eq("parent_id", task!.id)
        .neq("status", "done");
      if (error) throw error;
      return count || 0;
    },
    enabled: !!task?.id && !isCreateMode,
  });

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
  const [deliverableId, setDeliverableId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Reset form for create mode
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate(null);
    setStartDate(null);
    setAssignedTo([]);
    setTags([]);
    setEstimatedHours("");
    setRelatedType(defaultProjectId ? "project" : null);
    setRelatedId(defaultProjectId);
    setDeliverableId(defaultDeliverableId);
    setIsEditingTitle(true); // Auto-focus title in create mode
  };

  useEffect(() => {
    if (isCreateMode && open) {
      resetForm();
    } else if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setStartDate(task.start_date ? new Date(task.start_date) : null);
      setAssignedTo(task.assigned_to || []);
      setTags(task.tags || []);
      setEstimatedHours(task.estimated_hours?.toString() || "");
      setDeliverableId(task.deliverable_id || null);
      
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
  }, [task, isCreateMode, open, defaultProjectId, defaultDeliverableId]);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isEditingTitle]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      const entityFields: Partial<Task> = {
        related_type: relatedType,
        related_id: relatedId,
        project_id: null,
        lead_id: null,
        crm_company_id: null,
        contact_id: null,
        tender_id: null,
        deliverable_id: deliverableId,
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

      if (isCreateMode) {
        // Create mode - create new task
        if (title.trim()) {
          createTask.mutate({
            title: title.trim(),
            description: description || null,
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
      } else if (task) {
        // Edit mode - update existing task
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

  // Allow rendering in create mode even without task
  if (!task && !isCreateMode) return null;

  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.todo;
  const priorityConfig = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  const StatusIcon = statusConfig.icon;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto p-0 flex flex-col h-full">
        {/* Header with avatars - Monday.com style */}
        <div className="sticky top-0 bg-background z-10 border-b">
          <div className="p-4 pb-3">
            {/* Avatars row - clickable to assign */}
            <div className="flex items-center justify-between mb-3">
              <MultiAssigneePicker
                value={assignedTo}
                onChange={setAssignedTo}
                renderTrigger={(selectedMembers) => (
                  <div className="flex items-center gap-1 cursor-pointer group">
                    <TooltipProvider>
                      {selectedMembers.slice(0, 5).map((member) => (
                        <Tooltip key={member.user_id}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-8 w-8 border-2 border-background -ml-1 first:ml-0 ring-2 ring-primary/20 group-hover:ring-primary/50 transition-all">
                              <AvatarImage src={member.avatar_url || undefined} />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {member.full_name?.slice(0, 2).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>{member.full_name || "Membre"}</TooltipContent>
                        </Tooltip>
                      ))}
                      {selectedMembers.length > 5 && (
                        <Avatar className="h-8 w-8 border-2 border-background -ml-1">
                          <AvatarFallback className="text-xs bg-muted">
                            +{selectedMembers.length - 5}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      {selectedMembers.length === 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          <Avatar className="h-8 w-8 border-2 border-dashed border-muted-foreground/30 group-hover:border-primary/50">
                            <AvatarFallback className="bg-transparent">
                              <Plus className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary" />
                            </AvatarFallback>
                          </Avatar>
                          <span>Assigner</span>
                        </div>
                      )}
                    </TooltipProvider>
                  </div>
                )}
              />
              
              {/* Actions - only show in edit mode */}
              {!isCreateMode && task && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={handleArchive} className="h-8 w-8">
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowDeleteConfirm(true)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
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

            {/* Relations row - Project & Deliverable */}
            {(relatedType || deliverableId) && (
              <div className="flex items-center gap-2 mt-3 text-sm">
                {/* Entity relation - clickable to change */}
                {relatedType && relatedId && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/5 text-primary hover:bg-primary/10 transition-all border border-primary/10"
                      >
                        <Link2 className="h-3 w-3" />
                        <LinkedEntityBadge entityType={relatedType} entityId={relatedId} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-3" align="start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Entité liée</label>
                          {relatedType && relatedId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-xs text-muted-foreground"
                              onClick={handleNavigateToEntity}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ouvrir
                            </Button>
                          )}
                        </div>
                        <EntitySelector
                          entityType={relatedType}
                          entityId={relatedId}
                          onEntityTypeChange={setRelatedType}
                          onEntityIdChange={setRelatedId}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Linked Deliverable Badge */}
                {deliverableId && <DeliverableBadge deliverableId={deliverableId} />}
              </div>
            )}

            {/* Status & Priority pills + Actions */}
            <div className="flex items-center gap-2 mt-2">
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

              {/* Link button - only show if no relation yet */}
              {!relatedType && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Lier
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Entité liée</label>
                      <EntitySelector
                        entityType={relatedType}
                        entityId={relatedId}
                        onEntityTypeChange={setRelatedType}
                        onEntityIdChange={setRelatedId}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
              )}

              {/* Date picker - deadline only */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105",
                      dueDate ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <CalendarIcon className="h-3.5 w-3.5" />
                    {dueDate ? format(dueDate, "dd MMM", { locale: fr }) : "Échéance"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={(date) => setDueDate(date || null)}
                    initialFocus
                    locale={fr}
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => setDueDate(null)}
                      >
                        Effacer l'échéance
                      </Button>
                    </div>
                  )}
              </PopoverContent>
              </Popover>

              {/* Estimation */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:scale-105",
                      estimatedHours ? "bg-violet-500/10 text-violet-600" : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    {estimatedHours ? `${estimatedHours}h` : "Estimation"}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-3" align="start">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Temps estimé</label>
                    <DurationInput
                      value={estimatedHours}
                      onChange={setEstimatedHours}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Tabs - show simplified in create mode */}
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="w-full justify-start rounded-none border-b-0 bg-transparent h-auto p-0 px-4">
              <TabsTrigger 
                value="details" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
              >
                <CheckSquare className="h-4 w-4 mr-1.5" />
                Détails
              </TabsTrigger>
              {!isCreateMode && task && (
                <>
                  <TabsTrigger 
                    value="subtasks" 
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none pb-3 px-4"
                  >
                    <ListTodo className="h-4 w-4 mr-1.5" />
                    Sous-tâches
                    {pendingSubtasksCount && pendingSubtasksCount > 0 ? (
                      <span className="ml-1.5 h-5 min-w-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                        {pendingSubtasksCount}
                      </span>
                    ) : null}
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
                </>
              )}
            </TabsList>

            {/* Tab Content */}
            <div className="p-4">
              {/* Details Tab */}
              <TabsContent value="details" className="mt-0 space-y-6">
                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                    <AIRewriteButton
                      text={description}
                      onRewrite={setDescription}
                      context="description de tâche ou grief à clarifier pour un projet d'architecture"
                    />
                  </div>
                  <Textarea 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    rows={3}
                    placeholder="Ajouter une description..."
                    className="resize-none"
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

              {/* Subtasks Tab - only in edit mode */}
              {!isCreateMode && task && (
                <TabsContent value="subtasks" className="mt-0">
                  {activeWorkspace && (
                    <SubtasksManager taskId={task.id} workspaceId={activeWorkspace.id} taskDescription={description} />
                  )}
                </TabsContent>
              )}

              {/* Time Tab - only in edit mode */}
              {!isCreateMode && task && (
                <TabsContent value="time" className="mt-0">
                  <TaskTimeTracker taskId={task.id} />
                </TabsContent>
              )}

              {/* Communications Tab - only in edit mode */}
              {!isCreateMode && task && (
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
              )}
            </div>
          </Tabs>
        </div>
      </SheetContent>

      {/* Delete Confirmation Dialog - only in edit mode */}
      {!isCreateMode && task && (
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
      )}
    </Sheet>
  );
}
