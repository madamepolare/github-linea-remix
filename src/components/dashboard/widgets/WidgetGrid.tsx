import { useState, useCallback, useRef, useEffect } from "react";
import ReactGridLayout from "react-grid-layout";
import { Plus, Settings2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WidgetRenderer } from "./WidgetRenderer";
import { WidgetPicker } from "./WidgetPicker";
import { getWidgetById, getSizeDefaults } from "./registry";
import { cn } from "@/lib/utils";

import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "./grid-styles.css";

// Cast GridLayout to any to avoid type mismatch issues
const GridLayout = ReactGridLayout as any;

interface RGLLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

const STORAGE_KEY = "linea-dashboard-layout";

const DEFAULT_WIDGETS: string[] = [
  "welcome",
  "quick-actions",
  "projects-stats",
  "projects-pipeline",
  "projects-tasks",
  "activity-feed",
];

// Width constraints: 1 = 25%, 2 = 50%, 4 = 100% of grid
const ALLOWED_WIDTHS = [1, 2, 4];

function snapToAllowedWidth(w: number): number {
  // Find the closest allowed width
  if (w <= 1) return 1;
  if (w <= 2) return 2;
  return 4;
}

function getDefaultLayout(widgets: string[]): RGLLayout[] {
  let x = 0;
  let y = 0;

  return widgets.map((widgetId) => {
    const config = getWidgetById(widgetId);
    const size = config ? getSizeDefaults(config.defaultSize) : { w: 2, h: 2 };
    const snappedW = snapToAllowedWidth(size.w);

    if (x + snappedW > 4) {
      x = 0;
      y += 2;
    }

    const layout: RGLLayout = {
      i: widgetId,
      x,
      y,
      w: snappedW,
      h: size.h,
      minW: 1,
      maxW: 4,
      minH: config?.minH || 1,
    };

    x += snappedW;
    return layout;
  });
}

function loadLayout(): { widgets: string[]; layout: RGLLayout[] } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        widgets: parsed.widgets || DEFAULT_WIDGETS,
        layout: parsed.layout || getDefaultLayout(parsed.widgets || DEFAULT_WIDGETS),
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

function saveLayout(widgets: string[], layout: RGLLayout[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ widgets, layout }));
  } catch (e) {
    console.error("Failed to save dashboard layout", e);
  }
}

export function WidgetGrid() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);
  const [isEditing, setIsEditing] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [{ widgets, layout }, setState] = useState(loadLayout);

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: RGLLayout[]) => {
      if (isEditing) {
        // Snap widths to allowed values (1, 2, or 4)
        const snappedLayout = newLayout.map((item) => ({
          ...item,
          w: snapToAllowedWidth(item.w),
        }));
        setState((prev) => ({ ...prev, layout: snappedLayout }));
        saveLayout(widgets, snappedLayout);
      }
    },
    [isEditing, widgets]
  );

  const handleAddWidget = useCallback((widgetId: string) => {
    setState((prev) => {
      if (prev.widgets.includes(widgetId)) return prev;

      const config = getWidgetById(widgetId);
      const size = config ? getSizeDefaults(config.defaultSize) : { w: 2, h: 2 };
      const snappedW = snapToAllowedWidth(size.w);
      const maxY = Math.max(0, ...prev.layout.map((l) => l.y + l.h));

      const newLayout: RGLLayout = {
        i: widgetId,
        x: 0,
        y: maxY,
        w: snappedW,
        h: size.h,
        minW: 1,
        maxW: 4,
        minH: config?.minH || 1,
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
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      <div className="flex items-center justify-end gap-2 mb-4">
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

      <div 
        className={cn(
          "rounded-xl transition-colors",
          isEditing && "bg-dotted-grid"
        )}
      >
        <GridLayout
          className="layout"
          layout={layout}
          cols={4}
          rowHeight={120}
          width={containerWidth}
          margin={[16, 16]}
          containerPadding={[8, 8]}
          isDraggable={isEditing}
          isResizable={isEditing}
          draggableHandle=".widget-drag-handle"
          onLayoutChange={handleLayoutChange}
          useCSSTransforms
          resizeHandles={["e", "w", "se"]}
        >
          {widgets.map((widgetId) => (
            <div key={widgetId} className={cn(isEditing && "transition-shadow")}>
              <WidgetRenderer widgetId={widgetId} isEditing={isEditing} onRemove={() => handleRemoveWidget(widgetId)} />
            </div>
          ))}
        </GridLayout>
      </div>

      {showPicker && (
        <WidgetPicker open={showPicker} onClose={() => setShowPicker(false)} onSelect={handleAddWidget} activeWidgets={widgets} />
      )}
    </div>
  );
}
