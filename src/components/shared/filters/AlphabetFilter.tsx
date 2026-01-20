import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface AlphabetFilterProps {
  value: string | null;
  onChange: (value: string | null) => void;
  availableLetters: string[];
  isLoading?: boolean;
  className?: string;
}

export function AlphabetFilter({ 
  value, 
  onChange, 
  availableLetters, 
  isLoading,
  className 
}: AlphabetFilterProps) {
  return (
    <div className={cn("flex items-center gap-0.5 overflow-x-auto scrollbar-none", className)}>
      {ALPHABET.map((letter) => {
        const hasItems = availableLetters.includes(letter);
        return (
          <Button
            key={letter}
            variant={value === letter ? "default" : "ghost"}
            size="sm"
            className={cn(
              "h-6 w-6 p-0 text-[10px] font-medium shrink-0",
              !hasItems && "text-muted-foreground/30"
            )}
            onClick={() => onChange(value === letter ? null : letter)}
            disabled={!hasItems}
          >
            {letter}
          </Button>
        );
      })}
      {isLoading && (
        <div className="ml-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      )}
    </div>
  );
}
