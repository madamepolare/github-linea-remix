import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProject } from "@/hooks/useProjects";
import { useProjectPhases } from "@/hooks/useProjectPhases";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, parseISO, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Sparkles, Calendar, Clock, AlertTriangle, ChevronRight, Loader2 } from "lucide-react";

interface AIPhasePlannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

interface PlannedPhase {
  name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  notes?: string;
}

interface PlanningResult {
  planned_phases: PlannedPhase[];
  summary: string;
  warnings?: string[];
}

export function AIPhasePlannerDialog({ open, onOpenChange, projectId }: AIPhasePlannerDialogProps) {
  const { data: project } = useProject(projectId);
  const { phases, updatePhase } = useProjectPhases(projectId);
  
  const [isLoading, setIsLoading] = useState(false);
  const [planningResult, setPlanningResult] = useState<PlanningResult | null>(null);
  const [commercialPhases, setCommercialPhases] = useState<any[] | null>(null);
  const [selectedPhases, setSelectedPhases] = useState<Set<string>>(new Set());
  const [step, setStep] = useState<"init" | "loading" | "result">("init");

  // Check for commercial document phases when dialog opens
  useEffect(() => {
    if (open && projectId) {
      checkCommercialDocument();
    }
  }, [open, projectId]);

  const checkCommercialDocument = async () => {
    // Check if project has an associated commercial document
    const { data: commercialDoc } = await supabase
      .from("commercial_documents")
      .select(`
        id,
        document_type,
        title,
        commercial_document_phases (
          id,
          phase_name,
          phase_code,
          phase_description,
          percentage_fee,
          start_date,
          end_date,
          sort_order
        )
      `)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (commercialDoc?.commercial_document_phases?.length) {
      setCommercialPhases(commercialDoc.commercial_document_phases);
    } else {
      setCommercialPhases(null);
    }
  };

  const generatePlanning = async () => {
    if (!project) return;

    setStep("loading");
    setIsLoading(true);
    setPlanningResult(null);

    try {
      // Build phases list - prefer commercial document phases if available
      let phasesToPlan: { name: string; percentage_fee?: number }[];
      
      if (commercialPhases && commercialPhases.length > 0) {
        phasesToPlan = commercialPhases
          .sort((a, b) => a.sort_order - b.sort_order)
          .map(p => ({
            name: p.phase_name,
            percentage_fee: p.percentage_fee,
          }));
      } else if (phases.length > 0) {
        phasesToPlan = phases.map(p => ({
          name: p.name,
          percentage_fee: 15, // Default
        }));
      } else {
        toast.error("Aucune phase à planifier");
        setStep("init");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("suggest-phase-planning", {
        body: {
          phases: phasesToPlan,
          projectType: project.project_type || "interior",
          projectStartDate: project.start_date,
          projectEndDate: project.end_date,
          projectDescription: project.description,
          projectBudget: project.budget,
          projectSurface: project.surface_area,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setPlanningResult(data);
      // Select all phases by default
      setSelectedPhases(new Set(data.planned_phases.map((p: PlannedPhase) => p.name)));
      setStep("result");
    } catch (error) {
      console.error("Error generating planning:", error);
      toast.error(error instanceof Error ? error.message : "Erreur lors de la génération du planning");
      setStep("init");
    } finally {
      setIsLoading(false);
    }
  };

  const applyPlanning = async () => {
    if (!planningResult) return;

    setIsLoading(true);
    let successCount = 0;

    try {
      for (const plannedPhase of planningResult.planned_phases) {
        if (!selectedPhases.has(plannedPhase.name)) continue;

        // Find matching phase in project
        const matchingPhase = phases.find(
          p => p.name.toLowerCase() === plannedPhase.name.toLowerCase()
        );

        if (matchingPhase) {
          await updatePhase.mutateAsync({
            id: matchingPhase.id,
            start_date: plannedPhase.start_date,
            end_date: plannedPhase.end_date,
          });
          successCount++;
        }
      }

      toast.success(`${successCount} phase(s) planifiée(s)`);
      onOpenChange(false);
      setPlanningResult(null);
      setStep("init");
    } catch (error) {
      console.error("Error applying planning:", error);
      toast.error("Erreur lors de l'application du planning");
    } finally {
      setIsLoading(false);
    }
  };

  const togglePhase = (phaseName: string) => {
    const newSelection = new Set(selectedPhases);
    if (newSelection.has(phaseName)) {
      newSelection.delete(phaseName);
    } else {
      newSelection.add(phaseName);
    }
    setSelectedPhases(newSelection);
  };

  const handleClose = () => {
    onOpenChange(false);
    setPlanningResult(null);
    setStep("init");
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Planification IA des phases
          </DialogTitle>
          <DialogDescription>
            {commercialPhases 
              ? "Les phases seront basées sur le devis commercial associé au projet."
              : "Les phases seront basées sur le type de projet."}
          </DialogDescription>
        </DialogHeader>

        {step === "init" && (
          <div className="py-6 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Informations du projet</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Type :</span>{" "}
                  <Badge variant="secondary">{project?.project_type || "Non défini"}</Badge>
                </div>
                {project?.start_date && (
                  <div>
                    <span className="text-muted-foreground">Début :</span>{" "}
                    {format(parseISO(project.start_date), "d MMM yyyy", { locale: fr })}
                  </div>
                )}
                {project?.end_date && (
                  <div>
                    <span className="text-muted-foreground">Fin :</span>{" "}
                    {format(parseISO(project.end_date), "d MMM yyyy", { locale: fr })}
                  </div>
                )}
                {project?.start_date && project?.end_date && (
                  <div>
                    <span className="text-muted-foreground">Durée :</span>{" "}
                    {differenceInDays(parseISO(project.end_date), parseISO(project.start_date))} jours
                  </div>
                )}
              </div>
            </div>

            {commercialPhases && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-primary mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Phases du devis détectées</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {commercialPhases.length} phases seront utilisées comme base pour le planning.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Phases à planifier ({commercialPhases?.length || phases.length})</h4>
              <div className="flex flex-wrap gap-2">
                {(commercialPhases || phases).map((phase: any, index: number) => (
                  <Badge key={index} variant="outline">
                    {phase.phase_name || phase.name}
                  </Badge>
                ))}
              </div>
            </div>

            {(!project?.start_date || !project?.end_date) && (
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-3 flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                  Définissez les dates de début et fin du projet pour un planning optimal.
                </span>
              </div>
            )}
          </div>
        )}

        {step === "loading" && (
          <div className="py-12 flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Sparkles className="h-5 w-5 text-primary absolute -top-1 -right-1" />
            </div>
            <div className="text-center">
              <p className="font-medium">Génération du planning en cours...</p>
              <p className="text-sm text-muted-foreground">
                L'IA analyse le projet et propose des dates optimales
              </p>
            </div>
          </div>
        )}

        {step === "result" && planningResult && (
          <div className="py-4 space-y-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-sm">{planningResult.summary}</p>
            </div>

            {planningResult.warnings && planningResult.warnings.length > 0 && (
              <div className="bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-3 space-y-1">
                {planningResult.warnings.map((warning, i) => (
                  <p key={i} className="text-sm flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    {warning}
                  </p>
                ))}
              </div>
            )}

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {planningResult.planned_phases.map((phase, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 flex items-start gap-3 hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedPhases.has(phase.name)}
                      onCheckedChange={() => togglePhase(phase.name)}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{phase.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {phase.duration_days} jours
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(phase.start_date), "d MMM", { locale: fr })}
                        </span>
                        <ChevronRight className="h-3 w-3" />
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(phase.end_date), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      {phase.notes && (
                        <p className="text-xs text-muted-foreground mt-1">{phase.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Annuler
          </Button>
          {step === "init" && (
            <Button onClick={generatePlanning} disabled={isLoading}>
              <Sparkles className="h-4 w-4 mr-2" />
              Générer le planning
            </Button>
          )}
          {step === "result" && (
            <Button onClick={applyPlanning} disabled={isLoading || selectedPhases.size === 0}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Appliquer ({selectedPhases.size} phases)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
