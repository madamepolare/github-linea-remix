import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MyProject {
  id: string;
  name: string;
  status: string;
  color: string | null;
  start_date: string | null;
  end_date: string | null;
  client_company?: { name: string } | null;
}

export function useMyProjects() {
  const { user, activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["my-projects", user?.id, activeWorkspace?.id],
    queryFn: async (): Promise<MyProject[]> => {
      if (!user || !activeWorkspace) return [];

      // Get projects where I'm a member
      const { data: memberships, error: membershipError } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", user.id);

      if (membershipError) throw membershipError;

      const projectIds = memberships?.map(m => m.project_id) || [];
      
      if (projectIds.length === 0) return [];

      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id, name, status, color, start_date, end_date")
        .eq("workspace_id", activeWorkspace.id)
        .in("id", projectIds)
        .order("updated_at", { ascending: false });

      if (projectsError) throw projectsError;

      return (projects || []).map(p => ({
        id: p.id,
        name: p.name,
        status: p.status,
        color: p.color,
        start_date: p.start_date,
        end_date: p.end_date,
        client_company: null
      })) as MyProject[];
    },
    enabled: !!user && !!activeWorkspace,
  });
}
