import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Plus } from "lucide-react";
import { getWidgetsByModule, WIDGET_REGISTRY } from "./registry";
import { MODULE_LABELS, MODULE_COLORS, WidgetModule, WidgetConfig } from "./types";
import { cn } from "@/lib/utils";

interface WidgetPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (widgetId: string) => void;
  activeWidgets: string[];
}

export function WidgetPicker({
  open,
  onClose,
  onSelect,
  activeWidgets,
}: WidgetPickerProps) {
  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState<WidgetModule | "all">("all");

  const widgetsByModule = getWidgetsByModule();

  const filteredWidgets = WIDGET_REGISTRY.filter((widget) => {
    const matchesSearch =
      widget.title.toLowerCase().includes(search.toLowerCase()) ||
      widget.module.toLowerCase().includes(search.toLowerCase());
    const matchesModule = selectedModule === "all" || widget.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  const modules = Object.keys(MODULE_LABELS) as WidgetModule[];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Ajouter un widget</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un widget..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Module Filter */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={selectedModule === "all" ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedModule("all")}
          >
            Tous
          </Badge>
          {modules.map((module) => (
            <Badge
              key={module}
              variant={selectedModule === module ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedModule(module)}
            >
              {MODULE_LABELS[module]}
            </Badge>
          ))}
        </div>

        {/* Widget List */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="grid grid-cols-2 gap-3 pb-4">
            {filteredWidgets.map((widget) => {
              const isActive = activeWidgets.includes(widget.id);
              return (
                <div
                  key={widget.id}
                  className={cn(
                    "p-4 rounded-lg border transition-all cursor-pointer",
                    isActive
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => !isActive && onSelect(widget.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        MODULE_COLORS[widget.module]
                      )}
                    >
                      <widget.icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium truncate">
                          {widget.title}
                        </h4>
                        {isActive && (
                          <Check className="h-4 w-4 text-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {MODULE_LABELS[widget.module]}
                      </p>
                    </div>
                    {!isActive && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filteredWidgets.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>Aucun widget trouvé</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
