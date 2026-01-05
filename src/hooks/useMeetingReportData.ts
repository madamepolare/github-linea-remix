import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectMeeting } from "@/hooks/useChantier";
import { Json } from "@/integrations/supabase/types";

// ==================== TYPES ====================
export interface LotProgress {
  lot_id: string;
  progress_percent: number;
  works_done: string;
  works_planned: string;
  observations: string;
  photo_urls?: string[];
}

export interface TechnicalDecision {
  id: string;
  description: string;
  decision: string;
  reference_doc?: string;
}

export interface BlockingPoint {
  id: string;
  description: string;
  lot_id: string | null;
  responsibility: string;
  consequence: string;
  resolution_date: string | null;
  status: "open" | "in_progress" | "resolved";
}

export interface DocumentItem {
  id: string;
  name: string;
  type: "transmitted" | "expected";
  due_date: string | null;
  file_url?: string;
}

export interface DistributionRecipient {
  name: string;
  email: string;
  type: string;
  send_pdf: boolean;
}

export interface ReportData {
  // Section 2 - Contexte
  context: string;
  
  // Section 4 - Avancement général
  general_progress: {
    status: "on_track" | "slight_delay" | "critical";
    comment: string;
  };
  
  // Section 5 - Avancement par lots
  lot_progress: LotProgress[];
  
  // Section 6 - Points techniques
  technical_decisions: TechnicalDecision[];
  
  // Section 7 - Points bloquants
  blocking_points: BlockingPoint[];
  
  // Section 8 - Planning
  planning: {
    contractual_reminder: string;
    delays_noted: string;
    corrective_actions: string;
    delivery_impact: boolean;
  };
  
  // Section 9 - Questions financières
  financial: {
    enabled: boolean;
    supplementary_works: string;
    pending_quotes: string;
    service_orders: string;
  };
  
  // Section 10 - SQE
  sqe: {
    safety_ok: boolean;
    sps_observations: string;
    cleanliness_ok: boolean;
    nuisances_comment: string;
  };
  
  // Section 11 - Documents
  documents: DocumentItem[];
  
  // Section 13 - Prochaine réunion
  next_meeting: {
    date: string | null;
    time: string;
    location_type: "site" | "remote" | "office";
  };
  
  // Section 14 - Diffusion
  distribution_list: DistributionRecipient[];
  
  // Section 15 - Mentions légales
  legal_mention: string;
  legal_delay_days: number;
}

const DEFAULT_REPORT_DATA: ReportData = {
  context: "",
  general_progress: {
    status: "on_track",
    comment: "",
  },
  lot_progress: [],
  technical_decisions: [],
  blocking_points: [],
  planning: {
    contractual_reminder: "",
    delays_noted: "",
    corrective_actions: "",
    delivery_impact: false,
  },
  financial: {
    enabled: false,
    supplementary_works: "",
    pending_quotes: "",
    service_orders: "",
  },
  sqe: {
    safety_ok: true,
    sps_observations: "",
    cleanliness_ok: true,
    nuisances_comment: "",
  },
  documents: [],
  next_meeting: {
    date: null,
    time: "09:00",
    location_type: "site",
  },
  distribution_list: [],
  legal_mention: "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de 7 jours, il sera réputé accepté.",
  legal_delay_days: 7,
};

const DEFAULT_LEGAL_MENTION = "Le présent compte rendu vaut constat contradictoire des décisions prises en réunion. À défaut de remarques écrites dans un délai de {DELAY} jours, il sera réputé accepté.";

// ==================== HOOK ====================
export function useMeetingReportData(meeting: ProjectMeeting) {
  const queryClient = useQueryClient();
  const [reportData, setReportData] = useState<ReportData>(() => {
    // Initialize from meeting.report_data if available
    const existingData = meeting.report_data as unknown as Partial<ReportData> | null;
    return {
      ...DEFAULT_REPORT_DATA,
      ...existingData,
    };
  });
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<string>(JSON.stringify(reportData));

  // Track changes
  useEffect(() => {
    const currentData = JSON.stringify(reportData);
    setHasUnsavedChanges(currentData !== lastSavedRef.current);
  }, [reportData]);

  // Auto-save with debounce
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      saveReportData();
    }, 3000); // Auto-save after 3 seconds of inactivity
    
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [reportData, hasUnsavedChanges]);

  const saveMutation = useMutation({
    mutationFn: async (data: ReportData) => {
      const { error } = await supabase
        .from("project_meetings")
        .update({ report_data: data as unknown as Json })
        .eq("id", meeting.id);
        
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      lastSavedRef.current = JSON.stringify(data);
      setHasUnsavedChanges(false);
      queryClient.invalidateQueries({ queryKey: ["project-meetings", meeting.project_id] });
    },
    onError: () => {
      toast.error("Erreur lors de la sauvegarde automatique");
    },
  });

  const saveReportData = useCallback(() => {
    if (!hasUnsavedChanges) return;
    saveMutation.mutate(reportData);
  }, [reportData, hasUnsavedChanges, saveMutation]);

  // Manual save
  const save = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    try {
      await saveMutation.mutateAsync(reportData);
      toast.success("Données du rapport sauvegardées");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    }
  }, [reportData, saveMutation]);

  // Update specific section
  const updateSection = useCallback(<K extends keyof ReportData>(
    section: K,
    value: ReportData[K]
  ) => {
    setReportData(prev => ({
      ...prev,
      [section]: value,
    }));
  }, []);

  // Update nested field
  const updateField = useCallback(<K extends keyof ReportData>(
    section: K,
    field: keyof ReportData[K],
    value: unknown
  ) => {
    setReportData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
  }, []);

  // Add item to array sections
  const addToArray = useCallback(<K extends keyof ReportData>(
    section: K,
    item: ReportData[K] extends Array<infer T> ? T : never
  ) => {
    setReportData(prev => ({
      ...prev,
      [section]: [...(prev[section] as unknown[]), item],
    }));
  }, []);

  // Remove item from array sections
  const removeFromArray = useCallback(<K extends keyof ReportData>(
    section: K,
    index: number
  ) => {
    setReportData(prev => ({
      ...prev,
      [section]: (prev[section] as unknown[]).filter((_, i) => i !== index),
    }));
  }, []);

  // Update item in array sections
  const updateInArray = useCallback(<K extends keyof ReportData>(
    section: K,
    index: number,
    updates: Partial<ReportData[K] extends Array<infer T> ? T : never>
  ) => {
    setReportData(prev => ({
      ...prev,
      [section]: (prev[section] as unknown[]).map((item, i) => 
        i === index ? { ...(item as object), ...updates } : item
      ),
    }));
  }, []);

  // Copy context from previous meeting
  const copyFromPreviousMeeting = useCallback(async (previousMeetingId: string) => {
    try {
      const { data, error } = await supabase
        .from("project_meetings")
        .select("report_data, notes")
        .eq("id", previousMeetingId)
        .single();
        
      if (error) throw error;
      
      const prevData = data.report_data as unknown as Partial<ReportData> | null;
      if (prevData?.context) {
        updateSection("context", prevData.context);
        toast.success("Contexte copié depuis le CR précédent");
      } else if (data.notes) {
        updateSection("context", data.notes);
        toast.success("Notes copiées depuis le CR précédent");
      } else {
        toast.info("Aucun contexte à copier");
      }
    } catch {
      toast.error("Erreur lors de la copie");
    }
  }, [updateSection]);

  // Get formatted legal mention
  const getFormattedLegalMention = useCallback(() => {
    return reportData.legal_mention.replace("{DELAY}", reportData.legal_delay_days.toString());
  }, [reportData.legal_mention, reportData.legal_delay_days]);

  // Apply template
  const applyTemplate = useCallback((templateData: Partial<ReportData>) => {
    setReportData(prev => ({
      ...prev,
      ...templateData,
      // Merge nested objects properly
      general_progress: {
        ...prev.general_progress,
        ...(templateData.general_progress || {}),
      },
      planning: {
        ...prev.planning,
        ...(templateData.planning || {}),
      },
      financial: {
        ...prev.financial,
        ...(templateData.financial || {}),
      },
      sqe: {
        ...prev.sqe,
        ...(templateData.sqe || {}),
      },
      next_meeting: {
        ...prev.next_meeting,
        ...(templateData.next_meeting || {}),
      },
    }));
  }, []);

  return {
    reportData,
    setReportData,
    hasUnsavedChanges,
    isSaving: saveMutation.isPending,
    save,
    updateSection,
    updateField,
    addToArray,
    removeFromArray,
    updateInArray,
    copyFromPreviousMeeting,
    getFormattedLegalMention,
    applyTemplate,
    DEFAULT_LEGAL_MENTION,
  };
}
