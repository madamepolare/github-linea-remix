import { useState, useEffect, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TaskSchedule, useTaskSchedules } from "@/hooks/useTaskSchedules";
import { format, differenceInMinutes, addMinutes } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, User, Flag, Trash2, Lock, Unlock, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DurationInput } from "@/components/tasks/DurationInput";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ScheduleDetailSheetProps {
  schedule: TaskSchedule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-red-500" },
  high: { label: "Haute", color: "bg-orange-500" },
  medium: { label: "Moyenne", color: "bg-yellow-500" },
  low: { label: "Basse", color: "bg-green-500" },
};

export function ScheduleDetailSheet({ schedule, open, onOpenChange }: ScheduleDetailSheetProps) {
  const navigate = useNavigate();
  const { updateSchedule, deleteSchedule } = useTaskSchedules();
  
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [notes, setNotes] = useState("");
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (schedule) {
      const start = new Date(schedule.start_datetime);
      const end = new Date(schedule.end_datetime);
      const durationMins = differenceInMinutes(end, start);
      const durationH = durationMins / 60;
      
      setStartDate(format(start, "yyyy-MM-dd"));
      setStartTime(format(start, "HH:mm"));
      setDurationHours(durationH.toString());
      setNotes(schedule.notes || "");
      setIsLocked(schedule.is_locked);
    }
  }, [schedule]);

  if (!schedule) return null;

  const handleSave = () => {
    const startDatetime = new Date(`${startDate}T${startTime}`);
    const durationMins = parseFloat(durationHours || "1") * 60;
    const endDatetime = addMinutes(startDatetime, durationMins);

    updateSchedule.mutate({
      id: schedule.id,
      start_datetime: startDatetime.toISOString(),
      end_datetime: endDatetime.toISOString(),
      notes: notes || null,
      is_locked: isLocked,
    });

    onOpenChange(false);
  };

  const handleDelete = () => {
    deleteSchedule.mutate(schedule.id);
    onOpenChange(false);
  };

  const goToTask = () => {
    navigate(`/tasks?task=${schedule.task_id}`);
  };

  const priority = schedule.task?.priority as keyof typeof PRIORITY_CONFIG;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Détails du créneau
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Task info */}
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-semibold">{schedule.task?.title}</h4>
                {schedule.task?.project && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {schedule.task.project.name}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={goToTask}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {priority && (
                <Badge className={`${PRIORITY_CONFIG[priority]?.color} text-white`}>
                  <Flag className="h-3 w-3 mr-1" />
                  {PRIORITY_CONFIG[priority]?.label}
                </Badge>
              )}
              <Badge variant="outline">
                {schedule.task?.status}
              </Badge>
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              {schedule.user?.avatar_url ? (
                <img
                  src={schedule.user.avatar_url}
                  alt=""
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <User className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="font-medium">{schedule.user?.full_name || "Membre"}</div>
              <div className="text-sm text-muted-foreground">Assigné à ce créneau</div>
            </div>
          </div>

          {/* Date/Time inputs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure de début</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          {/* Duration - simplified input */}
          <div className="space-y-2">
            <Label>Durée</Label>
            <DurationInput
              value={durationHours}
              onChange={setDurationHours}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur ce créneau..."
              rows={3}
            />
          </div>

          {/* Lock toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Unlock className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="locked">Verrouiller ce créneau</Label>
            </div>
            <Switch
              id="locked"
              checked={isLocked}
              onCheckedChange={setIsLocked}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Supprimer
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Supprimer ce créneau ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    La tâche ne sera plus planifiée mais restera dans la liste des tâches.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Supprimer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button className="flex-1" onClick={handleSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
