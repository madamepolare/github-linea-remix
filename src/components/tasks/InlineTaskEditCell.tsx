import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, X, Pencil, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TASK_STATUSES, TASK_PRIORITIES } from "@/lib/taskTypes";

// Text Edit Cell
interface TextEditCellProps {
  value: string;
  onSave: (value: string) => void;
  className?: string;
}

export function TextEditCell({ value, onSave, className }: TextEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setEditValue(value), [value]);
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue.trim() && editValue !== value) onSave(editValue);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" ? handleSave() : e.key === "Escape" && setIsEditing(false)}
          onBlur={handleSave}
          className="h-7 text-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={cn("group/edit flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors min-h-[28px]", className)}
      onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
    >
      <span className="font-medium truncate">{value}</span>
      <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

// Status Edit Cell
interface StatusEditCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function StatusEditCell({ value, onSave }: StatusEditCellProps) {
  const [open, setOpen] = useState(false);
  const statusConfig = TASK_STATUSES.find(s => s.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="group/edit flex items-center gap-1.5 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors min-h-[28px]"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={cn("h-2 w-2 rounded-full flex-shrink-0", statusConfig?.dotClass)} />
          <span className="text-xs truncate">{statusConfig?.label}</span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {TASK_STATUSES.filter(s => s.id !== "archived").map((status) => (
          <button
            key={status.id}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left",
              value === status.id && "bg-muted"
            )}
            onClick={() => { onSave(status.id); setOpen(false); }}
          >
            <span className={cn("h-2 w-2 rounded-full", status.dotClass)} />
            {status.label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Priority Edit Cell
interface PriorityEditCellProps {
  value: string;
  onSave: (value: string) => void;
}

export function PriorityEditCell({ value, onSave }: PriorityEditCellProps) {
  const [open, setOpen] = useState(false);
  const priorityConfig = TASK_PRIORITIES.find(p => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className="group/edit flex items-center cursor-pointer rounded hover:bg-muted/50 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <span className={cn("text-2xs px-1.5 py-0.5 rounded-md", priorityConfig?.color)}>
            {priorityConfig?.label}
          </span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity ml-1" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-36 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        {TASK_PRIORITIES.map((priority) => (
          <button
            key={priority.id}
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left",
              value === priority.id && "bg-muted"
            )}
            onClick={() => { onSave(priority.id); setOpen(false); }}
          >
            <span className={cn("text-2xs px-1.5 py-0.5 rounded-md", priority.color)}>
              {priority.label}
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// Date Edit Cell
interface DateEditCellProps {
  value: string | null;
  onSave: (value: string | null) => void;
  className?: string;
}

export function DateEditCell({ value, onSave, className }: DateEditCellProps) {
  const [open, setOpen] = useState(false);
  const date = value ? new Date(value) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div
          className={cn(
            "group/edit flex items-center gap-1 cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors min-h-[28px]",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <CalendarIcon className="h-3 w-3 flex-shrink-0" />
          <span className="text-xs">
            {date ? format(date, "d MMM", { locale: fr }) : "—"}
          </span>
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(d) => {
            onSave(d ? d.toISOString() : null);
            setOpen(false);
          }}
          locale={fr}
          initialFocus
        />
        {value && (
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-destructive hover:text-destructive"
              onClick={() => { onSave(null); setOpen(false); }}
            >
              Supprimer la date
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Assignee Edit Cell
interface AssigneeEditCellProps {
  value: string[];
  profiles: Array<{ user_id: string; full_name: string | null; avatar_url: string | null }>;
  onSave: (value: string[]) => void;
}

export function AssigneeEditCell({ value, profiles, onSave }: AssigneeEditCellProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(value);

  useEffect(() => setSelected(value), [value]);

  const getInitials = (profile: { full_name: string | null } | undefined, userId: string) => {
    if (profile?.full_name) {
      return profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    }
    return userId.slice(0, 2).toUpperCase();
  };

  const toggleUser = (userId: string) => {
    setSelected(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId) 
        : [...prev, userId]
    );
  };

  const handleSave = () => {
    if (JSON.stringify(selected) !== JSON.stringify(value)) {
      onSave(selected);
    }
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { if (!o) handleSave(); setOpen(o); }}>
      <PopoverTrigger asChild>
        <div
          className="group/edit flex items-center cursor-pointer rounded px-1 -mx-1 hover:bg-muted/50 transition-colors min-h-[28px]"
          onClick={(e) => e.stopPropagation()}
        >
          {value.length > 0 ? (
            <div className="flex -space-x-1">
              {value.slice(0, 3).map((userId) => {
                const profile = profiles.find(p => p.user_id === userId);
                return (
                  <Avatar key={userId} className="h-6 w-6 border-2 border-background">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full object-cover" />
                    ) : (
                      <AvatarFallback className="text-2xs bg-primary/10">
                        {getInitials(profile, userId)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                );
              })}
              {value.length > 3 && (
                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                  <span className="text-2xs">+{value.length - 3}</span>
                </div>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
          <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity ml-1" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1" align="start" onClick={(e) => e.stopPropagation()}>
        <div className="max-h-48 overflow-y-auto">
          {profiles.map((profile) => (
            <button
              key={profile.user_id}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded hover:bg-muted transition-colors text-left",
                selected.includes(profile.user_id) && "bg-muted"
              )}
              onClick={() => toggleUser(profile.user_id)}
            >
              <Avatar className="h-6 w-6">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || ''} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="text-2xs bg-primary/10">
                    {getInitials(profile, profile.user_id)}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="truncate">{profile.full_name || profile.user_id}</span>
              {selected.includes(profile.user_id) && <Check className="h-4 w-4 ml-auto text-primary" />}
            </button>
          ))}
          {profiles.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">Aucun membre</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
