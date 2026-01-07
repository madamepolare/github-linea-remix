import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CommunicationReaction {
  id: string;
  communication_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
  workspace_id: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: string[];
  hasReacted: boolean;
}

export function useCommunicationReactions(communicationIds: string[]) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["communication-reactions", communicationIds.sort().join(",")];

  const { data: reactions, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!communicationIds.length) return [];

      const { data, error } = await supabase
        .from("communication_reactions")
        .select("*")
        .in("communication_id", communicationIds);

      if (error) throw error;
      return data as CommunicationReaction[];
    },
    enabled: !!communicationIds.length && !!activeWorkspace?.id,
  });

  // Group reactions by communication_id, then by emoji
  const reactionsByComm = (commId: string): ReactionSummary[] => {
    if (!reactions) return [];

    const commReactions = reactions.filter((r) => r.communication_id === commId);
    const emojiMap = new Map<string, { count: number; users: string[] }>();

    commReactions.forEach((r) => {
      const existing = emojiMap.get(r.emoji) || { count: 0, users: [] };
      existing.count++;
      existing.users.push(r.user_id);
      emojiMap.set(r.emoji, existing);
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      users: data.users,
      hasReacted: data.users.includes(user?.id || ""),
    }));
  };

  const toggleReaction = useMutation({
    mutationFn: async ({
      communicationId,
      emoji,
    }: {
      communicationId: string;
      emoji: string;
    }) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      // Check if reaction exists
      const { data: existing } = await supabase
        .from("communication_reactions")
        .select("id")
        .eq("communication_id", communicationId)
        .eq("user_id", user.id)
        .eq("emoji", emoji)
        .maybeSingle();

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from("communication_reactions")
          .delete()
          .eq("id", existing.id);
        if (error) throw error;
        return { action: "removed" };
      } else {
        // Add reaction
        const { error } = await supabase.from("communication_reactions").insert({
          communication_id: communicationId,
          user_id: user.id,
          emoji,
          workspace_id: activeWorkspace.id,
        });
        if (error) throw error;
        return { action: "added" };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    reactions,
    reactionsByComm,
    toggleReaction,
    isLoading,
  };
}

export const QUICK_REACTIONS = ["👍", "❤️", "😄", "🎉", "👀", "🚀"];
