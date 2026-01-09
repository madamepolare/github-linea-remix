import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
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

      // Fetch workspace members (exclude hidden ones)
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("id, user_id, role, created_at")
        .eq("workspace_id", activeWorkspace.id)
        .neq("is_hidden", true);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      // Fetch profiles separately
      const userIds = members.map(m => m.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, id, full_name, avatar_url, job_title, phone")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      // Create a map of profiles by user_id
      const profileMap = new Map(
        (profiles || []).map(p => [p.user_id, p])
      );

      // Combine members with their profiles
      return members.map(member => {
        const profile = profileMap.get(member.user_id);
        return {
          id: member.id,
          user_id: member.user_id,
          role: member.role,
          created_at: member.created_at,
          profile: profile ? {
            id: profile.id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            email: null,
            job_title: profile.job_title,
            phone: profile.phone,
            department: null,
          } : null,
        };
      });
    },
    enabled: !!activeWorkspace,
  });
}
