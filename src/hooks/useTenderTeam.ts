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
      
      // Manually resolve parent_member for sous-traitants
      const membersWithParent = data.map(member => {
        if (member.parent_member_id) {
          const parent = data.find(m => m.id === member.parent_member_id);
          return {
            ...member,
            parent_member: parent ? { id: parent.id, company: parent.company } : null,
          };
        }
        return { ...member, parent_member: null };
      });
      
      return membersWithParent as TenderTeamMember[];
    },
    enabled: !!tenderId,
  });

  // Get or create the workspace's own company in CRM
  const getOrCreateOwnCompany = async () => {
    if (!activeWorkspace?.id) return null;

    // Check if workspace company exists in CRM
    const { data: existingCompany } = await supabase
      .from("crm_companies")
      .select("id, name")
      .eq("workspace_id", activeWorkspace.id)
      .eq("name", activeWorkspace.name)
      .maybeSingle();

    if (existingCompany?.id) return existingCompany.id;

    // Create our own company in CRM with full workspace info
    const { data: newCompany, error: createError } = await supabase
      .from("crm_companies")
      .insert({
        workspace_id: activeWorkspace.id,
        name: activeWorkspace.name,
        industry: "architecture",
        address: (activeWorkspace as any).address || null,
        city: (activeWorkspace as any).city || null,
        postal_code: (activeWorkspace as any).postal_code || null,
        phone: (activeWorkspace as any).phone || null,
        email: (activeWorkspace as any).email || null,
        website: (activeWorkspace as any).website || null,
        siret: (activeWorkspace as any).siret || null,
        siren: (activeWorkspace as any).siren || null,
        vat_number: (activeWorkspace as any).vat_number || null,
        capital_social: (activeWorkspace as any).capital_social || null,
        forme_juridique: (activeWorkspace as any).forme_juridique || null,
        rcs_city: (activeWorkspace as any).rcs_city || null,
        code_naf: (activeWorkspace as any).code_naf || null,
        logo_url: (activeWorkspace as any).logo_url || null,
      })
      .select("id")
      .single();

    if (createError) {
      console.error("Error creating own company:", createError);
      return null;
    }
    return newCompany.id;
  };

  // Add own company to team (callable manually or automatically)
  const addOwnCompanyToTeam = useMutation({
    mutationFn: async (role: TenderTeamRole = "mandataire") => {
      if (!tenderId || !activeWorkspace?.id) throw new Error("Missing tender or workspace");

      const companyId = await getOrCreateOwnCompany();
      if (!companyId) throw new Error("Could not get or create company");

      // Check if already in team
      const existing = teamMembers.find(m => m.company?.id === companyId);
      if (existing) {
        // Update role if different
        if (existing.role !== role) {
          const { error: updateError } = await supabase
            .from("tender_team_members")
            .update({ role })
            .eq("id", existing.id);
          if (updateError) throw updateError;
        }
        return { alreadyExists: true, updated: existing.role !== role };
      }

      const { error: addError } = await supabase
        .from("tender_team_members")
        .insert({
          tender_id: tenderId,
          role,
          specialty: "architecte",
          company_id: companyId,
          status: "accepted",
        } as any);

      if (addError) throw addError;
      return { alreadyExists: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["tender-team", tenderId] });
      if (result.alreadyExists) {
        if (result.updated) {
          toast.success("Rôle de notre entreprise mis à jour");
        } else {
          toast.info("Notre entreprise est déjà dans l'équipe");
        }
      } else {
        toast.success("Notre entreprise ajoutée à l'équipe");
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout");
      console.error(error);
    },
  });

  // Check if own company is in team
  const ownCompanyInTeam = teamMembers.find(m => m.company?.name === activeWorkspace?.name);
  const isOwnCompanyMandataire = ownCompanyInTeam?.role === "mandataire";

  const addTeamMember = useMutation({
    mutationFn: async (member: {
      role: TenderTeamRole;
      specialty?: string;
      company_id?: string;
      contact_id?: string;
      notes?: string;
      parent_member_id?: string;
      fee_percentage?: number;
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
          parent_member_id: member.parent_member_id || null,
          fee_percentage: member.fee_percentage || null,
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
    addOwnCompanyToTeam,
    ownCompanyInTeam,
    isOwnCompanyMandataire,
    workspaceName: activeWorkspace?.name,
  };
}
