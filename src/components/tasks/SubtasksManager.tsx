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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, GripVertical, MessageCircle, Send, Sparkles, ChevronDown, Wand2, FileText, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTaskExchanges, TaskExchange } from "@/hooks/useTaskExchanges";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Subtask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "review" | "done" | "archived";
  sort_order: number | null;
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
        .select("id, title, status, sort_order")
        .eq("parent_id", taskId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Subtask[];
    },
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
    <Tabs defaultValue="subtasks" className="space-y-3">
      <TabsList className="grid w-full grid-cols-2 h-9">
        <TabsTrigger value="subtasks" className="text-xs gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          Sous-tâches
          {totalCount > 0 && (
            <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
              {completedCount}/{totalCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="exchanges" className="text-xs gap-1.5">
          <MessageCircle className="h-3.5 w-3.5" />
          Allers-retours
          {exchanges && exchanges.length > 0 && (
            <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-full">
              {exchanges.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      {/* Subtasks Tab */}
      <TabsContent value="subtasks" className="space-y-3 mt-3">
        {/* Progress Bar */}
        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Progression</span>
              <span className="font-medium text-foreground">
                {Math.round(progressPercent)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-1.5" />
          </div>
        )}

        {/* Subtasks List */}
        <div className="space-y-0.5">
          {subtasks?.map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                "group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/50 transition-colors",
                subtask.status === "done" && "opacity-50"
              )}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab flex-shrink-0" />
              <Checkbox
                checked={subtask.status === "done"}
                onCheckedChange={(checked) =>
                  toggleSubtask.mutate({ id: subtask.id, completed: !!checked })
                }
                className="h-4 w-4"
              />
              <span
                className={cn(
                  "flex-1 text-sm leading-tight",
                  subtask.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0"
                onClick={() => deleteSubtask.mutate(subtask.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {isLoading && (
          <p className="text-xs text-muted-foreground text-center py-3">Chargement...</p>
        )}

        {!isLoading && totalCount === 0 && !showAiInput && (
          <p className="text-xs text-muted-foreground text-center py-3">
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
      </TabsContent>

      {/* Exchanges Tab */}
      <TabsContent value="exchanges" className="space-y-3 mt-3">
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
            <div className="text-center py-6">
              <MessageCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-xs text-muted-foreground">
                Aucun aller-retour
              </p>
            </div>
          )}

          {exchangesLoading && (
            <p className="text-xs text-muted-foreground text-center py-3">Chargement...</p>
          )}
        </div>

        {/* Add Exchange Form */}
        <form onSubmit={handleAddExchange} className="space-y-2 pt-1">
          <Textarea
            placeholder="Nouveau retour client, feedback..."
            value={newExchangeContent}
            onChange={(e) => setNewExchangeContent(e.target.value)}
            rows={2}
            className="text-sm resize-none"
          />
          <Button 
            type="submit" 
            disabled={!newExchangeContent.trim() || createExchange.isPending} 
            className="w-full h-8 text-xs"
          >
            <Send className="h-3.5 w-3.5 mr-1.5" />
            Ajouter l'aller-retour #{(exchanges?.length || 0) + 1}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}