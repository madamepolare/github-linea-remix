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
    >
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {actions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
            className="group flex items-center gap-2.5 whitespace-nowrap rounded-lg border border-border bg-card px-4 py-2.5 transition-all duration-150 hover:border-muted-foreground/30 hover:bg-muted/30"
          >
            <action.icon className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            <span className="text-sm font-medium text-foreground">
              {action.title}
            </span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
