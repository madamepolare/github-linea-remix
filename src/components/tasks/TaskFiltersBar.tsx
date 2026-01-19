import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { 
  Search, 
  X, 
  Circle, 
  User, 
  FolderKanban,
  Calendar,
  Tag,
  CalendarClock,
  AlertTriangle,
  Clock,
  Filter
} from "lucide-react";
import { useTeamMembers } from "@/hooks/useTeamMembers";
import { useProjects } from "@/hooks/useProjects";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { TaskFiltersState } from "@/hooks/useTaskFilters";

interface TaskFiltersBarProps {
  filters: TaskFiltersState;
  onChange: (filters: TaskFiltersState) => void;
  availableTags?: string[];
}

const priorityOptions = [
  { value: "urgent", label: "Urgente", color: "#ef4444" },
  { value: "high", label: "Haute", color: "#f59e0b" },
  { value: "medium", label: "Moyenne", color: "#3b82f6" },
  { value: "low", label: "Basse", color: "#64748b" },
];

const dueDateOptions = [
  { value: "overdue", label: "En retard", icon: AlertTriangle, color: "text-destructive" },
  { value: "today", label: "Aujourd'hui", icon: Clock, color: "text-amber-500" },
  { value: "week", label: "Cette semaine", icon: Calendar, color: "text-blue-500" },
  { value: "no_date", label: "Sans date", icon: Calendar, color: "text-muted-foreground" },
];

export function TaskFiltersBar({ filters, onChange, availableTags = [] }: TaskFiltersBarProps) {
  const { data: teamMembers } = useTeamMembers();
  const { projects } = useProjects();
  
  const activeFiltersCount = 
    filters.priorities.length + 
    filters.assignees.length + 
    filters.projects.length + 
    filters.tags.length +
    (filters.dueDateFilter ? 1 : 0) + 
    (filters.isScheduled !== null ? 1 : 0);

  const handleClearAll = () => {
    onChange({
      search: "",
      priorities: [],
      assignees: [],
      projects: [],
      dueDateFilter: null,
      tags: [],
      isScheduled: null,
    });
  };

  const toggleArrayFilter = (key: keyof Pick<TaskFiltersState, 'priorities' | 'assignees' | 'projects' | 'tags'>, value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: updated });
  };

  // Filter button component for icon-first design
  const FilterButton = ({ 
    icon: Icon, 
    label, 
    isActive, 
    count,
    children 
  }: { 
    icon: React.ElementType; 
    label: string; 
    isActive: boolean; 
    count?: number;
    children: React.ReactNode;
  }) => (
    <Popover>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button 
                variant={isActive ? "secondary" : "ghost"} 
                size="icon-sm"
                className={cn(
                  "relative",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
                {count && count > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-4 px-1 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium">
                    {count}
                  </span>
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom" className="text-xs">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </Popover>
  );

  return (
    <div className="flex items-center gap-1.5 pb-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="h-9 w-[160px] pl-8 text-sm bg-muted/50 border-0 focus-visible:ring-1"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: "" })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Priority Filter */}
      <FilterButton
        icon={Circle}
        label="Priorité"
        isActive={filters.priorities.length > 0}
        count={filters.priorities.length}
      >
        <PopoverContent align="start" className="w-44 p-1">
          <div className="flex flex-col">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleArrayFilter("priorities", opt.value)}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  filters.priorities.includes(opt.value)
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                <Checkbox 
                  checked={filters.priorities.includes(opt.value)}
                  className="h-3.5 w-3.5"
                />
                <Circle 
                  className="h-2.5 w-2.5 fill-current"
                  style={{ color: opt.color }}
                />
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </FilterButton>

      {/* Assignee Filter */}
      <FilterButton
        icon={User}
        label="Assigné"
        isActive={filters.assignees.length > 0}
        count={filters.assignees.length}
      >
        <PopoverContent align="start" className="w-56 p-1">
          <ScrollArea className="max-h-[250px]">
            <div className="flex flex-col">
              {teamMembers?.map((member) => (
                <button
                  key={member.user_id}
                  onClick={() => toggleArrayFilter("assignees", member.user_id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    filters.assignees.includes(member.user_id)
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Checkbox 
                    checked={filters.assignees.includes(member.user_id)}
                    className="h-3.5 w-3.5"
                  />
                  <Avatar className="h-5 w-5">
                    {member.profile?.avatar_url && (
                      <AvatarImage src={member.profile.avatar_url} />
                    )}
                    <AvatarFallback className="text-2xs">
                      {member.profile?.full_name?.slice(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate">{member.profile?.full_name || "Utilisateur"}</span>
                </button>
              ))}
              {(!teamMembers || teamMembers.length === 0) && (
                <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                  Aucun membre
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </FilterButton>

      {/* Project Filter */}
      <FilterButton
        icon={FolderKanban}
        label="Projet"
        isActive={filters.projects.length > 0}
        count={filters.projects.length}
      >
        <PopoverContent align="start" className="w-64 p-1">
          <ScrollArea className="max-h-[250px]">
            <div className="flex flex-col">
              {projects?.map((project) => (
                <button
                  key={project.id}
                  onClick={() => toggleArrayFilter("projects", project.id)}
                  className={cn(
                    "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors text-left",
                    filters.projects.includes(project.id)
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <Checkbox 
                    checked={filters.projects.includes(project.id)}
                    className="h-3.5 w-3.5 flex-shrink-0"
                  />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
              {(!projects || projects.length === 0) && (
                <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                  Aucun projet
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </FilterButton>

      {/* Due Date Filter */}
      <FilterButton
        icon={Calendar}
        label="Échéance"
        isActive={!!filters.dueDateFilter}
        count={filters.dueDateFilter ? 1 : 0}
      >
        <PopoverContent align="start" className="w-44 p-1">
          <div className="flex flex-col">
            {dueDateOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onChange({ 
                  ...filters, 
                  dueDateFilter: filters.dueDateFilter === opt.value ? null : opt.value 
                })}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  filters.dueDateFilter === opt.value
                    ? "bg-primary/10 text-primary" 
                    : "hover:bg-muted text-foreground"
                )}
              >
                <opt.icon className={cn("h-3.5 w-3.5", opt.color)} />
                {opt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </FilterButton>

      {/* Tags Filter - Only show if there are tags */}
      {availableTags.length > 0 && (
        <FilterButton
          icon={Tag}
          label="Tags"
          isActive={filters.tags.length > 0}
          count={filters.tags.length}
        >
          <PopoverContent align="start" className="w-48 p-1">
            <ScrollArea className="max-h-[200px]">
              <div className="flex flex-col">
                {availableTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleArrayFilter("tags", tag)}
                    className={cn(
                      "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                      filters.tags.includes(tag)
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted text-foreground"
                    )}
                  >
                    <Checkbox 
                      checked={filters.tags.includes(tag)}
                      className="h-3.5 w-3.5"
                    />
                    <Badge variant="secondary" className="text-2xs">
                      {tag}
                    </Badge>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </FilterButton>
      )}

      {/* Scheduled Filter */}
      <FilterButton
        icon={CalendarClock}
        label="Planification"
        isActive={filters.isScheduled !== null}
        count={filters.isScheduled !== null ? 1 : 0}
      >
        <PopoverContent align="start" className="w-44 p-1">
          <div className="flex flex-col">
            <button
              onClick={() => onChange({ 
                ...filters, 
                isScheduled: filters.isScheduled === true ? null : true 
              })}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                filters.isScheduled === true
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Planifiées
            </button>
            <button
              onClick={() => onChange({ 
                ...filters, 
                isScheduled: filters.isScheduled === false ? null : false 
              })}
              className={cn(
                "flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                filters.isScheduled === false
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted text-foreground"
              )}
            >
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              Non planifiées
            </button>
          </div>
        </PopoverContent>
      </FilterButton>

      {/* Clear All - Only show if filters active */}
      {activeFiltersCount > 0 && (
        <>
          <div className="h-6 w-px bg-border mx-1" />
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon-sm"
                  onClick={handleClearAll}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Effacer les filtres ({activeFiltersCount})
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </>
      )}
    </div>
  );
}
