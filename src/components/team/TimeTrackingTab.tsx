import { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval } from "date-fns";
import { fr } from "date-fns/locale";
import { useMyTimeEntries, useCreateTimeEntry, useDeleteTimeEntry } from "@/hooks/useTeamTimeEntries";
import { useProjects } from "@/hooks/useProjects";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, Trash2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

export function TimeTrackingTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addOpen, setAddOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    project_id: "",
    description: "",
    duration_minutes: 60,
  });

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: entries, isLoading } = useMyTimeEntries(
    format(weekStart, "yyyy-MM-dd"),
    format(weekEnd, "yyyy-MM-dd")
  );
  const { projects } = useProjects();
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();

  const entriesByDate = entries?.reduce((acc, entry) => {
    if (!acc[entry.date]) acc[entry.date] = [];
    acc[entry.date].push(entry);
    return acc;
  }, {} as Record<string, typeof entries>);

  const totalMinutes = entries?.reduce((sum, e) => sum + e.duration_minutes, 0) || 0;
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = totalMinutes % 60;

  const handleAddEntry = async () => {
    if (!selectedDate || !newEntry.description) return;

    await createEntry.mutateAsync({
      date: selectedDate,
      project_id: newEntry.project_id || null,
      description: newEntry.description,
      duration_minutes: newEntry.duration_minutes,
      status: "draft",
    });

    setAddOpen(false);
    setNewEntry({ project_id: "", description: "", duration_minutes: 60 });
    setSelectedDate(null);
  };

  const handleSubmitWeek = async () => {
    // Submit all draft entries for validation
    const draftEntries = entries?.filter((e) => e.status === "draft") || [];
    for (const entry of draftEntries) {
      await (await import("@/hooks/useTeamTimeEntries")).useUpdateTimeEntry().mutateAsync({
        id: entry.id,
        status: "pending_validation",
      });
    }
  };

  const openAddDialog = (date: string) => {
    setSelectedDate(date);
    setAddOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-16 w-full" />
        <div className="grid grid-cols-7 gap-2">
          {[...Array(7)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-medium min-w-[200px] text-center">
            {format(weekStart, "d MMM", { locale: fr })} - {format(weekEnd, "d MMM yyyy", { locale: fr })}
          </span>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="font-medium">
              {totalHours}h{totalMins > 0 ? ` ${totalMins}min` : ""} cette semaine
            </span>
          </div>
          <Button onClick={handleSubmitWeek} disabled={!entries?.some((e) => e.status === "draft")}>
            <Send className="h-4 w-4 mr-2" />
            Soumettre
          </Button>
        </div>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const dayEntries = entriesByDate?.[dateStr] || [];
          const dayTotal = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
          const isToday = format(day, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");

          return (
            <div
              key={dateStr}
              className={cn(
                "border rounded-lg p-3 min-h-[180px] flex flex-col",
                isToday && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: fr })}
                  </span>
                  <p className={cn("text-lg font-semibold", isToday && "text-primary")}>
                    {format(day, "d")}
                  </p>
                </div>
                {dayTotal > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {Math.floor(dayTotal / 60)}h{dayTotal % 60 > 0 ? dayTotal % 60 : ""}
                  </Badge>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                {dayEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className={cn(
                      "p-2 rounded text-xs group relative",
                      entry.status === "draft" && "bg-muted",
                      entry.status === "pending_validation" && "bg-yellow-100 dark:bg-yellow-900/30",
                      entry.status === "validated" && "bg-green-100 dark:bg-green-900/30",
                      entry.status === "rejected" && "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    <div className="font-medium truncate">{entry.description}</div>
                    <div className="text-muted-foreground">
                      {Math.floor(entry.duration_minutes / 60)}h{entry.duration_minutes % 60 > 0 ? entry.duration_minutes % 60 : ""}
                    </div>
                    {entry.status === "draft" && (
                      <button
                        onClick={() => deleteEntry.mutate(entry.id)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full text-muted-foreground hover:text-foreground"
                onClick={() => openAddDialog(dateStr)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Ajouter
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Entry Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Ajouter du temps - {selectedDate && format(new Date(selectedDate), "EEEE d MMMM", { locale: fr })}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Projet (optionnel)</Label>
              <Select value={newEntry.project_id} onValueChange={(v) => setNewEntry({ ...newEntry, project_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="Qu'avez-vous fait ?"
              />
            </div>
            <div className="space-y-2">
              <Label>Durée (minutes)</Label>
              <Input
                type="number"
                min={15}
                step={15}
                value={newEntry.duration_minutes}
                onChange={(e) => setNewEntry({ ...newEntry, duration_minutes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">
                = {Math.floor(newEntry.duration_minutes / 60)}h{newEntry.duration_minutes % 60 > 0 ? ` ${newEntry.duration_minutes % 60}min` : ""}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddEntry} disabled={!newEntry.description || createEntry.isPending}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
