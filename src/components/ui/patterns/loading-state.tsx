import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* =============================================================================
   LOADING STATE COMPONENT
   Unified loading indicator for the entire application.
   
   USAGE GUIDELINES:
   - skeleton: Tables, lists, cards (layout preserved during load)
   - spinner: Buttons, full-page loads, portals
   - overlay: When loading over existing content
   ============================================================================= */

export type LoadingVariant = "skeleton" | "spinner" | "overlay";
export type LoadingSize = "sm" | "md" | "lg" | "xl";

interface LoadingStateProps {
  /** The visual style of the loading indicator */
  variant?: LoadingVariant;
  /** Size of the loading indicator */
  size?: LoadingSize;
  /** Optional text to display with the loader */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Number of skeleton rows to show (for skeleton variant) */
  rows?: number;
  /** Whether to show as full-page centered */
  fullPage?: boolean;
  /** Children to wrap (for overlay variant) */
  children?: React.ReactNode;
  /** Whether loading is active (for overlay variant) */
  loading?: boolean;
}

const sizeConfig: Record<LoadingSize, { spinner: string; text: string }> = {
  sm: { spinner: "h-4 w-4", text: "text-xs" },
  md: { spinner: "h-5 w-5", text: "text-sm" },
  lg: { spinner: "h-6 w-6", text: "text-base" },
  xl: { spinner: "h-8 w-8", text: "text-lg" },
};

// Skeleton variant - preserves layout structure
function SkeletonLoader({ rows = 3, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

// Spinner variant - centered spinning indicator
function SpinnerLoader({ 
  size = "md", 
  text, 
  fullPage, 
  className 
}: { 
  size?: LoadingSize; 
  text?: string; 
  fullPage?: boolean;
  className?: string;
}) {
  const config = sizeConfig[size];
  
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("animate-spin text-muted-foreground", config.spinner)} />
      {text && (
        <p className={cn("text-muted-foreground", config.text)}>{text}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

// Overlay variant - loading indicator over content
function OverlayLoader({ 
  size = "md", 
  text,
  loading = true,
  children, 
  className 
}: { 
  size?: LoadingSize; 
  text?: string;
  loading?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const config = sizeConfig[size];

  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-card">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className={cn("animate-spin text-primary", config.spinner)} />
            {text && (
              <p className={cn("text-muted-foreground", config.text)}>{text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Table skeleton - specialized for data tables
export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className 
}: { 
  rows?: number; 
  columns?: number;
  showHeader?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {showHeader && (
        <div className="flex gap-4 pb-2 border-b">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      )}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-2">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-8 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Card skeleton - for card grids
export function CardSkeleton({ 
  count = 3,
  className 
}: { 
  count?: number;
  className?: string;
}) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-card border bg-card p-card space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="pt-2 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form skeleton - for form loading states
export function FormSkeleton({ 
  fields = 4,
  className 
}: { 
  fields?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Main component with variant switching
export function LoadingState({
  variant = "spinner",
  size = "md",
  text,
  className,
  rows = 3,
  fullPage = false,
  children,
  loading = true,
}: LoadingStateProps) {
  switch (variant) {
    case "skeleton":
      return <SkeletonLoader rows={rows} className={className} />;
    case "overlay":
      return (
        <OverlayLoader 
          size={size} 
          text={text} 
          loading={loading} 
          className={className}
        >
          {children}
        </OverlayLoader>
      );
    case "spinner":
    default:
      return (
        <SpinnerLoader 
          size={size} 
          text={text} 
          fullPage={fullPage} 
          className={className} 
        />
      );
  }
}

// Convenience exports for common patterns
export const PageLoader = ({ text }: { text?: string }) => (
  <LoadingState variant="spinner" size="lg" fullPage text={text} />
);

export const ButtonLoader = () => (
  <Loader2 className="h-4 w-4 animate-spin" />
);

export const InlineLoader = ({ text }: { text?: string }) => (
  <LoadingState variant="spinner" size="sm" text={text} />
);
