import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface MeetingAttentionItem {
  id: string;
  meeting_id: string;
  workspace_id: string;
  assignee_type: "all" | "specific" | "custom";
  assignee_company_ids: string[];
  assignee_lot_ids: string[];
  assignee_names: string[];
  stakeholder_type: "bet" | "entreprise" | "moa" | "other";
  description: string;
  urgency: "low" | "normal" | "high" | "critical";
  due_date: string | null;
  comment: string | null;
  progress: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateAttentionItemInput = Omit<MeetingAttentionItem, "id" | "workspace_id" | "created_by" | "created_at" | "updated_at">;

export function useMeetingAttentionItems(meetingId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["meeting-attention-items", meetingId],
    queryFn: async () => {
      if (!meetingId) return [];

      const { data, error } = await supabase
        .from("meeting_attention_items")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as MeetingAttentionItem[];
    },
    enabled: !!meetingId,
  });

  const createItem = useMutation({
    mutationFn: async (item: CreateAttentionItemInput) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      const { data, error } = await supabase
        .from("meeting_attention_items")
        .insert({
          ...item,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attention-items", meetingId] });
    },
    onError: () => {
      toast.error("Erreur lors de la création");
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MeetingAttentionItem> & { id: string }) => {
      const { data, error } = await supabase
        .from("meeting_attention_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attention-items", meetingId] });
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour");
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meeting_attention_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-attention-items", meetingId] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression");
    },
  });

  return {
    items: items || [],
    isLoading,
    createItem,
    updateItem,
    deleteItem,
  };
}
