import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { PurchaseStatus, PurchaseCategory, PurchaseType } from "@/lib/purchaseTypes";

export interface ProjectPurchase {
  id: string;
  workspace_id: string;
  project_id: string;
  purchase_type: PurchaseType;
  purchase_category: PurchaseCategory;
  title: string;
  description: string | null;
  supplier_id: string | null;
  supplier_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  due_date: string | null;
  received_date: string | null;
  amount_ht: number;
  vat_rate: number | null;
  amount_ttc: number;
  selling_price: number | null;
  margin_percentage: number | null;
  status: PurchaseStatus;
  payment_date: string | null;
  payment_reference: string | null;
  assigned_to: string | null;
  file_url: string | null;
  files: any[];
  notes: string | null;
  phase_id: string | null;
  budget_envelope_id: string | null;
  sort_order: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  supplier?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
  phase?: {
    id: string;
    name: string;
  } | null;
  budget_envelope?: {
    id: string;
    name: string;
  } | null;
}

export interface CreatePurchaseInput {
  project_id: string;
  purchase_type: PurchaseType;
  purchase_category: PurchaseCategory;
  title: string;
  description?: string;
  supplier_id?: string;
  supplier_name?: string;
  invoice_number?: string;
  invoice_date?: string;
  due_date?: string;
  received_date?: string;
  amount_ht: number;
  vat_rate?: number;
  selling_price?: number;
  status?: PurchaseStatus;
  payment_date?: string;
  payment_reference?: string;
  assigned_to?: string;
  file_url?: string;
  files?: any[];
  notes?: string;
  phase_id?: string;
  budget_envelope_id?: string;
}

export interface UpdatePurchaseInput extends Partial<CreatePurchaseInput> {
  id: string;
}

export function useProjectPurchases(projectId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ["project-purchases", projectId];

  // Fetch purchases
  const {
    data: purchases = [],
    isLoading,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!activeWorkspace || !projectId) return [];

      const { data, error } = await supabase
        .from("project_purchases")
        .select(`
          *,
          supplier:crm_companies(id, name, logo_url),
          phase:project_phases(id, name),
          budget_envelope:project_budget_envelopes(id, name)
        `)
        .eq("project_id", projectId)
        .eq("workspace_id", activeWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching purchases:", error);
        throw error;
      }

      return (data || []) as ProjectPurchase[];
    },
    enabled: !!activeWorkspace && !!projectId,
  });

  // Create purchase
  const createPurchase = useMutation({
    mutationFn: async (input: CreatePurchaseInput) => {
      if (!activeWorkspace || !user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("project_purchases")
        .insert({
          ...input,
          workspace_id: activeWorkspace.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Achat créé avec succès");
    },
    onError: (error: Error) => {
      console.error("Error creating purchase:", error);
      toast.error("Erreur lors de la création");
    },
  });

  // Update purchase
  const updatePurchase = useMutation({
    mutationFn: async ({ id, ...input }: UpdatePurchaseInput) => {
      const { data, error } = await supabase
        .from("project_purchases")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Achat mis à jour");
    },
    onError: (error: Error) => {
      console.error("Error updating purchase:", error);
      toast.error("Erreur lors de la mise à jour");
    },
  });

  // Update status
  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: PurchaseStatus }) => {
      const updates: any = { status };
      
      // Auto-fill dates based on status
      if (status === "invoice_received" || status === "payment_pending") {
        updates.received_date = new Date().toISOString().split("T")[0];
      }
      if (status === "paid") {
        updates.payment_date = new Date().toISOString().split("T")[0];
      }

      const { data, error } = await supabase
        .from("project_purchases")
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
    onError: (error: Error) => {
      console.error("Error updating status:", error);
      toast.error("Erreur lors du changement de statut");
    },
  });

  // Delete purchase
  const deletePurchase = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_purchases")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Achat supprimé");
    },
    onError: (error: Error) => {
      console.error("Error deleting purchase:", error);
      toast.error("Erreur lors de la suppression");
    },
  });

  // Calculations
  const totals = {
    // All purchases
    totalHT: purchases.reduce((sum, p) => sum + (p.amount_ht || 0), 0),
    totalTTC: purchases.reduce((sum, p) => sum + (p.amount_ttc || 0), 0),
    
    // By type
    provisionsHT: purchases
      .filter((p) => p.purchase_type === "provision")
      .reduce((sum, p) => sum + (p.amount_ht || 0), 0),
    invoicesHT: purchases
      .filter((p) => p.purchase_type === "supplier_invoice")
      .reduce((sum, p) => sum + (p.amount_ht || 0), 0),
    
    // By status
    paidHT: purchases
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.amount_ht || 0), 0),
    pendingHT: purchases
      .filter((p) => ["invoice_received", "payment_pending"].includes(p.status))
      .reduce((sum, p) => sum + (p.amount_ht || 0), 0),
    
    // Selling & margin
    totalSellingPrice: purchases
      .filter((p) => p.selling_price)
      .reduce((sum, p) => sum + (p.selling_price || 0), 0),
    totalMargin: purchases
      .filter((p) => p.selling_price && p.amount_ht)
      .reduce((sum, p) => sum + ((p.selling_price || 0) - (p.amount_ht || 0)), 0),
    
    // Counts
    count: purchases.length,
    provisionsCount: purchases.filter((p) => p.purchase_type === "provision").length,
    invoicesCount: purchases.filter((p) => p.purchase_type === "supplier_invoice").length,
  };

  // Group by status for kanban
  const byStatus = purchases.reduce((acc, purchase) => {
    const status = purchase.status;
    if (!acc[status]) acc[status] = [];
    acc[status].push(purchase);
    return acc;
  }, {} as Record<PurchaseStatus, ProjectPurchase[]>);

  // Upcoming due dates (next 7 days)
  const upcomingDueDates = purchases.filter((p) => {
    if (!p.due_date || p.status === "paid" || p.status === "cancelled") return false;
    const dueDate = new Date(p.due_date);
    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return dueDate >= today && dueDate <= weekFromNow;
  });

  // Overdue purchases
  const overduePurchases = purchases.filter((p) => {
    if (!p.due_date || p.status === "paid" || p.status === "cancelled") return false;
    const dueDate = new Date(p.due_date);
    const today = new Date();
    return dueDate < today;
  });

  return {
    purchases,
    isLoading,
    error,
    totals,
    byStatus,
    upcomingDueDates,
    overduePurchases,
    createPurchase,
    updatePurchase,
    updateStatus,
    deletePurchase,
  };
}
