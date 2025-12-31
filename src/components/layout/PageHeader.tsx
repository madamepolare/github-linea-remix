import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  /** Page icon */
  icon?: LucideIcon;
  /** Page title */
  title: string;
  /** Page description */
  description?: string;
  /** Actions slot (buttons, etc.) */
  actions?: ReactNode;
  /** Tabs slot */
  tabs?: ReactNode;
  /** Additional content below title row */
  children?: ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  description,
  actions,
  tabs,
  children,
}: PageHeaderProps) {
  return (
    <header className="flex-shrink-0 border-b border-border bg-background">
      {/* Title Row */}
      <div className="px-6 py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Left: Icon + Title */}
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="h-10 w-10 rounded-lg bg-foreground flex items-center justify-center">
                <Icon className="h-5 w-5 text-background" />
              </div>
            )}
            <div>
              <h1 className="text-xl font-semibold text-foreground">{title}</h1>
              {description && (
                <p className="text-sm text-muted-foreground">{description}</p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          {actions && (
            <div className="flex items-center gap-3">{actions}</div>
          )}
        </div>
      </div>

      {/* Tabs Row (optional) */}
      {tabs && (
        <div className="px-6 pb-4">
          {tabs}
        </div>
      )}

      {/* Additional Content (filters, etc.) */}
      {children && (
        <div className="px-6 pb-4">
          {children}
        </div>
      )}
    </header>
  );
}
