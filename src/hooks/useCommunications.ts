import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect } from "react";

export type CommunicationType = 'comment' | 'exchange' | 'email_sent' | 'email_received' | 'note';
export type EntityType = 'task' | 'project' | 'lead' | 'company' | 'contact' | 'tender';

export interface Communication {
  id: string;
  workspace_id: string;
  communication_type: CommunicationType;
  entity_type: EntityType;
  entity_id: string;
  parent_id: string | null;
  thread_id: string | null;
  title: string | null;
  content: string;
  content_html: string | null;
  mentions: string[] | null;
  attachments: Record<string, unknown> | null;
  email_metadata: Record<string, unknown> | null;
  is_read: boolean;
  is_pinned: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface CommunicationWithReplies extends Communication {
  replies?: Communication[];
}

export function useCommunications(entityType: EntityType, entityId: string | null) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["communications", entityType, entityId];

  const { data: communications, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!entityId) return [];
      const { data, error } = await supabase
        .from("communications")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Communication[];
    },
    enabled: !!entityId && !!activeWorkspace?.id,
  });

  // Realtime subscription
  useEffect(() => {
    if (!entityId || !activeWorkspace?.id) return;

    const channel = supabase
      .channel(`communications-${entityType}-${entityId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'communications',
          filter: `entity_id=eq.${entityId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityId, entityType, activeWorkspace?.id, queryClient]);

  const createCommunication = useMutation({
    mutationFn: async ({
      type,
      content,
      title,
      parentId,
    }: {
      type: CommunicationType;
      content: string;
      title?: string;
      parentId?: string;
    }) => {
      if (!entityId || !activeWorkspace) throw new Error("Missing entity or workspace");
      
      const { data, error } = await supabase
        .from("communications")
        .insert({
          workspace_id: activeWorkspace.id,
          communication_type: type,
          entity_type: entityType,
          entity_id: entityId,
          content,
          title: title || null,
          parent_id: parentId || null,
          thread_id: parentId || null,
          created_by: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateCommunication = useMutation({
    mutationFn: async ({
      id,
      content,
      title,
      is_pinned,
    }: {
      id: string;
      content?: string;
      title?: string;
      is_pinned?: boolean;
    }) => {
      const updates: Record<string, unknown> = {};
      if (content !== undefined) updates.content = content;
      if (title !== undefined) updates.title = title;
      if (is_pinned !== undefined) updates.is_pinned = is_pinned;

      const { data, error } = await supabase
        .from("communications")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteCommunication = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("communications")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase
        .from("communications")
        .update({ is_pinned })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Communication mise à jour");
    },
  });

  // Organiser en threads
  const organizedCommunications = (() => {
    if (!communications) return { root: [], repliesMap: new Map<string, Communication[]>() };
    
    const root: Communication[] = [];
    const repliesMap = new Map<string, Communication[]>();

    communications.forEach((comm) => {
      if (!comm.parent_id) {
        root.push(comm);
      } else {
        const existing = repliesMap.get(comm.parent_id) || [];
        existing.push(comm);
        repliesMap.set(comm.parent_id, existing);
      }
    });

    return { root, repliesMap };
  })();

  return {
    communications,
    rootCommunications: organizedCommunications.root,
    repliesMap: organizedCommunications.repliesMap,
    isLoading,
    createCommunication,
    updateCommunication,
    deleteCommunication,
    togglePin,
  };
}

// Hook pour compter les communications d'une entité
export function useCommunicationsCount(entityType: EntityType, entityId: string | null) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["communications-count", entityType, entityId],
    queryFn: async () => {
      if (!entityId) return 0;
      const { count, error } = await supabase
        .from("communications")
        .select("*", { count: "exact", head: true })
        .eq("entity_type", entityType)
        .eq("entity_id", entityId);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!entityId && !!activeWorkspace?.id,
  });
}

// Hook pour compter les communications de plusieurs entités
export function useCommunicationsCounts(entityType: EntityType, entityIds: string[]) {
  const { activeWorkspace } = useAuth();

  return useQuery({
    queryKey: ["communications-counts", entityType, entityIds],
    queryFn: async () => {
      if (!entityIds.length) return {};
      
      const { data, error } = await supabase
        .from("communications")
        .select("entity_id")
        .eq("entity_type", entityType)
        .in("entity_id", entityIds);
      
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      entityIds.forEach(id => counts[id] = 0);
      data?.forEach(item => {
        counts[item.entity_id] = (counts[item.entity_id] || 0) + 1;
      });
      
      return counts;
    },
    enabled: !!entityIds.length && !!activeWorkspace?.id,
  });
}
