import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InlineDatePicker } from "@/components/tasks/InlineDatePicker";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Plus, Clock, User, Briefcase, Building2 } from "lucide-react";
import { ExternalTask } from "./types";
import { Task } from "@/hooks/useTasks";

interface TasksSectionProps {
  internalTasks: Task[];
  externalTasks: ExternalTask[];
  onCreateInternalTask: (task: {
    title: string;
    description?: string;
    due_date?: string;
  }) => void;
  onCreateExternalTask: (task: Omit<ExternalTask, "id">) => void;
  onToggleExternalTask: (id: string, completed: boolean) => void;
  onUpdateExternalTaskComment: (id: string, comment: string) => void;
  onToggleInternalTask: (id: string, completed: boolean) => void;
  attendeeNames: { name: string; type: string }[];
}

export function TasksSection({
  internalTasks,
  externalTasks,
  onCreateInternalTask,
  onCreateExternalTask,
  onToggleExternalTask,
  onUpdateExternalTaskComment,
  onToggleInternalTask,
  attendeeNames,
}: TasksSectionProps) {
  const [activeTab, setActiveTab] = useState<"internal" | "external">("internal");
  const [isAddInternalOpen, setIsAddInternalOpen] = useState(false);
  const [isAddExternalOpen, setIsAddExternalOpen] = useState(false);

  // Internal task form
  const [internalTitle, setInternalTitle] = useState("");
  const [internalDescription, setInternalDescription] = useState("");
  const [internalDueDate, setInternalDueDate] = useState<Date | null>(null);

  // External task form
  const [externalTitle, setExternalTitle] = useState("");
  const [externalAssignee, setExternalAssignee] = useState("");
  const [externalType, setExternalType] = useState<"bet" | "entreprise" | "moa" | "other">("entreprise");
  const [externalDueDate, setExternalDueDate] = useState<Date | null>(null);

  const handleAddInternal = () => {
    if (!internalTitle.trim()) return;
    onCreateInternalTask({
      title: internalTitle.trim(),
      description: internalDescription.trim() || undefined,
      due_date: internalDueDate ? format(internalDueDate, "yyyy-MM-dd") : undefined,
    });
    setInternalTitle("");
    setInternalDescription("");
    setInternalDueDate(null);
    setIsAddInternalOpen(false);
  };

  const handleAddExternal = () => {
    if (!externalTitle.trim() || !externalAssignee.trim()) return;
    onCreateExternalTask({
      title: externalTitle.trim(),
      assignee_name: externalAssignee.trim(),
      assignee_type: externalType,
      due_date: externalDueDate ? format(externalDueDate, "yyyy-MM-dd") : null,
      completed: false,
    });
    setExternalTitle("");
    setExternalAssignee("");
    setExternalType("entreprise");
    setExternalDueDate(null);
    setIsAddExternalOpen(false);
  };

  const typeConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    bet: { label: "BET", icon: <Briefcase className="h-3 w-3" />, color: "bg-purple-500" },
    entreprise: { label: "Entreprise", icon: <Building2 className="h-3 w-3" />, color: "bg-orange-500" },
    moa: { label: "MOA", icon: <User className="h-3 w-3" />, color: "bg-blue-500" },
    other: { label: "Autre", icon: <User className="h-3 w-3" />, color: "bg-gray-500" },
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "internal" | "external")}>
        <div className="flex items-center justify-between">
          <TabsList className="h-8">
            <TabsTrigger value="internal" className="text-xs px-3">
              Tâches internes
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {internalTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="external" className="text-xs px-3">
              Tâches externes
              <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">
                {externalTasks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => activeTab === "internal" ? setIsAddInternalOpen(true) : setIsAddExternalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            Ajouter
          </Button>
        </div>

        <TabsContent value="internal" className="mt-3">
          {internalTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tâches pour l'équipe d'architecture - liées au projet
            </p>
          ) : (
            <div className="space-y-2">
              {internalTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={task.status === "done"}
                    onCheckedChange={(checked) => onToggleInternalTask(task.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm",
                      task.status === "done" && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    )}
                  </div>
                  {task.due_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="external" className="mt-3">
          {externalTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Tâches pour BET, entreprises, MOA - affichées dans le CR
            </p>
          ) : (
            <div className="space-y-2">
              {externalTasks.map((task) => {
                const typeInfo = typeConfig[task.assignee_type] || typeConfig.other;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={(checked) => onToggleExternalTask(task.id, !!checked)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className={cn(
                        "text-sm",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className={`text-xs text-white ${typeInfo.color} gap-1`}>
                          {typeInfo.icon}
                          {task.assignee_name}
                        </Badge>
                        {task.due_date && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(task.due_date), "d MMM", { locale: fr })}
                          </span>
                        )}
                      </div>
                      <Input
                        placeholder="Ajouter un commentaire..."
                        value={task.comment || ""}
                        onChange={(e) => onUpdateExternalTaskComment(task.id, e.target.value)}
                        className="h-7 text-xs mt-1"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Internal Task Dialog */}
      <Dialog open={isAddInternalOpen} onOpenChange={setIsAddInternalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche interne</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Cette tâche sera automatiquement rattachée au projet.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Titre *</Label>
              <Input
                value={internalTitle}
                onChange={(e) => setInternalTitle(e.target.value)}
                placeholder="Titre de la tâche..."
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={internalDescription}
                onChange={(e) => setInternalDescription(e.target.value)}
                placeholder="Description..."
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Échéance</Label>
              <InlineDatePicker
                value={internalDueDate}
                onChange={setInternalDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddInternalOpen(false)}>Annuler</Button>
            <Button onClick={handleAddInternal} disabled={!internalTitle.trim()}>Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add External Task Dialog */}
      <Dialog open={isAddExternalOpen} onOpenChange={setIsAddExternalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle tâche externe</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2">
            Cette tâche apparaîtra dans le compte rendu pour le destinataire.
          </p>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Tâche à effectuer *</Label>
              <Input
                value={externalTitle}
                onChange={(e) => setExternalTitle(e.target.value)}
                placeholder="Décrire l'action attendue..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Attribué à *</Label>
                <Input
                  value={externalAssignee}
                  onChange={(e) => setExternalAssignee(e.target.value)}
                  placeholder="Nom ou entreprise..."
                  list="attendee-suggestions"
                />
                <datalist id="attendee-suggestions">
                  {attendeeNames.map((a, i) => (
                    <option key={i} value={a.name} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={externalType} onValueChange={(v) => setExternalType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bet">BET</SelectItem>
                    <SelectItem value="entreprise">Entreprise</SelectItem>
                    <SelectItem value="moa">MOA</SelectItem>
                    <SelectItem value="other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Échéance</Label>
              <InlineDatePicker
                value={externalDueDate}
                onChange={setExternalDueDate}
                placeholder="Sélectionner..."
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddExternalOpen(false)}>Annuler</Button>
            <Button onClick={handleAddExternal} disabled={!externalTitle.trim() || !externalAssignee.trim()}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
