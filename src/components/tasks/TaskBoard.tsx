import { useState, useMemo } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useScheduledTaskIds } from "@/hooks/useScheduledTaskIds";
import { useTaskCommunicationsCounts } from "@/hooks/useTaskCommunicationsCounts";
import { useTaskFilters, TaskFiltersState, defaultTaskFilters } from "@/hooks/useTaskFilters";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { EmptyState } from "@/components/ui/empty-state";
import { KanbanBoard, KanbanColumn, KanbanCard } from "@/components/shared/KanbanBoard";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CheckSquare, Calendar, FolderKanban, Building2, FileText, Target, CheckCircle2, CalendarClock, MessageCircle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/taskTypes";
import { WorkspaceProfile } from "@/hooks/useWorkspaceProfiles";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { TaskKanbanFilters } from "./TaskKanbanFilters";

const COLUMNS: { id: Task["status"]; label: string; color: string }[] = TASK_STATUSES
  .filter(s => s.id !== 'archived')
  .map(s => ({ id: s.id as Task["status"], label: s.label, color: s.color }));

interface TaskBoardProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
  projectId?: string | null;
  onCreateTask?: () => void;
  // Allow external filter control for unified filtering
  externalFilters?: TaskFiltersState;
  onExternalFiltersChange?: (filters: TaskFiltersState) => void;
}

export function TaskBoard({ 
  statusFilter, 
  priorityFilter, 
  projectId, 
  onCreateTask,
  externalFilters,
  onExternalFiltersChange,
}: TaskBoardProps) {
  const { tasks, isLoading, updateTaskStatus } = useTasks(projectId ? { projectId } : undefined);
  const { companies } = useCRMCompanies();
  const { projects } = useProjects();
  const { data: profiles } = useWorkspaceProfiles();
  const { data: scheduledTaskIds } = useScheduledTaskIds();
  
  // Use hook for filtering
  const {
    filters: internalFilters,
    setFilters: setInternalFilters,
    filteredTasks: hookFilteredTasks,
    availableTags,
  } = useTaskFilters(tasks, { scheduledTaskIds });
  
  // Use external filters if provided, otherwise use internal
  const filters = externalFilters ?? internalFilters;
  const setFilters = onExternalFiltersChange ?? setInternalFilters;
  
  // Get all task IDs for fetching communication counts
  const taskIds = useMemo(() => tasks?.map(t => t.id) || [], [tasks]);
  const { data: communicationsCounts } = useTaskCommunicationsCounts(taskIds);
  
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskTab, setSelectedTaskTab] = useState<string>("details");
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  const handleDrop = (taskId: string, _fromColumn: string, toColumn: string) => {
    // Check if moving to "done" column
    if (toColumn === "done") {
      setRecentlyCompleted(prev => new Set([...prev, taskId]));
      
      // Confetti celebration
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { x: 0.5, y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#4ade80'],
        startVelocity: 20,
        gravity: 0.8,
        scalar: 0.7,
        ticks: 60,
      });
      
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.delete(taskId);
          return next;
        });
      }, 800);
    }
    
    updateTaskStatus.mutate({ id: taskId, status: toColumn as Task["status"] });
  };

  // Use the hook's filtered tasks, but also apply legacy priorityFilter from props
  const filteredTasks = useMemo(() => {
    let result = hookFilteredTasks;
    if (priorityFilter) {
      result = result.filter((task) => task.priority === priorityFilter);
    }
    return result;
  }, [hookFilteredTasks, priorityFilter]);

  const columnsToShow = statusFilter
    ? COLUMNS.filter((col) => col.id === statusFilter)
    : COLUMNS;

  const kanbanColumns: KanbanColumn<Task>[] = columnsToShow.map((col) => ({
    id: col.id,
    label: col.label,
    color: col.color,
    items: filteredTasks.filter((task) => task.status === col.id),
  }));

  // Get company name by ID
  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    return companies?.find(c => c.id === companyId)?.name || null;
  };

  // Get project name by ID
  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    return projects?.find(p => p.id === projectId)?.name || null;
  };

  // Check if all tasks are empty
  const totalTasks = tasks?.length || 0;
  if (!isLoading && totalTasks === 0 && !statusFilter && !priorityFilter) {
    return (
      <EmptyState
        icon={CheckSquare}
        title="Aucune tâche"
        description="Créez votre première tâche pour commencer à organiser votre travail."
        action={onCreateTask ? { label: "Créer une tâche", onClick: onCreateTask } : undefined}
      />
    );
  }

  return (
    <>
      {/* Filters bar */}
      <TaskKanbanFilters
        filters={filters}
        onChange={setFilters}
        availableTags={availableTags}
      />

      <KanbanBoard<Task>
        columns={kanbanColumns}
        isLoading={isLoading}
        onDrop={handleDrop}
        getItemId={(task) => task.id}
        renderCard={(task, isDragging) => {
          const commData = communicationsCounts?.[task.id];
          return (
            <TaskKanbanCard
              task={task}
              companyName={getCompanyName(task.crm_company_id)}
              projectName={getProjectName(task.project_id)}
              profiles={profiles || []}
              onClick={() => {
                setSelectedTaskTab("details");
                setSelectedTask(task);
              }}
              onCommentsClick={() => {
                setSelectedTaskTab("comments");
                setSelectedTask(task);
              }}
              isDragging={isDragging}
              isJustCompleted={recentlyCompleted.has(task.id)}
              isScheduled={scheduledTaskIds?.has(task.id) || false}
              commentCount={commData?.count || 0}
              hasRecentComment={commData?.hasRecent || false}
            />
          );
        }}
        renderQuickAdd={(columnId) => (
          <QuickTaskRow defaultStatus={columnId as Task["status"]} />
        )}
        className=""
      />

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        defaultTab={selectedTaskTab}
      />
    </>
  );
}

interface TaskKanbanCardProps {
  task: Task;
  companyName: string | null;
  projectName: string | null;
  profiles: WorkspaceProfile[];
  onClick: () => void;
  onCommentsClick: () => void;
  isDragging: boolean;
  isJustCompleted?: boolean;
  isScheduled?: boolean;
  commentCount?: number;
  hasRecentComment?: boolean;
}

function TaskKanbanCard({ task, companyName, projectName, profiles, onClick, onCommentsClick, isDragging, isJustCompleted, isScheduled, commentCount = 0, hasRecentComment = false }: TaskKanbanCardProps) {
  const completedSubtasks = task.subtasks?.filter((s) => s.status === "done").length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const progress = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Aujourd'hui";
    return format(date, "d MMM", { locale: fr });
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && task.status !== "done";

  // Get profile by user ID
  const getProfile = (userId: string) => profiles.find((p) => p.user_id === userId);

  // Get relation info
  const getRelationInfo = () => {
    if (task.related_type === "project" && projectName) {
      return { icon: FolderKanban, label: projectName, color: "bg-blue-500/10 text-blue-600 border-blue-200" };
    }
    if (task.related_type === "company" && companyName) {
      return { icon: Building2, label: companyName, color: "bg-emerald-500/10 text-emerald-600 border-emerald-200" };
    }
    if (task.related_type === "tender") {
      return { icon: FileText, label: "Appel d'offre", color: "bg-amber-500/10 text-amber-600 border-amber-200" };
    }
    if (task.related_type === "lead") {
      return { icon: Target, label: "Opportunité", color: "bg-purple-500/10 text-purple-600 border-purple-200" };
    }
    return null;
  };

  const relationInfo = getRelationInfo();

  // Get progress bar color based on status
  const getProgressColor = () => {
    const statusConfig = TASK_STATUSES.find(s => s.id === task.status);
    return statusConfig?.dotClass || 'bg-primary/60';
  };

  return (
    <motion.div
      animate={isJustCompleted ? {
        scale: [1, 1.05, 1],
        backgroundColor: ['white', 'hsl(142 76% 36% / 0.15)', 'white']
      } : {}}
      transition={{ duration: 0.5 }}
    >
      <KanbanCard onClick={onClick} isCompleted={task.status === "done"}>
        <div className="space-y-2">
          {/* Relation badge + Scheduled badge */}
          <div className="flex items-center gap-1 flex-wrap">
            {relationInfo && (
              <Badge variant="outline" className={cn("text-2xs px-1.5 py-0.5 gap-1 font-normal", relationInfo.color)}>
                <relationInfo.icon className="h-2.5 w-2.5" />
                <span className="truncate max-w-[120px]">{relationInfo.label}</span>
              </Badge>
            )}
            {isScheduled && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge variant="secondary" className="text-2xs px-1.5 py-0.5 gap-1 font-normal bg-primary/10 text-primary border-primary/20">
                      <CalendarClock className="h-2.5 w-2.5" />
                      <span>Planifiée</span>
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cette tâche est planifiée dans le workflow</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Title with completion indicator */}
          <div className="flex items-start gap-2">
            {task.status === "done" && (
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
            )}
            <p className={cn(
              "text-sm font-medium leading-snug line-clamp-2",
              task.status === "done" && "line-through text-muted-foreground"
            )}>
              {task.title}
            </p>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-2xs px-1.5 py-0">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <span className="text-2xs text-muted-foreground">+{task.tags.length - 2}</span>
              )}
            </div>
          )}

          {/* Subtasks progress */}
          {totalSubtasks > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="h-3 w-3" />
                <span>{completedSubtasks}/{totalSubtasks}</span>
              </div>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className={cn("h-full rounded-full", getProgressColor())}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Footer: Assignees, Comments, Due Date */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              {/* Assignees with profile pictures */}
              {task.assigned_to && task.assigned_to.length > 0 && (
                <div className="flex -space-x-2">
                  {task.assigned_to.slice(0, 3).map((userId) => {
                    const profile = getProfile(userId);
                    const initials = profile?.full_name
                      ? profile.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
                      : userId.slice(0, 2).toUpperCase();
                    return (
                      <Avatar key={userId} className="h-5 w-5 ring-2 ring-background">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name || ""} className="object-cover" />}
                        <AvatarFallback className="text-2xs bg-primary/10">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    );
                  })}
                  {task.assigned_to.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-muted ring-2 ring-background flex items-center justify-center">
                      <span className="text-2xs text-muted-foreground font-medium">+{task.assigned_to.length - 3}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Comments bubble */}
              <motion.div 
                className={cn(
                  "relative flex items-center justify-center cursor-pointer transition-colors",
                  commentCount > 0 ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
                )}
                animate={hasRecentComment ? { scale: [1, 1.15, 1] } : {}}
                transition={{ repeat: hasRecentComment ? Infinity : 0, duration: 1.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCommentsClick();
                }}
              >
                <MessageCircle className={cn(
                  "h-3.5 w-3.5",
                  hasRecentComment && "text-primary",
                  commentCount > 0 && !hasRecentComment && "text-muted-foreground"
                )} />
                {commentCount > 0 && (
                  <span className={cn(
                    "absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 flex items-center justify-center rounded-full text-[9px] font-bold px-0.5",
                    hasRecentComment 
                      ? "bg-primary text-primary-foreground animate-pulse" 
                      : "bg-muted-foreground/80 text-background"
                  )}>
                    {commentCount}
                  </span>
                )}
              </motion.div>
            </div>

            {/* Due date */}
            {task.due_date && (
              <div className={cn(
                "flex items-center gap-1 text-xs",
                isOverdue ? "text-destructive" : "text-muted-foreground"
              )}>
                <Calendar className="h-3 w-3" />
                <span>{formatDueDate(task.due_date)}</span>
              </div>
            )}
          </div>
        </div>
      </KanbanCard>
    </motion.div>
  );
}
