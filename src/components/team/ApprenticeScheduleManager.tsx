import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  GraduationCap, 
  Calendar, 
  Upload, 
  FileText, 
  Plus, 
  Trash2, 
  RefreshCw,
  Building2,
  School
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { 
  useApprenticeSchedules, 
  useCreateApprenticeSchedule,
  useDeleteApprenticeSchedule,
  useGenerateAbsencesFromSchedule,
  ApprenticeSchedule 
} from "@/hooks/useApprenticeSchedules";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { cn } from "@/lib/utils";

interface ApprenticeScheduleManagerProps {
  userId?: string;
  compact?: boolean;
}

export function ApprenticeScheduleManager({ userId, compact = false }: ApprenticeScheduleManagerProps) {
  const { data: schedules, isLoading } = useApprenticeSchedules(userId);
  const { data: members } = useTeamMembers();
  const createSchedule = useCreateApprenticeSchedule();
  const deleteSchedule = useDeleteApprenticeSchedule();
  const generateAbsences = useGenerateAbsencesFromSchedule();
  
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    user_id: userId || '',
    schedule_name: 'Planning alternance 2026',
    start_date: '',
    end_date: '',
    pattern_type: 'weekly' as const,
    company_days_per_week: 3,
    school_days_per_week: 2,
  });
  
  const handleCreate = async () => {
    await createSchedule.mutateAsync(newSchedule);
    setShowCreateDialog(false);
    setNewSchedule({
      user_id: userId || '',
      schedule_name: 'Planning alternance 2026',
      start_date: '',
      end_date: '',
      pattern_type: 'weekly',
      company_days_per_week: 3,
      school_days_per_week: 2,
    });
  };
  
  const handleGenerateAbsences = async (schedule: ApprenticeSchedule) => {
    await generateAbsences.mutateAsync(schedule);
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Planning alternance</span>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Ajouter
              </Button>
            </DialogTrigger>
            <DialogContent>
              <CreateScheduleForm
                value={newSchedule}
                onChange={setNewSchedule}
                members={members}
                showUserSelect={!userId}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Création..." : "Créer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        {schedules?.map((schedule) => (
          <ScheduleCard 
            key={schedule.id} 
            schedule={schedule} 
            compact
            onGenerateAbsences={() => handleGenerateAbsences(schedule)}
            onDelete={() => deleteSchedule.mutate(schedule.id)}
          />
        ))}
        
        {!isLoading && (!schedules || schedules.length === 0) && (
          <p className="text-xs text-muted-foreground">Aucun planning configuré</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Gestion des alternants
            </CardTitle>
            <CardDescription>
              Planifiez les absences école/entreprise pour les alternants
            </CardDescription>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau planning
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer un planning alternance</DialogTitle>
                <DialogDescription>
                  Configurez le rythme école/entreprise pour générer automatiquement les absences
                </DialogDescription>
              </DialogHeader>
              <CreateScheduleForm
                value={newSchedule}
                onChange={setNewSchedule}
                members={members}
                showUserSelect={!userId}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Création..." : "Créer le planning"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Chargement...</div>
        ) : schedules?.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GraduationCap className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucun planning d'alternance configuré</p>
            <p className="text-sm mt-1">Créez un planning pour générer automatiquement les absences</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {schedules?.map((schedule) => (
              <ScheduleCard 
                key={schedule.id} 
                schedule={schedule}
                onGenerateAbsences={() => handleGenerateAbsences(schedule)}
                onDelete={() => deleteSchedule.mutate(schedule.id)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ScheduleCardProps {
  schedule: ApprenticeSchedule;
  compact?: boolean;
  onGenerateAbsences: () => void;
  onDelete: () => void;
}

function ScheduleCard({ schedule, compact, onGenerateAbsences, onDelete }: ScheduleCardProps) {
  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border bg-card",
      compact && "p-2"
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex items-center justify-center rounded-lg bg-primary/10",
          compact ? "h-8 w-8" : "h-10 w-10"
        )}>
          <GraduationCap className={cn("text-primary", compact ? "h-4 w-4" : "h-5 w-5")} />
        </div>
        <div>
          <p className={cn("font-medium", compact && "text-sm")}>{schedule.schedule_name}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>
              {format(new Date(schedule.start_date), "d MMM yyyy", { locale: fr })} - {format(new Date(schedule.end_date), "d MMM yyyy", { locale: fr })}
            </span>
            <Badge variant="secondary" className="text-[10px]">
              <Building2 className="h-2.5 w-2.5 mr-1" />
              {schedule.company_days_per_week}j
            </Badge>
            <Badge variant="outline" className="text-[10px]">
              <School className="h-2.5 w-2.5 mr-1" />
              {schedule.school_days_per_week}j
            </Badge>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size={compact ? "icon" : "sm"}
          onClick={onGenerateAbsences}
          title="Générer les absences"
        >
          <RefreshCw className="h-4 w-4" />
          {!compact && <span className="ml-1">Générer</span>}
        </Button>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onDelete}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

interface CreateScheduleFormProps {
  value: any;
  onChange: (v: any) => void;
  members: any;
  showUserSelect: boolean;
}

function CreateScheduleForm({ value, onChange, members, showUserSelect }: CreateScheduleFormProps) {
  return (
    <div className="space-y-4 py-4">
      {showUserSelect && (
        <div className="space-y-2">
          <Label>Alternant</Label>
          <Select
            value={value.user_id}
            onValueChange={(v) => onChange({ ...value, user_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner un membre..." />
            </SelectTrigger>
            <SelectContent>
              {members?.map((member: any) => (
                <SelectItem key={member.user_id} value={member.user_id}>
                  {member.profile?.full_name || member.user_id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      
      <div className="space-y-2">
        <Label>Nom du planning</Label>
        <Input
          value={value.schedule_name}
          onChange={(e) => onChange({ ...value, schedule_name: e.target.value })}
          placeholder="Ex: Alternance 2025-2026"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début</Label>
          <Input
            type="date"
            value={value.start_date}
            onChange={(e) => onChange({ ...value, start_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Date de fin</Label>
          <Input
            type="date"
            value={value.end_date}
            onChange={(e) => onChange({ ...value, end_date: e.target.value })}
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label>Type de rythme</Label>
        <Select
          value={value.pattern_type}
          onValueChange={(v) => onChange({ ...value, pattern_type: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Hebdomadaire</SelectItem>
            <SelectItem value="biweekly">Bi-hebdomadaire</SelectItem>
            <SelectItem value="monthly">Mensuel</SelectItem>
            <SelectItem value="custom">Personnalisé (PDF)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {value.pattern_type !== 'custom' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5" />
              Jours entreprise
            </Label>
            <Input
              type="number"
              min={0}
              max={5}
              value={value.company_days_per_week}
              onChange={(e) => onChange({ ...value, company_days_per_week: parseInt(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <School className="h-3.5 w-3.5" />
              Jours école
            </Label>
            <Input
              type="number"
              min={0}
              max={5}
              value={value.school_days_per_week}
              onChange={(e) => onChange({ ...value, school_days_per_week: parseInt(e.target.value) })}
            />
          </div>
        </div>
      )}
      
      {value.pattern_type === 'custom' && (
        <div className="space-y-2">
          <Label>Importer le planning PDF</Label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Glissez le PDF ou cliquez pour télécharger
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Le planning sera analysé automatiquement
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
