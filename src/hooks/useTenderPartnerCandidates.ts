import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type PartnerCandidateStatus = 'suggested' | 'contacted' | 'interested' | 'confirmed' | 'declined';

export interface PartnerCandidate {
  id: string;
  tender_id: string;
  workspace_id: string;
  company_id: string | null;
  contact_id: string | null;
  specialty: string;
  role: string;
  status: PartnerCandidateStatus;
  fee_percentage: number | null;
  fee_amount: number | null;
  invitation_sent_at: string | null;
  invitation_subject: string | null;
  invitation_body: string | null;
  response_notes: string | null;
  priority: number;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
    email: string | null;
    bet_specialties: string[] | null;
  };
  contact?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  };
}

export const CANDIDATE_STATUS_LABELS: Record<PartnerCandidateStatus, string> = {
  suggested: 'Suggéré',
  contacted: 'Contacté',
  interested: 'Intéressé',
  confirmed: 'Confirmé',
  declined: 'Décliné',
};

export const CANDIDATE_STATUS_COLORS: Record<PartnerCandidateStatus, string> = {
  suggested: 'bg-muted text-muted-foreground',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  interested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  declined: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export function useTenderPartnerCandidates(tenderId: string | undefined) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ["tender-partner-candidates", tenderId],
    queryFn: async () => {
      if (!tenderId) return [];

      const { data, error } = await supabase
        .from("tender_partner_candidates")
        .select(`
          *,
          company:crm_companies(id, name, logo_url, email, bet_specialties),
          contact:contacts(id, name, email, phone)
        `)
        .eq("tender_id", tenderId)
        .order("specialty")
        .order("priority", { ascending: false });

      if (error) throw error;
      return data as PartnerCandidate[];
    },
    enabled: !!tenderId,
  });

  const addCandidate = useMutation({
    mutationFn: async (input: {
      specialty: string;
      role?: string;
      company_id?: string;
      contact_id?: string;
      fee_percentage?: number;
      fee_amount?: number;
      priority?: number;
    }) => {
      if (!tenderId || !activeWorkspace) throw new Error("Missing tender ID or workspace");

      const { data, error } = await supabase
        .from("tender_partner_candidates")
        .insert({
          tender_id: tenderId,
          workspace_id: activeWorkspace.id,
          specialty: input.specialty,
          role: input.role || "cotraitant",
          company_id: input.company_id || null,
          contact_id: input.contact_id || null,
          fee_percentage: input.fee_percentage || null,
          fee_amount: input.fee_amount || null,
          priority: input.priority || 0,
          status: "suggested",
        })
        .select(`
          *,
          company:crm_companies(id, name, logo_url, email, bet_specialties),
          contact:contacts(id, name, email, phone)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-partner-candidates", tenderId] });
      toast.success("Candidat ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const updateCandidate = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PartnerCandidate> & { id: string }) => {
      // Remove enriched fields
      const { company, contact, ...dbUpdates } = updates as any;
      
      const { data, error } = await supabase
        .from("tender_partner_candidates")
        .update(dbUpdates)
        .eq("id", id)
        .select(`
          *,
          company:crm_companies(id, name, logo_url, email, bet_specialties),
          contact:contacts(id, name, email, phone)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-partner-candidates", tenderId] });
    },
  });

  const removeCandidate = useMutation({
    mutationFn: async (candidateId: string) => {
      const { error } = await supabase
        .from("tender_partner_candidates")
        .delete()
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-partner-candidates", tenderId] });
      toast.success("Candidat retiré");
    },
  });

  const confirmToTeam = useMutation({
    mutationFn: async (candidateId: string) => {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) throw new Error("Candidate not found");

      // Add to team members - cast role to expected type
      const teamRole = candidate.role as "mandataire" | "cotraitant" | "sous_traitant";
      
      const insertPayload: {
        tender_id: string;
        role: "mandataire" | "cotraitant" | "sous_traitant";
        specialty: string;
        company_id: string | null;
        contact_id: string | null;
        status: "pending" | "accepted" | "declined";
        notes: string | null;
      } = {
        tender_id: tenderId!,
        role: teamRole,
        specialty: candidate.specialty,
        company_id: candidate.company_id,
        contact_id: candidate.contact_id,
        status: "accepted",
        notes: candidate.fee_percentage ? `Honoraires: ${candidate.fee_percentage}%` : null,
      };
      
      console.log("Inserting team member:", insertPayload);
      
      const { data: teamData, error: teamError } = await supabase
        .from("tender_team_members")
        .insert(insertPayload)
        .select()
        .single();

      if (teamError) {
        console.error("Team insert error:", teamError);
        throw teamError;
      }
      
      console.log("Team member created:", teamData);

      // Update candidate status
      const { error: updateError } = await supabase
        .from("tender_partner_candidates")
        .update({ status: "confirmed" })
        .eq("id", candidateId);

      if (updateError) throw updateError;
      
      return teamData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-partner-candidates", tenderId] });
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      toast.success("Partenaire ajouté à l'équipe");
    },
    onError: (error: any) => {
      toast.error(`Erreur: ${error.message || "Confirmation impossible"}`);
      console.error("confirmToTeam error:", error);
    },
  });

  const sendBulkInvitations = useMutation({
    mutationFn: async (data: {
      candidateIds: string[];
      subject: string;
      body: string;
      includeFeesProposal: boolean;
    }) => {
      const results = [];
      
      for (const candidateId of data.candidateIds) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate?.contact?.email) continue;

        let bodyWithFees = data.body;
        if (data.includeFeesProposal && candidate.fee_percentage) {
          bodyWithFees += `\n\nProposition d'honoraires: ${candidate.fee_percentage}% des honoraires globaux`;
          if (candidate.fee_amount) {
            bodyWithFees += ` (soit environ ${candidate.fee_amount.toLocaleString('fr-FR')}€ HT)`;
          }
        }

        try {
          const { data: result, error } = await supabase.functions.invoke("send-partner-invitation", {
            body: {
              to: candidate.contact.email,
              subject: data.subject,
              body: bodyWithFees,
              tenderId,
              memberId: candidateId,
            },
          });

          if (error) throw error;

          // Update candidate status
          await supabase
            .from("tender_partner_candidates")
            .update({
              status: "contacted",
              invitation_sent_at: new Date().toISOString(),
              invitation_subject: data.subject,
              invitation_body: bodyWithFees,
            })
            .eq("id", candidateId);

          results.push({ candidateId, success: true });
        } catch (error) {
          console.error(`Failed to send to ${candidateId}:`, error);
          results.push({ candidateId, success: false, error });
        }
      }

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ["tender-partner-candidates", tenderId] });
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;
      if (failCount > 0) {
        toast.warning(`${successCount} invitation(s) envoyée(s), ${failCount} échec(s)`);
      } else {
        toast.success(`${successCount} invitation(s) envoyée(s)`);
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    },
  });

  // Group by specialty
  const candidatesBySpecialty = candidates.reduce((acc, c) => {
    if (!acc[c.specialty]) acc[c.specialty] = [];
    acc[c.specialty].push(c);
    return acc;
  }, {} as Record<string, PartnerCandidate[]>);

  // Get statistics
  const stats = {
    total: candidates.length,
    suggested: candidates.filter(c => c.status === 'suggested').length,
    contacted: candidates.filter(c => c.status === 'contacted').length,
    interested: candidates.filter(c => c.status === 'interested').length,
    confirmed: candidates.filter(c => c.status === 'confirmed').length,
    declined: candidates.filter(c => c.status === 'declined').length,
  };

  return {
    candidates,
    candidatesBySpecialty,
    stats,
    isLoading,
    addCandidate,
    updateCandidate,
    removeCandidate,
    confirmToTeam,
    sendBulkInvitations,
  };
}
