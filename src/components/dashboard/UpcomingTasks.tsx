import { motion } from "framer-motion";
import { Calendar, Clock, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  project: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "pending" | "in_progress" | "completed";
}

const tasks: Task[] = [
  {
    id: "1",
    title: "Submit DCE documents to MOA",
    project: "Résidence Les Ormes",
    dueDate: "Today, 5:00 PM",
    priority: "high",
    status: "in_progress",
  },
  {
    id: "2",
    title: "Review structural engineer report",
    project: "Tour Horizon",
    dueDate: "Tomorrow, 10:00 AM",
    priority: "medium",
    status: "pending",
  },
  {
    id: "3",
    title: "Site meeting - Lot Électricité",
    project: "École Primaire Vauban",
    dueDate: "Wed, 2:00 PM",
    priority: "medium",
    status: "pending",
  },
  {
    id: "4",
    title: "Prepare competition boards",
    project: "Concours Médiathèque",
    dueDate: "Thu, 6:00 PM",
    priority: "high",
    status: "pending",
  },
  {
    id: "5",
    title: "Invoice approval - Phase APS",
    project: "Centre Commercial Nova",
    dueDate: "Fri, 12:00 PM",
    priority: "low",
    status: "pending",
  },
];

const priorityClasses = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/10 text-warning",
  high: "bg-destructive/10 text-destructive",
};

const statusIcons = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
};

export function UpcomingTasks() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-foreground">
              Upcoming Tasks
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              5 tasks due this week
            </p>
          </div>
        </div>
        <button className="text-xs sm:text-sm font-medium text-primary hover:text-primary/80 transition-colors">
          View all
        </button>
      </div>
      <div className="divide-y divide-border">
        {tasks.map((task, index) => {
          const StatusIcon = statusIcons[task.status];
          const isOverdue = task.dueDate.includes("Today") && task.priority === "high";
          
          return (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + index * 0.05 }}
              className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
            >
              <button
                className={cn(
                  "flex h-5 w-5 sm:h-6 sm:w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                  task.status === "completed"
                    ? "border-success bg-success text-success-foreground"
                    : "border-border hover:border-primary group-hover:border-primary"
                )}
              >
                {task.status === "completed" && (
                  <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span
                    className={cn(
                      "font-medium text-sm sm:text-base truncate",
                      task.status === "completed"
                        ? "text-muted-foreground line-through"
                        : "text-foreground"
                    )}
                  >
                    {task.title}
                  </span>
                  {isOverdue && (
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive shrink-0" />
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {task.project}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <span
                  className={cn(
                    "rounded-full px-1.5 sm:px-2 py-0.5 text-2xs sm:text-xs font-medium capitalize hidden sm:inline-block",
                    priorityClasses[task.priority]
                  )}
                >
                  {task.priority}
                </span>
                <span
                  className={cn(
                    "text-xs sm:text-sm whitespace-nowrap",
                    isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
                  )}
                >
                  {task.dueDate}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
