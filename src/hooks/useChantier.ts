import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Json } from "@/integrations/supabase/types";

// ==================== LOTS ====================
export interface ProjectLot {
  id: string;
  project_id: string;
  workspace_id: string;
  name: string;
  crm_company_id: string | null;
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
  status: string;
  sort_order: number;
  color: string | null;
  created_at: string;
  updated_at: string;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

export type CreateLotInput = {
  project_id: string;
  workspace_id: string;
  name: string;
  crm_company_id?: string | null;
  budget?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
  sort_order?: number;
  color?: string | null;
};

// ==================== MEETINGS ====================
export interface MeetingAttendee {
  company_id?: string;
  contact_id?: string;
  name: string;
  present: boolean;
}

export interface ProjectMeeting {
  id: string;
  project_id: string;
  workspace_id: string;
  title: string;
  meeting_date: string;
  meeting_number: number | null;
  location: string | null;
  attendees: MeetingAttendee[] | null;
  notes: string | null;
  pdf_url: string | null;
  report_data: Record<string, unknown> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CreateMeetingInput = {
  project_id: string;
  workspace_id: string;
  title: string;
  meeting_date: string;
  meeting_number?: number;
  location?: string | null;
  attendees?: MeetingAttendee[];
  notes?: string | null;
};

// ==================== OBSERVATIONS ====================
export type ObservationStatus = "open" | "in_progress" | "resolved";
export type ObservationPriority = "low" | "normal" | "high" | "critical";

export interface ProjectObservation {
  id: string;
  project_id: string;
  workspace_id: string;
  meeting_id: string | null;
  lot_id: string | null;
  description: string;
  status: ObservationStatus;
  priority: ObservationPriority;
  photo_urls: string[] | null;
  due_date: string | null;
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lot?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  meeting?: {
    id: string;
    title: string;
    meeting_number: number | null;
  } | null;
}

export type CreateObservationInput = {
  project_id: string;
  workspace_id: string;
  meeting_id?: string | null;
  lot_id?: string | null;
  description: string;
  status?: ObservationStatus;
  priority?: ObservationPriority;
  photo_urls?: string[];
  due_date?: string | null;
  created_by?: string | null;
};

// ==================== HOOK ====================
export function useChantier(projectId: string | null) {
  const { activeWorkspace } = useAuth();
  const queryClient = useQueryClient();

  // -------------------- LOTS --------------------
  const { data: lots, isLoading: lotsLoading } = useQuery({
    queryKey: ["project-lots", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_lots")
        .select(`
          *,
          company:crm_company_id (id, name, logo_url)
        `)
        .eq("project_id", projectId)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return data as ProjectLot[];
    },
    enabled: !!projectId,
  });

  const createLot = useMutation({
    mutationFn: async (lot: Omit<CreateLotInput, "project_id" | "workspace_id">) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      const { data, error } = await supabase
        .from("project_lots")
        .insert({
          ...lot,
          project_id: projectId,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-lots", projectId] });
      toast.success("Lot créé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la création du lot");
      console.error(error);
    },
  });

  const updateLot = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectLot> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_lots")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-lots", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour du lot");
      console.error(error);
    },
  });

  const deleteLot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_lots")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-lots", projectId] });
      toast.success("Lot supprimé");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  // -------------------- MEETINGS --------------------
  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["project-meetings", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_meetings")
        .select("*")
        .eq("project_id", projectId)
        .order("meeting_date", { ascending: false });

      if (error) throw error;
      return (data || []).map(m => ({
        ...m,
        attendees: (m.attendees as unknown as MeetingAttendee[]) || []
      })) as ProjectMeeting[];
    },
    enabled: !!projectId,
  });

  const createMeeting = useMutation({
    mutationFn: async (meeting: Omit<CreateMeetingInput, "project_id" | "workspace_id"> & { preloadFromPrevious?: boolean }) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      // Get next meeting number and previous meeting data
      const { data: existingMeetings } = await supabase
        .from("project_meetings")
        .select("meeting_number, report_data, attendees")
        .eq("project_id", projectId)
        .order("meeting_number", { ascending: false })
        .limit(1);

      const nextNumber = (existingMeetings?.[0]?.meeting_number || 0) + 1;
      const previousMeeting = existingMeetings?.[0];

      // Preload report_data from previous meeting if requested (default: true)
      let preloadedReportData: Record<string, unknown> | null = null;
      if (meeting.preloadFromPrevious !== false && previousMeeting?.report_data) {
        const prevData = previousMeeting.report_data as Record<string, unknown>;
        preloadedReportData = {
          // Keep progress data from previous meeting
          lot_progress: prevData.lot_progress || [],
          general_progress: prevData.general_progress || { status: "on_track", comment: "" },
          // Keep unresolved blocking points
          blocking_points: Array.isArray(prevData.blocking_points) 
            ? (prevData.blocking_points as Array<{ status?: string }>).filter((bp) => bp.status !== "resolved")
            : [],
          // Keep pending documents
          documents: Array.isArray(prevData.documents) 
            ? (prevData.documents as Array<{ type?: string }>).filter((doc) => doc.type === "expected")
            : [],
          // Copy distribution list
          distribution_list: prevData.distribution_list || [],
          // Default values for other sections
          context: "",
          technical_decisions: [],
          planning: prevData.planning || { contractual_reminder: "", delays_noted: "", corrective_actions: "", delivery_impact: false },
          financial: prevData.financial || { enabled: false, supplementary_works: "", pending_quotes: "", service_orders: "" },
          sqe: { safety_ok: true, sps_observations: "", cleanliness_ok: true, nuisances_comment: "" },
          next_meeting: { date: null, time: "09:00", location_type: "site" },
          legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de 7 jours, il sera réputé accepté.",
          legal_delay_days: 7,
        };
      }

      // Also get unresolved observations from previous meetings
      const { data: unresolvedObs } = await supabase
        .from("project_observations")
        .select("id")
        .eq("project_id", projectId)
        .neq("status", "resolved");

      const insertData = {
        project_id: projectId,
        workspace_id: activeWorkspace.id,
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        meeting_number: nextNumber,
        location: meeting.location || null,
        attendees: meeting.attendees 
          ? JSON.parse(JSON.stringify(meeting.attendees)) 
          : (previousMeeting?.attendees ? JSON.parse(JSON.stringify(previousMeeting.attendees)) : []),
        notes: meeting.notes || null,
        report_data: preloadedReportData as Json | null,
      };

      const { data, error } = await supabase
        .from("project_meetings")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return { meeting: data, unresolvedCount: unresolvedObs?.length || 0 };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["project-meetings", projectId] });
      if (result.unresolvedCount > 0) {
        toast.success(`Réunion créée avec ${result.unresolvedCount} observation(s) non résolue(s) à traiter`);
      } else {
        toast.success("Réunion créée");
      }
    },
    onError: (error) => {
      toast.error("Erreur lors de la création de la réunion");
      console.error(error);
    },
  });

  const updateMeeting = useMutation({
    mutationFn: async ({ id, attendees, ...updates }: Partial<ProjectMeeting> & { id: string }) => {
      const updateData: Record<string, unknown> = { ...updates };
      if (attendees !== undefined) {
        updateData.attendees = JSON.parse(JSON.stringify(attendees));
      }

      const { data, error } = await supabase
        .from("project_meetings")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-meetings", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const deleteMeeting = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_meetings")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-meetings", projectId] });
      toast.success("Réunion supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  const duplicateMeeting = useMutation({
    mutationFn: async (sourceMeeting: ProjectMeeting) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      // Get next meeting number
      const { data: existing } = await supabase
        .from("project_meetings")
        .select("meeting_number")
        .eq("project_id", projectId)
        .order("meeting_number", { ascending: false })
        .limit(1);

      const nextNumber = (existing?.[0]?.meeting_number || 0) + 1;

      const insertData = {
        project_id: projectId,
        workspace_id: activeWorkspace.id,
        title: `${sourceMeeting.title} (copie)`,
        meeting_date: new Date().toISOString(),
        meeting_number: nextNumber,
        location: sourceMeeting.location,
        attendees: sourceMeeting.attendees ? JSON.parse(JSON.stringify(sourceMeeting.attendees)) : [],
        notes: sourceMeeting.notes,
        report_data: sourceMeeting.report_data ? JSON.parse(JSON.stringify(sourceMeeting.report_data)) : null,
      };

      const { data, error } = await supabase
        .from("project_meetings")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return {
        ...data,
        attendees: (data.attendees as unknown as MeetingAttendee[]) || []
      } as ProjectMeeting;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-meetings", projectId] });
      toast.success("Compte rendu dupliqué");
    },
    onError: (error) => {
      toast.error("Erreur lors de la duplication");
      console.error(error);
    },
  });

  // -------------------- OBSERVATIONS --------------------
  const { data: observations, isLoading: observationsLoading } = useQuery({
    queryKey: ["project-observations", projectId],
    queryFn: async () => {
      if (!projectId) return [];

      const { data, error } = await supabase
        .from("project_observations")
        .select(`
          *,
          lot:lot_id (id, name, color),
          meeting:meeting_id (id, title, meeting_number)
        `)
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProjectObservation[];
    },
    enabled: !!projectId,
  });

  const createObservation = useMutation({
    mutationFn: async (observation: Omit<CreateObservationInput, "project_id" | "workspace_id">) => {
      if (!projectId || !activeWorkspace?.id) {
        throw new Error("Missing project or workspace");
      }
      const { data, error } = await supabase
        .from("project_observations")
        .insert({
          ...observation,
          project_id: projectId,
          workspace_id: activeWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-observations", projectId] });
      toast.success("Observation ajoutée");
    },
    onError: (error) => {
      toast.error("Erreur lors de l'ajout de l'observation");
      console.error(error);
    },
  });

  const updateObservation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectObservation> & { id: string }) => {
      const { data, error } = await supabase
        .from("project_observations")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-observations", projectId] });
    },
    onError: (error) => {
      toast.error("Erreur lors de la mise à jour");
      console.error(error);
    },
  });

  const deleteObservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("project_observations")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-observations", projectId] });
      toast.success("Observation supprimée");
    },
    onError: (error) => {
      toast.error("Erreur lors de la suppression");
      console.error(error);
    },
  });

  return {
    // Lots
    lots: lots || [],
    lotsLoading,
    createLot,
    updateLot,
    deleteLot,
    // Meetings
    meetings: meetings || [],
    meetingsLoading,
    createMeeting,
    updateMeeting,
    deleteMeeting,
    duplicateMeeting,
    // Observations
    observations: observations || [],
    observationsLoading,
    createObservation,
    updateObservation,
    deleteObservation,
  };
}
