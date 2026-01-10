import { useState } from "react";
import { useUnscheduledTasks, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useTeamAbsences } from "@/hooks/useTeamAbsences";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Loader2, Check, X, AlertTriangle, Clock, User } from "lucide-react";
import { format, addDays, startOfWeek, endOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

interface Suggestion {
  task_id: string;
  task_title: string;
  user_id: string;
  user_name: string;
  start_datetime: string;
  end_datetime: string;
  reason: string;
  selected: boolean;
}

interface AIPlanningResult {
  suggestions: Suggestion[];
  warnings: string[];
  analysis: string;
}

export function AIPlanningPanel() {
  const { data: unscheduledTasks } = useUnscheduledTasks();
  const { schedules, bulkCreateSchedules } = useTaskSchedules();
  const { data: members } = useTeamMembers();
  const { data: absences } = useTeamAbsences();
  const { toast } = useToast();

  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<AIPlanningResult | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());

  const generatePlanning = async () => {
    if (!unscheduledTasks?.length) {
      toast({ 
        title: "Aucune tâche à planifier", 
        description: "Toutes les tâches sont déjà planifiées.",
        variant: "destructive" 
      });
      return;
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });

      const { data, error } = await supabase.functions.invoke("ai-workflow-planning", {
        body: {
          unscheduledTasks: unscheduledTasks.map(t => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            due_date: t.due_date,
            estimated_hours: t.estimated_hours || 2,
            assigned_to: t.assigned_to || [],
          })),
          teamMembers: (members || []).map(m => ({
            user_id: m.user_id,
            full_name: m.profile?.full_name || "Membre",
            absences: (absences || [])
              .filter(a => a.user_id === m.user_id)
              .map(a => ({ start: a.start_date, end: a.end_date })),
          })),
          existingSchedules: (schedules || []).map(s => ({
            user_id: s.user_id,
            start: s.start_datetime,
            end: s.end_datetime,
          })),
          dateRange: {
            start: weekStart.toISOString(),
            end: addDays(weekEnd, 7).toISOString(),
          },
        },
      });

      if (error) throw error;

      const suggestions = (data.suggestions || []).map((s: any) => ({
        ...s,
        selected: true,
      }));

      setResult({
        suggestions,
        warnings: data.warnings || [],
        analysis: data.analysis || "",
      });

      setSelectedSuggestions(new Set(suggestions.map((s: Suggestion) => s.task_id)));
    } catch (error: any) {
      console.error("AI Planning error:", error);
      const errorMessage = error?.message || "Impossible de générer le planning";
      
      // Handle specific error cases
      if (errorMessage.includes("429") || errorMessage.includes("rate")) {
        toast({
          title: "Limite atteinte",
          description: "Trop de requêtes, réessaie dans quelques instants.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("402") || errorMessage.includes("credits")) {
        toast({
          title: "Crédits IA épuisés",
          description: "Ajoute des crédits pour utiliser la planification IA.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erreur",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSuggestion = (taskId: string) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(taskId)) {
      newSelected.delete(taskId);
    } else {
      newSelected.add(taskId);
    }
    setSelectedSuggestions(newSelected);
  };

  const applySelectedSuggestions = async () => {
    if (!result) return;

    const toApply = result.suggestions.filter(s => selectedSuggestions.has(s.task_id));
    
    if (toApply.length === 0) {
      toast({ title: "Aucune suggestion sélectionnée", variant: "destructive" });
      return;
    }

    try {
      await bulkCreateSchedules.mutateAsync(
        toApply.map(s => ({
          task_id: s.task_id,
          user_id: s.user_id,
          start_datetime: s.start_datetime,
          end_datetime: s.end_datetime,
          notes: `Planifié par IA: ${s.reason}`,
        }))
      );

      setResult(null);
      setSelectedSuggestions(new Set());
    } catch (error) {
      console.error("Error applying suggestions:", error);
    }
  };

  const cancelPlanning = () => {
    setResult(null);
    setSelectedSuggestions(new Set());
  };

  if (result) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b bg-primary/5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">Suggestions IA</span>
          </div>
        </div>

        {result.warnings.length > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border-b">
            {result.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-yellow-700 dark:text-yellow-400">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}

        {result.analysis && (
          <div className="p-3 bg-muted/30 border-b">
            <p className="text-xs text-muted-foreground">{result.analysis}</p>
          </div>
        )}

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {result.suggestions.map((suggestion) => (
              <Card
                key={suggestion.task_id}
                className={`transition-all ${
                  selectedSuggestions.has(suggestion.task_id)
                    ? "border-primary shadow-sm"
                    : "opacity-60"
                }`}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={selectedSuggestions.has(suggestion.task_id)}
                      onCheckedChange={() => toggleSuggestion(suggestion.task_id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {suggestion.task_title}
                      </div>
                      
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{suggestion.user_name}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(new Date(suggestion.start_datetime), "EEE d MMM, HH:mm", { locale: fr })}
                          {" → "}
                          {format(new Date(suggestion.end_datetime), "HH:mm", { locale: fr })}
                        </span>
                      </div>

                      <p className="text-[10px] text-muted-foreground mt-1 italic">
                        {suggestion.reason}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="p-3 border-t space-y-2">
          <div className="text-xs text-muted-foreground text-center">
            {selectedSuggestions.size} / {result.suggestions.length} sélectionnées
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={cancelPlanning}
            >
              <X className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={applySelectedSuggestions}
              disabled={selectedSuggestions.size === 0 || bulkCreateSchedules.isPending}
            >
              {bulkCreateSchedules.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Appliquer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="h-6 w-6 text-primary" />
      </div>
      
      <h3 className="font-semibold mb-2">Planification IA</h3>
      
      <p className="text-sm text-muted-foreground mb-4">
        L'IA analysera les tâches non planifiées, les priorités, deadlines et disponibilités
        pour proposer un planning optimal.
      </p>

      <div className="text-xs text-muted-foreground mb-4">
        <Badge variant="outline" className="mr-1">
          {unscheduledTasks?.length || 0}
        </Badge>
        tâches à planifier
      </div>

      <Button
        onClick={generatePlanning}
        disabled={isGenerating || !unscheduledTasks?.length}
        className="w-full"
      >
        {isGenerating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Génération en cours...
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4 mr-2" />
            Générer un planning
          </>
        )}
      </Button>
    </div>
  );
}
