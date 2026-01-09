import { useMemo } from "react";
import { format, differenceInDays, differenceInHours } from "date-fns";
import { fr } from "date-fns/locale";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Clock,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Sparkles,
  TrendingUp,
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
}

export function TenderSynthesisHero({
  tender,
  completionScore,
  hasAllRequiredFields,
  onDecision,
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
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#16a34a", "#4ade80"],
    });
    onDecision("go");
  };

  const handleNoGoClick = () => {
    onDecision("no_go");
  };

  const isDecided = tender.status === "go" || tender.status === "no_go";
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (completionScore / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={cn(
        "overflow-hidden border-2",
        tender.status === "go" && "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-950/40 dark:to-emerald-950/20",
        tender.status === "no_go" && "border-red-400 bg-gradient-to-br from-red-50 to-rose-50/50 dark:from-red-950/40 dark:to-rose-950/20",
        !isDecided && "border-primary/30 bg-gradient-to-br from-primary/5 via-background to-primary/10"
      )}>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Animated Score Circle */}
            <div className="relative flex-shrink-0">
              <svg
                className="w-32 h-32 transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-muted/20"
                />
                {/* Animated progress circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="hsl(var(--primary))" />
                    <stop offset="100%" stopColor="hsl(142 76% 36%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  className="text-3xl font-bold"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                >
                  {completionScore}%
                </motion.span>
                <span className="text-xs text-muted-foreground">Complétude</span>
              </div>
            </div>

            {/* Countdown & Status */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <div className="flex flex-col md:flex-row items-center gap-3">
                {isDecided ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full text-lg font-semibold",
                      tender.status === "go" && "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200",
                      tender.status === "no_go" && "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200"
                    )}
                  >
                    {tender.status === "go" ? (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        GO - On répond !
                      </>
                    ) : (
                      <>
                        <XCircle className="h-5 w-5" />
                        NO-GO
                      </>
                    )}
                  </motion.div>
                ) : (
                  <Badge variant="secondary" className="px-3 py-1 text-sm">
                    <Clock className="h-4 w-4 mr-1.5" />
                    En attente de décision
                  </Badge>
                )}

                {/* Deadline countdown */}
                {deadlineInfo && (
                  <motion.div
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 rounded-full font-semibold",
                      deadlineInfo.urgency === "critical" && "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
                      deadlineInfo.urgency === "warning" && "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
                      deadlineInfo.urgency === "passed" && "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200",
                      deadlineInfo.urgency === "normal" && "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    )}
                    animate={deadlineInfo.urgency === "critical" ? { scale: [1, 1.05, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Clock className="h-4 w-4" />
                    {deadlineInfo.label}
                  </motion.div>
                )}
              </div>

              {/* Deadline date */}
              {tender.submission_deadline && (
                <p className="text-sm text-muted-foreground">
                  Date limite : {format(new Date(tender.submission_deadline), "EEEE d MMMM yyyy 'à' HH:mm", { locale: fr })}
                </p>
              )}

              {/* Decision notes if decided */}
              {tender.go_decision_notes && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="bg-background/50 backdrop-blur rounded-lg p-3 text-sm"
                >
                  <p className="text-muted-foreground italic">"{tender.go_decision_notes}"</p>
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            {!isDecided && (
              <div className="flex flex-col gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-500/25 min-w-[140px]"
                    onClick={handleGoClick}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsUp className="h-5 w-5 mr-2" />
                    GO
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/50 min-w-[140px]"
                    onClick={handleNoGoClick}
                    disabled={!hasAllRequiredFields}
                  >
                    <ThumbsDown className="h-5 w-5 mr-2" />
                    NO-GO
                  </Button>
                </motion.div>
                {!hasAllRequiredFields && (
                  <p className="text-xs text-amber-600 text-center">
                    Remplir les champs obligatoires
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
