import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";
import { ReportData } from "./useMeetingReportData";

export type ReportStatus = "draft" | "review" | "validated" | "sent";

export interface MeetingReport {
  id: string;
  project_id: string;
  workspace_id: string;
  meeting_id: string | null;
  report_number: number | null;
  title: string;
  status: ReportStatus;
  report_date: string;
  report_data: ReportData | null;
  pdf_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined meeting info
  meeting?: {
    id: string;
    title: string;
    meeting_date: string;
    meeting_number: number | null;
    location: string | null;
  } | null;
}

export type CreateReportInput = {
  project_id: string;
  workspace_id: string;
  meeting_id?: string | null;
  report_number?: number;
  title: string;
  status?: ReportStatus;
  report_date?: string;
  report_data?: ReportData;
};

export function useMeetingReports(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all reports for a project
  const { data: reports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["meeting-reports", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("meeting_reports")
        .select(`
          *,
          meeting:meeting_id (id, title, meeting_date, meeting_number, location)
        `)
        .eq("project_id", projectId)
        .order("report_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(r => ({
        ...r,
        report_data: r.report_data as unknown as ReportData | null,
        status: r.status as ReportStatus
      })) as MeetingReport[];
    },
    enabled: !!projectId,
  });

  // Create a new report
  const createReport = useMutation({
    mutationFn: async (input: Omit<CreateReportInput, "project_id" | "workspace_id">) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      // Get next report number
      const { data: existing } = await supabase
        .from("meeting_reports")
        .select("report_number")
        .eq("project_id", projectId)
        .order("report_number", { ascending: false })
        .limit(1);

      const nextNumber = (existing?.[0]?.report_number || 0) + 1;

      const { data, error } = await supabase
        .from("meeting_reports")
        .insert({
          project_id: projectId,
          workspace_id: activeWorkspace.id,
          meeting_id: input.meeting_id || null,
          report_number: input.report_number || nextNumber,
          title: input.title,
          status: input.status || "draft",
          report_date: input.report_date || new Date().toISOString().split("T")[0],
          report_data: input.report_data as unknown as Json | null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-reports", projectId] });
      toast.success("Compte rendu créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du CR");
      console.error(error);
    },
  });

  // Update a report
  const updateReport = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MeetingReport> & { id: string }) => {
      const updateData: Record<string, unknown> = {};
      
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.report_date !== undefined) updateData.report_date = updates.report_date;
      if (updates.meeting_id !== undefined) updateData.meeting_id = updates.meeting_id;
      if (updates.report_data !== undefined) updateData.report_data = updates.report_data as unknown as Json;
      if (updates.pdf_url !== undefined) updateData.pdf_url = updates.pdf_url;

      const { data, error } = await supabase
        .from("meeting_reports")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-reports", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  // Delete a report
  const deleteReport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("meeting_reports")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-reports", projectId] });
      toast.success("Compte rendu supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  // Duplicate a report
  const duplicateReport = useMutation({
    mutationFn: async (source: MeetingReport) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }

      const { data: existing } = await supabase
        .from("meeting_reports")
        .select("report_number")
        .eq("project_id", projectId)
        .order("report_number", { ascending: false })
        .limit(1);

      const nextNumber = (existing?.[0]?.report_number || 0) + 1;

      const { data, error } = await supabase
        .from("meeting_reports")
        .insert({
          project_id: projectId,
          workspace_id: activeWorkspace.id,
          meeting_id: null, // Don't duplicate meeting link
          report_number: nextNumber,
          title: `${source.title} (copie)`,
          status: "draft",
          report_date: new Date().toISOString().split("T")[0],
          report_data: source.report_data as unknown as Json | null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-reports", projectId] });
      toast.success("Compte rendu dupliqué");
    },
    onError: (error) => {
      toast.error("Erreur lors de la duplication");
      console.error(error);
    },
  });

  return {
    reports,
    reportsLoading,
    createReport,
    updateReport,
    deleteReport,
    duplicateReport,
  };
}
