import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ModuleFiltersBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  viewToggle?: ReactNode;
  className?: string;
}

export function ModuleFiltersBar({
  search,
  filters,
  viewToggle,
  className,
}: ModuleFiltersBarProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center gap-3", className)}>
      {viewToggle}
      {search && (
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder || "Rechercher..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="pl-9"
          />
        </div>
      )}
      {filters}
    </div>
  );
}
