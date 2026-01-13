import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Check, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useTaskSchedules, TaskSchedule } from "@/hooks/useTaskSchedules";
import { toast } from "sonner";
import { format, parseISO, differenceInMinutes } from "date-fns";
import { THIN_STROKE } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface QuickTimeEntryProps {
  onEntryAdded?: () => void;
}

interface TimeEntryDraft {
  id: string;
  projectId: string;
  taskId: string | null;
  hours: string;
  description: string;
  fromSchedule?: boolean;
}

export function QuickTimeEntry({ onEntryAdded }: QuickTimeEntryProps) {
  const { activeWorkspace, user } = useAuth();
  const createTimeEntry = useCreateTimeEntry();
  const today = format(new Date(), "yyyy-MM-dd");
  
  // Fetch today's schedules
  const { schedules: todaySchedules } = useTaskSchedules({
    userId: user?.id,
    startDate: `${today}T00:00:00`,
    endDate: `${today}T23:59:59`,
  });
  
  const [entries, setEntries] = useState<TimeEntryDraft[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    projectId: "",
    taskId: "",
    hours: "",
    description: "",
  });

  // Pre-populate entries from scheduled tasks
  useEffect(() => {
    if (todaySchedules && todaySchedules.length > 0 && entries.length === 0) {
      const scheduledEntries: TimeEntryDraft[] = todaySchedules.map((schedule) => {
        const start = parseISO(schedule.start_datetime);
        const end = parseISO(schedule.end_datetime);
        const durationHours = Math.round((differenceInMinutes(end, start) / 60) * 10) / 10;
        
        return {
          id: `schedule-${schedule.id}`,
          projectId: schedule.task?.project?.id || "",
          taskId: schedule.task_id,
          hours: durationHours.toString(),
          description: schedule.work_description || schedule.task?.title || "",
          fromSchedule: true,
        };
      });
      setEntries(scheduledEntries);
    }
  }, [todaySchedules]);

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects-for-time", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, color")
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  // Fetch tasks for selected project
  const { data: tasks } = useQuery({
    queryKey: ["tasks-for-time", activeWorkspace?.id, newEntry.projectId],
    queryFn: async () => {
      if (!activeWorkspace?.id || !newEntry.projectId) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title")
        .eq("workspace_id", activeWorkspace.id)
        .eq("project_id", newEntry.projectId)
        .neq("status", "done")
        .order("title");
      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id && !!newEntry.projectId,
  });

  const handleAddEntry = () => {
    if (!newEntry.projectId || !newEntry.hours) {
      toast.error("Sélectionne un projet et une durée");
      return;
    }

    const hours = parseFloat(newEntry.hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Durée invalide");
      return;
    }

    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        projectId: newEntry.projectId,
        taskId: newEntry.taskId || null,
        hours: newEntry.hours,
        description: newEntry.description,
      },
    ]);

    setNewEntry({ projectId: "", taskId: "", hours: "", description: "" });
    setShowForm(false);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleUpdateEntryHours = (id: string, hours: string) => {
    setEntries(entries.map((e) => (e.id === id ? { ...e, hours } : e)));
  };

  const handleSaveAll = async () => {
    const validEntries = entries.filter((e) => e.projectId && parseFloat(e.hours) > 0);
    
    if (validEntries.length === 0) {
      toast.error("Ajoute au moins une entrée valide");
      return;
    }

    try {
      for (const entry of validEntries) {
        const hours = parseFloat(entry.hours);
        await createTimeEntry.mutateAsync({
          project_id: entry.projectId,
          task_id: entry.taskId || null,
          description: entry.description || null,
          duration_minutes: Math.round(hours * 60),
          date: today,
          is_billable: true,
          status: "draft",
        });
      }

      toast.success(`${validEntries.length} entrée(s) enregistrée(s)`);
      setEntries([]);
      onEntryAdded?.();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const totalHours = entries.reduce(
    (sum, e) => sum + (parseFloat(e.hours) || 0),
    0
  );

  const getProjectName = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.name || "Projet";
  };

  const getProjectColor = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.color || "#6366f1";
  };

  const getTaskName = (entry: TimeEntryDraft) => {
    // Try from schedules first
    if (entry.fromSchedule && todaySchedules) {
      const schedule = todaySchedules.find((s) => `schedule-${s.id}` === entry.id);
      if (schedule?.task?.title) return schedule.task.title;
    }
    return entry.description || null;
  };

  return (
    <div className="space-y-4">
      {/* Scheduled tasks indicator */}
      {entries.some((e) => e.fromSchedule) && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" strokeWidth={THIN_STROKE} />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Pré-rempli avec tes tâches planifiées du jour. Ajuste les durées si besoin.
          </p>
        </div>
      )}

      {/* Entries list */}
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg",
              entry.fromSchedule
                ? "bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800"
                : "bg-muted/50"
            )}
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getProjectColor(entry.projectId) }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {getProjectName(entry.projectId)}
              </p>
              {getTaskName(entry) && (
                <p className="text-xs text-muted-foreground truncate">
                  {getTaskName(entry)}
                </p>
              )}
              {entry.fromSchedule && (
                <Badge variant="outline" className="text-[10px] mt-1 text-blue-600 border-blue-200">
                  Planifié
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="12"
                value={entry.hours}
                onChange={(e) => handleUpdateEntryHours(entry.id, e.target.value)}
                className="w-16 h-8 text-center text-sm"
              />
              <span className="text-sm text-muted-foreground">h</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => handleRemoveEntry(entry.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 rounded-xl border border-border bg-card"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Projet</Label>
                <Select
                  value={newEntry.projectId}
                  onValueChange={(v) =>
                    setNewEntry({ ...newEntry, projectId: v, taskId: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Durée (heures)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  placeholder="2"
                  value={newEntry.hours}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, hours: e.target.value })
                  }
                />
              </div>
            </div>

            {/* Task selection */}
            {newEntry.projectId && tasks && tasks.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Tâche (optionnel)</Label>
                <Select
                  value={newEntry.taskId}
                  onValueChange={(v) => setNewEntry({ ...newEntry, taskId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Aucune tâche spécifique" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Aucune tâche spécifique</SelectItem>
                    {tasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        {task.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optionnel)</Label>
              <Input
                placeholder="Ce que tu as fait..."
                value={newEntry.description}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, description: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button size="sm" className="flex-1" onClick={handleAddEntry}>
                <Check className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showForm && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter une entrée manuelle
        </Button>
      )}

      {/* Total and save */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={THIN_STROKE} />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Total : {Math.round(totalHours * 10) / 10}h
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={createTimeEntry.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Enregistrer tout
          </Button>
        </motion.div>
      )}
    </div>
  );
}
