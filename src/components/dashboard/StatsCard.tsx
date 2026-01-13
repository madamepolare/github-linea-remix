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
  primary: "bg-foreground/5 text-foreground",
  accent: "bg-pastel-lavender text-accent",
  success: "bg-pastel-mint text-success",
  warning: "bg-pastel-peach text-warning",
  info: "bg-pastel-blue text-info",
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-card transition-all duration-300 hover:shadow-pastel-hover hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2 min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {change && (
            <div className="flex items-center gap-2">
              {change.type === "increase" ? (
                <TrendingUp className="h-4 w-4 text-success shrink-0" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive shrink-0" />
              )}
              <span
                className={cn(
                  "text-sm font-medium",
                  change.type === "increase"
                    ? "text-success"
                    : "text-destructive"
                )}
              >
                {change.value}%
              </span>
              <span className="text-sm text-muted-foreground">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", iconColorClasses[iconColor])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </motion.div>
  );
}
