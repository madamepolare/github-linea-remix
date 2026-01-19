import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Search, X, Users, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/permissions";

export interface TeamFiltersState {
  search: string;
  roles: string[];
  departments: string[];
  teams: string[];
}

export const defaultTeamFilters: TeamFiltersState = {
  search: "",
  roles: [],
  departments: [],
  teams: [],
};

interface TeamFiltersBarProps {
  filters: TeamFiltersState;
  onChange: (filters: TeamFiltersState) => void;
  availableRoles?: string[];
  availableDepartments?: string[];
  availableTeams?: { id: string; name: string }[];
  compact?: boolean;
}

export function TeamFiltersBar({
  filters,
  onChange,
  availableRoles = ["owner", "admin", "member", "viewer"],
  availableDepartments = [],
  availableTeams = [],
  compact = false,
}: TeamFiltersBarProps) {
  const hasActiveFilters =
    filters.roles.length > 0 ||
    filters.departments.length > 0 ||
    filters.teams.length > 0;

  const clearAllFilters = () => {
    onChange({
      ...filters,
      roles: [],
      departments: [],
      teams: [],
    });
  };

  const toggleRole = (role: string) => {
    const newRoles = filters.roles.includes(role)
      ? filters.roles.filter((r) => r !== role)
      : [...filters.roles, role];
    onChange({ ...filters, roles: newRoles });
  };

  const toggleDepartment = (dept: string) => {
    const newDepartments = filters.departments.includes(dept)
      ? filters.departments.filter((d) => d !== dept)
      : [...filters.departments, dept];
    onChange({ ...filters, departments: newDepartments });
  };

  const toggleTeam = (teamId: string) => {
    const newTeams = filters.teams.includes(teamId)
      ? filters.teams.filter((t) => t !== teamId)
      : [...filters.teams, teamId];
    onChange({ ...filters, teams: newTeams });
  };

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 py-2",
      compact ? "gap-1.5" : "gap-2"
    )}>
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          className="pl-9 h-9"
        />
        {filters.search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
            onClick={() => onChange({ ...filters, search: "" })}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-6 w-px bg-border" />

      {/* Role Filter */}
      <FilterButton
        icon={Shield}
        label="Rôle"
        isActive={filters.roles.length > 0}
        count={filters.roles.length}
      >
        <PopoverContent align="start" className="w-48 p-2">
          <div className="space-y-1">
            {availableRoles.map((role) => (
              <label
                key={role}
                className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
              >
                <Checkbox
                  checked={filters.roles.includes(role)}
                  onCheckedChange={() => toggleRole(role)}
                />
                <span className="text-sm">
                  {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role}
                </span>
              </label>
            ))}
          </div>
        </PopoverContent>
      </FilterButton>

      {/* Department Filter - only show if departments available */}
      {availableDepartments.length > 0 && (
        <FilterButton
          icon={Building2}
          label="Département"
          isActive={filters.departments.length > 0}
          count={filters.departments.length}
        >
          <PopoverContent align="start" className="w-56 p-2 max-h-64 overflow-auto">
            <div className="space-y-1">
              {availableDepartments.map((dept) => (
                <label
                  key={dept}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.departments.includes(dept)}
                    onCheckedChange={() => toggleDepartment(dept)}
                  />
                  <span className="text-sm truncate">{dept}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </FilterButton>
      )}

      {/* Team Filter - only show if teams available */}
      {availableTeams.length > 0 && (
        <FilterButton
          icon={Users}
          label="Équipe"
          isActive={filters.teams.length > 0}
          count={filters.teams.length}
        >
          <PopoverContent align="start" className="w-56 p-2 max-h-64 overflow-auto">
            <div className="space-y-1">
              {availableTeams.map((team) => (
                <label
                  key={team.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer"
                >
                  <Checkbox
                    checked={filters.teams.includes(team.id)}
                    onCheckedChange={() => toggleTeam(team.id)}
                  />
                  <span className="text-sm truncate">{team.name}</span>
                </label>
              ))}
            </div>
          </PopoverContent>
        </FilterButton>
      )}

      {/* Clear All */}
      {hasActiveFilters && (
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={clearAllFilters}
              >
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Effacer les filtres
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

function FilterButton({
  icon: Icon,
  label,
  isActive,
  count,
  children,
}: {
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <Popover>
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <PopoverTrigger asChild>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "relative h-8 px-2.5 gap-1.5",
                  isActive && "bg-primary/10 text-primary hover:bg-primary/20"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline text-xs">{label}</span>
                {count && count > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-4 min-w-4 px-1 text-[10px] font-medium bg-primary text-primary-foreground"
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
          </PopoverTrigger>
          <TooltipContent side="bottom" className="text-xs sm:hidden">
            {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {children}
    </Popover>
  );
}
