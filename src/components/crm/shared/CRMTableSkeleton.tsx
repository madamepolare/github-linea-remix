import { TableSkeleton, CardSkeleton } from "@/components/ui/patterns";

interface CRMTableSkeletonProps {
  rows?: number;
  columns?: number;
  showCheckbox?: boolean;
}

/**
 * CRM-specific table skeleton
 * Uses the standardized TableSkeleton pattern component
 */
export function CRMTableSkeleton({ 
  rows = 5, 
  columns = 5,
  showCheckbox = true 
}: CRMTableSkeletonProps) {
  // Add 1 to columns if showing checkbox (pattern handles internally)
  return (
    <div className="rounded-md border">
      <TableSkeleton rows={rows} columns={columns} showHeader />
    </div>
  );
}

/**
 * CRM-specific card skeleton for mobile view
 * Uses the standardized CardSkeleton pattern component
 */
export function CRMCardSkeleton({ count = 3 }: { count?: number }) {
  return <CardSkeleton count={count} />;
}
