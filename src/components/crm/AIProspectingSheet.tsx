import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Sparkles } from "lucide-react";
import { AIProspectingPanel } from "./AIProspectingPanel";

interface AIProspectingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AIProspectingSheet({ open, onOpenChange }: AIProspectingSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            Prospection IA
          </SheetTitle>
        </SheetHeader>
        <div className="mt-2">
          <AIProspectingPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}
