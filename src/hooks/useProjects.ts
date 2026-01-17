import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProjectType, generateDefaultPhases, PhaseStatus } from "@/lib/projectTypes";
import { ProjectCategory, categoryHasFeature } from "@/lib/projectCategories";

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
  is_archived: boolean;
  is_internal: boolean;
  // Category and type
  project_category: ProjectCategory;
  project_type: ProjectType | null;
  monthly_budget: number | null;
  auto_renew: boolean;
  // Location and details
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
  client_daily_rate: number | null;
  created_at: string;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface ProjectContactInput {
  contact_id: string;
  role: string;
  is_primary?: boolean;
}

export interface CreateProjectInput {
  name: string;
  project_type: ProjectType;
  project_category?: ProjectCategory;
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
  monthly_budget?: number | null;
  auto_renew?: boolean;
  is_internal?: boolean;
  client_contacts?: ProjectContactInput[];
}

export type ProjectStatus = 'active' | 'completed' | 'closed';

export function useProjects(options?: { 
  includeArchived?: boolean; 
  includeClosed?: boolean;
  parentId?: string | null;
}) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ["projects", activeWorkspace?.id, options?.includeArchived, options?.includeClosed, options?.parentId],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      // Fetch projects with CRM company relation
      let query = supabase
        .from("projects")
        .select(`
          *,
          crm_company:crm_companies(id, name, logo_url)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      // Filter out archived projects unless explicitly requested
      if (!options?.includeArchived) {
        query = query.eq("is_archived", false);
      }

      // Filter out closed projects unless explicitly requested
      if (!options?.includeClosed) {
        query = query.neq("status", "closed");
      }

      // Filter by parent_id (null for main projects, specific id for sub-projects)
      if (options?.parentId === undefined) {
        // Default: show only main projects (no parent)
        query = query.is("parent_id", null);
      } else if (options?.parentId !== null) {
        // Show sub-projects of a specific parent
        query = query.eq("parent_id", options.parentId);
      }
      // If parentId is null, we don't add a filter (show all)

      const { data: projectsData, error: projectsError } = await query;

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

      // Determine category
      const category = input.project_category || 'standard';
      const isInternal = category === 'internal' || input.is_internal;
      
      // Create the project
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .insert({
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          name: input.name,
          project_type: input.project_type,
          project_category: category,
          description: input.description || null,
          client: input.client || null,
          crm_company_id: isInternal ? null : (input.crm_company_id || null),
          address: isInternal ? null : (input.address || null),
          city: isInternal ? null : (input.city || null),
          surface_area: input.surface_area || null,
          color: input.color || "#3B82F6",
          start_date: input.start_date || null,
          end_date: categoryHasFeature(category, 'hasEndDate') ? (input.end_date || null) : null,
          budget: categoryHasFeature(category, 'hasBudget') ? (input.budget || null) : null,
          monthly_budget: categoryHasFeature(category, 'hasMonthlyBudget') ? (input.monthly_budget || null) : null,
          auto_renew: categoryHasFeature(category, 'hasAutoRenew') ? (input.auto_renew || false) : false,
          phase: "planning",
          status: "active",
          is_internal: isInternal,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Generate default phases only for categories that support phases
      if (categoryHasFeature(category, 'hasPhases')) {
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
      }

      // Create project contacts if provided
      if (input.client_contacts && input.client_contacts.length > 0) {
        const contactsToInsert = input.client_contacts.map((contact, index) => ({
          workspace_id: activeWorkspace.id,
          project_id: project.id,
          contact_id: contact.contact_id,
          role: contact.role,
          is_primary: contact.is_primary || index === 0,
          contact_type: "client",
        }));

        const { error: contactsError } = await supabase
          .from("project_contacts")
          .insert(contactsToInsert);

        if (contactsError) {
          console.error("Error creating project contacts:", contactsError);
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

  const archiveProject = useMutation({
    mutationFn: async ({ id, isArchived }: { id: string; isArchived: boolean }) => {
      const { error } = await supabase
        .from("projects")
        .update({ is_archived: isArchived })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { isArchived }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isArchived ? "Projet archivé" : "Projet restauré");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'archivage");
      console.error(error);
    },
  });

  const closeProject = useMutation({
    mutationFn: async ({ id, isClosed }: { id: string; isClosed: boolean }) => {
      const { error } = await supabase
        .from("projects")
        .update({ status: isClosed ? 'closed' : 'active' })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, { isClosed }) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success(isClosed ? "Projet fermé" : "Projet réouvert");
    },
    onError: (error) => {
      toast.error("Erreur lors de la fermeture");
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
    archiveProject,
    closeProject,
    deleteProject,
  };
}

// Hook to get sub-projects for a specific parent
export function useSubProjects(parentId: string | null) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["sub-projects", parentId, activeWorkspace?.id],
    queryFn: async () => {
      if (!parentId || !activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          crm_company:crm_companies(id, name, logo_url)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .eq("parent_id", parentId)
        .eq("is_archived", false)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch phases
      const projectIds = data?.map(p => p.id) || [];
      if (projectIds.length > 0) {
        const { data: phasesData } = await supabase
          .from("project_phases")
          .select("*")
          .in("project_id", projectIds)
          .order("sort_order", { ascending: true });

        return data?.map(project => ({
          ...project,
          phases: phasesData?.filter(phase => phase.project_id === project.id) || []
        })) as Project[];
      }

      return data as Project[];
    },
    enabled: !!parentId && !!activeWorkspace?.id,
  });
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

// Hook to get project members with profiles for multiple projects at once (for list views)
export function useProjectMembersForList(projectIds: string[]) {
  return useQuery({
    queryKey: ["project-members-for-list", projectIds],
    queryFn: async () => {
      if (!projectIds.length) return {};

      // Get all project members for the given project IDs
      const { data: membersData, error } = await supabase
        .from("project_members")
        .select("*")
        .in("project_id", projectIds);

      if (error) throw error;
      if (!membersData || membersData.length === 0) return {};

      // Get profiles for these members (filter out null user_ids from external members)
      const userIds = [...new Set(membersData.map(m => m.user_id).filter(Boolean))] as string[];
      
      let profiles: { user_id: string; full_name: string | null; avatar_url: string | null }[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }


      // Group by project_id
      const membersByProject: Record<string, (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[]> = {};
      
      for (const member of membersData) {
        if (!membersByProject[member.project_id]) {
          membersByProject[member.project_id] = [];
        }
        membersByProject[member.project_id].push({
          ...member,
          profile: profiles?.find(p => p.user_id === member.user_id) || null
        });
      }

      return membersByProject;
    },
    enabled: projectIds.length > 0,
  });
}

export function useProjectMembers(projectId: string | null) {
  const queryClient = useQueryClient();

  const { data: members, isLoading } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      // Get project members
      const { data: membersData, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;
      if (!membersData || membersData.length === 0) return [];

      // Get profiles for internal members only (filter out null user_ids from external members)
      const userIds = membersData.map(m => m.user_id).filter((id): id is string => id !== null);
      
      let profiles: { user_id: string; full_name: string | null; avatar_url: string | null }[] = [];
      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", userIds);
        
        if (profilesError) throw profilesError;
        profiles = profilesData || [];
      }


      // Join manually
      return membersData.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id) || null
      })) as (ProjectMember & { profile: { user_id: string; full_name: string | null; avatar_url: string | null } | null })[];
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
      queryClient.invalidateQueries({ queryKey: ["user-project-ids"] });
      toast.success("Membre ajouté au projet");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ce membre est déjà assigné au projet");
      } else {
        toast.error("Erreur lors de l'ajout du membre");
      }
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
      queryClient.invalidateQueries({ queryKey: ["user-project-ids"] });
      toast.success("Membre retiré du projet");
    },
  });

  const setMembers = useMutation({
    mutationFn: async ({ projectId, userIds }: { projectId: string; userIds: string[] }) => {
      // Delete all existing members
      await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId);

      // Insert new members
      if (userIds.length > 0) {
        const { error } = await supabase
          .from("project_members")
          .insert(userIds.map(userId => ({
            project_id: projectId,
            user_id: userId,
            role: "member"
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["user-project-ids"] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des membres");
    },
  });

  return {
    members: members || [],
    isLoading,
    addMember,
    removeMember,
    setMembers,
  };
}

/**
 * Hook to get project IDs where a user is a member
 * Used for planning view to show events from assigned projects
 */
export function useUserProjectIds(userId: string | null) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["user-project-ids", userId, activeWorkspace?.id],
    queryFn: async () => {
      if (!userId || !activeWorkspace?.id) return new Set<string>();

      const { data, error } = await supabase
        .from("project_members")
        .select("project_id")
        .eq("user_id", userId);

      if (error) throw error;

      return new Set((data || []).map(m => m.project_id));
    },
    enabled: !!userId && !!activeWorkspace?.id,
  });
}

/**
 * Hook to get all project assignments in the workspace
 * Returns a Map of userId -> Set of projectIds
 */
export function useAllProjectMembers() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["all-project-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return new Map<string, Set<string>>();

      // Get all project IDs in workspace first
      const { data: projects, error: projectsError } = await supabase
        .from("projects")
        .select("id")
        .eq("workspace_id", activeWorkspace.id);

      if (projectsError) throw projectsError;

      const projectIds = projects?.map(p => p.id) || [];
      if (projectIds.length === 0) return new Map<string, Set<string>>();

      // Get all members for these projects
      const { data, error } = await supabase
        .from("project_members")
        .select("user_id, project_id")
        .in("project_id", projectIds);

      if (error) throw error;

      // Build a map of userId -> Set of projectIds
      const userProjectsMap = new Map<string, Set<string>>();
      (data || []).forEach(member => {
        if (!userProjectsMap.has(member.user_id)) {
          userProjectsMap.set(member.user_id, new Set());
        }
        userProjectsMap.get(member.user_id)!.add(member.project_id);
      });

      return userProjectsMap;
    },
    enabled: !!activeWorkspace?.id,
  });
}
