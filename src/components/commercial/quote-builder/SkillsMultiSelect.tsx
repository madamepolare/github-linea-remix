import { useState } from 'react';
import { Check, ChevronsUpDown, X, UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useSkills, Skill } from '@/hooks/useSkills';

interface SkillsMultiSelectProps {
  selectedSkillIds: string[];
  onSelectionChange: (skillIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function SkillsMultiSelect({
  selectedSkillIds,
  onSelectionChange,
  placeholder = "Sélectionner des compétences...",
  className,
}: SkillsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { skills, isLoading } = useSkills();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  const selectedSkills = skills.filter(s => selectedSkillIds.includes(s.id));

  const toggleSkill = (skillId: string) => {
    if (selectedSkillIds.includes(skillId)) {
      onSelectionChange(selectedSkillIds.filter(id => id !== skillId));
    } else {
      onSelectionChange([...selectedSkillIds, skillId]);
    }
  };

  const removeSkill = (skillId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectionChange(selectedSkillIds.filter(id => id !== skillId));
  };

  // Calculate total cost based on selected skills
  const getTotalDailyRate = () => {
    return selectedSkills.reduce((sum, skill) => sum + (skill.setting_value.daily_rate || 0), 0);
  };

  const getTotalCostRate = () => {
    return selectedSkills.reduce((sum, skill) => sum + (skill.setting_value.cost_daily_rate || 0), 0);
  };

  if (isLoading) {
    return (
      <Button variant="outline" className={cn("w-full justify-between", className)} disabled>
        Chargement...
      </Button>
    );
  }

  if (skills.length === 0) {
    return (
      <Button variant="outline" className={cn("w-full justify-start gap-2 text-muted-foreground", className)} disabled>
        <UserCog className="h-4 w-4" />
        Aucune compétence configurée
      </Button>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between min-h-[40px] h-auto", className)}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedSkills.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selectedSkills.map((skill) => (
                <Badge
                  key={skill.id}
                  variant="secondary"
                  className="gap-1"
                  style={{ borderColor: skill.setting_value.color }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: skill.setting_value.color }}
                  />
                  {skill.setting_value.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => removeSkill(skill.id, e)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Rechercher une compétence..." />
          <CommandList>
            <CommandEmpty>Aucune compétence trouvée.</CommandEmpty>
            <CommandGroup>
              {skills.map((skill) => {
                const isSelected = selectedSkillIds.includes(skill.id);
                const margin = skill.setting_value.daily_rate > 0
                  ? ((skill.setting_value.daily_rate - skill.setting_value.cost_daily_rate) / skill.setting_value.daily_rate * 100)
                  : 0;

                return (
                  <CommandItem
                    key={skill.id}
                    value={skill.setting_value.label}
                    onSelect={() => toggleSkill(skill.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-sm border",
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground"
                        )}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                      </div>
                      
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: skill.setting_value.color || '#6366f1' }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{skill.setting_value.label}</div>
                        {skill.setting_value.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {skill.setting_value.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right shrink-0">
                        <div className="text-sm font-medium">
                          {formatCurrency(skill.setting_value.daily_rate)}/j
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Coût: {formatCurrency(skill.setting_value.cost_daily_rate)}/j
                        </div>
                      </div>
                      
                      <Badge 
                        variant="outline"
                        className={cn(
                          "shrink-0 text-xs",
                          margin >= 30 ? 'border-green-500 text-green-600' : 
                          margin >= 20 ? 'border-amber-500 text-amber-600' : 
                          'border-red-500 text-red-600'
                        )}
                      >
                        {margin.toFixed(0)}%
                      </Badge>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        
        {selectedSkills.length > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total journalier</span>
              <span className="font-medium">{formatCurrency(getTotalDailyRate())}/jour</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>Coût total</span>
              <span>{formatCurrency(getTotalCostRate())}/jour</span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Helper to get skill cost for a line
export function calculateSkillsCost(skills: Skill[], selectedSkillIds: string[], estimatedDays: number) {
  const selectedSkills = skills.filter(s => selectedSkillIds.includes(s.id));
  const dailyCostRate = selectedSkills.reduce((sum, skill) => sum + (skill.setting_value.cost_daily_rate || 0), 0);
  return dailyCostRate * estimatedDays;
}

export function calculateSkillsRevenue(skills: Skill[], selectedSkillIds: string[], estimatedDays: number) {
  const selectedSkills = skills.filter(s => selectedSkillIds.includes(s.id));
  const dailyRate = selectedSkills.reduce((sum, skill) => sum + (skill.setting_value.daily_rate || 0), 0);
  return dailyRate * estimatedDays;
}
