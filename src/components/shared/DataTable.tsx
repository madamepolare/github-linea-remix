import { useState, useMemo, ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DataTableColumn<T> {
  /** Unique key for the column */
  id: string;
  /** Header label */
  header: string | ReactNode;
  /** Property accessor - can be a key of T or a function */
  accessor?: keyof T | ((item: T) => any);
  /** Custom render function for the cell */
  render?: (item: T, index: number) => ReactNode;
  /** Whether this column is sortable */
  sortable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Column width class (Tailwind) */
  width?: string;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Additional header class */
  headerClassName?: string;
  /** Additional cell class */
  cellClassName?: string;
  /** Hide on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Array of data to display */
  data: T[];
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Function to get unique key for each row */
  getRowKey: (item: T) => string;
  /** Loading state */
  isLoading?: boolean;
  /** Number of skeleton rows to show when loading */
  loadingRowCount?: number;
  /** Callback when a row is clicked */
  onRowClick?: (item: T) => void;
  /** Initial sort column id */
  defaultSortColumn?: string;
  /** Initial sort direction */
  defaultSortDirection?: "asc" | "desc";
  /** Callback when sort changes */
  onSortChange?: (columnId: string, direction: "asc" | "desc") => void;
  /** Empty state content */
  emptyState?: ReactNode;
  /** Additional class for the table container */
  className?: string;
  /** Additional class for table rows */
  rowClassName?: string | ((item: T) => string);
  /** Whether to enable hover effect on rows */
  hoverRows?: boolean;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Max height for scrollable table */
  maxHeight?: string;
  /** Custom header renderer (for adding filters, etc.) */
  headerActions?: ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  getRowKey,
  isLoading = false,
  loadingRowCount = 5,
  onRowClick,
  defaultSortColumn,
  defaultSortDirection = "asc",
  onSortChange,
  emptyState,
  className,
  rowClassName,
  hoverRows = true,
  stickyHeader = false,
  maxHeight,
  headerActions,
}: DataTableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | undefined>(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">(defaultSortDirection);

  const handleSort = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column?.sortable) return;

    let newDirection: "asc" | "desc" = "asc";
    if (sortColumn === columnId) {
      newDirection = sortDirection === "asc" ? "desc" : "asc";
    }

    setSortColumn(columnId);
    setSortDirection(newDirection);
    onSortChange?.(columnId, newDirection);
  };

  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const column = columns.find((c) => c.id === sortColumn);
    if (!column) return data;

    return [...data].sort((a, b) => {
      let comparison = 0;

      if (column.sortFn) {
        comparison = column.sortFn(a, b);
      } else if (column.accessor) {
        const aVal = typeof column.accessor === "function" 
          ? column.accessor(a) 
          : a[column.accessor];
        const bVal = typeof column.accessor === "function" 
          ? column.accessor(b) 
          : b[column.accessor];

        if (aVal === null || aVal === undefined) comparison = 1;
        else if (bVal === null || bVal === undefined) comparison = -1;
        else if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortColumn, sortDirection, columns]);

  const getCellValue = (item: T, column: DataTableColumn<T>) => {
    if (column.render) {
      return column.render(item, data.indexOf(item));
    }
    if (column.accessor) {
      const value = typeof column.accessor === "function"
        ? column.accessor(item)
        : item[column.accessor];
      return value ?? "-";
    }
    return "-";
  };

  const getRowClasses = (item: T) => {
    const base = cn(
      onRowClick && "cursor-pointer",
      hoverRows && "hover:bg-muted/50",
    );
    if (typeof rowClassName === "function") {
      return cn(base, rowClassName(item));
    }
    return cn(base, rowClassName);
  };

  if (isLoading) {
    return (
      <div className={cn("rounded-lg border", className)}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.width,
                    column.headerClassName,
                    column.hideOnMobile && "hidden md:table-cell",
                  )}
                >
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: loadingRowCount }).map((_, i) => (
              <TableRow key={i}>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(column.hideOnMobile && "hidden md:table-cell")}
                  >
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (data.length === 0 && emptyState) {
    return (
      <div className={cn("rounded-lg border", className)}>
        {headerActions && (
          <div className="px-4 py-3 border-b">{headerActions}</div>
        )}
        <div className="p-8 text-center text-muted-foreground">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border", className)}>
      {headerActions && (
        <div className="px-4 py-3 border-b">{headerActions}</div>
      )}
      <div
        className={cn(
          "relative overflow-auto",
          maxHeight && `max-h-[${maxHeight}]`,
        )}
      >
        <Table>
          <TableHeader className={cn(stickyHeader && "sticky top-0 bg-background z-10")}>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.id}
                  className={cn(
                    column.width,
                    column.headerClassName,
                    column.hideOnMobile && "hidden md:table-cell",
                    column.align === "center" && "text-center",
                    column.align === "right" && "text-right",
                    column.sortable && "cursor-pointer select-none hover:text-foreground",
                  )}
                  onClick={() => column.sortable && handleSort(column.id)}
                >
                  <div className={cn(
                    "flex items-center gap-1.5",
                    column.align === "center" && "justify-center",
                    column.align === "right" && "justify-end",
                  )}>
                    {typeof column.header === "string" ? (
                      <span>{column.header}</span>
                    ) : (
                      column.header
                    )}
                    {column.sortable && (
                      <span className="flex-shrink-0">
                        {sortColumn === column.id ? (
                          sortDirection === "asc" ? (
                            <ArrowUp className="h-3 w-3" />
                          ) : (
                            <ArrowDown className="h-3 w-3" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3 w-3 opacity-30" />
                        )}
                      </span>
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((item) => (
              <TableRow
                key={getRowKey(item)}
                className={getRowClasses(item)}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    className={cn(
                      column.cellClassName,
                      column.hideOnMobile && "hidden md:table-cell",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                    )}
                  >
                    {getCellValue(item, column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Helper component for sortable headers with custom content
export function SortableHeader({
  children,
  isSorted,
  direction,
  onClick,
  className,
}: {
  children: ReactNode;
  isSorted?: boolean;
  direction?: "asc" | "desc";
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors select-none",
        className,
      )}
      onClick={onClick}
    >
      {children}
      {isSorted ? (
        direction === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </div>
  );
}
