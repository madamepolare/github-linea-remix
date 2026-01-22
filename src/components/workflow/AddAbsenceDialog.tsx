import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCreateAbsence, absenceTypeLabels, TeamAbsence } from "@/hooks/useTeamAbsences";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/contexts/AuthContext";
import { format, eachDayOfInterval, isWeekend, differenceInBusinessDays, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Umbrella, AlertCircle, CheckCircle } from "lucide-react";
import { TeamMember } from "@/hooks/useTeamMembers";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddAbsenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: Date | null;
  endDate?: Date | null;
  member: TeamMember | null;
}

export function AddAbsenceDialog({
  open,
  onOpenChange,
  date,
  endDate,
  member,
}: AddAbsenceDialogProps) {
  const { user } = useAuth();
  const { isAdmin, isOwner } = usePermissions();
  const createAbsence = useCreateAbsence();

  const [absenceType, setAbsenceType] = useState<TeamAbsence["absence_type"]>("conge_paye");
  const [reason, setReason] = useState("");
  // For single day: 'full' | 'morning' | 'afternoon'
  // For multi-day start: 'full' | 'afternoon' (start in afternoon)
  // For multi-day end: 'full' | 'morning' (end in morning)
  const [dayPeriod, setDayPeriod] = useState<'full' | 'morning' | 'afternoon'>('full');
  const [endDayPeriod, setEndDayPeriod] = useState<'full' | 'morning'>('full');
  const [autoApprove, setAutoApprove] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine if the user can directly create an absence (vs just request)
  const isCreatingForSelf = member?.user_id === user?.id;
  const canDirectCreate = (isAdmin || isOwner) && !isCreatingForSelf;
  const canAutoApprove = isAdmin || isOwner;

  // Calculate date range
  const dateRange = useMemo(() => {
    if (!date) return { start: null, end: null, days: 0, businessDays: 0 };
    
    const start = date;
    const end = endDate || date;
    const sortedStart = start <= end ? start : end;
    const sortedEnd = start <= end ? end : start;
    
    const days = differenceInCalendarDays(sortedEnd, sortedStart) + 1;
    const businessDays = differenceInBusinessDays(sortedEnd, sortedStart) + 1;
    
    return { start: sortedStart, end: sortedEnd, days, businessDays };
  }, [date, endDate]);

  const isMultiDay = dateRange.days > 1;

  useEffect(() => {
    if (open) {
      setAbsenceType("conge_paye");
      setReason("");
      setDayPeriod('full');
      setEndDayPeriod('full');
      setAutoApprove(canAutoApprove);
    }
  }, [open, canAutoApprove]);

  // Compute half-day flags from period selections
  const startHalfDay = isMultiDay ? dayPeriod === 'afternoon' : dayPeriod !== 'full';
  const endHalfDay = isMultiDay && endDayPeriod === 'morning';

  const handleSubmit = async () => {
    if (!dateRange.start || !dateRange.end || !member) return;

    setIsSubmitting(true);

    try {
      await createAbsence.mutateAsync({
        absence_type: absenceType,
        start_date: format(dateRange.start, "yyyy-MM-dd"),
        end_date: format(dateRange.end, "yyyy-MM-dd"),
        start_half_day: startHalfDay,
        end_half_day: endHalfDay,
        reason: reason || undefined,
        user_id: member.user_id !== user?.id ? member.user_id : undefined,
        auto_approve: canAutoApprove && autoApprove,
      });

      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const absenceTypeOptions: { value: TeamAbsence["absence_type"]; label: string }[] = [
    { value: "conge_paye", label: absenceTypeLabels.conge_paye },
    { value: "rtt", label: absenceTypeLabels.rtt },
    { value: "maladie", label: absenceTypeLabels.maladie },
    { value: "sans_solde", label: absenceTypeLabels.sans_solde },
    { value: "formation", label: absenceTypeLabels.formation },
    { value: "teletravail", label: absenceTypeLabels.teletravail },
    { value: "autre", label: absenceTypeLabels.autre },
  ];

  // Compute the effective number of days (accounting for half days)
  const effectiveDays = useMemo(() => {
    let days = dateRange.businessDays;
    
    if (isMultiDay) {
      // Multi-day: check if start is afternoon only
      if (dayPeriod === 'afternoon') days -= 0.5;
      // Multi-day: check if end is morning only
      if (endDayPeriod === 'morning') days -= 0.5;
    } else {
      // Single day
      if (dayPeriod === 'morning' || dayPeriod === 'afternoon') days = 0.5;
    }
    
    return Math.max(0.5, days);
  }, [dateRange.businessDays, dayPeriod, endDayPeriod, isMultiDay]);

  const isRequest = !canAutoApprove || !autoApprove;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Umbrella className="h-5 w-5" />
            {isRequest ? "Demande d'absence" : "Ajouter une absence"}
          </DialogTitle>
          <DialogDescription>
            {dateRange.start && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Calendar className="h-4 w-4" />
                {isMultiDay ? (
                  <>
                    <span>
                      {format(dateRange.start, "d MMM", { locale: fr })} → {format(dateRange.end, "d MMM yyyy", { locale: fr })}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      {effectiveDays} jour{effectiveDays > 1 ? "s" : ""}
                    </Badge>
                  </>
                ) : (
                  <span>
                    {format(dateRange.start, "EEEE d MMMM yyyy", { locale: fr })}
                  </span>
                )}
                {member?.profile?.full_name && (
                  <span className="text-muted-foreground">• {member.profile.full_name}</span>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info alert for request vs direct creation */}
          {isRequest && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Cette absence sera soumise pour approbation.
              </AlertDescription>
            </Alert>
          )}

          {canAutoApprove && !isCreatingForSelf && (
            <Alert className="border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              <AlertDescription className="text-emerald-800 dark:text-emerald-200">
                En tant qu'administrateur, vous pouvez créer directement une absence approuvée.
              </AlertDescription>
            </Alert>
          )}

          {/* Absence type */}
          <div className="space-y-2">
            <Label>Type d'absence</Label>
            <Select value={absenceType} onValueChange={(v) => setAbsenceType(v as TeamAbsence["absence_type"])}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {absenceTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Half-day options */}
          <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
            <Label className="text-xs text-muted-foreground uppercase tracking-wide">
              {isMultiDay ? "Période du premier jour" : "Période"}
            </Label>
            <RadioGroup
              value={dayPeriod}
              onValueChange={(v) => setDayPeriod(v as 'full' | 'morning' | 'afternoon')}
              className="flex gap-2"
            >
              <div className="flex items-center">
                <RadioGroupItem value="full" id="period-full" className="sr-only peer" />
                <Label 
                  htmlFor="period-full" 
                  className="px-3 py-1.5 rounded-md text-sm cursor-pointer border border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted transition-colors"
                >
                  Journée entière
                </Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="morning" id="period-morning" className="sr-only peer" />
                <Label 
                  htmlFor="period-morning" 
                  className="px-3 py-1.5 rounded-md text-sm cursor-pointer border border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted transition-colors"
                >
                  Matin
                </Label>
              </div>
              <div className="flex items-center">
                <RadioGroupItem value="afternoon" id="period-afternoon" className="sr-only peer" />
                <Label 
                  htmlFor="period-afternoon" 
                  className="px-3 py-1.5 rounded-md text-sm cursor-pointer border border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted transition-colors"
                >
                  Après-midi
                </Label>
              </div>
            </RadioGroup>

            {isMultiDay && (
              <>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide pt-2 block">
                  Période du dernier jour
                </Label>
                <RadioGroup
                  value={endDayPeriod}
                  onValueChange={(v) => setEndDayPeriod(v as 'full' | 'morning')}
                  className="flex gap-2"
                >
                  <div className="flex items-center">
                    <RadioGroupItem value="full" id="end-period-full" className="sr-only peer" />
                    <Label 
                      htmlFor="end-period-full" 
                      className="px-3 py-1.5 rounded-md text-sm cursor-pointer border border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted transition-colors"
                    >
                      Journée entière
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <RadioGroupItem value="morning" id="end-period-morning" className="sr-only peer" />
                    <Label 
                      htmlFor="end-period-morning" 
                      className="px-3 py-1.5 rounded-md text-sm cursor-pointer border border-transparent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary hover:bg-muted transition-colors"
                    >
                      Matin seulement
                    </Label>
                  </div>
                </RadioGroup>
              </>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label>Motif (optionnel)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Précisez le motif si nécessaire..."
              rows={2}
            />
          </div>

          {/* Auto-approve option for admins */}
          {canAutoApprove && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-approve"
                  checked={autoApprove}
                  onCheckedChange={setAutoApprove}
                />
                <Label htmlFor="auto-approve" className="text-sm cursor-pointer">
                  Approuver automatiquement
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !dateRange.start}
          >
            <Umbrella className="h-4 w-4 mr-2" />
            {isRequest ? "Envoyer la demande" : "Créer l'absence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
