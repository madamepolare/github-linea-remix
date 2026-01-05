import { useState } from "react";
import { useQuickTasksDB, QuickTask } from "@/hooks/useQuickTasksDB";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronDown, Plus, Calendar, Loader2, X, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

export function QuickTasksSection() {
  const { pendingTasks, completedTasks, isLoading, createQuickTask, toggleQuickTask, deleteQuickTask } = useQuickTasksDB();
  const [isOpen, setIsOpen] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createQuickTask.mutateAsync({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const handleToggle = (task: QuickTask) => {
    const willComplete = task.status !== 'completed';
    if (willComplete) {
      setCelebratingTaskId(task.id);
      setTimeout(() => {
        setCelebratingTaskId(null);
      }, 1500);
    }
    toggleQuickTask.mutate({ id: task.id, completed: willComplete });
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
                <AnimatePresence mode="popLayout">
                  {pendingTasks.map((task) => (
                    <QuickTaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleToggle} 
                      onDelete={(id) => deleteQuickTask.mutate(id)}
                      isCelebrating={celebratingTaskId === task.id}
                    />
                  ))}
                </AnimatePresence>
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
                <AnimatePresence mode="popLayout">
                  {completedTasks.map((task) => (
                    <QuickTaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleToggle} 
                      onDelete={(id) => deleteQuickTask.mutate(id)}
                      isCelebrating={false}
                    />
                  ))}
                </AnimatePresence>
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
  isCelebrating: boolean;
}

function QuickTaskItem({ task, onToggle, onDelete, isCelebrating }: QuickTaskItemProps) {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        scale: isCelebrating ? [1, 1.02, 1] : 1,
        backgroundColor: isCelebrating ? "hsl(var(--primary) / 0.1)" : "transparent"
      }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.3 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 group relative overflow-hidden",
        isCompleted && "opacity-60"
      )}
    >
      {/* Celebration particles */}
      <AnimatePresence>
        {isCelebrating && (
          <>
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  opacity: 1, 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  opacity: 0,
                  scale: 1,
                  x: (Math.random() - 0.5) * 100,
                  y: (Math.random() - 0.5) * 60
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute left-4 top-1/2 pointer-events-none"
              >
                <Sparkles 
                  className="h-3 w-3" 
                  style={{ 
                    color: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][i]
                  }} 
                />
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.6 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <Check className="h-6 w-6 text-green-500" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={isCelebrating ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(task)}
          className={cn(isCelebrating && "border-green-500 bg-green-500 text-white")}
        />
      </motion.div>
      
      <motion.span 
        className={cn("flex-1 text-sm", isCompleted && "line-through text-muted-foreground")}
        animate={isCelebrating ? { color: "hsl(var(--primary))" } : {}}
      >
        {task.title}
      </motion.span>
      
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
    </motion.div>
  );
}
