import { useState, useEffect, useMemo } from "react";
import { format, setHours, setMinutes, startOfDay, addMinutes, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTaskSchedules, useUnscheduledTasks } from "@/hooks/useTaskSchedules";
import { TeamMember } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { DurationInput } from "@/components/tasks/DurationInput";
import { Calendar, Clock, ListTodo, CalendarPlus, MapPin, Users, FolderKanban } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PlanningItem } from "./ResizablePlanningItem";

const EVENT_TYPES = [
  { value: "meeting", label: "Réunion", color: "#3b82f6" },
  { value: "milestone", label: "Jalon", color: "#f59e0b" },
  { value: "reminder", label: "Rappel", color: "#8b5cf6" },
  { value: "rendu", label: "Rendu", color: "#10b981" },
];

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date;
  hour: number;
  member: TeamMember;
  existingItems?: PlanningItem[];
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  date,
  hour,
  member,
  existingItems = [],
}: CreateScheduleDialogProps) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const { createSchedule } = useTaskSchedules();
  const { data: tasks } = useUnscheduledTasks();
  const { projects } = useProjects();
  const { data: members } = useTeamMembers();

  const [activeTab, setActiveTab] = useState<"task" | "event">("task");
  
  // Calculate the next available start time based on existing items
  const nextAvailableTime = useMemo(() => {
    if (existingItems.length === 0) {
      return { hour, minute: 0 };
    }
    
    const clickedTime = setHours(setMinutes(startOfDay(date), 0), hour);
    
    // Find all items that overlap with or come after the clicked time
    // Sort items by start time
    const sortedItems = [...existingItems]
      .filter(item => item.start && item.end)
      .sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));
    
    // Find if clicked time falls within an existing item or find the item that blocks it
    let proposedStart = clickedTime;
    
    for (const item of sortedItems) {
      if (!item.start || !item.end) continue;
      
      // If proposed start is before this item ends and after/during this item starts
      // we need to move to after this item
      if (proposedStart >= item.start && proposedStart < item.end) {
        // Clicked inside an existing item - move to end of this item
        proposedStart = item.end;
      } else if (proposedStart < item.start) {
        // There's a gap before this item - we can use the proposed start
        break;
      }
    }
    
    return { hour: proposedStart.getHours(), minute: proposedStart.getMinutes() };
  }, [existingItems, hour, date]);

  // Task scheduling state
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [taskSearchQuery, setTaskSearchQuery] = useState("");

  // Shared time state
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationHours, setDurationHours] = useState("1");

  // Event state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventType, setEventType] = useState("meeting");
  const [eventLocation, setEventLocation] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>([member.user_id]);
  const [isAllDay, setIsAllDay] = useState(false);

  // Initialize times when dialog opens
  useEffect(() => {
    if (open) {
      const startH = nextAvailableTime.hour.toString().padStart(2, "0");
      const startM = nextAvailableTime.minute.toString().padStart(2, "0");
      setStartTime(`${startH}:${startM}`);
      
      const endH = (nextAvailableTime.hour + 1).toString().padStart(2, "0");
      setEndTime(`${endH}:${startM}`);
      setDurationHours("1");
      
      // Reset form
      setSelectedTaskId("");
      setTaskSearchQuery("");
      setEventTitle("");
      setEventDescription("");
      setEventType("meeting");
      setEventLocation("");
      setSelectedProjectId("");
      setSelectedAttendees([member.user_id]);
      setIsAllDay(false);
    }
  }, [open, nextAvailableTime]);

  // Update end time when duration changes
  useEffect(() => {
    if (!startTime) return;
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const duration = parseFloat(durationHours) || 1;
    const totalMinutes = startHour * 60 + startMinute + duration * 60;
    const endHour = Math.floor(totalMinutes / 60);
    const endMinute = Math.round(totalMinutes % 60);
    setEndTime(`${endHour.toString().padStart(2, "0")}:${endMinute.toString().padStart(2, "0")}`);
  }, [startTime, durationHours]);

  // Update duration when end time changes manually
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
    task.title.toLowerCase().includes(taskSearchQuery.toLowerCase()) ||
    task.project?.name?.toLowerCase().includes(taskSearchQuery.toLowerCase())
  );

  const toggleAttendee = (userId: string) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmitTask = () => {
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

  const handleSubmitEvent = async () => {
    if (!eventTitle.trim() || !selectedProjectId || !activeWorkspace) return;

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startDatetime = setMinutes(setHours(startOfDay(date), startHour), startMinute);
    const endDatetime = setMinutes(setHours(startOfDay(date), endHour), endMinute);

    // Get attendee emails
    const attendees = selectedAttendees.map(userId => {
      const memberInfo = members?.find(m => m.user_id === userId);
      return {
        email: memberInfo?.profile?.email || "",
        name: memberInfo?.profile?.full_name || "",
        user_id: userId,
      };
    }).filter(a => a.email);

    try {
      const { error } = await supabase
        .from("project_calendar_events")
        .insert({
          workspace_id: activeWorkspace.id,
          project_id: selectedProjectId,
          title: eventTitle,
          description: eventDescription || null,
          event_type: eventType,
          start_datetime: startDatetime.toISOString(),
          end_datetime: endDatetime.toISOString(),
          location: eventLocation || null,
          is_all_day: isAllDay,
          attendees: attendees,
        });

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["workspace-events"] });
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      toast.success("Événement créé");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erreur: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Ajouter au planning
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "task" | "event")} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Tâche
            </TabsTrigger>
            <TabsTrigger value="event" className="flex items-center gap-2">
              <CalendarPlus className="h-4 w-4" />
              Événement
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <div className="space-y-4 pr-4">
              {/* Date and member info */}
              <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(date, "EEEE d MMMM", { locale: fr })}
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

              {/* Time selection - shared */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Début
                  </Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Fin
                  </Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => handleEndTimeChange(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Durée</Label>
                  <DurationInput
                    value={durationHours}
                    onChange={setDurationHours}
                  />
                </div>
              </div>

              <TabsContent value="task" className="mt-0 space-y-4">
                {/* Task selection */}
                <div className="space-y-2">
                  <Label className="text-xs flex items-center gap-1">
                    <ListTodo className="h-3 w-3" />
                    Sélectionner une tâche
                  </Label>
                  <Input
                    placeholder="Rechercher une tâche..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="h-9"
                  />
                  <ScrollArea className="h-40 border rounded-lg">
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
                                  className="text-[10px] px-1.5 h-5"
                                >
                                  {task.estimated_hours}h estimé
                                </Badge>
                              )}
                              {task.scheduled_hours > 0 && (
                                <Badge 
                                  variant={selectedTaskId === task.id ? "secondary" : "outline"}
                                  className="text-[10px] px-1.5 h-5"
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
              </TabsContent>

              <TabsContent value="event" className="mt-0 space-y-4">
                {/* Event title */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Titre de l'événement *</Label>
                  <Input
                    placeholder="Ex: Réunion de suivi projet..."
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Event type and project */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type</Label>
                    <Select value={eventType} onValueChange={setEventType}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EVENT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: type.color }}
                              />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs flex items-center gap-1">
                      <FolderKanban className="h-3 w-3" />
                      Projet *
                    </Label>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {(projects || []).map(project => (
                          <SelectItem key={project.id} value={project.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: project.color || "#6366f1" }}
                              />
                              {project.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Lieu (optionnel)
                  </Label>
                  <Input
                    placeholder="Ex: Salle de réunion A..."
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="h-9"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Description (optionnel)</Label>
                  <Textarea
                    placeholder="Détails de l'événement..."
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>

                {/* Attendees */}
                <div className="space-y-1.5">
                  <Label className="text-xs flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    Participants
                  </Label>
                  <ScrollArea className="h-24 border rounded-lg">
                    <div className="p-2 space-y-1">
                      {(members || []).map(m => (
                        <div
                          key={m.user_id}
                          className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer transition-colors ${
                            selectedAttendees.includes(m.user_id)
                              ? "bg-primary/10"
                              : "hover:bg-accent"
                          }`}
                          onClick={() => toggleAttendee(m.user_id)}
                        >
                          <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                            selectedAttendees.includes(m.user_id)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-muted-foreground/30"
                          }`}>
                            {selectedAttendees.includes(m.user_id) && (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={m.profile?.avatar_url || ""} />
                            <AvatarFallback className="text-[8px]">
                              {(m.profile?.full_name || "?").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm truncate">{m.profile?.full_name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          {activeTab === "task" ? (
            <Button onClick={handleSubmitTask} disabled={!selectedTaskId}>
              Planifier
            </Button>
          ) : (
            <Button onClick={handleSubmitEvent} disabled={!eventTitle.trim() || !selectedProjectId}>
              Créer l'événement
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
