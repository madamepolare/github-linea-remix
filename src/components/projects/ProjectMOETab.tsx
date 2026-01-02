import { useState } from "react";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { EmptyState } from "@/components/ui/empty-state";
import { MOE_ROLES } from "@/lib/projectTypes";
import {
  Building2,
  Crown,
  Mail,
  MoreHorizontal,
  Phone,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

interface ProjectMOETabProps {
  projectId: string;
}

export function ProjectMOETab({ projectId }: ProjectMOETabProps) {
  const { moeTeam, isLoading, addMember, updateMember, removeMember } = useProjectMOE(projectId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState(MOE_ROLES[0].value);
  const [isLead, setIsLead] = useState(false);
  const [notes, setNotes] = useState("");

  const resetForm = () => {
    setSelectedCompanyId(null);
    setSelectedContactId(null);
    setSelectedRole(MOE_ROLES[0].value);
    setIsLead(false);
    setNotes("");
  };

  const handleAdd = () => {
    if (!selectedRole) return;

    addMember.mutate({
      crm_company_id: selectedCompanyId || undefined,
      contact_id: selectedContactId || undefined,
      role: selectedRole,
      is_lead: isLead,
      notes: notes.trim() || undefined,
    });

    setIsAddOpen(false);
    resetForm();
  };

  const handleRemove = (memberId: string) => {
    if (confirm("Retirer ce membre de l'équipe MOE ?")) {
      removeMember.mutate(memberId);
    }
  };

  const handleToggleLead = (memberId: string, currentIsLead: boolean) => {
    updateMember.mutate({ id: memberId, is_lead: !currentIsLead });
  };

  // All companies can be part of MOE team - group by type for better UX
  const moeCompanyCategories = [
    { 
      label: "BET & Ingénierie", 
      filter: (c: any) => c.industry?.startsWith("bet_") || c.industry === "bet"
    },
    { 
      label: "Architecture & Design", 
      filter: (c: any) => ["architecte", "architecte_interieur", "paysagiste", "scenographe", "designer"].includes(c.industry)
    },
    { 
      label: "Contrôle & Coordination", 
      filter: (c: any) => ["controleur_technique", "csps", "opc", "geometre"].includes(c.industry)
    },
    { 
      label: "Économie", 
      filter: (c: any) => c.industry === "economiste"
    },
    { 
      label: "Entreprises", 
      filter: (c: any) => ["entreprise_generale", "entreprise", "artisan"].includes(c.industry)
    },
    { 
      label: "Autres partenaires", 
      filter: (c: any) => !["bet_structure", "bet_fluides", "bet_electricite", "bet_thermique", "bet_acoustique", "bet", "architecte", "architecte_interieur", "paysagiste", "scenographe", "designer", "controleur_technique", "csps", "opc", "geometre", "economiste", "entreprise_generale", "entreprise", "artisan"].includes(c.industry)
    }
  ];
  
  // All companies available for MOE
  const allCompanies = companies;

  // Get contacts for selected company
  const companyContacts = selectedCompanyId 
    ? contacts.filter(c => c.crm_company_id === selectedCompanyId)
    : [];

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (moeTeam.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Aucun membre MOE"
        description="Ajoutez les partenaires de maîtrise d'œuvre depuis le CRM."
        action={{ label: "Ajouter un membre", onClick: () => setIsAddOpen(true) }}
      />
    );
  }

  // Group by role
  const groupedByRole = moeTeam.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, typeof moeTeam>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Équipe de Maîtrise d'Œuvre</h3>
        <Button size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedByRole).map(([role, members]) => {
          const roleConfig = MOE_ROLES.find(r => r.value === role);
          
          return (
            <div key={role}>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                {roleConfig?.label || role}
              </h4>
              <div className="grid gap-3">
                {members.map((member) => (
                  <Card key={member.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {member.crm_company?.name?.[0] || member.contact?.name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {member.crm_company ? (
                              <span className="font-medium">{member.crm_company.name}</span>
                            ) : member.contact ? (
                              <span className="font-medium">{member.contact.name}</span>
                            ) : (
                              <span className="font-medium text-muted-foreground">Non défini</span>
                            )}
                            {member.is_lead && (
                              <Badge variant="default" className="text-xs">
                                <Crown className="h-3 w-3 mr-1" />
                                Mandataire
                              </Badge>
                            )}
                          </div>
                          
                          {member.contact && member.crm_company && (
                            <p className="text-sm text-muted-foreground">
                              {member.contact.name}
                            </p>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                            {(member.crm_company?.email || member.contact?.email) && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.contact?.email || member.crm_company?.email}
                              </span>
                            )}
                            {(member.crm_company?.phone || member.contact?.phone) && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.contact?.phone || member.crm_company?.phone}
                              </span>
                            )}
                          </div>

                          {member.notes && (
                            <p className="text-xs text-muted-foreground mt-2 italic">
                              {member.notes}
                            </p>
                          )}
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleToggleLead(member.id, member.is_lead)}>
                              <Crown className="h-4 w-4 mr-2" />
                              {member.is_lead ? "Retirer mandataire" : "Définir mandataire"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemove(member.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Retirer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={isAddOpen} onOpenChange={(open) => { if (!open) { setIsAddOpen(false); resetForm(); } else setIsAddOpen(true); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un membre MOE</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rôle *</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MOE_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entreprise (CRM)</Label>
              <Select value={selectedCompanyId || "none"} onValueChange={(v) => setSelectedCompanyId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner depuis le CRM..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <SelectItem value="none">Aucune entreprise</SelectItem>
                  {moeCompanyCategories.map((category) => {
                    const categoryCompanies = allCompanies.filter(category.filter);
                    if (categoryCompanies.length === 0) return null;
                    return (
                      <div key={category.label}>
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                          {category.label}
                        </div>
                        {categoryCompanies.map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              {company.name}
                              {company.city && (
                                <span className="text-xs text-muted-foreground">
                                  ({company.city})
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedCompanyId && companyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select value={selectedContactId || "none"} onValueChange={(v) => setSelectedContactId(v === "none" ? null : v)}>
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

            <div className="flex items-center gap-2">
              <Switch checked={isLead} onCheckedChange={setIsLead} />
              <Label>Mandataire du groupement</Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes sur ce partenaire..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddOpen(false); resetForm(); }}>
              Annuler
            </Button>
            <Button onClick={handleAdd} disabled={!selectedRole}>
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
