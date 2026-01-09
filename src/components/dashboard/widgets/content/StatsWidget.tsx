import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsWidgetProps {
  stats: {
    label: string;
    value: string | number;
    change?: number;
    icon: LucideIcon;
    color: string;
  }[];
  isLoading?: boolean;
  columns?: 2 | 4;
}

export function StatsWidget({ stats, isLoading, columns = 2 }: StatsWidgetProps) {
  if (isLoading) {
    return (
      <div className={cn("grid gap-4", columns === 4 ? "grid-cols-4" : "grid-cols-2")}>
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid gap-4", columns === 4 ? "grid-cols-4" : "grid-cols-2")}>
      {stats.map((stat, index) => (
        <div key={index} className="space-y-1">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-md", stat.color)}>
              <stat.icon className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{stat.value}</span>
            {stat.change !== undefined && (
              <span
                className={cn(
                  "text-xs flex items-center gap-0.5",
                  stat.change >= 0 ? "text-success" : "text-destructive"
                )}
              >
                {stat.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {Math.abs(stat.change)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
