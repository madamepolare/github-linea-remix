import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProjectType, generateDefaultPhases, PhaseStatus } from "@/lib/projectTypes";

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
  // New fields
  project_type: ProjectType | null;
  crm_company_id: string | null;
  lead_id?: string | null;
  address: string | null;
  city: string | null;
  postal_code?: string | null;
  surface?: number | null;
  surface_area: number | null;
  ai_summary: string | null;
  current_phase_id: string | null;
  // Relations
  crm_company?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  lead?: {
    id: string;
    title: string;
    status: string;
    estimated_value: number | null;
  } | null;
  phases?: ProjectPhase[];
}

export interface ProjectPhase {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  sort_order: number;
  start_date: string | null;
  end_date: string | null;
  status: PhaseStatus;
  color: string | null;
  created_at: string;
  updated_at: string;
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

export interface CreateProjectInput {
  name: string;
  project_type: ProjectType;
  description?: string | null;
  client?: string | null;
  crm_company_id?: string | null;
  address?: string | null;
  city?: string | null;
  surface_area?: number | null;
  color?: string;
  start_date?: string | null;
  end_date?: string | null;
  budget?: number | null;
}

export function useProjects() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      // Fetch projects with CRM company relation
      const { data: projectsData, error: projectsError } = await supabase
        .from("projects")
        .select(`
          *,
          crm_company:crm_companies(id, name, logo_url)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch phases for all projects
      const projectIds = projectsData?.map(p => p.id) || [];
      
      if (projectIds.length > 0) {
        const { data: phasesData, error: phasesError } = await supabase
          .from("project_phases")
          .select("*")
          .in("project_id", projectIds)
          .order("sort_order", { ascending: true });

        if (phasesError) throw phasesError;

        // Map phases to projects
        return projectsData?.map(project => ({
          ...project,
          phases: phasesData?.filter(phase => phase.project_id === project.id) || []
        })) as Project[];
      }

      return projectsData as Project[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const createProject = useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      if (!activeWorkspace?.id || !user?.id) {
        throw new Error("Missing workspace or user");
      }

      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          name: input.name,
          project_type: input.project_type,
          description: input.description || null,
          client: input.client || null,
          crm_company_id: input.crm_company_id || null,
          address: input.address || null,
          city: input.city || null,
          surface_area: input.surface_area || null,
          color: input.color || "#3B82F6",
          start_date: input.start_date || null,
          end_date: input.end_date || null,
          budget: input.budget || null,
          phase: "planning",
          status: "active",
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Generate default phases for the project type with dates
      const defaultPhases = generateDefaultPhases(
        input.project_type, 
        project.id, 
        activeWorkspace.id,
        input.start_date,
        input.end_date
      );
      
      if (defaultPhases.length > 0) {
        const phasesToInsert = defaultPhases.map((phase, index) => ({
          workspace_id: activeWorkspace.id,
          project_id: project.id,
          name: phase.name,
          description: phase.description,
          sort_order: index,
          status: phase.status,
          color: phase.color,
          start_date: phase.start_date,
          end_date: phase.end_date,
        }));

        const { error: phasesError } = await supabase
          .from("project_phases")
          .insert(phasesToInsert);

        if (phasesError) {
          console.error("Error creating phases:", phasesError);
        }
      }

      return project;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Projet créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du projet");
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
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: ["projects", activeWorkspace?.id] });
      const previousProjects = queryClient.getQueryData(["projects", activeWorkspace?.id]);

      queryClient.setQueryData(
        ["projects", activeWorkspace?.id],
        (old: Project[] | undefined) =>
          old?.map((project) =>
            project.id === id ? { ...project, ...updates } : project
          )
      );

      return { previousProjects };
    },
    onError: (error, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(["projects", activeWorkspace?.id], context.previousProjects);
      }
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
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
      toast.success("Projet supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
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

export function useProject(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["project", projectId, activeWorkspace?.id],
    queryFn: async () => {
      if (!projectId) return null;

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          crm_company:crm_companies(id, name, logo_url, email, phone)
        `)
        .eq("id", projectId)
        .single();

      if (error) throw error;

      // Fetch phases
      const { data: phases, error: phasesError } = await supabase
        .from("project_phases")
        .select("*")
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (phasesError) throw phasesError;

      return { ...data, phases } as Project;
    },
    enabled: !!projectId && !!activeWorkspace?.id,
  });
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
