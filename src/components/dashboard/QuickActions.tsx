import { motion } from "framer-motion";
import {
  FolderPlus,
  FileText,
  Users,
  Receipt,
  Trophy,
  HardHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

const actions: QuickAction[] = [
  {
    id: "new-project",
    title: "New Project",
    description: "Create a new project",
    icon: FolderPlus,
    color: "text-primary",
    bgColor: "bg-primary/10 group-hover:bg-primary/20",
  },
  {
    id: "new-tender",
    title: "New Tender",
    description: "Submit competition",
    icon: Trophy,
    color: "text-accent",
    bgColor: "bg-accent/10 group-hover:bg-accent/20",
  },
  {
    id: "new-invoice",
    title: "Create Invoice",
    description: "Bill a client",
    icon: Receipt,
    color: "text-success",
    bgColor: "bg-success/10 group-hover:bg-success/20",
  },
  {
    id: "new-contact",
    title: "Add Contact",
    description: "CRM entry",
    icon: Users,
    color: "text-info",
    bgColor: "bg-info/10 group-hover:bg-info/20",
  },
  {
    id: "new-document",
    title: "Upload Document",
    description: "Add files",
    icon: FileText,
    color: "text-warning",
    bgColor: "bg-warning/10 group-hover:bg-warning/20",
  },
  {
    id: "new-site",
    title: "Site Meeting",
    description: "Schedule visit",
    icon: HardHat,
    color: "text-destructive",
    bgColor: "bg-destructive/10 group-hover:bg-destructive/20",
  },
];

export function QuickActions() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-xl border border-border bg-card p-6"
    >
      <h3 className="font-display text-lg font-semibold text-foreground mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.05 }}
            className="group flex flex-col items-center gap-2 rounded-xl border border-border p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
          >
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                action.bgColor
              )}
            >
              <action.icon className={cn("h-6 w-6", action.color)} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {action.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {action.description}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
