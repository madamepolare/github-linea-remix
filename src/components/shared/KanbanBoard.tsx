import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Clipboard, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);

  const handleDragEnd = (result: DropResult) => {
    const { draggableId, source, destination } = result;
    
    // Dropped outside a droppable
    if (!destination) return;
    
    // Same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    
    // Call onDrop with the item ID and column IDs
    onDrop?.(draggableId, source.droppableId, destination.droppableId);
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div 
          className={cn(
            "flex-1 overflow-x-auto snap-x snap-mandatory",
            isMobile ? "flex flex-col" : "flex gap-4 sm:gap-6 pb-4"
          )}
        >
          {displayColumns.map((column) => (
            <Droppable key={column.id} droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "kanban-column flex flex-col flex-shrink-0 snap-center",
                    isMobile 
                      ? "w-full min-h-[calc(100vh-280px)]" 
                      : "min-h-[400px] sm:min-h-[500px] min-w-[280px] md:min-w-[320px] w-72 sm:w-80",
                    "transition-all duration-150",
                    snapshot.isDraggingOver && "bg-muted/25 rounded-xl"
                  )}
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
                      {column.items.map((item, index) => {
                        const itemId = getItemId(item);

                        return (
                          <Draggable key={itemId} draggableId={itemId} index={index}>
                            {(dragProvided, dragSnapshot) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                {...dragProvided.dragHandleProps}
                                style={{
                                  ...dragProvided.draggableProps.style,
                                  userSelect: 'none',
                                }}
                                className={cn(
                                  "cursor-grab active:cursor-grabbing touch-manipulation",
                                  dragSnapshot.isDragging && "z-50"
                                )}
                              >
                                <motion.div
                                  layout={!dragSnapshot.isDragging}
                                  initial={false}
                                  animate={{ 
                                    opacity: dragSnapshot.isDragging ? 0.9 : 1,
                                    scale: dragSnapshot.isDragging ? 1.02 : 1,
                                    rotate: dragSnapshot.isDragging ? 1 : 0,
                                    boxShadow: dragSnapshot.isDragging 
                                      ? "0 8px 20px rgba(0,0,0,0.15)" 
                                      : "0 0 0 rgba(0,0,0,0)"
                                  }}
                                  transition={{ 
                                    type: "spring", 
                                    stiffness: 500, 
                                    damping: 30,
                                    mass: 0.8
                                  }}
                                >
                                  {renderCard(item, dragSnapshot.isDragging)}
                                </motion.div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    </AnimatePresence>
                    
                    {provided.placeholder}

                    {/* Drop zone ghost indicator */}
                    {snapshot.isDraggingOver && (
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
                    {column.items.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-8 flex flex-col items-center gap-2">
                        <Clipboard className="h-6 w-6 text-muted-foreground/20" />
                        <span className="text-xs text-muted-foreground/50">Aucun élément</span>
                      </div>
                    )}

                    {/* Quick Add */}
                    {renderQuickAdd?.(column.id)}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
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
        "p-3 sm:p-4 rounded-lg bg-white dark:bg-background border cursor-pointer transition-all duration-200",
        "hover:border-border/60",
        isCompleted && "opacity-50",
        !accentColor && "border-border/30",
        className
      )}
      style={accentColor ? { borderColor: accentColor } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </motion.div>
  );
}
