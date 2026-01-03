import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface WorkspaceProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  job_title: string | null;
}

export function useWorkspaceProfiles() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["workspace-profiles", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      // Get all workspace members
      const { data: members, error: membersError } = await supabase
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", activeWorkspace.id);

      if (membersError) throw membersError;
      if (!members || members.length === 0) return [];

      const userIds = members.map((m) => m.user_id);

      // Get profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, user_id, full_name, avatar_url, job_title")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      return (profiles || []) as WorkspaceProfile[];
    },
    enabled: !!activeWorkspace?.id,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

export function useUserProfile(userId: string | null | undefined) {
  const { data: profiles } = useWorkspaceProfiles();
  
  if (!userId || !profiles) return null;
  return profiles.find((p) => p.user_id === userId) || null;
}
