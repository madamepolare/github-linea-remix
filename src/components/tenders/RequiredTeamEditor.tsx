import { useState } from "react";
import { Plus, Trash2, Building2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MOE_SPECIALTIES } from "@/lib/tenderTypes";
import { cn } from "@/lib/utils";

export interface RequiredTeamItem {
  id: string;
  specialty: string;
  is_mandatory: boolean;
  notes?: string;
  company_id?: string | null;
}

interface RequiredTeamEditorProps {
  team: RequiredTeamItem[];
  onChange: (team: RequiredTeamItem[]) => void;
  companies?: Array<{ id: string; name: string; bet_specialties?: string[] }>;
}

export function RequiredTeamEditor({ team, onChange, companies = [] }: RequiredTeamEditorProps) {
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('bet_structure');

  const addTeamMember = () => {
    const newMember: RequiredTeamItem = {
      id: crypto.randomUUID(),
      specialty: selectedSpecialty,
      is_mandatory: true,
      notes: '',
      company_id: null,
    };
    onChange([...team, newMember]);
  };

  const updateMember = (id: string, updates: Partial<RequiredTeamItem>) => {
    onChange(team.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const removeMember = (id: string) => {
    onChange(team.filter(m => m.id !== id));
  };

  const getSpecialtyLabel = (value: string) => {
    return MOE_SPECIALTIES.find(s => s.value === value)?.label || value;
  };

  // Get companies that match a specialty
  const getMatchingCompanies = (specialty: string) => {
    return companies.filter(c => 
      c.bet_specialties?.includes(specialty) || 
      c.bet_specialties?.some(s => s.toLowerCase().includes(specialty.toLowerCase()))
    );
  };

  // Available specialties not yet added
  const availableSpecialties = MOE_SPECIALTIES.filter(
    s => !team.some(t => t.specialty === s.value)
  );

  return (
    <div className="space-y-4">
      {/* Team members list */}
      <div className="space-y-3">
        {team.map((member) => {
          const matchingCompanies = getMatchingCompanies(member.specialty);
          
          return (
            <div
              key={member.id}
              className="p-4 rounded-lg border bg-card space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-lg",
                    member.is_mandatory ? "bg-primary/10" : "bg-muted"
                  )}>
                    <Building2 className={cn(
                      "h-4 w-4",
                      member.is_mandatory ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {getSpecialtyLabel(member.specialty)}
                    </p>
                    <Badge variant={member.is_mandatory ? "default" : "secondary"} className="text-xs">
                      {member.is_mandatory ? "Obligatoire" : "Optionnel"}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`mandatory-${member.id}`} className="text-xs text-muted-foreground">
                      Obligatoire
                    </Label>
                    <Switch
                      id={`mandatory-${member.id}`}
                      checked={member.is_mandatory}
                      onCheckedChange={(checked) => updateMember(member.id, { is_mandatory: checked })}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Matching companies */}
              {companies.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Partenaires disponibles ({matchingCompanies.length})
                  </p>
                  {matchingCompanies.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {matchingCompanies.slice(0, 5).map(company => (
                        <Badge
                          key={company.id}
                          variant={member.company_id === company.id ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => updateMember(member.id, { 
                            company_id: member.company_id === company.id ? null : company.id 
                          })}
                        >
                          {member.company_id === company.id && (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          {company.name}
                        </Badge>
                      ))}
                      {matchingCompanies.length > 5 && (
                        <Badge variant="secondary">
                          +{matchingCompanies.length - 5}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      Aucun partenaire trouvé pour cette spécialité
                    </p>
                  )}
                </div>
              )}
              
              {/* Notes */}
              <Input
                placeholder="Notes / exigences particulières..."
                value={member.notes}
                onChange={(e) => updateMember(member.id, { notes: e.target.value })}
                className="h-8 text-sm"
              />
            </div>
          );
        })}
      </div>

      {/* Add specialty */}
      {availableSpecialties.length > 0 && (
        <div className="flex items-center gap-2">
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choisir une spécialité" />
            </SelectTrigger>
            <SelectContent>
              {availableSpecialties.map((specialty) => (
                <SelectItem key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={addTeamMember}>
            <Plus className="h-4 w-4 mr-1" />
            Ajouter
          </Button>
        </div>
      )}

      {/* Quick add common team */}
      {team.length === 0 && (
        <div className="p-4 rounded-lg border border-dashed bg-muted/30 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Ajoutez rapidement une équipe type
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([
                { id: crypto.randomUUID(), specialty: 'bet_structure', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'bet_fluides', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'economiste', is_mandatory: true, notes: '' },
              ])}
            >
              Équipe base
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onChange([
                { id: crypto.randomUUID(), specialty: 'bet_structure', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'bet_fluides', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'bet_electricite', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'thermicien', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'economiste', is_mandatory: true, notes: '' },
                { id: crypto.randomUUID(), specialty: 'acousticien', is_mandatory: false, notes: '' },
              ])}
            >
              Équipe complète
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
