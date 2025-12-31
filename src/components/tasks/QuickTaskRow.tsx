import { useState, useRef, useEffect } from "react";
import { useTasks, Task } from "@/hooks/useTasks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickTaskRowProps {
  defaultStatus?: Task["status"];
  onCreated?: () => void;
  className?: string;
}

export function QuickTaskRow({ defaultStatus = "todo", onCreated, className }: QuickTaskRowProps) {
  const { createTask } = useTasks();
  const [isExpanded, setIsExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("medium");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask.mutateAsync({
      title: title.trim(),
      status: defaultStatus,
      priority,
    });

    setTitle("");
    setPriority("medium");
    setIsExpanded(false);
    onCreated?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false);
      setTitle("");
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground",
          "hover:bg-muted/50 rounded-lg transition-colors",
          className
        )}
      >
        <Plus className="h-4 w-4" />
        <span>Ajouter une tâche...</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-2 p-2 bg-muted/30 rounded-lg", className)}>
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Titre de la tâche"
        className="bg-background"
      />
      <div className="flex items-center gap-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as Task["priority"])}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="medium">Moyenne</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpanded(false)}>
          Annuler
        </Button>
        <Button type="submit" size="sm" disabled={!title.trim() || createTask.isPending}>
          {createTask.isPending && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
          Créer
        </Button>
      </div>
    </form>
  );
}
