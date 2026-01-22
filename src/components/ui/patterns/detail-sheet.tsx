import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/* =============================================================================
   DETAIL SHEET COMPONENT
   Standardized sheet for viewing item details.
   
   USAGE GUIDELINES:
   - Use for: Viewing details, read-only information, previews
   - Do NOT use for: Creating/editing (use FormDialog), confirmations (use ConfirmDialog)
   
   WIDTH PRESETS:
   - sm: Simple details (400px)
   - md: Standard details (500px) - DEFAULT
   - lg: Complex details, multiple sections (600px)
   - xl: Full details with sidebar (700px)
   - 2xl: Maximum width for complex views (800px)
   ============================================================================= */

export type SheetSize = "sm" | "md" | "lg" | "xl" | "2xl";

interface DetailSheetProps {
  /** Whether the sheet is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
  /** Sheet title */
  title: React.ReactNode;
  /** Optional description/subtitle */
  description?: React.ReactNode;
  /** Optional badge or status indicator next to title */
  titleBadge?: React.ReactNode;
  /** Header actions (edit button, dropdown menu, etc.) */
  headerActions?: React.ReactNode;
  /** Main content */
  children: React.ReactNode;
  /** Sheet size preset */
  size?: SheetSize;
  /** Footer content */
  footer?: React.ReactNode;
  /** Side of the screen to open from */
  side?: "left" | "right";
  /** Additional className */
  className?: string;
}

const sizeClasses: Record<SheetSize, string> = {
  sm: "sm:max-w-[400px]",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[700px]",
  "2xl": "sm:max-w-[800px]",
};

export function DetailSheet({
  open,
  onOpenChange,
  title,
  description,
  titleBadge,
  headerActions,
  children,
  size = "md",
  footer,
  side = "right",
  className,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side={side} 
        className={cn(sizeClasses[size], "flex flex-col p-0", className)}
      >
        {/* Header */}
        <SheetHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="truncate">{title}</SheetTitle>
                {titleBadge}
              </div>
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </div>
            {headerActions && (
              <div className="flex-shrink-0 flex items-center gap-2">
                {headerActions}
              </div>
            )}
          </div>
        </SheetHeader>

        {/* Content */}
        <ScrollArea className="flex-1 px-6 py-4">
          {children}
        </ScrollArea>

        {/* Footer */}
        {footer && (
          <SheetFooter className="px-6 py-4 border-t flex-shrink-0">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Detail section for organizing content
interface DetailSectionProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {title && (
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      )}
      {children}
    </div>
  );
}

// Detail row for key-value pairs
interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
  return (
    <div className={cn("flex justify-between items-start gap-4 py-2", className)}>
      <span className="text-sm text-muted-foreground flex-shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

// Detail grid for multiple values
interface DetailGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}

export function DetailGrid({ children, columns = 2, className }: DetailGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {children}
    </div>
  );
}

// Detail divider
export function DetailDivider({ className }: { className?: string }) {
  return <Separator className={cn("my-4", className)} />;
}
