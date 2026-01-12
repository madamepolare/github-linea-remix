import { useState, useMemo } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useTenders } from "@/hooks/useTenders";
import type { Tender, TenderStatus } from "@/lib/tenderTypes";

// Components
import { TenderSynthesisHero } from "@/components/tenders/synthesis/TenderSynthesisHero";
import { TenderKeyMetrics } from "@/components/tenders/synthesis/TenderKeyMetrics";
import { TenderCriteriaChart } from "@/components/tenders/synthesis/TenderCriteriaChart";
import { TenderCriticalAlerts } from "@/components/tenders/synthesis/TenderCriticalAlerts";
import { TenderInfoAccordion } from "@/components/tenders/synthesis/TenderInfoAccordion";

interface TenderSyntheseTabProps {
  tender: Tender;
  onNavigateToTab: (tab: string) => void;
}

// Required fields for Go/No-Go decision
const REQUIRED_FIELDS = [
  "client_name",
  "procedure_type",
  "location",
  "estimated_budget",
  "submission_deadline",
  "description",
] as const;

export function TenderSyntheseTab({ tender, onNavigateToTab }: TenderSyntheseTabProps) {
  const { updateStatus } = useTenders();
  const [showGoDialog, setShowGoDialog] = useState(false);
  const [goDecisionNotes, setGoDecisionNotes] = useState("");
  const [pendingDecision, setPendingDecision] = useState<"go" | "no_go" | null>(null);
  const [isChangingDecision, setIsChangingDecision] = useState(false);

  // Calculate completion score
  const { completionScore, hasAllRequiredFields } = useMemo(() => {
    let filled = 0;
    REQUIRED_FIELDS.forEach((field) => {
      const value = tender[field as keyof Tender];
      if (value && (typeof value !== "string" || value.trim() !== "")) {
        filled++;
      }
    });
    const score = Math.round((filled / REQUIRED_FIELDS.length) * 100);
    return {
      completionScore: score,
      hasAllRequiredFields: filled === REQUIRED_FIELDS.length,
    };
  }, [tender]);

  // Handle Go/No-Go decision
  const handleDecision = (decision: "go" | "no_go") => {
    setPendingDecision(decision);
    setShowGoDialog(true);
  };

  // Handle changing an existing decision
  const handleChangeDecision = () => {
    setIsChangingDecision(true);
    setGoDecisionNotes(tender.go_decision_notes || "");
    setShowGoDialog(true);
    setPendingDecision(null);
  };

  const confirmDecision = () => {
    if (pendingDecision) {
      updateStatus.mutate({
        id: tender.id,
        status: pendingDecision as TenderStatus,
        notes: goDecisionNotes,
      });
      setShowGoDialog(false);
      setPendingDecision(null);
      setGoDecisionNotes("");
      setIsChangingDecision(false);
    }
  };

  const handleDialogClose = () => {
    setShowGoDialog(false);
    setPendingDecision(null);
    setGoDecisionNotes("");
    setIsChangingDecision(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Score, Countdown, and Decision */}
      <TenderSynthesisHero
        tender={tender}
        completionScore={completionScore}
        hasAllRequiredFields={hasAllRequiredFields}
        onDecision={handleDecision}
        onChangeDecision={handleChangeDecision}
      />

      {/* Key Metrics Cards */}
      <TenderKeyMetrics tender={tender} />

      {/* Critical Alerts */}
      <TenderCriticalAlerts tender={tender} />

      {/* Criteria Chart */}
      <TenderCriteriaChart tenderId={tender.id} />

      {/* Info Accordion */}
      <TenderInfoAccordion tender={tender} onNavigateToTab={onNavigateToTab} />

      {/* Go/No-Go Decision Dialog */}
      <Dialog open={showGoDialog} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isChangingDecision ? (
                "Modifier la décision Go/No-Go"
              ) : pendingDecision === "go" ? (
                <>
                  <ThumbsUp className="h-5 w-5 text-green-600" />
                  Confirmer la décision Go
                </>
              ) : (
                <>
                  <ThumbsDown className="h-5 w-5 text-red-600" />
                  Confirmer la décision No-Go
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {isChangingDecision
                ? "Choisissez une nouvelle décision pour ce concours."
                : pendingDecision === "go"
                ? "Vous confirmez vouloir répondre à ce concours. L'équipe sera notifiée."
                : "Vous confirmez ne pas répondre à ce concours. Vous pouvez indiquer la raison ci-dessous."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {isChangingDecision && (
              <div className="flex gap-3">
                <Button
                  variant={pendingDecision === "go" ? "default" : "outline"}
                  className={pendingDecision === "go" ? "bg-green-600 hover:bg-green-700 flex-1" : "flex-1"}
                  onClick={() => setPendingDecision("go")}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  GO
                </Button>
                <Button
                  variant={pendingDecision === "no_go" ? "default" : "outline"}
                  className={pendingDecision === "no_go" ? "bg-red-600 hover:bg-red-700 flex-1" : "flex-1"}
                  onClick={() => setPendingDecision("no_go")}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  NO-GO
                </Button>
              </div>
            )}
            <div className="space-y-2">
              <Label>Notes (optionnel)</Label>
              <Textarea
                value={goDecisionNotes}
                onChange={(e) => setGoDecisionNotes(e.target.value)}
                placeholder={
                  pendingDecision === "go"
                    ? "Points clés de la décision, objectifs..."
                    : "Raison du refus, pour mémoire..."
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogClose}>
              Annuler
            </Button>
            <Button
              onClick={confirmDecision}
              disabled={!pendingDecision}
              className={
                pendingDecision === "go"
                  ? "bg-green-600 hover:bg-green-700"
                  : pendingDecision === "no_go"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
