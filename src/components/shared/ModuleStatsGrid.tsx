import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
  icon: LucideIcon;
  iconColor?: "primary" | "blue" | "green" | "amber" | "purple" | "rose";
  change?: {
    value: string;
    type: "positive" | "negative" | "neutral";
  };
}

interface ModuleStatsGridProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const iconColorClasses: Record<string, string> = {
  primary: "bg-primary/10 text-primary",
  blue: "bg-blue-500/10 text-blue-500",
  green: "bg-green-500/10 text-green-500",
  amber: "bg-amber-500/10 text-amber-500",
  purple: "bg-purple-500/10 text-purple-500",
  rose: "bg-rose-500/10 text-rose-500",
};

export function ModuleStatsGrid({ stats, columns = 4, className }: ModuleStatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const colorClass = iconColorClasses[stat.iconColor || "primary"];

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", colorClass)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground truncate">{stat.label}</p>
                  </div>
                  {stat.change && (
                    <span
                      className={cn(
                        "text-xs font-medium",
                        stat.change.type === "positive" && "text-green-500",
                        stat.change.type === "negative" && "text-rose-500",
                        stat.change.type === "neutral" && "text-muted-foreground"
                      )}
                    >
                      {stat.change.value}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
