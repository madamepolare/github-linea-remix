import { useState } from "react";
import {
  Users,
  Plus,
  Building2,
  Mail,
  Trash2,
  Send,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Euro,
  ArrowRight,
  Search,
  Filter,
  MoreHorizontal,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useTenderTeam } from "@/hooks/useTenderTeam";
import { useTenderPartnerCandidates, CANDIDATE_STATUS_LABELS, CANDIDATE_STATUS_COLORS, type PartnerCandidate } from "@/hooks/useTenderPartnerCandidates";
import { useTender } from "@/hooks/useTenders";
import { useCRMCompanies } from "@/hooks/useCRMCompanies";
import { useContacts } from "@/hooks/useContacts";
import { TEAM_ROLE_LABELS, SPECIALTIES, type TenderTeamRole } from "@/lib/tenderTypes";
import { BulkInvitationDialog } from "@/components/tenders/BulkInvitationDialog";
import { cn } from "@/lib/utils";

interface TenderEquipeTabProps {
  tenderId: string;
  requiredCompetencies?: string[];
}

export function TenderEquipeTab({ tenderId, requiredCompetencies = [] }: TenderEquipeTabProps) {
  // Team (confirmed members)
  const { teamMembers, teamByRole, isLoading: teamLoading, addTeamMember, removeTeamMember, sendInvitation } = useTenderTeam(tenderId);
  
  // Candidates (pipeline)
  const { 
    candidates, 
    candidatesBySpecialty, 
    stats, 
    isLoading: candidatesLoading,
    addCandidate,
    updateCandidate,
    removeCandidate,
    confirmToTeam,
    sendBulkInvitations,
  } = useTenderPartnerCandidates(tenderId);

  const { data: tender } = useTender(tenderId);
  const { companies } = useCRMCompanies();
  const { contacts } = useContacts();

  // UI State
  const [activeView, setActiveView] = useState<"pipeline" | "team">("pipeline");
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [showBulkInviteDialog, setShowBulkInviteDialog] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [companySearch, setCompanySearch] = useState("");
  const [newCandidate, setNewCandidate] = useState({
    specialty: "",
    role: "cotraitant" as TenderTeamRole,
    company_id: "",
    contact_id: "",
    fee_percentage: "",
  });

  // Missing specialties
  const defaultRequired = ['architecte', 'bet_structure', 'bet_fluides', 'thermicien'];
  const requiredSpecialties = requiredCompetencies.length > 0 ? requiredCompetencies : defaultRequired;
  const coveredByTeam = teamMembers.map(m => m.specialty).filter(Boolean);
  const coveredByCandidates = candidates.filter(c => c.status === 'confirmed').map(c => c.specialty);
  const allCovered = [...coveredByTeam, ...coveredByCandidates];
  const missingSpecialties = requiredSpecialties.filter(s => !allCovered.includes(s));

  // Filter companies by specialty
  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !companySearch || 
      c.name.toLowerCase().includes(companySearch.toLowerCase());
    const matchesSpecialty = !newCandidate.specialty || 
      c.bet_specialties?.includes(newCandidate.specialty);
    return matchesSearch && (matchesSpecialty || !newCandidate.specialty);
  });

  // Get contacts for selected company
  const companyContacts = contacts.filter(c => c.crm_company_id === newCandidate.company_id);

  const handleAddCandidate = () => {
    addCandidate.mutate({
      specialty: newCandidate.specialty,
      role: newCandidate.role,
      company_id: newCandidate.company_id || undefined,
      contact_id: newCandidate.contact_id || undefined,
      fee_percentage: newCandidate.fee_percentage ? parseFloat(newCandidate.fee_percentage) : undefined,
    });
    setShowAddCandidateDialog(false);
    resetNewCandidate();
  };

  const resetNewCandidate = () => {
    setNewCandidate({
      specialty: "",
      role: "cotraitant",
      company_id: "",
      contact_id: "",
      fee_percentage: "",
    });
    setCompanySearch("");
  };

  const openAddDialogWithSpecialty = (specialty: string) => {
    setNewCandidate(prev => ({ ...prev, specialty }));
    setShowAddCandidateDialog(true);
  };

  // Get candidates ready for bulk invitation
  const candidatesToInvite = candidates.filter(c => 
    c.status === 'suggested' && c.contact?.email
  );

  const isLoading = teamLoading || candidatesLoading;

  return (
    <div className="space-y-6">
      {/* Header with view toggle */}
      <div className="flex items-center justify-between">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "pipeline" | "team")}>
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Pipeline partenaires
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1">{stats.total}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Équipe confirmée
              {teamMembers.length > 0 && (
                <Badge variant="secondary" className="ml-1">{teamMembers.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeView === "pipeline" && candidatesToInvite.length > 0 && (
          <Button onClick={() => setShowBulkInviteDialog(true)}>
            <Send className="h-4 w-4 mr-2" />
            Inviter ({candidatesToInvite.length})
          </Button>
        )}
      </div>

      {/* Missing Specialties Warning */}
      {missingSpecialties.length > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Compétences manquantes détectées
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Ajoutez des partenaires avec ces spécialités pour constituer un groupement complet.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {missingSpecialties.map(s => (
                    <Button
                      key={s}
                      variant="outline"
                      size="sm"
                      className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/50"
                      onClick={() => openAddDialogWithSpecialty(s)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                    </Button>
                  ))}
                </div>
              </div>
              <Badge variant="outline" className="border-amber-400 text-amber-700 dark:text-amber-300">
                <Sparkles className="h-3 w-3 mr-1" />
                IA
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activeView === "pipeline" ? (
        <PipelineView
          candidates={candidates}
          candidatesBySpecialty={candidatesBySpecialty}
          stats={stats}
          onAddCandidate={() => setShowAddCandidateDialog(true)}
          onAddWithSpecialty={openAddDialogWithSpecialty}
          onUpdateCandidate={(id, updates) => updateCandidate.mutate({ id, ...updates })}
          onRemoveCandidate={(id) => removeCandidate.mutate(id)}
          onConfirmToTeam={(id) => confirmToTeam.mutate(id)}
          isLoading={isLoading}
        />
      ) : (
        <TeamView
          teamMembers={teamMembers}
          teamByRole={teamByRole}
          onRemoveMember={(id) => removeTeamMember.mutate(id)}
          isLoading={isLoading}
        />
      )}

      {/* Add Candidate Dialog */}
      <Dialog open={showAddCandidateDialog} onOpenChange={setShowAddCandidateDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un partenaire potentiel</DialogTitle>
            <DialogDescription>
              Sélectionnez une entreprise du CRM pour l'ajouter à votre pipeline de partenaires.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Spécialité *</Label>
                <Select
                  value={newCandidate.specialty}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, specialty: v, company_id: "", contact_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {SPECIALTIES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select
                  value={newCandidate.role}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, role: v as TenderTeamRole })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Entreprise (CRM)</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une entreprise..."
                  value={companySearch}
                  onChange={(e) => setCompanySearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <ScrollArea className="h-[200px] border rounded-md">
                <div className="p-2 space-y-1">
                  {filteredCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {newCandidate.specialty 
                        ? `Aucune entreprise avec la spécialité "${SPECIALTIES.find(s => s.value === newCandidate.specialty)?.label}"`
                        : "Aucune entreprise trouvée"}
                    </p>
                  ) : (
                    filteredCompanies.map((company) => (
                      <div
                        key={company.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                          newCandidate.company_id === company.id
                            ? "bg-primary/10 border border-primary"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setNewCandidate({ 
                            ...newCandidate, 
                            company_id: company.id,
                            contact_id: "",
                          });
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url || undefined} />
                          <AvatarFallback>{company.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{company.name}</p>
                          {company.bet_specialties && company.bet_specialties.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {company.bet_specialties.slice(0, 2).map((s) => (
                                <Badge key={s} variant="outline" className="text-[10px] px-1 py-0">
                                  {SPECIALTIES.find(sp => sp.value === s)?.label || s}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        {newCandidate.company_id === company.id && (
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>

            {newCandidate.company_id && companyContacts.length > 0 && (
              <div className="space-y-2">
                <Label>Contact</Label>
                <Select
                  value={newCandidate.contact_id}
                  onValueChange={(v) => setNewCandidate({ ...newCandidate, contact_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un contact" />
                  </SelectTrigger>
                  <SelectContent>
                    {companyContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.email ? `(${c.email})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Proposition d'honoraires (%)
              </Label>
              <Input
                type="number"
                placeholder="Ex: 12.5"
                value={newCandidate.fee_percentage}
                onChange={(e) => setNewCandidate({ ...newCandidate, fee_percentage: e.target.value })}
                step="0.5"
                min="0"
                max="100"
              />
              <p className="text-xs text-muted-foreground">
                Pourcentage des honoraires globaux proposé à ce partenaire
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddCandidateDialog(false);
              resetNewCandidate();
            }}>
              Annuler
            </Button>
            <Button 
              onClick={handleAddCandidate} 
              disabled={!newCandidate.specialty || addCandidate.isPending}
            >
              Ajouter au pipeline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Invitation Dialog */}
      {tender && (
        <BulkInvitationDialog
          open={showBulkInviteDialog}
          onOpenChange={setShowBulkInviteDialog}
          candidates={candidatesToInvite}
          tender={tender}
          onSend={async (data) => {
            await sendBulkInvitations.mutateAsync(data);
          }}
          isSending={sendBulkInvitations.isPending}
        />
      )}
    </div>
  );
}

// Pipeline View Component
function PipelineView({
  candidates,
  candidatesBySpecialty,
  stats,
  onAddCandidate,
  onAddWithSpecialty,
  onUpdateCandidate,
  onRemoveCandidate,
  onConfirmToTeam,
  isLoading,
}: {
  candidates: PartnerCandidate[];
  candidatesBySpecialty: Record<string, PartnerCandidate[]>;
  stats: { total: number; suggested: number; contacted: number; interested: number; confirmed: number; declined: number };
  onAddCandidate: () => void;
  onAddWithSpecialty: (specialty: string) => void;
  onUpdateCandidate: (id: string, updates: Partial<PartnerCandidate>) => void;
  onRemoveCandidate: (id: string) => void;
  onConfirmToTeam: (id: string) => void;
  isLoading: boolean;
}) {
  if (candidates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun partenaire dans le pipeline</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
            Commencez à constituer votre équipe en ajoutant des partenaires potentiels depuis votre CRM.
            Vous pourrez ensuite les contacter en masse avec une synthèse du marché.
          </p>
          <Button onClick={onAddCandidate}>
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un partenaire
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-5 gap-3">
        <StatCard label="Suggérés" value={stats.suggested} color="bg-muted" />
        <StatCard label="Contactés" value={stats.contacted} color="bg-blue-100 dark:bg-blue-900/30" />
        <StatCard label="Intéressés" value={stats.interested} color="bg-amber-100 dark:bg-amber-900/30" />
        <StatCard label="Confirmés" value={stats.confirmed} color="bg-green-100 dark:bg-green-900/30" />
        <StatCard label="Déclinés" value={stats.declined} color="bg-red-100 dark:bg-red-900/30" />
      </div>

      {/* By Specialty */}
      <div className="space-y-4">
        {Object.entries(candidatesBySpecialty).map(([specialty, specCandidates]) => (
          <Card key={specialty}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  {SPECIALTIES.find(s => s.value === specialty)?.label || specialty}
                  <Badge variant="secondary">{specCandidates.length}</Badge>
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => onAddWithSpecialty(specialty)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {specCandidates.map((candidate) => (
                <CandidateRow
                  key={candidate.id}
                  candidate={candidate}
                  onUpdateStatus={(status) => onUpdateCandidate(candidate.id, { status: status as any })}
                  onUpdateFees={(fee_percentage) => onUpdateCandidate(candidate.id, { fee_percentage })}
                  onRemove={() => onRemoveCandidate(candidate.id)}
                  onConfirmToTeam={() => onConfirmToTeam(candidate.id)}
                />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button variant="outline" className="w-full" onClick={onAddCandidate}>
        <Plus className="h-4 w-4 mr-2" />
        Ajouter un partenaire
      </Button>
    </div>
  );
}

// Stat Card
function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card className={cn("py-3 px-4", color)}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </Card>
  );
}

// Candidate Row
function CandidateRow({
  candidate,
  onUpdateStatus,
  onUpdateFees,
  onRemove,
  onConfirmToTeam,
}: {
  candidate: PartnerCandidate;
  onUpdateStatus: (status: string) => void;
  onUpdateFees: (fee: number) => void;
  onRemove: () => void;
  onConfirmToTeam: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border">
      <Avatar className="h-10 w-10">
        <AvatarImage src={candidate.company?.logo_url || undefined} />
        <AvatarFallback>
          {candidate.company?.name?.substring(0, 2) || candidate.contact?.name?.substring(0, 2) || '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {candidate.company?.name || candidate.contact?.name || 'Non défini'}
        </p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {candidate.contact?.email && (
            <span className="truncate">{candidate.contact.email}</span>
          )}
          {candidate.fee_percentage && (
            <Badge variant="outline" className="text-[10px]">
              <Euro className="h-3 w-3 mr-0.5" />
              {candidate.fee_percentage}%
            </Badge>
          )}
        </div>
      </div>

      <Select value={candidate.status} onValueChange={onUpdateStatus}>
        <SelectTrigger className={cn("w-[130px] h-8", CANDIDATE_STATUS_COLORS[candidate.status])}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="suggested">Suggéré</SelectItem>
          <SelectItem value="contacted">Contacté</SelectItem>
          <SelectItem value="interested">Intéressé</SelectItem>
          <SelectItem value="confirmed">Confirmé</SelectItem>
          <SelectItem value="declined">Décliné</SelectItem>
        </SelectContent>
      </Select>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {candidate.status === 'interested' && (
            <DropdownMenuItem onClick={onConfirmToTeam} className="text-green-600">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirmer dans l'équipe
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onRemove} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Retirer du pipeline
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Team View Component
function TeamView({
  teamMembers,
  teamByRole,
  onRemoveMember,
  isLoading,
}: {
  teamMembers: any[];
  teamByRole: Record<string, any[]>;
  onRemoveMember: (id: string) => void;
  isLoading: boolean;
}) {
  const roles: TenderTeamRole[] = ['mandataire', 'cotraitant', 'sous_traitant'];

  if (teamMembers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-medium mb-2">Aucun membre confirmé</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            Les partenaires confirmés depuis le pipeline apparaîtront ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {roles.map((role) => (
        <Card key={role}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
              <span>{TEAM_ROLE_LABELS[role]}</span>
              <Badge variant="secondary">{teamByRole[role]?.length || 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {teamByRole[role]?.map((member: any) => (
              <div 
                key={member.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.company?.logo_url || undefined} />
                  <AvatarFallback>
                    {member.company?.name?.[0] || member.contact?.name?.[0] || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {member.company?.name || member.contact?.name || 'Non défini'}
                  </p>
                  {member.specialty && (
                    <p className="text-xs text-muted-foreground">
                      {SPECIALTIES.find(s => s.value === member.specialty)?.label || member.specialty}
                    </p>
                  )}
                </div>
                <StatusBadge status={member.status} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive"
                  onClick={() => onRemoveMember(member.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
            {(!teamByRole[role] || teamByRole[role].length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                Aucun {TEAM_ROLE_LABELS[role].toLowerCase()}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: { icon: Clock, label: "En attente", className: "bg-muted text-muted-foreground" },
    accepted: { icon: UserCheck, label: "Confirmé", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
    declined: { icon: UserX, label: "Décliné", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  }[status] || { icon: Clock, label: status, className: "bg-muted" };

  const Icon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs", config.className)}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}
