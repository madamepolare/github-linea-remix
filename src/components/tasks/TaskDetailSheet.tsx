import { useState, useEffect } from "react";
import { Task, useTasks } from "@/hooks/useTasks";
import { useTaskComments } from "@/hooks/useTaskComments";
import { useAuth } from "@/contexts/AuthContext";
import { SubtasksManager } from "./SubtasksManager";
import { TaskTimeTracker } from "./TaskTimeTracker";
import { MultiAssigneePicker } from "./MultiAssigneePicker";
import { InlineDatePicker } from "./InlineDatePicker";
import { TagInput } from "./TagInput";
import { MentionInput } from "./MentionInput";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckSquare, Clock, MessageSquare, Save, Trash2, Archive } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

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
];

const priorityOptions = [
  { value: "low", label: "Basse" },
  { value: "medium", label: "Moyenne" },
  { value: "high", label: "Haute" },
  { value: "urgent", label: "Urgente" },
];

export function TaskDetailSheet({ task, open, onOpenChange }: TaskDetailSheetProps) {
  const { activeWorkspace } = useAuth();
  const { updateTask, deleteTask } = useTasks();
  const { comments, createComment } = useTaskComments(task?.id || null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("todo");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [assignedTo, setAssignedTo] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [newComment, setNewComment] = useState("");
  const [commentMentions, setCommentMentions] = useState<string[]>([]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || "");
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.due_date ? new Date(task.due_date) : null);
      setStartDate(task.start_date ? new Date(task.start_date) : null);
      setAssignedTo(task.assigned_to || []);
      setTags(task.tags || []);
      setEstimatedHours(task.estimated_hours?.toString() || "");
    }
  }, [task]);

  const handleSave = () => {
    if (!task) return;
    updateTask.mutate({
      id: task.id,
      title,
      description,
      status,
      priority,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
      start_date: startDate ? format(startDate, "yyyy-MM-dd") : null,
      assigned_to: assignedTo.length > 0 ? assignedTo : null,
      tags: tags.length > 0 ? tags : null,
      estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
    });
    toast.success("Tâche mise à jour");
  };

  const handleArchive = () => {
    if (!task) return;
    updateTask.mutate({ id: task.id, status: "archived" as Task["status"] });
    toast.success("Tâche archivée");
    onOpenChange(false);
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
    setCommentMentions([]);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Détails de la tâche</SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="details" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="details">Détails</TabsTrigger>
            <TabsTrigger value="subtasks">
              <CheckSquare className="h-3 w-3 mr-1" />
              Sous-tâches
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-3 w-3 mr-1" />
              Temps
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="h-3 w-3 mr-1" />
              {comments?.length || 0}
            </TabsTrigger>
          </TabsList>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="space-y-2">
              <Label>Titre</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <InlineDatePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Début"
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label>Échéance</Label>
                <InlineDatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  placeholder="Échéance"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assignés</Label>
              <MultiAssigneePicker
                value={assignedTo}
                onChange={setAssignedTo}
                className="w-full"
              />
            </div>

            <div className="space-y-2">
              <Label>Estimation (heures)</Label>
              <Input
                type="number"
                step="0.5"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="4"
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <TagInput value={tags} onChange={setTags} />
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />Enregistrer
              </Button>
              <Button variant="outline" size="icon" onClick={handleArchive} title="Archiver">
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="destructive" size="icon" onClick={handleDelete} title="Supprimer">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </TabsContent>

          {/* Subtasks Tab */}
          <TabsContent value="subtasks" className="space-y-4">
            {activeWorkspace && (
              <SubtasksManager taskId={task.id} workspaceId={activeWorkspace.id} />
            )}
          </TabsContent>

          {/* Time Tab */}
          <TabsContent value="time" className="space-y-4">
            <TaskTimeTracker taskId={task.id} />
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4">
            <div className="space-y-2">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onMentionsChange={setCommentMentions}
                placeholder="Ajouter un commentaire... Utilisez @ pour mentionner"
                rows={2}
              />
              <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Commenter
              </Button>
            </div>

            <div className="space-y-3">
              {comments?.map((comment) => (
                <div key={comment.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                  <p className="text-sm whitespace-pre-wrap">
                    {comment.content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1")}
                  </p>
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
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
