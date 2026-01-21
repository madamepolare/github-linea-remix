import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useCreateTimeEntry } from "@/hooks/useTeamTimeEntries";
import { format, eachDayOfInterval, isWeekend } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, FolderKanban, ListTodo, Plus, Home, Calendar } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  endDate?: Date | null; // Optional end date for multi-day selection
  member: TeamMember | null;
}

export function AddTimeEntryDialog({
  open,
  onOpenChange,
  date,
  endDate,
  member,
}: AddTimeEntryDialogProps) {
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const createEntry = useCreateTimeEntry();

  const [mode, setMode] = useState<"project" | "task">("project");
  const [projectId, setProjectId] = useState<string>("");
  const [taskId, setTaskId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [skipWeekends, setSkipWeekends] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separate internal and client projects
  const internalProjects = projects?.filter(p => p.is_internal) || [];
  const clientProjects = projects?.filter(p => !p.is_internal) || [];

  // Filter tasks based on selected project
  const filteredTasks = projectId
    ? tasks?.filter(t => t.project_id === projectId) || []
    : tasks || [];

  // Calculate days in the selection
  const selectedDays = useMemo(() => {
    if (!date) return [];
    const start = date;
    const end = endDate || date;
    const sortedStart = start <= end ? start : end;
    const sortedEnd = start <= end ? end : start;
    
    const allDays = eachDayOfInterval({ start: sortedStart, end: sortedEnd });
    
    if (skipWeekends) {
      return allDays.filter(d => !isWeekend(d));
    }
    return allDays;
  }, [date, endDate, skipWeekends]);

  const isMultiDay = selectedDays.length > 1;

  useEffect(() => {
    if (open) {
      setMode("project");
      setProjectId("");
      setTaskId("");
      setDescription("");
      setDurationMinutes(60);
      setSkipWeekends(true);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (selectedDays.length === 0) return;

    setIsSubmitting(true);

    try {
      // Check if project is internal
      const selectedProject = projects?.find(p => p.id === projectId);
      const isBillable = selectedProject ? !selectedProject.is_internal : true;

      // Create time entry for each selected day
      for (const day of selectedDays) {
        await createEntry.mutateAsync({
          user_id: member?.user_id, // Use selected member's user_id
          date: format(day, "yyyy-MM-dd"),
          project_id: projectId || null,
          task_id: mode === "task" && taskId ? taskId : null,
          description: description || null,
          duration_minutes: durationMinutes,
          is_billable: isBillable,
          status: "draft",
        });
      }

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;
  const totalMinutes = durationMinutes * selectedDays.length;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ajouter du temps
          </DialogTitle>
          {date && (
            <div className="text-sm text-muted-foreground">
              {isMultiDay ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {format(selectedDays[0], "d MMM", { locale: fr })} → {format(selectedDays[selectedDays.length - 1], "d MMM yyyy", { locale: fr })}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {selectedDays.length} jours
                  </Badge>
                </div>
              ) : (
                <span>
                  {format(date, "EEEE d MMMM yyyy", { locale: fr })}
                </span>
              )}
              {member?.profile?.full_name && <span> • {member.profile.full_name}</span>}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Multi-day options */}
          {endDate && date && endDate.getTime() !== date.getTime() && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="skip-weekends"
                  checked={skipWeekends}
                  onCheckedChange={setSkipWeekends}
                />
                <Label htmlFor="skip-weekends" className="text-sm cursor-pointer">
                  Exclure les week-ends
                </Label>
              </div>
            </div>
          )}

          {/* Mode selection */}
          <Tabs value={mode} onValueChange={(v) => setMode(v as "project" | "task")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project" className="gap-2">
                <FolderKanban className="h-4 w-4" />
                Projet seul
              </TabsTrigger>
              <TabsTrigger value="task" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Lier à une tâche
              </TabsTrigger>
            </TabsList>

            <TabsContent value="project" className="space-y-4 mt-4">
              {/* Project selector */}
              <div className="space-y-2">
                <Label>Projet</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un projet" />
                  </SelectTrigger>
                  <SelectContent>
                    {internalProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-1.5 text-xs">
                          <Home className="h-3 w-3" />
                          Projets internes (non facturables)
                        </SelectLabel>
                        {internalProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            <span className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                              {p.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {clientProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="flex items-center gap-1.5 text-xs">
                          <FolderKanban className="h-3 w-3" />
                          Projets clients
                        </SelectLabel>
                        {clientProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="task" className="space-y-4 mt-4">
              {/* Project filter for tasks */}
              <div className="space-y-2">
                <Label>Filtrer par projet (optionnel)</Label>
                <Select value={projectId || "all"} onValueChange={(v) => {
                  setProjectId(v === "all" ? "" : v);
                  setTaskId(""); // Reset task when project changes
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les projets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les projets</SelectItem>
                    {internalProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs">Internes</SelectLabel>
                        {internalProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                    {clientProjects.length > 0 && (
                      <SelectGroup>
                        <SelectLabel className="text-xs">Clients</SelectLabel>
                        {clientProjects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Task selector */}
              <div className="space-y-2">
                <Label>Tâche</Label>
                <Select value={taskId} onValueChange={setTaskId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une tâche" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTasks.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Aucune tâche trouvée
                      </div>
                    ) : (
                      filteredTasks.slice(0, 50).map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description du travail</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez le travail effectué..."
              rows={3}
            />
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label>Durée par jour (minutes)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              = {durationHours}h{durationMins > 0 ? ` ${durationMins}min` : ""} par jour
              {isMultiDay && (
                <span className="font-medium text-primary ml-2">
                  → Total: {totalHours}h{totalMins > 0 ? ` ${totalMins}min` : ""} ({selectedDays.length} jours)
                </span>
              )}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (mode === "task" && !taskId && !projectId)}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isMultiDay ? `Ajouter (${selectedDays.length} jours)` : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
