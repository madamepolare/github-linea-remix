import { useState, useEffect, useRef, useMemo } from "react";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import { useTaskSchedules } from "@/hooks/useTaskSchedules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Pause, Clock, Plus, Calendar, User, Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, addHours } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DurationInput } from "./DurationInput";

interface TaskTimeTrackerProps {
  taskId: string;
}

export function TaskTimeTracker({ taskId }: TaskTimeTrackerProps) {
  const { timeEntries, totalHours, createTimeEntry } = useTaskTimeEntries(taskId);
  const { schedules, isLoading: schedulesLoading, updateSchedule } = useTaskSchedules({ taskId });
  
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualMinutes, setManualMinutes] = useState("");
  const [description, setDescription] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingDuration, setEditingDuration] = useState<string>("");

  // Calculer le temps total planifié depuis les schedules
  const { scheduledHours, scheduledEntries } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { scheduledHours: 0, scheduledEntries: [] };
    }
    
    const entries = schedules.map(schedule => {
      const start = new Date(schedule.start_datetime);
      const end = new Date(schedule.end_datetime);
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
      
      return {
        id: schedule.id,
        startDatetime: schedule.start_datetime,
        date: start,
        durationHours,
        userName: schedule.user?.full_name || "Non assigné",
        userAvatar: schedule.user?.avatar_url || null,
        isLocked: schedule.is_locked,
      };
    });
    
    const totalHours = entries.reduce((sum, e) => sum + e.durationHours, 0);
    
    return { 
      scheduledHours: Math.round(totalHours * 10) / 10, 
      scheduledEntries: entries.sort((a, b) => b.date.getTime() - a.date.getTime())
    };
  }, [schedules]);

  const handleEditEntry = (entry: typeof scheduledEntries[0]) => {
    setEditingEntryId(entry.id);
    setEditingDuration(entry.durationHours.toString());
  };

  const handleSaveEntry = async (entryId: string, startDatetime: string) => {
    const hours = parseFloat(editingDuration);
    if (isNaN(hours) || hours <= 0) return;
    
    const startDate = new Date(startDatetime);
    const endDate = addHours(startDate, hours);
    
    await updateSchedule.mutateAsync({
      id: entryId,
      end_datetime: endDate.toISOString(),
    });
    
    setEditingEntryId(null);
    setEditingDuration("");
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingDuration("");
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Temps total = temps manuel + temps planifié
  const combinedTotalHours = Math.round((totalHours + scheduledHours) * 10) / 10;

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startTimer = () => {
    setIsRunning(true);
    startTimeRef.current = new Date();
    intervalRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);

    if (elapsedSeconds >= 60) {
      const minutes = Math.round(elapsedSeconds / 60);
      await createTimeEntry.mutateAsync({
        duration_minutes: minutes,
        date: new Date().toISOString().split("T")[0],
        description: description || undefined,
        started_at: startTimeRef.current?.toISOString(),
        ended_at: new Date().toISOString(),
      });
      setDescription("");
    }

    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const handleManualEntry = async () => {
    const minutes = parseInt(manualMinutes);
    if (isNaN(minutes) || minutes <= 0) return;

    await createTimeEntry.mutateAsync({
      duration_minutes: minutes,
      date: new Date().toISOString().split("T")[0],
      description: description || undefined,
    });

    setManualMinutes("");
    setDescription("");
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      {/* Total Time Display - Combined */}
      <div className="p-4 rounded-lg bg-muted/50 text-center space-y-2">
        <p className="text-3xl font-semibold tabular-nums">{combinedTotalHours}h</p>
        <p className="text-sm text-muted-foreground">Temps total</p>
        
        {/* Breakdown */}
        {(scheduledHours > 0 || totalHours > 0) && (
          <div className="flex items-center justify-center gap-4 pt-2 text-xs">
            {scheduledHours > 0 && (
              <div className="flex items-center gap-1 text-primary">
                <Calendar className="h-3 w-3" />
                <span>{scheduledHours}h planifié</span>
              </div>
            )}
            {totalHours > 0 && (
              <div className="flex items-center gap-1 text-emerald-600">
                <Clock className="h-3 w-3" />
                <span>{totalHours}h manuel</span>
              </div>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="planning" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="planning">
            <Calendar className="h-3 w-3 mr-1" />
            Planning
          </TabsTrigger>
          <TabsTrigger value="timer">
            <Play className="h-3 w-3 mr-1" />
            Chrono
          </TabsTrigger>
          <TabsTrigger value="manual">
            <Plus className="h-3 w-3 mr-1" />
            Manuel
          </TabsTrigger>
        </TabsList>

        {/* Planning Tab - Shows scheduled time entries */}
        <TabsContent value="planning" className="space-y-4">
          {schedulesLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : scheduledEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune planification</p>
              <p className="text-xs mt-1">Planifiez cette tâche depuis le planning d'équipe</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2 pr-2">
                {scheduledEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-card border text-sm group"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={entry.userAvatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(entry.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{entry.userName}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(entry.date, "EEEE d MMMM", { locale: fr })}
                        </div>
                      </div>
                    </div>
                    {editingEntryId === entry.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.25"
                          min="0.25"
                          value={editingDuration}
                          onChange={(e) => setEditingDuration(e.target.value)}
                          className="h-7 w-16 text-sm"
                        />
                        <span className="text-xs text-muted-foreground">h</span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => handleSaveEntry(entry.id, entry.startDatetime)}
                        >
                          <Check className="h-3 w-3 text-green-600" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-sm font-semibold">
                          {entry.durationHours}h
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </TabsContent>

        {/* Timer Tab */}
        <TabsContent value="timer" className="space-y-4">
          {/* Timer Display */}
          <div className="text-center py-4">
            <p
              className={cn(
                "text-4xl font-mono tabular-nums",
                isRunning && "text-primary"
              )}
            >
              {formatTime(elapsedSeconds)}
            </p>
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Que faites-vous ?"
              disabled={isRunning}
            />
          </div>

          {/* Timer Controls */}
          <div className="flex justify-center">
            {!isRunning ? (
              <Button onClick={startTimer} size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Démarrer
              </Button>
            ) : (
              <Button onClick={stopTimer} size="lg" variant="destructive" className="gap-2">
                <Pause className="h-5 w-5" />
                Arrêter et enregistrer
              </Button>
            )}
          </div>

          {isRunning && (
            <p className="text-center text-sm text-muted-foreground">
              Le temps sera enregistré lorsque vous arrêterez le chronomètre
            </p>
          )}
        </TabsContent>

        {/* Manual Tab */}
        <TabsContent value="manual" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="30"
                min="1"
              />
            </div>
            <div className="space-y-2">
              <Label>Heures équivalentes</Label>
              <p className="text-2xl font-semibold pt-1">
                {manualMinutes ? (parseInt(manualMinutes) / 60).toFixed(1) : "0"}h
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Travail effectué..."
            />
          </div>

          <Button
            onClick={handleManualEntry}
            disabled={!manualMinutes || parseInt(manualMinutes) <= 0}
            className="w-full"
          >
            <Clock className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </TabsContent>
      </Tabs>

      {/* Recent Manual Time Entries */}
      {timeEntries && timeEntries.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            Entrées manuelles
          </h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {timeEntries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm"
              >
                <div>
                  <span className="font-medium">
                    {Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}min
                  </span>
                  {entry.description && (
                    <span className="text-muted-foreground ml-2">- {entry.description}</span>
                  )}
                </div>
                <span className="text-muted-foreground text-xs">{entry.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
