import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MeetingVersion {
  id: string;
  meeting_id: string;
  workspace_id: string;
  version_number: number;
  notes: string | null;
  attendees: any[] | null;
  created_at: string;
  created_by: string | null;
}

export function useMeetingVersions(meetingId: string) {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["meeting-versions", meetingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("meeting_report_versions")
        .select("*")
        .eq("meeting_id", meetingId)
        .order("version_number", { ascending: false });

      if (error) throw error;
      return data as MeetingVersion[];
    },
    enabled: !!meetingId && !!activeWorkspace?.id,
  });

  const createVersion = useMutation({
    mutationFn: async ({ notes, attendees }: { notes: string | null; attendees: any[] | null }) => {
      if (!activeWorkspace?.id) throw new Error("No workspace");

      // Get the next version number
      const nextVersionNumber = versions.length > 0 ? versions[0].version_number + 1 : 1;

      const { data, error } = await supabase
        .from("meeting_report_versions")
        .insert({
          meeting_id: meetingId,
          workspace_id: activeWorkspace.id,
          version_number: nextVersionNumber,
          notes,
          attendees,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meeting-versions", meetingId] });
    },
  });

  return {
    versions,
    isLoading,
    createVersion,
    latestVersionNumber: versions.length > 0 ? versions[0].version_number : 0,
  };
}
