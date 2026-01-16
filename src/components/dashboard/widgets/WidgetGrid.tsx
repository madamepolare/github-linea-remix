import { useState, useCallback, useRef, useEffect } from "react";
import ReactGridLayout from "react-grid-layout";
import { Plus, Settings2, RotateCcw, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetPicker } from "./WidgetPicker";
import { getWidgetById, getSizeDefaults } from "./registry";
import { DASHBOARD_TEMPLATES, DashboardTemplate } from "./DashboardTemplates";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./grid-styles.css";

// Cast GridLayout to any to avoid type mismatch issues
const GridLayout = ReactGridLayout as any;

// Our own layout item interface matching react-grid-layout expectations
interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  maxW?: number;
  minH?: number;
  maxH?: number;
}

const STORAGE_KEY = "linea-dashboard-layout";
const TEMPLATE_KEY = "linea-dashboard-template";
const COLS = 4;

const DEFAULT_WIDGETS: string[] = [
  "welcome",
  "quick-actions",
  "projects-stats",
  "projects-pipeline",
  "projects-tasks",
  "activity-feed",
];

function getDefaultLayout(widgets: string[]): LayoutItem[] {
  let x = 0;
  let y = 0;

  return widgets.map((widgetId) => {
    const config = getWidgetById(widgetId);
    const size = config ? getSizeDefaults(config.defaultSize) : { w: 2, h: 2 };
    const w = Math.min(size.w, COLS);

    if (x + w > COLS) {
      x = 0;
      y += 2;
    }

    const layout: LayoutItem = {
      i: widgetId,
      x,
      y,
      w,
      h: size.h,
      minW: config?.minW || 1,
      maxW: config?.maxW || COLS,
      minH: config?.minH || 1,
      maxH: config?.maxH,
    };

    x += w;
    if (x >= COLS) {
      x = 0;
      y += size.h;
    }
    
    return layout;
  });
}

function loadLayout(): { widgets: string[]; layout: LayoutItem[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Re-apply constraints from registry
      const layout = (parsed.layout || []).map((item: LayoutItem) => {
        const config = getWidgetById(item.i);
        return {
          ...item,
          minW: config?.minW || 1,
          maxW: config?.maxW || COLS,
          minH: config?.minH || 1,
          maxH: config?.maxH,
        };
      });
      return {
        widgets: parsed.widgets || DEFAULT_WIDGETS,
        layout: layout.length ? layout : getDefaultLayout(parsed.widgets || DEFAULT_WIDGETS),
      };
    }
  } catch (e) {
    console.error("Failed to load dashboard layout", e);
  }
  return {
    widgets: DEFAULT_WIDGETS,
    layout: getDefaultLayout(DEFAULT_WIDGETS),
  };
}

function saveLayout(widgets: string[], layout: LayoutItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layout }));
  } catch (e) {
    console.error("Failed to save dashboard layout", e);
  }
}

// Pure function to clone layout items and apply constraints from registry
function applyConstraintsAndClone(layoutItems: LayoutItem[]): LayoutItem[] {
  return layoutItems.map((item) => {
    const config = getWidgetById(item.i);
    return {
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: config?.minW || 1,
      maxW: config?.maxW || COLS,
      minH: config?.minH || 1,
      maxH: config?.maxH,
    };
  });
}

export function WidgetGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isEditing, setIsEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [{ widgets, layout }, setState] = useState(loadLayout);
  const [isMobile, setIsMobile] = useState(false);
  const [currentTemplate, setCurrentTemplate] = useState<DashboardTemplate>(() => {
    try {
      const saved = localStorage.getItem(TEMPLATE_KEY);
      return (saved as DashboardTemplate) || "custom";
    } catch {
      return "custom";
    }
  });

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

  // Save only when resize/drag stops - this is the source of truth
  const handleResizeStop = useCallback(
    (_layout: LayoutItem[], _oldItem: LayoutItem, newItem: LayoutItem, _placeholder: LayoutItem, _e: MouseEvent, _element: HTMLElement) => {
      if (!isEditing) return;
      
      setState((prev) => {
        const updatedLayout = prev.layout.map((item) => {
          if (item.i === newItem.i) {
            const config = getWidgetById(item.i);
            return {
              i: newItem.i,
              x: newItem.x,
              y: newItem.y,
              w: newItem.w,
              h: newItem.h,
              minW: config?.minW || 1,
              maxW: config?.maxW || COLS,
              minH: config?.minH || 1,
              maxH: config?.maxH,
            };
          }
          return { ...item };
        });
        saveLayout(prev.widgets, updatedLayout);
        return { ...prev, layout: updatedLayout };
      });
    },
    [isEditing]
  );

  const handleDragStop = useCallback(
    (_layout: LayoutItem[], _oldItem: LayoutItem, newItem: LayoutItem, _placeholder: LayoutItem, _e: MouseEvent, _element: HTMLElement) => {
      if (!isEditing) return;
      
      setState((prev) => {
        const updatedLayout = prev.layout.map((item) => {
          if (item.i === newItem.i) {
            const config = getWidgetById(item.i);
            return {
              i: newItem.i,
              x: newItem.x,
              y: newItem.y,
              w: item.w, // Keep existing width
              h: item.h, // Keep existing height
              minW: config?.minW || 1,
              maxW: config?.maxW || COLS,
              minH: config?.minH || 1,
              maxH: config?.maxH,
            };
          }
          return { ...item };
        });
        saveLayout(prev.widgets, updatedLayout);
        return { ...prev, layout: updatedLayout };
      });
    },
    [isEditing]
  );

  const handleAddWidget = useCallback((widgetId: string) => {
    setState((prev) => {
      if (prev.widgets.includes(widgetId)) return prev;

      const config = getWidgetById(widgetId);
      const size = config ? getSizeDefaults(config.defaultSize) : { w: 2, h: 2 };
      const w = Math.min(size.w, COLS);
      const maxY = Math.max(0, ...prev.layout.map((l) => l.y + l.h));

      const newLayout: LayoutItem = {
        i: widgetId,
        x: 0,
        y: maxY,
        w,
        h: size.h,
        minW: config?.minW || 1,
        maxW: config?.maxW || COLS,
        minH: config?.minH || 1,
        maxH: config?.maxH,
      };

      const newWidgets = [...prev.widgets, widgetId];
      const newLayoutArr = [...prev.layout, newLayout];
      saveLayout(newWidgets, newLayoutArr);
      return { widgets: newWidgets, layout: newLayoutArr };
    });
    setShowPicker(false);
  }, []);

  const handleRemoveWidget = useCallback((widgetId: string) => {
    setState((prev) => {
      const newWidgets = prev.widgets.filter((w) => w !== widgetId);
      const newLayout = prev.layout.filter((l) => l.i !== widgetId);
      saveLayout(newWidgets, newLayout);
      return { widgets: newWidgets, layout: newLayout };
    });
  }, []);

  const handleReset = useCallback(() => {
    const defaultState = {
      widgets: DEFAULT_WIDGETS,
      layout: getDefaultLayout(DEFAULT_WIDGETS),
    };
    setState(defaultState);
    saveLayout(DEFAULT_WIDGETS, defaultState.layout);
    setCurrentTemplate("custom");
    localStorage.setItem(TEMPLATE_KEY, "custom");
  }, []);

  const handleApplyTemplate = useCallback((templateId: DashboardTemplate) => {
    const template = DASHBOARD_TEMPLATES.find(t => t.id === templateId);
    if (!template || templateId === "custom") {
      setCurrentTemplate("custom");
      localStorage.setItem(TEMPLATE_KEY, "custom");
      return;
    }
    
    const newWidgets = template.widgets;
    const newLayout = getDefaultLayout(newWidgets);
    setState({ widgets: newWidgets, layout: newLayout });
    saveLayout(newWidgets, newLayout);
    setCurrentTemplate(templateId);
    localStorage.setItem(TEMPLATE_KEY, templateId);
  }, []);

  // Mobile: render as simple stack
  if (isMobile) {
    return (
      <div className="relative space-y-4 px-4" ref={containerRef}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 text-xs">
                {(() => {
                  const template = DASHBOARD_TEMPLATES.find(t => t.id === currentTemplate);
                  const Icon = template?.icon || Settings2;
                  return <Icon className="h-3.5 w-3.5" />;
                })()}
                <span className="max-w-[100px] truncate">
                  {DASHBOARD_TEMPLATES.find(t => t.id === currentTemplate)?.name || "Dashboard"}
                </span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {DASHBOARD_TEMPLATES.filter(t => t.id !== "custom").map((template) => {
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

        {/* Mobile Widgets Stack */}
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
          <WidgetPicker open={showPicker} onClose={() => setShowPicker(false)} onSelect={handleAddWidget} activeWidgets={widgets} />
        )}
      </div>
    );
  }

  return (
    <div className="relative px-4 sm:px-6 lg:px-8 py-4" ref={containerRef}>
      <div className="flex items-center justify-between gap-2 mb-4">
        {/* Left side - Template selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {(() => {
                const template = DASHBOARD_TEMPLATES.find(t => t.id === currentTemplate);
                const Icon = template?.icon || Settings2;
                return <Icon className="h-4 w-4" />;
              })()}
              {DASHBOARD_TEMPLATES.find(t => t.id === currentTemplate)?.name || "Dashboard"}
              <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {DASHBOARD_TEMPLATES.filter(t => t.id !== "custom").map((template) => {
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

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Button variant="outline" size="sm" onClick={() => setShowPicker(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Ajouter un widget
              </Button>
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? "default" : "outline"}
            size="sm"
            onClick={() => { setIsEditing(!isEditing); setShowPicker(false); }}
            className="gap-2"
          >
            {isEditing ? <><Check className="h-4 w-4" />Terminer</> : <><Settings2 className="h-4 w-4" />Personnaliser</>}
          </Button>
        </div>
      </div>

      <div 
        className={cn(
          "rounded-xl transition-colors",
          isEditing && "bg-dotted-grid"
        )}
      >
        <GridLayout
          className="layout"
          layout={layout}
          cols={COLS}
          rowHeight={120}
          width={containerWidth}
          margin={[16, 16]}
          containerPadding={[0, 0]}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".widget-drag-handle"
          onResizeStop={handleResizeStop}
          onDragStop={handleDragStop}
          useCSSTransforms
          resizeHandles={["se", "e", "s"]}
          compactType="vertical"
          preventCollision={false}
        >
          {widgets.map((widgetId) => {
            const widgetLayout = layout.find(l => l.i === widgetId);
            return (
              <div 
                key={widgetId} 
                className={cn(
                  "h-full",
                  isEditing && "transition-shadow"
                )}
              >
                <WidgetRenderer 
                  widgetId={widgetId} 
                  isEditing={isEditing} 
                  onRemove={() => handleRemoveWidget(widgetId)}
                  widthCols={widgetLayout?.w}
                />
              </div>
            );
          })}
        </GridLayout>
      </div>

      {showPicker && (
        <WidgetPicker open={showPicker} onClose={() => setShowPicker(false)} onSelect={handleAddWidget} activeWidgets={widgets} />
      )}
    </div>
  );
}
