import { useEffect, useRef } from "react";
import { useTimeTrackerStore } from "@/hooks/useTimeTrackerStore";
import { useCreateTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  X,
  Minimize2,
  Maximize2,
  Clock,
  GripHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export function GlobalTimeTracker() {
  const {
    isOpen,
    isMinimized,
    isRunning,
    elapsedSeconds,
    projectId,
    projectName,
    description,
    openTracker,
    closeTracker,
    toggleMinimize,
    startTimer,
    stopTimer,
    tick,
    setDescription,
    setProject,
    reset,
  } = useTimeTrackerStore();

  const { projects } = useProjects();
  const createEntry = useCreateTimeEntry();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer interval
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, tick]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStop = async () => {
    stopTimer();

    if (elapsedSeconds >= 60) {
      const minutes = Math.round(elapsedSeconds / 60);
      // Check if selected project is internal (non-billable)
      const selectedProject = projects?.find(p => p.id === projectId);
      const isBillable = selectedProject ? !selectedProject.is_internal : true;
      
      try {
        await createEntry.mutateAsync({
          duration_minutes: minutes,
          date: format(new Date(), "yyyy-MM-dd"),
          description: description || "Temps enregistré",
          project_id: projectId,
          status: "draft",
          is_billable: isBillable,
        });
        toast.success(
          `${Math.floor(minutes / 60)}h${minutes % 60}min enregistrées`
        );
        reset();
      } catch (error) {
        toast.error("Erreur lors de l'enregistrement");
      }
    } else {
      toast.info("Temps trop court pour être enregistré (< 1 min)");
      reset();
    }
  };

  const handleClose = () => {
    if (isRunning) {
      toggleMinimize();
    } else {
      closeTracker();
      reset();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.9 }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{ opacity: 0, y: 100, scale: 0.9 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className={cn(
          "fixed z-50 shadow-2xl",
          isMinimized
            ? "bottom-4 right-4"
            : "bottom-4 right-4 md:bottom-6 md:right-6"
        )}
      >
        <Card
          className={cn(
            "overflow-hidden border-2",
            isRunning ? "border-primary" : "border-border",
            isMinimized ? "w-auto" : "w-[340px]"
          )}
        >
          {/* Minimized view */}
          {isMinimized ? (
            <motion.div
              className="flex items-center gap-3 p-3 cursor-pointer"
              onClick={() => toggleMinimize()}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isRunning ? "bg-primary animate-pulse" : "bg-muted"
                )}
              />
              <span
                className={cn(
                  "font-mono text-lg tabular-nums font-medium",
                  isRunning && "text-primary"
                )}
              >
                {formatTime(elapsedSeconds)}
              </span>
              <Maximize2 className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          ) : (
            /* Expanded view */
            <div className="flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
                <div className="flex items-center gap-2">
                  <GripHorizontal className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    Time Tracker
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => toggleMinimize()}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={handleClose}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Timer Display */}
              <div className="px-4 py-6 text-center">
                <p
                  className={cn(
                    "text-5xl font-mono tabular-nums font-semibold transition-colors",
                    isRunning && "text-primary"
                  )}
                >
                  {formatTime(elapsedSeconds)}
                </p>
                {projectName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {projectName}
                  </p>
                )}
              </div>

              {/* Controls */}
              <div className="px-4 pb-4 space-y-3">
                {/* Project selector */}
                <Select
                  value={projectId || "none"}
                  onValueChange={(v) => {
                    const proj = projects?.find((p) => p.id === v);
                    setProject(
                      v === "none" ? null : v,
                      proj?.name || null
                    );
                  }}
                  disabled={isRunning}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun projet</SelectItem>
                    {/* Internal projects first */}
                    {projects?.filter(p => p.is_internal).length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground">Internes (non-facturable)</SelectLabel>
                        {projects?.filter(p => p.is_internal).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {/* Client projects */}
                    {projects?.filter(p => !p.is_internal).length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs text-muted-foreground">Projets clients</SelectLabel>
                        {projects?.filter(p => !p.is_internal).map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>

                {/* Description */}
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optionnel)"
                  className="h-9"
                  disabled={isRunning}
                />

                {/* Action buttons */}
                <div className="flex gap-2">
                  {!isRunning ? (
                    <Button
                      className="flex-1 gap-2"
                      onClick={startTimer}
                    >
                      <Play className="h-4 w-4" />
                      Démarrer
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      className="flex-1 gap-2"
                      onClick={handleStop}
                    >
                      <Pause className="h-4 w-4" />
                      Arrêter
                    </Button>
                  )}
                </div>

                {isRunning && (
                  <p className="text-xs text-center text-muted-foreground">
                    Le temps sera enregistré à l'arrêt
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}
