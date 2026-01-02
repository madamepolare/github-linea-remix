import { useState } from "react";
import { format, parseISO, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Check, X, AlertTriangle, Calendar, Clock, RefreshCw } from "lucide-react";
import { ProjectLot } from "@/hooks/useChantier";
import { Intervention, CreateInterventionInput } from "@/hooks/useInterventions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AISuggestionPanelProps {
  projectId: string;
  projectName: string;
  lots: ProjectLot[];
  interventions: Intervention[];
  onAcceptSuggestion: (interventions: CreateInterventionInput[]) => void;
}

interface SuggestedIntervention {
  lot_name: string;
  lot_id?: string;
  title: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  reason: string;
  priority: "high" | "medium" | "low";
}

interface AIResponse {
  suggestions: SuggestedIntervention[];
  analysis: string;
  warnings: string[];
}

export function AISuggestionPanel({
  projectId,
  projectName,
  lots,
  interventions,
  onAcceptSuggestion,
}: AISuggestionPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<AIResponse | null>(null);
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(new Set());

  const generateSuggestions = async () => {
    setIsLoading(true);
    setResponse(null);
    setAcceptedIds(new Set());

    try {
      const lotsInfo = lots.map((l) => ({
        id: l.id,
        name: l.name,
        company: l.company?.name || "Non assigné",
        status: l.status,
        start_date: l.start_date,
        end_date: l.end_date,
        budget: l.budget,
      }));

      const interventionsInfo = interventions.map((i) => ({
        lot_name: i.lot?.name || "Inconnu",
        title: i.title,
        start_date: i.start_date,
        end_date: i.end_date,
        status: i.status,
      }));

      const prompt = `Tu es un expert en planification de chantier de construction. Analyse le planning suivant et propose des optimisations.

PROJET: ${projectName}

LOTS EXISTANTS:
${JSON.stringify(lotsInfo, null, 2)}

INTERVENTIONS PLANIFIÉES:
${JSON.stringify(interventionsInfo, null, 2)}

TÂCHES:
1. Analyse les lots qui n'ont pas d'interventions planifiées
2. Identifie les conflits potentiels (chevauchements, dépendances non respectées)
3. Propose des interventions pour compléter le planning
4. Suggère des optimisations pour réduire la durée totale du chantier

Réponds UNIQUEMENT avec un JSON valide dans ce format:
{
  "suggestions": [
    {
      "lot_name": "Nom du lot exact",
      "title": "Titre de l'intervention",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "duration_days": 5,
      "reason": "Explication courte",
      "priority": "high|medium|low"
    }
  ],
  "analysis": "Analyse globale du planning en 2-3 phrases",
  "warnings": ["Avertissement 1", "Avertissement 2"]
}`;

      const { data, error } = await supabase.functions.invoke("ai-planning-suggestions", {
        body: { prompt, projectId },
      });

      if (error) throw error;

      // Parse response
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      
      // Map lot names to IDs
      const suggestionsWithIds = parsed.suggestions.map((s: SuggestedIntervention) => {
        const matchingLot = lots.find(
          (l) => l.name.toLowerCase() === s.lot_name.toLowerCase()
        );
        return { ...s, lot_id: matchingLot?.id };
      });

      setResponse({
        ...parsed,
        suggestions: suggestionsWithIds,
      });
    } catch (error) {
      console.error("AI suggestion error:", error);
      toast.error("Erreur lors de la génération des suggestions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptSuggestion = (suggestion: SuggestedIntervention, index: number) => {
    if (!suggestion.lot_id) {
      toast.error("Lot non trouvé dans le projet");
      return;
    }

    onAcceptSuggestion([
      {
        lot_id: suggestion.lot_id,
        title: suggestion.title,
        start_date: suggestion.start_date,
        end_date: suggestion.end_date,
      },
    ]);

    setAcceptedIds((prev) => new Set([...prev, index]));
  };

  const handleAcceptAll = () => {
    const validSuggestions = response?.suggestions.filter((s) => s.lot_id) || [];
    if (validSuggestions.length === 0) {
      toast.error("Aucune suggestion valide à accepter");
      return;
    }

    onAcceptSuggestion(
      validSuggestions.map((s) => ({
        lot_id: s.lot_id!,
        title: s.title,
        start_date: s.start_date,
        end_date: s.end_date,
      }))
    );

    setAcceptedIds(new Set(response?.suggestions.map((_, i) => i) || []));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/10 text-red-600 border-red-200";
      case "medium":
        return "bg-amber-500/10 text-amber-600 border-amber-200";
      default:
        return "bg-blue-500/10 text-blue-600 border-blue-200";
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-5 h-5 text-primary" />
          Suggestions IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!response && !isLoading && (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              L'IA analyse votre planning et propose des optimisations basées sur les lots, les
              entreprises et les dates existantes.
            </p>
            <Button onClick={generateSuggestions} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Générer des suggestions
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyse du planning en cours...
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {response && (
          <>
            {/* Analysis */}
            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p>{response.analysis}</p>
            </div>

            {/* Warnings */}
            {response.warnings.length > 0 && (
              <div className="space-y-2">
                {response.warnings.map((warning, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-amber-700 text-sm"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    {warning}
                  </div>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {response.suggestions.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {response.suggestions.length} suggestion(s)
                  </span>
                  <Button size="sm" variant="outline" onClick={handleAcceptAll}>
                    <Check className="w-4 h-4 mr-1" />
                    Tout accepter
                  </Button>
                </div>

                <ScrollArea className="max-h-80">
                  <div className="space-y-2">
                    {response.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "p-3 rounded-lg border transition-opacity",
                          acceptedIds.has(idx)
                            ? "opacity-50 bg-green-50 border-green-200"
                            : "bg-background"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getPriorityColor(suggestion.priority))}
                              >
                                {suggestion.priority === "high"
                                  ? "Urgent"
                                  : suggestion.priority === "medium"
                                  ? "Normal"
                                  : "Optionnel"}
                              </Badge>
                              <span className="text-xs text-muted-foreground truncate">
                                {suggestion.lot_name}
                              </span>
                            </div>
                            <p className="font-medium text-sm">{suggestion.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {format(parseISO(suggestion.start_date), "d MMM", { locale: fr })} →{" "}
                                {format(parseISO(suggestion.end_date), "d MMM", { locale: fr })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {suggestion.duration_days}j
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                          </div>

                          {!acceptedIds.has(idx) && (
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleAcceptSuggestion(suggestion, idx)}
                              disabled={!suggestion.lot_id}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune suggestion - votre planning semble complet !
              </p>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={generateSuggestions}
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Régénérer
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
