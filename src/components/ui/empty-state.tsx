import { motion } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  size?: "sm" | "md" | "lg";
}

const illustrations = {
  sm: { iconSize: 28, iconSizeSm: 24, spacing: "py-6 sm:py-8" },
  md: { iconSize: 48, iconSizeSm: 36, spacing: "py-8 sm:py-12" },
  lg: { iconSize: 64, iconSizeSm: 48, spacing: "py-12 sm:py-16" },
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const { iconSize, iconSizeSm, spacing } = illustrations[size];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className={cn(
        "flex flex-col items-center justify-center text-center px-4",
        spacing,
        className
      )}
    >
      {Icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="relative mb-3 sm:mb-4"
        >
          {/* Decorative circles */}
          <div className="absolute inset-0 -m-3 sm:-m-4">
            <div className="absolute inset-0 rounded-full bg-muted/50" />
            <div className="absolute inset-1.5 sm:inset-2 rounded-full bg-muted" />
          </div>
          <div className="relative flex items-center justify-center rounded-full bg-background border border-border p-3 sm:p-4">
            <Icon
              className="text-muted-foreground w-6 h-6 sm:w-12 sm:h-12"
              strokeWidth={1}
            />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
        className="space-y-1.5 sm:space-y-2 max-w-sm"
      >
        <h3 className="text-sm sm:text-base font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </motion.div>

      {action && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className="mt-4 sm:mt-6"
        >
          <Button onClick={action.onClick} size="sm" className="gap-1.5 sm:gap-2 h-8 sm:h-9 text-xs sm:text-sm">
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.5} />
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
