import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProjectCategorySettings } from "@/hooks/useProjectCategorySettings";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CategoryRevenue {
  key: string;
  label: string;
  color: string;
  revenue: number;
  invoiceCount: number;
}

export function RevenueByCategoryWidget() {
  const { activeWorkspace } = useAuth();
  const { categories } = useProjectCategorySettings();

  const { data: invoicesWithProjects, isLoading } = useQuery({
    queryKey: ["revenue-by-category", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("invoices")
        .select(`
          id,
          total_ttc,
          status,
          project_id,
          projects!invoices_project_id_fkey(project_category)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .neq("status", "cancelled")
        .neq("status", "draft");

      if (error) throw error;
      return data || [];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const revenueByCategory = useMemo<CategoryRevenue[]>(() => {
    if (!invoicesWithProjects || !categories) return [];

    const categoryMap = new Map<string, { revenue: number; count: number }>();

    invoicesWithProjects.forEach((invoice) => {
      const projectCategory = (invoice.projects as any)?.project_category || "non_defini";
      const existing = categoryMap.get(projectCategory) || { revenue: 0, count: 0 };
      categoryMap.set(projectCategory, {
        revenue: existing.revenue + (invoice.total_ttc || 0),
        count: existing.count + 1,
      });
    });

    const result: CategoryRevenue[] = [];

    categoryMap.forEach((data, key) => {
      const categoryConfig = categories.find((c) => c.key === key);
      result.push({
        key,
        label: categoryConfig?.label || key,
        color: categoryConfig?.color || "#6B7280",
        revenue: data.revenue,
        invoiceCount: data.count,
      });
    });

    return result.sort((a, b) => b.revenue - a.revenue);
  }, [invoicesWithProjects, categories]);

  const totalRevenue = revenueByCategory.reduce((sum, c) => sum + c.revenue, 0);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M €`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}k €`;
    return `${value.toLocaleString("fr-FR")} €`;
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (!revenueByCategory.length) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Aucune donnée disponible
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="mb-3">
        <span className="text-2xl font-semibold tabular-nums">{formatCurrency(totalRevenue)}</span>
        <span className="text-xs text-muted-foreground ml-2">CA total</span>
      </div>

      <div className="flex-1 space-y-2 overflow-auto">
        {revenueByCategory.map((category) => {
          const percentage = totalRevenue > 0 ? (category.revenue / totalRevenue) * 100 : 0;

          return (
            <div key={category.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-sm font-medium truncate">{category.label}</span>
                  <span className="text-xs text-muted-foreground">
                    ({category.invoiceCount})
                  </span>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(category.revenue)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: category.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
