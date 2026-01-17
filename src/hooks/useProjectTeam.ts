import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProjectTeamMember {
  id: string;
  user_id: string | null;
  role: string;
  is_external: boolean;
  external_contact_id: string | null;
  notes: string | null;
  profile?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  contact?: {
    id: string;
    name: string;
    avatar_url: string | null;
    email: string | null;
    phone: string | null;
  };
}

export const INTERNAL_ROLES = [
  { value: "lead", label: "Chef de projet" },
  { value: "member", label: "Membre" },
  { value: "viewer", label: "Observateur" },
];

export const EXTERNAL_ROLES = [
  { value: "freelance", label: "Freelance" },
  { value: "consultant", label: "Consultant" },
  { value: "sous_traitant", label: "Sous-traitant" },
  { value: "partenaire", label: "Partenaire" },
  { value: "moe", label: "Maître d'œuvre" },
  { value: "bet", label: "BET" },
];

export function useProjectTeam(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data: members = [], isLoading, error } = useQuery({
    queryKey: ["project-team", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      // Get internal member profiles
      const internalMembers = data?.filter(m => !m.is_external) || [];
      const userIds = internalMembers.map((m) => m.user_id).filter(Boolean);
      
      let profiles: any[] = [];
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        profiles = profilesData || [];
      }

      // Get external member contacts
      const externalMembers = data?.filter(m => m.is_external) || [];
      const contactIds = externalMembers.map(m => m.external_contact_id).filter(Boolean);
      
      let contacts: any[] = [];
      if (contactIds.length > 0) {
        const { data: contactsData } = await supabase
          .from("contacts")
          .select("id, name, avatar_url, email, phone")
          .in("id", contactIds);
        contacts = contactsData || [];
      }

      // Merge all data
      return data?.map((member) => ({
        ...member,
        profile: profiles.find((p) => p.user_id === member.user_id),
        contact: contacts.find((c) => c.id === member.external_contact_id),
      })) as ProjectTeamMember[];
    },
    enabled: !!projectId,
  });

  const internalMembers = members.filter(m => !m.is_external);
  const externalMembers = members.filter(m => m.is_external);
  const leadMember = internalMembers.find(m => m.role === "lead");

  const getRoleLabel = (role: string, isExternal: boolean) => {
    const roles = isExternal ? EXTERNAL_ROLES : INTERNAL_ROLES;
    return roles.find(r => r.value === role)?.label || role;
  };

  return {
    members,
    internalMembers,
    externalMembers,
    leadMember,
    isLoading,
    error,
    getRoleLabel,
    invalidate: () => queryClient.invalidateQueries({ queryKey: ["project-team", projectId] }),
  };
}
