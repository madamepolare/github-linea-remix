import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type CalendarProvider = "google" | "outlook" | "apple" | "ical";
export type SyncDirection = "import" | "export" | "bidirectional";
export type SyncStatus = "pending" | "syncing" | "synced" | "error";

export interface CalendarConnection {
  id: string;
  workspace_id: string;
  user_id: string | null;
  provider: CalendarProvider;
  provider_account_email: string | null;
  provider_account_name: string | null;
  is_shared: boolean;
  calendar_name: string;
  calendar_color: string | null;
  sync_enabled: boolean;
  sync_direction: SyncDirection;
  last_sync_at: string | null;
  sync_status: SyncStatus;
  sync_error: string | null;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateConnectionInput {
  provider: CalendarProvider;
  is_shared?: boolean;
  calendar_name: string;
  calendar_color?: string;
  sync_direction?: SyncDirection;
  provider_account_email?: string;
  ical_url?: string;
}

export function useCalendarConnections() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: connections = [], isLoading, error } = useQuery({
    queryKey: ["calendar-connections", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("calendar_connections")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CalendarConnection[];
    },
    enabled: !!activeWorkspace,
  });

  // Separate personal and shared connections
  const personalConnections = connections.filter(c => !c.is_shared && c.user_id === user?.id);
  const sharedConnections = connections.filter(c => c.is_shared);
  const otherUserConnections = connections.filter(c => !c.is_shared && c.user_id !== user?.id);

  const createConnection = useMutation({
    mutationFn: async (input: CreateConnectionInput) => {
      if (!activeWorkspace || !user) throw new Error("Non authentifié");

      const { data, error } = await supabase
        .from("calendar_connections")
        .insert({
          workspace_id: activeWorkspace.id,
          user_id: input.is_shared ? null : user.id,
          provider: input.provider,
          is_shared: input.is_shared || false,
          calendar_name: input.calendar_name,
          calendar_color: input.calendar_color || "#3B82F6",
          sync_direction: input.sync_direction || "import",
          provider_account_email: input.provider_account_email,
          settings: input.ical_url ? { ical_url: input.ical_url } : {},
          sync_status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      toast.success("Calendrier connecté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateConnection = useMutation({
    mutationFn: async (input: Partial<CalendarConnection> & { id: string }) => {
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from("calendar_connections")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      toast.success("Calendrier mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteConnection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("calendar_connections")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      toast.success("Calendrier déconnecté");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const syncConnection = useMutation({
    mutationFn: async (id: string) => {
      // Update status to syncing
      await supabase
        .from("calendar_connections")
        .update({ sync_status: "syncing" })
        .eq("id", id);

      // In a real implementation, this would trigger an edge function
      // For now, simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));

      const { data, error } = await supabase
        .from("calendar_connections")
        .update({ 
          sync_status: "synced",
          last_sync_at: new Date().toISOString(),
          sync_error: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-connections"] });
      queryClient.invalidateQueries({ queryKey: ["synced-calendar-events"] });
      toast.success("Synchronisation terminée");
    },
    onError: (error) => {
      toast.error("Erreur de synchronisation: " + error.message);
    },
  });

  return {
    connections,
    personalConnections,
    sharedConnections,
    otherUserConnections,
    isLoading,
    error,
    createConnection,
    updateConnection,
    deleteConnection,
    syncConnection,
  };
}
