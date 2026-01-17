import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { ProjectType, PhaseStatus, PHASE_COLORS } from "@/lib/projectTypes";
import { ProjectCategory, ProjectCategoryConfig, DEFAULT_CATEGORY_FEATURES } from "@/lib/projectCategories";

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
  // Pass category config from hook to avoid additional DB query
  categoryConfig?: ProjectCategoryConfig;
}

export type ProjectStatus = 'active' | 'completed' | 'closed';

// Helper to check if a category has a feature
function categoryHasFeature(
  categoryConfig: ProjectCategoryConfig | undefined,
  feature: keyof typeof DEFAULT_CATEGORY_FEATURES
): boolean {
  return categoryConfig?.features?.[feature] ?? DEFAULT_CATEGORY_FEATURES[feature];
}

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

      // Get category config from input (passed from component that has the hook)
      const categoryConfig = input.categoryConfig;
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
          end_date: categoryHasFeature(categoryConfig, 'hasEndDate') ? (input.end_date || null) : null,
          budget: categoryHasFeature(categoryConfig, 'hasBudget') ? (input.budget || null) : null,
          monthly_budget: categoryHasFeature(categoryConfig, 'hasMonthlyBudget') ? (input.monthly_budget || null) : null,
          auto_renew: categoryHasFeature(categoryConfig, 'hasAutoRenew') ? (input.auto_renew || false) : false,
          phase: "planning",
          status: "active",
          is_internal: isInternal,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // Generate phases from phase_templates if category supports phases
      if (categoryHasFeature(categoryConfig, 'hasPhases') && input.project_type) {
        // Fetch phase templates from database
        const { data: templates, error: templatesError } = await supabase
          .from("phase_templates")
          .select("*")
          .eq("workspace_id", activeWorkspace.id)
          .eq("project_type", input.project_type)
          .eq("is_active", true)
          .order("sort_order", { ascending: true });

        if (templatesError) {
          console.error("Error fetching phase templates:", templatesError);
        }

        if (templates && templates.length > 0) {
          // Calculate phase dates based on project dates
          const phaseCount = templates.length;
          let phaseDates: { start_date: string | null; end_date: string | null }[] = [];

          if (input.start_date && input.end_date) {
            const startDate = new Date(input.start_date);
            const endDate = new Date(input.end_date);
            const totalDays = Math.max(1, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            const daysPerPhase = Math.floor(totalDays / phaseCount);

            let currentDate = new Date(startDate);

            for (let i = 0; i < phaseCount; i++) {
              const phaseStart = new Date(currentDate);
              const phaseEnd = i === phaseCount - 1
                ? new Date(endDate)
                : new Date(currentDate.getTime() + daysPerPhase * 24 * 60 * 60 * 1000);

              phaseDates.push({
                start_date: phaseStart.toISOString().split('T')[0],
                end_date: phaseEnd.toISOString().split('T')[0],
              });

              currentDate = new Date(phaseEnd.getTime() + 24 * 60 * 60 * 1000);
            }
          } else {
            phaseDates = templates.map(() => ({ start_date: null, end_date: null }));
          }

          const phasesToInsert = templates.map((template, index) => ({
            workspace_id: activeWorkspace.id,
            project_id: project.id,
            name: template.name,
            phase_code: template.code,
            description: template.description,
            percentage_fee: template.default_percentage,
            sort_order: index,
            status: index === 0 ? "in_progress" : "pending",
            color: template.color || PHASE_COLORS[index % PHASE_COLORS.length],
            start_date: phaseDates[index].start_date,
            end_date: phaseDates[index].end_date,
          }));

          const { data: createdPhases, error: phasesError } = await supabase
            .from("project_phases")
            .insert(phasesToInsert)
            .select();

          if (phasesError) {
            console.error("Error creating phases:", phasesError);
          }

          // Create project deliverables from deliverable_templates for each phase
          if (createdPhases && createdPhases.length > 0) {
            for (const createdPhase of createdPhases) {
              const template = templates.find(t => t.code === createdPhase.phase_code);
              if (!template) continue;

              // Fetch deliverable templates for this phase template
              const { data: deliverableTemplates, error: delTplError } = await supabase
                .from("deliverable_templates")
                .select("*")
                .eq("phase_template_id", template.id)
                .eq("is_active", true)
                .order("sort_order", { ascending: true });

              if (delTplError) {
                console.error("Error fetching deliverable templates:", delTplError);
                continue;
              }

              // If no deliverable templates exist, fall back to legacy string array
              const legacyDeliverables = Array.isArray(template.deliverables) 
                ? template.deliverables as string[]
                : [];

              const deliverablesToCreate = deliverableTemplates?.length 
                ? deliverableTemplates.map((dt, i) => ({
                    workspace_id: activeWorkspace.id,
                    project_id: project.id,
                    phase_id: createdPhase.id,
                    name: dt.name,
                    description: dt.description,
                    status: 'pending',
                    due_date: createdPhase.end_date,
                    sort_order: i,
                  }))
                : legacyDeliverables.map((name: string, i: number) => ({
                    workspace_id: activeWorkspace.id,
                    project_id: project.id,
                    phase_id: createdPhase.id,
                    name: name,
                    status: 'pending',
                    due_date: createdPhase.end_date,
                    sort_order: i,
                  }));

              if (deliverablesToCreate.length > 0) {
                const { error: delError } = await supabase
                  .from("project_deliverables")
                  .insert(deliverablesToCreate);

                if (delError) {
                  console.error("Error creating project deliverables:", delError);
                }
              }
            }
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

// Hook to get all project members for a workspace (for workflow views)
export function useAllProjectMembers() {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["all-project-members", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return new Map<string, Set<string>>();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("project_members")
        .select("user_id, project_id")
        .eq("workspace_id", activeWorkspace.id);

      if (error) throw error;

      // Group by user_id
      const userProjectsMap = new Map<string, Set<string>>();
      for (const member of (data || []) as { user_id: string | null; project_id: string }[]) {
        if (!member.user_id) continue;
        if (!userProjectsMap.has(member.user_id)) {
          userProjectsMap.set(member.user_id, new Set());
        }
        userProjectsMap.get(member.user_id)!.add(member.project_id);
      }

      return userProjectsMap;
    },
    enabled: !!activeWorkspace?.id,
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

      // Group by project ID with profile data
      const groupedByProject: Record<string, ProjectMember[]> = {};
      
      for (const member of membersData) {
        if (!groupedByProject[member.project_id]) {
          groupedByProject[member.project_id] = [];
        }
        
        const profile = member.user_id 
          ? profiles.find(p => p.user_id === member.user_id) 
          : null;
        
        groupedByProject[member.project_id].push({
          ...member,
          profile: profile || undefined
        });
      }

      return groupedByProject;
    },
    enabled: projectIds.length > 0,
  });
}

// Hook to manage project members
export function useProjectMembers(projectId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: members, isLoading, error } = useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_members")
        .select("*")
        .eq("project_id", projectId);

      if (error) throw error;

      // Get profiles for these members
      const userIds = data?.map(m => m.user_id).filter(Boolean) as string[];
      if (userIds.length === 0) return data as ProjectMember[];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", userIds);

      if (profilesError) throw profilesError;

      return data?.map(member => ({
        ...member,
        profile: profiles?.find(p => p.user_id === member.user_id) || undefined
      })) as ProjectMember[];
    },
    enabled: !!projectId,
  });

  const addMember = useMutation({
    mutationFn: async ({ userId, role, clientDailyRate }: { userId: string; role: string; clientDailyRate?: number }) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      const { data, error } = await supabase
        .from("project_members")
        .insert({
          project_id: projectId,
          workspace_id: activeWorkspace.id,
          user_id: userId,
          role,
          client_daily_rate: clientDailyRate || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast.success("Membre ajouté");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout du membre");
      console.error(error);
    },
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, role, clientDailyRate }: { id: string; role?: string; clientDailyRate?: number }) => {
      const updates: Record<string, unknown> = {};
      if (role !== undefined) updates.role = role;
      if (clientDailyRate !== undefined) updates.client_daily_rate = clientDailyRate;

      const { data, error } = await supabase
        .from("project_members")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast.success("Membre mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
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
      queryClient.invalidateQueries({ queryKey: ["project-members", projectId] });
      toast.success("Membre retiré");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    members: members || [],
    isLoading,
    error,
    addMember,
    updateMember,
    removeMember,
  };
}
