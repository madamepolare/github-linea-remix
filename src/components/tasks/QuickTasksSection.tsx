import { useState } from "react";
import { useQuickTasksDB, QuickTask } from "@/hooks/useQuickTasksDB";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Plus, Calendar, Loader2, X, Sparkles, Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

export function QuickTasksSection() {
  const { pendingTasks, completedTasks, isLoading, createQuickTask, toggleQuickTask, deleteQuickTask } = useQuickTasksDB();
  const [isOpen, setIsOpen] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [celebratingTaskId, setCelebratingTaskId] = useState<string | null>(null);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    await createQuickTask.mutateAsync({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const handleToggle = (task: QuickTask, e: React.MouseEvent) => {
    const willComplete = task.status !== 'completed';
    if (willComplete) {
      setCelebratingTaskId(task.id);
      
      // Mini confetti burst
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      confetti({
        particleCount: 25,
        spread: 45,
        origin: { 
          x: rect.left / window.innerWidth + 0.01, 
          y: rect.top / window.innerHeight 
        },
        colors: ['#22c55e', '#16a34a', '#4ade80', '#86efac'],
        startVelocity: 12,
        gravity: 0.8,
        scalar: 0.5,
        ticks: 40,
      });
      
      setTimeout(() => {
        setCelebratingTaskId(null);
      }, 800);
    }
    toggleQuickTask.mutate({ id: task.id, completed: willComplete });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 dark:from-amber-950/20 dark:to-orange-950/10 border-amber-200/50 dark:border-amber-800/30 overflow-hidden">
        <CollapsibleTrigger asChild>
          <button className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-amber-100/30 dark:hover:bg-amber-900/20 transition-colors">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-sm">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <span className="font-semibold text-sm text-amber-900 dark:text-amber-100">Tâches rapides</span>
                {pendingTasks.length > 0 && (
                  <span className="ml-2 text-xs text-amber-600 dark:text-amber-400">
                    {pendingTasks.length} en attente
                  </span>
                )}
              </div>
            </div>
            <ChevronDown className={cn(
              "h-4 w-4 text-amber-600 dark:text-amber-400 transition-transform duration-200",
              !isOpen && "-rotate-90"
            )} />
          </button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-3">
            {/* Add task input */}
            <form onSubmit={handleAddTask} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Ajouter une tâche rapide..."
                  className="h-10 pl-10 bg-white dark:bg-background border-amber-200 dark:border-amber-800/50 focus-visible:ring-amber-400"
                />
                <Plus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-500" />
              </div>
              <Button 
                type="submit" 
                size="sm"
                disabled={!newTaskTitle.trim() || createQuickTask.isPending}
                className="h-10 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm"
              >
                {createQuickTask.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.div>
                )}
              </Button>
            </form>

            {/* Pending tasks list */}
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-amber-600/70 dark:text-amber-400/70 text-center py-4">
                Aucune tâche rapide. Ajoutez-en une ci-dessus !
              </p>
            ) : (
              <div className="space-y-1">
                <AnimatePresence mode="popLayout">
                  {pendingTasks.map((task, index) => (
                    <QuickTaskItem 
                      key={task.id} 
                      task={task} 
                      onToggle={handleToggle} 
                      onDelete={(id) => deleteQuickTask.mutate(id)}
                      isCelebrating={celebratingTaskId === task.id}
                      index={index}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Completed tasks toggle */}
            {completedTasks.length > 0 && (
              <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/30">
                <button
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                  <ChevronDown className={cn(
                    "h-3 w-3 transition-transform",
                    !showCompleted && "-rotate-90"
                  )} />
                  <span>{completedTasks.length} terminée{completedTasks.length > 1 ? 's' : ''}</span>
                </button>
                
                <AnimatePresence>
                  {showCompleted && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 space-y-1 overflow-hidden"
                    >
                      {completedTasks.slice(0, 5).map((task, index) => (
                        <QuickTaskItem 
                          key={task.id} 
                          task={task} 
                          onToggle={handleToggle} 
                          onDelete={(id) => deleteQuickTask.mutate(id)}
                          isCelebrating={false}
                          index={index}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface QuickTaskItemProps {
  task: QuickTask;
  onToggle: (task: QuickTask, e: React.MouseEvent) => void;
  onDelete: (id: string) => void;
  isCelebrating: boolean;
  index: number;
}

function QuickTaskItem({ task, onToggle, onDelete, isCelebrating, index }: QuickTaskItemProps) {
  const isCompleted = task.status === 'completed';
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ 
        opacity: 1, 
        x: 0,
        scale: isCelebrating ? [1, 1.02, 1] : 1,
      }}
      exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-lg group relative overflow-hidden transition-colors",
        isCompleted 
          ? "bg-amber-100/30 dark:bg-amber-900/10" 
          : "bg-white/60 dark:bg-background/40 hover:bg-white dark:hover:bg-background/60 shadow-sm"
      )}
    >
      {/* Celebration effect */}
      <AnimatePresence>
        {isCelebrating && (
          <>
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{ 
                  opacity: 0,
                  scale: 1,
                  x: (Math.random() - 0.5) * 80,
                  y: (Math.random() - 0.5) * 50
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute left-4 top-1/2 pointer-events-none"
              >
                <Sparkles 
                  className="h-3 w-3" 
                  style={{ 
                    color: ['#FFD700', '#22c55e', '#4ECDC4', '#f59e0b', '#96CEB4', '#FFEAA7'][i]
                  }} 
                />
              </motion.div>
            ))}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ duration: 0.5 }}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
            >
              <Check className="h-5 w-5 text-green-500" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.div
        animate={isCelebrating ? { scale: [1, 1.4, 1] } : {}}
        transition={{ duration: 0.3 }}
        onClick={(e) => onToggle(task, e)}
        className="cursor-pointer"
      >
        <Checkbox
          checked={isCompleted}
          className={cn(
            "h-5 w-5 rounded-full border-2 transition-colors",
            isCompleted 
              ? "border-green-500 bg-green-500 text-white" 
              : "border-amber-400 hover:border-amber-500"
          )}
        />
      </motion.div>
      
      <span className={cn(
        "flex-1 text-sm transition-all",
        isCompleted && "line-through text-muted-foreground"
      )}>
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
        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
