import { useState, useCallback, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Settings2, RotateCcw, Check, ChevronDown, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetPicker } from "./WidgetPicker";
import { getWidgetById } from "./registry";
import { DASHBOARD_TEMPLATES, DashboardTemplate } from "./DashboardTemplates";
import { useDashboardLayout, WidgetLayout } from "@/hooks/useDashboardLayout";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";

const COLS = 4;
const ROW_HEIGHT = 140;
const GAP = 16;

interface ResizeState {
  widgetId: string;
  startW: number;
  startH: number;
  startX: number;
  startY: number;
}

export function WidgetGridNew() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isEditing, setIsEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [localLayout, setLocalLayout] = useState<WidgetLayout[] | null>(null);

  const {
    data,
    isLoading,
    addWidget,
    removeWidget,
    reorderWidgets,
    resetLayout,
    applyTemplate,
    updateWidgetLayout,
  } = useDashboardLayout();

  // Use local layout during resize, otherwise use data from hook
  const layout = localLayout || data.layout;
  const widgets = data.widgets;
  const currentTemplate = data.templateId;

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        setIsMobile(width < 640);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const colWidth = (containerWidth - GAP * (COLS - 1)) / COLS;

  // Drag end handler for reordering
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !isEditing) return;

      const sourceIndex = result.source.index;
      const destIndex = result.destination.index;

      if (sourceIndex === destIndex) return;

      // Reorder widgets array
      const newWidgets = [...widgets];
      const [removed] = newWidgets.splice(sourceIndex, 1);
      newWidgets.splice(destIndex, 0, removed);

      // Reorder layout to match
      const newLayout = newWidgets.map((widgetId, index) => {
        const existing = layout.find((l) => l.id === widgetId);
        const config = getWidgetById(widgetId);
        const w = existing?.w || 2;
        const h = existing?.h || 2;

        // Calculate new position in grid
        let x = 0;
        let y = 0;
        for (let i = 0; i < index; i++) {
          const prevWidget = newLayout[i];
          if (prevWidget) {
            x += prevWidget.w;
            if (x >= COLS) {
              x = 0;
              y += prevWidget.h;
            }
          }
        }

        return { id: widgetId, x, y, w, h };
      });

      reorderWidgets(newLayout);
    },
    [isEditing, widgets, layout, reorderWidgets]
  );

  // Resize handlers
  const handleResizeStart = useCallback(
    (widgetId: string, e: React.MouseEvent) => {
      if (!isEditing) return;
      e.preventDefault();
      e.stopPropagation();

      const widget = layout.find((l) => l.id === widgetId);
      if (!widget) return;

      setResizing({
        widgetId,
        startW: widget.w,
        startH: widget.h,
        startX: e.clientX,
        startY: e.clientY,
      });
      setLocalLayout([...layout]);
    },
    [isEditing, layout]
  );

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!resizing || !localLayout) return;

      const deltaX = e.clientX - resizing.startX;
      const deltaY = e.clientY - resizing.startY;

      // Calculate new width in columns
      const colDelta = Math.round(deltaX / (colWidth + GAP));
      const rowDelta = Math.round(deltaY / (ROW_HEIGHT + GAP));

      const config = getWidgetById(resizing.widgetId);
      const minW = config?.minW || 1;
      const maxW = config?.maxW || COLS;
      const minH = config?.minH || 1;
      const maxH = config?.maxH || 10;

      const newW = Math.max(minW, Math.min(maxW, resizing.startW + colDelta));
      const newH = Math.max(minH, Math.min(maxH, resizing.startH + rowDelta));

      setLocalLayout((prev) =>
        prev
          ? prev.map((item) =>
              item.id === resizing.widgetId ? { ...item, w: newW, h: newH } : item
            )
          : prev
      );
    },
    [resizing, localLayout, colWidth]
  );

  const handleResizeEnd = useCallback(() => {
    if (!resizing || !localLayout) return;

    const widget = localLayout.find((l) => l.id === resizing.widgetId);
    if (widget) {
      updateWidgetLayout(resizing.widgetId, { w: widget.w, h: widget.h });
    }

    setResizing(null);
    setLocalLayout(null);
  }, [resizing, localLayout, updateWidgetLayout]);

  useEffect(() => {
    if (resizing) {
      window.addEventListener("mousemove", handleResizeMove);
      window.addEventListener("mouseup", handleResizeEnd);
      return () => {
        window.removeEventListener("mousemove", handleResizeMove);
        window.removeEventListener("mouseup", handleResizeEnd);
      };
    }
  }, [resizing, handleResizeMove, handleResizeEnd]);

  const handleApplyTemplate = useCallback(
    (templateId: DashboardTemplate) => {
      const template = DASHBOARD_TEMPLATES.find((t) => t.id === templateId);
      if (!template || templateId === "custom") return;
      applyTemplate(template.widgets, templateId);
    },
    [applyTemplate]
  );

  const handleRemoveWidget = useCallback(
    (widgetId: string) => {
      removeWidget(widgetId);
    },
    [removeWidget]
  );

  const handleAddWidget = useCallback(
    (widgetId: string) => {
      addWidget(widgetId);
      setShowPicker(false);
    },
    [addWidget]
  );

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Mobile: simple stack
  if (isMobile) {
    return (
      <div className="relative space-y-3 px-3 py-2" ref={containerRef}>
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                {(() => {
                  const template = DASHBOARD_TEMPLATES.find((t) => t.id === currentTemplate);
                  const Icon = template?.icon || Settings2;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                <span className="max-w-[100px] truncate">
                  {DASHBOARD_TEMPLATES.find((t) => t.id === currentTemplate)?.name || "Dashboard"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {DASHBOARD_TEMPLATES.filter((t) => t.id !== "custom").map((template) => {
                const Icon = template.icon;
                return (
                  <DropdownMenuItem
                    key={template.id}
                    onClick={() => handleApplyTemplate(template.id)}
                    className={cn(currentTemplate === template.id && "bg-accent")}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    <div className="flex flex-col flex-1">
                      <span className="font-medium">{template.name}</span>
                      <span className="text-xs text-muted-foreground">{template.description}</span>
                    </div>
                    {currentTemplate === template.id && <Check className="h-4 w-4 ml-2" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPicker(true)}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Modifier
          </Button>
        </div>

        <div className="space-y-3">
          {widgets.map((widgetId) => (
            <div key={widgetId} className="w-full">
              <WidgetRenderer
                widgetId={widgetId}
                isEditing={false}
                onRemove={() => handleRemoveWidget(widgetId)}
                widthCols={4}
              />
            </div>
          ))}
        </div>

        {showPicker && (
          <WidgetPicker
            open={showPicker}
            onClose={() => setShowPicker(false)}
            onSelect={handleAddWidget}
            activeWidgets={widgets}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-4" ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {(() => {
                const template = DASHBOARD_TEMPLATES.find((t) => t.id === currentTemplate);
                const Icon = template?.icon || Settings2;
                return <Icon className="h-4 w-4" />;
              })()}
              {DASHBOARD_TEMPLATES.find((t) => t.id === currentTemplate)?.name || "Dashboard"}
              <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {DASHBOARD_TEMPLATES.filter((t) => t.id !== "custom").map((template) => {
              const Icon = template.icon;
              return (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleApplyTemplate(template.id)}
                  className={cn(currentTemplate === template.id && "bg-accent")}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <div className="flex flex-col flex-1">
                    <span className="font-medium">{template.name}</span>
                    <span className="text-xs text-muted-foreground">{template.description}</span>
                  </div>
                  {currentTemplate === template.id && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
              );
            })}
            {currentTemplate === "custom" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled className="opacity-70">
                  <Settings2 className="h-4 w-4 mr-2" />
                  <span>Configuration personnalisée</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un widget
              </Button>
              <Button variant="outline" size="sm" onClick={resetLayout} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setIsEditing(!isEditing);
              setShowPicker(false);
            }}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Check className="h-4 w-4" />
                Terminer
              </>
            ) : (
              <>
                <Settings2 className="h-4 w-4" />
                Personnaliser
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div
        className={cn(
          "rounded-xl transition-colors min-h-[400px]",
          isEditing && "bg-dotted-grid"
        )}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="dashboard-widgets" direction="vertical">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `repeat(${COLS}, 1fr)`,
                }}
              >
                {widgets.map((widgetId, index) => {
                  const widgetLayout = layout.find((l) => l.id === widgetId);
                  const w = widgetLayout?.w || 2;
                  const h = widgetLayout?.h || 2;
                  const config = getWidgetById(widgetId);

                  return (
                    <Draggable
                      key={widgetId}
                      draggableId={widgetId}
                      index={index}
                      isDragDisabled={!isEditing}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "relative rounded-xl transition-shadow",
                            snapshot.isDragging && "shadow-2xl z-50",
                            isEditing && "ring-1 ring-border/50"
                          )}
                          style={{
                            ...provided.draggableProps.style,
                            gridColumn: `span ${w}`,
                            height: `${h * ROW_HEIGHT + (h - 1) * GAP}px`,
                          }}
                        >
                          {/* Drag handle */}
                          {isEditing && (
                            <div
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 z-20 p-1.5 rounded-md bg-muted/80 backdrop-blur-sm cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}

                          <WidgetRenderer
                            widgetId={widgetId}
                            isEditing={isEditing}
                            onRemove={() => handleRemoveWidget(widgetId)}
                            widthCols={w}
                          />

                          {/* Resize handle */}
                          {isEditing && (
                            <div
                              className="absolute bottom-1 right-1 z-20 w-6 h-6 cursor-se-resize group"
                              onMouseDown={(e) => handleResizeStart(widgetId, e)}
                            >
                              <div className="absolute bottom-1 right-1 w-3 h-3 border-r-2 border-b-2 border-muted-foreground/40 rounded-br group-hover:border-primary transition-colors" />
                            </div>
                          )}

                          {/* Size badge */}
                          {isEditing && (
                            <div className="absolute bottom-2 left-2 z-10 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted/80 text-muted-foreground">
                              {w}×{h}
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {showPicker && (
        <WidgetPicker
          open={showPicker}
          onClose={() => setShowPicker(false)}
          onSelect={handleAddWidget}
          activeWidgets={widgets}
        />
      )}
    </div>
  );
}
