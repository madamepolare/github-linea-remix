import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Trash2, StickyNote, Users, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { usePostItTasks, QuickTask } from "@/hooks/usePostItTasks";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface PostItSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Refined post-it colors - softer, more elegant
const postItColors = [
  { accent: "bg-amber-400", bg: "bg-amber-50", text: "text-amber-800", muted: "text-amber-600" },
  { accent: "bg-lime-400", bg: "bg-lime-50", text: "text-lime-800", muted: "text-lime-600" },
  { accent: "bg-sky-400", bg: "bg-sky-50", text: "text-sky-800", muted: "text-sky-600" },
  { accent: "bg-rose-400", bg: "bg-rose-50", text: "text-rose-800", muted: "text-rose-600" },
  { accent: "bg-violet-400", bg: "bg-violet-50", text: "text-violet-800", muted: "text-violet-600" },
];

function getPostItColor(index: number) {
  return postItColors[index % postItColors.length];
}

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export function PostItSidebar({ open, onOpenChange }: PostItSidebarProps) {
  const { user } = useAuth();
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const { 
    quickTasks, 
    isLoading, 
    createQuickTask, 
    completeQuickTask, 
    uncompleteQuickTask, 
    deleteQuickTask,
    isTaskOwner,
    isSharedTask,
  } = usePostItTasks();
  
  const { data: profiles } = useWorkspaceProfiles();

  // Filter out current user from mention suggestions
  const availableProfiles = profiles?.filter(p => p.user_id !== user?.id) || [];
  
  const filteredProfiles = availableProfiles.filter(p =>
    p.full_name?.toLowerCase().includes(mentionSearch.toLowerCase())
  );

  const pendingTasks = quickTasks?.filter((t) => t.status === "pending") || [];
  const completedTasks = quickTasks?.filter((t) => t.status === "completed").slice(0, 5) || [];

  // Separate own tasks vs shared tasks
  const myTasks = pendingTasks.filter(t => t.created_by === user?.id);
  const sharedWithMe = pendingTasks.filter(t => t.created_by !== user?.id);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewTaskTitle(value);
    
    // Check for @ trigger
    const lastAtIndex = value.lastIndexOf("@");
    if (lastAtIndex !== -1) {
      const afterAt = value.slice(lastAtIndex + 1);
      // Check if we're currently typing a mention
      if (!afterAt.includes(" ")) {
        setMentionSearch(afterAt);
        setShowMentions(true);
        setMentionIndex(0);
        return;
      }
    }
    setShowMentions(false);
  };

  const insertMention = (profile: { user_id: string; full_name: string | null }) => {
    const lastAtIndex = newTaskTitle.lastIndexOf("@");
    const beforeAt = newTaskTitle.slice(0, lastAtIndex);
    const newValue = `${beforeAt}@${profile.full_name || "Utilisateur"} `;
    
    setNewTaskTitle(newValue);
    setSelectedMentions(prev => [...prev, profile.user_id]);
    setShowMentions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showMentions && filteredProfiles.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setMentionIndex((prev) => (prev + 1) % filteredProfiles.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setMentionIndex((prev) => (prev - 1 + filteredProfiles.length) % filteredProfiles.length);
      } else if (e.key === "Tab") {
        e.preventDefault();
        insertMention(filteredProfiles[mentionIndex]);
      } else if (e.key === "Escape") {
        setShowMentions(false);
      } else if (e.key === "Enter") {
        e.preventDefault();
        insertMention(filteredProfiles[mentionIndex]);
      }
      return;
    }
    
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    await createQuickTask.mutateAsync({ 
      title: newTaskTitle.trim(),
      sharedWith: selectedMentions.length > 0 ? selectedMentions : undefined,
    });
    setNewTaskTitle("");
    setSelectedMentions([]);
  };

  // Reset state when sidebar closes
  useEffect(() => {
    if (!open) {
      setShowMentions(false);
      setMentionSearch("");
      setSelectedMentions([]);
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[360px] sm:w-[400px] p-0 border-l border-border bg-background"
      >
        <SheetHeader className="px-5 py-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2.5 text-base font-semibold">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <StickyNote className="h-4 w-4 text-amber-600" strokeWidth={THIN_STROKE} />
            </div>
            Mes Post-it
            {pendingTasks.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                ({pendingTasks.length})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100vh-73px)]">
          {/* Add new post-it */}
          <div className="p-4 border-b border-border">
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    ref={inputRef}
                    value={newTaskTitle}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Nouvelle note... @mention pour partager"
                    className="h-9 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-amber-400 placeholder:text-muted-foreground pr-8"
                  />
                  <AtSign className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                </div>
                <Button
                  onClick={handleAddTask}
                  disabled={!newTaskTitle.trim() || createQuickTask.isPending}
                  size="sm"
                  className="h-9 px-3 bg-amber-500 hover:bg-amber-600 text-white"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                </Button>
              </div>
              
              {/* Mention dropdown */}
              {showMentions && filteredProfiles.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {filteredProfiles.map((profile, index) => (
                    <button
                      key={profile.user_id}
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-muted transition-colors",
                        index === mentionIndex && "bg-muted"
                      )}
                      onClick={() => insertMention(profile)}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {getInitials(profile.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{profile.full_name || "Utilisateur"}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected mentions indicator */}
              {selectedMentions.length > 0 && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>Partagé avec {selectedMentions.length} personne(s)</span>
                </div>
              )}
            </div>
          </div>

          {/* Post-it list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full" />
              </div>
            ) : pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
                  <StickyNote className="h-5 w-5 text-muted-foreground" strokeWidth={THIN_STROKE} />
                </div>
                <p className="text-sm text-muted-foreground">
                  Aucune note
                </p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  Ajoutez une note rapide ci-dessus
                </p>
              </div>
            ) : (
              <>
                {/* My own tasks */}
                {myTasks.length > 0 && (
                  <AnimatePresence mode="popLayout">
                    {myTasks.map((task, index) => (
                      <PostItCard
                        key={task.id}
                        task={task}
                        colorIndex={index}
                        onComplete={() => completeQuickTask.mutate(task.id)}
                        onDelete={() => deleteQuickTask.mutate(task.id)}
                        isOwner={true}
                        profiles={profiles}
                      />
                    ))}
                  </AnimatePresence>
                )}

                {/* Shared with me */}
                {sharedWithMe.length > 0 && (
                  <div className={cn(myTasks.length > 0 && "mt-6 pt-4 border-t border-border")}>
                    <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wider flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Partagés avec moi
                    </p>
                    <AnimatePresence mode="popLayout">
                      {sharedWithMe.map((task, index) => (
                        <PostItCard
                          key={task.id}
                          task={task}
                          colorIndex={index + myTasks.length}
                          onComplete={() => completeQuickTask.mutate(task.id)}
                          onDelete={() => {}} // Shared users can't delete
                          isOwner={false}
                          profiles={profiles}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </>
            )}

            {/* Completed tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-[11px] font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  Terminés
                </p>
                <div className="space-y-1">
                  {completedTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => uncompleteQuickTask.mutate(task.id)}
                        className="h-4 w-4 rounded-full bg-success/20 flex items-center justify-center shrink-0 hover:bg-success/30 transition-colors cursor-pointer"
                        title="Remettre en attente"
                      >
                        <Check className="h-2.5 w-2.5 text-success" strokeWidth={3} />
                      </button>
                      <span className="text-sm text-muted-foreground line-through flex-1 truncate">
                        {task.title}
                      </span>
                      {task.created_by === user?.id && (
                        <button
                          onClick={() => deleteQuickTask.mutate(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                          title="Supprimer"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={THIN_STROKE} />
                        </button>
                      )}
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
  isOwner: boolean;
  profiles?: Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>;
}

function PostItCard({ task, colorIndex, onComplete, onDelete, isOwner, profiles }: PostItCardProps) {
  const colors = getPostItColor(colorIndex);
  const [isHovered, setIsHovered] = useState(false);

  // Find owner profile if task is shared
  const ownerProfile = !isOwner && profiles?.find(p => p.user_id === task.created_by);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: "spring", damping: 25, stiffness: 350 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative rounded-lg border border-border/60 transition-all duration-200",
        colors.bg,
        isHovered && "border-border shadow-sm"
      )}
    >
      {/* Color accent bar */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-lg", colors.accent)} />

      <div className="flex items-start gap-3 p-3 pl-4">
        {/* Complete checkbox */}
        <button
          onClick={onComplete}
          className={cn(
            "mt-0.5 w-4 h-4 rounded-full border-[1.5px] flex items-center justify-center transition-all shrink-0",
            "border-current/30 hover:border-current/60 hover:bg-white/50",
            colors.muted
          )}
        >
          <AnimatePresence>
            {isHovered && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm leading-relaxed", colors.text)}>
            {task.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <p className={cn("text-[11px]", colors.muted, "opacity-70")}>
              {format(new Date(task.created_at), "d MMM, HH:mm", { locale: fr })}
            </p>
            {!isOwner && ownerProfile && (
              <div className="flex items-center gap-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={ownerProfile.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {getInitials(ownerProfile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <span className={cn("text-[10px]", colors.muted, "opacity-70")}>
                  par {ownerProfile.full_name?.split(" ")[0]}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Delete button - only for owner */}
        {isOwner && (
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                onClick={onDelete}
                className={cn(
                  "p-1.5 rounded-md transition-colors shrink-0",
                  "text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10"
                )}
              >
                <Trash2 className="h-3.5 w-3.5" strokeWidth={THIN_STROKE} />
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
