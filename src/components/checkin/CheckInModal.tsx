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
  Rocket,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  const hour = today.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const handleCheckin = async () => {
    setIsSubmitting(true);
    try {
      await checkIn.mutateAsync(notes || undefined);
      
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ["#f59e0b", "#fb923c", "#fbbf24"],
      });

      toast.success("C'est parti ! 🚀");
      setTimeout(() => closeCheckin(), 400);
    } catch (error) {
      toast.error("Erreur lors du check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isCheckinOpen) return null;

  const hasVigilance = todayData.vigilancePoints.length > 0 || todayData.yesterdayNotes;
  const totalItems = todayData.todaySchedules.length + todayData.todayEvents.length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-gradient-to-br from-amber-50/90 via-background to-orange-50/50 dark:from-amber-950/30 dark:via-background dark:to-orange-950/20"
      >
        {/* Sun rays animation */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] overflow-hidden pointer-events-none opacity-30">
          {[...Array(8)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 left-1/2 w-1 bg-gradient-to-t from-amber-400 to-transparent origin-bottom"
              style={{
                height: 200 + Math.random() * 100,
                rotate: -30 + i * 8,
              }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>

        <div className="h-full flex flex-col max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-end p-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={closeCheckin}
              className="h-9 w-9 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/30"
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
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 mb-4 shadow-lg shadow-amber-500/30"
                >
                  <Sunrise className="h-8 w-8 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-foreground">
                  {greeting}, {firstName}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {format(today, "EEEE d MMMM", { locale: fr })}
                </p>
              </motion.div>

              {/* Quick summary row */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-3 gap-3"
              >
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-primary">{todayData.todaySchedules.length}</div>
                  <div className="text-xs text-muted-foreground">tâches</div>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-blue-500">{todayData.todayEvents.length}</div>
                  <div className="text-xs text-muted-foreground">réunions</div>
                </div>
                <div className="bg-card border rounded-xl p-3 text-center">
                  <div className="text-lg font-bold text-amber-500">{todayData.pendingPostIts.length}</div>
                  <div className="text-xs text-muted-foreground">post-its</div>
                </div>
              </motion.div>

              {/* Today's agenda - compact */}
              {totalItems > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-card border rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-4 w-4 text-primary" strokeWidth={THIN_STROKE} />
                    <span className="font-medium text-sm">Aujourd'hui</span>
                  </div>
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {todayData.todaySchedules.slice(0, 4).map((schedule) => (
                      <div
                        key={schedule.id}
                        className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg bg-muted/50"
                      >
                        <div
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: schedule.task?.project?.color || "#6366f1" }}
                        />
                        <span className="truncate flex-1">{schedule.task?.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(parseISO(schedule.start_datetime), "HH:mm")}
                        </span>
                      </div>
                    ))}
                    {todayData.todayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                      >
                        <CalendarDays className="h-3 w-3 text-blue-500 shrink-0" />
                        <span className="truncate flex-1">{event.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {format(parseISO(event.start_datetime), "HH:mm")}
                        </span>
                      </div>
                    ))}
                    {(todayData.todaySchedules.length > 4 || todayData.todayEvents.length > 2) && (
                      <p className="text-xs text-muted-foreground text-center py-1">
                        +{Math.max(0, todayData.todaySchedules.length - 4) + Math.max(0, todayData.todayEvents.length - 2)} autres
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Vigilance / Post-its compact */}
              {(hasVigilance || todayData.pendingPostIts.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex gap-3"
                >
                  {hasVigilance && (
                    <div className="flex-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Vigilance</span>
                      </div>
                      {todayData.yesterdayNotes && (
                        <p className="text-xs text-orange-600 dark:text-orange-400 line-clamp-2">
                          {todayData.yesterdayNotes}
                        </p>
                      )}
                      {todayData.vigilancePoints.length > 0 && !todayData.yesterdayNotes && (
                        <p className="text-xs text-orange-600 dark:text-orange-400">
                          {todayData.vigilancePoints[0].message}
                        </p>
                      )}
                    </div>
                  )}
                  {todayData.pendingPostIts.length > 0 && (
                    <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                      <div className="flex items-center gap-1.5 mb-2">
                        <StickyNote className="h-3.5 w-3.5 text-amber-500" />
                        <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          {todayData.pendingPostIts.length} post-it{todayData.pendingPostIts.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 line-clamp-2">
                        {todayData.pendingPostIts[0]?.title}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Planning gaps info */}
              {todayData.planningGaps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.25 }}
                  className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
                >
                  <Clock className="h-3.5 w-3.5" />
                  <span>{todayData.planningGaps.length} créneau{todayData.planningGaps.length > 1 ? "x" : ""} libre{todayData.planningGaps.length > 1 ? "s" : ""} de +1h</span>
                </motion.div>
              )}

              {/* Note */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Une note pour toi ? (optionnel)"
                  className="resize-none text-sm h-16"
                />
              </motion.div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35 }}
                className="pt-2"
              >
                <Button
                  size="lg"
                  onClick={handleCheckin}
                  disabled={isSubmitting}
                  className="w-full h-12 gap-2 text-base rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                >
                  <Coffee className="h-5 w-5" />
                  C'est parti !
                  <Rocket className="h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
