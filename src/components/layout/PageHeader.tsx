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
      className="flex-shrink-0 bg-card border-b border-border"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Main Row: Title + Actions */}
      <motion.div
        className="px-4 sm:px-6 py-4 sm:py-5"
        variants={rowVariants}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {Icon && (
              <motion.div
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted/80 flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.15 }}
              >
                <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-foreground/70" strokeWidth={1.5} />
              </motion.div>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight truncate">
                {title}
              </h1>
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions + Primary Button */}
          <div className="flex items-center gap-2 sm:gap-3 justify-end sm:justify-start">
            {actions}
            
            {primaryAction && (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={primaryAction.onClick}
                  size="sm"
                  className="h-8 sm:h-9 gap-1.5 px-3 sm:px-4 font-medium"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  <span className="hidden sm:inline">{primaryAction.label}</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs Row (optional) */}
      {hasTabs && (
        <motion.div
          className="px-4 sm:px-6 pb-0 overflow-x-auto"
          variants={rowVariants}
        >
          {tabs}
        </motion.div>
      )}

      {/* Filters Row (optional) */}
      {hasFilters && (
        <motion.div
          className="px-4 sm:px-6 py-3 border-t border-border/50 bg-muted/20"
          variants={rowVariants}
        >
          {filters}
        </motion.div>
      )}
    </motion.header>
  );
}
