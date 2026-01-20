import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LayoutGrid, LayoutList, Kanban, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "table" | "cards" | "list" | "pipeline" | "kanban";

interface ViewModeOption {
  value: ViewMode;
  icon: React.ElementType;
  label: string;
}

const defaultOptions: ViewModeOption[] = [
  { value: "table", icon: LayoutList, label: "Vue liste" },
  { value: "cards", icon: LayoutGrid, label: "Vue cartes" },
];

const kanbanOptions: ViewModeOption[] = [
  { value: "pipeline", icon: Kanban, label: "Vue pipeline" },
  { value: "list", icon: LayoutList, label: "Vue liste" },
];

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  options?: ViewModeOption[];
  variant?: "default" | "kanban";
  className?: string;
}

export function ViewModeToggle({ 
  value, 
  onChange, 
  options,
  variant = "default",
  className 
}: ViewModeToggleProps) {
  const displayOptions = options || (variant === "kanban" ? kanbanOptions : defaultOptions);

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as ViewMode)}
      className={cn("border rounded-lg p-0.5", className)}
    >
      {displayOptions.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          aria-label={option.label}
          className="h-8 w-8 p-0 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          <option.icon className="h-4 w-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
