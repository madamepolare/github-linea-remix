import { useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, MoreHorizontal, GripVertical } from "lucide-react";

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

  const handleDragStart = (e: React.DragEvent, itemId: string, columnId: string) => {
    setDraggedItem({ id: itemId, fromColumn: columnId });
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent drag image
    const dragImage = document.createElement("div");
    dragImage.style.opacity = "0";
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
    if (draggedItem && draggedItem.fromColumn !== columnId) {
      onDrop?.(draggedItem.id, draggedItem.fromColumn, columnId);
    }
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverColumn(null);
  };

  if (isLoading) {
    return (
      <div className={cn("flex gap-3 sm:gap-4 overflow-x-auto pb-4", className)}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-64 sm:w-72 space-y-3">
            <Skeleton className="h-10 sm:h-12 w-full rounded-lg" />
            <Skeleton className="h-24 sm:h-28 w-full rounded-xl" />
            <Skeleton className="h-24 sm:h-28 w-full rounded-xl" />
            <Skeleton className="h-16 sm:h-20 w-full rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 sm:gap-4 overflow-x-auto pb-4 h-full", className)}>
      {columns.map((column) => (
        <div
          key={column.id}
          className={cn(
            "kanban-column flex flex-col rounded-xl min-h-[400px] sm:min-h-[500px] w-64 sm:w-72 flex-shrink-0 bg-muted/30 border border-border/50 transition-all duration-200",
            dragOverColumn === column.id && "ring-2 ring-primary/30 bg-primary/5"
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
                  <motion.div
                    key={itemId}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                      opacity: isDragging ? 0.5 : 1, 
                      scale: isDragging ? 0.98 : 1,
                    }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    draggable
                    onDragStart={(e) => handleDragStart(e as any, itemId, column.id)}
                    onDragEnd={handleDragEnd}
                    className="cursor-grab active:cursor-grabbing"
                  >
                    {renderCard(item, isDragging)}
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty state */}
            {column.items.length === 0 && (
              <div className="text-center py-6 sm:py-8 text-xs sm:text-sm text-muted-foreground border border-dashed border-border/50 rounded-lg mx-0.5 sm:mx-1">
                {emptyColumnContent || "Aucun élément"}
              </div>
            )}

            {/* Quick Add */}
            {renderQuickAdd?.(column.id)}
          </div>
        </div>
      ))}
    </div>
  );
}

// Reusable Kanban Card wrapper component
export interface KanbanCardProps {
  children: ReactNode;
  onClick?: () => void;
  accentColor?: string;
  className?: string;
}

export function KanbanCard({ children, onClick, accentColor, className }: KanbanCardProps) {
  return (
    <motion.div
      whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
      onClick={onClick}
      className={cn(
        "p-2.5 sm:p-3 rounded-lg border bg-card cursor-pointer transition-colors",
        "hover:border-primary/20",
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
