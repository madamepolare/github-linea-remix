import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sunrise,
  CheckCircle2,
  CalendarDays,
  StickyNote,
  AlertTriangle,
  Clock,
  CalendarPlus,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { THIN_STROKE } from "@/components/ui/icon";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useTodayData } from "@/hooks/useTodayData";
import { useUserCheckins } from "@/hooks/useUserCheckins";
import { useCheckinStore } from "@/hooks/useCheckinStore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";

export function CheckInModal() {
  const { profile } = useAuth();
  const { isCheckinOpen, closeCheckin } = useCheckinStore();
  const { checkIn, yesterdayCheckin } = useUserCheckins();
  const todayData = useTodayData(yesterdayCheckin?.tomorrow_notes);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const firstName = profile?.full_name?.split(" ")[0] || "Vous";
  const today = new Date();

  const handleCheckin = async () => {
    setIsSubmitting(true);
    try {
      await checkIn.mutateAsync(notes || undefined);
      
      // Confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
      });

      toast.success("C'est parti pour une super journée ! 🚀");
      setTimeout(() => closeCheckin(), 500);
    } catch (error) {
      toast.error("Erreur lors du check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMeetingScheduler = () => {
    window.dispatchEvent(new CustomEvent("open-event-scheduler"));
  };

  if (!isCheckinOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-background via-background to-primary/5"
      >
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full bg-primary/10"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * -100],
                opacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
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
              onClick={closeCheckin}
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
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sunrise className="h-12 w-12 text-amber-500" />
                  </motion.div>
                </div>
                <h1 className="text-4xl font-bold">
                  Bonjour, {firstName} !
                </h1>
                <p className="text-xl text-muted-foreground">
                  {format(today, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </motion.div>

              {/* Today's tasks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border border-border rounded-2xl p-6 shadow-lg"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="h-5 w-5 text-primary" strokeWidth={THIN_STROKE} />
                  <h2 className="font-semibold text-lg">Ta journée aujourd'hui</h2>
                  {todayData.todaySchedules.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {todayData.todaySchedules.length} tâche{todayData.todaySchedules.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {todayData.todaySchedules.length > 0 ? (
                  <div className="space-y-2">
                    {todayData.todaySchedules.map((schedule, i) => (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{
                            backgroundColor: schedule.task?.project?.color || "#6366f1",
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{schedule.task?.title || "Tâche"}</p>
                          {schedule.task?.project && (
                            <p className="text-xs text-muted-foreground truncate">
                              {schedule.task.project.name}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground shrink-0">
                          {format(parseISO(schedule.start_datetime), "HH:mm")} -{" "}
                          {format(parseISO(schedule.end_datetime), "HH:mm")}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    Aucune tâche planifiée pour aujourd'hui
                  </p>
                )}

                {/* Planning gaps */}
                {todayData.planningGaps.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {todayData.planningGaps.length} trou{todayData.planningGaps.length > 1 ? "s" : ""} de planning (&gt;1h)
                    </p>
                  </div>
                )}
              </motion.div>

              {/* Events */}
              {todayData.todayEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarDays className="h-5 w-5 text-blue-500" strokeWidth={THIN_STROKE} />
                    <h2 className="font-semibold text-lg">Réunions et events</h2>
                  </div>
                  <div className="space-y-2">
                    {todayData.todayEvents.map((event, i) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="text-lg">
                          {event.source === "project" ? "📅" : "🎯"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{event.title}</p>
                          {event.location && (
                            <p className="text-xs text-muted-foreground truncate">
                              {event.location}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground shrink-0">
                          {format(parseISO(event.start_datetime), "HH:mm")}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Post-its */}
              {todayData.pendingPostIts.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <StickyNote className="h-5 w-5 text-amber-500" strokeWidth={THIN_STROKE} />
                    <h2 className="font-semibold text-lg">Post-its en attente</h2>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {todayData.pendingPostIts.length}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {todayData.pendingPostIts.slice(0, 5).map((postIt, i) => (
                      <motion.div
                        key={postIt.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20"
                      >
                        <span className="text-amber-600 dark:text-amber-400">•</span>
                        <p className="text-sm">{postIt.title}</p>
                      </motion.div>
                    ))}
                    {todayData.pendingPostIts.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        +{todayData.pendingPostIts.length - 5} autres
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Vigilance points */}
              {(todayData.vigilancePoints.length > 0 || todayData.yesterdayNotes) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card border border-orange-200 dark:border-orange-800 rounded-2xl p-6 shadow-lg"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="h-5 w-5 text-orange-500" strokeWidth={THIN_STROKE} />
                    <h2 className="font-semibold text-lg">Points de vigilance</h2>
                  </div>
                  <div className="space-y-2">
                    {todayData.yesterdayNotes && (
                      <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-sm">
                        <p className="text-xs text-orange-600 dark:text-orange-400 mb-1">Note d'hier :</p>
                        <p>{todayData.yesterdayNotes}</p>
                      </div>
                    )}
                    {todayData.vigilancePoints.map((point, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.05 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg",
                          point.severity === "critical"
                            ? "bg-red-50 dark:bg-red-900/20"
                            : "bg-orange-50 dark:bg-orange-900/20"
                        )}
                      >
                        <span className={cn(
                          point.severity === "critical" ? "text-red-500" : "text-orange-500"
                        )}>
                          ⚠️
                        </span>
                        <p className="text-sm">{point.message}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex justify-center"
              >
                <Button
                  variant="outline"
                  onClick={handleOpenMeetingScheduler}
                  className="gap-2"
                >
                  <CalendarPlus className="h-4 w-4" strokeWidth={THIN_STROKE} />
                  Proposer une réunion
                </Button>
              </motion.div>

              {/* Notes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <label className="text-sm text-muted-foreground">
                  Une note pour toi ? (optionnel)
                </label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Objectifs du jour, rappels..."
                  className="resize-none"
                  rows={2}
                />
              </motion.div>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="flex justify-center pt-4"
              >
                <Button
                  size="lg"
                  onClick={handleCheckin}
                  disabled={isSubmitting}
                  className="gap-3 h-14 px-10 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                >
                  <Rocket className="h-5 w-5" />
                  C'est parti !
                  <Sparkles className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
