import { useState } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { TaskDetailSheet } from "./TaskDetailSheet";
import { QuickTaskRow } from "./QuickTaskRow";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar, Clock, ChevronRight, MessageSquare, Building2, CheckSquare, Plus } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { TASK_STATUSES, TASK_PRIORITIES, TASK_MODULES } from "@/lib/taskTypes";

interface TaskListViewProps {
  statusFilter?: string | null;
  priorityFilter?: string | null;
  entityFilter?: string;
}

export function TaskListView({ statusFilter, priorityFilter, entityFilter = "all" }: TaskListViewProps) {
  const { tasks, isLoading, updateTaskStatus } = useTasks();
  const { companies } = useCRMCompanies();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const handleToggleComplete = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const newStatus = task.status === "done" ? "todo" : "done";
    updateTaskStatus.mutate({ id: task.id, status: newStatus });
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

  const getCompanyName = (companyId: string | null) => {
    if (!companyId) return null;
    return companies?.find(c => c.id === companyId)?.name || null;
  };

  const getFilteredTasks = () => {
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
    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  const getStatusConfig = (status: Task["status"]) => TASK_STATUSES.find(s => s.id === status);
  const getPriorityConfig = (priority: Task["priority"]) => TASK_PRIORITIES.find(p => p.id === priority);
  const getModuleLabel = (module: string | null) => TASK_MODULES.find(m => m.id === module)?.label || 'Général';

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>Tâche</TableHead>
              <TableHead className="w-28">Statut</TableHead>
              <TableHead className="w-24">Assigné</TableHead>
              <TableHead className="w-28">Échéance</TableHead>
              <TableHead className="w-24">Priorité</TableHead>
              <TableHead className="w-24">Module</TableHead>
              <TableHead className="w-32">Relation</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Quick add row */}
            {showQuickAdd ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <QuickTaskRow onCreated={() => setShowQuickAdd(false)} className="rounded-none border-0" />
                </TableCell>
              </TableRow>
            ) : (
              <TableRow 
                className="cursor-pointer hover:bg-muted/30"
                onClick={() => setShowQuickAdd(true)}
              >
                <TableCell colSpan={10} className="py-2">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Plus className="h-4 w-4" />
                    <span>Ajouter une tâche...</span>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filteredTasks?.map((task) => {
              const hasSubtasks = task.subtasks && task.subtasks.length > 0;
              const isExpanded = expandedTasks.has(task.id);
              const statusConfig = getStatusConfig(task.status);
              const priorityConfig = getPriorityConfig(task.priority);
              const companyName = getCompanyName(task.crm_company_id);
              const completedSubtasks = task.subtasks?.filter(s => s.status === "done").length || 0;

              return (
                <>
                  <TableRow
                    key={task.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedTask(task)}
                  >
                    <TableCell onClick={(e) => handleToggleComplete(e, task)}>
                      <Checkbox checked={task.status === "done"} />
                    </TableCell>
                    <TableCell onClick={(e) => hasSubtasks && toggleExpand(e, task.id)}>
                      {hasSubtasks && (
                        <ChevronRight className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-90"
                        )} />
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium",
                          task.status === "done" && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </span>
                        {hasSubtasks && (
                          <span className="text-xs text-muted-foreground">
                            ({completedSubtasks}/{task.subtasks!.length})
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full", statusConfig?.dotClass)} />
                        <span className="text-sm">{statusConfig?.label}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {task.assigned_to && task.assigned_to.length > 0 && (
                        <div className="flex -space-x-1">
                          {task.assigned_to.slice(0, 2).map((userId) => (
                            <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                              <AvatarFallback className="text-2xs bg-primary/10">
                                {userId.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {task.assigned_to.length > 2 && (
                            <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                              <span className="text-2xs">+{task.assigned_to.length - 2}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>{format(new Date(task.due_date), "d MMM", { locale: fr })}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("text-xs", priorityConfig?.color)}>
                        {priorityConfig?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs font-normal">
                        {getModuleLabel(task.module)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {companyName && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate max-w-[100px]">{companyName}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>

                  {/* Expanded subtasks */}
                  {isExpanded && task.subtasks?.map((subtask) => (
                    <TableRow key={subtask.id} className="bg-muted/20">
                      <TableCell></TableCell>
                      <TableCell></TableCell>
                      <TableCell colSpan={8} className="pl-8">
                        <div className="flex items-center gap-3">
                          <Checkbox checked={subtask.status === "done"} />
                          <span className={cn(
                            "text-sm",
                            subtask.status === "done" && "line-through text-muted-foreground"
                          )}>
                            {subtask.title}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              );
            })}
            
            {(!filteredTasks || filteredTasks.length === 0) && (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
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
