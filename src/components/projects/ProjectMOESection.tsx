import { useState } from "react";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MOE_CATEGORIES, MOE_ROLES, BET_SPECIALTIES, type MOECategory, getRolesByCategory, getBETSpecialtyLabel } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calculator,
  Compass,
  HardHat,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectMOESectionProps {
  projectId: string;
}

const CATEGORY_ICONS: Record<MOECategory, any> = {
  architecte: Compass,
  client: Building2,
  amo: Shield,
  bet: Calculator,
  entreprise: HardHat,
};

export function ProjectMOESection({ projectId }: ProjectMOESectionProps) {
  const { moeTeam, isLoading, addMember, removeMember } = useProjectMOE(projectId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MOECategory>("architecte");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedBETSpecialties, setSelectedBETSpecialties] = useState<string[]>([]);
  const [isUs, setIsUs] = useState(false);

  const resetForm = () => {
    setSelectedCompanyId(null);
    setSelectedContactId(null);
    setSelectedRole("");
    setSelectedBETSpecialties([]);
    setCompanySearch("");
    setIsUs(false);
  };

  const handleAdd = () => {
    // For BET, store specialties in notes field as JSON
    let notes: string | undefined;
    if (selectedCategory === "bet" && selectedBETSpecialties.length > 0) {
      notes = JSON.stringify({ specialties: selectedBETSpecialties });
    } else if (isUs) {
      notes = "Notre agence";
    }

    const roleToUse = selectedRole || selectedCategory;
    
    addMember.mutate({
      crm_company_id: selectedCompanyId || undefined,
      contact_id: selectedContactId || undefined,
      role: roleToUse,
      is_lead: isUs,
      notes,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId);
  };

  const toggleBETSpecialty = (specialty: string) => {
    setSelectedBETSpecialties(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    );
  };

  // Get role label
  const getRoleLabel = (roleValue: string) => {
    const role = MOE_ROLES.find(r => r.value === roleValue);
    return role?.label || roleValue;
  };

  // Get category from role
  const getCategoryFromRole = (roleValue: string): MOECategory => {
    const role = MOE_ROLES.find(r => r.value === roleValue);
    return role?.category || "entreprise";
  };

  // Parse BET specialties from notes
  const getBETSpecialties = (notes: string | null): string[] => {
    if (!notes) return [];
    try {
      const parsed = JSON.parse(notes);
      return parsed.specialties || [];
    } catch {
      return [];
    }
  };

  // Filter companies by search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  // Get contacts for selected company
  const companyContacts = selectedCompanyId 
    ? contacts.filter(c => c.crm_company_id === selectedCompanyId)
    : [];

  // Get roles for selected category
  const categoryRoles = getRolesByCategory(selectedCategory);

  // Group members by category
  const membersByCategory = MOE_CATEGORIES.reduce((acc, cat) => {
    acc[cat.value] = moeTeam.filter(m => getCategoryFromRole(m.role) === cat.value);
    return acc;
  }, {} as Record<MOECategory, typeof moeTeam>);

  if (isLoading) {
    return <Skeleton className="h-32 w-full" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Équipe projet</h3>
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Categories display */}
      <div className="space-y-2">
        {MOE_CATEGORIES.map((category) => {
          const members = membersByCategory[category.value];
          const CategoryIcon = CATEGORY_ICONS[category.value];
          
          if (members.length === 0) return null;

          return (
            <div key={category.value} className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground uppercase tracking-wider">
                <CategoryIcon className="h-3 w-3" style={{ color: category.color }} />
                <span>{category.labelPlural}</span>
              </div>
              <div className="space-y-1">
                {members.map((member) => {
                  const betSpecialties = getBETSpecialties(member.notes);
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-2 p-1.5 rounded-md bg-muted/40 group text-sm"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarFallback 
                          className="text-[10px]"
                          style={{ backgroundColor: `${category.color}15`, color: category.color }}
                        >
                          {member.crm_company?.name?.[0] || member.contact?.name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium truncate">
                            {member.crm_company?.name || member.contact?.name || "Non défini"}
                          </span>
                          {member.is_lead && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Nous</Badge>
                          )}
                        </div>
                        {betSpecialties.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 mt-0.5">
                            {betSpecialties.map(s => (
                              <span key={s} className="text-[10px] text-muted-foreground bg-muted px-1 rounded">
                                {getBETSpecialtyLabel(s)}
                              </span>
                            ))}
                          </div>
                        )}
                        {member.contact && member.crm_company && !betSpecialties.length && (
                          <span className="text-[11px] text-muted-foreground truncate block">
                            {member.contact.name}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {moeTeam.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            <User className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
            <p>Aucun membre</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="mt-0.5 h-auto p-0 text-xs"
            >
              Ajouter
            </Button>
          </div>
        )}
      </div>

      {/* Add member dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); resetForm(); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Category selection */}
            <div className="space-y-2">
              <Label>Catégorie</Label>
              <div className="flex flex-wrap gap-1.5">
                {MOE_CATEGORIES.map((cat) => {
                  const Icon = CATEGORY_ICONS[cat.value];
                  return (
                    <Button
                      key={cat.value}
                      type="button"
                      variant={selectedCategory === cat.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setSelectedRole("");
                        setSelectedBETSpecialties([]);
                      }}
                      className="gap-1 h-8 text-xs"
                    >
                      <Icon className="h-3 w-3" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Role selection (for non-BET) */}
            {selectedCategory !== "bet" && categoryRoles.length > 1 && (
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryRoles.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Is us toggle for architects */}
            {selectedCategory === "architecte" && (
              <div className="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <Label className="font-medium text-sm">C'est nous</Label>
                  <p className="text-[11px] text-muted-foreground">Notre agence</p>
                </div>
                <Switch checked={isUs} onCheckedChange={setIsUs} />
              </div>
            )}

            {/* Company search */}
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              
              {companySearch && (
                <ScrollArea className="h-32 border rounded-md">
                  <div className="p-1">
                    {filteredCompanies.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">
                        Aucune entreprise
                      </p>
                    ) : (
                      filteredCompanies.slice(0, 15).map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId(company.id);
                            setSelectedContactId(null);
                            setCompanySearch("");
                          }}
                          className={cn(
                            "w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-colors",
                            selectedCompanyId === company.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <Building2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{company.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              )}

              {selectedCompanyId && (
                <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">
                      {companies.find(c => c.id === selectedCompanyId)?.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-5 w-5"
                    onClick={() => { setSelectedCompanyId(null); setSelectedContactId(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* BET Specialties selection (multi-select) */}
            {selectedCategory === "bet" && selectedCompanyId && (
              <div className="space-y-2">
                <Label>Spécialités (plusieurs possibles)</Label>
                <div className="grid grid-cols-2 gap-1.5 p-2 border rounded-md max-h-40 overflow-y-auto">
                  {BET_SPECIALTIES.map((specialty) => (
                    <label
                      key={specialty.value}
                      className={cn(
                        "flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors",
                        selectedBETSpecialties.includes(specialty.value)
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selectedBETSpecialties.includes(specialty.value)}
                        onCheckedChange={() => toggleBETSpecialty(specialty.value)}
                        className="h-3.5 w-3.5"
                      />
                      {specialty.label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Contact selection */}
            {selectedCompanyId && companyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select 
                  value={selectedContactId || "none"} 
                  onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun</SelectItem>
                    {companyContacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setIsAddOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button 
              size="sm" 
              onClick={handleAdd}
              disabled={selectedCategory === "bet" && selectedBETSpecialties.length === 0 && !!selectedCompanyId}
            >
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
