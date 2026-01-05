import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DocumentReminder {
  id: string;
  workspace_id: string;
  document_id: string;
  reminder_date: string;
  reminder_type: '7_days' | '30_days' | '60_days' | 'expired';
  is_sent: boolean;
  is_read: boolean;
  sent_at: string | null;
  created_at: string;
  document?: {
    id: string;
    title: string;
    document_type: string;
    valid_until: string | null;
    status: string | null;
  };
}

export interface ExpiringDocument {
  id: string;
  title: string;
  document_type: string;
  valid_until: string;
  status: string | null;
  days_until_expiry: number;
  urgency: 'expired' | 'critical' | 'warning' | 'info';
}

export function useDocumentReminders() {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Get documents expiring soon
  const { data: expiringDocuments = [], isLoading: isLoadingExpiring } = useQuery({
    queryKey: ["expiring-documents", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const today = new Date();
      const in60Days = new Date(today);
      in60Days.setDate(in60Days.getDate() + 60);

      const { data, error } = await supabase
        .from("agency_documents")
        .select("id, title, document_type, valid_until, status")
        .eq("workspace_id", activeWorkspace.id)
        .not("valid_until", "is", null)
        .lte("valid_until", in60Days.toISOString().split('T')[0])
        .order("valid_until", { ascending: true });

      if (error) throw error;

      return (data || []).map((doc) => {
        const validUntil = new Date(doc.valid_until!);
        const diffTime = validUntil.getTime() - today.getTime();
        const daysUntilExpiry = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let urgency: ExpiringDocument['urgency'] = 'info';
        if (daysUntilExpiry <= 0) urgency = 'expired';
        else if (daysUntilExpiry <= 7) urgency = 'critical';
        else if (daysUntilExpiry <= 30) urgency = 'warning';

        return {
          ...doc,
          valid_until: doc.valid_until!,
          days_until_expiry: daysUntilExpiry,
          urgency,
        } as ExpiringDocument;
      });
    },
    enabled: !!activeWorkspace?.id,
  });

  // Get reminders
  const { data: reminders = [], isLoading: isLoadingReminders } = useQuery({
    queryKey: ["document-reminders", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("document_expiration_reminders")
        .select(`
          *,
          document:agency_documents(id, title, document_type, valid_until, status)
        `)
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_read", false)
        .order("reminder_date", { ascending: true });

      if (error) throw error;
      return data as DocumentReminder[];
    },
    enabled: !!activeWorkspace?.id,
  });

  const markReminderAsRead = useMutation({
    mutationFn: async (reminderId: string) => {
      const { error } = await supabase
        .from("document_expiration_reminders")
        .update({ is_read: true })
        .eq("id", reminderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["document-reminders"] });
    },
  });

  // Computed stats
  const expiredCount = expiringDocuments.filter(d => d.urgency === 'expired').length;
  const criticalCount = expiringDocuments.filter(d => d.urgency === 'critical').length;
  const warningCount = expiringDocuments.filter(d => d.urgency === 'warning').length;

  return {
    expiringDocuments,
    reminders,
    isLoading: isLoadingExpiring || isLoadingReminders,
    expiredCount,
    criticalCount,
    warningCount,
    markReminderAsRead,
  };
}
