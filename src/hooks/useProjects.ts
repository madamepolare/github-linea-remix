import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Project {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  client: string | null;
  phase: string;
  status: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: ProjectMember[];
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useProjects() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createProject = useMutation({
    mutationFn: async (project: Omit<Project, "id" | "created_at" | "updated_at" | "members">) => {
      const { data, error } = await supabase
        .from("projects")
        .insert(project)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project created");
    },
    onError: (error) => {
      toast.error("Failed to create project");
      console.error(error);
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: string }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
    onError: (error) => {
      toast.error("Failed to update project");
      console.error(error);
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted");
    },
    onError: (error) => {
      toast.error("Failed to delete project");
      console.error(error);
    },
  });

  return {
    projects: projects || [],
    isLoading,
    error,
    createProject,
    updateProject,
    deleteProject,
  };
}

export function useProjectMembers(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      return data as ProjectMember[];
    },
    enabled: !!projectId,
  });

  const addMember = useMutation({
    mutationFn: async ({ projectId, userId, role = "member" }: { projectId: string; userId: string; role?: string }) => {
      const { data, error } = await supabase
        .from("project_members")
        .insert({ project_id: projectId, user_id: userId, role })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("project_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
    },
  });

  return {
    members: members || [],
    isLoading,
    addMember,
    removeMember,
  };
}
