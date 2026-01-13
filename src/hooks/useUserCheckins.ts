import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export interface UserCheckin {
  id: string;
  workspace_id: string;
  user_id: string;
  date: string;
  checked_in_at: string | null;
  checkin_notes: string | null;
  checked_out_at: string | null;
  day_quality: number | null;
  checkout_mood: "great" | "good" | "neutral" | "tired" | "stressed" | null;
  checkout_notes: string | null;
  time_entries_validated: boolean;
  tomorrow_notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useUserCheckins() {
  const { activeWorkspace, user } = useAuth();
  const queryClient = useQueryClient();

  const today = format(new Date(), "yyyy-MM-dd");

  // Get today's check-in
  const { data: todayCheckin, isLoading } = useQuery({
    queryKey: ["user-checkin-today", activeWorkspace?.id, user?.id, today],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from("user_checkins")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .eq("date", today)
        .maybeSingle();

      if (error) throw error;
      return data as UserCheckin | null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  // Get yesterday's check-in for vigilance points
  const yesterday = format(new Date(Date.now() - 24 * 60 * 60 * 1000), "yyyy-MM-dd");
  const { data: yesterdayCheckin } = useQuery({
    queryKey: ["user-checkin-yesterday", activeWorkspace?.id, user?.id, yesterday],
    queryFn: async () => {
      if (!activeWorkspace?.id || !user?.id) return null;

      const { data, error } = await supabase
        .from("user_checkins")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .eq("user_id", user.id)
        .eq("date", yesterday)
        .maybeSingle();

      if (error) throw error;
      return data as UserCheckin | null;
    },
    enabled: !!activeWorkspace?.id && !!user?.id,
  });

  // Check-in mutation
  const checkIn = useMutation({
    mutationFn: async (notes?: string) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");

      const { data, error } = await supabase
        .from("user_checkins")
        .upsert({
          workspace_id: activeWorkspace.id,
          user_id: user.id,
          date: today,
          checked_in_at: new Date().toISOString(),
          checkin_notes: notes || null,
        }, {
          onConflict: "workspace_id,user_id,date",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-checkin-today"] });
    },
  });

  // Check-out mutation
  const checkOut = useMutation({
    mutationFn: async (data: {
      day_quality: number;
      checkout_mood?: string;
      checkout_notes?: string;
      tomorrow_notes?: string;
      time_entries_validated?: boolean;
    }) => {
      if (!activeWorkspace?.id || !user?.id) throw new Error("No workspace or user");

      const { data: result, error } = await supabase
        .from("user_checkins")
        .upsert({
          workspace_id: activeWorkspace.id,
          user_id: user.id,
          date: today,
          checked_out_at: new Date().toISOString(),
          day_quality: data.day_quality,
          checkout_mood: data.checkout_mood || null,
          checkout_notes: data.checkout_notes || null,
          tomorrow_notes: data.tomorrow_notes || null,
          time_entries_validated: data.time_entries_validated || false,
        }, {
          onConflict: "workspace_id,user_id,date",
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-checkin-today"] });
    },
  });

  const hasCheckedIn = !!todayCheckin?.checked_in_at;
  const hasCheckedOut = !!todayCheckin?.checked_out_at;

  return {
    todayCheckin,
    yesterdayCheckin,
    isLoading,
    hasCheckedIn,
    hasCheckedOut,
    checkIn,
    checkOut,
  };
}
