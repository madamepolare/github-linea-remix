import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Moon,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useTodayData } from "@/hooks/useTodayData";
import { useUserCheckins } from "@/hooks/useUserCheckins";
import { useCheckinStore } from "@/hooks/useCheckinStore";
import { useAuth } from "@/contexts/AuthContext";
import { usePostItTasks } from "@/hooks/usePostItTasks";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { DayQualityVote } from "./DayQualityVote";
import { QuickTimeEntry } from "./QuickTimeEntry";
import { useQueryClient } from "@tanstack/react-query";

const RECOMMENDED_HOURS = 7;

export function CheckOutModal() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { isCheckoutOpen, closeCheckout } = useCheckinStore();
  const { checkOut } = useUserCheckins();
  const { createQuickTask } = usePostItTasks();
  const todayData = useTodayData();
  
  const [dayQuality, setDayQuality] = useState<number | null>(null);
  const [tomorrowNotes, setTomorrowNotes] = useState("");
  const [createPostIt, setCreatePostIt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || "Vous";

  const handleTimeAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["team-time-entries"] });
  };

  const stats = useMemo(() => {
    const completedTasks = todayData.todaySchedules.filter(
      (s) => s.task?.status === "done"
    ).length;
    const totalTasks = todayData.todaySchedules.length;
    const timeLoggedHours = Math.round((todayData.totalTimeLoggedMinutes / 60) * 10) / 10;
    const recommendedMinutes = RECOMMENDED_HOURS * 60;
    const missingMinutes = Math.max(0, recommendedMinutes - todayData.totalTimeLoggedMinutes);
    const hasTimeWarning = todayData.totalTimeLoggedMinutes < recommendedMinutes;

    return {
      completedTasks,
      totalTasks,
      timeLoggedHours,
      missingMinutes,
      hasTimeWarning,
    };
  }, [todayData]);

  const canCheckout = dayQuality !== null;

  const handleCheckout = async () => {
    if (!dayQuality) {
      toast.error("Note ta journée pour continuer");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create post-it if checked and notes exist
      if (createPostIt && tomorrowNotes.trim()) {
        await createQuickTask.mutateAsync({ title: tomorrowNotes.trim() });
      }
      
      await checkOut.mutateAsync({
        day_quality: dayQuality,
        tomorrow_notes: tomorrowNotes || undefined,
        time_entries_validated: true,
      });

      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.7 },
        colors: ["#8b5cf6", "#a78bfa", "#c4b5fd"],
      });

      toast.success("Bonne soirée ! 🌙");
      setTimeout(() => closeCheckout(), 400);
    } catch (error) {
      toast.error("Erreur lors du check-out");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCheckoutOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-violet-50/90 via-background to-purple-50/50 dark:from-violet-950/30 dark:via-background dark:to-purple-950/20"
      >
        {/* Stars animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0.2, 0.7, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            >
              <Star className="h-2 w-2 text-purple-400/50 fill-purple-400/30" />
            </motion.div>
          ))}
        </div>

        <div className="h-full flex flex-col max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCheckout}
              className="h-9 w-9 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/30"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            <div className="space-y-5">
              {/* Welcome */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center pt-2 pb-4"
              >
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 mb-4 shadow-lg shadow-purple-500/30"
                >
                  <Moon className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                  Fin de journée, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Bravo pour le travail accompli
                </p>
              </motion.div>

              {/* Quick stats */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
              >
                <div className="bg-card border rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedTasks}/{stats.totalTasks}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">tâches terminées</div>
                </div>
                <div className={cn(
                  "bg-card border rounded-xl p-4 text-center",
                  stats.hasTimeWarning && "border-amber-300 dark:border-amber-700"
                )}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Clock className={cn("h-4 w-4", stats.hasTimeWarning ? "text-amber-500" : "text-blue-500")} />
                    <span className={cn(
                      "text-xl font-bold",
                      stats.hasTimeWarning ? "text-amber-600 dark:text-amber-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                      {stats.timeLoggedHours}h
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stats.hasTimeWarning ? `/ ${RECOMMENDED_HOURS}h recommandées` : "temps saisi"}
                  </div>
                </div>
              </motion.div>

              {/* Quick Time Entry */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className={cn(
                  "bg-card border rounded-xl overflow-hidden",
                  stats.hasTimeWarning ? "border-amber-300 dark:border-amber-700" : ""
                )}
              >
                <button
                  onClick={() => setShowQuickEntry(!showQuickEntry)}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Zap className={cn(
                      "h-4 w-4",
                      stats.hasTimeWarning ? "text-amber-500" : "text-blue-500"
                    )} />
                    <span className="font-medium text-sm">
                      {stats.hasTimeWarning 
                        ? `Compléter les temps (${Math.floor(stats.missingMinutes / 60)}h manquantes)`
                        : "Saisie rapide des temps"
                      }
                    </span>
                  </div>
                  {showQuickEntry ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {showQuickEntry && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t"
                    >
                      <div className="p-4">
                        <QuickTimeEntry onEntryAdded={handleTimeAdded} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Day quality - compact */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-purple-500" strokeWidth={THIN_STROKE} />
                  <span className="font-medium text-sm">Comment était ta journée ?</span>
                </div>
                <DayQualityVote value={dayQuality} onChange={setDayQuality} />
              </motion.div>

              {/* Tomorrow notes */}
              {/* Tomorrow notes with post-it option */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="space-y-2"
              >
                <Textarea
                  value={tomorrowNotes}
                  onChange={(e) => setTomorrowNotes(e.target.value)}
                  placeholder="Une note pour demain ? (optionnel)"
                  className="resize-none text-sm h-16"
                />
                {tomorrowNotes.trim() && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={createPostIt}
                      onCheckedChange={(checked) => setCreatePostIt(checked as boolean)}
                      className="h-4 w-4"
                    />
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <StickyNote className="h-3 w-3 text-amber-500" />
                      Créer un post-it avec cette note
                    </span>
                  </label>
                )}
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="pt-2"
              >
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!canCheckout || isSubmitting}
                  className={cn(
                    "w-full h-12 gap-2 text-base rounded-xl transition-all",
                    canCheckout
                      ? "bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 shadow-lg shadow-purple-500/25"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Moon className="h-5 w-5" />
                  Bonne soirée !
                  <Sparkles className="h-5 w-5" />
                </Button>
                {!canCheckout && (
                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Note ta journée pour continuer
                  </p>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
