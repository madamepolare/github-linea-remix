import { useState } from "react";
import { useTasks, Task, SubtaskPreview } from "@/hooks/useTasks";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useProjects } from "@/hooks/useProjects";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { TextEditCell, StatusEditCell, PriorityEditCell, DateEditCell, AssigneeEditCell } from "./InlineTaskEditCell";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  CheckCircle2
} from "lucide-react";
import { isPast, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/taskTypes";
import confetti from "canvas-confetti";

interface TaskListViewProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
  entityFilter?: string;
}

type SortColumn = "title" | "status" | "due_date" | "priority" | "relation";
type SortDirection = "asc" | "desc";

export function TaskListView({ statusFilter, priorityFilter, entityFilter = "all" }: TaskListViewProps) {
  const { tasks, isLoading, updateTaskStatus, updateTask } = useTasks();
  const { companies } = useCRMCompanies();
  const { projects } = useProjects();
  const { data: profiles } = useWorkspaceProfiles();



  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("due_date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [recentlyCompleted, setRecentlyCompleted] = useState<Set<string>>(new Set());

  const handleToggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const isCompleting = task.status !== "done";
    const newStatus = isCompleting ? "done" : "todo";
    
    if (isCompleting) {
      // Celebration animation
      setRecentlyCompleted(prev => new Set([...prev, task.id]));
      
      // Mini confetti burst
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

  const getFilteredAndSortedTasks = () => {
    let filtered = tasks || [];
    
    if (statusFilter) {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }
    if (priorityFilter) {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }
    if (entityFilter && entityFilter !== "all") {
      filtered = filtered.filter((task) => task.related_type === entityFilter);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case "title":
          comparison = a.title.localeCompare(b.title);
          break;
        case "status":
          const statusOrder = { todo: 0, in_progress: 1, review: 2, done: 3, archived: 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
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
        case "relation":
          const aRel = getRelationDisplay(a)?.label || "";
          const bRel = getRelationDisplay(b)?.label || "";
          comparison = aRel.localeCompare(bRel);
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  };

  const filteredTasks = getFilteredAndSortedTasks();

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
    <TableHead 
      className={cn("cursor-pointer hover:bg-muted/50 transition-colors select-none", className)}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortColumn === column ? (
          sortDirection === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </div>
    </TableHead>
  );

  const getDueDateStyle = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "done") return "text-muted-foreground";
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-destructive font-medium";
    if (isToday(date)) return "text-amber-600 font-medium";
    return "text-muted-foreground";
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-6"></TableHead>
              <SortableHeader column="relation" className="w-36">Relation</SortableHeader>
              <SortableHeader column="title">Tâche</SortableHeader>
              <SortableHeader column="status" className="w-24">Statut</SortableHeader>
              <SortableHeader column="due_date" className="w-24">Échéance</SortableHeader>
              <SortableHeader column="priority" className="w-20">Priorité</SortableHeader>
              <TableHead className="w-20">Assigné</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Quick add row */}
            {showQuickAdd ? (
              <TableRow>
                <TableCell colSpan={8} className="p-0">
                  <QuickTaskRow onCreated={() => setShowQuickAdd(false)} className="rounded-none border-0" />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow 
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => setShowQuickAdd(true)}
              >
                <TableCell colSpan={8} className="py-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une tâche...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            <AnimatePresence mode="popLayout">
              {filteredTasks?.map((task) => {
                const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                const isExpanded = expandedTasks.has(task.id);
                const completedSubtasks = task.subtasks?.filter(s => s.status === "done").length || 0;
                const relation = getRelationDisplay(task);
                const isJustCompleted = recentlyCompleted.has(task.id);

                return (
                  <>
                  <motion.tr
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
                      "cursor-pointer border-b transition-all duration-150 hover:bg-accent/50 hover:shadow-sm",
                      task.status === "done" && "opacity-60"
                    )}
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell className="py-2" onClick={(e) => handleToggleComplete(e, task)}>
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
                    </TableCell>
                    <TableCell className="py-2" onClick={(e) => hasSubtasks && toggleExpand(e, task.id)}>
                      {hasSubtasks && (
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {relation && (
                        <div className={cn("flex items-center gap-1.5 text-xs", relation.color)}>
                          <relation.icon className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate max-w-[100px]">{relation.label}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <TextEditCell
                          value={task.title}
                          onSave={(title) => updateTask.mutate({ id: task.id, title })}
                          className={task.status === "done" ? "line-through text-muted-foreground" : ""}
                        />
                        {hasSubtasks && (
                          <Badge variant="outline" className="text-2xs px-1.5 py-0 h-5 flex-shrink-0">
                            {completedSubtasks}/{task.subtasks!.length}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusEditCell
                        value={task.status}
                        onSave={(status) => updateTaskStatus.mutate({ id: task.id, status: status as Task["status"] })}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <DateEditCell
                        value={task.due_date}
                        onSave={(due_date) => updateTask.mutate({ id: task.id, due_date })}
                        className={getDueDateStyle(task.due_date, task.status)}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <PriorityEditCell
                        value={task.priority}
                        onSave={(priority) => updateTask.mutate({ id: task.id, priority: priority as Task["priority"] })}
                      />
                    </TableCell>
                    <TableCell className="py-2">
                      <AssigneeEditCell
                        value={task.assigned_to || []}
                        profiles={profiles || []}
                        onSave={(assigned_to) => updateTask.mutate({ id: task.id, assigned_to })}
                      />
                    </TableCell>
                  </motion.tr>
                  
                  {/* Subtasks inline */}
                  {isExpanded && task.subtasks?.map((subtask) => {
                    const isSubtaskCompleted = recentlyCompleted.has(subtask.id);
                    
                    return (
                      <motion.tr
                        key={subtask.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ 
                          opacity: 1, 
                          height: "auto",
                          backgroundColor: isSubtaskCompleted ? "hsl(142 76% 36% / 0.1)" : "transparent"
                        }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-muted/20 hover:bg-muted/40 transition-colors border-b"
                      >
                        <TableCell className="py-1.5 pl-6" onClick={(e) => handleToggleSubtask(e, subtask)}>
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
                        </TableCell>
                        <TableCell className="py-1.5"></TableCell>
                        <TableCell className="py-1.5 text-muted-foreground text-xs">↳ sous-tâche</TableCell>
                        <TableCell colSpan={5} className="py-1.5">
                          <span className={cn(
                            "text-sm",
                            subtask.status === "done" && "line-through text-muted-foreground"
                          )}>
                            {subtask.title}
                          </span>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </>
                );
              })}
            </AnimatePresence>
            
            {(!filteredTasks || filteredTasks.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Aucune tâche
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TaskDetailSheet
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
      />
    </>
  );
}
