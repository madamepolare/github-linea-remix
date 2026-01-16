import { useState, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, GripVertical, Clipboard } from "lucide-react";

export interface KanbanColumn<T> {
  id: string;
  label: string;
  color?: string;
  items: T[];
  metadata?: ReactNode;
}

export interface KanbanBoardProps<T> {
  columns: KanbanColumn<T>[];
  isLoading?: boolean;
  onDrop?: (itemId: string, fromColumnId: string, toColumnId: string) => void;
  onColumnAdd?: (columnId: string) => void;
  renderCard: (item: T, isDragging: boolean) => ReactNode;
  renderQuickAdd?: (columnId: string) => ReactNode;
  getItemId: (item: T) => string;
  emptyColumnContent?: ReactNode;
  className?: string;
}

export function KanbanBoard<T>({
  columns,
  isLoading,
  onDrop,
  onColumnAdd,
  renderCard,
  renderQuickAdd,
  getItemId,
  emptyColumnContent,
  className,
}: KanbanBoardProps<T>) {
  const [draggedItem, setDraggedItem] = useState<{ id: string; fromColumn: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  // Track if any drag is happening globally to disable layout animations
  const isDraggingRef = useRef(false);

  const handleDragStart = (e: React.DragEvent, itemId: string, columnId: string) => {
    isDraggingRef.current = true;
    setDraggedItem({ id: itemId, fromColumn: columnId });
    e.dataTransfer.effectAllowed = "move";
    // Safari requires setting data for drag to work
    e.dataTransfer.setData("text/plain", itemId);
    e.dataTransfer.setData("application/x-kanban-item", JSON.stringify({ id: itemId, fromColumn: columnId }));
    // Set a transparent drag image
    const dragImage = document.createElement("div");
    dragImage.style.opacity = "0";
    dragImage.style.position = "absolute";
    dragImage.style.top = "-1000px";
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Try to get data from state first, then fallback to dataTransfer (Safari)
    let itemData = draggedItem;
    if (!itemData) {
      try {
        const data = e.dataTransfer.getData("application/x-kanban-item");
        if (data) {
          itemData = JSON.parse(data);
        }
      } catch {
        // Ignore parsing errors
      }
    }
    
    if (itemData && itemData.fromColumn !== columnId) {
      onDrop?.(itemData.id, itemData.fromColumn, columnId);
    }
    isDraggingRef.current = false;
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    isDraggingRef.current = false;
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className={cn("flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 min-w-[85vw] md:min-w-[320px] w-64 sm:w-72 snap-center space-y-3">
            <Skeleton className="h-10 sm:h-12 w-full rounded-lg bg-muted" />
            <Skeleton className="h-24 sm:h-28 w-full rounded-xl bg-muted" />
            <Skeleton className="h-24 sm:h-28 w-full rounded-xl bg-muted" />
            <Skeleton className="h-16 sm:h-20 w-full rounded-xl bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 h-full", className)}>
      {columns.map((column) => {
        const isDropTarget = dragOverColumn === column.id && draggedItem?.fromColumn !== column.id;
        
        return (
          <div
            key={column.id}
            className={cn(
              "kanban-column flex flex-col rounded-xl min-h-[400px] sm:min-h-[500px] min-w-[85vw] md:min-w-[320px] w-64 sm:w-72 flex-shrink-0 snap-center bg-muted/30 border border-border/50 transition-all duration-200",
              isDropTarget && "ring-2 ring-primary/30 bg-primary/5 border-dashed border-2 border-primary/30"
            )}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* Column Header */}
            <div className="kanban-column-header flex items-center justify-between px-2.5 sm:px-3 py-2.5 sm:py-3 border-b border-border/50">
              <div className="flex items-center gap-1.5 sm:gap-2">
                {column.color && (
                  <div
                    className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                )}
                <span className="font-medium text-xs sm:text-sm text-foreground">{column.label}</span>
                <span className="text-2xs sm:text-xs text-muted-foreground bg-background/80 rounded-full px-1.5 sm:px-2 py-0.5 min-w-[20px] sm:min-w-[24px] text-center">
                  {column.items.length}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {onColumnAdd && (
                  <button 
                    onClick={() => onColumnAdd(column.id)}
                    className="p-1 sm:p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </button>
                )}
                <button className="p-1 sm:p-1.5 rounded-md hover:bg-background text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Column Metadata (e.g., total value) */}
            {column.metadata && (
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-b border-border/30">
                {column.metadata}
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 px-1.5 sm:px-2 py-1.5 sm:py-2 space-y-1.5 sm:space-y-2 overflow-y-auto scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {column.items.map((item) => {
                  const itemId = getItemId(item);
                  const isDragging = draggedItem?.id === itemId;

                  return (
                    <div
                      key={itemId}
                      draggable
                      onDragStart={(e) => handleDragStart(e, itemId, column.id)}
                      onDragEnd={handleDragEnd}
                      className="cursor-grab active:cursor-grabbing"
                      style={{ 
                        userSelect: 'none',
                        opacity: isDragging ? 0.6 : 1,
                        transform: isDragging ? 'scale(0.98) rotate(2deg)' : 'scale(1) rotate(0deg)',
                        boxShadow: isDragging ? '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' : 'none',
                        transition: 'opacity 0.15s, transform 0.15s, box-shadow 0.15s',
                      }}
                    >
                      {renderCard(item, isDragging)}
                    </div>
                  );
                })}
              </AnimatePresence>

              {/* Drop zone ghost indicator */}
              {isDropTarget && (
                <div className="mx-0.5 sm:mx-1 h-20 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center animate-pulse">
                  <span className="text-xs text-primary/60">Déposer ici</span>
                </div>
              )}

              {/* Empty state */}
              {column.items.length === 0 && !isDropTarget && (
                <div className="text-center py-6 sm:py-8 border border-dashed border-border/50 rounded-lg mx-0.5 sm:mx-1 flex flex-col items-center gap-2">
                  <Clipboard className="h-8 w-8 text-muted-foreground/30" />
                  <span className="text-sm text-muted-foreground">Aucune tâche</span>
                  {onColumnAdd && (
                    <button 
                      onClick={() => onColumnAdd(column.id)}
                      className="mt-1 p-1.5 rounded-full bg-muted hover:bg-muted-foreground/10 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Quick Add */}
              {renderQuickAdd?.(column.id)}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Reusable Kanban Card wrapper component
export interface KanbanCardProps {
  children: ReactNode;
  onClick?: () => void;
  accentColor?: string;
  className?: string;
  isCompleted?: boolean;
  onComplete?: () => void;
}

export function KanbanCard({ children, onClick, accentColor, className, isCompleted, onComplete }: KanbanCardProps) {
  const [showCelebration, setShowCelebration] = useState(false);

  const handleComplete = () => {
    if (!isCompleted) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 600);
    }
    onComplete?.();
  };

  return (
    <motion.div
      whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      animate={showCelebration ? {
        scale: [1, 1.03, 1],
        backgroundColor: ['hsl(var(--card))', 'hsl(142 76% 36% / 0.15)', 'hsl(var(--card))']
      } : {}}
      transition={{ duration: 0.4 }}
      className={cn(
        "p-2.5 sm:p-3 rounded-lg border bg-card cursor-pointer transition-colors",
        "hover:border-primary/20",
        isCompleted && "opacity-60",
        className
      )}
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 3 } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{children}</div>
        <GripVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5 hidden sm:block" />
      </div>
    </motion.div>
  );
}
