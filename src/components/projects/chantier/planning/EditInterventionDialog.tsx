import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Intervention } from "@/hooks/useInterventions";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface EditInterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intervention: Intervention | null;
  onSave: (updates: Partial<Intervention>) => void;
}

const INTERVENTION_STATUS = [
  { value: "planned", label: "Planifié", color: "#94a3b8" },
  { value: "in_progress", label: "En cours", color: "#3b82f6" },
  { value: "completed", label: "Terminé", color: "#22c55e" },
  { value: "delayed", label: "En retard", color: "#ef4444" },
  { value: "cancelled", label: "Annulé", color: "#6b7280" },
];

const COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
];

export function EditInterventionDialog({
  open,
  onOpenChange,
  intervention,
  onSave,
}: EditInterventionDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string>("planned");
  const [color, setColor] = useState("#3b82f6");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [teamSize, setTeamSize] = useState(1);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (intervention && open) {
      setTitle(intervention.title);
      setDescription(intervention.description || "");
      setStatus(intervention.status);
      setColor(intervention.color || "#3b82f6");
      setStartDate(parseISO(intervention.start_date));
      setEndDate(parseISO(intervention.end_date));
      setTeamSize(intervention.team_size);
      setNotes(intervention.notes || "");
    }
  }, [intervention, open]);

  const handleSave = () => {
    if (!intervention || !startDate || !endDate) return;

    onSave({
      id: intervention.id,
      title,
      description: description || null,
      status: status as any,
      color,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      team_size: teamSize,
      notes: notes || null,
    });
    onOpenChange(false);
  };

  if (!intervention) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Modifier l'intervention</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nom de l'intervention"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date de début</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "d MMM yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} locale={fr} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Date de fin</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "d MMM yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} locale={fr} />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVENTION_STATUS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                        {s.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Effectif</Label>
              <Input
                type="number"
                min={1}
                value={teamSize}
                onChange={(e) => setTeamSize(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Couleur</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-all",
                    color === c ? "border-foreground scale-110" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes internes"
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={!title.trim() || !startDate || !endDate}>
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
