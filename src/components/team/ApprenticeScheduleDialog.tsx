import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { GraduationCap, Calendar, Building, School } from "lucide-react";

interface ApprenticeSchedule {
  id: string;
  user_id: string;
  workspace_id: string;
  schedule_name: string;
  start_date: string;
  end_date: string;
  pattern_type: string;
  company_days_per_week: number | null;
  school_days_per_week: number | null;
  custom_pattern: { school_days?: string[] } | null;
}

interface ApprenticeScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userName: string;
}

const DAYS_OF_WEEK = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
];

export function ApprenticeScheduleDialog({
  open,
  onOpenChange,
  userId,
  userName,
}: ApprenticeScheduleDialogProps) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const [schedule, setSchedule] = useState({
    schedule_name: "Planning alternance",
    start_date: "",
    end_date: "",
    pattern_type: "weekly",
    school_days: [] as string[],
  });

  // Fetch existing schedule
  const { data: existingSchedule, isLoading } = useQuery({
    queryKey: ["apprentice-schedule", activeWorkspace?.id, userId],
    queryFn: async (): Promise<ApprenticeSchedule | null> => {
      if (!activeWorkspace) return null;

      const { data, error } = await supabase
        .from("apprentice_schedules")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as ApprenticeSchedule | null;
    },
    enabled: !!activeWorkspace && open,
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingSchedule) {
      const customPattern = existingSchedule.custom_pattern as { school_days?: string[] } | null;
      setSchedule({
        schedule_name: existingSchedule.schedule_name,
        start_date: existingSchedule.start_date,
        end_date: existingSchedule.end_date,
        pattern_type: existingSchedule.pattern_type,
        school_days: customPattern?.school_days || [],
      });
    } else {
      // Default: current year September to next year August
      const now = new Date();
      const year = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      setSchedule({
        schedule_name: "Planning alternance",
        start_date: `${year}-09-01`,
        end_date: `${year + 1}-08-31`,
        pattern_type: "weekly",
        school_days: [],
      });
    }
  }, [existingSchedule, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const schoolDaysCount = schedule.school_days.length;
      const companyDaysCount = 5 - schoolDaysCount;

      const scheduleData = {
        workspace_id: activeWorkspace.id,
        user_id: userId,
        created_by: user.id,
        schedule_name: schedule.schedule_name,
        start_date: schedule.start_date,
        end_date: schedule.end_date,
        pattern_type: schedule.pattern_type,
        school_days_per_week: schoolDaysCount,
        company_days_per_week: companyDaysCount,
        custom_pattern: { school_days: schedule.school_days },
      };

      if (existingSchedule) {
        const { error } = await supabase
          .from("apprentice_schedules")
          .update(scheduleData)
          .eq("id", existingSchedule.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("apprentice_schedules")
          .insert(scheduleData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      toast.success("Planning alternance enregistré");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error saving schedule:", error);
      toast.error("Erreur lors de l'enregistrement");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!existingSchedule) return;
      const { error } = await supabase
        .from("apprentice_schedules")
        .delete()
        .eq("id", existingSchedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedule"] });
      queryClient.invalidateQueries({ queryKey: ["apprentice-schedules"] });
      toast.success("Planning supprimé");
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const toggleDay = (day: string) => {
    setSchedule((prev) => ({
      ...prev,
      school_days: prev.school_days.includes(day)
        ? prev.school_days.filter((d) => d !== day)
        : [...prev.school_days, day],
    }));
  };

  const isValid = schedule.start_date && schedule.end_date && schedule.school_days.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Planning alternance
          </DialogTitle>
          <DialogDescription>
            Définir les jours école/entreprise pour {userName}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Chargement...</div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nom du planning</Label>
              <Input
                value={schedule.schedule_name}
                onChange={(e) => setSchedule({ ...schedule, schedule_name: e.target.value })}
                placeholder="Ex: Année 2024-2025"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={schedule.start_date}
                  onChange={(e) => setSchedule({ ...schedule, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={schedule.end_date}
                  onChange={(e) => setSchedule({ ...schedule, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Jours à l'école (récurrents)</Label>
              <div className="grid grid-cols-5 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={day.key}
                    onClick={() => toggleDay(day.key)}
                    className={`
                      flex flex-col items-center justify-center p-3 rounded-lg border cursor-pointer transition-all
                      ${schedule.school_days.includes(day.key)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-muted-foreground/50"
                      }
                    `}
                  >
                    <School className={`h-4 w-4 mb-1 ${schedule.school_days.includes(day.key) ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="text-xs font-medium">{day.label.slice(0, 3)}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Cliquez sur les jours où l'alternant est à l'école
              </p>
            </div>

            <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <School className="h-4 w-4 text-blue-500" />
                <span className="text-sm">{schedule.school_days.length} jour(s) école</span>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-green-500" />
                <span className="text-sm">{5 - schedule.school_days.length} jour(s) entreprise</span>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {existingSchedule && (
            <Button
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Supprimer
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isValid || saveMutation.isPending}
          >
            {saveMutation.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
