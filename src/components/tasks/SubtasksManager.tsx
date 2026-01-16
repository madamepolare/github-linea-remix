import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, GripVertical, MessageCircle, Send, Sparkles, Wand2, FileText, User, CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskExchanges, TaskExchange } from "@/hooks/useTaskExchanges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Profile } from "./MultiAssigneePicker";

interface Subtask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done" | "archived";
  sort_order: number | null;
  assigned_to: string[] | null;
  due_date: string | null;
}

interface SubtasksManagerProps {
  taskId: string;
  workspaceId: string;
  taskDescription?: string | null;
}

export function SubtasksManager({ taskId, workspaceId, taskDescription }: SubtasksManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSubtask, setNewSubtask] = useState("");
  const [newExchangeContent, setNewExchangeContent] = useState("");
  const [aiInputText, setAiInputText] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Exchanges hook
  const { exchanges, isLoading: exchangesLoading, createExchange, deleteExchange } = useTaskExchanges(taskId);

  const { data: subtasks, isLoading } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, sort_order, assigned_to, due_date")
        .eq("parent_id", taskId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Subtask[];
    },
  });

  // Fetch workspace members for assignee picker
  const { data: members } = useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const { data: memberData, error: memberError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", workspaceId);

      if (memberError) throw memberError;

      const userIds = memberData.map((m) => m.user_id);

      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profileError) throw profileError;
      return profiles as Profile[];
    },
    enabled: !!workspaceId,
  });

  const createSubtask = useMutation({
    mutationFn: async (title: string) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({
          title,
          parent_id: taskId,
          workspace_id: workspaceId,
          created_by: user?.id,
          status: "todo",
          priority: "medium",
          sort_order: (subtasks?.length || 0) + 1,
        } as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setNewSubtask("");
    },
    onError: (error) => {
      toast.error("Failed to create subtask: " + error.message);
    },
  });

  const toggleSubtask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({
          status: completed ? "done" : "todo",
          completed_at: completed ? new Date().toISOString() : null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Update subtask assignee or due date
  const updateSubtask = useMutation({
    mutationFn: async ({ id, assigned_to, due_date }: { id: string; assigned_to?: string[] | null; due_date?: string | null }) => {
      const updateData: any = {};
      if (assigned_to !== undefined) updateData.assigned_to = assigned_to;
      if (due_date !== undefined) updateData.due_date = due_date;
      
      const { error } = await supabase
        .from("tasks")
        .update(updateData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const deleteSubtask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subtasks", taskId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Sous-tâche supprimée");
    },
  });

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    createSubtask.mutate(newSubtask.trim());
  };

  const handleAddExchange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExchangeContent.trim()) return;
    const nextNumber = (exchanges?.length || 0) + 1;
    const title = `Aller-retour #${nextNumber}`;
    createExchange.mutate({ title, content: newExchangeContent.trim() });
    setNewExchangeContent("");
  };

  const generateSubtasksFromText = async (text: string) => {
    if (!text.trim()) {
      toast.error("Aucun texte à analyser");
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { text }
      });
      
      if (error) throw error;
      
      const generatedSubtasks = data.subtasks as string[];
      if (generatedSubtasks && generatedSubtasks.length > 0) {
        for (const subtaskTitle of generatedSubtasks) {
          await createSubtask.mutateAsync(subtaskTitle);
        }
        toast.success(`${generatedSubtasks.length} sous-tâches générées`);
        setAiInputText("");
        setShowAiInput(false);
      } else {
        toast.error("Aucune sous-tâche générée");
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateSubtasksFromExchange = async (exchange: TaskExchange) => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-subtasks', {
        body: { exchangeContent: exchange.content }
      });
      
      if (error) throw error;
      
      const generatedSubtasks = data.subtasks as string[];
      if (generatedSubtasks && generatedSubtasks.length > 0) {
        for (const subtaskTitle of generatedSubtasks) {
          await createSubtask.mutateAsync(subtaskTitle);
        }
        toast.success(`${generatedSubtasks.length} sous-tâches générées`);
      } else {
        toast.error("Aucune sous-tâche générée");
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
      toast.error("Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  const completedCount = subtasks?.filter((s) => s.status === "done").length || 0;
  const totalCount = subtasks?.length || 0;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const getExchangeIndex = (exchange: TaskExchange) => {
    const index = exchanges?.findIndex(e => e.id === exchange.id) ?? 0;
    return index + 1;
  };

  const hasDescription = taskDescription && taskDescription.trim().length > 0;
  const hasExchanges = exchanges && exchanges.length > 0;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progression</span>
            <span className="font-medium text-foreground">
              {completedCount}/{totalCount} ({Math.round(progressPercent)}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}

      {/* Subtasks List */}
      <div className="space-y-1">
        {subtasks?.map((subtask) => {
          const assignedMember = subtask.assigned_to?.[0] 
            ? members?.find(m => m.user_id === subtask.assigned_to?.[0]) 
            : null;
          const dueDate = subtask.due_date ? new Date(subtask.due_date) : null;
          const isOverdue = dueDate && dueDate < new Date() && subtask.status !== "done";

          return (
            <div
              key={subtask.id}
              className={cn(
                "group flex items-center gap-2 py-2 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors",
                subtask.status === "done" && "opacity-50"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
              <Checkbox
                checked={subtask.status === "done"}
                onCheckedChange={(checked) =>
                  toggleSubtask.mutate({ id: subtask.id, completed: !!checked })
                }
                className="h-4 w-4 flex-shrink-0"
              />
              <span
                className={cn(
                  "flex-1 text-sm leading-tight min-w-0 truncate",
                  subtask.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>

              {/* Assignee Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex-shrink-0 rounded-full p-0.5 hover:bg-muted transition-colors",
                      "opacity-60 group-hover:opacity-100"
                    )}
                  >
                    {assignedMember ? (
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignedMember.avatar_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {assignedMember.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="h-5 w-5 rounded-full border border-dashed border-muted-foreground/40 flex items-center justify-center">
                        <User className="h-3 w-3 text-muted-foreground/50" />
                      </div>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-1" align="end">
                  <div className="space-y-0.5">
                    {members?.map((member) => (
                      <button
                        key={member.user_id}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left"
                        onClick={() => updateSubtask.mutate({
                          id: subtask.id,
                          assigned_to: subtask.assigned_to?.[0] === member.user_id ? null : [member.user_id]
                        })}
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={member.avatar_url || undefined} />
                          <AvatarFallback className="text-[10px]">
                            {member.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate flex-1">{member.full_name}</span>
                        {subtask.assigned_to?.[0] === member.user_id && (
                          <span className="text-primary">✓</span>
                        )}
                      </button>
                    ))}
                    {subtask.assigned_to && subtask.assigned_to.length > 0 && (
                      <>
                        <div className="border-t my-1" />
                        <button
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-left text-muted-foreground"
                          onClick={() => updateSubtask.mutate({ id: subtask.id, assigned_to: null })}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span className="text-sm">Retirer l'assignation</span>
                        </button>
                      </>
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Due Date Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className={cn(
                      "flex-shrink-0 flex items-center gap-1 text-xs px-1.5 py-0.5 rounded hover:bg-muted transition-colors",
                      "opacity-60 group-hover:opacity-100",
                      isOverdue && "text-destructive opacity-100",
                      dueDate && !isOverdue && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {dueDate ? (
                      <span>{format(dueDate, "dd/MM", { locale: fr })}</span>
                    ) : null}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={dueDate || undefined}
                    onSelect={(date) => updateSubtask.mutate({
                      id: subtask.id,
                      due_date: date ? format(date, "yyyy-MM-dd") : null
                    })}
                    initialFocus
                    locale={fr}
                  />
                  {dueDate && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs"
                        onClick={() => updateSubtask.mutate({ id: subtask.id, due_date: null })}
                      >
                        Effacer l'échéance
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={() => deleteSubtask.mutate(subtask.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          );
        })}
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground text-center py-3">Chargement...</p>
      )}

      {!isLoading && totalCount === 0 && !showAiInput && (
        <p className="text-xs text-muted-foreground text-center py-6">
          Aucune sous-tâche
        </p>
      )}

      {/* AI Text Input */}
      {showAiInput && (
        <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
          <Textarea
            placeholder="Décrivez les sous-tâches à générer..."
            value={aiInputText}
            onChange={(e) => setAiInputText(e.target.value)}
            rows={3}
            className="text-sm resize-none"
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => generateSubtasksFromText(aiInputText)}
              disabled={!aiInputText.trim() || isGenerating}
              className="h-7 text-xs"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Générer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setShowAiInput(false);
                setAiInputText("");
              }}
              className="h-7 text-xs"
            >
              Annuler
            </Button>
          </div>
        </div>
      )}

      {/* Add Subtask Form + AI Button */}
      <div className="flex gap-2 pt-1">
        <form onSubmit={handleAddSubtask} className="flex-1 flex gap-2">
          <Input
            placeholder="Ajouter une sous-tâche..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            className="flex-1 h-8 text-sm"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newSubtask.trim() || createSubtask.isPending}
            className="h-8 w-8 flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon" 
              disabled={isGenerating}
              className="h-8 w-8 flex-shrink-0"
            >
              {isGenerating ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem 
              onClick={() => hasDescription && generateSubtasksFromText(taskDescription!)}
              disabled={!hasDescription}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              <div className="flex flex-col">
                <span>Depuis la description</span>
                {!hasDescription && (
                  <span className="text-xs text-muted-foreground">Pas de description</span>
                )}
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowAiInput(true)} className="gap-2">
              <Wand2 className="h-4 w-4" />
              Depuis un texte personnalisé
            </DropdownMenuItem>
            
            {hasExchanges && (
              <>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Depuis un aller-retour
                </div>
                {exchanges.map((exchange) => (
                  <DropdownMenuItem
                    key={exchange.id}
                    onClick={() => generateSubtasksFromExchange(exchange)}
                    className="gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="truncate">
                      #{getExchangeIndex(exchange)} {exchange.title || "Sans titre"}
                    </span>
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Exchanges Section */}
      {(hasExchanges || true) && (
        <div className="border-t pt-4 mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Allers-retours
              {exchanges && exchanges.length > 0 && (
                <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
                  {exchanges.length}
                </span>
              )}
            </label>
          </div>

          {/* Exchanges List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {exchanges?.map((exchange) => (
              <div
                key={exchange.id}
                className="group p-3 rounded-lg border bg-card space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-semibold flex-shrink-0">
                      {getExchangeIndex(exchange)}
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {exchange.title || "Aller-retour"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100"
                      onClick={() => generateSubtasksFromExchange(exchange)}
                      disabled={isGenerating}
                    >
                      <Sparkles className="h-3 w-3 mr-1" />
                      Générer
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                      onClick={() => deleteExchange.mutate(exchange.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {exchange.content}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {exchange.created_at && format(new Date(exchange.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                </p>
              </div>
            ))}

            {(!exchanges || exchanges.length === 0) && !exchangesLoading && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground">
                  Aucun aller-retour
                </p>
              </div>
            )}
          </div>

          {/* Add Exchange Form */}
          <form onSubmit={handleAddExchange} className="space-y-2">
            <Textarea
              placeholder="Nouveau retour client, feedback..."
              value={newExchangeContent}
              onChange={(e) => setNewExchangeContent(e.target.value)}
              rows={2}
              className="text-sm resize-none"
            />
            <Button 
              type="submit" 
              size="sm"
              disabled={!newExchangeContent.trim() || createExchange.isPending}
              className="w-full h-8"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Ajouter
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}