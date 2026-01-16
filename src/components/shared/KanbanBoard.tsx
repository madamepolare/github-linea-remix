import { useState, ReactNode, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, GripVertical, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [draggedItem, setDraggedItem] = useState<{ id: string; fromColumn: string } | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
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

  // Mobile navigation
  const handlePrevColumn = () => {
    setMobileColumnIndex(Math.max(0, mobileColumnIndex - 1));
  };
  
  const handleNextColumn = () => {
    setMobileColumnIndex(Math.min(columns.length - 1, mobileColumnIndex + 1));
  };

  if (isLoading) {
    return (
      <div className={cn("flex gap-4 sm:gap-6 overflow-x-auto snap-x snap-mandatory pb-4", className)}>
        {[...Array(isMobile ? 1 : 4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-full md:min-w-[320px] md:w-80 snap-center space-y-2 px-1">
            <Skeleton className="h-8 w-32 rounded-md bg-muted/50" />
            <Skeleton className="h-20 w-full rounded-lg bg-muted/30" />
            <Skeleton className="h-20 w-full rounded-lg bg-muted/30" />
            <Skeleton className="h-16 w-full rounded-lg bg-muted/30" />
          </div>
        ))}
      </div>
    );
  }

  // Mobile: show one column at a time with nav
  const displayColumns = isMobile ? [columns[mobileColumnIndex]] : columns;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Mobile Column Selector */}
      {isMobile && columns.length > 1 && (
        <div className="flex items-center justify-between px-2 pb-3 border-b mb-3">
          <button
            onClick={handlePrevColumn}
            disabled={mobileColumnIndex === 0}
            className={cn(
              "p-2 rounded-lg transition-colors touch-manipulation",
              mobileColumnIndex === 0 ? "text-muted-foreground/30" : "text-foreground hover:bg-muted active:bg-muted/80"
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-1.5">
            {columns.map((col, idx) => (
              <button
                key={col.id}
                onClick={() => setMobileColumnIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all touch-manipulation",
                  idx === mobileColumnIndex 
                    ? "w-6 bg-primary" 
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                )}
                style={idx === mobileColumnIndex && col.color ? { backgroundColor: col.color } : undefined}
              />
            ))}
          </div>
          
          <button
            onClick={handleNextColumn}
            disabled={mobileColumnIndex === columns.length - 1}
            className={cn(
              "p-2 rounded-lg transition-colors touch-manipulation",
              mobileColumnIndex === columns.length - 1 ? "text-muted-foreground/30" : "text-foreground hover:bg-muted active:bg-muted/80"
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      )}

      <div 
        ref={containerRef}
        className={cn(
          "flex-1 overflow-x-auto snap-x snap-mandatory",
          isMobile ? "flex flex-col" : "flex gap-4 sm:gap-6 pb-4"
        )}
      >
        {displayColumns.map((column) => {
          const isDropTarget = dragOverColumn === column.id && draggedItem?.fromColumn !== column.id;
          
          return (
            <div
              key={column.id}
              className={cn(
                "kanban-column flex flex-col flex-shrink-0 snap-center",
                isMobile 
                  ? "w-full min-h-[calc(100vh-280px)]" 
                  : "min-h-[400px] sm:min-h-[500px] min-w-[280px] md:min-w-[320px] w-72 sm:w-80",
                "transition-all duration-150",
                isDropTarget && "bg-muted/25 rounded-xl"
              )}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id)}
            >
            {/* Column Header */}
            <div className="kanban-column-header flex items-center justify-between px-1 py-2 mb-3">
              <div className="flex items-center gap-2">
                {column.color && (
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                )}
                <span className="font-medium text-sm text-foreground">{column.label}</span>
                <span className="text-xs text-muted-foreground/70 font-medium">
                  {column.items.length}
                </span>
              </div>
              <div className="flex items-center gap-0.5">
                {onColumnAdd && (
                  <button 
                    onClick={() => onColumnAdd(column.id)}
                    className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Column Metadata (e.g., total value) */}
            {column.metadata && (
              <div className="px-1 py-1.5 mb-2">
                {column.metadata}
              </div>
            )}

            {/* Items List */}
            <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin">
              <AnimatePresence mode="popLayout">
                {column.items.map((item) => {
                  const itemId = getItemId(item);
                  const isDragging = draggedItem?.id === itemId;

                    return (
                      <motion.div
                        key={itemId}
                        layout
                        initial={false}
                        animate={{ 
                          opacity: isDragging ? 0.5 : 1,
                          scale: isDragging ? 0.95 : 1,
                          rotate: isDragging ? 2 : 0,
                        }}
                        whileDrag={{ scale: 0.8 }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 500, 
                          damping: 30,
                          mass: 0.8
                        }}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, itemId, column.id)}
                        onDragEnd={handleDragEnd}
                        className="cursor-grab active:cursor-grabbing"
                        style={{ userSelect: 'none' }}
                      >
                        {renderCard(item, isDragging)}
                      </motion.div>
                    );
                })}
              </AnimatePresence>

              {/* Drop zone ghost indicator */}
              {isDropTarget && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="h-16 rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center"
                >
                  <span className="text-xs text-primary/60">Déposer ici</span>
                </motion.div>
              )}

              {/* Empty state */}
              {column.items.length === 0 && !isDropTarget && (
                <div className="text-center py-8 flex flex-col items-center gap-2">
                  <Clipboard className="h-6 w-6 text-muted-foreground/20" />
                  <span className="text-xs text-muted-foreground/50">Aucun élément</span>
                </div>
              )}

              {/* Quick Add */}
              {renderQuickAdd?.(column.id)}
            </div>
          </div>
        );
      })}
      </div>
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
      whileHover={{ boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
      onClick={onClick}
      animate={showCelebration ? {
        scale: [1, 1.02, 1],
        backgroundColor: ['white', 'hsl(142 76% 36% / 0.08)', 'white']
      } : {}}
      transition={{ duration: 0.3 }}
      className={cn(
        "p-3 sm:p-4 rounded-lg bg-white dark:bg-background border border-border/30 cursor-pointer transition-all duration-200",
        "hover:border-border/60",
        isCompleted && "opacity-50",
        className
      )}
      style={accentColor ? { borderLeftColor: accentColor, borderLeftWidth: 2 } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </motion.div>
  );
}
