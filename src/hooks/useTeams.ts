import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Team {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  members?: TeamMemberLink[];
}

export interface TeamMemberLink {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
}

export function useTeams() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: teams, isLoading } = useQuery({
    queryKey: ["teams", activeWorkspace?.id],
    queryFn: async (): Promise<Team[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("name");

      if (error) throw error;

      // Fetch team members
      const teamIds = data?.map(t => t.id) || [];
      if (teamIds.length === 0) return data || [];

      const { data: members, error: membersError } = await supabase
        .from("team_members")
        .select("*")
        .in("team_id", teamIds);

      if (membersError) throw membersError;

      return data.map(team => ({
        ...team,
        members: members?.filter(m => m.team_id === team.id) || []
      }));
    },
    enabled: !!activeWorkspace,
  });

  const createTeam = useMutation({
    mutationFn: async (input: { name: string; description?: string; color?: string }) => {
      if (!activeWorkspace) throw new Error("No active workspace");

      const { data, error } = await supabase
        .from("teams")
        .insert({
          workspace_id: activeWorkspace.id,
          name: input.name,
          description: input.description || null,
          color: input.color || "#3B82F6",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Équipe créée");
    },
    onError: () => {
      toast.error("Erreur lors de la création de l'équipe");
    },
  });

  const updateTeam = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase
        .from("teams")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Équipe mise à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("teams")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Équipe supprimée");
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  const addMemberToTeam = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { data, error } = await supabase
        .from("team_members")
        .insert({ team_id: teamId, user_id: userId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Ce membre est déjà dans l'équipe");
      } else {
        toast.error("Erreur lors de l'ajout");
      }
    },
  });

  const removeMemberFromTeam = useMutation({
    mutationFn: async ({ teamId, userId }: { teamId: string; userId: string }) => {
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
    },
  });

  const setTeamMembers = useMutation({
    mutationFn: async ({ teamId, userIds }: { teamId: string; userIds: string[] }) => {
      // Delete all existing members
      await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId);

      // Insert new members
      if (userIds.length > 0) {
        const { error } = await supabase
          .from("team_members")
          .insert(userIds.map(userId => ({
            team_id: teamId,
            user_id: userId,
          })));

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Membres mis à jour");
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour des membres");
    },
  });

  // Get a map of userId -> teamIds for filtering
  const userTeamsMap = teams?.reduce((acc, team) => {
    team.members?.forEach(member => {
      if (!acc.has(member.user_id)) {
        acc.set(member.user_id, new Set<string>());
      }
      acc.get(member.user_id)!.add(team.id);
    });
    return acc;
  }, new Map<string, Set<string>>()) || new Map();

  return {
    teams: teams || [],
    isLoading,
    createTeam,
    updateTeam,
    deleteTeam,
    addMemberToTeam,
    removeMemberFromTeam,
    setTeamMembers,
    userTeamsMap,
  };
}
