import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

/* =============================================================================
   STANDARD CARD COMPONENT
   Enforces consistent card styling across the application.
   
   PADDING GUIDELINES:
   - compact: Dense lists, table rows, small items (12px)
   - default: Standard cards, forms, content (16px)
   - spacious: Hero cards, prominent sections (24px)
   ============================================================================= */

export type CardPadding = "compact" | "default" | "spacious" | "none";

interface StandardCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Card padding preset */
  padding?: CardPadding;
  /** Optional card title */
  title?: React.ReactNode;
  /** Optional card description */
  description?: React.ReactNode;
  /** Optional icon to display with title */
  icon?: React.ReactNode;
  /** Optional footer content */
  footer?: React.ReactNode;
  /** Optional actions in header (right side) */
  headerActions?: React.ReactNode;
  /** Whether the card is interactive (adds hover effect) */
  interactive?: boolean;
  /** Whether to show border */
  bordered?: boolean;
  /** Loading state */
  loading?: boolean;
}

const paddingClasses: Record<CardPadding, string> = {
  none: "p-0",
  compact: "p-3",
  default: "p-4",
  spacious: "p-6",
};

export function StandardCard({
  padding = "default",
  title,
  description,
  icon,
  footer,
  headerActions,
  interactive = false,
  bordered = true,
  loading = false,
  className,
  children,
  ...props
}: StandardCardProps) {
  const hasHeader = title || description || icon || headerActions;

  return (
    <Card
      className={cn(
        "bg-card",
        bordered && "border",
        interactive && "cursor-pointer transition-shadow hover:shadow-card-hover",
        className
      )}
      {...props}
    >
      {hasHeader && (
        <CardHeader className={cn(paddingClasses[padding], "pb-0")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {icon && (
                <div className="flex-shrink-0 text-muted-foreground">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                {title && (
                  <CardTitle className="text-base font-semibold truncate">
                    {title}
                  </CardTitle>
                )}
                {description && (
                  <CardDescription className="mt-1">
                    {description}
                  </CardDescription>
                )}
              </div>
            </div>
            {headerActions && (
              <div className="flex-shrink-0">
                {headerActions}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent 
        className={cn(
          paddingClasses[padding],
          hasHeader && "pt-4"
        )}
      >
        {loading ? (
          <div className="space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        ) : (
          children
        )}
      </CardContent>

      {footer && (
        <CardFooter 
          className={cn(
            paddingClasses[padding], 
            "pt-0 border-t mt-4"
          )}
        >
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}

// Convenience variants for common use cases

export function CompactCard(props: Omit<StandardCardProps, "padding">) {
  return <StandardCard padding="compact" {...props} />;
}

export function SpaciousCard(props: Omit<StandardCardProps, "padding">) {
  return <StandardCard padding="spacious" {...props} />;
}

export function InteractiveCard(props: Omit<StandardCardProps, "interactive">) {
  return <StandardCard interactive {...props} />;
}

// Stats card for dashboard metrics
interface StatsCardProps {
  title: string;
  value: React.ReactNode;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label?: string;
  };
  className?: string;
}

export function StatsCard({ title, value, description, icon, trend, className }: StatsCardProps) {
  return (
    <StandardCard padding="default" className={className}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
          {trend && (
            <p className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "text-success" : trend.value < 0 ? "text-destructive" : "text-muted-foreground"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
              {trend.label && ` ${trend.label}`}
            </p>
          )}
        </div>
        {icon && (
          <div className="rounded-lg bg-muted p-2 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
    </StandardCard>
  );
}
