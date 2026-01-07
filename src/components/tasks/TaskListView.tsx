import { useState, useMemo } from "react";
import { useTasks, Task, SubtaskPreview } from "@/hooks/useTasks";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useTaskCommunicationsCounts } from "@/hooks/useTaskCommunicationsCounts";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { TextEditCell, StatusEditCell, PriorityEditCell, DateEditCell, AssigneeEditCell } from "./InlineTaskEditCell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Plus, 
  FolderKanban, 
  Building2, 
  Target, 
  ArrowUp, 
  ArrowDown,
  ArrowUpDown,
  CheckCircle2,
  MessageCircle,
  ChevronDown
} from "lucide-react";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/taskTypes";
import confetti from "canvas-confetti";

interface TaskListViewProps {
  entityFilter?: string;
  projectId?: string | null;
}

type SortColumn = "title" | "status" | "due_date" | "priority" | "relation";
type SortDirection = "asc" | "desc";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  todo: { bg: "bg-slate-50 dark:bg-slate-900/30", border: "border-l-slate-400", text: "text-slate-600" },
  in_progress: { bg: "bg-blue-50/50 dark:bg-blue-900/20", border: "border-l-blue-500", text: "text-blue-600" },
  review: { bg: "bg-amber-50/50 dark:bg-amber-900/20", border: "border-l-amber-500", text: "text-amber-600" },
  done: { bg: "bg-green-50/50 dark:bg-green-900/20", border: "border-l-green-500", text: "text-green-600" },
};

export function TaskListView({ entityFilter = "all", projectId }: TaskListViewProps) {
  const { tasks, isLoading, updateTaskStatus, updateTask } = useTasks(projectId ? { projectId } : undefined);
  const { companies } = useCRMCompanies();
  const { projects } = useProjects();
  const { data: profiles } = useWorkspaceProfiles();
  
  // Get all task IDs for fetching communication counts
  const taskIds = useMemo(() => tasks?.map(t => t.id) || [], [tasks]);
  const { data: communicationsCounts } = useTaskCommunicationsCounts(taskIds);

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedTaskTab, setSelectedTaskTab] = useState<string>("details");
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const handleToggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const isCompleting = task.status !== "done";
    const newStatus = isCompleting ? "done" : "todo";
    
    if (isCompleting) {
      setRecentlyCompleted(prev => new Set([...prev, task.id]));
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { 
          x: rect.left / window.innerWidth + 0.01, 
          y: rect.top / window.innerHeight 
        },
        colors: ['#22c55e', '#16a34a', '#4ade80'],
        startVelocity: 15,
        gravity: 0.8,
        scalar: 0.6,
        ticks: 50,
      });
      
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.delete(task.id);
          return next;
        });
      }, 600);
    }
    
    updateTaskStatus.mutate({ id: task.id, status: newStatus });
  };

  const handleToggleSubtask = (e: React.MouseEvent, subtask: SubtaskPreview) => {
    e.stopPropagation();
    const isCompleting = subtask.status !== "done";
    const newStatus = isCompleting ? "done" : "todo";
    
    if (isCompleting) {
      setRecentlyCompleted(prev => new Set([...prev, subtask.id]));
      
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 20,
        spread: 40,
        origin: { 
          x: rect.left / window.innerWidth + 0.01, 
          y: rect.top / window.innerHeight 
        },
        colors: ['#22c55e', '#16a34a', '#4ade80'],
        startVelocity: 12,
        gravity: 0.8,
        scalar: 0.5,
        ticks: 40,
      });
      
      setTimeout(() => {
        setRecentlyCompleted(prev => {
          const next = new Set(prev);
          next.delete(subtask.id);
          return next;
        });
      }, 500);
    }
    
    updateTask.mutate({ id: subtask.id, status: newStatus });
  };

  const toggleExpand = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const toggleGroup = (status: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      return next;
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    return companies?.find(c => c.id === companyId)?.name || null;
  };

  const getProjectName = (projectId: string | null) => {
    if (!projectId) return null;
    return projects?.find(p => p.id === projectId)?.name || null;
  };

  const getRelationDisplay = (task: Task) => {
    if (task.project_id) {
      const name = getProjectName(task.project_id);
      if (name) return { icon: FolderKanban, label: name, color: "text-blue-600" };
    }
    if (task.crm_company_id) {
      const name = getCompanyName(task.crm_company_id);
      if (name) return { icon: Building2, label: name, color: "text-emerald-600" };
    }
    if (task.lead_id) {
      return { icon: Target, label: "Opportunité", color: "text-purple-600" };
    }
    return null;
  };

  const groupedTasks = useMemo(() => {
    let filtered = tasks || [];
    
    if (entityFilter && entityFilter !== "all") {
      filtered = filtered.filter((task) => task.related_type === entityFilter);
    }

    // Group by status
    const groups: Record<string, Task[]> = {
      in_progress: [],
      todo: [],
      review: [],
      done: [],
    };

    filtered.forEach(task => {
      if (groups[task.status]) {
        groups[task.status].push(task);
      }
    });

    // Sort within each group
    Object.keys(groups).forEach(status => {
      groups[status].sort((a, b) => {
        let comparison = 0;
        switch (sortColumn) {
          case "title":
            comparison = a.title.localeCompare(b.title);
            break;
          case "due_date":
            if (!a.due_date && !b.due_date) comparison = 0;
            else if (!a.due_date) comparison = 1;
            else if (!b.due_date) comparison = -1;
            else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            break;
          case "priority":
            const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
            comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
            break;
          default:
            break;
        }
        return sortDirection === "asc" ? comparison : -comparison;
      });
    });

    return groups;
  }, [tasks, entityFilter, sortColumn, sortDirection]);

  const getDueDateStyle = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "done") return "text-muted-foreground";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-destructive font-medium";
    if (isToday(date)) return "text-amber-600 font-medium";
    return "text-muted-foreground";
  };

  const getAssigneeAvatars = (assignedTo: string[] | null) => {
    if (!assignedTo || assignedTo.length === 0 || !profiles) return null;
    
    const assignees = assignedTo
      .map(id => profiles.find(p => p.user_id === id || p.id === id))
      .filter(Boolean)
      .slice(0, 3);
    
    const remaining = (assignedTo.length || 0) - 3;
    
    return (
      <div className="flex items-center -space-x-2">
        {assignees.map((profile: any, idx) => (
          <Tooltip key={profile.id}>
            <TooltipTrigger asChild>
              <Avatar className="h-6 w-6 border-2 border-background ring-0">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xs bg-primary/10 text-primary">
                  {profile.full_name?.slice(0, 2).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent>{profile.full_name}</TooltipContent>
          </Tooltip>
        ))}
        {remaining > 0 && (
          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-2xs font-medium">
            +{remaining}
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  const SortableHeader = ({ column, children, className }: { column: SortColumn; children: React.ReactNode; className?: string }) => (
    <div 
      className={cn("cursor-pointer hover:text-foreground transition-colors select-none flex items-center gap-1", className)}
      onClick={() => handleSort(column)}
    >
      {children}
      {sortColumn === column ? (
        sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </div>
  );

  const statusOrder = ["in_progress", "todo", "review", "done"];

  return (
    <>
      <div className="space-y-4">
        {/* Quick add row */}
        {showQuickAdd ? (
          <div className="border rounded-lg overflow-hidden">
            <QuickTaskRow onCreated={() => setShowQuickAdd(false)} className="rounded-none border-0" />
          </div>
        ) : (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground border border-dashed rounded-lg hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une tâche...</span>
          </button>
        )}

        {/* Grouped task lists */}
        {statusOrder.map(status => {
          const statusTasks = groupedTasks[status] || [];
          if (statusTasks.length === 0) return null;
          
          const statusConfig = TASK_STATUSES.find(s => s.id === status);
          const isCollapsed = collapsedGroups.has(status);
          const colors = STATUS_COLORS[status] || STATUS_COLORS.todo;

          return (
            <div key={status} className="space-y-1">
              {/* Status group header */}
              <button
                onClick={() => toggleGroup(status)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors",
                  colors.bg,
                  "hover:opacity-80"
                )}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  isCollapsed && "-rotate-90",
                  colors.text
                )} />
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: statusConfig?.color }}
                />
                <span className={cn("font-medium text-sm", colors.text)}>
                  {statusConfig?.label}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-2xs">
                  {statusTasks.length}
                </Badge>
              </button>

              {/* Task rows */}
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className={cn(
                      "border rounded-lg overflow-hidden",
                      `border-l-4 ${colors.border}`
                    )}>
                      {/* Table header */}
                      <div className="grid grid-cols-[40px_1fr_120px_100px_100px_80px_60px] gap-2 px-4 py-2 bg-muted/30 text-xs text-muted-foreground font-medium border-b">
                        <div></div>
                        <SortableHeader column="title">Tâche</SortableHeader>
                        <SortableHeader column="relation">Relation</SortableHeader>
                        <SortableHeader column="due_date">Échéance</SortableHeader>
                        <SortableHeader column="priority">Priorité</SortableHeader>
                        <div>Assignés</div>
                        <div className="text-center">
                          <MessageCircle className="h-3.5 w-3.5 mx-auto" />
                        </div>
                      </div>

                      {/* Task rows */}
                      <AnimatePresence mode="popLayout">
                        {statusTasks.map((task) => {
                          const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                          const isExpanded = expandedTasks.has(task.id);
                          const completedSubtasks = task.subtasks?.filter(s => s.status === "done").length || 0;
                          const relation = getRelationDisplay(task);
                          const isJustCompleted = recentlyCompleted.has(task.id);
                          const commentCount = communicationsCounts?.[task.id] || 0;

                          return (
                            <div key={task.id}>
                              <motion.div
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  backgroundColor: isJustCompleted ? "hsl(142 76% 36% / 0.1)" : "transparent"
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  "grid grid-cols-[40px_1fr_120px_100px_100px_80px_60px] gap-2 px-4 py-2.5 items-center cursor-pointer border-b last:border-b-0 transition-all duration-150 hover:bg-accent/50",
                                  task.status === "done" && "opacity-60"
                                )}
                                onClick={() => {
                                  setSelectedTaskTab("details");
                                  setSelectedTask(task);
                                }}
                              >
                                {/* Checkbox */}
                                <div onClick={(e) => handleToggleComplete(e, task)} className="flex items-center justify-center">
                                  <motion.div
                                    animate={isJustCompleted ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {task.status === "done" ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Checkbox checked={false} className="h-5 w-5" />
                                    )}
                                  </motion.div>
                                </div>

                                {/* Title */}
                                <div className="flex items-center gap-2 min-w-0">
                                  {hasSubtasks && (
                                    <button onClick={(e) => toggleExpand(e, task.id)}>
                                      <ChevronRight className={cn(
                                        "h-4 w-4 text-muted-foreground transition-transform",
                                        isExpanded && "rotate-90"
                                      )} />
                                    </button>
                                  )}
                                  <TextEditCell
                                    value={task.title}
                                    onSave={(title) => updateTask.mutate({ id: task.id, title })}
                                    className={cn(
                                      "flex-1",
                                      task.status === "done" && "line-through text-muted-foreground"
                                    )}
                                  />
                                  {hasSubtasks && (
                                    <Badge variant="outline" className="text-2xs px-1.5 py-0 h-5 flex-shrink-0">
                                      {completedSubtasks}/{task.subtasks!.length}
                                    </Badge>
                                  )}
                                </div>

                                {/* Relation */}
                                <div>
                                  {relation && (
                                    <div className={cn("flex items-center gap-1.5 text-xs", relation.color)}>
                                      <relation.icon className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{relation.label}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Due date */}
                                <div>
                                  <DateEditCell
                                    value={task.due_date}
                                    onSave={(due_date) => updateTask.mutate({ id: task.id, due_date })}
                                    className={getDueDateStyle(task.due_date, task.status)}
                                  />
                                </div>

                                {/* Priority */}
                                <div>
                                  <PriorityEditCell
                                    value={task.priority}
                                    onSave={(priority) => updateTask.mutate({ id: task.id, priority: priority as Task["priority"] })}
                                  />
                                </div>

                                {/* Assignees - stacked avatars */}
                                <div onClick={(e) => e.stopPropagation()}>
                                  {getAssigneeAvatars(task.assigned_to) || (
                                    <AssigneeEditCell
                                      value={task.assigned_to || []}
                                      profiles={profiles || []}
                                      onSave={(assigned_to) => updateTask.mutate({ id: task.id, assigned_to })}
                                    />
                                  )}
                                </div>

                                {/* Comments bubble */}
                                <div 
                                  className="flex justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskTab("comments");
                                    setSelectedTask(task);
                                  }}
                                >
                                  <div className={cn(
                                    "flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors cursor-pointer hover:bg-primary/10",
                                    commentCount > 0 ? "bg-muted text-muted-foreground" : "text-muted-foreground/50 hover:text-muted-foreground"
                                  )}>
                                    <MessageCircle className="h-3 w-3" />
                                    {commentCount > 0 && (
                                      <span className="text-2xs font-medium">{commentCount}</span>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                              
                              {/* Subtasks */}
                              <AnimatePresence>
                                {isExpanded && task.subtasks?.map((subtask) => {
                                  const isSubtaskCompleted = recentlyCompleted.has(subtask.id);
                                  
                                  return (
                                    <motion.div
                                      key={subtask.id}
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ 
                                        opacity: 1, 
                                        height: "auto",
                                        backgroundColor: isSubtaskCompleted ? "hsl(142 76% 36% / 0.1)" : "transparent"
                                      }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="grid grid-cols-[40px_1fr_120px_100px_100px_80px_60px] gap-2 px-4 py-2 items-center bg-muted/20 hover:bg-muted/40 transition-colors border-b"
                                    >
                                      <div onClick={(e) => handleToggleSubtask(e, subtask)} className="flex items-center justify-center pl-4">
                                        <motion.div
                                          animate={isSubtaskCompleted ? { scale: [1, 1.3, 1] } : {}}
                                          transition={{ duration: 0.3 }}
                                        >
                                          {subtask.status === "done" ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                          ) : (
                                            <Checkbox checked={false} className="h-4 w-4" />
                                          )}
                                        </motion.div>
                                      </div>
                                      <div className="flex items-center gap-2 pl-6">
                                        <span className="text-muted-foreground text-xs">↳</span>
                                        <span className={cn(
                                          "text-sm",
                                          subtask.status === "done" && "line-through text-muted-foreground"
                                        )}>
                                          {subtask.title}
                                        </span>
                                      </div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                      <div></div>
                                    </motion.div>
                                  );
                                })}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Empty state */}
        {Object.values(groupedTasks).every(g => g.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            Aucune tâche
          </div>
        )}
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        defaultTab={selectedTaskTab}
      />
    </>
  );
}
