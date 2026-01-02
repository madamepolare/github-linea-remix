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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Trash2, GripVertical, MessageCircle, Send, Sparkles, ChevronDown, Wand2 } from "lucide-react";
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
}

export function SubtasksManager({ taskId, workspaceId }: SubtasksManagerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newSubtask, setNewSubtask] = useState("");
  const [newExchangeTitle, setNewExchangeTitle] = useState("");
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
    const title = newExchangeTitle.trim() || `Aller-retour #${nextNumber}`;
    createExchange.mutate({ title, content: newExchangeContent.trim() });
    setNewExchangeTitle("");
    setNewExchangeContent("");
  };

  const generateSubtasksFromText = async (text: string) => {
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
        toast.success(`${generatedSubtasks.length} sous-tâches générées depuis "${exchange.title || 'Aller-retour'}"`);
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

  // Get exchange index for display
  const getExchangeIndex = (exchange: TaskExchange) => {
    const index = exchanges?.findIndex(e => e.id === exchange.id) ?? 0;
    return index + 1;
  };

  return (
    <Tabs defaultValue="subtasks" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="subtasks">
          Sous-tâches ({totalCount})
        </TabsTrigger>
        <TabsTrigger value="exchanges">
          <MessageCircle className="h-3 w-3 mr-1" />
          Allers-retours ({exchanges?.length || 0})
        </TabsTrigger>
      </TabsList>

      {/* Subtasks Tab */}
      <TabsContent value="subtasks" className="space-y-4">
        {/* AI Generation Button */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isGenerating}>
                <Sparkles className="h-4 w-4 mr-2" />
                Générer IA
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowAiInput(true)}>
                <Wand2 className="h-4 w-4 mr-2" />
                À partir d'un texte
              </DropdownMenuItem>
              {exchanges && exchanges.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Depuis un aller-retour
                  </div>
                  {exchanges.map((exchange) => (
                    <DropdownMenuItem
                      key={exchange.id}
                      onClick={() => generateSubtasksFromExchange(exchange)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      #{getExchangeIndex(exchange)} {exchange.title || "Sans titre"}
                    </DropdownMenuItem>
                  ))}
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {isGenerating && (
            <span className="text-sm text-muted-foreground animate-pulse">
              Génération en cours...
            </span>
          )}
        </div>

        {/* AI Text Input */}
        {showAiInput && (
          <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
            <Textarea
              placeholder="Décrivez les sous-tâches à générer..."
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => generateSubtasksFromText(aiInputText)}
                disabled={!aiInputText.trim() || isGenerating}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Générer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setShowAiInput(false);
                  setAiInputText("");
                }}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Progress Header */}
        {totalCount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression</span>
              <span className="font-medium">
                {completedCount}/{totalCount} terminées
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
        )}

        {/* Subtasks List */}
        <div className="space-y-1">
          {subtasks?.map((subtask) => (
            <div
              key={subtask.id}
              className={cn(
                "group flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors",
                subtask.status === "done" && "opacity-60"
              )}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
              <Checkbox
                checked={subtask.status === "done"}
                onCheckedChange={(checked) =>
                  toggleSubtask.mutate({ id: subtask.id, completed: !!checked })
                }
              />
              <span
                className={cn(
                  "flex-1 text-sm",
                  subtask.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {subtask.title}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100"
                onClick={() => deleteSubtask.mutate(subtask.id)}
              >
                <Trash2 className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add Subtask Form */}
        <form onSubmit={handleAddSubtask} className="flex gap-2">
          <Input
            placeholder="Ajouter une sous-tâche..."
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={!newSubtask.trim() || createSubtask.isPending}>
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        {isLoading && (
          <p className="text-sm text-muted-foreground text-center py-2">Chargement...</p>
        )}

        {!isLoading && totalCount === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Aucune sous-tâche. Ajoutez-en une ci-dessus.
          </p>
        )}
      </TabsContent>

      {/* Exchanges Tab */}
      <TabsContent value="exchanges" className="space-y-4">
        {/* Exchanges List */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {exchanges?.map((exchange) => (
            <div
              key={exchange.id}
              className="group p-3 rounded-lg bg-muted/50 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-primary">
                  #{getExchangeIndex(exchange)} {exchange.title || "Sans titre"}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => deleteExchange.mutate(exchange.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{exchange.content}</p>
              <p className="text-xs text-muted-foreground">
                {exchange.created_at && format(new Date(exchange.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
              </p>
            </div>
          ))}

          {(!exchanges || exchanges.length === 0) && !exchangesLoading && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun échange. Ajoutez un message ci-dessous.
            </p>
          )}

          {exchangesLoading && (
            <p className="text-sm text-muted-foreground text-center py-2">Chargement...</p>
          )}
        </div>

        {/* Add Exchange Form */}
        <form onSubmit={handleAddExchange} className="space-y-2">
          <Input
            placeholder={`Titre (optionnel, ex: Aller-retour #${(exchanges?.length || 0) + 1})`}
            value={newExchangeTitle}
            onChange={(e) => setNewExchangeTitle(e.target.value)}
          />
          <Textarea
            placeholder="Contenu de l'aller-retour..."
            value={newExchangeContent}
            onChange={(e) => setNewExchangeContent(e.target.value)}
            rows={2}
          />
          <Button type="submit" disabled={!newExchangeContent.trim() || createExchange.isPending} className="w-full">
            <Send className="h-4 w-4 mr-2" />
            Ajouter #{(exchanges?.length || 0) + 1}
          </Button>
        </form>
      </TabsContent>
    </Tabs>
  );
}