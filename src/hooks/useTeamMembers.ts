import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profile: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    job_title: string | null;
    phone: string | null;
    department: string | null;
  } | null;
}

export function useTeamMembers() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["team-members", activeWorkspace?.id],
    queryFn: async (): Promise<TeamMember[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("workspace_members")
        .select(`
          id,
          user_id,
          role,
          joined_at,
          profiles:user_id (
            id,
            full_name,
            avatar_url,
            email,
            job_title,
            phone,
            department
          )
        `)
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;

      return (data || []).map((member: any) => ({
        ...member,
        profile: member.profiles,
      }));
    },
    enabled: !!activeWorkspace,
  });
}
