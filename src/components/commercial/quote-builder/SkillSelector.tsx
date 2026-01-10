import { useSkills, Skill } from '@/hooks/useSkills';
import { useMemberSkills } from '@/hooks/useSkills';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { UserCog, Euro } from 'lucide-react';

interface SkillSelectorProps {
  value?: string; // skill_id
  assignedMemberId?: string;
  onSkillChange: (skillId: string | undefined, dailyRate: number, costRate: number) => void;
}

export function SkillSelector({
  value,
  assignedMemberId,
  onSkillChange,
}: SkillSelectorProps) {
  const { skills, isLoading: skillsLoading } = useSkills();
  const { memberSkills, isLoading: memberSkillsLoading } = useMemberSkills(assignedMemberId);

  // Find the selected skill
  const selectedSkill = skills.find(s => s.id === value);

  // Get member-specific rate if available
  const getMemberRate = (skillId: string): number | undefined => {
    if (!assignedMemberId) return undefined;
    const memberSkill = memberSkills.find(ms => ms.skill_id === skillId);
    return memberSkill?.custom_daily_rate;
  };

  const handleChange = (skillId: string) => {
    if (skillId === 'none') {
      onSkillChange(undefined, 0, 0);
      return;
    }

    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    // Priority: Member custom rate > Skill default rate
    const memberRate = getMemberRate(skillId);
    const dailyRate = memberRate ?? skill.setting_value.daily_rate;
    const costRate = skill.setting_value.cost_daily_rate;

    onSkillChange(skillId, dailyRate, costRate);
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);

  if (skillsLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Chargement..." />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value || 'none'} onValueChange={handleChange}>
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une compétence...">
          {selectedSkill && (
            <div className="flex items-center gap-2">
              <div 
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: selectedSkill.setting_value.color || '#6366f1' }}
              />
              <span className="truncate">{selectedSkill.setting_value.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">Aucune compétence</span>
        </SelectItem>
        
        {skills.length > 0 && <Separator className="my-1" />}
        
        {skills.map((skill) => {
          const memberRate = getMemberRate(skill.id);
          const hasCustomRate = memberRate !== undefined && memberRate !== skill.setting_value.daily_rate;
          
          return (
            <SelectItem key={skill.id} value={skill.id}>
              <div className="flex items-center gap-2 w-full">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: skill.setting_value.color || '#6366f1' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{skill.setting_value.label}</span>
                    {hasCustomRate && (
                      <Badge variant="outline" className="text-[10px] px-1 py-0">
                        Taux personnalisé
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Euro className="h-3 w-3" />
                    {hasCustomRate ? (
                      <>
                        <span className="line-through">{formatCurrency(skill.setting_value.daily_rate)}</span>
                        <span className="text-primary font-medium">{formatCurrency(memberRate!)}/j</span>
                      </>
                    ) : (
                      <span>{formatCurrency(skill.setting_value.daily_rate)}/jour</span>
                    )}
                  </div>
                </div>
              </div>
            </SelectItem>
          );
        })}

        {skills.length === 0 && (
          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
            <UserCog className="h-4 w-4 mx-auto mb-1" />
            Aucune compétence définie
          </div>
        )}
      </SelectContent>
    </Select>
  );
}
