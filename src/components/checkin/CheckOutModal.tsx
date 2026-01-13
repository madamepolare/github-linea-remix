import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Moon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ListChecks,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { useTodayData } from "@/hooks/useTodayData";
import { useUserCheckins } from "@/hooks/useUserCheckins";
import { useCheckinStore } from "@/hooks/useCheckinStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { DayQualityVote } from "./DayQualityVote";
import { QuickTimeEntry } from "./QuickTimeEntry";
import { useQueryClient } from "@tanstack/react-query";

// Recommended hours - warning only, not blocking
const RECOMMENDED_HOURS = 7;

export function CheckOutModal() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { isCheckoutOpen, closeCheckout } = useCheckinStore();
  const { checkOut } = useUserCheckins();
  const todayData = useTodayData();
  
  const [dayQuality, setDayQuality] = useState<number | null>(null);
  const [tomorrowNotes, setTomorrowNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuickEntry, setShowQuickEntry] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || "Vous";

  // Refetch time entries after adding
  const handleTimeAdded = () => {
    queryClient.invalidateQueries({ queryKey: ["team-time-entries"] });
  };

  // Calculate stats
  const stats = useMemo(() => {
    const completedTasks = todayData.todaySchedules.filter(
      (s) => s.task?.status === "done"
    ).length;
    const totalTasks = todayData.todaySchedules.length;
    const totalEvents = todayData.todayEvents.length;
    const timeLoggedHours = Math.round((todayData.totalTimeLoggedMinutes / 60) * 10) / 10;
    const recommendedMinutes = RECOMMENDED_HOURS * 60;
    const timeProgress = Math.min((todayData.totalTimeLoggedMinutes / recommendedMinutes) * 100, 100);
    const missingMinutes = Math.max(0, recommendedMinutes - todayData.totalTimeLoggedMinutes);
    
    // Warning if less than recommended, but never blocking
    const hasTimeWarning = todayData.totalTimeLoggedMinutes < recommendedMinutes;

    return {
      completedTasks,
      totalTasks,
      totalEvents,
      timeLoggedHours,
      timeProgress,
      missingMinutes,
      hasTimeWarning,
    };
  }, [todayData]);

  // Can checkout if day quality is set (time is just a warning, not blocking)
  const canCheckout = dayQuality !== null;

  const handleCheckout = async () => {
    if (!dayQuality) {
      toast.error("Veuillez noter votre journée");
      return;
    }

    setIsSubmitting(true);
    try {
      await checkOut.mutateAsync({
        day_quality: dayQuality,
        tomorrow_notes: tomorrowNotes || undefined,
        time_entries_validated: true,
      });

      // Celebration confetti!
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ["#8b5cf6", "#ec4899", "#f59e0b", "#10b981"],
      });

      toast.success("Bonne soirée ! À demain 🌙");
      setTimeout(() => closeCheckout(), 500);
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
        className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-purple-500/5"
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-purple-400/30"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 800),
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6">
            <div />
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCheckout}
              className="h-10 w-10 rounded-full"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 px-6">
            <div className="max-w-3xl mx-auto pb-8 space-y-8">
              {/* Welcome header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center space-y-2"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <motion.div
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Moon className="h-12 w-12 text-purple-500" />
                  </motion.div>
                </div>
                <h1 className="text-4xl font-bold">
                  Fin de journée, {firstName}
                </h1>
                <p className="text-xl text-muted-foreground">
                  Tu as travaillé sur {stats.totalTasks} tâche{stats.totalTasks > 1 ? "s" : ""} aujourd'hui
                </p>
              </motion.div>

              {/* Day recap */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ListChecks className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
                  <h2 className="font-semibold text-lg">Récapitulatif du jour</h2>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-xl bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stats.completedTasks}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      tâche{stats.completedTasks > 1 ? "s" : ""} terminée{stats.completedTasks > 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.timeLoggedHours}h
                    </p>
                    <p className="text-xs text-muted-foreground">temps saisi</p>
                  </div>

                  <div className="text-center p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CalendarCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {stats.totalEvents}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      réunion{stats.totalEvents > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Quick Time Entry - Always visible for easy access */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                  "bg-card border rounded-2xl p-6 shadow-lg",
                  stats.hasTimeWarning ? "border-amber-300 dark:border-amber-700" : "border-border"
                )}
              >
                <button
                  onClick={() => setShowQuickEntry(!showQuickEntry)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Clock className={cn(
                      "h-5 w-5",
                      stats.hasTimeWarning ? "text-amber-500" : "text-blue-500"
                    )} strokeWidth={THIN_STROKE} />
                    <h2 className="font-semibold text-lg">Saisie rapide des temps</h2>
                    {stats.hasTimeWarning && (
                      <span className="text-xs bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                        {stats.timeLoggedHours}h / {RECOMMENDED_HOURS}h
                      </span>
                    )}
                  </div>
                  {showQuickEntry ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </button>

                <AnimatePresence>
                  {showQuickEntry && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4">
                        <QuickTimeEntry onEntryAdded={handleTimeAdded} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {!showQuickEntry && (
                  <p className={cn(
                    "text-sm mt-2",
                    stats.hasTimeWarning ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                  )}>
                    {stats.hasTimeWarning 
                      ? `Il manque ~${Math.floor(stats.missingMinutes / 60)}h. Clique pour compléter.`
                      : "Clique pour ajouter rapidement tes temps de la journée"
                    }
                  </p>
                )}
              </motion.div>

              {/* Day quality vote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles className="h-5 w-5 text-purple-500" strokeWidth={THIN_STROKE} />
                  <h2 className="font-semibold text-lg">Comment était ta journée ?</h2>
                </div>

                <DayQualityVote value={dayQuality} onChange={setDayQuality} />

                {!dayQuality && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Choisis une émotion pour continuer
                  </p>
                )}
              </motion.div>

              {/* Tomorrow notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="space-y-2"
              >
                <label className="text-sm text-muted-foreground">
                  Une note pour demain ? (optionnel)
                </label>
                <Textarea
                  value={tomorrowNotes}
                  onChange={(e) => setTomorrowNotes(e.target.value)}
                  placeholder="Ce que tu dois absolument penser à faire demain..."
                  className="resize-none"
                  rows={2}
                />
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleCheckout}
                  disabled={!canCheckout || isSubmitting}
                  className={cn(
                    "gap-3 h-14 px-10 text-lg rounded-full transition-all",
                    canCheckout
                      ? "shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30"
                      : "opacity-50"
                  )}
                >
                  <Moon className="h-5 w-5" />
                  Bonne soirée !
                  <Sparkles className="h-5 w-5" />
                </Button>
              </motion.div>

              {!canCheckout && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-muted-foreground"
                >
                  Note ta journée pour continuer
                </motion.p>
              )}
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
