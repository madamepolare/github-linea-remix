import { useState } from "react";
import { format } from "date-fns";
import { 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  CornerUpRight,
  Clock,
  AlertTriangle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ActionType, ActionPriority, CreateActionInput } from "@/hooks/usePipelineActions";

interface ActionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateActionInput) => void;
  entryId: string;
  contactId?: string | null;
  companyId?: string | null;
  isLoading?: boolean;
}

const actionTypeIcons: Record<ActionType, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  meeting: <Calendar className="h-4 w-4" />,
  task: <CheckSquare className="h-4 w-4" />,
  followup: <CornerUpRight className="h-4 w-4" />,
};

const actionTypeLabels: Record<ActionType, string> = {
  email: 'Email',
  call: 'Appel',
  meeting: 'Réunion',
  task: 'Tâche',
  followup: 'Relance',
};

const priorityConfig: Record<ActionPriority, { label: string; color: string }> = {
  low: { label: 'Basse', color: 'text-muted-foreground' },
  medium: { label: 'Moyenne', color: 'text-foreground' },
  high: { label: 'Haute', color: 'text-orange-500' },
  urgent: { label: 'Urgente', color: 'text-red-500' },
};

export function ActionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  entryId,
  contactId,
  companyId,
  isLoading,
}: ActionFormDialogProps) {
  const [actionType, setActionType] = useState<ActionType>('task');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [priority, setPriority] = useState<ActionPriority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let fullDueDate: string | undefined;
    if (dueDate) {
      fullDueDate = dueTime 
        ? `${dueDate}T${dueTime}:00` 
        : `${dueDate}T09:00:00`;
    }

    onSubmit({
      entry_id: entryId,
      contact_id: contactId,
      company_id: companyId,
      action_type: actionType,
      title: title || actionTypeLabels[actionType],
      description: description || undefined,
      due_date: fullDueDate,
      priority,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDueDate('');
    setDueTime('');
    setPriority('medium');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Nouvelle action
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action type toggle */}
          <div className="space-y-2">
            <Label>Type d'action</Label>
            <ToggleGroup 
              type="single" 
              value={actionType} 
              onValueChange={(v) => v && setActionType(v as ActionType)}
              className="justify-start flex-wrap"
            >
              {Object.entries(actionTypeLabels).map(([type, label]) => (
                <ToggleGroupItem 
                  key={type} 
                  value={type}
                  className="gap-1.5"
                >
                  {actionTypeIcons[type as ActionType]}
                  <span className="hidden sm:inline">{label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Titre</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={actionTypeLabels[actionType]}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description (optionnel)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Détails de l'action..."
              rows={3}
            />
          </div>

          {/* Due date & time */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Date d'échéance</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
            <div className="space-y-2">
              <Label>Heure</Label>
              <Input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priorité</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ActionPriority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(priorityConfig).map(([key, { label, color }]) => (
                  <SelectItem key={key} value={key}>
                    <span className={color}>{label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer l\'action'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
