import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  /** Page icon */
  icon?: LucideIcon;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (view switchers, etc.) */
  actions?: ReactNode;
  /** Tabs slot (navigation tabs) */
  tabs?: ReactNode;
  /** Filters slot (filters, search, etc.) */
  filters?: ReactNode;
  /** Primary action button label */
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.01,
    },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.2,
      ease: "easeOut",
    },
  },
};

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  tabs,
  filters,
  primaryAction,
}: PageHeaderProps) {
  const hasTabs = !!tabs;
  const hasFilters = !!filters;

  return (
    <motion.header
      className="flex-shrink-0 bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Row: Title + Actions */}
      <motion.div
        className="px-6 sm:px-8 py-6 sm:py-8"
        variants={rowVariants}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          {/* Left: Title only - Qonto style clean headers */}
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-1">
                {description}
              </p>
            )}
          </div>

          {/* Right: Actions + Primary Button */}
          <div className="flex items-center gap-3 justify-end sm:justify-start flex-shrink-0">
            {actions}
            
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                size="default"
                className="gap-2"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                {primaryAction.label}
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs Row (optional) */}
      {hasTabs && (
        <motion.div
          className="px-6 sm:px-8 border-b border-border overflow-x-auto"
          variants={rowVariants}
        >
          {tabs}
        </motion.div>
      )}

      {/* Filters Row (optional) */}
      {hasFilters && (
        <motion.div
          className="px-6 sm:px-8 py-4 border-b border-border bg-muted/30"
          variants={rowVariants}
        >
          {filters}
        </motion.div>
      )}
    </motion.header>
  );
}
