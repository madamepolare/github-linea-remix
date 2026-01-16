import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getWidgetById, getSizeDefaults } from "@/components/dashboard/widgets/registry";
import { DashboardTemplate } from "@/components/dashboard/widgets/DashboardTemplates";
import type { Json } from "@/integrations/supabase/types";

export interface WidgetLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface DashboardLayoutData {
  widgets: string[];
  layout: WidgetLayout[];
  templateId: DashboardTemplate;
}

const COLS = 4;

const DEFAULT_WIDGETS: string[] = [
  "welcome",
  "quick-actions",
  "projects-stats",
  "projects-pipeline",
  "projects-tasks",
  "activity-feed",
];

function getDefaultLayout(widgets: string[]): WidgetLayout[] {
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

    const layout: WidgetLayout = {
      id: widgetId,
      x,
      y,
      w,
      h: size.h,
    };

    x += w;
    if (x >= COLS) {
      x = 0;
      y += size.h;
    }

    return layout;
  });
}

function getDefaultData(): DashboardLayoutData {
  return {
    widgets: DEFAULT_WIDGETS,
    layout: getDefaultLayout(DEFAULT_WIDGETS),
    templateId: "custom",
  };
}

export function useDashboardLayout() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const workspaceId = activeWorkspace?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard-layout", workspaceId],
    queryFn: async (): Promise<DashboardLayoutData> => {
      if (!workspaceId) return getDefaultData();

      const { data: row, error } = await supabase
        .from("dashboard_layouts")
        .select("layout_data, template_id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching dashboard layout:", error);
        return getDefaultData();
      }

      if (!row || !row.layout_data) {
        return getDefaultData();
      }

      const layoutData = row.layout_data as {
        widgets?: string[];
        layout?: WidgetLayout[];
      };

      return {
        widgets: layoutData.widgets || DEFAULT_WIDGETS,
        layout: layoutData.layout || getDefaultLayout(layoutData.widgets || DEFAULT_WIDGETS),
        templateId: (row.template_id as DashboardTemplate) || "custom",
      };
    },
    enabled: !!workspaceId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const saveMutation = useMutation({
    mutationFn: async (newData: DashboardLayoutData) => {
      if (!workspaceId) throw new Error("No workspace selected");

      // Check if record exists
      const { data: existing } = await supabase
        .from("dashboard_layouts")
        .select("id")
        .eq("workspace_id", workspaceId)
        .maybeSingle();

      const layoutPayload = {
        widgets: newData.widgets,
        layout: newData.layout,
      };

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("dashboard_layouts")
          .update({
            layout_data: layoutPayload as unknown as Json,
            template_id: newData.templateId,
          })
          .eq("workspace_id", workspaceId);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from("dashboard_layouts")
          .insert({
            workspace_id: workspaceId,
            layout_data: layoutPayload as unknown as Json,
            template_id: newData.templateId,
          });

        if (error) throw error;
      }

      return newData;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(["dashboard-layout", workspaceId], newData);
    },
  });

  const saveLayout = (newData: Partial<DashboardLayoutData>) => {
    const current = data || getDefaultData();
    const merged: DashboardLayoutData = {
      widgets: newData.widgets ?? current.widgets,
      layout: newData.layout ?? current.layout,
      templateId: newData.templateId ?? current.templateId,
    };
    saveMutation.mutate(merged);
  };

  const addWidget = (widgetId: string) => {
    const current = data || getDefaultData();
    if (current.widgets.includes(widgetId)) return;

    const config = getWidgetById(widgetId);
    const size = config ? getSizeDefaults(config.defaultSize) : { w: 2, h: 2 };
    const w = Math.min(size.w, COLS);
    const maxY = Math.max(0, ...current.layout.map((l) => l.y + l.h));

    const newWidget: WidgetLayout = {
      id: widgetId,
      x: 0,
      y: maxY,
      w,
      h: size.h,
    };

    saveLayout({
      widgets: [...current.widgets, widgetId],
      layout: [...current.layout, newWidget],
      templateId: "custom",
    });
  };

  const removeWidget = (widgetId: string) => {
    const current = data || getDefaultData();
    saveLayout({
      widgets: current.widgets.filter((w) => w !== widgetId),
      layout: current.layout.filter((l) => l.id !== widgetId),
      templateId: "custom",
    });
  };

  const updateWidgetLayout = (widgetId: string, updates: Partial<WidgetLayout>) => {
    const current = data || getDefaultData();
    const newLayout = current.layout.map((item) =>
      item.id === widgetId ? { ...item, ...updates } : item
    );
    saveLayout({ layout: newLayout, templateId: "custom" });
  };

  const reorderWidgets = (newLayout: WidgetLayout[]) => {
    saveLayout({ layout: newLayout, templateId: "custom" });
  };

  const resetLayout = () => {
    const defaultData = getDefaultData();
    saveMutation.mutate(defaultData);
  };

  const applyTemplate = (templateWidgets: string[], templateId: DashboardTemplate) => {
    const newLayout = getDefaultLayout(templateWidgets);
    saveMutation.mutate({
      widgets: templateWidgets,
      layout: newLayout,
      templateId,
    });
  };

  return {
    data: data || getDefaultData(),
    isLoading,
    error,
    isSaving: saveMutation.isPending,
    addWidget,
    removeWidget,
    updateWidgetLayout,
    reorderWidgets,
    resetLayout,
    applyTemplate,
    saveLayout,
  };
}
