import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, FileText, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CommercialDocumentPhase {
  id: string;
  phase_code: string;
  phase_name: string;
  phase_description: string | null;
  percentage_fee: number | null;
  deliverables: any;
  is_included: boolean | null;
  sort_order: number | null;
}

interface CommercialDocument {
  id: string;
  title: string;
  document_number: string;
  document_type: string;
  status: string;
  phases: CommercialDocumentPhase[];
}

interface ImportPhasesFromQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  existingPhasesCount: number;
  onImport: (phases: {
    name: string;
    description?: string;
    sort_order: number;
    status: string;
    phase_code?: string;
  }[]) => Promise<void>;
}

export function ImportPhasesFromQuoteDialog({
  open,
  onOpenChange,
  projectId,
  existingPhasesCount,
  onImport,
}: ImportPhasesFromQuoteDialogProps) {
  const { activeWorkspace } = useAuth();
  const [selectedPhaseIds, setSelectedPhaseIds] = useState<Set<string>>(new Set());
  const [importMode, setImportMode] = useState<"add" | "replace">("add");
  const [isImporting, setIsImporting] = useState(false);

  // Fetch commercial documents linked to this project
  const { data: commercialDocs, isLoading } = useQuery({
    queryKey: ["project-commercial-documents", projectId],
    queryFn: async () => {
      if (!activeWorkspace) return [];

      // Fetch commercial documents for this project
      const { data: docs, error: docsError } = await supabase
        .from("commercial_documents")
        .select("id, title, document_number, document_type, status")
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .in("document_type", ["quote", "proposal"])
        .order("created_at", { ascending: false });

      if (docsError) throw docsError;
      if (!docs || docs.length === 0) return [];

      // Fetch phases for each document
      const docIds = docs.map((d) => d.id);
      const { data: phases, error: phasesError } = await supabase
        .from("commercial_document_phases")
        .select("*")
        .in("document_id", docIds)
        .order("sort_order", { ascending: true });

      if (phasesError) throw phasesError;

      // Group phases by document
      const result: CommercialDocument[] = docs.map((doc) => ({
        ...doc,
        phases: (phases || []).filter((p) => p.document_id === doc.id),
      }));

      return result.filter((doc) => doc.phases.length > 0);
    },
    enabled: open && !!activeWorkspace,
  });

  // Reset selection when dialog opens
  useEffect(() => {
    if (open && commercialDocs && commercialDocs.length > 0) {
      // Pre-select all included phases from the first document
      const firstDoc = commercialDocs[0];
      const includedPhaseIds = firstDoc.phases
        .filter((p) => p.is_included !== false)
        .map((p) => p.id);
      setSelectedPhaseIds(new Set(includedPhaseIds));
    }
  }, [open, commercialDocs]);

  const togglePhase = (phaseId: string) => {
    setSelectedPhaseIds((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const selectAllFromDoc = (doc: CommercialDocument) => {
    setSelectedPhaseIds((prev) => {
      const next = new Set(prev);
      doc.phases.forEach((p) => next.add(p.id));
      return next;
    });
  };

  const deselectAllFromDoc = (doc: CommercialDocument) => {
    setSelectedPhaseIds((prev) => {
      const next = new Set(prev);
      doc.phases.forEach((p) => next.delete(p.id));
      return next;
    });
  };

  const handleImport = async () => {
    if (selectedPhaseIds.size === 0 || !commercialDocs) return;

    setIsImporting(true);
    try {
      // Collect all selected phases from all docs
      const allPhases = commercialDocs.flatMap((doc) => doc.phases);
      const selectedPhases = allPhases
        .filter((p) => selectedPhaseIds.has(p.id))
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      // Map to project phase format
      const baseSortOrder = importMode === "replace" ? 0 : existingPhasesCount;
      const phasesToCreate = selectedPhases.map((phase, index) => ({
        name: phase.phase_name,
        description: phase.phase_description || undefined,
        sort_order: baseSortOrder + index,
        status: "pending" as const,
        phase_code: phase.phase_code,
      }));

      await onImport(phasesToCreate);
      onOpenChange(false);
    } finally {
      setIsImporting(false);
    }
  };

  const getDocTypeLabel = (type: string) => {
    switch (type) {
      case "quote":
        return "Devis";
      case "proposal":
        return "Proposition";
      default:
        return type;
    }
  };

  const hasDocuments = commercialDocs && commercialDocs.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importer les phases depuis un devis</DialogTitle>
          <DialogDescription>
            Sélectionnez les phases à importer dans votre projet.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !hasDocuments ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun devis avec des phases n'est lié à ce projet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Créez d'abord un document commercial avec des phases.
            </p>
          </div>
        ) : (
          <>
            {existingPhasesCount > 0 && (
              <div className="space-y-3 pb-2">
                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Ce projet contient déjà {existingPhasesCount} phase{existingPhasesCount > 1 ? "s" : ""}.
                  </p>
                </div>

                <RadioGroup
                  value={importMode}
                  onValueChange={(v) => setImportMode(v as "add" | "replace")}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" />
                    <Label htmlFor="add" className="text-sm cursor-pointer">
                      Ajouter aux phases existantes
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="replace" id="replace" />
                    <Label htmlFor="replace" className="text-sm cursor-pointer text-destructive">
                      Remplacer toutes les phases existantes
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <ScrollArea className="max-h-[300px] pr-4">
              <div className="space-y-4">
                {commercialDocs?.map((doc) => {
                  const selectedCount = doc.phases.filter((p) =>
                    selectedPhaseIds.has(p.id)
                  ).length;
                  const allSelected = selectedCount === doc.phases.length;

                  return (
                    <div key={doc.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{doc.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {getDocTypeLabel(doc.document_type)}
                          </Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() =>
                            allSelected
                              ? deselectAllFromDoc(doc)
                              : selectAllFromDoc(doc)
                          }
                        >
                          {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
                        </Button>
                      </div>

                      <div className="space-y-1 pl-6">
                        {doc.phases.map((phase) => {
                          const isSelected = selectedPhaseIds.has(phase.id);
                          return (
                            <div
                              key={phase.id}
                              className={cn(
                                "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                isSelected
                                  ? "bg-primary/5 border border-primary/20"
                                  : "hover:bg-muted/50"
                              )}
                              onClick={() => togglePhase(phase.id)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => togglePhase(phase.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground">
                                    {phase.phase_code}
                                  </span>
                                  <span className="text-sm font-medium truncate">
                                    {phase.phase_name}
                                  </span>
                                </div>
                                {phase.phase_description && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {phase.phase_description}
                                  </p>
                                )}
                              </div>
                              {phase.percentage_fee && (
                                <Badge variant="secondary" className="text-xs shrink-0">
                                  {phase.percentage_fee}%
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedPhaseIds.size === 0 || !hasDocuments}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Import...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importer {selectedPhaseIds.size} phase{selectedPhaseIds.size > 1 ? "s" : ""}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
