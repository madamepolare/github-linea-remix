import { ReactNode } from "react";
import { motion, Variants } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  /** Page icon */
  icon?: LucideIcon;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (buttons, view switchers, etc.) */
  actions?: ReactNode;
  /** Tabs slot (navigation tabs) */
  tabs?: ReactNode;
  /** Filters slot (filters, search, etc.) */
  filters?: ReactNode;
  /** Breadcrumb slot */
  breadcrumb?: ReactNode;
  /** Additional metadata (date, status, etc.) */
  metadata?: ReactNode;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02,
    },
  },
};

const rowVariants: Variants = {
  hidden: { opacity: 0, y: -8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
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
  breadcrumb,
  metadata,
}: PageHeaderProps) {
  const hasBreadcrumb = !!breadcrumb;
  const hasTabs = !!tabs;
  const hasFilters = !!filters;
  const hasMetadata = !!metadata;

  return (
    <motion.header
      className="flex-shrink-0 bg-background"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Row 1: Breadcrumb (optional) */}
      {hasBreadcrumb && (
        <motion.div
          className="px-6 pt-4 pb-2 border-b border-border/50"
          variants={rowVariants}
        >
          {breadcrumb}
        </motion.div>
      )}

      {/* Row 2: Title + Actions (main row) */}
      <motion.div
        className="px-6 py-4 border-b border-border"
        variants={rowVariants}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon + Title + Description */}
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <motion.div
                className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-5 w-5 text-background" />
              </motion.div>
            )}
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-foreground truncate">
                {title}
              </h1>
              {description && (
                <p className="text-sm text-muted-foreground truncate">
                  {description}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {actions && (
            <motion.div
              className="flex items-center gap-3 flex-shrink-0"
              variants={rowVariants}
            >
              {actions}
            </motion.div>
          )}
        </div>

        {/* Metadata (optional, below title) */}
        {hasMetadata && (
          <motion.div className="mt-3" variants={rowVariants}>
            {metadata}
          </motion.div>
        )}
      </motion.div>

      {/* Row 3: Tabs (optional) */}
      {hasTabs && (
        <motion.div
          className="px-6 py-3 border-b border-border"
          variants={rowVariants}
        >
          {tabs}
        </motion.div>
      )}

      {/* Row 4: Filters (optional) */}
      {hasFilters && (
        <motion.div
          className="px-6 py-3 border-b border-border bg-muted/30"
          variants={rowVariants}
        >
          {filters}
        </motion.div>
      )}
    </motion.header>
  );
}

/* 
 * Sub-components for composable header sections
 */

interface PageHeaderActionsProps {
  children: ReactNode;
}

export function PageHeaderActions({ children }: PageHeaderActionsProps) {
  return <div className="flex items-center gap-3">{children}</div>;
}

interface PageHeaderTabsProps {
  children: ReactNode;
}

export function PageHeaderTabs({ children }: PageHeaderTabsProps) {
  return <div className="flex items-center">{children}</div>;
}

interface PageHeaderFiltersProps {
  children: ReactNode;
}

export function PageHeaderFilters({ children }: PageHeaderFiltersProps) {
  return <div className="flex items-center gap-3 flex-wrap">{children}</div>;
}

interface PageHeaderMetadataProps {
  children: ReactNode;
}

export function PageHeaderMetadata({ children }: PageHeaderMetadataProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-muted-foreground">
      {children}
    </div>
  );
}
