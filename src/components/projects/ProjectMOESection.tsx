import { useState } from "react";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { MOE_CATEGORIES, MOE_ROLES, type MOECategory, getRolesByCategory } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";
import {
  Building2,
  Calculator,
  Compass,
  Crown,
  HardHat,
  Mail,
  Phone,
  Plus,
  Search,
  Shield,
  Trash2,
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
  const { moeTeam, isLoading, addMember, updateMember, removeMember } = useProjectMOE(projectId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<MOECategory>("architecte");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [isUs, setIsUs] = useState(false);

  const resetForm = () => {
    setSelectedCompanyId(null);
    setSelectedContactId(null);
    setSelectedRole("");
    setCompanySearch("");
    setIsUs(false);
  };

  const handleAdd = () => {
    const roleToUse = selectedRole || selectedCategory;
    
    addMember.mutate({
      crm_company_id: selectedCompanyId || undefined,
      contact_id: selectedContactId || undefined,
      role: roleToUse,
      is_lead: isUs,
      notes: isUs ? "Notre agence" : undefined,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const handleRemove = (memberId: string) => {
    removeMember.mutate(memberId);
  };

  // Get role config from role value
  const getRoleLabel = (roleValue: string) => {
    const role = MOE_ROLES.find(r => r.value === roleValue);
    return role?.label || roleValue;
  };

  // Get category from role
  const getCategoryFromRole = (roleValue: string): MOECategory => {
    const role = MOE_ROLES.find(r => r.value === roleValue);
    return role?.category || "entreprise";
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
    return <Skeleton className="h-48 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">Équipe projet</h3>
        <Button variant="ghost" size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Categories display */}
      <div className="space-y-3">
        {MOE_CATEGORIES.map((category) => {
          const members = membersByCategory[category.value];
          const CategoryIcon = CATEGORY_ICONS[category.value];
          
          if (members.length === 0) return null;

          return (
            <div key={category.value} className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CategoryIcon className="h-3.5 w-3.5" style={{ color: category.color }} />
                <span>{category.labelPlural}</span>
              </div>
              <div className="space-y-1.5">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 group"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback 
                        className="text-xs"
                        style={{ backgroundColor: `${category.color}20`, color: category.color }}
                      >
                        {member.crm_company?.name?.[0] || member.contact?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">
                          {member.crm_company?.name || member.contact?.name || "Non défini"}
                        </span>
                        {member.is_lead && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">Nous</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{getRoleLabel(member.role)}</span>
                        {member.contact && member.crm_company && (
                          <>
                            <span>•</span>
                            <span className="truncate">{member.contact.name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {(member.crm_company?.email || member.contact?.email) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          asChild
                        >
                          <a href={`mailto:${member.contact?.email || member.crm_company?.email}`}>
                            <Mail className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      {(member.crm_company?.phone || member.contact?.phone) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          asChild
                        >
                          <a href={`tel:${member.contact?.phone || member.crm_company?.phone}`}>
                            <Phone className="h-3 w-3" />
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive"
                        onClick={() => handleRemove(member.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {moeTeam.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Aucun membre dans l'équipe</p>
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => { resetForm(); setIsAddOpen(true); }}
              className="mt-1"
            >
              Ajouter un membre
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
              <div className="flex flex-wrap gap-2">
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
                      }}
                      className="gap-1.5"
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {cat.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Role selection */}
            {categoryRoles.length > 1 && (
              <div className="space-y-2">
                <Label>Rôle spécifique</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un rôle..." />
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
              <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div>
                  <Label className="font-medium">C'est nous</Label>
                  <p className="text-xs text-muted-foreground">Notre agence sur ce projet</p>
                </div>
                <Switch checked={isUs} onCheckedChange={setIsUs} />
              </div>
            )}

            {/* Company search */}
            <div className="space-y-2">
              <Label>Entreprise</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Rechercher..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {companySearch && (
                <ScrollArea className="h-40 border rounded-md">
                  <div className="p-1">
                    {filteredCompanies.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune entreprise trouvée
                      </p>
                    ) : (
                      filteredCompanies.slice(0, 20).map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId(company.id);
                            setSelectedContactId(null);
                            setCompanySearch("");
                          }}
                          className={cn(
                            "w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors",
                            selectedCompanyId === company.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted"
                          )}
                        >
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
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
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      {companies.find(c => c.id === selectedCompanyId)?.name}
                    </span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setSelectedCompanyId(null); setSelectedContactId(null); }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Contact selection */}
            {selectedCompanyId && companyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select 
                  value={selectedContactId || "none"} 
                  onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun contact</SelectItem>
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
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleAdd}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
