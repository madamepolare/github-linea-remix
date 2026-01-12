import { useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Tender } from "@/lib/tenderTypes";

interface TenderSynthesisHeroProps {
  tender: Tender;
  completionScore: number;
  hasAllRequiredFields: boolean;
  onDecision: (decision: 'go' | 'no_go') => void;
  onChangeDecision?: () => void;
}

export function TenderSynthesisHero({
  tender,
  completionScore,
  hasAllRequiredFields,
  onDecision,
  onChangeDecision,
}: TenderSynthesisHeroProps) {
  // Calculate deadline info
  const deadlineInfo = useMemo(() => {
    if (!tender.submission_deadline) return null;

    const deadline = new Date(tender.submission_deadline);
    const now = new Date();
    const daysLeft = differenceInDays(deadline, now);
    const hoursLeft = differenceInHours(deadline, now);

    let urgency: "critical" | "warning" | "normal" | "passed" = "normal";
    let label = "";

    if (hoursLeft < 0) {
      urgency = "passed";
      label = "Dépassé";
    } else if (daysLeft <= 1) {
      urgency = "critical";
      label = hoursLeft < 24 ? `${hoursLeft}h` : "Demain";
    } else if (daysLeft <= 7) {
      urgency = "warning";
      label = `J-${daysLeft}`;
    } else {
      label = `J-${daysLeft}`;
    }

    return { deadline, daysLeft, hoursLeft, urgency, label };
  }, [tender.submission_deadline]);

  const handleGoClick = () => {
    onDecision("go");
  };

  const handleNoGoClick = () => {
    onDecision("no_go");
  };

  const isDecided = tender.status === "go" || tender.status === "no_go";
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (completionScore / 100) * circumference;

  return (
    <Card className={cn(
      "border",
      tender.status === "go" && "border-green-300 bg-green-50/50 dark:bg-green-950/20",
      tender.status === "no_go" && "border-red-300 bg-red-50/50 dark:bg-red-950/20",
      !isDecided && "border-border"
    )}>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
          {/* Score Circle */}
          <div className="relative flex-shrink-0">
            <svg
              className="w-28 h-28 transform -rotate-90"
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted/20"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{completionScore}%</span>
              <span className="text-xs text-muted-foreground">Complétude</span>
            </div>
          </div>

          {/* Status & Countdown */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              {isDecided ? (
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium",
                  tender.status === "go" && "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200",
                  tender.status === "no_go" && "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                )}>
                  {tender.status === "go" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      GO - On répond !
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      NO-GO
                    </>
                  )}
                </div>
              ) : (
                <Badge variant="secondary" className="text-sm">
                  <Clock className="h-3.5 w-3.5 mr-1.5" />
                  En attente de décision
                </Badge>
              )}

              {deadlineInfo && (
                <Badge className={cn(
                  "text-sm",
                  deadlineInfo.urgency === "critical" && "bg-red-100 text-red-700 hover:bg-red-100",
                  deadlineInfo.urgency === "warning" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
                  deadlineInfo.urgency === "passed" && "bg-red-200 text-red-800 hover:bg-red-200",
                  deadlineInfo.urgency === "normal" && "bg-blue-100 text-blue-700 hover:bg-blue-100"
                )}>
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {deadlineInfo.label}
                </Badge>
              )}
            </div>

            {tender.submission_deadline && (
              <p className="text-sm text-muted-foreground">
                Date limite : {format(new Date(tender.submission_deadline), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
              </p>
            )}

            {tender.go_decision_notes && (
              <div className="bg-muted/50 rounded-lg p-3 text-sm mt-2">
                <p className="text-muted-foreground italic">"{tender.go_decision_notes}"</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            {!isDecided ? (
              <>
                <Button
                  size="default"
                  className="bg-green-600 hover:bg-green-700 text-white min-w-[120px]"
                  onClick={handleGoClick}
                  disabled={!hasAllRequiredFields}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  GO
                </Button>
                <Button
                  variant="outline"
                  size="default"
                  className="border-red-300 text-red-600 hover:bg-red-50 min-w-[120px]"
                  onClick={handleNoGoClick}
                  disabled={!hasAllRequiredFields}
                >
                  <ThumbsDown className="h-4 w-4 mr-2" />
                  NO-GO
                </Button>
                {!hasAllRequiredFields && (
                  <p className="text-xs text-amber-600 text-center">
                    Remplir les champs obligatoires
                  </p>
                )}
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
                onClick={onChangeDecision}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Modifier la décision
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
