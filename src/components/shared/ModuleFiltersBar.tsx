import { ReactNode } from "react";
import { ContentFiltersBar } from "./ContentFiltersBar";

interface ModuleFiltersBarProps {
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: ReactNode;
  viewToggle?: ReactNode;
  actions?: ReactNode;
  secondaryBar?: ReactNode;
  className?: string;
}

/**
 * Wrapper component for backwards compatibility.
 * Use ContentFiltersBar directly for new components.
 */
export function ModuleFiltersBar({
  search,
  filters,
  viewToggle,
  actions,
  secondaryBar,
  className,
}: ModuleFiltersBarProps) {
  return (
    <ContentFiltersBar
      search={search}
      filters={filters}
      viewToggle={viewToggle}
      actions={actions}
      secondaryBar={secondaryBar}
      className={className}
    />
  );
}
