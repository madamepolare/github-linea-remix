import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

export interface WorkspaceSubscription {
  id: string;
  workspace_id: string;
  plan_id: string;
  status: "active" | "cancelled" | "past_due" | "trialing";
  billing_period: "monthly" | "yearly";
  current_period_start: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan?: Plan;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("is_active", true)
        .order("sort_order") as any;

      if (error) throw error;
      return (data || []) as Plan[];
    },
  });
}

export function useWorkspaceSubscription() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["workspace-subscription", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from("workspace_subscriptions")
        .select("*, plan:plans(*)")
        .eq("workspace_id", activeWorkspace.id)
        .single() as any;

      if (error && error.code !== "PGRST116") throw error;
      return data as WorkspaceSubscription | null;
    },
    enabled: !!activeWorkspace?.id,
  });
}

export function useSubscriptionMutations() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subscribeToPlan = useMutation({
    mutationFn: async ({ planId, billingPeriod }: { planId: string; billingPeriod: "monthly" | "yearly" }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // Check if subscription exists
      const { data: existing } = await supabase
        .from("workspace_subscriptions")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .single() as any;

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("workspace_subscriptions")
          .update({
            plan_id: planId,
            billing_period: billingPeriod,
            status: "active",
            current_period_start: new Date().toISOString(),
          })
          .eq("id", existing.id) as any;
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("workspace_subscriptions")
          .insert({
            workspace_id: activeWorkspace.id,
            plan_id: planId,
            billing_period: billingPeriod,
            status: "active",
          }) as any;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace-subscription"] });
      toast({ title: "Plan mis à jour" });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    },
  });

  return { subscribeToPlan };
}
