import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useCallback, useState } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";

// Types
export interface TeamChannel {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  channel_type: "public" | "private" | "direct";
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  // For DM channels, the other member's info
  dm_member?: {
    user_id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  last_read_at: string | null;
}

export interface TeamMessage {
  id: string;
  channel_id: string;
  parent_id: string | null;
  workspace_id: string;
  content: string;
  mentions: string[];
  attachments: any[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_edited: boolean;
  reply_count?: number;
  author?: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

export interface TeamMessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  workspace_id: string;
  created_at: string;
}

// Hook: Fetch channels for workspace with DM member info
export function useTeamChannels() {
  const { activeWorkspace, user } = useAuth();
  
  return useQuery({
    queryKey: ["team-channels", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("team_channels")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_archived", false)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // For DM channels, get the other member's profile
      const dmChannels = data?.filter(c => c.channel_type === "direct") || [];
      if (dmChannels.length > 0) {
        const channelIds = dmChannels.map(c => c.id);
        
        // Get all members for DM channels
        const { data: allMembers } = await supabase
          .from("team_channel_members")
          .select("channel_id, user_id")
          .in("channel_id", channelIds);
        
        // Get other users (not current user)
        const otherUserIds = [...new Set(
          allMembers
            ?.filter(m => m.user_id !== user?.id)
            .map(m => m.user_id) || []
        )];
        
        // Get their profiles
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", otherUserIds);
        
        // Create a map of channel_id -> other member profile
        const channelMemberMap: Record<string, { user_id: string; full_name: string | null; avatar_url: string | null }> = {};
        
        for (const channel of dmChannels) {
          const otherMember = allMembers?.find(m => m.channel_id === channel.id && m.user_id !== user?.id);
          if (otherMember) {
            const profile = profiles?.find(p => p.user_id === otherMember.user_id);
            channelMemberMap[channel.id] = {
              user_id: otherMember.user_id,
              full_name: profile?.full_name || null,
              avatar_url: profile?.avatar_url || null,
            };
          }
        }
        
        // Attach member info to DM channels
        return data?.map(c => ({
          ...c,
          dm_member: c.channel_type === "direct" ? channelMemberMap[c.id] : undefined,
        })) as TeamChannel[];
      }
      
      return data as TeamChannel[];
    },
    enabled: !!activeWorkspace?.id,
  });
}

// Hook: Fetch channel members
export function useChannelMembers(channelId: string | undefined) {
  return useQuery({
    queryKey: ["channel-members", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      
      const { data, error } = await supabase
        .from("team_channel_members")
        .select("*")
        .eq("channel_id", channelId);
      
      if (error) throw error;
      return data as TeamChannelMember[];
    },
    enabled: !!channelId,
  });
}

// Hook: Fetch messages for a channel with realtime
export function useChannelMessages(channelId: string | undefined) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();
  const [realtimeChannel, setRealtimeChannel] = useState<RealtimeChannel | null>(null);

  const query = useQuery({
    queryKey: ["channel-messages", channelId],
    queryFn: async () => {
      if (!channelId) return [];
      
      // Get messages with reply counts
      const { data: messages, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("channel_id", channelId)
        .is("parent_id", null)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Get reply counts
      const messageIds = messages?.map(m => m.id) || [];
      if (messageIds.length > 0) {
        const { data: replies } = await supabase
          .from("team_messages")
          .select("parent_id")
          .in("parent_id", messageIds);
        
        const replyCounts = replies?.reduce((acc, r) => {
          acc[r.parent_id!] = (acc[r.parent_id!] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};
        
        // Get author profiles
        const authorIds = [...new Set(messages?.map(m => m.created_by).filter(Boolean))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", authorIds);
        
        const profileMap = profiles?.reduce((acc, p) => {
          acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>) || {};
        
        return messages?.map(m => ({
          ...m,
          reply_count: replyCounts[m.id] || 0,
          author: m.created_by ? profileMap[m.created_by] : undefined,
        })) as TeamMessage[];
      }
      
      return messages as TeamMessage[];
    },
    enabled: !!channelId,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!channelId || !activeWorkspace?.id) return;

    const channel = supabase
      .channel(`messages-${channelId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["channel-messages", channelId] });
        }
      )
      .subscribe();

    setRealtimeChannel(channel);

    return () => {
      channel.unsubscribe();
    };
  }, [channelId, activeWorkspace?.id, queryClient]);

  return query;
}

// Hook: Fetch thread messages
export function useThreadMessages(parentId: string | undefined) {
  return useQuery({
    queryKey: ["thread-messages", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      
      const { data, error } = await supabase
        .from("team_messages")
        .select("*")
        .eq("parent_id", parentId)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      
      // Get author profiles
      const authorIds = [...new Set(data?.map(m => m.created_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, avatar_url")
        .in("user_id", authorIds);
      
      const profileMap = profiles?.reduce((acc, p) => {
        acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
        return acc;
      }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>) || {};
      
      return data?.map(m => ({
        ...m,
        author: m.created_by ? profileMap[m.created_by] : undefined,
      })) as TeamMessage[];
    },
    enabled: !!parentId,
  });
}

// Hook: Message reactions
export function useMessageReactions(messageIds: string[]) {
  const { activeWorkspace } = useAuth();
  
  return useQuery({
    queryKey: ["message-reactions", messageIds],
    queryFn: async () => {
      if (!messageIds.length) return [];
      
      const { data, error } = await supabase
        .from("team_message_reactions")
        .select("*")
        .in("message_id", messageIds);
      
      if (error) throw error;
      return data as TeamMessageReaction[];
    },
    enabled: messageIds.length > 0 && !!activeWorkspace?.id,
  });
}

// Hook: Unread counts per channel
export function useUnreadCounts() {
  const { activeWorkspace, user } = useAuth();
  
  return useQuery({
    queryKey: ["unread-counts", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return {};
      
      // Get member last_read_at for each channel
      const { data: memberships } = await supabase
        .from("team_channel_members")
        .select("channel_id, last_read_at")
        .eq("user_id", user.id);
      
      if (!memberships?.length) return {};
      
      const counts: Record<string, number> = {};
      
      for (const membership of memberships) {
        const { count } = await supabase
          .from("team_messages")
          .select("*", { count: "exact", head: true })
          .eq("channel_id", membership.channel_id)
          .is("parent_id", null)
          .gt("created_at", membership.last_read_at || "1970-01-01");
        
        counts[membership.channel_id] = count || 0;
      }
      
      return counts;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
    refetchInterval: 30000, // Refetch every 30s
  });
}

// Mutations
export function useTeamMessageMutations() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const createChannel = useMutation({
    mutationFn: async (data: { name: string; description?: string; channel_type: "public" | "private" | "direct"; member_ids?: string[] }) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");
      
      const { data: channel, error } = await supabase
        .from("team_channels")
        .insert({
          workspace_id: activeWorkspace.id,
          name: data.name,
          description: data.description,
          channel_type: data.channel_type,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Add creator as admin
      await supabase.from("team_channel_members").insert({
        channel_id: channel.id,
        user_id: user.id,
        role: "admin",
      });
      
      // Add other members
      if (data.member_ids?.length) {
        const members = data.member_ids
          .filter(id => id !== user.id)
          .map(id => ({
            channel_id: channel.id,
            user_id: id,
            role: "member" as const,
          }));
        
        if (members.length) {
          await supabase.from("team_channel_members").insert(members);
        }
      }
      
      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-channels"] });
    },
  });

  const createMessage = useMutation({
    mutationFn: async (data: { 
      channel_id: string; 
      content: string; 
      parent_id?: string; 
      mentions?: string[]; 
      attachments?: { url: string; name: string; type: string; size: number }[];
    }) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");
      
      const { data: message, error } = await supabase
        .from("team_messages")
        .insert({
          channel_id: data.channel_id,
          parent_id: data.parent_id || null,
          workspace_id: activeWorkspace.id,
          content: data.content,
          mentions: data.mentions || [],
          attachments: data.attachments || [],
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update last_read_at for current user
      await supabase
        .from("team_channel_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", data.channel_id)
        .eq("user_id", user.id);
      
      return message;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channel-messages", variables.channel_id] });
      if (variables.parent_id) {
        queryClient.invalidateQueries({ queryKey: ["thread-messages", variables.parent_id] });
      }
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });

  const updateMessage = useMutation({
    mutationFn: async (data: { id: string; content: string; channel_id: string }) => {
      const { error } = await supabase
        .from("team_messages")
        .update({ content: data.content, is_edited: true })
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channel-messages", variables.channel_id] });
    },
  });

  const deleteMessage = useMutation({
    mutationFn: async (data: { id: string; channel_id: string }) => {
      const { error } = await supabase
        .from("team_messages")
        .delete()
        .eq("id", data.id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channel-messages", variables.channel_id] });
    },
  });

  const toggleReaction = useMutation({
    mutationFn: async (data: { message_id: string; emoji: string }) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");
      
      // Check if reaction exists
      const { data: existing } = await supabase
        .from("team_message_reactions")
        .select("id")
        .eq("message_id", data.message_id)
        .eq("user_id", user.id)
        .eq("emoji", data.emoji)
        .single();
      
      if (existing) {
        await supabase.from("team_message_reactions").delete().eq("id", existing.id);
      } else {
        await supabase.from("team_message_reactions").insert({
          message_id: data.message_id,
          user_id: user.id,
          emoji: data.emoji,
          workspace_id: activeWorkspace.id,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["message-reactions"] });
    },
  });

  const markChannelAsRead = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error("No user");
      
      await supabase
        .from("team_channel_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", channelId)
        .eq("user_id", user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unread-counts"] });
    },
  });

  const joinChannel = useMutation({
    mutationFn: async (channelId: string) => {
      if (!user?.id) throw new Error("No user");
      
      await supabase.from("team_channel_members").insert({
        channel_id: channelId,
        user_id: user.id,
        role: "member",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channel-members"] });
    },
  });

  const removeMember = useMutation({
    mutationFn: async (data: { channelId: string; userId: string }) => {
      const { error } = await supabase
        .from("team_channel_members")
        .delete()
        .eq("channel_id", data.channelId)
        .eq("user_id", data.userId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["channel-members", variables.channelId] });
    },
  });

  return {
    createChannel,
    createMessage,
    updateMessage,
    deleteMessage,
    toggleReaction,
    markChannelAsRead,
    joinChannel,
    removeMember,
  };
}

// Quick reactions
export const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "🤔", "👀"];
