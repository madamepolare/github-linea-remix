import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommandTriggerProps {
  onClick?: () => void;
}

export function CommandTrigger({ onClick }: CommandTriggerProps) {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Trigger the command palette via keyboard shortcut simulation
      const event = new KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      });
      document.dispatchEvent(event);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className="h-8 w-full justify-start gap-2 text-xs text-muted-foreground hover:text-foreground px-2"
    >
      <Search className="h-3.5 w-3.5" strokeWidth={1.25} />
      <span className="flex-1 text-left">Rechercher...</span>
      <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
        <span className="text-xs">⌘</span>K
      </kbd>
    </Button>
  );
}
