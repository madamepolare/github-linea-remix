import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isWithinInterval, parseISO, addMonths, subMonths, getDay } from "date-fns";
import { fr } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTeamAbsences, useCreateAbsence, useUpdateAbsence, useDeleteAbsence, useApproveAbsence, absenceTypeLabels, TeamAbsence } from "@/hooks/useTeamAbsences";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarOff, Plus, ChevronLeft, ChevronRight, Check, X, Pencil, Trash2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

// Map day names to getDay() values (0 = Sunday, 1 = Monday, etc.)
const DAY_NAME_TO_NUMBER: Record<string, number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
};

interface ApprenticeSchedule {
  user_id: string;
  start_date: string;
  end_date: string;
  custom_pattern: { school_days?: string[] } | null;
}

export function AbsencesTab() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("calendar");
  const [newAbsence, setNewAbsence] = useState<Partial<TeamAbsence> & { target_user_id?: string; auto_approve?: boolean }>({
    absence_type: "conge_paye",
    start_date: "",
    end_date: "",
    start_half_day: false,
    end_half_day: false,
    reason: "",
    target_user_id: "",
    auto_approve: false,
  });
  const [editingAbsence, setEditingAbsence] = useState<TeamAbsence | null>(null);
  const [deleteAbsenceId, setDeleteAbsenceId] = useState<string | null>(null);

  const { data: absences, isLoading } = useTeamAbsences();
  const { data: members } = useTeamMembers();
  const { user, activeWorkspace } = useAuth();
  const createAbsence = useCreateAbsence();
  const updateAbsence = useUpdateAbsence();
  const deleteAbsence = useDeleteAbsence();
  const approveAbsence = useApproveAbsence();

  // Fetch apprentice schedules
  const { data: apprenticeSchedules } = useQuery({
    queryKey: ["apprentice-schedules-absences", activeWorkspace?.id],
    queryFn: async (): Promise<ApprenticeSchedule[]> => {
      if (!activeWorkspace) return [];
      const { data, error } = await supabase
        .from("apprentice_schedules")
        .select("user_id, start_date, end_date, custom_pattern")
        .eq("workspace_id", activeWorkspace.id);
      if (error) throw error;
      return (data || []) as ApprenticeSchedule[];
    },
    enabled: !!activeWorkspace,
  });

  const currentUserRole = members?.find((m) => m.user_id === user?.id)?.role;
  const canApprove = currentUserRole === "owner" || currentUserRole === "admin";

  const pendingAbsences = absences?.filter((a) => a.status === "pending") || [];
  const myAbsences = absences?.filter((a) => a.user_id === user?.id) || [];
  const allAbsences = absences || [];

  const memberMap = members?.reduce((acc, m) => {
    acc[m.user_id] = m;
    return acc;
  }, {} as Record<string, typeof members[0]>);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get school days for apprentices on a given date
  const getSchoolDaysForDate = (date: Date) => {
    const dayOfWeek = getDay(date);
    const schoolDays: { userId: string; memberName: string }[] = [];

    apprenticeSchedules?.forEach((schedule) => {
      const start = parseISO(schedule.start_date);
      const end = parseISO(schedule.end_date);
      
      // Check if date is within schedule period
      if (date >= start && date <= end) {
        const pattern = schedule.custom_pattern as { school_days?: string[] } | null;
        const schoolDaysPattern = pattern?.school_days || [];
        
        // Check if this day of week is a school day
        const isSchoolDay = schoolDaysPattern.some(
          (dayName) => DAY_NAME_TO_NUMBER[dayName] === dayOfWeek
        );
        
        if (isSchoolDay) {
          const member = memberMap?.[schedule.user_id];
          schoolDays.push({
            userId: schedule.user_id,
            memberName: member?.profile?.full_name?.split(" ")[0] || "?",
          });
        }
      }
    });

    return schoolDays;
  };

  const getAbsencesForDay = (date: Date) => {
    return absences?.filter((a) => {
      const start = parseISO(a.start_date);
      const end = parseISO(a.end_date);
      return isWithinInterval(date, { start, end }) && a.status === "approved";
    }) || [];
  };

  const handleCreate = async () => {
    if (!newAbsence.start_date || !newAbsence.end_date) return;
    
    // If admin is creating for another user
    const targetUserId = canApprove && newAbsence.target_user_id ? newAbsence.target_user_id : undefined;
    
    await createAbsence.mutateAsync({
      absence_type: newAbsence.absence_type,
      start_date: newAbsence.start_date,
      end_date: newAbsence.end_date,
      start_half_day: newAbsence.start_half_day,
      end_half_day: newAbsence.end_half_day,
      reason: newAbsence.reason,
      user_id: targetUserId,
      auto_approve: canApprove && newAbsence.auto_approve,
    });
    setCreateOpen(false);
    setNewAbsence({
      absence_type: "conge_paye",
      start_date: "",
      end_date: "",
      start_half_day: false,
      end_half_day: false,
      reason: "",
      target_user_id: "",
      auto_approve: false,
    });
  };

  const handleUpdate = async () => {
    if (!editingAbsence) return;
    await updateAbsence.mutateAsync({
      id: editingAbsence.id,
      absence_type: editingAbsence.absence_type,
      start_date: editingAbsence.start_date,
      end_date: editingAbsence.end_date,
      start_half_day: editingAbsence.start_half_day,
      end_half_day: editingAbsence.end_half_day,
      reason: editingAbsence.reason,
    });
    setEditingAbsence(null);
  };

  const handleDelete = async () => {
    if (!deleteAbsenceId) return;
    await deleteAbsence.mutateAsync(deleteAbsenceId);
    setDeleteAbsenceId(null);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <TabsList className="w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="calendar" className="text-xs sm:text-sm">Calendrier</TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm">
              Demandes
              {pendingAbsences.length > 0 && canApprove && (
                <Badge variant="destructive" className="ml-1.5 h-4 w-4 sm:h-5 sm:w-5 p-0 justify-center text-[10px]">
                  {pendingAbsences.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my" className="text-xs sm:text-sm">Mes absences</TabsTrigger>
            {canApprove && (
              <TabsTrigger value="all" className="text-xs sm:text-sm">Toutes</TabsTrigger>
            )}
          </TabsList>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-9">
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{canApprove ? "Créer une absence" : "Demander"}</span>
            <span className="sm:hidden">Demander</span>
          </Button>
        </div>

        <TabsContent value="calendar" className="mt-4 sm:mt-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between py-3 sm:py-4 px-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-sm sm:text-lg min-w-[120px] sm:min-w-[160px] text-center capitalize">
                  {format(currentMonth, "MMMM yyyy", { locale: fr })}
                </CardTitle>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="px-2 sm:px-6 pb-3 sm:pb-6">
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {["L", "M", "M", "J", "V", "S", "D"].map((day, i) => (
                  <div key={`${day}-${i}`} className="bg-muted p-1.5 sm:p-2 text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                    <span className="sm:hidden">{day}</span>
                    <span className="hidden sm:inline">{["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"][i]}</span>
                  </div>
                ))}
                {/* Offset for first day */}
                {[...Array((monthStart.getDay() + 6) % 7)].map((_, i) => (
                  <div key={`empty-${i}`} className="bg-background p-1 sm:p-2 min-h-[48px] sm:min-h-[80px]" />
                ))}
                {days.map((day) => {
                  const dayAbsences = getAbsencesForDay(day);
                  const schoolDays = getSchoolDaysForDate(day);
                  const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
                  const isWeekend = getDay(day) === 0 || getDay(day) === 6;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "bg-background p-1 sm:p-2 min-h-[48px] sm:min-h-[80px]",
                        isToday && "bg-primary/5",
                        isWeekend && "bg-muted/30"
                      )}
                    >
                      <span className={cn(
                        "text-xs sm:text-sm",
                        isToday && "font-bold text-primary",
                        isWeekend && "text-muted-foreground"
                      )}>
                        {format(day, "d")}
                      </span>
                      <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
                        {/* School days for apprentices - hidden on mobile */}
                        {schoolDays.slice(0, 2).map((sd, idx) => (
                          <div
                            key={`school-${sd.userId}-${idx}`}
                            className="hidden sm:flex text-xs p-1 rounded bg-purple-100 dark:bg-purple-900/30 truncate items-center gap-1"
                            title={`${sd.memberName} - École`}
                          >
                            <GraduationCap className="h-3 w-3 shrink-0" />
                            {sd.memberName}
                          </div>
                        ))}
                        {/* Regular absences */}
                        {dayAbsences.slice(0, 2).map((absence, idx) => {
                          const member = memberMap?.[absence.user_id];
                          return (
                            <div
                              key={absence.id}
                              className={cn(
                                "text-[10px] sm:text-xs p-0.5 sm:p-1 rounded bg-blue-100 dark:bg-blue-900/30 truncate",
                                idx > 0 && "hidden sm:block"
                              )}
                              title={member?.profile?.full_name || "—"}
                            >
                              <span className="hidden sm:inline">{member?.profile?.full_name?.split(" ")[0] || "—"}</span>
                              <span className="sm:hidden">{member?.profile?.full_name?.split(" ")[0]?.charAt(0) || "•"}</span>
                            </div>
                          );
                        })}
                        {(dayAbsences.length + schoolDays.length) > 2 && (
                          <div className="text-[10px] sm:text-xs text-muted-foreground">
                            +{dayAbsences.length + schoolDays.length - 2}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          {pendingAbsences.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="Aucune demande en attente"
              description="Les demandes d'absence à valider apparaîtront ici."
            />
          ) : (
            <div className="space-y-4">
              {pendingAbsences.map((absence) => {
                const member = memberMap?.[absence.user_id];
                const initials = member?.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?";

                return (
                  <Card key={absence.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={member?.profile?.avatar_url || undefined} />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member?.profile?.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {absenceTypeLabels[absence.absence_type]} • {format(parseISO(absence.start_date), "d MMM", { locale: fr })} - {format(parseISO(absence.end_date), "d MMM yyyy", { locale: fr })}
                            </p>
                            {absence.reason && (
                              <p className="text-sm mt-1">{absence.reason}</p>
                            )}
                          </div>
                        </div>
                        {canApprove && (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveAbsence.mutate({ id: absence.id, action: "approve" })}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Approuver
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveAbsence.mutate({ id: absence.id, action: "reject" })}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Refuser
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-6">
          {myAbsences.length === 0 ? (
            <EmptyState
              icon={CalendarOff}
              title="Aucune absence"
              description="Vos demandes d'absence apparaîtront ici."
              action={{
                label: "Demander une absence",
                onClick: () => setCreateOpen(true),
              }}
            />
          ) : (
            <div className="space-y-4">
            {myAbsences.map((absence) => (
                <Card key={absence.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{absenceTypeLabels[absence.absence_type]}</p>
                          <AbsenceStatusBadge status={absence.status} />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseISO(absence.start_date), "d MMM", { locale: fr })} - {format(parseISO(absence.end_date), "d MMM yyyy", { locale: fr })}
                        </p>
                        {absence.reason && (
                          <p className="text-sm mt-1">{absence.reason}</p>
                        )}
                        {absence.rejection_reason && (
                          <p className="text-sm mt-1 text-destructive">Motif: {absence.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Admins can edit/delete any absence, users only pending ones */}
                        {(canApprove || absence.status === "pending") && (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingAbsence(absence)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteAbsenceId(absence.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* All absences tab for admins */}
        {canApprove && (
          <TabsContent value="all" className="mt-6">
            {allAbsences.length === 0 ? (
              <EmptyState
                icon={CalendarOff}
                title="Aucune absence"
                description="Les absences de l'équipe apparaîtront ici."
              />
            ) : (
              <div className="space-y-4">
                {allAbsences.map((absence) => {
                  const member = memberMap?.[absence.user_id];
                  const initials = member?.profile?.full_name?.split(" ").map((n) => n[0]).join("") || "?";

                  return (
                    <Card key={absence.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={member?.profile?.avatar_url || undefined} />
                              <AvatarFallback>{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{member?.profile?.full_name}</p>
                                <AbsenceStatusBadge status={absence.status} />
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {absenceTypeLabels[absence.absence_type]} • {format(parseISO(absence.start_date), "d MMM", { locale: fr })} - {format(parseISO(absence.end_date), "d MMM yyyy", { locale: fr })}
                              </p>
                              {absence.reason && (
                                <p className="text-sm mt-1">{absence.reason}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {absence.status === "pending" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => approveAbsence.mutate({ id: absence.id, action: "approve" })}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Approuver
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => approveAbsence.mutate({ id: absence.id, action: "reject" })}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Refuser
                                </Button>
                              </>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingAbsence(absence)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteAbsenceId(absence.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Create Absence Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{canApprove ? "Créer une absence" : "Demander une absence"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Admin can select a member */}
            {canApprove && (
              <div className="space-y-2">
                <Label>Membre</Label>
                <Select
                  value={newAbsence.target_user_id || ""}
                  onValueChange={(v) => setNewAbsence({ ...newAbsence, target_user_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Moi-même (par défaut)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Moi-même</SelectItem>
                    {members?.filter(m => m.user_id !== user?.id).map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.profile?.full_name || member.user_id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label>Type d'absence</Label>
              <Select
                value={newAbsence.absence_type}
                onValueChange={(v) => setNewAbsence({ ...newAbsence, absence_type: v as TeamAbsence["absence_type"] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(absenceTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date de début</Label>
                <Input
                  type="date"
                  value={newAbsence.start_date}
                  onChange={(e) => setNewAbsence({ ...newAbsence, start_date: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="start_half"
                    checked={newAbsence.start_half_day}
                    onCheckedChange={(c) => setNewAbsence({ ...newAbsence, start_half_day: !!c })}
                  />
                  <Label htmlFor="start_half" className="text-sm">Demi-journée</Label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Date de fin</Label>
                <Input
                  type="date"
                  value={newAbsence.end_date}
                  onChange={(e) => setNewAbsence({ ...newAbsence, end_date: e.target.value })}
                />
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="end_half"
                    checked={newAbsence.end_half_day}
                    onCheckedChange={(c) => setNewAbsence({ ...newAbsence, end_half_day: !!c })}
                  />
                  <Label htmlFor="end_half" className="text-sm">Demi-journée</Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                value={newAbsence.reason || ""}
                onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                placeholder="Précisez le motif si nécessaire..."
              />
            </div>
            {/* Admin can auto-approve */}
            {canApprove && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="auto_approve"
                  checked={newAbsence.auto_approve}
                  onCheckedChange={(c) => setNewAbsence({ ...newAbsence, auto_approve: !!c })}
                />
                <Label htmlFor="auto_approve" className="text-sm">Approuver directement</Label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newAbsence.start_date || !newAbsence.end_date || createAbsence.isPending}
            >
              {canApprove && newAbsence.auto_approve ? "Créer et approuver" : (canApprove ? "Créer" : "Envoyer la demande")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Absence Dialog */}
      <Dialog open={!!editingAbsence} onOpenChange={(open) => !open && setEditingAbsence(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la demande</DialogTitle>
          </DialogHeader>
          {editingAbsence && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Type d'absence</Label>
                <Select
                  value={editingAbsence.absence_type}
                  onValueChange={(v) => setEditingAbsence({ ...editingAbsence, absence_type: v as TeamAbsence["absence_type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(absenceTypeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date de début</Label>
                  <Input
                    type="date"
                    value={editingAbsence.start_date}
                    onChange={(e) => setEditingAbsence({ ...editingAbsence, start_date: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_start_half"
                      checked={editingAbsence.start_half_day}
                      onCheckedChange={(c) => setEditingAbsence({ ...editingAbsence, start_half_day: !!c })}
                    />
                    <Label htmlFor="edit_start_half" className="text-sm">Demi-journée</Label>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Date de fin</Label>
                  <Input
                    type="date"
                    value={editingAbsence.end_date}
                    onChange={(e) => setEditingAbsence({ ...editingAbsence, end_date: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="edit_end_half"
                      checked={editingAbsence.end_half_day}
                      onCheckedChange={(c) => setEditingAbsence({ ...editingAbsence, end_half_day: !!c })}
                    />
                    <Label htmlFor="edit_end_half" className="text-sm">Demi-journée</Label>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motif (optionnel)</Label>
                <Textarea
                  value={editingAbsence.reason || ""}
                  onChange={(e) => setEditingAbsence({ ...editingAbsence, reason: e.target.value })}
                  placeholder="Précisez le motif si nécessaire..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAbsence(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateAbsence.isPending}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAbsenceId} onOpenChange={(open) => !open && setDeleteAbsenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette demande ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La demande d'absence sera définitivement supprimée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function AbsenceStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "En attente", className: "bg-yellow-100 text-yellow-800" },
    approved: { label: "Approuvée", className: "bg-green-100 text-green-800" },
    rejected: { label: "Refusée", className: "bg-red-100 text-red-800" },
  };

  const { label, className } = config[status] || config.pending;

  return <Badge className={className}>{label}</Badge>;
}
