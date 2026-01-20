import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusOption {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
  color?: string;
}

interface StatusTabsProps {
  options: StatusOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function StatusTabs({ options, value, onChange, className }: StatusTabsProps) {
  return (
    <div className={cn("flex items-center gap-1 border-b", className)}>
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            value === option.id
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          {option.icon && <option.icon className="h-3.5 w-3.5" />}
          {option.label}
          {option.count !== undefined && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {option.count}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
}
