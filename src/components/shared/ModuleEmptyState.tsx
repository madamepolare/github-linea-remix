import { motion } from "framer-motion";
import { LucideIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ModuleEmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function ModuleEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: ModuleEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={className}
    >
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 px-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2 text-center">{title}</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            {description}
          </p>
          {actionLabel && onAction && (
            <Button onClick={onAction}>
              <Plus className="h-4 w-4 mr-2" />
              {actionLabel}
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
