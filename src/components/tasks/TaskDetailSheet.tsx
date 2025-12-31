import { useState, useEffect } from "react";
import { Task, useTasks } from "@/hooks/useTasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useTaskTimeEntries } from "@/hooks/useTaskTimeEntries";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, CheckSquare, Clock, MessageSquare, Save, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface TaskDetailSheetProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: "todo", label: "À faire" },
  { value: "in_progress", label: "En cours" },
  { value: "review", label: "En revue" },
  { value: "done", label: "Terminé" },
  { value: "archived", label: "Archivé" },
];

const priorityOptions = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const { updateTask, deleteTask } = useTasks();
  const { comments, createComment } = useTaskComments(task?.id || null);
  const { timeEntries, totalHours, createTimeEntry } = useTaskTimeEntries(task?.id || null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [newComment, setNewComment] = useState("");
  const [timeMinutes, setTimeMinutes] = useState("");

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    updateTask.mutate({ id: task.id, title, description, status, priority });
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id);
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    createComment.mutate(newComment);
    setNewComment("");
  };

  const handleAddTimeEntry = () => {
    const minutes = parseInt(timeMinutes);
    if (isNaN(minutes) || minutes <= 0) return;
    createTimeEntry.mutate({
      duration_minutes: minutes,
      date: new Date().toISOString().split("T")[0],
    });
    setTimeMinutes("");
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Détails de la tâche</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-3 w-3 mr-1" />
              {comments?.length || 0}
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-3 w-3 mr-1" />
              {totalHours}h
            </TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priorité</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
              {task.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Échéance: {format(new Date(task.due_date), "d MMMM yyyy", { locale: fr })}</span>
                </div>
              )}
              {task.estimated_hours && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Estimation: {task.estimated_hours}h</span>
                </div>
              )}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />Enregistrer
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4">
            <div className="flex gap-2">
              <Textarea placeholder="Ajouter un commentaire..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} className="flex-1" />
              <Button onClick={handleAddComment} size="icon"><MessageSquare className="h-4 w-4" /></Button>
            </div>
            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-muted-foreground">
                    {comment.created_at && format(new Date(comment.created_at), "d MMM yyyy à HH:mm", { locale: fr })}
                  </p>
                </div>
              ))}
              {(!comments || comments.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Aucun commentaire</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="time" className="space-y-4">
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label>Durée (minutes)</Label>
                <Input type="number" placeholder="30" value={timeMinutes} onChange={(e) => setTimeMinutes(e.target.value)} />
              </div>
              <Button onClick={handleAddTimeEntry}><Clock className="h-4 w-4 mr-2" />Ajouter</Button>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-semibold">{totalHours}h</p>
              <p className="text-sm text-muted-foreground">Temps total</p>
            </div>
            <div className="space-y-2">
              {timeEntries?.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded border">
                  <p className="text-sm font-medium">{Math.floor(entry.duration_minutes / 60)}h {entry.duration_minutes % 60}min</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(entry.date), "d MMM", { locale: fr })}</p>
                </div>
              ))}
              {(!timeEntries || timeEntries.length === 0) && (
                <p className="text-center text-muted-foreground py-8">Aucune entrée de temps</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
