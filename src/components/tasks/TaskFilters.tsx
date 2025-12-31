import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

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

export function TaskFilters({
  status,
  priority,
  assignee,
  onStatusChange,
  onPriorityChange,
  onAssigneeChange,
  onClearAll,
}: TaskFiltersProps) {
  const hasFilters = status || priority || assignee;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <Select value={status || ""} onValueChange={(v) => onStatusChange(v || null)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Tous les statuts</SelectItem>
          {statusOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Priority Filter */}
      <Select value={priority || ""} onValueChange={(v) => onPriorityChange(v || null)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">Toutes priorités</SelectItem>
          {priorityOptions.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Active Filters */}
      {hasFilters && (
        <div className="flex items-center gap-2">
          {status && (
            <Badge variant="secondary" className="gap-1">
              {statusOptions.find((o) => o.value === status)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onStatusChange(null)} />
            </Badge>
          )}
          {priority && (
            <Badge variant="secondary" className="gap-1">
              {priorityOptions.find((o) => o.value === priority)?.label}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onPriorityChange(null)} />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Effacer tout
          </Button>
        </div>
      )}
    </div>
  );
}
