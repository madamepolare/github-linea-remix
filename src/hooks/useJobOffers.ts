import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface JobOffer {
  id: string;
  workspace_id: string;
  created_by: string;
  title: string;
  description: string | null;
  requirements: string | null;
  contract_type: "cdi" | "cdd" | "stage" | "alternance" | "freelance";
  location: string | null;
  remote_policy: "onsite" | "hybrid" | "remote";
  salary_min: number | null;
  salary_max: number | null;
  status: "draft" | "published" | "paused" | "closed";
  published_at: string | null;
  closes_at: string | null;
  created_at: string;
  updated_at: string;
  applications_count?: number;
}

export const contractTypeLabels: Record<JobOffer["contract_type"], string> = {
  cdi: "CDI",
  cdd: "CDD",
  stage: "Stage",
  alternance: "Alternance",
  freelance: "Freelance",
};

export const remotePolicyLabels: Record<JobOffer["remote_policy"], string> = {
  onsite: "Sur site",
  hybrid: "Hybride",
  remote: "Full remote",
};

export function useJobOffers(filters?: { status?: string }) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["job-offers", activeWorkspace?.id, filters],
    queryFn: async (): Promise<JobOffer[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("job_offers")
        .select("*, applications:job_applications(count)")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      return (data || []).map((offer: any) => ({
        ...offer,
        applications_count: offer.applications?.[0]?.count || 0,
      }));
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateJobOffer() {
  const queryClient = useQueryClient();
  const { activeWorkspace, user } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (offer: Partial<JobOffer>) => {
      if (!activeWorkspace || !user) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("job_offers") as any)
        .insert({
          ...offer,
          workspace_id: activeWorkspace.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      toast({ title: "Offre créée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de créer l'offre", variant: "destructive" });
    },
  });
}

export function useUpdateJobOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobOffer> & { id: string }) => {
      const { data, error } = await supabase
        .from("job_offers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      toast({ title: "Offre mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteJobOffer() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_offers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      toast({ title: "Offre supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
