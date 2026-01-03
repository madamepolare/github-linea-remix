import { useState, useRef, useEffect } from "react";
import { format, addDays, differenceInDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
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

const INTERVENTION_COLORS = [
  "#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16",
];

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
    if (!title.trim()) {
      onCancel();
      return;
    }
    onSave({
      lot_id: lotId,
      title: title.trim(),
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      color,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      onCancel();
    }
  };

  const duration = differenceInDays(endDate, startDate) + 1;

  return (
    <div
      className="absolute top-1.5 flex items-center gap-1 z-20"
      style={{ left, width: Math.max(width, 200) }}
    >
      <div
        className="h-8 rounded flex items-center px-2 gap-1 shadow-lg border border-white/30"
        style={{ backgroundColor: color, width: "100%" }}
      >
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`${duration}j - Titre...`}
          className="h-6 text-xs bg-white/20 border-0 text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-offset-0"
        />
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:bg-white/20"
          onClick={handleSave}
        >
          <Check className="w-3.5 h-3.5" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 text-white hover:bg-white/20"
          onClick={onCancel}
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
