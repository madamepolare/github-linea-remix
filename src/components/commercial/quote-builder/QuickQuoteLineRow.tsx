import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickQuoteLineRowProps {
  onAdd: (name: string) => void;
  placeholder?: string;
  className?: string;
}

export function QuickQuoteLineRow({ 
  onAdd, 
  placeholder = "Ajouter une ligne...",
  className 
}: QuickQuoteLineRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAdd(name.trim());
    setName("");
    // Keep expanded for quick consecutive adds
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsExpanded(false);
      setName("");
    }
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground",
          "hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-transparent hover:border-border",
          className
        )}
      >
        <Plus className="h-4 w-4" strokeWidth={1.25} />
        <span>{placeholder}</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex items-center gap-2 p-2 bg-muted/30 rounded-lg", className)}>
      <Input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 h-8 bg-background text-sm"
      />
      <Button 
        type="button" 
        variant="ghost" 
        size="sm" 
        className="h-8 text-xs"
        onClick={() => {
          setIsExpanded(false);
          setName("");
        }}
      >
        Annuler
      </Button>
      <Button 
        type="submit" 
        size="sm" 
        className="h-8 text-xs"
        disabled={!name.trim()}
      >
        Ajouter
      </Button>
    </form>
  );
}
