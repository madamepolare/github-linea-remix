import { useState } from "react";
import { format, parseISO, addDays, addWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Check, X, AlertTriangle, Calendar as CalendarIcon, Clock, RefreshCw, Wand2, Loader2, Building2, Zap, ArrowRight } from "lucide-react";
import { ProjectLot } from "@/hooks/useChantier";
import { Intervention, CreateInterventionInput } from "@/hooks/useInterventions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AIFullPlanningPanelProps {
  projectId: string;
  projectName: string;
  lots: ProjectLot[];
  interventions: Intervention[];
  onAcceptPlanning: (interventions: CreateInterventionInput[]) => void;
  onClose: () => void;
}

interface PlannedIntervention {
  lot_name: string;
  lot_id?: string;
  title: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  color: string;
  reason: string;
  order: number;
}

interface PlanningResponse {
  planning: PlannedIntervention[];
  summary: string;
  total_duration_weeks: number;
  warnings: string[];
}

const INTERVENTION_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

export function AIFullPlanningPanel({
  projectId,
  projectName,
  lots,
  interventions,
  onAcceptPlanning,
  onClose,
}: AIFullPlanningPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<PlanningResponse | null>(null);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [projectDuration, setProjectDuration] = useState("12");

  const generateFullPlanning = async () => {
    if (lots.length === 0) {
      toast.error("Créez d'abord des lots pour générer un planning");
      return;
    }

    setIsLoading(true);
    setResponse(null);

    try {
      const lotsInfo = lots.map((l, idx) => ({
        id: l.id,
        name: l.name,
        company: l.company?.name || "Non assigné",
        status: l.status,
        color: l.color || INTERVENTION_COLORS[idx % INTERVENTION_COLORS.length],
      }));

      const prompt = `Tu es un expert en planification de chantier BTP en France. Tu dois créer un planning COMPLET et RÉALISTE pour ce projet.

PROJET: ${projectName}
DATE DE DÉBUT SOUHAITÉE: ${format(startDate, "yyyy-MM-dd")}
DURÉE ESTIMÉE DU PROJET: ${projectDuration} semaines

LOTS DU PROJET (à planifier dans un ordre logique BTP):
${JSON.stringify(lotsInfo, null, 2)}

RÈGLES DE PLANIFICATION BTP:
1. Respecter l'ordre logique des corps de métier (gros œuvre avant second œuvre, etc.)
2. Prévoir des chevauchements réalistes entre lots compatibles
3. Chaque lot doit avoir au moins une intervention
4. Les durées doivent être réalistes (mini 2 jours, maxi adapté au lot)
5. Les lots dépendants ne doivent pas se chevaucher de manière irréaliste
6. Ordre typique: Terrassement → Gros œuvre/Maçonnerie → Charpente/Couverture → Menuiseries ext → Plomberie/Électricité → Isolation/Placo → Menuiseries int → Peinture → Sols → Finitions

Réponds UNIQUEMENT avec un JSON valide dans ce format:
{
  "planning": [
    {
      "lot_name": "Nom exact du lot",
      "title": "Phase ou intervention principale",
      "start_date": "YYYY-MM-DD",
      "end_date": "YYYY-MM-DD",
      "duration_days": 10,
      "color": "#hex",
      "reason": "Justification courte",
      "order": 1
    }
  ],
  "summary": "Résumé du planning en 2-3 phrases",
  "total_duration_weeks": 12,
  "warnings": ["Attention: ..."]
}`;

      const { data, error } = await supabase.functions.invoke("ai-planning-suggestions", {
        body: { prompt, projectId },
      });

      if (error) throw error;

      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      
      // Map lot names to IDs and assign colors
      const planningWithIds = (parsed.planning || []).map((p: PlannedIntervention, idx: number) => {
        const matchingLot = lots.find(
          (l) => l.name.toLowerCase().trim() === p.lot_name.toLowerCase().trim()
        );
        return { 
          ...p, 
          lot_id: matchingLot?.id,
          color: matchingLot?.color || p.color || INTERVENTION_COLORS[idx % INTERVENTION_COLORS.length],
        };
      });

      setResponse({
        ...parsed,
        planning: planningWithIds,
      });
    } catch (error) {
      console.error("AI planning error:", error);
      toast.error("Erreur lors de la génération du planning");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAll = () => {
    const validInterventions = response?.planning
      .filter((p) => p.lot_id)
      .map((p) => ({
        lot_id: p.lot_id!,
        title: p.title,
        start_date: p.start_date,
        end_date: p.end_date,
        color: p.color,
      })) || [];

    if (validInterventions.length === 0) {
      toast.error("Aucune intervention valide à créer");
      return;
    }

    onAcceptPlanning(validInterventions);
    toast.success(`${validInterventions.length} interventions créées`);
    onClose();
  };

  const unmatchedLots = response?.planning.filter((p) => !p.lot_id) || [];
  const matchedInterventions = response?.planning.filter((p) => p.lot_id) || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Planification IA</h3>
            <p className="text-xs text-muted-foreground">Un architecte virtuel planifie vos lots</p>
          </div>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Initial form */}
      {!response && !isLoading && (
        <div className="space-y-4">
          {/* Quick info */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Prêt à planifier</span>
            </div>
            <p className="text-xs text-muted-foreground">
              L'IA analysera vos <strong>{lots.length} lots</strong> et créera un planning 
              optimisé en respectant l'ordre logique des travaux BTP.
            </p>
          </div>

          {/* Simple form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-sm h-9">
                    <CalendarIcon className="w-4 h-4 mr-2 text-muted-foreground" />
                    {format(startDate, "d MMMM yyyy", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => d && setStartDate(d)}
                    locale={fr}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-1.5">
              <Label className="text-xs">Durée estimée (semaines)</Label>
              <div className="flex gap-2">
                {["8", "12", "16", "24"].map((w) => (
                  <Button
                    key={w}
                    variant={projectDuration === w ? "secondary" : "outline"}
                    size="sm"
                    className="flex-1 h-9"
                    onClick={() => setProjectDuration(w)}
                  >
                    {w}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <Button 
            onClick={generateFullPlanning} 
            className="w-full gap-2" 
            size="lg"
            disabled={lots.length === 0}
          >
            <Sparkles className="w-4 h-4" />
            Générer le planning
          </Button>

          {lots.length === 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Ajoutez des lots dans l'onglet "Lots" pour commencer
            </p>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-primary-foreground" />
              </div>
            </div>
            <div>
              <p className="font-medium">L'architecte planifie...</p>
              <p className="text-xs text-muted-foreground mt-1">Analyse de {lots.length} lots en cours</p>
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        </div>
      )}

      {/* Results */}
      {response && (
        <div className="space-y-3">
          {/* Summary */}
          <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-transparent border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-green-600" />
              <Badge variant="secondary" className="gap-1 text-xs">
                <Clock className="w-3 h-3" />
                {response.total_duration_weeks} sem.
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {matchedInterventions.length} interventions
              </Badge>
            </div>
            <p className="text-sm">{response.summary}</p>
          </div>

          {/* Warnings */}
          {response.warnings.length > 0 && (
            <div className="space-y-1">
              {response.warnings.slice(0, 2).map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 p-2 rounded bg-amber-500/10 text-amber-700 text-xs"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{warning}</span>
                </div>
              ))}
            </div>
          )}

          {/* Planning list */}
          <ScrollArea className="h-[250px]">
            <div className="space-y-1.5 pr-2">
              {matchedInterventions
                .sort((a, b) => a.order - b.order)
                .map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border bg-background hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <div
                    className="w-1.5 h-10 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1 rounded">
                        {item.order}
                      </span>
                      <span className="font-medium text-sm truncate">{item.lot_name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                      <span>{format(parseISO(item.start_date), "d MMM", { locale: fr })}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span>{format(parseISO(item.end_date), "d MMM", { locale: fr })}</span>
                      <span className="text-muted-foreground/60">• {item.duration_days}j</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Unmatched warning */}
          {unmatchedLots.length > 0 && (
            <div className="p-2 rounded bg-destructive/10 text-destructive text-xs">
              {unmatchedLots.length} lot(s) non reconnu(s)
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 gap-1.5" 
              onClick={() => setResponse(null)}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Modifier
            </Button>
            <Button 
              size="sm"
              className="flex-1 gap-1.5" 
              onClick={handleAcceptAll}
              disabled={matchedInterventions.length === 0}
            >
              <Check className="w-3.5 h-3.5" />
              Appliquer ({matchedInterventions.length})
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}