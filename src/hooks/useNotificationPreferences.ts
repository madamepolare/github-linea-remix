import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationPreferences {
  id: string;
  user_id: string;
  workspace_id: string;
  
  // Message notifications
  notify_mentions: boolean;
  notify_new_messages: boolean;
  notify_comment_replies: boolean;
  notify_reactions: boolean;
  
  // Task notifications
  notify_task_created: boolean;
  notify_task_assigned: boolean;
  notify_task_completed: boolean;
  
  // Project notifications
  notify_project_updates: boolean;
  
  // Other
  notify_invites: boolean;
  
  // Delivery channels
  email_enabled: boolean;
  push_enabled: boolean;
  
  // Do not disturb
  do_not_disturb: boolean;
  dnd_start: string;
  dnd_end: string;
  
  created_at: string;
  updated_at: string;
}

// Default preferences
const DEFAULT_PREFERENCES: Omit<NotificationPreferences, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'updated_at'> = {
  notify_mentions: true,
  notify_new_messages: true,
  notify_comment_replies: true,
  notify_reactions: false,
  notify_task_created: true,
  notify_task_assigned: true,
  notify_task_completed: false,
  notify_project_updates: true,
  notify_invites: true,
  email_enabled: false,
  push_enabled: true,
  do_not_disturb: false,
  dnd_start: '22:00:00',
  dnd_end: '08:00:00',
};

export function useNotificationPreferences() {
  const { user, activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id, activeWorkspace?.id],
    queryFn: async () => {
      if (!user?.id || !activeWorkspace?.id) return null;

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('workspace_id', activeWorkspace.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching notification preferences:', error);
        throw error;
      }

      return data as NotificationPreferences | null;
    },
    enabled: !!user?.id && !!activeWorkspace?.id,
  });

  const updatePreferences = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user?.id || !activeWorkspace?.id) throw new Error('User or workspace not found');

      // If preferences exist, update them
      if (preferences?.id) {
        const { data, error } = await supabase
          .from('notification_preferences')
          .update(updates)
          .eq('id', preferences.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } 
      
      // Otherwise, create new preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert({
          user_id: user.id,
          workspace_id: activeWorkspace.id,
          ...DEFAULT_PREFERENCES,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Préférences enregistrées');
    },
    onError: (error) => {
      console.error('Error updating notification preferences:', error);
      toast.error('Erreur lors de la mise à jour des préférences');
    },
  });

  // Get effective preferences (with defaults if none exist)
  const effectivePreferences: Omit<NotificationPreferences, 'id' | 'user_id' | 'workspace_id' | 'created_at' | 'updated_at'> = {
    ...DEFAULT_PREFERENCES,
    ...(preferences || {}),
  };

  return {
    preferences: effectivePreferences,
    isLoading,
    updatePreferences,
    hasCustomPreferences: !!preferences,
  };
}
