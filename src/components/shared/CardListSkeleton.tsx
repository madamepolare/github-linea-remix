import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
  showBadge?: boolean;
  showMetadata?: boolean;
  className?: string;
}

export function CardListSkeleton({
  count = 3,
  showAvatar = true,
  showBadge = true,
  showMetadata = true,
  className,
}: CardListSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-card">
          <div className="flex items-start gap-3">
            {showAvatar && (
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
              </div>
              <Skeleton className="h-4 w-24" />
              {showMetadata && (
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface GridCardSkeletonProps {
  count?: number;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function GridCardSkeleton({
  count = 6,
  columns = 3,
  className,
}: GridCardSkeletonProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-lg border bg-card space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
