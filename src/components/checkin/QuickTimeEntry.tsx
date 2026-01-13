import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Clock, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCreateTimeEntry } from "@/hooks/useTeamTimeEntries";
import { toast } from "sonner";
import { format } from "date-fns";
import { THIN_STROKE } from "@/components/ui/icon";

interface QuickTimeEntryProps {
  onEntryAdded?: () => void;
}

export function QuickTimeEntry({ onEntryAdded }: QuickTimeEntryProps) {
  const { activeWorkspace } = useAuth();
  const createTimeEntry = useCreateTimeEntry();
  
  const [entries, setEntries] = useState<Array<{
    id: string;
    projectId: string;
    hours: string;
    description: string;
  }>>([]);
  
  const [showForm, setShowForm] = useState(false);
  const [newEntry, setNewEntry] = useState({
    projectId: "",
    hours: "",
    description: "",
  });

  // Fetch projects
  const { data: projects } = useQuery({
    queryKey: ["projects-for-time", activeWorkspace?.id],
    queryFn: async () => {
      if (!activeWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id, name, color")
        .eq("workspace_id", activeWorkspace.id)
        .eq("is_archived", false)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: !!activeWorkspace?.id,
  });

  const handleAddEntry = () => {
    if (!newEntry.projectId || !newEntry.hours) {
      toast.error("Sélectionne un projet et une durée");
      return;
    }

    const hours = parseFloat(newEntry.hours);
    if (isNaN(hours) || hours <= 0) {
      toast.error("Durée invalide");
      return;
    }

    setEntries([
      ...entries,
      {
        id: crypto.randomUUID(),
        ...newEntry,
      },
    ]);

    setNewEntry({ projectId: "", hours: "", description: "" });
    setShowForm(false);
  };

  const handleRemoveEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const handleSaveAll = async () => {
    if (entries.length === 0) {
      toast.error("Ajoute au moins une entrée");
      return;
    }

    const today = format(new Date(), "yyyy-MM-dd");

    try {
      for (const entry of entries) {
        const hours = parseFloat(entry.hours);
        await createTimeEntry.mutateAsync({
          project_id: entry.projectId,
          description: entry.description || null,
          duration_minutes: Math.round(hours * 60),
          date: today,
          is_billable: true,
          status: "draft",
        });
      }

      toast.success(`${entries.length} entrée(s) enregistrée(s)`);
      setEntries([]);
      onEntryAdded?.();
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const totalHours = entries.reduce(
    (sum, e) => sum + (parseFloat(e.hours) || 0),
    0
  );

  const getProjectName = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.name || "Projet";
  };

  const getProjectColor = (projectId: string) => {
    return projects?.find((p) => p.id === projectId)?.color || "#6366f1";
  };

  return (
    <div className="space-y-4">
      {/* Entries list */}
      <AnimatePresence>
        {entries.map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: getProjectColor(entry.projectId) }}
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">
                {getProjectName(entry.projectId)}
              </p>
              {entry.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {entry.description}
                </p>
              )}
            </div>
            <div className="text-sm font-medium">{entry.hours}h</div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => handleRemoveEntry(entry.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Add entry form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3 p-4 rounded-xl border border-border bg-card"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Projet</Label>
                <Select
                  value={newEntry.projectId}
                  onValueChange={(v) =>
                    setNewEntry({ ...newEntry, projectId: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: project.color }}
                          />
                          {project.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Durée (heures)</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="12"
                  placeholder="2"
                  value={newEntry.hours}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, hours: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Description (optionnel)</Label>
              <Input
                placeholder="Ce que tu as fait..."
                value={newEntry.description}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, description: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setShowForm(false)}
              >
                Annuler
              </Button>
              <Button size="sm" className="flex-1" onClick={handleAddEntry}>
                <Check className="h-4 w-4 mr-1" />
                Ajouter
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add button */}
      {!showForm && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setShowForm(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter du temps
        </Button>
      )}

      {/* Total and save */}
      {entries.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
        >
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-green-600 dark:text-green-400" strokeWidth={THIN_STROKE} />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Total : {totalHours}h
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleSaveAll}
            disabled={createTimeEntry.isPending}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Check className="h-4 w-4 mr-1" />
            Enregistrer tout
          </Button>
        </motion.div>
      )}
    </div>
  );
}
