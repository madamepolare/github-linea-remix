import { useState, useEffect, useRef, useMemo } from "react";
import { useTaskTimeEntries, TaskTimeEntry } from "@/hooks/useTaskTimeEntries";
import { useTaskSchedules, TaskSchedule } from "@/hooks/useTaskSchedules";
import { useWorkspaceProfiles } from "@/hooks/useWorkspaceProfiles";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Play, Pause, Clock, Plus, Calendar as CalendarIcon, User, Pencil, Check, X, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, addHours, setHours, setMinutes, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DurationInput } from "./DurationInput";
import { toast } from "sonner";

interface TaskTimeTrackerProps {
  taskId: string;
}

export function TaskTimeTracker({ taskId }: TaskTimeTrackerProps) {
  const { timeEntries, totalHours, createTimeEntry, updateTimeEntry, deleteTimeEntry } = useTaskTimeEntries(taskId);
  const { schedules, isLoading: schedulesLoading, createSchedule, updateSchedule, deleteSchedule } = useTaskSchedules({ taskId });
  const { data: profiles } = useWorkspaceProfiles();
  const { user } = useAuth();

  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [manualHours, setManualHours] = useState("");
  const [manualDate, setManualDate] = useState<Date | undefined>(new Date());
  const [manualUserId, setManualUserId] = useState<string>("");
  const [description, setDescription] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Editing state for schedule entries
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [editScheduleUserId, setEditScheduleUserId] = useState<string>("");
  const [editScheduleDate, setEditScheduleDate] = useState<Date | undefined>();
  const [editScheduleStartHour, setEditScheduleStartHour] = useState("09");
  const [editScheduleStartMinute, setEditScheduleStartMinute] = useState("00");
  const [editScheduleDuration, setEditScheduleDuration] = useState("");

  // Editing state for manual time entries
  const [editingTimeEntryId, setEditingTimeEntryId] = useState<string | null>(null);
  const [editTimeEntryUserId, setEditTimeEntryUserId] = useState<string>("");
  const [editTimeEntryDate, setEditTimeEntryDate] = useState<Date | undefined>();
  const [editTimeEntryDuration, setEditTimeEntryDuration] = useState("");

  // New schedule form state
  const [showNewScheduleForm, setShowNewScheduleForm] = useState(false);
  const [newScheduleUserId, setNewScheduleUserId] = useState<string>("");
  const [newScheduleDate, setNewScheduleDate] = useState<Date | undefined>(new Date());
  const [newScheduleStartHour, setNewScheduleStartHour] = useState("09");
  const [newScheduleStartMinute, setNewScheduleStartMinute] = useState("00");
  const [newScheduleDuration, setNewScheduleDuration] = useState("2");
  const [isCreatingSchedule, setIsCreatingSchedule] = useState(false);

  // Set default manual user to current user
  useEffect(() => {
    if (user?.id && !manualUserId) {
      setManualUserId(user.id);
    }
  }, [user?.id, manualUserId]);

  // Calculer le temps total planifié depuis les schedules
  const { scheduledHours, scheduledEntries } = useMemo(() => {
    if (!schedules || schedules.length === 0) {
      return { scheduledHours: 0, scheduledEntries: [] };
    }

    const entries = schedules.map((schedule) => {
      const start = new Date(schedule.start_datetime);
      const end = new Date(schedule.end_datetime);
      const durationMs = end.getTime() - start.getTime();
      const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;

      return {
        id: schedule.id,
        startDatetime: schedule.start_datetime,
        userId: schedule.user_id,
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
      scheduledEntries: entries.sort((a, b) => b.date.getTime() - a.date.getTime()),
    };
  }, [schedules]);

  const handleEditScheduleEntry = (entry: (typeof scheduledEntries)[0]) => {
    setEditingScheduleId(entry.id);
    setEditScheduleUserId(entry.userId);
    setEditScheduleDate(entry.date);
    setEditScheduleStartHour(format(entry.date, "HH"));
    setEditScheduleStartMinute(format(entry.date, "mm"));
    setEditScheduleDuration(entry.durationHours.toString());
  };

  const handleSaveScheduleEntry = async () => {
    if (!editingScheduleId || !editScheduleDate) return;

    const hours = parseFloat(editScheduleDuration);
    if (isNaN(hours) || hours <= 0) return;

    const startDate = setMinutes(
      setHours(startOfDay(editScheduleDate), parseInt(editScheduleStartHour)),
      parseInt(editScheduleStartMinute)
    );
    const endDate = addHours(startDate, hours);

    await updateSchedule.mutateAsync({
      id: editingScheduleId,
      user_id: editScheduleUserId,
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
    });

    handleCancelScheduleEdit();
  };

  const handleCancelScheduleEdit = () => {
    setEditingScheduleId(null);
    setEditScheduleUserId("");
    setEditScheduleDate(undefined);
    setEditScheduleStartHour("09");
    setEditScheduleStartMinute("00");
    setEditScheduleDuration("");
  };

  const handleEditTimeEntry = (entry: TaskTimeEntry) => {
    setEditingTimeEntryId(entry.id);
    setEditTimeEntryUserId(entry.user_id || "");
    setEditTimeEntryDate(new Date(entry.date));
    setEditTimeEntryDuration((entry.duration_minutes / 60).toString());
  };

  const handleSaveTimeEntry = async () => {
    if (!editingTimeEntryId || !editTimeEntryDate) return;

    const hours = parseFloat(editTimeEntryDuration);
    if (isNaN(hours) || hours <= 0) return;

    await updateTimeEntry.mutateAsync({
      id: editingTimeEntryId,
      user_id: editTimeEntryUserId || null,
      date: format(editTimeEntryDate, "yyyy-MM-dd"),
      duration_minutes: Math.round(hours * 60),
    });

    handleCancelTimeEntryEdit();
  };

  const handleCancelTimeEntryEdit = () => {
    setEditingTimeEntryId(null);
    setEditTimeEntryUserId("");
    setEditTimeEntryDate(undefined);
    setEditTimeEntryDuration("");
  };

  const handleCreateSchedule = async () => {
    if (!newScheduleUserId || !newScheduleDate) {
      toast.error("Veuillez sélectionner un membre et une date");
      return;
    }

    setIsCreatingSchedule(true);
    try {
      const startDate = setMinutes(
        setHours(startOfDay(newScheduleDate), parseInt(newScheduleStartHour)),
        parseInt(newScheduleStartMinute)
      );
      const endDate = addHours(startDate, parseFloat(newScheduleDuration));

      await createSchedule.mutateAsync({
        task_id: taskId,
        user_id: newScheduleUserId,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
      });

      // Reset form
      setShowNewScheduleForm(false);
      setNewScheduleUserId("");
      setNewScheduleDate(new Date());
      setNewScheduleStartHour("09");
      setNewScheduleStartMinute("00");
      setNewScheduleDuration("2");
    } catch (error) {
      console.error("Error creating schedule:", error);
    } finally {
      setIsCreatingSchedule(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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
        user_id: user?.id,
      });
      setDescription("");
    }

    setElapsedSeconds(0);
    startTimeRef.current = null;
  };

  const handleManualEntry = async () => {
    const hours = parseFloat(manualHours);
    if (isNaN(hours) || hours <= 0) return;

    const minutes = Math.round(hours * 60);
    await createTimeEntry.mutateAsync({
      duration_minutes: minutes,
      date: manualDate ? format(manualDate, "yyyy-MM-dd") : new Date().toISOString().split("T")[0],
      description: description || undefined,
      user_id: manualUserId || user?.id,
    });

    setManualHours("");
    setDescription("");
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
  const minuteOptions = ["00", "15", "30", "45"];

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
                <CalendarIcon className="h-3 w-3" />
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
            <CalendarIcon className="h-3 w-3 mr-1" />
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
          {/* Add Schedule Button */}
          {!showNewScheduleForm && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowNewScheduleForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Planifier un créneau
            </Button>
          )}

          {/* New Schedule Form */}
          {showNewScheduleForm && (
            <div className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-sm">Nouveau créneau</h4>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowNewScheduleForm(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Assigné à</Label>
                <Select value={newScheduleUserId} onValueChange={setNewScheduleUserId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Choisir un membre..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profiles?.map((profile) => (
                      <SelectItem key={profile.user_id} value={profile.user_id}>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="text-[9px]">
                              {getInitials(profile.full_name || "?")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{profile.full_name || "Utilisateur"}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full h-9 justify-start font-normal">
                      <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                      {newScheduleDate ? format(newScheduleDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newScheduleDate}
                      onSelect={setNewScheduleDate}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Time Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Heure de début</Label>
                  <div className="flex gap-1">
                    <Select value={newScheduleStartHour} onValueChange={setNewScheduleStartHour}>
                      <SelectTrigger className="h-9 flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {hourOptions.map((h) => (
                          <SelectItem key={h} value={h}>{h}h</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={newScheduleStartMinute} onValueChange={setNewScheduleStartMinute}>
                      <SelectTrigger className="h-9 w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {minuteOptions.map((m) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Durée</Label>
                  <Select value={newScheduleDuration} onValueChange={setNewScheduleDuration}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["0.5", "1", "1.5", "2", "2.5", "3", "4", "5", "6", "7", "8"].map((d) => (
                        <SelectItem key={d} value={d}>{d}h</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setShowNewScheduleForm(false)}>
                  Annuler
                </Button>
                <Button size="sm" onClick={handleCreateSchedule} disabled={isCreatingSchedule}>
                  {isCreatingSchedule ? "Création..." : "Planifier"}
                </Button>
              </div>
            </div>
          )}

          {schedulesLoading ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              Chargement...
            </div>
          ) : scheduledEntries.length === 0 && !showNewScheduleForm ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarIcon className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Aucune planification</p>
              <p className="text-xs mt-1">Cliquez sur le bouton ci-dessus pour planifier</p>
            </div>
          ) : (
            <ScrollArea className="h-[220px]">
              <div className="space-y-2 pr-2">
                {scheduledEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg bg-card border text-sm group p-3"
                  >
                    {editingScheduleId === entry.id ? (
                      <div className="space-y-3">
                        {/* Editing mode for schedule */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Assigné à</Label>
                          <Select value={editScheduleUserId} onValueChange={setEditScheduleUserId}>
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Choisir..." />
                            </SelectTrigger>
                            <SelectContent>
                              {profiles?.map((profile) => (
                                <SelectItem key={profile.user_id} value={profile.user_id}>
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-5 w-5">
                                      <AvatarImage src={profile.avatar_url || undefined} />
                                      <AvatarFallback className="text-[9px]">
                                        {getInitials(profile.full_name || "?")}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span>{profile.full_name || "Utilisateur"}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full h-9 justify-start font-normal">
                                <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                                {editScheduleDate ? format(editScheduleDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner..."}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={editScheduleDate}
                                onSelect={setEditScheduleDate}
                                locale={fr}
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Heure de début</Label>
                            <div className="flex gap-1">
                              <Select value={editScheduleStartHour} onValueChange={setEditScheduleStartHour}>
                                <SelectTrigger className="h-9 flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {hourOptions.map((h) => (
                                    <SelectItem key={h} value={h}>{h}h</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Select value={editScheduleStartMinute} onValueChange={setEditScheduleStartMinute}>
                                <SelectTrigger className="h-9 w-16">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {minuteOptions.map((m) => (
                                    <SelectItem key={m} value={m}>{m}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Durée</Label>
                            <Select value={editScheduleDuration} onValueChange={setEditScheduleDuration}>
                              <SelectTrigger className="h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {["0.5", "1", "1.5", "2", "2.5", "3", "4", "5", "6", "7", "8"].map((d) => (
                                  <SelectItem key={d} value={d}>{d}h</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                          <Button size="sm" variant="ghost" onClick={handleCancelScheduleEdit}>
                            Annuler
                          </Button>
                          <Button size="sm" onClick={handleSaveScheduleEntry}>
                            Enregistrer
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
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
                              {format(entry.date, "EEEE d MMMM", { locale: fr })} à{" "}
                              {format(entry.date, "HH:mm")}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Badge variant="secondary" className="text-sm font-semibold">
                            {entry.durationHours}h
                          </Badge>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleEditScheduleEntry(entry)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                            onClick={() => deleteSchedule.mutate(entry.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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
            <p className={cn("text-4xl font-mono tabular-nums", isRunning && "text-primary")}>
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

        <TabsContent value="manual" className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Assigné à</Label>
            <Select value={manualUserId} onValueChange={setManualUserId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Choisir un membre..." />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((profile) => (
                  <SelectItem key={profile.user_id} value={profile.user_id}>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback className="text-[9px]">
                          {getInitials(profile.full_name || "?")}
                        </AvatarFallback>
                      </Avatar>
                      <span>{profile.full_name || "Utilisateur"}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full h-9 justify-start font-normal">
                  <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                  {manualDate ? format(manualDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={manualDate}
                  onSelect={setManualDate}
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Durée</Label>
            <DurationInput value={manualHours} onChange={setManualHours} placeholder="Ex: 2h30" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Description (optionnel)</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Travail effectué..."
              className="h-9"
            />
          </div>

          <Button
            onClick={handleManualEntry}
            disabled={!manualHours || parseFloat(manualHours) <= 0}
            className="w-full"
            size="sm"
          >
            <Clock className="h-4 w-4 mr-2" />
            Enregistrer le temps
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
          <ScrollArea className="h-[150px]">
            <div className="space-y-2 pr-2">
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg bg-card border text-sm group p-3"
                >
                  {editingTimeEntryId === entry.id ? (
                    <div className="space-y-3">
                      {/* Editing mode for time entry */}
                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Assigné à</Label>
                        <Select value={editTimeEntryUserId} onValueChange={setEditTimeEntryUserId}>
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder="Choisir..." />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles?.map((profile) => (
                              <SelectItem key={profile.user_id} value={profile.user_id}>
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-5 w-5">
                                    <AvatarImage src={profile.avatar_url || undefined} />
                                    <AvatarFallback className="text-[9px]">
                                      {getInitials(profile.full_name || "?")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span>{profile.full_name || "Utilisateur"}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full h-9 justify-start font-normal">
                              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                              {editTimeEntryDate ? format(editTimeEntryDate, "EEEE d MMMM", { locale: fr }) : "Sélectionner..."}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={editTimeEntryDate}
                              onSelect={setEditTimeEntryDate}
                              locale={fr}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground">Durée</Label>
                        <DurationInput value={editTimeEntryDuration} onChange={setEditTimeEntryDuration} />
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <Button size="sm" variant="ghost" onClick={handleCancelTimeEntryEdit}>
                          Annuler
                        </Button>
                        <Button size="sm" onClick={handleSaveTimeEntry}>
                          Enregistrer
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user?.avatar_url || undefined} />
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 text-xs">
                            {getInitials(entry.user?.full_name || "?")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{entry.user?.full_name || "Non assigné"}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(entry.date), "EEEE d MMMM", { locale: fr })}
                            {entry.description && ` • ${entry.description}`}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-sm font-semibold text-emerald-600 border-emerald-200">
                          {Math.floor(entry.duration_minutes / 60)}h{entry.duration_minutes % 60 > 0 ? ` ${entry.duration_minutes % 60}m` : ""}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditTimeEntry(entry)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          onClick={() => deleteTimeEntry.mutate(entry.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
