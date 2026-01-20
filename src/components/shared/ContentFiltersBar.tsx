import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SearchFilter } from "./filters/SearchFilter";
import { cn } from "@/lib/utils";

interface ContentFiltersBarProps {
  /** Search configuration */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
  };
  /** Filter buttons/popovers */
  filters?: ReactNode;
  /** View mode toggle */
  viewToggle?: ReactNode;
  /** Actions on the right side */
  actions?: ReactNode;
  /** Secondary bar below (e.g., alphabet filter, status tabs) */
  secondaryBar?: ReactNode;
  /** Number of active filters */
  activeFiltersCount?: number;
  /** Clear all filters callback */
  onClearAll?: () => void;
  /** Custom class */
  className?: string;
}

export function ContentFiltersBar({
  search,
  filters,
  viewToggle,
  actions,
  secondaryBar,
  activeFiltersCount = 0,
  onClearAll,
  className,
}: ContentFiltersBarProps) {
  const hasActiveFilters = activeFiltersCount > 0 || (search?.value && search.value.length > 0);

  return (
    <div className={cn("space-y-2", className)}>
      {/* Primary bar */}
      <div className="flex items-center gap-1.5">
        {/* View toggle on the left */}
        {viewToggle}

        {/* Search */}
        {search && (
          <SearchFilter
            value={search.value}
            onChange={search.onChange}
            placeholder={search.placeholder}
            className={cn("flex-1 max-w-xs", search.className)}
          />
        )}

        {/* Separator */}
        {(search || viewToggle) && filters && (
          <div className="h-6 w-px bg-border mx-0.5" />
        )}

        {/* Filter buttons */}
        {filters && (
          <div className="flex items-center gap-1">
            {filters}
          </div>
        )}

        {/* Clear all button */}
        {hasActiveFilters && onClearAll && (
          <>
            <div className="h-6 w-px bg-border mx-0.5" />
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon-sm"
                    onClick={onClearAll}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Effacer les filtres {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions on the right */}
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>

      {/* Secondary bar */}
      {secondaryBar}
    </div>
  );
}
