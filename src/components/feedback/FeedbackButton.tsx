import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeedbackMode } from "@/hooks/useFeedbackMode";
import { cn } from "@/lib/utils";

export function FeedbackButton() {
  const { isEnabled, toggleSidebar, isSidebarOpen } = useFeedbackMode();

  if (!isEnabled) return null;

  return (
    <Button
      onClick={toggleSidebar}
      size="icon"
      className={cn(
        "fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 text-primary-foreground",
        "transition-transform hover:scale-105",
        isSidebarOpen && "ring-2 ring-primary/50"
      )}
    >
      <PenLine className="h-5 w-5" />
    </Button>
  );
}
