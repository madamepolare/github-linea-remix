import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import type { TenderTeamMember, TenderTeamRole, InvitationResponse } from "@/lib/tenderTypes";

export function useTenderTeam(tenderId: string | undefined) {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useAuth();

  const { data: teamMembers = [], isLoading } = useQuery({
    queryKey: ["tender-team", tenderId],
    queryFn: async () => {
      if (!tenderId) return [];
      
      const { data, error } = await supabase
        .from("tender_team_members")
        .select(`
          *,
          company:crm_companies(id, name, logo_url),
          contact:contacts(id, name, email)
        `)
        .eq("tender_id", tenderId)
        .order("created_at");
      
      if (error) throw error;
      return data as TenderTeamMember[];
    },
    enabled: !!tenderId,
  });

  // Auto-add "nous" (own company) as default team member if team is empty
  useEffect(() => {
    const addOwnCompanyToTeam = async () => {
      if (!tenderId || !activeWorkspace?.id || isLoading || teamMembers.length > 0) return;

      // Check or create CRM company for our workspace
      const { data: existingCompany } = await supabase
        .from("crm_companies")
        .select("id")
        .eq("workspace_id", activeWorkspace.id)
        .eq("name", activeWorkspace.name)
        .maybeSingle();

      let companyId = existingCompany?.id;

      if (!companyId) {
        // Create our own company in CRM
        const { data: newCompany, error: createError } = await supabase
          .from("crm_companies")
          .insert({
            workspace_id: activeWorkspace.id,
            name: activeWorkspace.name,
            industry: "architecture",
          })
          .select("id")
          .single();

        if (createError) {
          console.error("Error creating own company:", createError);
          return;
        }
        companyId = newCompany.id;
      }

      // Add as cotraitant by default (can be changed to mandataire later)
      const { error: addError } = await supabase
        .from("tender_team_members")
        .insert({
          tender_id: tenderId,
          role: "cotraitant",
          specialty: "architecte",
          company_id: companyId,
          status: "accepted",
        } as any);

      if (addError) {
        console.error("Error adding team member:", addError);
        return;
      }

      // Invalidate to refresh
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
    };

    addOwnCompanyToTeam();
  }, [tenderId, activeWorkspace, isLoading, teamMembers.length, queryClient]);

  const addTeamMember = useMutation({
    mutationFn: async (member: {
      role: TenderTeamRole;
      specialty?: string;
      company_id?: string;
      contact_id?: string;
      notes?: string;
    }) => {
      if (!tenderId) throw new Error("No tender ID");

      const { data, error } = await supabase
        .from("tender_team_members")
        .insert({
          tender_id: tenderId,
          role: member.role,
          specialty: member.specialty || null,
          company_id: member.company_id || null,
          contact_id: member.contact_id || null,
          notes: member.notes || null,
          status: "pending",
        } as any)
        .select(`
          *,
          company:crm_companies(id, name, logo_url),
          contact:contacts(id, name, email)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      toast.success("Membre ajouté à l'équipe");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  const updateTeamMember = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenderTeamMember> & { id: string }) => {
      const { data, error } = await supabase
        .from("tender_team_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      toast.success("Membre mis à jour");
    },
  });

  const removeTeamMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("tender_team_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      toast.success("Membre retiré de l'équipe");
    },
  });

  const sendInvitation = useMutation({
    mutationFn: async ({ 
      memberId,
      subject,
      body,
    }: { 
      memberId: string;
      subject: string;
      body: string;
    }) => {
      const member = teamMembers.find(m => m.id === memberId);
      if (!member?.contact?.email) throw new Error("No email for contact");

      const { data, error } = await supabase.functions.invoke("send-partner-invitation", {
        body: {
          to: member.contact.email,
          subject,
          body,
          tenderId,
          memberId,
        },
      });

      if (error) throw error;

      // Update member status
      await supabase
        .from("tender_team_members")
        .update({ 
          status: "pending",
          invited_at: new Date().toISOString(),
        })
        .eq("id", memberId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      toast.success("Invitation envoyée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'envoi");
      console.error(error);
    },
  });

  // Group by role
  const teamByRole = {
    mandataire: teamMembers.filter(m => m.role === "mandataire"),
    cotraitant: teamMembers.filter(m => m.role === "cotraitant"),
    sous_traitant: teamMembers.filter(m => m.role === "sous_traitant"),
  };

  return {
    teamMembers,
    teamByRole,
    isLoading,
    addTeamMember,
    updateTeamMember,
    removeTeamMember,
    sendInvitation,
  };
}
