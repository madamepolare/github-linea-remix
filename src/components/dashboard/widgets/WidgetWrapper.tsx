import { ReactNode } from "react";
import { LucideIcon, GripVertical, X, Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface WidgetWrapperProps {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
  onRemove?: () => void;
  isEditing?: boolean;
  module?: string;
  widthCols?: number;
}

const WIDTH_LABELS: Record<number, string> = {
  1: "25%",
  2: "50%",
  4: "100%",
};

export function WidgetWrapper({
  title,
  icon: Icon,
  children,
  className,
  onRemove,
  isEditing = false,
  module,
  widthCols,
}: WidgetWrapperProps) {
  const widthLabel = widthCols ? WIDTH_LABELS[widthCols] || `${widthCols}col` : null;

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-card border border-border rounded-xl overflow-hidden relative",
        "transition-shadow duration-200",
        isEditing && "ring-2 ring-primary/20 shadow-lg",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30",
          isEditing && "cursor-grab active:cursor-grabbing widget-drag-handle"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isEditing && (
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium truncate">{title}</span>
          {module && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase tracking-wide">
              {module}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isEditing && widthLabel && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
              {widthLabel}
            </span>
          )}
          {isEditing && onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={onRemove}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
