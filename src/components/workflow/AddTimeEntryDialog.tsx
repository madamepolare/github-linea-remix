import { useState, useEffect } from "react";
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
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Clock, FolderKanban, ListTodo, Plus, Home } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  member: TeamMember | null;
}

export function AddTimeEntryDialog({
  open,
  onOpenChange,
  date,
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

  // Separate internal and client projects
  const internalProjects = projects?.filter(p => p.is_internal) || [];
  const clientProjects = projects?.filter(p => !p.is_internal) || [];

  // Filter tasks based on selected project
  const filteredTasks = projectId
    ? tasks?.filter(t => t.project_id === projectId) || []
    : tasks || [];

  useEffect(() => {
    if (open) {
      setMode("project");
      setProjectId("");
      setTaskId("");
      setDescription("");
      setDurationMinutes(60);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!date) return;

    // Check if project is internal
    const selectedProject = projects?.find(p => p.id === projectId);
    const isBillable = selectedProject ? !selectedProject.is_internal : true;

    await createEntry.mutateAsync({
      date: format(date, "yyyy-MM-dd"),
      project_id: projectId || null,
      task_id: mode === "task" && taskId ? taskId : null,
      description: description || null,
      duration_minutes: durationMinutes,
      is_billable: isBillable,
      status: "draft",
    });

    onOpenChange(false);
  };

  const durationHours = Math.floor(durationMinutes / 60);
  const durationMins = durationMinutes % 60;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ajouter du temps
          </DialogTitle>
          {date && (
            <p className="text-sm text-muted-foreground">
              {format(date, "EEEE d MMMM yyyy", { locale: fr })}
              {member?.profile?.full_name && ` • ${member.profile.full_name}`}
            </p>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
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
            <Label>Durée (minutes)</Label>
            <Input
              type="number"
              min={15}
              step={15}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
            />
            <p className="text-xs text-muted-foreground">
              = {durationHours}h{durationMins > 0 ? ` ${durationMins}min` : ""}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createEntry.isPending || (mode === "task" && !taskId && !projectId)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
