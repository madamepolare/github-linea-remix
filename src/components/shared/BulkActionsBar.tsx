import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface BulkAction {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: "default" | "destructive";
  showInBar?: boolean; // Show directly in bar (default: true for first 3)
  showInDropdown?: boolean; // Show in dropdown (default: true)
}

interface BulkActionsBarProps {
  selectedCount: number;
  entityLabel: { singular: string; plural: string };
  onClearSelection: () => void;
  actions: BulkAction[];
  maxVisibleActions?: number;
  className?: string;
}

export function BulkActionsBar({
  selectedCount,
  entityLabel,
  onClearSelection,
  actions,
  maxVisibleActions = 4,
  className,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  const countLabel =
    selectedCount === 1
      ? `1 ${entityLabel.singular} sélectionné`
      : `${selectedCount} ${entityLabel.plural} sélectionnés`;

  // Determine which actions to show in bar vs dropdown
  const barActions = actions
    .filter((a) => a.showInBar !== false)
    .slice(0, maxVisibleActions);
  
  const dropdownActions = actions.filter(
    (a) => a.showInDropdown !== false && !barActions.includes(a)
  );

  const hasDropdownActions = dropdownActions.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
          "flex items-center gap-2 px-4 py-2.5 rounded-xl",
          "bg-foreground text-background shadow-2xl",
          "border border-foreground/10",
          className
        )}
      >
        {/* Count & close */}
        <div className="flex items-center gap-3 pr-3 border-r border-background/20">
          <span className="text-sm font-medium whitespace-nowrap">
            {countLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 hover:bg-background/20 text-background"
            onClick={onClearSelection}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Primary actions */}
        <div className="flex items-center gap-1">
          {barActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 gap-1.5 hover:bg-background/20",
                  action.variant === "destructive"
                    ? "text-red-300 hover:text-red-200"
                    : "text-background hover:text-background"
                )}
                onClick={action.onClick}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{action.label}</span>
              </Button>
            );
          })}

          {/* More actions dropdown */}
          {hasDropdownActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-background hover:bg-background/20 hover:text-background"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {dropdownActions.map((action, index) => {
                  const Icon = action.icon;
                  const isDestructive = action.variant === "destructive";
                  const showSeparator =
                    isDestructive &&
                    index > 0 &&
                    dropdownActions[index - 1]?.variant !== "destructive";

                  return (
                    <div key={action.id}>
                      {showSeparator && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        onClick={action.onClick}
                        className={cn(
                          isDestructive &&
                            "text-destructive focus:text-destructive"
                        )}
                      >
                        <Icon className="h-4 w-4 mr-2" />
                        {action.label}
                      </DropdownMenuItem>
                    </div>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
