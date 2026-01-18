import { useState } from "react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { useTeamAbsences, useCreateAbsence, absenceTypeLabels, TeamAbsence } from "@/hooks/useTeamAbsences";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarOff, Plus, Calendar } from "lucide-react";

const statusLabels: Record<string, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
};

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export function MyAbsencesTab() {
  const { user } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [newAbsence, setNewAbsence] = useState({
    absence_type: "conge_paye" as TeamAbsence["absence_type"],
    start_date: "",
    end_date: "",
    start_half_day: false,
    end_half_day: false,
    reason: "",
  });

  const { data: allAbsences, isLoading } = useTeamAbsences();
  const createAbsence = useCreateAbsence();

  const myAbsences = allAbsences?.filter(a => a.user_id === user?.id) || [];

  const handleCreate = async () => {
    if (!newAbsence.start_date || !newAbsence.end_date) return;
    await createAbsence.mutateAsync(newAbsence);
    setCreateOpen(false);
    setNewAbsence({
      absence_type: "conge_paye",
      start_date: "",
      end_date: "",
      start_half_day: false,
      end_half_day: false,
      reason: "",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Demander une absence
        </Button>
      </div>

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
        <div className="space-y-3">
          {myAbsences.map((absence) => (
            <Card key={absence.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {absenceTypeLabels[absence.absence_type]}
                      </h3>
                      <Badge className={statusColors[absence.status]}>
                        {statusLabels[absence.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {format(parseISO(absence.start_date), "d MMM", { locale: fr })}
                      {absence.start_half_day && " (après-midi)"}
                      {" → "}
                      {format(parseISO(absence.end_date), "d MMM yyyy", { locale: fr })}
                      {absence.end_half_day && " (matin)"}
                    </div>
                    {absence.reason && (
                      <p className="text-sm mt-2">{absence.reason}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Demander une absence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  <Label htmlFor="start_half" className="text-sm font-normal">
                    Après-midi seulement
                  </Label>
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
                  <Label htmlFor="end_half" className="text-sm font-normal">
                    Matin seulement
                  </Label>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Motif (optionnel)</Label>
              <Textarea
                value={newAbsence.reason}
                onChange={(e) => setNewAbsence({ ...newAbsence, reason: e.target.value })}
                placeholder="Précisez le motif si nécessaire..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newAbsence.start_date || !newAbsence.end_date || createAbsence.isPending}
            >
              Demander
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
