import { useState } from "react";
import { useQuickTasksDB, QuickTask } from "@/hooks/useQuickTasksDB";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, Plus, Calendar, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function QuickTasksSection() {
  const { pendingTasks, completedTasks, isLoading, createQuickTask, toggleQuickTask, deleteQuickTask } = useQuickTasksDB();
  const [isOpen, setIsOpen] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState("pending");

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createQuickTask.mutateAsync({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const handleToggle = (task: QuickTask) => {
    toggleQuickTask.mutate({ id: task.id, completed: task.status !== 'completed' });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-lg bg-card">
      <CollapsibleTrigger asChild>
        <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <ChevronDown className={cn("h-4 w-4 transition-transform", !isOpen && "-rotate-90")} />
            <span className="font-medium text-sm">Tâches rapides</span>
            {pendingTasks.length > 0 && (
              <span className="text-xs text-muted-foreground">({pendingTasks.length} en attente)</span>
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="h-8 p-0.5 mb-3">
            <TabsTrigger value="pending" className="h-7 text-xs px-3">
              En attente ({pendingTasks.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="h-7 text-xs px-3">
              Terminées ({completedTasks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-0 space-y-2">
            {/* Add task input */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Ajouter une tâche rapide..."
                className="h-9 text-sm"
              />
              <Button type="submit" size="sm" disabled={!newTaskTitle.trim() || createQuickTask.isPending}>
                {createQuickTask.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              </Button>
            </form>

            {/* Pending tasks list */}
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune tâche rapide en attente. Ajoutez-en une ci-dessus.
              </p>
            ) : (
              <div className="space-y-1">
                {pendingTasks.map((task) => (
                  <QuickTaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={(id) => deleteQuickTask.mutate(id)} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-0">
            {completedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune tâche terminée.
              </p>
            ) : (
              <div className="space-y-1">
                {completedTasks.map((task) => (
                  <QuickTaskItem key={task.id} task={task} onToggle={handleToggle} onDelete={(id) => deleteQuickTask.mutate(id)} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CollapsibleContent>
    </Collapsible>
  );
}

interface QuickTaskItemProps {
  task: QuickTask;
  onToggle: (task: QuickTask) => void;
  onDelete: (id: string) => void;
}

function QuickTaskItem({ task, onToggle, onDelete }: QuickTaskItemProps) {
  const isCompleted = task.status === 'completed';
  
  return (
    <div className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 group",
      isCompleted && "opacity-60"
    )}>
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(task)}
      />
      <span className={cn("flex-1 text-sm", isCompleted && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      {task.due_date && (
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {format(new Date(task.due_date), "d MMM", { locale: fr })}
        </span>
      )}
      <button 
        onClick={() => onDelete(task.id)} 
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
