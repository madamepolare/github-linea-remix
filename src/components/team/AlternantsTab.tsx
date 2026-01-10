import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { GraduationCap, Calendar, Building, School, FileText, ExternalLink } from "lucide-react";

interface ApprenticeSchedule {
  id: string;
  user_id: string;
  schedule_name: string;
  start_date: string;
  end_date: string;
  pattern_type: string;
  company_days_per_week: number | null;
  school_days_per_week: number | null;
  pdf_url: string | null;
  pdf_filename: string | null;
}

export function AlternantsTab() {
  const { activeWorkspace } = useAuth();
  const { data: members, isLoading: membersLoading } = useTeamMembers();

  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["apprentice-schedules", activeWorkspace?.id],
    queryFn: async (): Promise<ApprenticeSchedule[]> => {
      if (!activeWorkspace) return [];

      const { data, error } = await supabase
        .from("apprentice_schedules")
        .select("*")
        .eq("workspace_id", activeWorkspace.id)
        .order("start_date", { ascending: false });

      if (error) throw error;
      return data as ApprenticeSchedule[];
    },
    enabled: !!activeWorkspace,
  });

  const isLoading = membersLoading || schedulesLoading;

  // Get unique alternant user IDs
  const alternantUserIds = [...new Set(schedules?.map((s) => s.user_id) || [])];
  const alternants = members?.filter((m) => alternantUserIds.includes(m.user_id)) || [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (alternants.length === 0) {
    return (
      <EmptyState
        icon={GraduationCap}
        title="Aucun alternant"
        description="Les alternants avec des plannings configurés apparaîtront ici."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {alternants.map((member) => {
          const memberSchedules = schedules?.filter((s) => s.user_id === member.user_id) || [];
          const currentSchedule = memberSchedules.find((s) => {
            const start = parseISO(s.start_date);
            const end = parseISO(s.end_date);
            const now = new Date();
            return now >= start && now <= end;
          });
          const initials = member.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?";

          return (
            <Card key={member.user_id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {member.profile?.full_name || "—"}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground truncate">
                      {member.profile?.job_title || "Alternant"}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Alternant
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentSchedule ? (
                  <>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Planning:</span>
                      <span className="font-medium">{currentSchedule.schedule_name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span>{currentSchedule.company_days_per_week || 0}j/sem entreprise</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <School className="h-4 w-4 text-muted-foreground" />
                        <span>{currentSchedule.school_days_per_week || 0}j/sem école</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Du {format(parseISO(currentSchedule.start_date), "d MMM yyyy", { locale: fr })} au{" "}
                      {format(parseISO(currentSchedule.end_date), "d MMM yyyy", { locale: fr })}
                    </div>
                    {currentSchedule.pdf_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a href={currentSchedule.pdf_url} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          {currentSchedule.pdf_filename || "Voir le planning"}
                          <ExternalLink className="h-3 w-3 ml-auto" />
                        </a>
                      </Button>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun planning actif
                  </p>
                )}
                {memberSchedules.length > 1 && (
                  <p className="text-xs text-muted-foreground">
                    + {memberSchedules.length - 1} autre(s) planning(s)
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
