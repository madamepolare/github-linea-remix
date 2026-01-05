import { useState, useRef, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Calendar } from "lucide-react";
import { CreateInterventionInput } from "@/hooks/useInterventions";

interface InlineInterventionCreatorProps {
  lotId: string;
  startDate: Date;
  endDate: Date;
  left: number;
  width: number;
  color: string;
  onSave: (intervention: CreateInterventionInput) => void;
  onCancel: () => void;
}

export function InlineInterventionCreator({
  lotId,
  startDate,
  endDate,
  left,
  width,
  color,
  onSave,
  onCancel,
}: InlineInterventionCreatorProps) {
  const [title, setTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSave = () => {
    const finalTitle = title.trim() || `Intervention ${format(startDate, "d MMM", { locale: fr })}`;
    onSave({
      lot_id: lotId,
      title: finalTitle,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      color,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <div
      className="absolute top-1.5 flex items-center gap-0.5 z-20 animate-in fade-in zoom-in-95 duration-150"
      style={{ left, width: Math.max(width, 180) }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main intervention bar */}
      <div
        className="flex-1 h-8 rounded-md shadow-lg ring-2 ring-primary/50 ring-offset-1 ring-offset-background flex items-center gap-1 px-1.5 overflow-hidden"
        style={{ backgroundColor: color }}
      >
        {/* Date badge */}
        <div className="flex items-center gap-1 text-[10px] text-white/90 font-medium shrink-0 bg-black/20 rounded px-1 py-0.5">
          <Calendar className="w-3 h-3" />
          {format(startDate, "d/MM")}
          <span className="opacity-60">→</span>
          {format(endDate, "d/MM")}
        </div>

        {/* Title input */}
        <Input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nom... (Entrée = créer)"
          className="flex-1 h-6 min-w-0 text-xs bg-white/95 border-0 text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-0 rounded px-1.5"
        />
      </div>

      {/* Quick actions */}
      <div className="flex gap-0.5 shrink-0">
        <Button
          variant="default"
          size="icon"
          className="h-7 w-7 rounded-md shadow-md"
          onClick={handleSave}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="h-7 w-7 rounded-md shadow-md"
          onClick={onCancel}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
