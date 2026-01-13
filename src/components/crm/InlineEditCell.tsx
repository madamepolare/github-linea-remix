import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditCellProps {
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  type?: "text" | "email" | "tel" | "url";
}

export function InlineEditCell({
  value,
  onSave,
  placeholder = "—",
  className,
  inputClassName,
  disabled = false,
  type = "text",
}: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editValue !== value) {
      onSave(editValue);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div 
        className="flex items-center gap-1 -mx-1" 
        onClick={(e) => e.stopPropagation()}
      >
        <Input
          ref={inputRef}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={cn(
            "h-7 text-xs px-2 py-1 min-w-[100px]",
            inputClassName
          )}
        />
        <button
          type="button"
          className="p-1 rounded hover:bg-primary/10 text-primary transition-colors"
          onClick={handleSave}
        >
          <Check className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="p-1 rounded hover:bg-muted text-muted-foreground transition-colors"
          onClick={handleCancel}
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group/edit relative flex items-center cursor-pointer",
        "rounded px-1.5 py-0.5 -mx-1.5 -my-0.5",
        "transition-all duration-150",
        !disabled && "hover:bg-muted/60",
        disabled && "cursor-default",
        className
      )}
      onClick={(e) => {
        if (!disabled) {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className={cn(
          "text-xs truncate",
          !value && "text-muted-foreground/60 italic"
        )}
      >
        {value || placeholder}
      </span>
      {!disabled && isHovered && (
        <div className="absolute inset-0 border border-dashed border-muted-foreground/30 rounded pointer-events-none" />
      )}
    </div>
  );
}
