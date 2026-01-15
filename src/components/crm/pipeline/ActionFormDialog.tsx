import { useState } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  CornerUpRight,
  Clock,
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
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ActionType, CreateActionInput } from "@/hooks/usePipelineActions";

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

// Quick date shortcuts
const dateShortcuts = [
  { label: "Aujourd'hui", getValue: () => format(new Date(), 'yyyy-MM-dd') },
  { label: "Demain", getValue: () => format(addDays(new Date(), 1), 'yyyy-MM-dd') },
  { label: "Dans 3j", getValue: () => format(addDays(new Date(), 3), 'yyyy-MM-dd') },
  { label: "1 sem.", getValue: () => format(addWeeks(new Date(), 1), 'yyyy-MM-dd') },
];

export function ActionFormDialog({
  open,
  onOpenChange,
  onSubmit,
  entryId,
  contactId,
  companyId,
  isLoading,
}: ActionFormDialogProps) {
  const [actionType, setActionType] = useState<ActionType>('followup');
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullDueDate = dueDate ? `${dueDate}T09:00:00` : undefined;

    onSubmit({
      entry_id: entryId,
      contact_id: contactId,
      company_id: companyId,
      action_type: actionType,
      title: title || actionTypeLabels[actionType],
      due_date: fullDueDate,
      priority: 'medium',
    });

    // Reset form
    setTitle('');
    setDueDate(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Planifier une action
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Action type toggle */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <ToggleGroup 
              type="single" 
              value={actionType} 
              onValueChange={(v) => v && setActionType(v as ActionType)}
              className="justify-start flex-wrap gap-1"
            >
              {Object.entries(actionTypeLabels).map(([type, label]) => (
                <ToggleGroupItem 
                  key={type} 
                  value={type}
                  size="sm"
                  className="gap-1.5 h-8 px-2.5"
                >
                  {actionTypeIcons[type as ActionType]}
                  <span className="text-xs">{label}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Title (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Titre (optionnel)</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={actionTypeLabels[actionType]}
              className="h-9"
            />
          </div>

          {/* Due date with shortcuts */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Échéance</Label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {dateShortcuts.map((shortcut) => (
                <Button
                  key={shortcut.label}
                  type="button"
                  variant={dueDate === shortcut.getValue() ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs px-2.5"
                  onClick={() => setDueDate(shortcut.getValue())}
                >
                  {shortcut.label}
                </Button>
              ))}
            </div>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="h-9"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" size="sm" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Planifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
