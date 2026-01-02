import { useState } from "react";
import { useProjectMOE } from "@/hooks/useProjectMOE";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { MOE_ROLES } from "@/lib/projectTypes";
import { cn } from "@/lib/utils";
import {
  Building2,
  Crown,
  Mail,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ProjectMOETabProps {
  projectId: string;
}

export function ProjectMOETab({ projectId }: ProjectMOETabProps) {
  const { moeTeam, isLoading, addMember, updateMember, removeMember } = useProjectMOE(projectId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any | null>(null);
  const [companySearch, setCompanySearch] = useState("");

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
    setCompanySearch("");
  };

  const openEditDialog = (member: any) => {
    setEditingMember(member);
    setSelectedCompanyId(member.crm_company_id);
    setSelectedContactId(member.contact_id);
    setSelectedRole(member.role);
    setIsLead(member.is_lead || false);
    setNotes(member.notes || "");
    setIsEditOpen(true);
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

  const handleUpdate = () => {
    if (!editingMember || !selectedRole) return;

    updateMember.mutate({
      id: editingMember.id,
      crm_company_id: selectedCompanyId || null,
      contact_id: selectedContactId || null,
      role: selectedRole,
      is_lead: isLead,
      notes: notes.trim() || null,
    });

    setIsEditOpen(false);
    setEditingMember(null);
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

  // Company categories for better UX
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
      label: "Autres partenaires", 
      filter: (c: any) => !["bet_structure", "bet_fluides", "bet_electricite", "bet_thermique", "bet_acoustique", "bet", "architecte", "architecte_interieur", "paysagiste", "scenographe", "designer", "controleur_technique", "csps", "opc", "geometre", "economiste"].includes(c.industry)
    }
  ];

  // Filter companies by search
  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(companySearch.toLowerCase()) ||
    c.city?.toLowerCase().includes(companySearch.toLowerCase())
  );

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

  // Group by role
  const groupedByRole = moeTeam.reduce((acc, member) => {
    const role = member.role;
    if (!acc[role]) acc[role] = [];
    acc[role].push(member);
    return acc;
  }, {} as Record<string, typeof moeTeam>);

  // Get role config
  const getRoleConfig = (roleValue: string) => 
    MOE_ROLES.find(r => r.value === roleValue) || { value: roleValue, label: roleValue };

  // Count stats
  const leadCount = moeTeam.filter(m => m.is_lead).length;
  const roleCount = Object.keys(groupedByRole).length;

  const MemberFormDialog = ({ isOpen, onClose, onSubmit, title, submitLabel }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    title: string;
    submitLabel: string;
  }) => (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
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
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Rechercher une entreprise..."
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Accordion type="single" collapsible className="w-full">
              {moeCompanyCategories.map((category) => {
                const categoryCompanies = filteredCompanies.filter(category.filter);
                if (categoryCompanies.length === 0) return null;
                
                return (
                  <AccordionItem key={category.label} value={category.label}>
                    <AccordionTrigger className="text-sm py-2">
                      {category.label} ({categoryCompanies.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-1">
                        {categoryCompanies.map((company) => (
                          <button
                            key={company.id}
                            type="button"
                            onClick={() => {
                              setSelectedCompanyId(company.id);
                              setSelectedContactId(null);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors",
                              selectedCompanyId === company.id
                                ? "bg-primary text-primary-foreground"
                                : "hover:bg-muted"
                            )}
                          >
                            <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{company.name}</span>
                            {company.city && (
                              <span className={cn(
                                "text-xs ml-auto flex-shrink-0",
                                selectedCompanyId === company.id ? "text-primary-foreground/70" : "text-muted-foreground"
                              )}>
                                {company.city}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            {selectedCompanyId && (
              <div className="mt-2 p-2 bg-muted rounded-md flex items-center justify-between">
                <span className="text-sm">
                  {companies.find(c => c.id === selectedCompanyId)?.name}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => { setSelectedCompanyId(null); setSelectedContactId(null); }}
                >
                  Retirer
                </Button>
              </div>
            )}
          </div>

          {selectedCompanyId && companyContacts.length > 0 && (
            <div className="space-y-2">
              <Label>Contact référent</Label>
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
                        <div className="flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          {contact.name}
                        </div>
                      </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div>
              <Label className="font-medium">Mandataire du groupement</Label>
              <p className="text-xs text-muted-foreground">
                Ce membre est le coordinateur principal
              </p>
            </div>
            <Switch checked={isLead} onCheckedChange={setIsLead} />
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes sur ce partenaire, missions spécifiques..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={onSubmit} disabled={!selectedRole}>
            {submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (moeTeam.length === 0) {
    return (
      <>
        <EmptyState
          icon={Users}
          title="Aucun membre MOE"
          description="Constituez l'équipe de maîtrise d'œuvre en ajoutant des partenaires depuis le CRM."
          action={{ label: "Ajouter un membre", onClick: () => setIsAddOpen(true) }}
        />
        <MemberFormDialog
          isOpen={isAddOpen}
          onClose={() => { setIsAddOpen(false); resetForm(); }}
          onSubmit={handleAdd}
          title="Ajouter un membre MOE"
          submitLabel="Ajouter"
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Équipe de Maîtrise d'Œuvre</h3>
          <p className="text-sm text-muted-foreground">
            {moeTeam.length} membre{moeTeam.length > 1 ? "s" : ""} • {roleCount} rôle{roleCount > 1 ? "s" : ""}
            {leadCount > 0 && ` • ${leadCount} mandataire${leadCount > 1 ? "s" : ""}`}
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="h-4 w-4 mr-1" />
          Ajouter
        </Button>
      </div>

      {/* Summary cards by role */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groupedByRole).map(([role, members]) => {
          const roleConfig = getRoleConfig(role);
          const lead = members.find(m => m.is_lead);
          
          return (
            <Card key={role} className={cn(
              "transition-all hover:border-primary/50",
              lead && "border-primary/30 bg-primary/5"
            )}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    {roleConfig.label}
                  </CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {members.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div 
                    key={member.id} 
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {member.crm_company?.name?.[0] || member.contact?.name?.[0] || "?"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {member.crm_company ? (
                          <span className="font-medium text-sm truncate">
                            {member.crm_company.name}
                          </span>
                        ) : member.contact ? (
                          <span className="font-medium text-sm truncate">
                            {member.contact.name}
                          </span>
                        ) : (
                          <span className="font-medium text-sm text-muted-foreground">
                            Non défini
                          </span>
                        )}
                        {member.is_lead && (
                          <Crown className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {member.contact && member.crm_company && (
                        <p className="text-xs text-muted-foreground truncate">
                          {member.contact.name}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        {(member.crm_company?.email || member.contact?.email) && (
                          <a 
                            href={`mailto:${member.contact?.email || member.crm_company?.email}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Mail className="h-3 w-3" />
                            Email
                          </a>
                        )}
                        {(member.crm_company?.phone || member.contact?.phone) && (
                          <a 
                            href={`tel:${member.contact?.phone || member.crm_company?.phone}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            <Phone className="h-3 w-3" />
                            Appeler
                          </a>
                        )}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(member)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleLead(member.id, member.is_lead)}>
                          <Crown className="h-4 w-4 mr-2" />
                          {member.is_lead ? "Retirer mandataire" : "Définir mandataire"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
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
                ))}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Notes section if any */}
      {moeTeam.some(m => m.notes) && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Notes de l'équipe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {moeTeam.filter(m => m.notes).map((member) => (
                <div key={member.id} className="text-sm">
                  <span className="font-medium">
                    {getRoleConfig(member.role).label}
                  </span>
                  {member.crm_company && (
                    <span className="text-muted-foreground"> ({member.crm_company.name})</span>
                  )}
                  <p className="text-muted-foreground mt-0.5 italic">{member.notes}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialogs */}
      <MemberFormDialog
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetForm(); }}
        onSubmit={handleAdd}
        title="Ajouter un membre MOE"
        submitLabel="Ajouter"
      />
      
      <MemberFormDialog
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingMember(null); resetForm(); }}
        onSubmit={handleUpdate}
        title="Modifier le membre MOE"
        submitLabel="Enregistrer"
      />
    </div>
  );
}
