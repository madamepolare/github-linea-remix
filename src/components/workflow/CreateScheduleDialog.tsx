import { useState, useEffect } from "react";
import { format, setHours, setMinutes, startOfDay, addMinutes, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTaskSchedules, useUnscheduledTasks } from "@/hooks/useTaskSchedules";
import { TeamMember } from "@/hooks/useTeamMembers";
import { DurationInput } from "@/components/tasks/DurationInput";
import { Calendar, Clock, User, ListTodo } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  hour: number;
  member: TeamMember;
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  date,
  hour,
  member,
}: CreateScheduleDialogProps) {
  const { createSchedule } = useTaskSchedules();
  const { data: tasks } = useUnscheduledTasks();

  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [startTime, setStartTime] = useState(`${hour.toString().padStart(2, "0")}:00`);
  const [endTime, setEndTime] = useState(`${(hour + 1).toString().padStart(2, "0")}:00`);
  const [durationHours, setDurationHours] = useState("1");
  const [searchQuery, setSearchQuery] = useState("");

  // Update end time when duration changes
  useEffect(() => {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const duration = parseFloat(durationHours) || 1;
    const totalMinutes = startHour * 60 + startMinute + duration * 60;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = Math.round(totalMinutes % 60);
    setEndTime(`${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`);
  }, [startTime, durationHours]);

  // Update duration when end time changes
  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = newEndTime.split(":").map(Number);
    const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
    if (durationMinutes > 0) {
      setDurationHours((durationMinutes / 60).toFixed(2));
    }
  };

  // Filter tasks based on search
  const filteredTasks = (tasks || []).filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.project?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = () => {
    if (!selectedTaskId) return;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDatetime = setMinutes(setHours(startOfDay(date), startHour), startMinute);
    const endDatetime = setMinutes(setHours(startOfDay(date), endHour), endMinute);

    createSchedule.mutate({
      task_id: selectedTaskId,
      user_id: member.user_id,
      start_datetime: startDatetime.toISOString(),
      end_datetime: endDatetime.toISOString(),
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Planifier une tâche
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Date and member info */}
          <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {format(date, "EEEE d MMMM yyyy", { locale: fr })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={member.profile?.avatar_url || ""} />
                <AvatarFallback className="text-[10px]">
                  {(member.profile?.full_name || "?").charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{member.profile?.full_name}</span>
            </div>
          </div>

          {/* Time selection */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Début
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Fin
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Durée</Label>
              <DurationInput
                value={durationHours}
                onChange={setDurationHours}
              />
            </div>
          </div>

          {/* Task selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <ListTodo className="h-3.5 w-3.5" />
              Sélectionner une tâche
            </Label>
            <Input
              placeholder="Rechercher une tâche..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-48 border rounded-lg">
              <div className="p-2 space-y-1">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-4 text-sm text-muted-foreground">
                    Aucune tâche trouvée
                  </div>
                ) : (
                  filteredTasks.map(task => (
                    <div
                      key={task.id}
                      className={`p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedTaskId === task.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedTaskId(task.id)}
                    >
                      <div className="text-sm font-medium">{task.title}</div>
                      {task.project && (
                        <div className={`text-xs ${
                          selectedTaskId === task.id ? "opacity-80" : "text-muted-foreground"
                        }`}>
                          {task.project.name}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        {task.estimated_hours && (
                          <Badge 
                            variant={selectedTaskId === task.id ? "secondary" : "outline"}
                            className="text-[10px] px-1.5"
                          >
                            {task.estimated_hours}h estimé
                          </Badge>
                        )}
                        {task.scheduled_hours > 0 && (
                          <Badge 
                            variant={selectedTaskId === task.id ? "secondary" : "outline"}
                            className="text-[10px] px-1.5"
                          >
                            {task.scheduled_hours}h planifié
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedTaskId}>
            Planifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
