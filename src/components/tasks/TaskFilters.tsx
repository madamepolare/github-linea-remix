import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Filter, X, ChevronDown, Circle } from "lucide-react";

interface TaskFiltersProps {
  status: string | null;
  priority: string | null;
  assignee: string | null;
  onStatusChange: (value: string | null) => void;
  onPriorityChange: (value: string | null) => void;
  onAssigneeChange: (value: string | null) => void;
  onClearAll: () => void;
}

const statusOptions = [
  { value: "todo", label: "À faire", color: "#6b7280" },
  { value: "in_progress", label: "En cours", color: "#3b82f6" },
  { value: "review", label: "En revue", color: "#f59e0b" },
  { value: "done", label: "Terminé", color: "#22c55e" },
];

const priorityOptions = [
  { value: "low", label: "Basse", color: "#64748b" },
  { value: "medium", label: "Moyenne", color: "#3b82f6" },
  { value: "high", label: "Haute", color: "#f59e0b" },
  { value: "urgent", label: "Urgente", color: "#ef4444" },
];

export function TaskFilters({
  status,
  priority,
  onStatusChange,
  onPriorityChange,
  onClearAll,
}: TaskFiltersProps) {
  const activeFiltersCount = [status, priority].filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      {/* Status Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={status ? "secondary" : "outline"} 
            size="sm" 
            className={cn(
              "h-8 gap-1.5 text-xs font-medium",
              status && "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            )}
          >
            {status ? (
              <>
                <Circle 
                  className="h-2 w-2 fill-current" 
                  style={{ color: statusOptions.find(o => o.value === status)?.color }}
                />
                {statusOptions.find(o => o.value === status)?.label}
              </>
            ) : (
              <>Statut</>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-40 p-1">
          <div className="flex flex-col">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onStatusChange(status === opt.value ? null : opt.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  status === opt.value 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Circle 
                  className={cn(
                    "h-2.5 w-2.5",
                    status === opt.value && "fill-current"
                  )}
                  style={{ color: opt.color }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Priority Filter Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant={priority ? "secondary" : "outline"} 
            size="sm" 
            className={cn(
              "h-8 gap-1.5 text-xs font-medium",
              priority && "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
            )}
          >
            {priority ? (
              <>
                <Circle 
                  className="h-2 w-2 fill-current" 
                  style={{ color: priorityOptions.find(o => o.value === priority)?.color }}
                />
                {priorityOptions.find(o => o.value === priority)?.label}
              </>
            ) : (
              <>Priorité</>
            )}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-36 p-1">
          <div className="flex flex-col">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onPriorityChange(priority === opt.value ? null : opt.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  priority === opt.value 
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Circle 
                  className={cn(
                    "h-2.5 w-2.5",
                    priority === opt.value && "fill-current"
                  )}
                  style={{ color: opt.color }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filters count & clear */}
      {activeFiltersCount > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Badge variant="secondary" className="h-5 w-5 p-0 justify-center text-2xs">
            {activeFiltersCount}
          </Badge>
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
