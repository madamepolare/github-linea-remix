import { useState, useCallback, useMemo } from "react";

type SortDirection = "asc" | "desc";

interface UseTableSortOptions<T> {
  defaultColumn?: string;
  defaultDirection?: SortDirection;
  onSortChange?: (column: string, direction: SortDirection) => void;
}

interface UseTableSortReturn<T> {
  sortColumn: string | null;
  sortDirection: SortDirection;
  handleSort: (column: string) => void;
  setSort: (column: string, direction: SortDirection) => void;
  clearSort: () => void;
  sortData: (data: T[], getAccessor: (item: T, column: string) => any) => T[];
  getSortIcon: (column: string) => "asc" | "desc" | null;
}

export function useTableSort<T>({
  defaultColumn,
  defaultDirection = "asc",
  onSortChange,
}: UseTableSortOptions<T> = {}): UseTableSortReturn<T> {
  const [sortColumn, setSortColumn] = useState<string | null>(
    defaultColumn ?? null
  );
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultDirection);

  const handleSort = useCallback(
    (column: string) => {
      let newDirection: SortDirection = "asc";

      if (sortColumn === column) {
        newDirection = sortDirection === "asc" ? "desc" : "asc";
      }

      setSortColumn(column);
      setSortDirection(newDirection);
      onSortChange?.(column, newDirection);
    },
    [sortColumn, sortDirection, onSortChange]
  );

  const setSort = useCallback(
    (column: string, direction: SortDirection) => {
      setSortColumn(column);
      setSortDirection(direction);
      onSortChange?.(column, direction);
    },
    [onSortChange]
  );

  const clearSort = useCallback(() => {
    setSortColumn(null);
    setSortDirection("asc");
  }, []);

  const sortData = useCallback(
    (data: T[], getAccessor: (item: T, column: string) => any): T[] => {
      if (!sortColumn) return data;

      return [...data].sort((a, b) => {
        const aValue = getAccessor(a, sortColumn);
        const bValue = getAccessor(b, sortColumn);

        // Handle null/undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortDirection === "asc" ? 1 : -1;
        if (bValue == null) return sortDirection === "asc" ? -1 : 1;

        // Handle different types
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue, "fr", {
            sensitivity: "base",
          });
          return sortDirection === "asc" ? comparison : -comparison;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return sortDirection === "asc"
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }

        // Default comparison
        const aStr = String(aValue);
        const bStr = String(bValue);
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    },
    [sortColumn, sortDirection]
  );

  const getSortIcon = useCallback(
    (column: string): "asc" | "desc" | null => {
      if (sortColumn !== column) return null;
      return sortDirection;
    },
    [sortColumn, sortDirection]
  );

  return {
    sortColumn,
    sortDirection,
    handleSort,
    setSort,
    clearSort,
    sortData,
    getSortIcon,
  };
}
