import { Users, Building2, TrendingUp, Target } from "lucide-react";
import { StatsWidget } from "./StatsWidget";
import { useLeads } from "@/hooks/useLeads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function CRMStatsWidget() {
  const { activeWorkspace } = useAuth();
  const { leads, stats, isLoading: leadsLoading } = useLeads();

  // Fetch companies and contacts count
  const { data: crmData, isLoading: crmLoading } = useQuery({
    queryKey: ["crm-counts", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return { companies: 0, contacts: 0 };

      const [companiesResult, contactsResult] = await Promise.all([
        supabase
          .from("crm_companies")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id),
        supabase
          .from("contacts")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", activeWorkspace.id),
      ]);

      return {
        companies: companiesResult.count || 0,
        contacts: contactsResult.count || 0,
      };
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = leadsLoading || crmLoading;

  // Calculate conversion rate (won / total * 100)
  const conversionRate = stats.total > 0 
    ? Math.round((leads.filter(l => l.status === 'won').length / stats.total) * 100) 
    : 0;

  const statsData = [
    {
      label: "Contacts",
      value: crmData?.contacts ?? 0,
      icon: Users,
      color: "bg-accent/10 text-accent",
    },
    {
      label: "Entreprises",
      value: crmData?.companies ?? 0,
      icon: Building2,
      color: "bg-info/10 text-info",
    },
    {
      label: "Opportunités",
      value: stats.total,
      icon: Target,
      color: "bg-success/10 text-success",
    },
    {
      label: "Taux conversion",
      value: `${conversionRate}%`,
      icon: TrendingUp,
      color: "bg-warning/10 text-warning",
    },
  ];

  return <StatsWidget stats={statsData} isLoading={isLoading} columns={4} />;
}
