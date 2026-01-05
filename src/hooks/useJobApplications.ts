import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface JobApplication {
  id: string;
  job_offer_id: string;
  workspace_id: string;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string | null;
  cv_url: string | null;
  cover_letter: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  status: "new" | "reviewing" | "interview_scheduled" | "interview_done" | "offer" | "rejected" | "hired" | "withdrawn";
  notes: string | null;
  rating: number | null;
  interview_date: string | null;
  created_at: string;
  updated_at: string;
  job_offer?: { title: string } | null;
}

export const applicationStatusLabels: Record<JobApplication["status"], string> = {
  new: "Nouveau",
  reviewing: "En cours d'examen",
  interview_scheduled: "Entretien planifié",
  interview_done: "Entretien effectué",
  offer: "Offre envoyée",
  rejected: "Refusé",
  hired: "Embauché",
  withdrawn: "Désistement",
};

export const applicationStatusColors: Record<JobApplication["status"], string> = {
  new: "bg-blue-100 text-blue-800",
  reviewing: "bg-yellow-100 text-yellow-800",
  interview_scheduled: "bg-purple-100 text-purple-800",
  interview_done: "bg-indigo-100 text-indigo-800",
  offer: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  hired: "bg-emerald-100 text-emerald-800",
  withdrawn: "bg-gray-100 text-gray-800",
};

export function useJobApplications(offerId?: string) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["job-applications", activeWorkspace?.id, offerId],
    queryFn: async (): Promise<JobApplication[]> => {
      if (!activeWorkspace) return [];

      let query = supabase
        .from("job_applications")
        .select("*, job_offer:job_offers(title)")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (offerId) {
        query = query.eq("job_offer_id", offerId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as JobApplication[];
    },
    enabled: !!activeWorkspace,
  });
}

export function useCreateJobApplication() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (application: Partial<JobApplication>) => {
      if (!activeWorkspace) throw new Error("No workspace");

      const { data, error } = await (supabase
        .from("job_applications") as any)
        .insert({
          ...application,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      toast({ title: "Candidature ajoutée" });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible d'ajouter la candidature", variant: "destructive" });
    },
  });
}

export function useUpdateJobApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<JobApplication> & { id: string }) => {
      const { data, error } = await supabase
        .from("job_applications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      toast({ title: "Candidature mise à jour" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}

export function useDeleteJobApplication() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_applications")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["job-offers"] });
      toast({ title: "Candidature supprimée" });
    },
    onError: () => {
      toast({ title: "Erreur", variant: "destructive" });
    },
  });
}
