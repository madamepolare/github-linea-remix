import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTasks } from "@/hooks/useTasks";
import { useMyTimeEntries } from "@/hooks/useTeamTimeEntries";
import { useTeamRequests } from "@/hooks/useTeamRequests";
import { useTeamAbsences } from "@/hooks/useTeamAbsences";
import { useMyProjects } from "@/hooks/useMyProjects";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { CheckSquare, FolderKanban, Clock, CalendarOff, MessagesSquare, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ProfileOverview() {
  const { user } = useAuth();
  
  const { data: projects, isLoading: loadingProjects } = useMyProjects();
  const { tasks: allTasks, isLoading: loadingTasks } = useTasks({ assignedTo: user?.id });
  const { data: absences } = useTeamAbsences();
  const { data: requests } = useTeamRequests({ userId: user?.id });
  
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const { data: timeEntries, isLoading: loadingTime } = useMyTimeEntries(
    format(weekStart, "yyyy-MM-dd"),
    format(weekEnd, "yyyy-MM-dd")
  );

  const myAbsences = absences?.filter(a => a.user_id === user?.id) || [];
  const pendingRequests = requests?.filter(r => r.status === "pending") || [];
  const activeTasks = allTasks?.filter(t => t.status !== "done" && t.status !== "archived") || [];
  const weeklyMinutes = timeEntries?.reduce((sum, e) => sum + e.duration_minutes, 0) || 0;
  const weeklyHours = Math.floor(weeklyMinutes / 60);

  const stats = [
    {
      label: "Projets actifs",
      value: projects?.filter(p => p.status === "in_progress")?.length || 0,
      icon: FolderKanban,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      label: "Tâches en cours",
      value: activeTasks.length,
      icon: CheckSquare,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      label: "Heures cette semaine",
      value: `${weeklyHours}h`,
      icon: Clock,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      label: "Absences à venir",
      value: myAbsences.filter(a => a.status === "approved" && new Date(a.start_date) > new Date()).length,
      icon: CalendarOff,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
    {
      label: "Demandes en attente",
      value: pendingRequests.length,
      icon: MessagesSquare,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
  ];

  if (loadingProjects || loadingTasks || loadingTime) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckSquare className="h-4 w-4" />
              Tâches récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="truncate flex-1">
                  <p className="font-medium truncate">{task.title}</p>
                  <p className="text-xs text-muted-foreground">{task.status}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  task.priority === "high" || task.priority === "urgent" 
                    ? "bg-red-100 text-red-700" 
                    : "bg-muted"
                }`}>
                  {task.priority}
                </span>
              </div>
            ))}
            {activeTasks.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucune tâche en cours
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderKanban className="h-4 w-4" />
              Mes projets
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projects?.slice(0, 5).map((project) => (
              <div key={project.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-2 truncate flex-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: project.color || "#6366f1" }} 
                  />
                  <p className="font-medium truncate">{project.name}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {project.status === "in_progress" ? "En cours" : project.status}
                </span>
              </div>
            ))}
            {(!projects || projects.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun projet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
