import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type ActionType = 'email' | 'call' | 'meeting' | 'task' | 'followup';
export type ActionPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActionStatus = 'pending' | 'completed' | 'cancelled' | 'overdue';

export interface PipelineAction {
  id: string;
  workspace_id: string;
  entry_id: string;
  contact_id: string | null;
  company_id: string | null;
  action_type: ActionType;
  title: string;
  description: string | null;
  due_date: string | null;
  reminder_date: string | null;
  priority: ActionPriority;
  status: ActionStatus;
  completed_at: string | null;
  completed_by: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateActionInput {
  entry_id: string;
  contact_id?: string | null;
  company_id?: string | null;
  action_type: ActionType;
  title: string;
  description?: string;
  due_date?: string;
  reminder_date?: string;
  priority?: ActionPriority;
}

export function usePipelineActions(entryId?: string, workspaceId?: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const queryKey = ['pipeline-actions', entryId];

  const { data: actions = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId || !entryId) return [];

      const { data, error } = await supabase
        .from('pipeline_actions')
        .select('*')
        .eq('entry_id', entryId)
        .eq('workspace_id', workspaceId)
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data as PipelineAction[];
    },
    enabled: !!workspaceId && !!entryId,
  });

  const createAction = useMutation({
    mutationFn: async (input: CreateActionInput) => {
      if (!workspaceId) throw new Error('No workspace');

      const { data, error } = await supabase
        .from('pipeline_actions')
        .insert({
          workspace_id: workspaceId,
          entry_id: input.entry_id,
          contact_id: input.contact_id || null,
          company_id: input.company_id || null,
          action_type: input.action_type,
          title: input.title,
          description: input.description || null,
          due_date: input.due_date || null,
          reminder_date: input.reminder_date || null,
          priority: input.priority || 'medium',
          created_by: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Action créée');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['pipeline-actions-all'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateAction = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PipelineAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('pipeline_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['pipeline-actions-all'] });
    },
  });

  const completeAction = useMutation({
    mutationFn: async (actionId: string) => {
      const { data, error } = await supabase
        .from('pipeline_actions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          completed_by: user?.id || null,
        })
        .eq('id', actionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Action terminée');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['pipeline-actions-all'] });
    },
  });

  const deleteAction = useMutation({
    mutationFn: async (actionId: string) => {
      const { error } = await supabase
        .from('pipeline_actions')
        .delete()
        .eq('id', actionId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Action supprimée');
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['pipeline-actions-all'] });
    },
  });

  // Stats
  const pendingCount = actions.filter(a => a.status === 'pending').length;
  const overdueCount = actions.filter(a => 
    a.status === 'pending' && 
    a.due_date && 
    new Date(a.due_date) < new Date()
  ).length;

  return {
    actions,
    isLoading,
    pendingCount,
    overdueCount,
    createAction: createAction.mutate,
    updateAction: updateAction.mutate,
    completeAction: completeAction.mutate,
    deleteAction: deleteAction.mutate,
    isCreating: createAction.isPending,
  };
}

// Hook to get all pending actions for workspace (for alerts/dashboard)
export function useAllPendingActions(workspaceId?: string) {
  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['pipeline-actions-all', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];

      const { data, error } = await supabase
        .from('pipeline_actions')
        .select(`
          *,
          entry:contact_pipeline_entries(
            id,
            contact:contacts(id, name, email, avatar_url),
            company:crm_companies(id, name, logo_url)
          )
        `)
        .eq('workspace_id', workspaceId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });

  const overdueActions = actions.filter(a => 
    a.due_date && new Date(a.due_date) < new Date()
  );
  
  const upcomingActions = actions.filter(a => 
    a.due_date && new Date(a.due_date) >= new Date()
  );

  return {
    actions,
    overdueActions,
    upcomingActions,
    isLoading,
  };
}
