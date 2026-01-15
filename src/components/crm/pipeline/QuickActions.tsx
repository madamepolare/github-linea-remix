import { useState } from "react";
import { format, addDays, addWeeks } from "date-fns";
import { 
  Mail, 
  Phone, 
  Calendar, 
  CheckSquare, 
  CornerUpRight,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ActionType, CreateActionInput } from "@/hooks/usePipelineActions";

interface QuickActionsProps {
  entryId: string;
  contactId?: string | null;
  companyId?: string | null;
  onCreateAction: (input: CreateActionInput) => void;
  isCreating?: boolean;
}

const actionTypes: { type: ActionType; icon: React.ReactNode; label: string; color: string }[] = [
  { type: 'call', icon: <Phone className="h-3.5 w-3.5" />, label: 'Appel', color: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
  { type: 'email', icon: <Mail className="h-3.5 w-3.5" />, label: 'Email', color: 'text-purple-600 bg-purple-50 hover:bg-purple-100 border-purple-200' },
  { type: 'meeting', icon: <Calendar className="h-3.5 w-3.5" />, label: 'RDV', color: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' },
  { type: 'followup', icon: <CornerUpRight className="h-3.5 w-3.5" />, label: 'Relance', color: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200' },
  { type: 'task', icon: <CheckSquare className="h-3.5 w-3.5" />, label: 'Tâche', color: 'text-gray-600 bg-gray-50 hover:bg-gray-100 border-gray-200' },
];

const dateShortcuts = [
  { label: "Auj.", days: 0 },
  { label: "Demain", days: 1 },
  { label: "3j", days: 3 },
  { label: "1 sem.", days: 7 },
];

export function QuickActions({
  entryId,
  contactId,
  companyId,
  onCreateAction,
  isCreating,
}: QuickActionsProps) {
  const [openType, setOpenType] = useState<ActionType | null>(null);

  const handleQuickAction = (type: ActionType, days: number) => {
    const dueDate = days === 0 ? new Date() : addDays(new Date(), days);
    
    const typeLabels: Record<ActionType, string> = {
      email: 'Envoyer email',
      call: 'Appeler',
      meeting: 'Réunion',
      task: 'Tâche',
      followup: 'Relancer',
    };

    onCreateAction({
      entry_id: entryId,
      contact_id: contactId,
      company_id: companyId,
      action_type: type,
      title: typeLabels[type],
      due_date: `${format(dueDate, 'yyyy-MM-dd')}T09:00:00`,
      priority: days <= 1 ? 'high' : 'medium',
    });

    setOpenType(null);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {actionTypes.map(({ type, icon, label, color }) => (
        <Popover 
          key={type} 
          open={openType === type} 
          onOpenChange={(open) => setOpenType(open ? type : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-8 px-2.5 gap-1.5 text-xs font-medium border transition-colors",
                color
              )}
              disabled={isCreating}
            >
              {icon}
              {label}
              <ChevronRight className="h-3 w-3 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            className="w-auto p-1.5" 
            align="start"
            side="bottom"
          >
            <div className="flex gap-1">
              {dateShortcuts.map(({ label: dateLabel, days }) => (
                <Button
                  key={days}
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-accent"
                  onClick={() => handleQuickAction(type, days)}
                  disabled={isCreating}
                >
                  {dateLabel}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      ))}
    </div>
  );
}
