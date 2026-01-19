import { useState, useMemo } from "react";
import { useTasks, Task, SubtaskPreview } from "@/hooks/useTasks";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useTaskCommunicationsCounts } from "@/hooks/useTaskCommunicationsCounts";
import { useScheduledTaskIds } from "@/hooks/useScheduledTaskIds";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTaskFilters, TaskFiltersState } from "@/hooks/useTaskFilters";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { TextEditCell, StatusEditCell, PriorityEditCell, DateEditCell, AssigneeEditCell } from "./InlineTaskEditCell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
  ChevronDown,
  CalendarClock,
  Calendar,
  Tag,
  Layers
} from "lucide-react";
import { isPast, isToday, format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TASK_STATUSES } from "@/lib/taskTypes";
import confetti from "canvas-confetti";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TaskListViewProps {
  entityFilter?: string;
  projectId?: string | null;
  // Allow external filter control for unified filtering
  externalFilters?: TaskFiltersState;
  onExternalFiltersChange?: (filters: TaskFiltersState) => void;
}

type SortColumn = "title" | "status" | "due_date" | "priority" | "relation";
type SortDirection = "asc" | "desc";
type GroupBy = "status" | "project" | "client" | "tag";

const STATUS_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  todo: { bg: "bg-muted/50 dark:bg-muted/30", border: "border-l-muted-foreground", text: "text-muted-foreground" },
  in_progress: { bg: "bg-info/10 dark:bg-info/20", border: "border-l-info", text: "text-info" },
  review: { bg: "bg-warning/10 dark:bg-warning/20", border: "border-l-warning", text: "text-warning" },
  done: { bg: "bg-success/10 dark:bg-success/20", border: "border-l-success", text: "text-success" },
};

export function TaskListView({ 
  entityFilter = "all", 
  projectId,
  externalFilters,
  onExternalFiltersChange,
}: TaskListViewProps) {
  const isMobile = useIsMobile();
  const { tasks, isLoading, updateTaskStatus, updateTask } = useTasks(projectId ? { projectId } : undefined);
  const { companies } = useCRMCompanies();
  const { projects } = useProjects();
  const { data: profiles } = useWorkspaceProfiles();
  const { data: scheduledTaskIds } = useScheduledTaskIds();
  
  // Use hook for filtering - pass external filters when available
  const {
    filteredTasks: hookFilteredTasks,
  } = useTaskFilters(tasks, { 
    scheduledTaskIds,
    externalFilters: externalFilters,
  });
  
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
  const [groupBy, setGroupBy] = useState<GroupBy>("status");

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
    // Use filtered tasks from hook (respects external filters)
    let filtered = hookFilteredTasks || [];
    
    if (entityFilter && entityFilter !== "all") {
      filtered = filtered.filter((task) => task.related_type === entityFilter);
    }

    const groups: Record<string, Task[]> = {};

    // Group based on selected groupBy
    filtered.forEach(task => {
      let groupKey: string;
      
      switch (groupBy) {
        case "project":
          groupKey = task.project_id || "_no_project";
          break;
        case "client":
          groupKey = task.crm_company_id || "_no_client";
          break;
        case "tag":
          if (task.tags && task.tags.length > 0) {
            // Add task to each tag group
            task.tags.forEach(tag => {
              if (!groups[tag]) groups[tag] = [];
              groups[tag].push(task);
            });
            return; // Skip the normal grouping
          }
          groupKey = "_no_tag";
          break;
        case "status":
        default:
          groupKey = task.status;
          break;
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(task);
    });

    // Sort within each group
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
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
  }, [hookFilteredTasks, entityFilter, sortColumn, sortDirection, groupBy]);

  // Get sorted group keys based on groupBy type
  const getGroupOrder = useMemo(() => {
    const keys = Object.keys(groupedTasks);
    
    if (groupBy === "status") {
      const statusOrder = ["in_progress", "todo", "review", "done"];
      return statusOrder.filter(s => keys.includes(s));
    }
    
    // Sort alphabetically, but put "no X" groups at the end
    return keys.sort((a, b) => {
      if (a.startsWith("_")) return 1;
      if (b.startsWith("_")) return -1;
      
      if (groupBy === "project") {
        const nameA = getProjectName(a) || "";
        const nameB = getProjectName(b) || "";
        return nameA.localeCompare(nameB);
      }
      if (groupBy === "client") {
        const nameA = getCompanyName(a) || "";
        const nameB = getCompanyName(b) || "";
        return nameA.localeCompare(nameB);
      }
      return a.localeCompare(b);
    });
  }, [groupedTasks, groupBy, projects, companies]);

  const getGroupLabel = (key: string): { label: string; color?: string; icon?: any } => {
    switch (groupBy) {
      case "status":
        const statusConfig = TASK_STATUSES.find(s => s.id === key);
        return { 
          label: statusConfig?.label || key, 
          color: statusConfig?.color 
        };
      case "project":
        if (key === "_no_project") return { label: "Sans projet", icon: FolderKanban };
        return { 
          label: getProjectName(key) || key, 
          icon: FolderKanban,
          color: projects?.find(p => p.id === key)?.color 
        };
      case "client":
        if (key === "_no_client") return { label: "Sans client", icon: Building2 };
        return { label: getCompanyName(key) || key, icon: Building2 };
      case "tag":
        if (key === "_no_tag") return { label: "Sans tag", icon: Tag };
        return { label: key, icon: Tag };
      default:
        return { label: key };
    }
  };

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

  return (
    <>
      <div className="space-y-4">
        {/* Filters row */}
        <div className="flex items-center gap-3 px-4 py-2 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Layers className="h-4 w-4" />
            <span>Grouper par</span>
          </div>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-[140px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Statut</SelectItem>
              <SelectItem value="project">Projet</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="tag">Tag</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick add row */}
        {showQuickAdd ? (
          <div className="border-b">
            <QuickTaskRow onCreated={() => setShowQuickAdd(false)} className="border-0" />
          </div>
        ) : (
          <button
            onClick={() => setShowQuickAdd(true)}
            className="w-full flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground border-b border-dashed hover:border-primary hover:text-primary hover:bg-primary/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une tâche...</span>
          </button>
        )}

        {/* Grouped task lists */}
        {getGroupOrder.map(groupKey => {
          const groupTasks = groupedTasks[groupKey] || [];
          if (groupTasks.length === 0) return null;
          
          const groupInfo = getGroupLabel(groupKey);
          const isCollapsed = collapsedGroups.has(groupKey);
          const colors = groupBy === "status" 
            ? (STATUS_COLORS[groupKey] || STATUS_COLORS.todo)
            : { bg: "bg-muted/30", border: "border-l-primary/50", text: "text-foreground" };
          const GroupIcon = groupInfo.icon;

          return (
            <div key={groupKey} className="space-y-0">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 border-b transition-colors",
                  "hover:bg-muted/30"
                )}
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform text-muted-foreground",
                  isCollapsed && "-rotate-90"
                )} />
                {groupInfo.color ? (
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: groupInfo.color }}
                  />
                ) : GroupIcon ? (
                  <GroupIcon className="h-4 w-4 text-muted-foreground" />
                ) : null}
                <span className="font-medium text-sm text-foreground">
                  {groupInfo.label}
                </span>
                <Badge variant="secondary" className="h-5 px-1.5 text-2xs">
                  {groupTasks.length}
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
                      "border-l-2",
                      colors.border
                    )}>
                      {/* Table header - desktop only */}
                      {!isMobile && (
                        <div className="grid grid-cols-[40px_1fr_50px_100px_100px_100px_80px_60px] gap-2 px-4 py-2 text-xs text-muted-foreground font-medium border-b">
                          <div></div>
                          <SortableHeader column="title">Tâche</SortableHeader>
                          <div className="flex justify-center">
                            <CalendarClock className="h-3.5 w-3.5" />
                          </div>
                          <SortableHeader column="relation">Relation</SortableHeader>
                          <SortableHeader column="due_date">Échéance</SortableHeader>
                          <SortableHeader column="priority">Priorité</SortableHeader>
                          <div>Assignés</div>
                          <div className="text-center">
                            <MessageCircle className="h-3.5 w-3.5 mx-auto" />
                          </div>
                        </div>
                      )}

                      {/* Task rows */}
                      <AnimatePresence mode="popLayout">
                        {groupTasks.map((task) => {
                          const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                          const isExpanded = expandedTasks.has(task.id);
                          const completedSubtasks = task.subtasks?.filter(s => s.status === "done").length || 0;
                          const relation = getRelationDisplay(task);
                          const isJustCompleted = recentlyCompleted.has(task.id);
                          const commData = communicationsCounts?.[task.id];
                          const commentCount = commData?.count || 0;
                          const hasRecentComment = commData?.hasRecent || false;
                          const isScheduled = scheduledTaskIds?.has(task.id) || false;

                          // Mobile card view
                          if (isMobile) {
                            return (
                              <motion.div
                                key={task.id}
                                layout
                                initial={{ opacity: 0 }}
                                animate={{ 
                                  opacity: 1,
                                  backgroundColor: isJustCompleted ? "hsl(142 76% 36% / 0.1)" : "transparent"
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className={cn(
                                  "flex items-start gap-3 px-3 py-3 border-b last:border-b-0 cursor-pointer active:bg-muted/50 touch-manipulation",
                                  task.status === "done" && "opacity-60"
                                )}
                                onClick={() => {
                                  setSelectedTaskTab("details");
                                  setSelectedTask(task);
                                }}
                              >
                                {/* Checkbox */}
                                <div 
                                  onClick={(e) => handleToggleComplete(e, task)} 
                                  className="flex items-center justify-center pt-0.5 touch-manipulation"
                                >
                                  {task.status === "done" ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Checkbox checked={false} className="h-5 w-5" />
                                  )}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0 space-y-1.5">
                                  <p className={cn(
                                    "font-medium text-sm leading-snug line-clamp-2",
                                    task.status === "done" && "line-through text-muted-foreground"
                                  )}>
                                    {task.title}
                                  </p>
                                  
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {/* Relation */}
                                    {relation && (
                                      <Badge variant="outline" className="text-2xs px-1.5 py-0 gap-1 font-normal">
                                        <relation.icon className="h-2.5 w-2.5" />
                                        <span className="truncate max-w-[80px]">{relation.label}</span>
                                      </Badge>
                                    )}
                                    
                                    {/* Due date */}
                                    {task.due_date && (
                                      <span className={cn(
                                        "text-2xs flex items-center gap-1",
                                        getDueDateStyle(task.due_date, task.status)
                                      )}>
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(task.due_date), "d MMM", { locale: fr })}
                                      </span>
                                    )}
                                    
                                    {/* Comments */}
                                    {commentCount > 0 && (
                                      <span className="text-2xs text-muted-foreground flex items-center gap-0.5">
                                        <MessageCircle className="h-3 w-3" />
                                        {commentCount}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Assignees */}
                                {getAssigneeAvatars(task.assigned_to)}
                              </motion.div>
                            );
                          }

                          // Desktop table row
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
                                  "grid grid-cols-[40px_1fr_50px_100px_100px_100px_80px_60px] gap-2 px-4 py-2.5 items-center cursor-pointer border-b last:border-b-0 transition-all duration-150 hover:bg-muted/30",
                                  task.status === "done" && "opacity-60"
                                )}
                                onClick={() => {
                                  setSelectedTaskTab("details");
                                  setSelectedTask(task);
                                }}
                              >
                                {/* Checkbox */}
                                <div onClick={(e) => handleToggleComplete(e, task)} className="flex items-center justify-center h-full">
                                  <motion.div
                                    animate={isJustCompleted ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center justify-center"
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
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                              <div 
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{ width: `${(completedSubtasks / task.subtasks!.length) * 100}%` }}
                                              />
                                            </div>
                                            <span className="text-2xs text-muted-foreground tabular-nums">
                                              {completedSubtasks}/{task.subtasks!.length}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          {completedSubtasks} sur {task.subtasks!.length} sous-tâches terminées
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>

                                {/* Planning icon */}
                                <div className="flex justify-center">
                                  {isScheduled ? (
                                    <TooltipProvider delayDuration={100}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <CalendarClock className="h-4 w-4 text-primary" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Planifiée dans le workflow</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  ) : (
                                    <span className="text-muted-foreground/30">—</span>
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

                                {/* Comments bubble with notification badge */}
                                <div 
                                  className="flex justify-center"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedTaskTab("comments");
                                    setSelectedTask(task);
                                  }}
                                >
                                  <motion.div 
                                    className={cn(
                                      "relative flex items-center justify-center cursor-pointer transition-colors",
                                      commentCount > 0 ? "text-foreground" : "text-muted-foreground/40 hover:text-muted-foreground"
                                    )}
                                    animate={hasRecentComment ? { scale: [1, 1.15, 1] } : {}}
                                    transition={{ repeat: hasRecentComment ? Infinity : 0, duration: 1.5 }}
                                  >
                                    <MessageCircle className={cn(
                                      "h-4 w-4",
                                      hasRecentComment && "text-primary",
                                      commentCount > 0 && !hasRecentComment && "text-muted-foreground"
                                    )} />
                                    {commentCount > 0 && (
                                      <span className={cn(
                                        "absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full text-[10px] font-bold px-1",
                                        hasRecentComment 
                                          ? "bg-primary text-primary-foreground animate-pulse" 
                                          : "bg-muted-foreground/80 text-background"
                                      )}>
                                        {commentCount}
                                      </span>
                                    )}
                                  </motion.div>
                                </div>
                              </motion.div>
                              
                              {/* Subtasks */}
                              <AnimatePresence>
                                {isExpanded && task.subtasks?.map((subtask) => {
                                  const isSubtaskCompleted = recentlyCompleted.has(subtask.id);
                                  const subtaskDueDate = subtask.due_date ? new Date(subtask.due_date) : null;
                                  const isSubtaskOverdue = subtaskDueDate && isPast(subtaskDueDate) && !isToday(subtaskDueDate) && subtask.status !== "done";
                                  const subtaskAssignee = subtask.assigned_to?.[0] 
                                    ? profiles?.find(p => p.user_id === subtask.assigned_to?.[0] || p.id === subtask.assigned_to?.[0])
                                    : null;
                                  
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
                                      className="grid grid-cols-[40px_1fr_50px_100px_100px_100px_80px_60px] gap-2 px-4 py-2 items-center bg-muted/20 hover:bg-muted/40 transition-colors border-b"
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
                                          "text-sm truncate",
                                          subtask.status === "done" && "line-through text-muted-foreground"
                                        )}>
                                          {subtask.title}
                                        </span>
                                      </div>
                                      <div></div>
                                      <div></div>
                                      {/* Due date */}
                                      <div className={cn(
                                        "text-xs",
                                        isSubtaskOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                                      )}>
                                        {subtaskDueDate && (
                                          <span className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {format(subtaskDueDate, "d MMM", { locale: fr })}
                                          </span>
                                        )}
                                      </div>
                                      <div></div>
                                      {/* Assignee */}
                                      <div>
                                        {subtaskAssignee && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Avatar className="h-5 w-5">
                                                <AvatarImage src={subtaskAssignee.avatar_url} />
                                                <AvatarFallback className="text-2xs bg-primary/10 text-primary">
                                                  {subtaskAssignee.full_name?.slice(0, 2).toUpperCase() || "?"}
                                                </AvatarFallback>
                                              </Avatar>
                                            </TooltipTrigger>
                                            <TooltipContent>{subtaskAssignee.full_name}</TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
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
