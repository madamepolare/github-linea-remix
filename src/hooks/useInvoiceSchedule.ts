import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface InvoiceScheduleItem {
  id: string;
  workspace_id: string;
  project_id: string;
  quote_id: string | null;
  schedule_number: number;
  title: string;
  description: string | null;
  percentage: number | null;
  amount_ht: number;
  amount_ttc: number | null;
  vat_rate: number;
  planned_date: string;
  invoice_id: string | null;
  status: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  phase_ids: string[];
  milestone: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  invoice?: {
    id: string;
    invoice_number: string;
    status: string;
  } | null;
}

export interface CreateScheduleItemInput {
  project_id: string;
  quote_id?: string;
  schedule_number: number;
  title: string;
  description?: string;
  percentage?: number;
  amount_ht: number;
  vat_rate?: number;
  planned_date: string;
  phase_ids?: string[];
  milestone?: string;
}

export interface UpdateScheduleItemInput {
  id: string;
  title?: string;
  description?: string;
  percentage?: number;
  amount_ht?: number;
  vat_rate?: number;
  planned_date?: string;
  status?: 'pending' | 'invoiced' | 'paid' | 'cancelled';
  invoice_id?: string;
  milestone?: string;
}

export function useInvoiceSchedule(projectId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["invoice-schedule", projectId];

  // Fetch schedule items
  const {
    data: scheduleItems = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      const { data, error } = await supabase
        .from("invoice_schedule")
        .select(`
          *,
          invoice:invoices(id, invoice_number, status)
        `)
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .order("schedule_number", { ascending: true });

      if (error) {
        console.error("Error fetching invoice schedule:", error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        phase_ids: Array.isArray(item.phase_ids) ? item.phase_ids : [],
      })) as InvoiceScheduleItem[];
    },
    enabled: !!activeWorkspace && !!projectId,
  });

  // Create schedule item
  const createScheduleItem = useMutation({
    mutationFn: async (input: CreateScheduleItemInput) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      const amountTtc = input.amount_ht * (1 + (input.vat_rate || 20) / 100);

      const { data, error } = await supabase
        .from("invoice_schedule")
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user.id,
          amount_ttc: amountTtc,
          vat_rate: input.vat_rate || 20,
          phase_ids: input.phase_ids || [],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Échéance ajoutée");
    },
    onError: (error: Error) => {
      console.error("Error creating schedule item:", error);
      toast.error("Erreur lors de l'ajout de l'échéance");
    },
  });

  // Update schedule item
  const updateScheduleItem = useMutation({
    mutationFn: async ({ id, ...input }: UpdateScheduleItemInput) => {
      const updates: Record<string, unknown> = { ...input };
      
      if (input.amount_ht !== undefined && input.vat_rate !== undefined) {
        updates.amount_ttc = input.amount_ht * (1 + input.vat_rate / 100);
      }

      const { data, error } = await supabase
        .from("invoice_schedule")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Échéance mise à jour");
    },
    onError: (error: Error) => {
      console.error("Error updating schedule item:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Delete schedule item
  const deleteScheduleItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("invoice_schedule")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Échéance supprimée");
    },
    onError: (error: Error) => {
      console.error("Error deleting schedule item:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Generate schedule from quote
  const generateFromQuote = useMutation({
    mutationFn: async ({ quoteId, schedule }: { quoteId: string; schedule: { title: string; percentage: number; daysFromStart: number }[] }) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      // Get quote info
      const { data: quote, error: quoteError } = await supabase
        .from("commercial_documents")
        .select("total_amount, vat_rate")
        .eq("id", quoteId)
        .single();

      if (quoteError) throw quoteError;

      const totalAmount = quote.total_amount || 0;
      const vatRate = quote.vat_rate || 20;
      const startDate = new Date();

      const scheduleItems = schedule.map((item, index) => {
        const amountHt = totalAmount * (item.percentage / 100);
        const plannedDate = new Date(startDate);
        plannedDate.setDate(plannedDate.getDate() + item.daysFromStart);

        return {
          workspace_id: activeWorkspace.id,
          project_id: projectId,
          quote_id: quoteId,
          schedule_number: index + 1,
          title: item.title,
          percentage: item.percentage,
          amount_ht: amountHt,
          amount_ttc: amountHt * (1 + vatRate / 100),
          vat_rate: vatRate,
          planned_date: plannedDate.toISOString().split('T')[0],
          created_by: user.id,
        };
      });

      const { error } = await supabase
        .from("invoice_schedule")
        .insert(scheduleItems);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Échéancier généré");
    },
    onError: (error: Error) => {
      console.error("Error generating schedule:", error);
      toast.error("Erreur lors de la génération");
    },
  });

  // Summary calculations
  const summary = {
    totalAmountHt: scheduleItems.reduce((sum, item) => sum + (item.amount_ht || 0), 0),
    totalAmountTtc: scheduleItems.reduce((sum, item) => sum + (item.amount_ttc || 0), 0),
    invoicedAmountHt: scheduleItems
      .filter(item => item.status === 'invoiced' || item.status === 'paid')
      .reduce((sum, item) => sum + (item.amount_ht || 0), 0),
    paidAmountHt: scheduleItems
      .filter(item => item.status === 'paid')
      .reduce((sum, item) => sum + (item.amount_ht || 0), 0),
    pendingAmountHt: scheduleItems
      .filter(item => item.status === 'pending')
      .reduce((sum, item) => sum + (item.amount_ht || 0), 0),
    count: scheduleItems.length,
    pendingCount: scheduleItems.filter(item => item.status === 'pending').length,
    invoicedCount: scheduleItems.filter(item => item.status === 'invoiced').length,
    paidCount: scheduleItems.filter(item => item.status === 'paid').length,
  };

  // Get next upcoming item
  const today = new Date().toISOString().split('T')[0];
  const nextDue = scheduleItems
    .filter(item => item.status === 'pending' && item.planned_date >= today)
    .sort((a, b) => a.planned_date.localeCompare(b.planned_date))[0];

  // Get overdue items
  const overdueItems = scheduleItems.filter(
    item => item.status === 'pending' && item.planned_date < today
  );

  return {
    scheduleItems,
    isLoading,
    error,
    summary,
    nextDue,
    overdueItems,
    createScheduleItem,
    updateScheduleItem,
    deleteScheduleItem,
    generateFromQuote,
  };
}
