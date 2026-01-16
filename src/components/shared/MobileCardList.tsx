import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface MobileCardListProps<T> {
  items: T[];
  renderCard: (item: T, index: number) => ReactNode;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  loadingCount?: number;
  emptyState?: ReactNode;
  className?: string;
  gap?: "sm" | "md" | "lg";
}

export function MobileCardList<T>({
  items,
  renderCard,
  keyExtractor,
  isLoading,
  loadingCount = 5,
  emptyState,
  className,
  gap = "md",
}: MobileCardListProps<T>) {
  const gapClasses = {
    sm: "gap-2",
    md: "gap-3",
    lg: "gap-4",
  };

  if (isLoading) {
    return (
      <div className={cn("flex flex-col", gapClasses[gap], className)}>
        {Array.from({ length: loadingCount }).map((_, i) => (
          <MobileCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (items.length === 0 && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  return (
    <div className={cn("flex flex-col", gapClasses[gap], className)}>
      {items.map((item, index) => (
        <motion.div
          key={keyExtractor(item)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: Math.min(index * 0.03, 0.15) }}
        >
          {renderCard(item, index)}
        </motion.div>
      ))}
    </div>
  );
}

function MobileCardSkeleton() {
  return (
    <div className="p-3 bg-card border border-border/50">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
    </div>
  );
}

// Generic mobile card component for consistent styling
interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  leftAccent?: string;
}

export function MobileCard({
  children,
  onClick,
  selected,
  className,
  leftAccent,
}: MobileCardProps) {
  return (
    <motion.div
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        "p-3 bg-card border-b border-border/50 transition-colors touch-manipulation",
        onClick && "cursor-pointer active:bg-muted/30",
        selected && "bg-muted/20",
        leftAccent && "border-l-2",
        className
      )}
      style={leftAccent ? { borderLeftColor: leftAccent } : undefined}
    >
      {children}
    </motion.div>
  );
}

// Horizontal scroll container for mobile carousels
interface MobileCarouselProps {
  children: ReactNode;
  className?: string;
}

export function MobileCarousel({ children, className }: MobileCarouselProps) {
  return (
    <div 
      className={cn(
        "flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-2 -mx-3 px-3",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MobileCarouselItemProps {
  children: ReactNode;
  className?: string;
}

export function MobileCarouselItem({ children, className }: MobileCarouselItemProps) {
  return (
    <div className={cn("flex-shrink-0 snap-center w-[85vw] max-w-[320px]", className)}>
      {children}
    </div>
  );
}
