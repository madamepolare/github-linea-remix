import { motion } from "framer-motion";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: "increase" | "decrease";
  };
  icon: LucideIcon;
  iconColor?: "primary" | "accent" | "success" | "warning" | "info";
  delay?: number;
}

const iconColorClasses = {
  primary: "bg-primary/10 text-primary",
  accent: "bg-accent/10 text-accent",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
};

export function StatsCard({
  title,
  value,
  change,
  icon: Icon,
  iconColor = "primary",
  delay = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-elegant hover:border-border/80"
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/30 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex items-start justify-between gap-3">
        <div className="space-y-1 sm:space-y-2 min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="font-display text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
              {change.type === "increase" ? (
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success shrink-0" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
              )}
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  change.type === "increase"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {change.value}%
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">vs last month</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 shrink-0",
            iconColorClasses[iconColor]
          )}
        >
          <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
        </div>
      </div>
    </motion.div>
  );
}
