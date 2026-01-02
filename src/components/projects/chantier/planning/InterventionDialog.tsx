import { useState, useEffect } from "react";
import { format, parseISO, addDays, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Plus, Trash2, Users } from "lucide-react";
import { ProjectLot } from "@/hooks/useChantier";
import { CreateInterventionInput } from "@/hooks/useInterventions";

interface InterventionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lots: ProjectLot[];
  onSave: (interventions: CreateInterventionInput[]) => void;
  preselectedLotId?: string;
  preselectedDates?: { start: Date; end: Date };
}

interface DateRange {
  id: string;
  start: Date;
  end: Date;
}

const INTERVENTION_COLORS = [
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function InterventionDialog({
  open,
  onOpenChange,
  lots,
  onSave,
  preselectedLotId,
  preselectedDates,
}: InterventionDialogProps) {
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(preselectedLotId ? [preselectedLotId] : []);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dateRanges, setDateRanges] = useState<DateRange[]>([]);
  const [color, setColor] = useState(INTERVENTION_COLORS[0]);
  const [teamSize, setTeamSize] = useState(1);
  const [notes, setNotes] = useState("");

  // Reset on open
  useEffect(() => {
    if (open) {
      setSelectedLotIds(preselectedLotId ? [preselectedLotId] : []);
      setTitle("");
      setDescription("");
      setDateRanges(
        preselectedDates
          ? [{ id: crypto.randomUUID(), start: preselectedDates.start, end: preselectedDates.end }]
          : []
      );
      setColor(INTERVENTION_COLORS[Math.floor(Math.random() * INTERVENTION_COLORS.length)]);
      setTeamSize(1);
      setNotes("");
    }
  }, [open, preselectedLotId, preselectedDates]);

  const handleAddDateRange = () => {
    const lastRange = dateRanges[dateRanges.length - 1];
    const newStart = lastRange ? addDays(lastRange.end, 1) : new Date();
    setDateRanges([
      ...dateRanges,
      { id: crypto.randomUUID(), start: newStart, end: addDays(newStart, 1) },
    ]);
  };

  const handleRemoveDateRange = (id: string) => {
    setDateRanges(dateRanges.filter((r) => r.id !== id));
  };

  const handleUpdateDateRange = (id: string, field: "start" | "end", date: Date) => {
    setDateRanges(
      dateRanges.map((r) => {
        if (r.id !== id) return r;
        if (field === "start") {
          return { ...r, start: date, end: date > r.end ? date : r.end };
        }
        return { ...r, end: date < r.start ? r.start : date };
      })
    );
  };

  const toggleLot = (lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  const handleSave = () => {
    if (!selectedLotIds.length || !title.trim() || !dateRanges.length) return;

    const interventions: CreateInterventionInput[] = [];

    // Create an intervention for each lot + date range combination
    for (const lotId of selectedLotIds) {
      for (const range of dateRanges) {
        interventions.push({
          lot_id: lotId,
          title: title.trim(),
          description: description.trim() || undefined,
          start_date: format(range.start, "yyyy-MM-dd"),
          end_date: format(range.end, "yyyy-MM-dd"),
          color,
          team_size: teamSize,
          notes: notes.trim() || undefined,
        });
      }
    }

    onSave(interventions);
    onOpenChange(false);
  };

  const isValid = selectedLotIds.length > 0 && title.trim() && dateRanges.length > 0;
  const totalInterventions = selectedLotIds.length * dateRanges.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter des interventions</DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6 py-4">
            {/* Lots selection */}
            <div className="space-y-2">
              <Label>Lots concernés *</Label>
              <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                {lots.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun lot disponible</p>
                ) : (
                  lots.map((lot) => (
                    <div
                      key={lot.id}
                      className={cn(
                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors",
                        selectedLotIds.includes(lot.id)
                          ? "bg-primary/10 border border-primary/30"
                          : "hover:bg-muted"
                      )}
                      onClick={() => toggleLot(lot.id)}
                    >
                      <Checkbox checked={selectedLotIds.includes(lot.id)} />
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: lot.color || "#94a3b8" }}
                      />
                      <span className="text-sm font-medium flex-1">{lot.name}</span>
                      {lot.company && (
                        <span className="text-xs text-muted-foreground">{lot.company.name}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
              {selectedLotIds.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedLotIds.length} lot(s) sélectionné(s)
                </p>
              )}
            </div>

            {/* Title & Description */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'intervention *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Pose des menuiseries"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Effectif</Label>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Input
                    id="team"
                    type="number"
                    min={1}
                    value={teamSize}
                    onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20"
                  />
                  <span className="text-sm text-muted-foreground">personne(s)</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détails de l'intervention..."
                rows={2}
              />
            </div>

            {/* Date ranges */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Périodes d'intervention *</Label>
                <Button variant="outline" size="sm" onClick={handleAddDateRange}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter une période
                </Button>
              </div>

              {dateRanges.length === 0 ? (
                <div className="border border-dashed rounded-lg p-6 text-center text-muted-foreground">
                  <p className="text-sm">Aucune période définie</p>
                  <Button variant="link" size="sm" onClick={handleAddDateRange}>
                    Ajouter une période
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {dateRanges.map((range, idx) => (
                    <div
                      key={range.id}
                      className="flex items-center gap-2 p-2 border rounded-lg bg-muted/30"
                    >
                      <Badge variant="secondary" className="shrink-0">
                        {idx + 1}
                      </Badge>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-36 justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(range.start, "d MMM", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={range.start}
                            onSelect={(d) => d && handleUpdateDateRange(range.id, "start", d)}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>

                      <span className="text-muted-foreground">→</span>

                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="w-36 justify-start">
                            <CalendarIcon className="w-4 h-4 mr-2" />
                            {format(range.end, "d MMM", { locale: fr })}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={range.end}
                            onSelect={(d) => d && handleUpdateDateRange(range.id, "end", d)}
                            locale={fr}
                          />
                        </PopoverContent>
                      </Popover>

                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleRemoveDateRange(range.id)}
                        className="ml-auto text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex gap-2 flex-wrap">
                {INTERVENTION_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      color === c ? "border-foreground scale-110" : "border-transparent hover:scale-105"
                    )}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes internes..."
                rows={2}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center gap-3 w-full">
            {isValid && (
              <Badge variant="secondary" className="mr-auto">
                {totalInterventions} intervention(s) seront créées
              </Badge>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={!isValid}>
              Créer les interventions
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
