import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Notification {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  actor_id: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_entity_name: string | null;
}

export interface NotificationWithActor extends Notification {
  actor?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function useNotifications() {
  const { user, activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications", user?.id, activeWorkspace?.id],
    queryFn: async () => {
      if (!user?.id || !activeWorkspace?.id) return [];
      
      // First get notifications - FILTERED BY WORKSPACE
      const { data: notifs, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get unique actor IDs
      const actorIds = [...new Set(notifs.filter(n => n.actor_id).map(n => n.actor_id))];
      
      // Fetch actor profiles if there are any
      let actorProfiles: Record<string, { full_name: string | null; avatar_url: string | null }> = {};
      if (actorIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name, avatar_url")
          .in("user_id", actorIds);
        
        if (profiles) {
          actorProfiles = profiles.reduce((acc, p) => {
            acc[p.user_id] = { full_name: p.full_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { full_name: string | null; avatar_url: string | null }>);
        }
      }
      
      // Combine notifications with actor data
      return notifs.map(n => ({
        ...n,
        actor: n.actor_id ? actorProfiles[n.actor_id] || null : null,
      })) as NotificationWithActor[];
    },
    enabled: !!user?.id && !!activeWorkspace?.id,
  });

  // Real-time subscription - FILTERED BY WORKSPACE
  useEffect(() => {
    if (!user?.id || !activeWorkspace?.id) return;

    const channel = supabase
      .channel(`notifications-realtime-${activeWorkspace.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          // Only invalidate if the notification belongs to the active workspace
          const newRecord = payload.new as Notification | undefined;
          const oldRecord = payload.old as Notification | undefined;
          const record = newRecord || oldRecord;
          
          if (record && record.workspace_id === activeWorkspace.id) {
            queryClient.invalidateQueries({ queryKey: ["notifications", user.id, activeWorkspace.id] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, activeWorkspace?.id, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id, activeWorkspace?.id] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user?.id || !activeWorkspace?.id) return;
      
      // Mark all as read - FILTERED BY WORKSPACE
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user.id)
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_read", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id, activeWorkspace?.id] });
    },
  });

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id, activeWorkspace?.id] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
