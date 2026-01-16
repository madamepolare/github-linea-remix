import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (view switchers, etc.) */
  actions?: ReactNode;
  /** Filters slot (filters, search, etc.) */
  filters?: ReactNode;
  /** Primary action button label - now handled by TopBar, kept for backwards compat */
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
  title,
  description,
  actions,
  filters,
  primaryAction,
}: PageHeaderProps) {
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
        className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4"
        variants={rowVariants}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Title */}
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Right: Actions + Primary Button (backwards compat) */}
          <div className="flex items-center gap-2 sm:gap-3 justify-start sm:justify-end flex-shrink-0 overflow-x-auto scrollbar-hide">
            {actions}
            
            {primaryAction && (
              <Button
                onClick={primaryAction.onClick}
                size="sm"
                className="gap-2 shrink-0"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                <span className="hidden sm:inline">{primaryAction.label}</span>
                <span className="sm:hidden">Ajouter</span>
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters Row (optional) */}
      {hasFilters && (
        <motion.div
          className="px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-b border-border bg-muted/30 overflow-x-auto scrollbar-hide"
          variants={rowVariants}
        >
          {filters}
        </motion.div>
      )}
    </motion.header>
  );
}
