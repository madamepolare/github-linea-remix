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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  CheckSquare, 
  Clock, 
  MessageSquare, 
  Trash2, 
  Archive, 
  Calendar,
  User,
  Flag,
  Tag,
  FileText,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusOptions = [
  { value: "todo", label: "To Do", color: "bg-muted" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500" },
  { value: "review", label: "Review", color: "bg-amber-500" },
  { value: "done", label: "Done", color: "bg-green-500" },
];

const priorityOptions = [
  { value: "low", label: "Low", color: "text-muted-foreground" },
  { value: "medium", label: "Medium", color: "text-foreground" },
  { value: "high", label: "High", color: "text-amber-600" },
  { value: "urgent", label: "Urgent", color: "text-destructive" },
];

export function TaskDetailModal({ task, open, onOpenChange }: TaskDetailModalProps) {
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
  const [activeTab, setActiveTab] = useState<"subtasks" | "time">("subtasks");

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

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && task) {
      // Auto-save on close
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
    }
    onOpenChange(isOpen);
  };

  const handleArchive = () => {
    if (!task) return;
    updateTask.mutate({ id: task.id, status: "archived" as Task["status"] });
    toast.success("Task archived");
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

  const currentStatus = statusOptions.find(s => s.value === status);
  const currentPriority = priorityOptions.find(p => p.value === priority);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0">
        <div className="flex h-full max-h-[90vh]">
          {/* Left Column - Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <DialogHeader className="px-6 py-4 border-b border-border">
              <DialogTitle className="sr-only">Task Details</DialogTitle>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Task title..."
              />
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  Description
                </div>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  className="min-h-[100px] resize-none border-border"
                />
              </div>

              {/* Subtasks / Time Toggle */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("subtasks")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      activeTab === "subtasks" 
                        ? "bg-foreground text-background" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <CheckSquare className="h-4 w-4" />
                    Subtasks
                  </button>
                  <button
                    onClick={() => setActiveTab("time")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                      activeTab === "time" 
                        ? "bg-foreground text-background" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Clock className="h-4 w-4" />
                    Time
                  </button>
                </div>

                {activeTab === "subtasks" && activeWorkspace && (
                  <SubtasksManager taskId={task.id} workspaceId={activeWorkspace.id} />
                )}
                {activeTab === "time" && (
                  <TaskTimeTracker taskId={task.id} />
                )}
              </div>

              {/* Comments */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({comments?.length || 0})
                </div>

                <div className="flex gap-2">
                  <MentionInput
                    value={newComment}
                    onChange={setNewComment}
                    onMentionsChange={setCommentMentions}
                    placeholder="Add a comment... Use @ to mention"
                    rows={2}
                    className="flex-1"
                  />
                  <Button 
                    size="icon" 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim()}
                    className="shrink-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {comments?.map((comment) => (
                    <div key={comment.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content.replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "@$1")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {comment.created_at && format(new Date(comment.created_at), "d MMM yyyy 'at' HH:mm", { locale: fr })}
                      </p>
                    </div>
                  ))}
                  {(!comments || comments.length === 0) && (
                    <p className="text-center text-muted-foreground text-sm py-4">No comments yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Metadata */}
          <div className="w-72 bg-surface border-l border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 justify-end">
                <Button variant="outline" size="icon" onClick={handleArchive} title="Archive" className="h-8 w-8">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={handleDelete} title="Delete" className="h-8 w-8 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Status */}
              <div className="space-y-2">
                <label className="label-sm flex items-center gap-1.5">
                  <div className={cn("h-2 w-2 rounded-full", currentStatus?.color)} />
                  Status
                </label>
                <Select value={status} onValueChange={(v) => setStatus(v as Task["status"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <div className={cn("h-2 w-2 rounded-full", opt.color)} />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="label-sm flex items-center gap-1.5">
                  <Flag className="h-3 w-3" />
                  Priority
                </label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priorityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <span className={opt.color}>{opt.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Assignees */}
              <div className="space-y-2">
                <label className="label-sm flex items-center gap-1.5">
                  <User className="h-3 w-3" />
                  Assignees
                </label>
                <MultiAssigneePicker
                  value={assignedTo}
                  onChange={setAssignedTo}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Dates */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="label-sm flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Start Date
                  </label>
                  <InlineDatePicker
                    value={startDate}
                    onChange={setStartDate}
                    placeholder="Set start date"
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <label className="label-sm flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Due Date
                  </label>
                  <InlineDatePicker
                    value={dueDate}
                    onChange={setDueDate}
                    placeholder="Set due date"
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              {/* Estimation */}
              <div className="space-y-2">
                <label className="label-sm flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Estimation (hours)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="4"
                  className="h-9"
                />
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-2">
                <label className="label-sm flex items-center gap-1.5">
                  <Tag className="h-3 w-3" />
                  Tags
                </label>
                <TagInput value={tags} onChange={setTags} />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
