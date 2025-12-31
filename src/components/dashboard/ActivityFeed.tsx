import { motion } from "framer-motion";
import { 
  FileText, 
  MessageSquare, 
  CheckCircle2, 
  UserPlus, 
  FolderPlus,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "document" | "comment" | "task" | "member" | "project";
  title: string;
  description: string;
  user: {
    name: string;
    avatar?: string;
    initials: string;
  };
  timestamp: string;
  project?: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "document",
    title: "DCE uploaded",
    description: "Added Phase APD documents for",
    user: { name: "Marie Laurent", initials: "ML" },
    timestamp: "10 min ago",
    project: "Résidence Les Ormes",
  },
  {
    id: "2",
    type: "task",
    title: "Task completed",
    description: "Marked as done: Review structural plans",
    user: { name: "Pierre Martin", initials: "PM" },
    timestamp: "25 min ago",
    project: "Tour Horizon",
  },
  {
    id: "3",
    type: "comment",
    title: "New comment",
    description: "Left feedback on site observation #42",
    user: { name: "Sophie Blanc", initials: "SB" },
    timestamp: "1h ago",
    project: "École Primaire Vauban",
  },
  {
    id: "4",
    type: "member",
    title: "Team member added",
    description: "Added Thomas Petit to project team",
    user: { name: "Jean Dupont", initials: "JD" },
    timestamp: "2h ago",
    project: "Centre Commercial Nova",
  },
  {
    id: "5",
    type: "project",
    title: "New project created",
    description: "Started new competition entry",
    user: { name: "Marie Laurent", initials: "ML" },
    timestamp: "3h ago",
    project: "Concours Médiathèque",
  },
];

const iconMap = {
  document: FileText,
  comment: MessageSquare,
  task: CheckCircle2,
  member: UserPlus,
  project: FolderPlus,
};

const iconColorMap = {
  document: "bg-info/10 text-info",
  comment: "bg-warning/10 text-warning",
  task: "bg-success/10 text-success",
  member: "bg-accent/10 text-accent",
  project: "bg-primary/10 text-primary",
};

export function ActivityFeed() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <h3 className="font-display text-lg font-semibold text-foreground">
          Recent Activity
        </h3>
        <button className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>
      <div className="divide-y divide-border">
        {activities.map((activity, index) => {
          const Icon = iconMap[activity.type];
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.05 }}
              className="flex items-start gap-4 px-6 py-4 hover:bg-muted/30 transition-colors"
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  iconColorMap[activity.type]
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {activity.user.name}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.timestamp}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {activity.description}{" "}
                  {activity.project && (
                    <span className="font-medium text-foreground">
                      {activity.project}
                    </span>
                  )}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
