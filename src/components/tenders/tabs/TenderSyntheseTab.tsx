import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Sparkles, MessageSquare } from "lucide-react";
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
import { TenderAskDCEDialog } from "@/components/tenders/synthesis/TenderAskDCEDialog";

import { ThumbsUp, ThumbsDown } from "lucide-react";

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
  const [showAskDCE, setShowAskDCE] = useState(false);

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
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section with Score, Countdown, and Decision */}
      <TenderSynthesisHero
        tender={tender}
        completionScore={completionScore}
        hasAllRequiredFields={hasAllRequiredFields}
        onDecision={handleDecision}
      />

      {/* Key Metrics Cards */}
      <TenderKeyMetrics tender={tender} />

      {/* Critical Alerts */}
      <TenderCriticalAlerts tender={tender} />

      {/* Criteria Chart */}
      <TenderCriteriaChart tenderId={tender.id} />

      {/* Info Accordion */}
      <TenderInfoAccordion tender={tender} onNavigateToTab={onNavigateToTab} />

      {/* Floating Ask DCE Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          className="rounded-full shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 gap-2 px-6"
          onClick={() => setShowAskDCE(true)}
        >
          <Sparkles className="h-5 w-5" />
          Question au DCE
        </Button>
      </motion.div>

      {/* Ask DCE Dialog */}
      <TenderAskDCEDialog
        tenderId={tender.id}
        open={showAskDCE}
        onOpenChange={setShowAskDCE}
      />

      {/* Go/No-Go Decision Dialog */}
      <Dialog open={showGoDialog} onOpenChange={setShowGoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingDecision === "go" ? (
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
              {pendingDecision === "go"
                ? "Vous confirmez vouloir répondre à ce concours. L'équipe sera notifiée."
                : "Vous confirmez ne pas répondre à ce concours. Vous pouvez indiquer la raison ci-dessous."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
            <Button variant="outline" onClick={() => setShowGoDialog(false)}>
              Annuler
            </Button>
            <Button
              onClick={confirmDecision}
              className={
                pendingDecision === "go"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
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
