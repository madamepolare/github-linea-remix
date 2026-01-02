import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    mutationFn: async (meeting: Omit<CreateMeetingInput, "project_id" | "workspace_id">) => {
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
        title: meeting.title,
        meeting_date: meeting.meeting_date,
        meeting_number: nextNumber,
        location: meeting.location || null,
        attendees: meeting.attendees ? JSON.parse(JSON.stringify(meeting.attendees)) : [],
        notes: meeting.notes || null,
      };

      const { data, error } = await supabase
        .from("project_meetings")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-meetings", projectId] });
      toast.success("Réunion créée");
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
    // Observations
    observations: observations || [],
    observationsLoading,
    createObservation,
    updateObservation,
    deleteObservation,
  };
}
