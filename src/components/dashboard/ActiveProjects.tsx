import { motion } from "framer-motion";
import { ArrowRight, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  client: string;
  phase: string;
  phaseColor: string;
  progress: number;
  dueDate: string;
  team: { initials: string; color: string }[];
  thumbnail?: string;
}

const projects: Project[] = [
  {
    id: "1",
    name: "Résidence Les Ormes",
    client: "Nexity",
    phase: "APD",
    phaseColor: "bg-warning",
    progress: 65,
    dueDate: "Mar 15",
    team: [
      { initials: "JD", color: "bg-primary" },
      { initials: "ML", color: "bg-accent" },
      { initials: "PM", color: "bg-success" },
    ],
  },
  {
    id: "2",
    name: "Tour Horizon",
    client: "Bouygues Immobilier",
    phase: "PRO",
    phaseColor: "bg-success",
    progress: 42,
    dueDate: "Apr 22",
    team: [
      { initials: "SB", color: "bg-info" },
      { initials: "JD", color: "bg-primary" },
    ],
  },
  {
    id: "3",
    name: "École Primaire Vauban",
    client: "Mairie de Paris",
    phase: "DET",
    phaseColor: "bg-accent",
    progress: 78,
    dueDate: "Feb 28",
    team: [
      { initials: "ML", color: "bg-accent" },
      { initials: "TP", color: "bg-destructive" },
      { initials: "PM", color: "bg-success" },
      { initials: "SB", color: "bg-info" },
    ],
  },
];

export function ActiveProjects() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.6 }}
      className="rounded-xl border border-border bg-card"
    >
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Building2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Active Projects
            </h3>
            <p className="text-sm text-muted-foreground">
              Your top priority projects
            </p>
          </div>
        </div>
        <button className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors group">
          View all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      <div className="divide-y divide-border">
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.7 + index * 0.05 }}
            className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors cursor-pointer group"
          >
            {/* Project thumbnail placeholder */}
            <div className="h-16 w-24 shrink-0 rounded-lg bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
              <Building2 className="h-8 w-8 text-muted-foreground/40" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                  {project.name}
                </h4>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold text-foreground",
                    project.phaseColor
                  )}
                >
                  {project.phase}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {project.client}
              </p>
              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${project.progress}%` }}
                    transition={{ duration: 0.8, delay: 0.8 + index * 0.1 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                  {project.progress}%
                </span>
              </div>
            </div>

            {/* Team */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {project.team.slice(0, 3).map((member, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-8 w-8 rounded-full border-2 border-card flex items-center justify-center text-xs font-semibold text-primary-foreground",
                      member.color
                    )}
                  >
                    {member.initials}
                  </div>
                ))}
                {project.team.length > 3 && (
                  <div className="h-8 w-8 rounded-full border-2 border-card bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                    +{project.team.length - 3}
                  </div>
                )}
              </div>
              <span className="text-sm text-muted-foreground ml-2">
                Due {project.dueDate}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
