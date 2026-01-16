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
    <div className={cn("flex items-center gap-2 sm:gap-3", className)}>
      {viewToggle}
      {search && (
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={search.placeholder || "Rechercher..."}
            value={search.value}
            onChange={(e) => search.onChange(e.target.value)}
            className="pl-8 sm:pl-9 h-9 text-sm"
          />
        </div>
      )}
      <div className="flex items-center gap-1.5 shrink-0">
        {filters}
      </div>
    </div>
  );
}
