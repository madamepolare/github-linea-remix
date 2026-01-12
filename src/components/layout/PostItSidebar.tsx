import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { usePostItTasks, QuickTask } from "@/hooks/usePostItTasks";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PostItSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Different post-it colors for variety
const postItColors = [
  { bg: "bg-amber-200", border: "border-amber-300", shadow: "shadow-amber-200/50", text: "text-amber-900" },
  { bg: "bg-yellow-200", border: "border-yellow-300", shadow: "shadow-yellow-200/50", text: "text-yellow-900" },
  { bg: "bg-lime-200", border: "border-lime-300", shadow: "shadow-lime-200/50", text: "text-lime-900" },
  { bg: "bg-pink-200", border: "border-pink-300", shadow: "shadow-pink-200/50", text: "text-pink-900" },
  { bg: "bg-sky-200", border: "border-sky-300", shadow: "shadow-sky-200/50", text: "text-sky-900" },
];

function getPostItColor(index: number) {
  return postItColors[index % postItColors.length];
}

export function PostItSidebar({ open, onOpenChange }: PostItSidebarProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { quickTasks, isLoading, createQuickTask, completeQuickTask, deleteQuickTask } = usePostItTasks();

  const pendingTasks = quickTasks?.filter((t) => t.status === "pending") || [];
  const completedTasks = quickTasks?.filter((t) => t.status === "completed").slice(0, 5) || [];

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createQuickTask.mutateAsync({ title: newTaskTitle.trim() });
    setNewTaskTitle("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[380px] sm:w-[420px] p-0 bg-gradient-to-b from-amber-50/50 to-background border-l border-border"
      >
        <SheetHeader className="px-6 py-4 border-b border-border bg-background">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <StickyNote className="h-5 w-5 text-amber-500" strokeWidth={THIN_STROKE} />
              Mes Post-it
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-73px)]">
          {/* Add new post-it */}
          <div className="p-4 border-b border-border bg-background">
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ajouter un post-it..."
                className="flex-1 h-10 bg-amber-50 border-amber-200 focus-visible:ring-amber-300 placeholder:text-amber-600/50"
              />
              <Button
                onClick={handleAddTask}
                disabled={!newTaskTitle.trim() || createQuickTask.isPending}
                size="icon"
                className="h-10 w-10 bg-amber-500 hover:bg-amber-600 text-amber-950"
              >
                <Plus className="h-4 w-4" strokeWidth={THIN_STROKE} />
              </Button>
            </div>
          </div>

          {/* Post-it list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                  <StickyNote className="h-8 w-8 text-amber-500" strokeWidth={THIN_STROKE} />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Aucun post-it
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajoutez une note rapide ci-dessus
                </p>
              </div>
            ) : (
              <AnimatePresence mode="popLayout">
                {pendingTasks.map((task, index) => (
                  <PostItCard
                    key={task.id}
                    task={task}
                    colorIndex={index}
                    onComplete={() => completeQuickTask.mutate(task.id)}
                    onDelete={() => deleteQuickTask.mutate(task.id)}
                  />
                ))}
              </AnimatePresence>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border/50">
                <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Récemment terminés
                </p>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex items-center gap-2 p-2 rounded-lg bg-muted/30"
                    >
                      <Check className="h-4 w-4 text-success shrink-0" strokeWidth={THIN_STROKE} />
                      <span className="text-sm text-muted-foreground line-through flex-1 truncate">
                        {task.title}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface PostItCardProps {
  task: QuickTask;
  colorIndex: number;
  onComplete: () => void;
  onDelete: () => void;
}

function PostItCard({ task, colorIndex, onComplete, onDelete }: PostItCardProps) {
  const colors = getPostItColor(colorIndex);
  const [isHovered, setIsHovered] = useState(false);

  // Random slight rotation for authentic post-it look
  const rotation = ((task.id.charCodeAt(0) % 7) - 3) * 0.8;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, x: 100 }}
      transition={{ type: "spring", damping: 20, stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative p-4 rounded-sm border-l-4 shadow-lg transition-all duration-200",
        colors.bg,
        colors.border,
        colors.shadow,
        isHovered && "shadow-xl scale-[1.02]"
      )}
      style={{ 
        transform: `rotate(${rotation}deg)`,
        backgroundImage: "linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)"
      }}
    >
      {/* Tape effect at top */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-4 bg-amber-100/80 rounded-sm shadow-sm" 
        style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }} 
      />

      <div className="flex items-start gap-3 mt-1">
        {/* Complete checkbox */}
        <button
          onClick={onComplete}
          className={cn(
            "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
            colors.text,
            "border-current/40 hover:border-current hover:bg-white/30"
          )}
        >
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-relaxed", colors.text)}>
            {task.title}
          </p>
          <p className={cn("text-xs mt-2 opacity-60", colors.text)}>
            {format(new Date(task.created_at), "d MMM à HH:mm", { locale: fr })}
          </p>
        </div>

        {/* Delete button */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className={cn(
                  "h-7 w-7 rounded-full",
                  colors.text,
                  "hover:bg-white/30"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
