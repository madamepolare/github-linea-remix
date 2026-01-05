import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

export type ActivityType = 
  | 'created' 
  | 'updated' 
  | 'status_changed' 
  | 'linked' 
  | 'unlinked'
  | 'converted' 
  | 'document_sent' 
  | 'document_signed'
  | 'invoice_sent'
  | 'invoice_paid'
  | 'comment_added'
  | 'assigned'
  | 'completed';

export interface EntityActivity {
  id: string;
  workspace_id: string;
  entity_type: string;
  entity_id: string;
  related_entity_type?: string;
  related_entity_id?: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

export interface CreateActivityInput {
  entity_type: string;
  entity_id: string;
  related_entity_type?: string;
  related_entity_id?: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export function useEntityActivities(entityType?: string, entityId?: string, workspaceId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const activitiesQuery = useQuery({
    queryKey: ['entity-activities', entityType, entityId, workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      let query = supabase
        .from('entity_activities')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (entityType && entityId) {
        // Get activities for this entity OR related to this entity
        query = query.or(`and(entity_type.eq.${entityType},entity_id.eq.${entityId}),and(related_entity_type.eq.${entityType},related_entity_id.eq.${entityId})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EntityActivity[];
    },
    enabled: !!workspaceId,
  });

  const createActivity = useMutation({
    mutationFn: async (input: CreateActivityInput) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('entity_activities')
        .insert({
          entity_type: input.entity_type,
          entity_id: input.entity_id,
          related_entity_type: input.related_entity_type || null,
          related_entity_id: input.related_entity_id || null,
          activity_type: input.activity_type,
          title: input.title,
          description: input.description || null,
          metadata: (input.metadata || {}) as Json,
          workspace_id: workspaceId,
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entity-activities'] });
    },
  });

  return {
    activities: activitiesQuery.data || [],
    isLoading: activitiesQuery.isLoading,
    createActivity: createActivity.mutate,
  };
}

// Helper function to create activity from anywhere in the app
export async function logEntityActivity(
  workspaceId: string,
  userId: string | undefined,
  input: CreateActivityInput
) {
  const { error } = await supabase
    .from('entity_activities')
    .insert({
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      related_entity_type: input.related_entity_type || null,
      related_entity_id: input.related_entity_id || null,
      activity_type: input.activity_type,
      title: input.title,
      description: input.description || null,
      metadata: (input.metadata || {}) as Json,
      workspace_id: workspaceId,
      created_by: userId || null,
    });

  if (error) {
    console.error('Failed to log activity:', error);
  }
}
