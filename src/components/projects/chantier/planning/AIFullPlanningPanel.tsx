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
import { Sparkles, Check, X, AlertTriangle, Calendar as CalendarIcon, Clock, RefreshCw, Wand2, Loader2, Building2 } from "lucide-react";
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
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-transparent to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wand2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Planification IA complète</CardTitle>
              <CardDescription>Génère un planning optimisé pour tous les lots</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!response && !isLoading && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
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
              <div className="space-y-2">
                <Label>Durée estimée (semaines)</Label>
                <Input
                  type="number"
                  value={projectDuration}
                  onChange={(e) => setProjectDuration(e.target.value)}
                  min={4}
                  max={104}
                />
              </div>
            </div>

            <div className="p-3 rounded-lg bg-muted/50 text-sm">
              <p className="text-muted-foreground">
                L'IA analysera vos <strong>{lots.length} lots</strong> et créera un planning 
                optimisé en respectant l'ordre logique des travaux BTP.
              </p>
            </div>

            <Button onClick={generateFullPlanning} className="w-full gap-2" size="lg">
              <Sparkles className="w-4 h-4" />
              Générer le planning complet
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="space-y-4 py-6">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              </div>
              <div>
                <p className="font-medium">Génération du planning en cours...</p>
                <p className="text-sm text-muted-foreground">Analyse des {lots.length} lots et optimisation</p>
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        )}

        {response && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="gap-1">
                  <Clock className="w-3 h-3" />
                  {response.total_duration_weeks} semaines
                </Badge>
                <Badge variant="secondary">
                  {matchedInterventions.length} interventions
                </Badge>
              </div>
              <p className="text-sm">{response.summary}</p>
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

            {/* Unmatched lots warning */}
            {unmatchedLots.length > 0 && (
              <div className="p-2 rounded bg-destructive/10 text-destructive text-sm">
                <strong>{unmatchedLots.length} intervention(s)</strong> non reconnues: {unmatchedLots.map(u => u.lot_name).join(", ")}
              </div>
            )}

            {/* Planning list */}
            <ScrollArea className="max-h-[300px]">
              <div className="space-y-2">
                {matchedInterventions
                  .sort((a, b) => a.order - b.order)
                  .map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border bg-background flex items-start gap-3"
                  >
                    <div
                      className="w-3 h-full min-h-[40px] rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">#{item.order}</span>
                        <span className="font-medium text-sm truncate">{item.lot_name}</span>
                      </div>
                      <p className="text-sm">{item.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3 h-3" />
                          {format(parseISO(item.start_date), "d MMM", { locale: fr })} → {format(parseISO(item.end_date), "d MMM", { locale: fr })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {item.duration_days}j
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 gap-2" onClick={generateFullPlanning}>
                <RefreshCw className="w-4 h-4" />
                Régénérer
              </Button>
              <Button 
                className="flex-1 gap-2" 
                onClick={handleAcceptAll}
                disabled={matchedInterventions.length === 0}
              >
                <Check className="w-4 h-4" />
                Appliquer ({matchedInterventions.length})
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
